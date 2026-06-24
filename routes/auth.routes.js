const express = require('express');
const router = express.Router();
const { validateRegister, validateLogin } = require('../middlewares/validation.middleware');
const { authenticateFirebase, loadUserInfo, requireSuperAdmin } = require('../middlewares/auth.middleware');
const authController = require('../controllers/auth.controller');

// Inscription
router.post('/register', validateRegister, authController.register);

// Connexion
router.post('/login', validateLogin, authController.login);

// Déconnexion
router.post('/logout', authenticateFirebase, authController.logout);

// Vérifier le token
router.get('/verify', authenticateFirebase, loadUserInfo, authController.verify);

// Obtenir les infos utilisateur
router.get('/me', authenticateFirebase, loadUserInfo, authController.getMe);

// Password reset
router.post('/forgot-password', authController.forgotPassword);

// Super admin
router.post('/make-super', authenticateFirebase, loadUserInfo, requireSuperAdmin, authController.makeSuper);
router.get('/is-super', authenticateFirebase, loadUserInfo, authController.isSuper);

module.exports = router;