const express = require('express');
const router = express.Router();
const { exportExpenses, exportMonthly, exportYearly, exportProfitability, exportVehicleExpense, downloadTemplate } = require('../controllers/export.controller');
const { pdfMonthly, pdfYearly, pdfProfitability } = require('../controllers/pdf.controller');
const { authenticate } = require('../middleware/auth.middleware');

router.use(authenticate);

// Excel exports
router.get('/template', downloadTemplate);
router.get('/expenses', exportExpenses);
router.get('/monthly', exportMonthly);
router.get('/yearly', exportYearly);
router.get('/vehicle-expense', exportVehicleExpense);
router.get('/profitability', exportProfitability);

// PDF exports
router.get('/pdf/monthly', pdfMonthly);
router.get('/pdf/yearly', pdfYearly);
router.get('/pdf/profitability', pdfProfitability);

module.exports = router;
