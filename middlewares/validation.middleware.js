const { body, validationResult } = require('express-validator');

/**
 * Middleware pour valider les erreurs de validation
 */
function handleValidationErrors(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
}

const validateRegister = [
  body('email').isEmail().normalizeEmail(),
  handleValidationErrors
];

const validateLogin = [
  body('idToken').notEmpty().withMessage('ID token is required'),
  handleValidationErrors
];

/**
 * Règles de validation pour la création de contrat
 */
const validateContract = [
  body('type').notEmpty().withMessage('Le type de contrat est requis'),
  body('prestataire.nom').notEmpty().withMessage('Le nom du prestataire est requis'),
  body('prestataire.email').isEmail().withMessage('Email prestataire invalide'),
  body('client.nom').notEmpty().withMessage('Le nom du client est requis'),
  body('client.email').isEmail().withMessage('Email client invalide'),
  body('mission').notEmpty().withMessage('La description de la mission est requise'),
  body('price').isFloat({ min: 0 }).withMessage('Le prix doit être un nombre positif'),
  handleValidationErrors
];

module.exports = {
  validateRegister,
  validateLogin,
  validateContract
};
