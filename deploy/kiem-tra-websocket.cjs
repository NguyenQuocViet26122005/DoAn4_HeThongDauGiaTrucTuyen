const origin = process.argv[2];
if (!/^https:\/\/[a-zA-Z0-9.-]+$/.test(origin || '')) {
  throw new Error('INVALID_ORIGIN');
}
const socket = new WebSocket(
  origin.replace(/^https:/, 'wss:') + '/socket.io/?EIO=4&transport=websocket',
);
const timeout = setTimeout(() => {
  console.error('WSS_CHECK_TIMEOUT');
  process.exit(1);
}, 12000);
let ready = false;
socket.addEventListener('message', ({ data }) => {
  if (typeof data !== 'string') {
    return;
  }
  if (data.startsWith('0')) {
    socket.send('40');
  } else if (data.startsWith('40')) {
    ready = true;
    clearTimeout(timeout);
    socket.close();
    console.log('WSS_READY');
  }
});
socket.addEventListener('error', () => {
  clearTimeout(timeout);
  console.error('WSS_CHECK_FAILED');
  process.exitCode = 1;
});
socket.addEventListener('close', () => {
  clearTimeout(timeout);
  if (!ready) {
    process.exitCode = 1;
  }
});
