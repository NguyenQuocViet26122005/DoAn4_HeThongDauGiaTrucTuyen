const records = require('../repositories/records');
const db = require('../repositories/db');
const events = require('../sockets/events');
const { assertPublic } = require('../utils/public-data');
async function audit(actorId, action, entity, entityId, data = null) {
  assertPublic(data);
  return records.insert('nhat_ky_hoat_dong', { nguoi_thuc_hien_id: actorId || null, hanh_dong: action, loai_doi_tuong: entity, doi_tuong_id: entityId || null, du_lieu_moi: data == null ? null : JSON.stringify(data) });
}
async function notify(userId, type, title, content, link = null) {
  const data = { nguoi_dung_id: userId, loai: type, tieu_de: title, noi_dung: content, duong_dan_lien_ket: link };
  const id = await records.insert('thong_bao', data);
  events.publish(`user:${userId}`, 'notification:new', { id, ...data, da_doc: 0 });
  return id;
}
async function notifyOnce(userId, type, title, content, link) {
  if (await db.one('SELECT id FROM thong_bao WHERE nguoi_dung_id = ? AND loai = ? AND duong_dan_lien_ket = ? LIMIT 1', [userId, type, link])) return;
  return notify(userId, type, title, content, link);
}
module.exports = { audit, notify, notifyOnce };
