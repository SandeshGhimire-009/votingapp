const User = require('../models/User');
const { isMongoConnected } = require('../utils/db');

const attachUser = async (req, res, next) => {
  const userId = req.headers['x-user-id'];
  if (!userId) {
    return next();
  }

  const numericUserId = Number(userId);
  if (!Number.isFinite(numericUserId)) {
    req.user = null;
    return next();
  }

  try {
    if (!isMongoConnected()) {
      req.user = null;
      return next();
    }

    const user = await User.findOne({ id: numericUserId }).lean();
    req.user = user || null;
    return next();
  } catch (err) {
    return next(err);
  }
};

const requireAdmin = (req, res, next) => {
  if (!req.user || !req.user.isAdmin) {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
};

module.exports = { attachUser, requireAdmin };
