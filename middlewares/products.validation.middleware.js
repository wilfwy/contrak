const { body, validationResult } = require('express-validator');

function handleValidationErrors(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const msg = errors.array().map(e => e.msg).join('; ');
    return res.status(400).json({ error: msg });
  }
  next();
}

const validateProductCreate = [
  body('title').isString().notEmpty().withMessage('title is required'),
  body('slug').isString().notEmpty().withMessage('slug is required'),
  body('description').optional().isString(),
  body('status').optional().isString(),
  body('coverMediaId').optional().isString(),
  body('theme').optional().isObject(),
  body('ebookId').optional().isString(),
  body('landingPageSlug').optional().isString(),
  handleValidationErrors
];

const validateProductVersionCreate = [
  body('versionLabel').optional().isString(),
  body('status').optional().isString(),
  body('price').optional().isFloat({ min: 0 }),
  body('currency').optional().isString(),
  body('ebookPayload').optional().isObject(),
  body('marketingCopy').optional().isString(),
  handleValidationErrors
];

module.exports = {
  validateProductCreate,
  validateProductVersionCreate
};

