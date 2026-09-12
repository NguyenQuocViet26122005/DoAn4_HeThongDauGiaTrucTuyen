const { AsyncLocalStorage } = require('node:async_hooks');
const pool = require('../config/database');
const { config } = require('../config/env');
const { AppError } = require('../utils/errors');
const context = new AsyncLocalStorage();
async function connection() {
  const conn = await pool.getConnection();
  try { await conn.query('SET time_zone = ?', [config.dbTimezone]); return conn; }
  catch (error) { conn.release(); throw error; }
}
async function query(sql, values = []) {
  const current = context.getStore();
  const conn = current?.connection || await connection();
  try { const [rows] = await conn.execute(sql, values); return rows; }
  finally { if (!current) conn.release(); }
}
async function one(sql, values = []) { return (await query(sql, values))[0] || null; }
async function now() { return (await one('SELECT CURRENT_TIMESTAMP(3) AS now')).now; }
async function transaction(work) {
  if (context.getStore()) return work();
  // A retry repeats the complete transaction, never a single bid write.
  for (let attempt = 0; attempt < 3; attempt++) {
    const conn = await connection();
    const state = { connection: conn, events: [] };
    try {
      await conn.query('SET TRANSACTION ISOLATION LEVEL READ COMMITTED');
      await conn.beginTransaction();
      const result = await context.run(state, work);
      await conn.commit();
      for (const event of state.events) {
        try { await event(); } catch { console.error('Không gửi được sự kiện realtime sau commit'); }
      }
      return result;
    } catch (error) {
      await conn.rollback();
      if (['ER_LOCK_DEADLOCK', 'ER_LOCK_WAIT_TIMEOUT'].includes(error.code)) {
        if (attempt < 2) continue;
        throw new AppError(409, 'Dữ liệu đang được xử lý, vui lòng thử lại');
      }
      throw error;
    } finally { conn.release(); }
  }
}
function afterCommit(work) {
  const state = context.getStore();
  if (state) state.events.push(work);
  else return work();
}
module.exports = { query, one, now, transaction, afterCommit, pool };
