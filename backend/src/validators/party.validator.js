const { body, validationResult } = require('express-validator');

const VALID_PARTY_TYPES = ['FUEL_STATION','WASHING_CENTER','SERVICE_CENTER','SUPPLIER','OFFICE_VENDOR','OTHER'];
const VALID_STATUSES = ['ACTIVE', 'INACTIVE'];

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      success: false,
      message: errors.array()[0].msg,
      errors: errors.array(),
    });
  }
  next();
};

const validateCreateParty = [
  body('name')
    .notEmpty().withMessage('Party name is required.')
    .isLength({ min: 1, max: 150 }).withMessage('Party name must be 1–150 characters.'),
  body('type')
    .notEmpty().withMessage('Party type is required.')
    .isIn(VALID_PARTY_TYPES).withMessage('Invalid party type.'),
  body('status')
    .optional()
    .isIn(VALID_STATUSES).withMessage('Status must be ACTIVE or INACTIVE.'),
  handleValidationErrors,
];

const validateUpdateParty = [
  body('name')
    .optional()
    .isLength({ min: 1, max: 150 }).withMessage('Party name must be 1–150 characters.'),
  body('type')
    .optional()
    .isIn(VALID_PARTY_TYPES).withMessage('Invalid party type.'),
  body('status')
    .optional()
    .isIn(VALID_STATUSES).withMessage('Status must be ACTIVE or INACTIVE.'),
  handleValidationErrors,
];

module.exports = { validateCreateParty, validateUpdateParty };
