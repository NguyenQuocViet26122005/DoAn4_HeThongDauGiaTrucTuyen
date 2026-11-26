const assert = require('node:assert/strict');
const { EventEmitter } = require('node:events');
const test = require('node:test');
const { giamSat } = require('../../deploy/quan-ly-phat-hanh.cjs');

function fixture() {
  let active = {
    id: 'legacy',
    sha: '',
    root: '/app',
  };
  let tick;
  let now = 10000;
  const children = [];
  const errors = [];
  const manager = giamSat('/app', {
    readRelease: () => {
      if (active instanceof Error) {
        throw active;
      }

      return active;
    },
    now: () => now,
    setInterval(callback) {
      tick = callback;

      return 1;
    },
    clearInterval() {},
    log: (code) => errors.push(code),
    spawn(command, args, options) {
      const child = new EventEmitter();

      child.signals = [];
      child.options = options;
      child.kill = (signal) => child.signals.push(signal);
      children.push(child);

      return child;
    },
  });

  return {
    manager,
    children,
    errors,
    change(value) {
      active = value;
    },
    tick() {
      now += 4000;
      tick();
    },
    close() {
      manager.stop();
      children.at(-1).emit('close');
    },
  };
}

test('Chuyển bản chạy đợi worker cũ đóng, giữ cấu hình chung và truyền SHA bản mới', () => {
  const f = fixture();
  const sha = 'a'.repeat(40);

  try {
    assert.equal(f.children.length, 1);
    f.change({
      id: sha + '-1-1',
      sha,
      root: '/app/.releases/new',
    });
    f.tick();
    assert.deepEqual(f.children[0].signals, ['SIGTERM']);
    assert.equal(f.children.length, 1);
    f.children[0].emit('close');
    f.tick();
    assert.equal(f.children.length, 2);
    assert.equal(f.children[1].options.env.RELEASE_SHA, sha);
    assert.equal(f.children[1].options.env.VIETBID_SHARED_ROOT, '/app');
    assert.equal(f.children[1].options.cwd, '/app/.releases/new');
  } finally {
    f.close();
  }
});

test('Manifest lỗi giữ worker hiện tại; rollback về bản legacy vẫn chuyển được', () => {
  const f = fixture();

  try {
    f.change(new Error('bad manifest'));
    f.tick();
    assert.deepEqual(f.children[0].signals, []);
    assert.deepEqual(f.errors, ['INVALID_RELEASE_POINTER']);
    f.change({
      id: 'new',
      sha: 'a'.repeat(40),
      root: '/app/.releases/new',
    });
    f.tick();
    f.children[0].emit('close');
    f.tick();
    f.change({
      id: 'legacy',
      sha: '',
      root: '/app',
    });
    f.tick();
    f.children[1].emit('close');
    f.tick();
    assert.equal(f.children[2].options.cwd, '/app');
    assert.equal(f.children[2].options.env.RELEASE_SHA, '');
  } finally {
    f.close();
  }
});

test('Worker lỗi liên tục được chặn vòng lặp; bản khác vẫn có thể khởi động', () => {
  const f = fixture();

  try {
    for (let i = 0; i < 3; i++) {
      f.children.at(-1).emit('close');
      f.tick();
    }
    assert.equal(f.children.length, 3);
    f.tick();
    assert.equal(f.children.length, 3);
    f.change({
      id: 'new',
      sha: 'a'.repeat(40),
      root: '/app/.releases/new',
    });
    f.tick();
    assert.equal(f.children.length, 4);
  } finally {
    f.close();
  }
});
