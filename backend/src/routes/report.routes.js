const express = require('express');
const router = express.Router();
const { getMonthlyReport, getYearlyReport, getVehicleExpenseReport, getProfitabilityReport } = require('../controllers/report.controller');
const { authenticate } = require('../middleware/auth.middleware');

router.use(authenticate);

router.get('/monthly', getMonthlyReport);
router.get('/yearly', getYearlyReport);
router.get('/vehicle-expense', getVehicleExpenseReport);
router.get('/profitability', getProfitabilityReport);

module.exports = router;
