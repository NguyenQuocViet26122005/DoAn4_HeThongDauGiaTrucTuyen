const { AppError } = require('../utils/errors');
function rateLimit({ limit, windowMs }) {
  const buckets = new Map();
  const cleanup = setInterval(() => { for (const [key, value] of buckets) if (value.reset <= Date.now()) buckets.delete(key); }, windowMs);
  cleanup.unref();
  return (req, res, next) => {
    const key = req.user?.id || req.ip;
    const time = Date.now();
    let entry = buckets.get(key);
    if (!entry || entry.reset <= time) { entry = { count: 0, reset: time + windowMs }; buckets.set(key, entry); }
    if (++entry.count > limit) { res.set('Retry-After', String(Math.ceil((entry.reset - time) / 1000))); return next(new AppError(429, 'Quá nhiều yêu cầu, vui lòng thử lại sau')); }
    next();
  };
}
module.exports = rateLimit;
