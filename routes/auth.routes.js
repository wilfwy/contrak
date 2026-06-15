const express = require('express');
const router = express.Router();
const { validateRegister, validateLogin } = require('../middlewares/validation.middleware');
const { authenticateFirebase, loadUserInfo } = require('../middlewares/auth.middleware');
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

module.exports = router;