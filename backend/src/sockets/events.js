const db = require('../repositories/db');
const { assertPublic, publicAuction } = require('../utils/public-data');
let io;
function attach(server) { io = server; }
function publish(room, name, data) { assertPublic(data); return db.afterCommit(() => io?.to(room).emit(name, data)); }
function auction(row, event = 'auction:bid-updated') { return publish(`auction:${row.id}`, event, publicAuction(row)); }
module.exports = { attach, publish, auction };
