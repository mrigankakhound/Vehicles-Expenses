const express = require('express');
const router = express.Router();
const { getParties, getActiveParties, createParty, getParty, updateParty, updatePartyStatus } = require('../controllers/party.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { validateCreateParty, validateUpdateParty } = require('../validators/party.validator');

router.use(authenticate);

router.get('/', getParties);
router.get('/active', getActiveParties);
router.post('/', validateCreateParty, createParty);
router.get('/:id', getParty);
router.put('/:id', validateUpdateParty, updateParty);
router.patch('/:id/status', updatePartyStatus);

module.exports = router;
