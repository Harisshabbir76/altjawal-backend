const jwt = require('jsonwebtoken');

module.exports = function requireAdmin(req, res, next) {
  const token = req.cookies?.admin_token;
  if (!token) return res.status(401).json({ message: 'Unauthorized.' });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if (!payload.admin) return res.status(401).json({ message: 'Unauthorized.' });
    next();
  } catch {
    return res.status(401).json({ message: 'Unauthorized.' });
  }
};
