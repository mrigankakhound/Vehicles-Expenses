const prisma = require('../config/prisma');

/**
 * GET /api/dashboard
 */
const getDashboardData = async (req, res, next) => {
  try {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const baseWhere = { isDeleted: false };

    const [
      todayExpense,
      monthExpense,
      totalExpense,
      totalPaid,
      totalUnpaid,
      washingTotal,
      fuelTotal,
      serviceTotal,
      officeTotal,
      activeVehicles,
      totalVehicles,
      monthlyTrend,
    ] = await Promise.all([
      // Today's expense
      prisma.expense.aggregate({
        where: { ...baseWhere, date: { gte: todayStart, lte: todayEnd } },
        _sum: { amount: true },
      }),
      // This month's expense
      prisma.expense.aggregate({
        where: { ...baseWhere, date: { gte: monthStart, lte: monthEnd } },
        _sum: { amount: true },
      }),
      // Total expense
      prisma.expense.aggregate({ where: baseWhere, _sum: { amount: true } }),
      // Total paid
      prisma.expense.aggregate({
        where: { ...baseWhere, paymentStatus: 'PAID' },
        _sum: { amount: true },
      }),
      // Total unpaid
      prisma.expense.aggregate({
        where: { ...baseWhere, paymentStatus: 'UNPAID' },
        _sum: { amount: true },
      }),
      // Washing total
      prisma.expense.aggregate({
        where: { ...baseWhere, expenseType: 'WASHING' },
        _sum: { amount: true },
      }),
      // Fuel total
      prisma.expense.aggregate({
        where: { ...baseWhere, expenseType: 'FUEL' },
        _sum: { amount: true },
      }),
      // Service total
      prisma.expense.aggregate({
        where: { ...baseWhere, expenseType: 'VEHICLE_SERVICE' },
        _sum: { amount: true },
      }),
      // Office total
      prisma.expense.aggregate({
        where: { ...baseWhere, expenseType: 'OFFICE' },
        _sum: { amount: true },
      }),
      // Active vehicles
      prisma.vehicle.count({ where: { status: 'ACTIVE' } }),
      // Total vehicles
      prisma.vehicle.count(),
      // Monthly trend (current year)
      prisma.$queryRaw`
        SELECT 
          EXTRACT(MONTH FROM date)::int AS month,
          EXTRACT(YEAR FROM date)::int AS year,
          SUM(amount)::float AS total
        FROM expenses
        WHERE 
          "isDeleted" = false
          AND EXTRACT(YEAR FROM date) = ${now.getFullYear()}
        GROUP BY year, month
        ORDER BY month ASC
      `,
    ]);

    // Build monthly trend array (12 months)
    const monthlyData = Array.from({ length: 12 }, (_, i) => {
      const found = monthlyTrend.find((r) => r.month === i + 1);
      return { month: i + 1, total: found ? parseFloat(found.total) : 0 };
    });

    res.json({
      success: true,
      data: {
        summary: {
          todayExpense: parseFloat(todayExpense._sum.amount || 0),
          monthExpense: parseFloat(monthExpense._sum.amount || 0),
          totalExpense: parseFloat(totalExpense._sum.amount || 0),
          totalPaid: parseFloat(totalPaid._sum.amount || 0),
          totalUnpaid: parseFloat(totalUnpaid._sum.amount || 0),
        },
        categoryBreakdown: {
          washing: parseFloat(washingTotal._sum.amount || 0),
          fuel: parseFloat(fuelTotal._sum.amount || 0),
          service: parseFloat(serviceTotal._sum.amount || 0),
          office: parseFloat(officeTotal._sum.amount || 0),
        },
        vehicles: { active: activeVehicles, total: totalVehicles },
        monthlyTrend: monthlyData,
        year: now.getFullYear(),
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getDashboardData };
