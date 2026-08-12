const { body, validationResult } = require('express-validator');

const VALID_EXPENSE_TYPES = ['WASHING', 'FUEL', 'VEHICLE_SERVICE', 'OFFICE'];
const VALID_WASHING_SERVICE = ['BODY_WASH','INTERIOR_CLEANING','EXTERIOR_CLEANING','VACUUM_CLEANING','POLISHING','WAXING','FULL_CLEANING','DETAILING','OTHER'];
const VALID_SERVICE_EXPENSE = ['RENT_SHARE','SERVICE','PURCHASE','TOLL_GATE','EMI','PAINT','TOWING_CHARGE','PUC','INSURANCE','GPS','OTHER'];
const VALID_PAYMENT_METHODS = ['SBI', 'CASH', 'UPI', 'NA'];
const VALID_PAYMENT_STATUSES = ['PAID', 'UNPAID'];

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

const expenseTypeRules = [
  body('expenseType')
    .notEmpty().withMessage('Expense type is required.')
    .isIn(VALID_EXPENSE_TYPES).withMessage('Invalid expense type.'),
  body('date')
    .notEmpty().withMessage('Date is required.')
    .isISO8601().withMessage('Invalid date format.'),
  body('amount')
    .notEmpty().withMessage('Amount is required.')
    .isFloat({ gt: 0 }).withMessage('Amount must be greater than 0.'),
  body('paymentMethod')
    .notEmpty().withMessage('Payment method is required.')
    .isIn(VALID_PAYMENT_METHODS).withMessage('Invalid payment method. Use: SBI, CASH, UPI, NA'),
  body('paymentStatus')
    .notEmpty().withMessage('Payment status is required.')
    .isIn(VALID_PAYMENT_STATUSES).withMessage('Invalid payment status. Use: PAID, UNPAID'),
  body('serviceType')
    .optional({ nullable: true })
    .isIn([...VALID_WASHING_SERVICE, null, '']).withMessage('Invalid washing service type.'),
  body('serviceExpenseType')
    .optional({ nullable: true })
    .isIn([...VALID_SERVICE_EXPENSE, null, '']).withMessage('Invalid service expense type.'),
  body('note')
    .optional({ nullable: true })
    .isLength({ max: 500 }).withMessage('Note must be under 500 characters.'),
  body('expenseDescription')
    .optional({ nullable: true })
    .isLength({ max: 300 }).withMessage('Expense description must be under 300 characters.'),
];

const validateCreateExpense = [
  ...expenseTypeRules,
  // Custom type-specific validations
  body().custom((_, { req }) => {
    const { expenseType, vehicleId, serviceType, serviceExpenseType, expenseDescription } = req.body;

    if (expenseType !== 'OFFICE' && !vehicleId) {
      throw new Error('Vehicle is required for this expense type.');
    }

    if (expenseType === 'WASHING' && !serviceType) {
      throw new Error('Service type is required for Washing expenses.');
    }

    if (expenseType === 'VEHICLE_SERVICE' && !serviceExpenseType) {
      throw new Error('Service expense type is required for Vehicle Service expenses.');
    }

    if (expenseType === 'OFFICE' && !expenseDescription) {
      throw new Error('Expense description is required for Office expenses.');
    }

    return true;
  }),
  handleValidationErrors,
];

const validateUpdateExpense = [
  body('expenseType')
    .optional()
    .isIn(VALID_EXPENSE_TYPES).withMessage('Invalid expense type.'),
  body('date')
    .optional()
    .isISO8601().withMessage('Invalid date format.'),
  body('amount')
    .optional()
    .isFloat({ gt: 0 }).withMessage('Amount must be greater than 0.'),
  body('paymentMethod')
    .optional()
    .isIn(VALID_PAYMENT_METHODS).withMessage('Invalid payment method.'),
  body('paymentStatus')
    .optional()
    .isIn(VALID_PAYMENT_STATUSES).withMessage('Invalid payment status.'),
  body('serviceType')
    .optional({ nullable: true })
    .isIn([...VALID_WASHING_SERVICE, null, '']).withMessage('Invalid washing service type.'),
  body('serviceExpenseType')
    .optional({ nullable: true })
    .isIn([...VALID_SERVICE_EXPENSE, null, '']).withMessage('Invalid service expense type.'),
  body('note')
    .optional({ nullable: true })
    .isLength({ max: 500 }).withMessage('Note must be under 500 characters.'),
  handleValidationErrors,
];

module.exports = { validateCreateExpense, validateUpdateExpense };
