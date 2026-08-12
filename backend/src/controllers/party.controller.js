const prisma = require('../config/prisma');

/**
 * GET /api/parties
 */
const getParties = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search = '', status, type } = req.query;

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    const where = {};
    if (search) {
      where.name = { contains: search, mode: 'insensitive' };
    }
    if (status) where.status = status;
    if (type) where.type = type;

    const [parties, total] = await Promise.all([
      prisma.party.findMany({ where, orderBy: { name: 'asc' }, skip, take: limitNum }),
      prisma.party.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        parties,
        pagination: { total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/parties/active  — for dropdowns
 */
const getActiveParties = async (req, res, next) => {
  try {
    const { type } = req.query;
    const where = { status: 'ACTIVE' };
    if (type) where.type = type;

    const parties = await prisma.party.findMany({
      where,
      orderBy: { name: 'asc' },
      select: { id: true, name: true, type: true, status: true },
    });

    res.json({ success: true, data: { parties } });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/parties
 */
const createParty = async (req, res, next) => {
  try {
    const { name, type, status } = req.body;

    const party = await prisma.party.create({
      data: {
        name: name.trim(),
        type,
        status: status || 'ACTIVE',
      },
    });

    res.status(201).json({ success: true, message: 'Party created successfully.', data: { party } });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/parties/:id
 */
const getParty = async (req, res, next) => {
  try {
    const party = await prisma.party.findUnique({
      where: { id: req.params.id },
      include: { _count: { select: { expenses: { where: { isDeleted: false } } } } },
    });

    if (!party) return res.status(404).json({ success: false, message: 'Party not found.' });

    res.json({ success: true, data: { party } });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/parties/:id
 */
const updateParty = async (req, res, next) => {
  try {
    const { name, type, status } = req.body;

    const existing = await prisma.party.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ success: false, message: 'Party not found.' });

    const party = await prisma.party.update({
      where: { id: req.params.id },
      data: {
        name: name ? name.trim() : existing.name,
        type: type || existing.type,
        status: status || existing.status,
      },
    });

    res.json({ success: true, message: 'Party updated successfully.', data: { party } });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/parties/:id/status
 */
const updatePartyStatus = async (req, res, next) => {
  try {
    const { status } = req.body;

    if (!['ACTIVE', 'INACTIVE'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Status must be ACTIVE or INACTIVE.' });
    }

    const existing = await prisma.party.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ success: false, message: 'Party not found.' });

    const party = await prisma.party.update({ where: { id: req.params.id }, data: { status } });

    res.json({
      success: true,
      message: `Party ${status === 'ACTIVE' ? 'activated' : 'deactivated'} successfully.`,
      data: { party },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getParties, getActiveParties, createParty, getParty, updateParty, updatePartyStatus };
