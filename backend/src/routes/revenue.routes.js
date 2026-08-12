const express = require('express');
const router = express.Router();
const { getRevenues, createRevenue, getRevenue, updateRevenue, deleteRevenue } = require('../controllers/revenue.controller');
const { authenticate } = require('../middleware/auth.middleware');

router.use(authenticate);

router.get('/', getRevenues);
router.post('/', createRevenue);
router.get('/:id', getRevenue);
router.put('/:id', updateRevenue);
router.delete('/:id', deleteRevenue);

module.exports = router;
