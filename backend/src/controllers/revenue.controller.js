const prisma = require('../config/prisma');

/**
 * GET /api/revenue
 */
const getRevenues = async (req, res, next) => {
  try {
    const { vehicleId, year, page = 1, limit = 20 } = req.query;
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    const where = {};
    if (vehicleId) where.vehicleId = vehicleId;
    if (year) where.year = parseInt(year);

    const [revenues, total] = await Promise.all([
      prisma.vehicleRevenue.findMany({
        where,
        include: {
          vehicle: { select: { id: true, vehicleNumber: true, modelName: true, vehicleCategory: true } },
        },
        orderBy: [{ year: 'desc' }, { createdAt: 'desc' }],
        skip,
        take: limitNum,
      }),
      prisma.vehicleRevenue.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        revenues,
        pagination: { total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/revenue
 */
const createRevenue = async (req, res, next) => {
  try {
    const { vehicleId, year, revenueAmount, note } = req.body;

    const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
    if (!vehicle) return res.status(404).json({ success: false, message: 'Vehicle not found.' });

    // Check for existing revenue for same vehicle + year
    const existing = await prisma.vehicleRevenue.findUnique({
      where: { vehicleId_year: { vehicleId, year: parseInt(year) } },
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: `Revenue for vehicle ${vehicle.vehicleNumber} in year ${year} already exists. Please edit the existing record.`,
      });
    }

    const revenue = await prisma.vehicleRevenue.create({
      data: {
        vehicleId,
        year: parseInt(year),
        revenueAmount: parseFloat(revenueAmount),
        note: note ? note.trim() : null,
      },
      include: {
        vehicle: { select: { id: true, vehicleNumber: true, modelName: true } },
      },
    });

    res.status(201).json({ success: true, message: 'Revenue created successfully.', data: { revenue } });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/revenue/:id
 */
const getRevenue = async (req, res, next) => {
  try {
    const revenue = await prisma.vehicleRevenue.findUnique({
      where: { id: req.params.id },
      include: { vehicle: { select: { id: true, vehicleNumber: true, modelName: true } } },
    });

    if (!revenue) return res.status(404).json({ success: false, message: 'Revenue record not found.' });

    res.json({ success: true, data: { revenue } });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/revenue/:id
 */
const updateRevenue = async (req, res, next) => {
  try {
    const { revenueAmount, note, year } = req.body;

    const existing = await prisma.vehicleRevenue.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ success: false, message: 'Revenue record not found.' });

    const revenue = await prisma.vehicleRevenue.update({
      where: { id: req.params.id },
      data: {
        revenueAmount: revenueAmount !== undefined ? parseFloat(revenueAmount) : existing.revenueAmount,
        note: note !== undefined ? (note ? note.trim() : null) : existing.note,
        year: year !== undefined ? parseInt(year) : existing.year,
      },
      include: { vehicle: { select: { id: true, vehicleNumber: true, modelName: true } } },
    });

    res.json({ success: true, message: 'Revenue updated successfully.', data: { revenue } });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/revenue/:id
 */
const deleteRevenue = async (req, res, next) => {
  try {
    const existing = await prisma.vehicleRevenue.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ success: false, message: 'Revenue record not found.' });

    await prisma.vehicleRevenue.delete({ where: { id: req.params.id } });

    res.json({ success: true, message: 'Revenue record deleted successfully.' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getRevenues, createRevenue, getRevenue, updateRevenue, deleteRevenue };
