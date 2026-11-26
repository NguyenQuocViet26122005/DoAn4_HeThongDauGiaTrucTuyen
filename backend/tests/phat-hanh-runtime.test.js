const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const net = require('node:net');
const { spawn } = require('node:child_process');
const test = require('node:test');

test(
  'Tiến trình thật đổi bản và rollback qua manifest, không khởi động lại worker khi manifest hỏng',
  { timeout: 25000 },
  async () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'vietbid-release-test-'));
    const deploy = path.join(__dirname, '../../deploy');
    const privateDir = path.join(root, 'backend/.local');

    fs.mkdirSync(privateDir, { recursive: true });

    const config = Object.fromEntries(
      [
        'NODE_ENV',
        'DB_HOST',
        'DB_PORT',
        'DB_NAME',
        'DB_USER',
        'DB_PASSWORD',
        'DB_TIMEZONE',
        'FRONTEND_URL',
        'JWT_SECRET',
        'WEB_DIST',
        'UPLOAD_ROOT',
        'JOBS_ENABLED',
        'AI_ENABLED',
        'TRUST_PROXY_HOPS',
      ].map((key) => [key, 'fixture']),
    );

    fs.writeFileSync(path.join(privateDir, 'alwaysdata.json'), JSON.stringify(config), {
      mode: 0o600,
    });

    const worker = `const http=require('node:http');exports.khoiDongMayChu=async function(host){
    const s=http.createServer((q,r)=>{r.setHeader('Content-Type','application/json');
    r.end(JSON.stringify({revision:process.env.RELEASE_SHA||'legacy',pid:process.pid}));});
    s.listen(Number(process.env.PORT),host);process.once('SIGTERM',()=>s.close());
    console.log('FIXTURE_PID:'+process.pid);
  };`;
    const makeRelease = (directory) => {
      fs.mkdirSync(path.join(directory, 'backend/dist'), { recursive: true });
      fs.mkdirSync(path.join(directory, 'deploy'), { recursive: true });
      fs.writeFileSync(path.join(directory, 'backend/dist/may-chu.js'), worker);
      for (const name of ['chay-alwaysdata.cjs', 'quan-ly-phat-hanh.cjs']) {
        fs.copyFileSync(path.join(deploy, name), path.join(directory, 'deploy', name));
      }
    };

    makeRelease(root);

    const sha = 'a'.repeat(40);
    const id = sha + '-1-1';

    makeRelease(path.join(root, '.releases', id));

    const reservation = net.createServer();

    await new Promise((resolve) => reservation.listen(0, '127.0.0.1', resolve));

    const port = reservation.address().port;

    await new Promise((resolve) => reservation.close(resolve));

    const pids = new Set();
    const parent = spawn(process.execPath, [path.join(root, 'deploy/chay-alwaysdata.cjs')], {
      cwd: root,
      env: {
        ...process.env,
        IP: '127.0.0.1',
        PORT: String(port),
        VIETBID_SHARED_ROOT: root,
        VIETBID_RELEASE_ROOT: '',
      },
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    parent.stdout.on('data', (chunk) => {
      for (const match of chunk.toString().matchAll(/FIXTURE_PID:(\d+)/g)) {
        pids.add(Number(match[1]));
      }
    });
    parent.stderr.resume();

    const read = async () =>
      (await fetch(`http://127.0.0.1:${port}`, { signal: AbortSignal.timeout(500) })).json();
    const waitFor = async (revision) => {
      for (let i = 0; i < 60; i++) {
        const data = await read().catch(() => null);

        if (data?.revision === revision) {
          return data;
        }
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
      throw new Error('Fixture did not become ready');
    };
    const pointer = path.join(privateDir, 'current-release.json');

    try {
      const first = await waitFor('legacy');

      fs.writeFileSync(pointer, '{broken');
      await new Promise((resolve) => setTimeout(resolve, 1200));
      assert.equal((await read()).pid, first.pid);
      fs.writeFileSync(pointer, JSON.stringify({ release: id, sha }));

      const second = await waitFor(sha);

      assert.notEqual(first.pid, second.pid);
      fs.unlinkSync(pointer);

      const third = await waitFor('legacy');

      assert.notEqual(third.pid, second.pid);
    } finally {
      parent.kill();
      await new Promise((resolve) => parent.once('close', resolve));
      for (const pid of pids) {
        try {
          process.kill(pid);
        } catch {}
      }

      const expected = path.join(os.tmpdir(), 'vietbid-release-test-');

      assert(path.resolve(root).startsWith(path.resolve(expected)));
      fs.rmSync(root, { recursive: true, force: true });
    }
  },
);
