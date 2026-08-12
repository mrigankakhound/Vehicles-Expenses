const prisma = require('../config/prisma');

const baseWhere = { isDeleted: false };

/**
 * GET /api/reports/monthly?month=8&year=2026
 */
const getMonthlyReport = async (req, res, next) => {
  try {
    const { month, year } = req.query;

    if (!month || !year) {
      return res.status(400).json({ success: false, message: 'Month and year are required.' });
    }

    const m = parseInt(month);
    const y = parseInt(year);

    if (m < 1 || m > 12 || y < 2000 || y > 2100) {
      return res.status(400).json({ success: false, message: 'Invalid month or year.' });
    }

    const startDate = new Date(y, m - 1, 1);
    const endDate = new Date(y, m, 0, 23, 59, 59, 999);

    const where = { ...baseWhere, date: { gte: startDate, lte: endDate } };

    const [total, paid, unpaid, washing, fuel, service, office, expenses] = await Promise.all([
      prisma.expense.aggregate({ where, _sum: { amount: true } }),
      prisma.expense.aggregate({ where: { ...where, paymentStatus: 'PAID' }, _sum: { amount: true } }),
      prisma.expense.aggregate({ where: { ...where, paymentStatus: 'UNPAID' }, _sum: { amount: true } }),
      prisma.expense.aggregate({ where: { ...where, expenseType: 'WASHING' }, _sum: { amount: true } }),
      prisma.expense.aggregate({ where: { ...where, expenseType: 'FUEL' }, _sum: { amount: true } }),
      prisma.expense.aggregate({ where: { ...where, expenseType: 'VEHICLE_SERVICE' }, _sum: { amount: true } }),
      prisma.expense.aggregate({ where: { ...where, expenseType: 'OFFICE' }, _sum: { amount: true } }),
      prisma.expense.findMany({
        where,
        include: {
          vehicle: { select: { vehicleNumber: true, modelName: true } },
          party: { select: { name: true } },
        },
        orderBy: { date: 'asc' },
      }),
    ]);

    res.json({
      success: true,
      data: {
        period: { month: m, year: y },
        summary: {
          total: parseFloat(total._sum.amount || 0),
          paid: parseFloat(paid._sum.amount || 0),
          unpaid: parseFloat(unpaid._sum.amount || 0),
          washing: parseFloat(washing._sum.amount || 0),
          fuel: parseFloat(fuel._sum.amount || 0),
          service: parseFloat(service._sum.amount || 0),
          office: parseFloat(office._sum.amount || 0),
        },
        expenses,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/reports/yearly?year=2026
 */
const getYearlyReport = async (req, res, next) => {
  try {
    const { year } = req.query;

    if (!year) return res.status(400).json({ success: false, message: 'Year is required.' });

    const y = parseInt(year);
    if (y < 2000 || y > 2100) return res.status(400).json({ success: false, message: 'Invalid year.' });

    const startDate = new Date(y, 0, 1);
    const endDate = new Date(y, 11, 31, 23, 59, 59, 999);

    const where = { ...baseWhere, date: { gte: startDate, lte: endDate } };

    const [total, paid, unpaid, washing, fuel, service, office, monthlyData] = await Promise.all([
      prisma.expense.aggregate({ where, _sum: { amount: true } }),
      prisma.expense.aggregate({ where: { ...where, paymentStatus: 'PAID' }, _sum: { amount: true } }),
      prisma.expense.aggregate({ where: { ...where, paymentStatus: 'UNPAID' }, _sum: { amount: true } }),
      prisma.expense.aggregate({ where: { ...where, expenseType: 'WASHING' }, _sum: { amount: true } }),
      prisma.expense.aggregate({ where: { ...where, expenseType: 'FUEL' }, _sum: { amount: true } }),
      prisma.expense.aggregate({ where: { ...where, expenseType: 'VEHICLE_SERVICE' }, _sum: { amount: true } }),
      prisma.expense.aggregate({ where: { ...where, expenseType: 'OFFICE' }, _sum: { amount: true } }),
      prisma.$queryRaw`
        SELECT 
          EXTRACT(MONTH FROM date)::int AS month,
          SUM(amount)::float AS total,
          SUM(CASE WHEN "paymentStatus" = 'PAID' THEN amount ELSE 0 END)::float AS paid,
          SUM(CASE WHEN "paymentStatus" = 'UNPAID' THEN amount ELSE 0 END)::float AS unpaid,
          SUM(CASE WHEN "expenseType" = 'WASHING' THEN amount ELSE 0 END)::float AS washing,
          SUM(CASE WHEN "expenseType" = 'FUEL' THEN amount ELSE 0 END)::float AS fuel,
          SUM(CASE WHEN "expenseType" = 'VEHICLE_SERVICE' THEN amount ELSE 0 END)::float AS service,
          SUM(CASE WHEN "expenseType" = 'OFFICE' THEN amount ELSE 0 END)::float AS office
        FROM expenses
        WHERE "isDeleted" = false AND EXTRACT(YEAR FROM date) = ${y}
        GROUP BY month
        ORDER BY month ASC
      `,
    ]);

    // Build 12-month array
    const monthlyBreakdown = Array.from({ length: 12 }, (_, i) => {
      const found = monthlyData.find((r) => r.month === i + 1);
      return {
        month: i + 1,
        total: found ? parseFloat(found.total) : 0,
        paid: found ? parseFloat(found.paid) : 0,
        unpaid: found ? parseFloat(found.unpaid) : 0,
        washing: found ? parseFloat(found.washing) : 0,
        fuel: found ? parseFloat(found.fuel) : 0,
        service: found ? parseFloat(found.service) : 0,
        office: found ? parseFloat(found.office) : 0,
      };
    });

    res.json({
      success: true,
      data: {
        year: y,
        summary: {
          total: parseFloat(total._sum.amount || 0),
          paid: parseFloat(paid._sum.amount || 0),
          unpaid: parseFloat(unpaid._sum.amount || 0),
          washing: parseFloat(washing._sum.amount || 0),
          fuel: parseFloat(fuel._sum.amount || 0),
          service: parseFloat(service._sum.amount || 0),
          office: parseFloat(office._sum.amount || 0),
        },
        monthlyBreakdown,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/reports/vehicle-expense?vehicleId=...&year=2026 or dateFrom/dateTo
 */
const getVehicleExpenseReport = async (req, res, next) => {
  try {
    const { vehicleId, year, dateFrom, dateTo } = req.query;

    if (!vehicleId) return res.status(400).json({ success: false, message: 'Vehicle is required.' });

    const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
    if (!vehicle) return res.status(404).json({ success: false, message: 'Vehicle not found.' });

    let dateFilter = {};
    if (year) {
      const y = parseInt(year);
      dateFilter = { gte: new Date(y, 0, 1), lte: new Date(y, 11, 31, 23, 59, 59, 999) };
    } else if (dateFrom || dateTo) {
      if (dateFrom) dateFilter.gte = new Date(dateFrom);
      if (dateTo) {
        const end = new Date(dateTo);
        end.setHours(23, 59, 59, 999);
        dateFilter.lte = end;
      }
    }

    const where = { ...baseWhere, vehicleId, ...(Object.keys(dateFilter).length ? { date: dateFilter } : {}) };

    const [total, fuel, washing, service, expenses] = await Promise.all([
      prisma.expense.aggregate({ where, _sum: { amount: true } }),
      prisma.expense.aggregate({ where: { ...where, expenseType: 'FUEL' }, _sum: { amount: true } }),
      prisma.expense.aggregate({ where: { ...where, expenseType: 'WASHING' }, _sum: { amount: true } }),
      prisma.expense.aggregate({ where: { ...where, expenseType: 'VEHICLE_SERVICE' }, _sum: { amount: true } }),
      prisma.expense.findMany({
        where,
        include: { party: { select: { name: true } } },
        orderBy: { date: 'asc' },
      }),
    ]);

    res.json({
      success: true,
      data: {
        vehicle,
        period: year ? { year: parseInt(year) } : { dateFrom, dateTo },
        summary: {
          total: parseFloat(total._sum.amount || 0),
          fuel: parseFloat(fuel._sum.amount || 0),
          washing: parseFloat(washing._sum.amount || 0),
          service: parseFloat(service._sum.amount || 0),
        },
        expenses,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/reports/profitability?year=2026&vehicleId=... (optional)
 */
const getProfitabilityReport = async (req, res, next) => {
  try {
    const { year, vehicleId, dateFrom, dateTo } = req.query;

    if (!year && !dateFrom) {
      return res.status(400).json({ success: false, message: 'Year or date range is required.' });
    }

    let dateFilter = {};
    let revenueYear = null;

    if (year) {
      const y = parseInt(year);
      revenueYear = y;
      dateFilter = { gte: new Date(y, 0, 1), lte: new Date(y, 11, 31, 23, 59, 59, 999) };
    } else {
      if (dateFrom) dateFilter.gte = new Date(dateFrom);
      if (dateTo) {
        const end = new Date(dateTo);
        end.setHours(23, 59, 59, 999);
        dateFilter.lte = end;
      }
    }

    // Get vehicles to analyze
    const vehicleWhere = vehicleId ? { id: vehicleId } : {};
    const vehicles = await prisma.vehicle.findMany({
      where: vehicleWhere,
      orderBy: { vehicleNumber: 'asc' },
    });

    if (vehicles.length === 0) {
      return res.status(404).json({ success: false, message: 'No vehicles found.' });
    }

    // For each vehicle, calculate cost and profit
    const profitabilityData = await Promise.all(
      vehicles.map(async (v) => {
        const expenseWhere = {
          isDeleted: false,
          vehicleId: v.id,
          date: dateFilter,
        };

        const [costResult, fuelResult, washingResult, serviceResult, revenueRecord] = await Promise.all([
          prisma.expense.aggregate({ where: expenseWhere, _sum: { amount: true } }),
          prisma.expense.aggregate({ where: { ...expenseWhere, expenseType: 'FUEL' }, _sum: { amount: true } }),
          prisma.expense.aggregate({ where: { ...expenseWhere, expenseType: 'WASHING' }, _sum: { amount: true } }),
          prisma.expense.aggregate({ where: { ...expenseWhere, expenseType: 'VEHICLE_SERVICE' }, _sum: { amount: true } }),
          revenueYear
            ? prisma.vehicleRevenue.findUnique({
                where: { vehicleId_year: { vehicleId: v.id, year: revenueYear } },
              })
            : null,
        ]);

        const totalCost = parseFloat(costResult._sum.amount || 0);
        const revenue = revenueRecord ? parseFloat(revenueRecord.revenueAmount) : 0;
        const profit = revenue - totalCost;
        const profitMargin = revenue > 0 ? (profit / revenue) * 100 : null;

        return {
          vehicle: {
            id: v.id,
            vehicleNumber: v.vehicleNumber,
            modelName: v.modelName,
            vehicleCategory: v.vehicleCategory,
            status: v.status,
          },
          revenue,
          totalCost,
          fuelCost: parseFloat(fuelResult._sum.amount || 0),
          washingCost: parseFloat(washingResult._sum.amount || 0),
          serviceCost: parseFloat(serviceResult._sum.amount || 0),
          profit,
          profitMargin,
          isLoss: profit < 0,
          isProfitable: profit > 0,
        };
      })
    );

    res.json({
      success: true,
      data: {
        period: year ? { year: parseInt(year) } : { dateFrom, dateTo },
        profitability: profitabilityData,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getMonthlyReport, getYearlyReport, getVehicleExpenseReport, getProfitabilityReport };
