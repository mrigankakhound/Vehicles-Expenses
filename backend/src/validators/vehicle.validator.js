const { body, validationResult } = require('express-validator');

const VALID_CATEGORIES = ['TWO_WHEELER', 'FOUR_WHEELER'];
const VALID_SUB_CATEGORIES = ['HATCHBACK','SEDAN','SUV','COMPACT_SUV','MOTORCYCLE_ABOVE_200CC','SCOOTY_ABOVE_125CC','MOTORCYCLE_BELOW_200CC','MUV','SCOOTY_BELOW_110CC'];
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

const validateCreateVehicle = [
  body('vehicleNumber')
    .notEmpty().withMessage('Vehicle number is required.')
    .isLength({ min: 2, max: 20 }).withMessage('Vehicle number must be 2–20 characters.'),
  body('vehicleCategory')
    .notEmpty().withMessage('Vehicle category is required.')
    .isIn(VALID_CATEGORIES).withMessage('Invalid vehicle category.'),
  body('subCategory')
    .notEmpty().withMessage('Sub category is required.')
    .isIn(VALID_SUB_CATEGORIES).withMessage('Invalid sub category.'),
  body('modelName')
    .notEmpty().withMessage('Model name is required.')
    .isLength({ min: 1, max: 100 }).withMessage('Model name must be 1–100 characters.'),
  body('status')
    .optional()
    .isIn(VALID_STATUSES).withMessage('Status must be ACTIVE or INACTIVE.'),
  handleValidationErrors,
];

const validateUpdateVehicle = [
  body('vehicleNumber')
    .optional()
    .isLength({ min: 2, max: 20 }).withMessage('Vehicle number must be 2–20 characters.'),
  body('vehicleCategory')
    .optional()
    .isIn(VALID_CATEGORIES).withMessage('Invalid vehicle category.'),
  body('subCategory')
    .optional()
    .isIn(VALID_SUB_CATEGORIES).withMessage('Invalid sub category.'),
  body('modelName')
    .optional()
    .isLength({ min: 1, max: 100 }).withMessage('Model name must be 1–100 characters.'),
  body('status')
    .optional()
    .isIn(VALID_STATUSES).withMessage('Status must be ACTIVE or INACTIVE.'),
  handleValidationErrors,
];

module.exports = { validateCreateVehicle, validateUpdateVehicle };
