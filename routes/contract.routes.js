const express = require('express');
const router = express.Router();
const { authenticateFirebase, loadUserInfo, requireProPlan } = require('../middlewares/auth.middleware');
const { validateContract } = require('../middlewares/validation.middleware');
const contractController = require('../controllers/contract.controller');

// Toutes les routes nécessitent une authentification
router.use(authenticateFirebase);
router.use(loadUserInfo);

// Lister tous les contrats de l'utilisateur
router.get('/', contractController.listContracts);

// Créer un nouveau contrat
router.post('/', validateContract, contractController.createContract);

// Récupérer un contrat spécifique
router.get('/:id', contractController.getContract);

// Générer le PDF d'un contrat
router.get('/:id/pdf', contractController.generatePDF);

// Prévisualiser un contrat (HTML)
router.get('/:id/preview', contractController.previewContract);

module.exports = router;