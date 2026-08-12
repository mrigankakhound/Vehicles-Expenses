const prisma = require('../config/prisma');

/**
 * Build the WHERE clause for expense queries from request query params
 */
const buildExpenseWhere = (query) => {
  const {
    search,
    expenseType,
    vehicleId,
    vehicleCategory,
    partyId,
    paymentStatus,
    paymentMethod,
    dateFrom,
    dateTo,
    minAmount,
    maxAmount,
  } = query;

  const where = { isDeleted: false };

  if (expenseType) where.expenseType = expenseType;
  if (vehicleId) where.vehicleId = vehicleId;
  if (partyId) where.partyId = partyId;
  if (paymentStatus) where.paymentStatus = paymentStatus;
  if (paymentMethod) where.paymentMethod = paymentMethod;

  if (vehicleCategory) {
    where.vehicle = { vehicleCategory };
  }

  if (dateFrom || dateTo) {
    where.date = {};
    if (dateFrom) where.date.gte = new Date(dateFrom);
    if (dateTo) {
      const end = new Date(dateTo);
      end.setHours(23, 59, 59, 999);
      where.date.lte = end;
    }
  }

  if (minAmount || maxAmount) {
    where.amount = {};
    if (minAmount) where.amount.gte = parseFloat(minAmount);
    if (maxAmount) where.amount.lte = parseFloat(maxAmount);
  }

  if (search) {
    where.OR = [
      { expenseDescription: { contains: search, mode: 'insensitive' } },
      { note: { contains: search, mode: 'insensitive' } },
      { vehicle: { vehicleNumber: { contains: search, mode: 'insensitive' } } },
      { party: { name: { contains: search, mode: 'insensitive' } } },
    ];
  }

  return where;
};

const expenseInclude = {
  vehicle: { select: { id: true, vehicleNumber: true, vehicleCategory: true, subCategory: true, modelName: true } },
  party: { select: { id: true, name: true, type: true } },
};

/**
 * GET /api/expenses
 */
const getExpenses = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, sortBy = 'date', sortOrder = 'desc' } = req.query;

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    const where = buildExpenseWhere(req.query);

    const validSortFields = ['date', 'amount', 'createdAt'];
    const orderByField = validSortFields.includes(sortBy) ? sortBy : 'date';
    const orderByDir = sortOrder === 'asc' ? 'asc' : 'desc';

    const [expenses, total, totalAmountResult] = await Promise.all([
      prisma.expense.findMany({
        where,
        include: expenseInclude,
        orderBy: { [orderByField]: orderByDir },
        skip,
        take: limitNum,
      }),
      prisma.expense.count({ where }),
      prisma.expense.aggregate({ where, _sum: { amount: true } }),
    ]);

    res.json({
      success: true,
      data: {
        expenses,
        filteredTotal: totalAmountResult._sum.amount || 0,
        pagination: { total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/expenses
 */
const createExpense = async (req, res, next) => {
  try {
    const {
      expenseType,
      date,
      vehicleId,
      partyId,
      amount,
      paymentMethod,
      paymentStatus,
      serviceType,
      serviceExpenseType,
      expenseDescription,
      note,
    } = req.body;

    // Verify vehicle exists if provided
    if (vehicleId) {
      const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
      if (!vehicle) {
        return res.status(404).json({ success: false, message: 'Vehicle not found.' });
      }
    }

    // Verify party exists if provided
    if (partyId) {
      const party = await prisma.party.findUnique({ where: { id: partyId } });
      if (!party) {
        return res.status(404).json({ success: false, message: 'Party not found.' });
      }
    }

    const expense = await prisma.expense.create({
      data: {
        expenseType,
        date: new Date(date),
        vehicleId: vehicleId || null,
        partyId: partyId || null,
        amount: parseFloat(amount),
        paymentMethod,
        paymentStatus,
        serviceType: serviceType || null,
        serviceExpenseType: serviceExpenseType || null,
        expenseDescription: expenseDescription ? expenseDescription.trim() : null,
        note: note ? note.trim() : null,
      },
      include: expenseInclude,
    });

    res.status(201).json({ success: true, message: 'Expense created successfully.', data: { expense } });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/expenses/:id
 */
const getExpense = async (req, res, next) => {
  try {
    const expense = await prisma.expense.findFirst({
      where: { id: req.params.id, isDeleted: false },
      include: expenseInclude,
    });

    if (!expense) return res.status(404).json({ success: false, message: 'Expense not found.' });

    res.json({ success: true, data: { expense } });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/expenses/:id
 */
const updateExpense = async (req, res, next) => {
  try {
    const existing = await prisma.expense.findFirst({
      where: { id: req.params.id, isDeleted: false },
    });

    if (!existing) return res.status(404).json({ success: false, message: 'Expense not found.' });

    const {
      expenseType,
      date,
      vehicleId,
      partyId,
      amount,
      paymentMethod,
      paymentStatus,
      serviceType,
      serviceExpenseType,
      expenseDescription,
      note,
    } = req.body;

    if (vehicleId) {
      const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
      if (!vehicle) return res.status(404).json({ success: false, message: 'Vehicle not found.' });
    }

    if (partyId) {
      const party = await prisma.party.findUnique({ where: { id: partyId } });
      if (!party) return res.status(404).json({ success: false, message: 'Party not found.' });
    }

    const expense = await prisma.expense.update({
      where: { id: req.params.id },
      data: {
        expenseType: expenseType || existing.expenseType,
        date: date ? new Date(date) : existing.date,
        vehicleId: vehicleId !== undefined ? (vehicleId || null) : existing.vehicleId,
        partyId: partyId !== undefined ? (partyId || null) : existing.partyId,
        amount: amount !== undefined ? parseFloat(amount) : existing.amount,
        paymentMethod: paymentMethod || existing.paymentMethod,
        paymentStatus: paymentStatus || existing.paymentStatus,
        serviceType: serviceType !== undefined ? (serviceType || null) : existing.serviceType,
        serviceExpenseType: serviceExpenseType !== undefined ? (serviceExpenseType || null) : existing.serviceExpenseType,
        expenseDescription: expenseDescription !== undefined ? (expenseDescription ? expenseDescription.trim() : null) : existing.expenseDescription,
        note: note !== undefined ? (note ? note.trim() : null) : existing.note,
      },
      include: expenseInclude,
    });

    res.json({ success: true, message: 'Expense updated successfully.', data: { expense } });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/expenses/:id  (soft delete)
 */
const deleteExpense = async (req, res, next) => {
  try {
    const existing = await prisma.expense.findFirst({
      where: { id: req.params.id, isDeleted: false },
    });

    if (!existing) return res.status(404).json({ success: false, message: 'Expense not found.' });

    await prisma.expense.update({
      where: { id: req.params.id },
      data: { isDeleted: true },
    });

    res.json({ success: true, message: 'Expense deleted successfully.' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getExpenses, createExpense, getExpense, updateExpense, deleteExpense };
