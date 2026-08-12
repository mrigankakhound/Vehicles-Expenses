const express = require('express');
const router = express.Router();
const { importExpenses } = require('../controllers/import.controller');
const { authenticate } = require('../middleware/auth.middleware');

router.use(authenticate);

router.post('/expenses', importExpenses);

module.exports = router;
