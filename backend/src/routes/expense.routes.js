const express = require('express');
const router = express.Router();
const { getExpenses, createExpense, getExpense, updateExpense, deleteExpense } = require('../controllers/expense.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { validateCreateExpense, validateUpdateExpense } = require('../validators/expense.validator');

router.use(authenticate);

router.get('/', getExpenses);
router.post('/', validateCreateExpense, createExpense);
router.get('/:id', getExpense);
router.put('/:id', validateUpdateExpense, updateExpense);
router.delete('/:id', deleteExpense);

module.exports = router;
