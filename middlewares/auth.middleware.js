const { verifyIdToken } = require('../services/firebase.service');

/**
 * Middleware d'authentification Firebase
 */
async function authenticateFirebase(req, res, next) {
  try {
    // Récupérer le token depuis les cookies ou headers
    const idToken = req.cookies.idToken || req.headers.authorization?.replace('Bearer ', '');
    
    if (!idToken) {
      return res.status(401).json({ error: 'Missing token' });
    }

    // Vérifier le token
    const decodedToken = await verifyIdToken(idToken);
    req.user = decodedToken;
    req.userId = decodedToken.uid;
    
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

/**
 * Middleware pour vérifier le plan PRO
 */
function requireProPlan(req, res, next) {
  if (req.userPlan !== 'pro') {
    return res.status(403).json({ 
      error: 'Fonctionnalité réservée au plan PRO. Passez au PRO pour accéder à cette fonctionnalité.',
      upgradeRequired: true,
      currentPlan: req.userPlan 
    });
  }
  next();
}

/**
 * Middleware pour charger les infos utilisateur depuis Firestore
 */
async function loadUserInfo(req, res, next) {
  try {
    const { getUser, createUser } = require('../services/firebase.service');
    let user = await getUser(req.userId);
    
    if (!user) {
      // Auto-provisionner l'utilisateur si absent
      const userDoc = await createUser(req.userId, req.user.email, 'basic');
      user = { id: userDoc.id, ...userDoc.data() };
    }
    
    req.userInfo = user;
    req.userPlan = user.plan || 'basic';
    req.userRole = user.role || 'user';
    
    next();
  } catch (error) {
    console.error('User load error:', error);
    res.status(500).json({ error: 'Server error' });
  }
}

function requireSuperAdmin(req, res, next) {
  if (req.userRole !== 'super_admin') {
    return res.status(403).json({ error: 'Access denied. Super admin only.' });
  }
  next();
}

module.exports = {
  authenticateFirebase,
  requireProPlan,
  loadUserInfo,
  requireSuperAdmin
};
