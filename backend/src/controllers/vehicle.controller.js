const prisma = require('../config/prisma');

/**
 * GET /api/vehicles
 */
const getVehicles = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      search = '',
      status,
      vehicleCategory,
      subCategory,
    } = req.query;

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    const vehicleWhere = {};

    if (search) {
      vehicleWhere.OR = [
        { vehicleNumber: { contains: search, mode: 'insensitive' } },
        { modelName: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (status) vehicleWhere.status = status;
    if (vehicleCategory) vehicleWhere.vehicleCategory = vehicleCategory;
    if (subCategory) vehicleWhere.subCategory = subCategory;

    const [vehicles, total] = await Promise.all([
      prisma.vehicle.findMany({
        where: vehicleWhere,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum,
      }),
      prisma.vehicle.count({ where: vehicleWhere }),
    ]);

    res.json({
      success: true,
      data: {
        vehicles,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(total / limitNum),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/vehicles/active  — for dropdowns (only active)
 */
const getActiveVehicles = async (req, res, next) => {
  try {
    const vehicles = await prisma.vehicle.findMany({
      where: { status: 'ACTIVE' },
      orderBy: { vehicleNumber: 'asc' },
      select: {
        id: true,
        vehicleNumber: true,
        vehicleCategory: true,
        subCategory: true,
        modelName: true,
        status: true,
      },
    });

    res.json({ success: true, data: { vehicles } });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/vehicles
 */
const createVehicle = async (req, res, next) => {
  try {
    const { vehicleNumber, vehicleCategory, subCategory, modelName, status } = req.body;

    const vehicle = await prisma.vehicle.create({
      data: {
        vehicleNumber: vehicleNumber.trim().toUpperCase(),
        vehicleCategory,
        subCategory,
        modelName: modelName.trim(),
        status: status || 'ACTIVE',
      },
    });

    res.status(201).json({
      success: true,
      message: 'Vehicle created successfully.',
      data: { vehicle },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/vehicles/:id
 */
const getVehicle = async (req, res, next) => {
  try {
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: req.params.id },
      include: {
        _count: { select: { expenses: { where: { isDeleted: false } } } },
      },
    });

    if (!vehicle) {
      return res.status(404).json({ success: false, message: 'Vehicle not found.' });
    }

    res.json({ success: true, data: { vehicle } });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/vehicles/:id
 */
const updateVehicle = async (req, res, next) => {
  try {
    const { vehicleNumber, vehicleCategory, subCategory, modelName, status } = req.body;

    const existing = await prisma.vehicle.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Vehicle not found.' });
    }

    const vehicle = await prisma.vehicle.update({
      where: { id: req.params.id },
      data: {
        vehicleNumber: vehicleNumber ? vehicleNumber.trim().toUpperCase() : existing.vehicleNumber,
        vehicleCategory: vehicleCategory || existing.vehicleCategory,
        subCategory: subCategory || existing.subCategory,
        modelName: modelName ? modelName.trim() : existing.modelName,
        status: status || existing.status,
      },
    });

    res.json({ success: true, message: 'Vehicle updated successfully.', data: { vehicle } });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/vehicles/:id/status
 */
const updateVehicleStatus = async (req, res, next) => {
  try {
    const { status } = req.body;

    if (!['ACTIVE', 'INACTIVE'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Status must be ACTIVE or INACTIVE.' });
    }

    const existing = await prisma.vehicle.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Vehicle not found.' });
    }

    const vehicle = await prisma.vehicle.update({
      where: { id: req.params.id },
      data: { status },
    });

    res.json({
      success: true,
      message: `Vehicle ${status === 'ACTIVE' ? 'activated' : 'deactivated'} successfully.`,
      data: { vehicle },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getVehicles, getActiveVehicles, createVehicle, getVehicle, updateVehicle, updateVehicleStatus };
