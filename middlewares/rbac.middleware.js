const requireRole = (roles = []) => {
  return (req, res, next) => {
    const role = req.userInfo?.role || 'owner';
    const allowed = Array.isArray(roles) ? roles : [roles];
    if (!allowed.includes(role)) {
      return res.status(403).json({
        error: 'Forbidden: insufficient role',
        currentRole: role
      });
    }
    next();
  };
};

const requireOwner = (projectField = 'ownerId') => {
  return (req, res, next) => {
    const ownerId = req.userInfo?._get?.(projectField) || req.userInfo?.[projectField];
    // MVP: fallback to uid check on resources provided by controllers.
    if (req.resource && req.resource[projectField] && req.userId && req.resource[projectField] !== req.userId) {
      return res.status(403).json({ error: 'Forbidden: not owner' });
    }
    if (ownerId && req.resource && req.resource[projectField] && ownerId !== req.resource[projectField]) {
      return res.status(403).json({ error: 'Forbidden: not owner' });
    }
    next();
  };
};

const requirePlan = (plans = []) => {
  return (req, res, next) => {
    const userPlan = req.userPlan || req.userInfo?.plan || 'basic';
    const allowed = Array.isArray(plans) ? plans : [plans];
    if (!allowed.includes(userPlan)) {
      return res.status(403).json({
        error: 'Feature reserved for selected plans',
        upgradeRequired: true,
        currentPlan: userPlan
      });
    }
    next();
  };
};

module.exports = {
  requireRole,
  requireOwner,
  requirePlan
};

