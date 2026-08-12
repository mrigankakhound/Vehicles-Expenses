const express = require('express');
const router = express.Router();
const { getVehicles, getActiveVehicles, createVehicle, getVehicle, updateVehicle, updateVehicleStatus } = require('../controllers/vehicle.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { validateCreateVehicle, validateUpdateVehicle } = require('../validators/vehicle.validator');

router.use(authenticate);

router.get('/', getVehicles);
router.get('/active', getActiveVehicles);
router.post('/', validateCreateVehicle, createVehicle);
router.get('/:id', getVehicle);
router.put('/:id', validateUpdateVehicle, updateVehicle);
router.patch('/:id/status', updateVehicleStatus);

module.exports = router;
