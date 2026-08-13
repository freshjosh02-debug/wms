const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ success: false, message: 'No token provided' });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'wms_secret_key_change_in_production');
    const user = await User.findById(decoded.id).select('-password');
    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, message: 'User not found or inactive' });
    }
    req.user = user;
    next();
  } catch (err) {
    res.status(401).json({ success: false, message: 'Invalid token' });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: `Role '${req.user.role}' not authorized` });
    }
    next();
  };
};

const hasPermission = (permission) => {
  return (req, res, next) => {
    if (!req.user.permissions.includes(permission)) {
      return res.status(403).json({ success: false, message: 'Insufficient permissions' });
    }
    next();
  };
};

const auditLog = (action, entity) => {
  return async (req, res, next) => {
    const { AuditLog } = require('../models/index');
    res.on('finish', async () => {
      if (res.statusCode < 400) {
        try {
          await AuditLog.create({
            action,
            entity,
            entityId: req.params.id || res.locals.entityId,
            user: req.user?._id,
            changes: req.body,
            ipAddress: req.ip,
            userAgent: req.headers['user-agent']
          });
        } catch (e) { /* silent */ }
      }
    });
    next();
  };
};

module.exports = { auth, authorize, hasPermission, auditLog };
