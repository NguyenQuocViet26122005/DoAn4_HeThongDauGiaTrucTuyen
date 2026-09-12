const { assertPublic } = require('../utils/public-data');
function handler(work, { status = 200, message = 'Thành công' } = {}) {
  return async (req, res, next) => {
    try {
      const data = await work(req);
      assertPublic(data);
      res.status(status).json({ success: true, message, data: data ?? null });
    } catch (error) { next(error); }
  };
}
module.exports = handler;
