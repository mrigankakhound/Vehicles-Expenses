const ExcelJS = require('exceljs');
const prisma = require('../config/prisma');

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

const formatCurrency = (val) => parseFloat(val || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 });

/**
 * Helper: apply header row styling
 */
const styleHeaderRow = (row, color = 'FF1E40AF') => {
  row.eachCell((cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: color } };
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    cell.border = {
      top: { style: 'thin' }, left: { style: 'thin' },
      bottom: { style: 'thin' }, right: { style: 'thin' },
    };
  });
};

const styleDataRow = (row, even = false) => {
  row.eachCell((cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: even ? 'FFF0F4FF' : 'FFFFFFFF' } };
    cell.alignment = { vertical: 'middle', wrapText: true };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FFD1D5DB' } },
      left: { style: 'thin', color: { argb: 'FFD1D5DB' } },
      bottom: { style: 'thin', color: { argb: 'FFD1D5DB' } },
      right: { style: 'thin', color: { argb: 'FFD1D5DB' } },
    };
  });
};

const mapExpenseType = (t) => ({ WASHING: 'Washing', FUEL: 'Fuel', VEHICLE_SERVICE: 'Vehicle Service', OFFICE: 'Office' }[t] || t);
const mapPaymentMethod = (m) => ({ SBI: 'SBI', CASH: 'Cash', UPI: 'UPI', NA: 'N/A' }[m] || m);
const mapServiceExpenseType = (t) => {
  const map = { RENT_SHARE:'Rent Share',SERVICE:'Service',PURCHASE:'Purchase',TOLL_GATE:'Toll Gate',EMI:'EMI',PAINT:'Paint',TOWING_CHARGE:'Towing Charge',PUC:'PUC',INSURANCE:'Insurance',GPS:'GPS',OTHER:'Other' };
  return map[t] || t || '';
};
const mapWashingServiceType = (t) => {
  const map = { BODY_WASH:'Body Wash',INTERIOR_CLEANING:'Interior Cleaning',EXTERIOR_CLEANING:'Exterior Cleaning',VACUUM_CLEANING:'Vacuum Cleaning',POLISHING:'Polishing',WAXING:'Waxing',FULL_CLEANING:'Full Cleaning',DETAILING:'Detailing',OTHER:'Other' };
  return map[t] || t || '';
};

/**
 * GET /api/export/expenses — export expenses with filters
 */
const exportExpenses = async (req, res, next) => {
  try {
    const {
      expenseType, vehicleId, partyId, paymentStatus, paymentMethod,
      dateFrom, dateTo, minAmount, maxAmount, search,
    } = req.query;

    const where = { isDeleted: false };
    if (expenseType) where.expenseType = expenseType;
    if (vehicleId) where.vehicleId = vehicleId;
    if (partyId) where.partyId = partyId;
    if (paymentStatus) where.paymentStatus = paymentStatus;
    if (paymentMethod) where.paymentMethod = paymentMethod;
    if (dateFrom || dateTo) {
      where.date = {};
      if (dateFrom) where.date.gte = new Date(dateFrom);
      if (dateTo) { const e = new Date(dateTo); e.setHours(23,59,59,999); where.date.lte = e; }
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

    const expenses = await prisma.expense.findMany({
      where,
      include: {
        vehicle: { select: { vehicleNumber: true, modelName: true, vehicleCategory: true } },
        party: { select: { name: true } },
      },
      orderBy: { date: 'desc' },
    });

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'FleetCost';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet('Expenses');
    sheet.columns = [
      { header: 'S.No', key: 'sno', width: 6 },
      { header: 'Date', key: 'date', width: 13 },
      { header: 'Expense Type', key: 'expenseType', width: 16 },
      { header: 'Vehicle', key: 'vehicle', width: 14 },
      { header: 'Model', key: 'model', width: 16 },
      { header: 'Service Type', key: 'serviceType', width: 18 },
      { header: 'Expense Description', key: 'description', width: 22 },
      { header: 'Party', key: 'party', width: 20 },
      { header: 'Amount (₹)', key: 'amount', width: 14 },
      { header: 'MOP', key: 'mop', width: 10 },
      { header: 'Payment Status', key: 'paymentStatus', width: 15 },
      { header: 'Note', key: 'note', width: 25 },
    ];

    styleHeaderRow(sheet.getRow(1));
    sheet.getRow(1).height = 30;

    expenses.forEach((e, idx) => {
      const serviceTypeLabel = e.expenseType === 'WASHING' 
        ? mapWashingServiceType(e.serviceType) 
        : mapServiceExpenseType(e.serviceExpenseType);

      const row = sheet.addRow({
        sno: idx + 1,
        date: new Date(e.date).toLocaleDateString('en-IN'),
        expenseType: mapExpenseType(e.expenseType),
        vehicle: e.vehicle?.vehicleNumber || 'N/A',
        model: e.vehicle?.modelName || 'N/A',
        serviceType: serviceTypeLabel,
        description: e.expenseDescription || '',
        party: e.party?.name || '',
        amount: parseFloat(e.amount),
        mop: mapPaymentMethod(e.paymentMethod),
        paymentStatus: e.paymentStatus === 'PAID' ? 'Paid' : 'Unpaid',
        note: e.note || '',
      });
      styleDataRow(row, idx % 2 === 1);
      row.getCell('amount').numFmt = '₹#,##0.00';
    });

    // Total row
    const totalRow = sheet.addRow({ sno: '', date: '', expenseType: '', vehicle: '', model: '', serviceType: '', description: 'TOTAL', party: '', amount: expenses.reduce((s, e) => s + parseFloat(e.amount), 0), mop: '', paymentStatus: '', note: '' });
    totalRow.eachCell((cell) => {
      cell.font = { bold: true };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEFF6FF' } };
    });
    totalRow.getCell('amount').numFmt = '₹#,##0.00';

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=expenses_${Date.now()}.xlsx`);
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/export/monthly?month=8&year=2026
 */
const exportMonthly = async (req, res, next) => {
  try {
    const { month, year } = req.query;
    if (!month || !year) return res.status(400).json({ success: false, message: 'Month and year required.' });

    const m = parseInt(month); const y = parseInt(year);
    const startDate = new Date(y, m - 1, 1);
    const endDate = new Date(y, m, 0, 23, 59, 59, 999);
    const where = { isDeleted: false, date: { gte: startDate, lte: endDate } };

    const expenses = await prisma.expense.findMany({
      where, include: { vehicle: { select: { vehicleNumber: true, modelName: true } }, party: { select: { name: true } } },
      orderBy: { date: 'asc' },
    });

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet(`${MONTHS[m-1]} ${y}`);

    // Title
    sheet.mergeCells('A1:L1');
    const titleCell = sheet.getCell('A1');
    titleCell.value = `FleetCost — Monthly Expense Report — ${MONTHS[m-1]} ${y}`;
    titleCell.font = { bold: true, size: 14, color: { argb: 'FF1E40AF' } };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    sheet.getRow(1).height = 35;

    sheet.addRow([]);

    sheet.columns = [
      { key: 'sno', width: 6 }, { key: 'date', width: 13 }, { key: 'expenseType', width: 16 },
      { key: 'vehicle', width: 14 }, { key: 'serviceType', width: 18 }, { key: 'description', width: 22 },
      { key: 'party', width: 20 }, { key: 'amount', width: 14 }, { key: 'mop', width: 10 },
      { key: 'paymentStatus', width: 15 }, { key: 'note', width: 25 }, { key: 'extra', width: 10 },
    ];

    const headerRow = sheet.addRow(['S.No','Date','Expense Type','Vehicle','Service Type','Description','Party','Amount (₹)','MOP','Payment Status','Note','']);
    styleHeaderRow(headerRow);
    headerRow.height = 28;

    expenses.forEach((e, idx) => {
      const serviceTypeLabel = e.expenseType === 'WASHING' ? mapWashingServiceType(e.serviceType) : mapServiceExpenseType(e.serviceExpenseType);
      const row = sheet.addRow([
        idx+1, new Date(e.date).toLocaleDateString('en-IN'), mapExpenseType(e.expenseType),
        e.vehicle?.vehicleNumber || 'N/A', serviceTypeLabel, e.expenseDescription || '',
        e.party?.name || '', parseFloat(e.amount), mapPaymentMethod(e.paymentMethod),
        e.paymentStatus === 'PAID' ? 'Paid' : 'Unpaid', e.note || '', '',
      ]);
      styleDataRow(row, idx % 2 === 1);
      row.getCell(8).numFmt = '₹#,##0.00';
    });

    const total = expenses.reduce((s,e) => s + parseFloat(e.amount), 0);
    const totalRow = sheet.addRow(['','','','','','','TOTAL', total,'','','','']);
    totalRow.getCell(7).font = { bold: true };
    totalRow.getCell(8).font = { bold: true };
    totalRow.getCell(8).numFmt = '₹#,##0.00';

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=monthly_${y}_${m}.xlsx`);
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/export/yearly?year=2026
 */
const exportYearly = async (req, res, next) => {
  try {
    const { year } = req.query;
    if (!year) return res.status(400).json({ success: false, message: 'Year required.' });

    const y = parseInt(year);
    const startDate = new Date(y, 0, 1);
    const endDate = new Date(y, 11, 31, 23, 59, 59, 999);
    const where = { isDeleted: false, date: { gte: startDate, lte: endDate } };

    const expenses = await prisma.expense.findMany({
      where, include: { vehicle: { select: { vehicleNumber: true } }, party: { select: { name: true } } },
      orderBy: { date: 'asc' },
    });

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet(`Year ${y}`);

    sheet.mergeCells('A1:H1');
    const titleCell = sheet.getCell('A1');
    titleCell.value = `FleetCost — Yearly Expense Report — ${y}`;
    titleCell.font = { bold: true, size: 14, color: { argb: 'FF1E40AF' } };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    sheet.getRow(1).height = 35;
    sheet.addRow([]);

    // Monthly summary sheet
    const summarySheet = workbook.addWorksheet('Monthly Summary');
    const sumHeaderRow = summarySheet.addRow(['Month','Total (₹)','Paid (₹)','Unpaid (₹)','Washing (₹)','Fuel (₹)','Service (₹)','Office (₹)']);
    styleHeaderRow(sumHeaderRow, 'FF1E40AF');

    const monthlyMap = {};
    expenses.forEach((e) => {
      const m = new Date(e.date).getMonth();
      if (!monthlyMap[m]) monthlyMap[m] = { total:0, paid:0, unpaid:0, washing:0, fuel:0, service:0, office:0 };
      const amt = parseFloat(e.amount);
      monthlyMap[m].total += amt;
      if (e.paymentStatus === 'PAID') monthlyMap[m].paid += amt; else monthlyMap[m].unpaid += amt;
      if (e.expenseType === 'WASHING') monthlyMap[m].washing += amt;
      else if (e.expenseType === 'FUEL') monthlyMap[m].fuel += amt;
      else if (e.expenseType === 'VEHICLE_SERVICE') monthlyMap[m].service += amt;
      else if (e.expenseType === 'OFFICE') monthlyMap[m].office += amt;
    });

    for (let i = 0; i < 12; i++) {
      const d = monthlyMap[i] || { total:0,paid:0,unpaid:0,washing:0,fuel:0,service:0,office:0 };
      const row = summarySheet.addRow([MONTHS[i], d.total, d.paid, d.unpaid, d.washing, d.fuel, d.service, d.office]);
      styleDataRow(row, i % 2 === 1);
      for (let c = 2; c <= 8; c++) row.getCell(c).numFmt = '₹#,##0.00';
    }

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=yearly_${y}.xlsx`);
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/export/profitability?year=2026
 */
const exportProfitability = async (req, res, next) => {
  try {
    const { year } = req.query;
    if (!year) return res.status(400).json({ success: false, message: 'Year required.' });

    const y = parseInt(year);
    const dateFilter = { gte: new Date(y, 0, 1), lte: new Date(y, 11, 31, 23, 59, 59, 999) };

    const vehicles = await prisma.vehicle.findMany({ orderBy: { vehicleNumber: 'asc' } });

    const rows = await Promise.all(vehicles.map(async (v) => {
      const expWhere = { isDeleted: false, vehicleId: v.id, date: dateFilter };
      const [costRes, revRecord] = await Promise.all([
        prisma.expense.aggregate({ where: expWhere, _sum: { amount: true } }),
        prisma.vehicleRevenue.findUnique({ where: { vehicleId_year: { vehicleId: v.id, year: y } } }),
      ]);
      const cost = parseFloat(costRes._sum.amount || 0);
      const revenue = revRecord ? parseFloat(revRecord.revenueAmount) : 0;
      const profit = revenue - cost;
      const margin = revenue > 0 ? (profit / revenue) * 100 : null;
      return { vehicle: v.vehicleNumber, model: v.modelName, revenue, cost, profit, margin };
    }));

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Profitability');

    sheet.mergeCells('A1:F1');
    const titleCell = sheet.getCell('A1');
    titleCell.value = `FleetCost — Vehicle Profitability Report — ${y}`;
    titleCell.font = { bold: true, size: 14, color: { argb: 'FF1E40AF' } };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    sheet.getRow(1).height = 35;
    sheet.addRow([]);

    const headerRow = sheet.addRow(['Vehicle', 'Model', 'Revenue (₹)', 'Total Cost (₹)', 'Profit/Loss (₹)', 'Margin %']);
    styleHeaderRow(headerRow);
    sheet.columns = [
      { key: 'v', width: 16 }, { key: 'm', width: 20 },
      { key: 'r', width: 18 }, { key: 'c', width: 18 },
      { key: 'p', width: 18 }, { key: 'mg', width: 12 },
    ];

    rows.forEach((r, idx) => {
      const row = sheet.addRow([r.vehicle, r.model, r.revenue, r.cost, r.profit, r.margin !== null ? r.margin.toFixed(2) + '%' : 'N/A']);
      styleDataRow(row, idx % 2 === 1);
      row.getCell(3).numFmt = '₹#,##0.00';
      row.getCell(4).numFmt = '₹#,##0.00';
      const profitCell = row.getCell(5);
      profitCell.numFmt = '₹#,##0.00';
      if (r.profit < 0) profitCell.font = { color: { argb: 'FFDC2626' }, bold: true };
      else if (r.profit > 0) profitCell.font = { color: { argb: 'FF16A34A' }, bold: true };
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=profitability_${y}.xlsx`);
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/export/template — download import template
 */
const downloadTemplate = async (req, res, next) => {
  try {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Expense Import Template');

    sheet.columns = [
      { header: 'Date (DD/MM/YYYY)', key: 'date', width: 20 },
      { header: 'Expense Type', key: 'expenseType', width: 18 },
      { header: 'Vehicle Number', key: 'vehicleNumber', width: 16 },
      { header: 'Service Type (Washing)', key: 'serviceType', width: 24 },
      { header: 'Service Expense Type (Vehicle Service)', key: 'serviceExpenseType', width: 36 },
      { header: 'Expense Description (Office)', key: 'expenseDescription', width: 28 },
      { header: 'Amount', key: 'amount', width: 14 },
      { header: 'Party Name', key: 'party', width: 22 },
      { header: 'MOP', key: 'mop', width: 12 },
      { header: 'Payment Status', key: 'paymentStatus', width: 16 },
      { header: 'Note', key: 'note', width: 28 },
    ];

    styleHeaderRow(sheet.getRow(1), 'FF1D4ED8');

    // Sample rows
    const samples = [
      ['01/08/2026','WASHING','AS01AB1234','BODY_WASH','','',500,'City Wash Center','CASH','PAID','Monthly wash'],
      ['02/08/2026','FUEL','AS01AB1234','','','',2500,'Indian Oil Pump','UPI','PAID',''],
      ['03/08/2026','VEHICLE_SERVICE','AS01AB1234','','SERVICE','',3000,'City Auto Service','SBI','PAID','Oil change'],
      ['04/08/2026','OFFICE','','','','Electricity Bill',1200,'BESCOM','CASH','PAID','August bill'],
    ];
    samples.forEach((s, idx) => {
      const row = sheet.addRow(s);
      styleDataRow(row, idx % 2 === 1);
    });

    // Instructions sheet
    const instrSheet = workbook.addWorksheet('Instructions');
    instrSheet.getColumn(1).width = 80;
    const instrRows = [
      ['IMPORT INSTRUCTIONS'],
      [''],
      ['Expense Type values: WASHING, FUEL, VEHICLE_SERVICE, OFFICE'],
      ['MOP values: SBI, CASH, UPI, NA'],
      ['Payment Status values: PAID, UNPAID'],
      [''],
      ['Washing Service Types: BODY_WASH, INTERIOR_CLEANING, EXTERIOR_CLEANING, VACUUM_CLEANING, POLISHING, WAXING, FULL_CLEANING, DETAILING, OTHER'],
      [''],
      ['Vehicle Service Expense Types: RENT_SHARE, SERVICE, PURCHASE, TOLL_GATE, EMI, PAINT, TOWING_CHARGE, PUC, INSURANCE, GPS, OTHER'],
      [''],
      ['Rules:'],
      ['- WASHING requires: Vehicle Number, Service Type, Amount, MOP, Payment Status'],
      ['- FUEL requires: Vehicle Number, Amount, MOP, Payment Status'],
      ['- VEHICLE_SERVICE requires: Vehicle Number, Service Expense Type, Amount, MOP, Payment Status'],
      ['- OFFICE requires: Expense Description, Amount, MOP, Payment Status (Vehicle Number is empty)'],
      ['- Vehicle Number must match an existing vehicle in the system'],
      ['- Amount must be a positive number'],
      ['- Date must be in DD/MM/YYYY format'],
    ];
    instrRows.forEach((r) => instrSheet.addRow(r));
    instrSheet.getCell('A1').font = { bold: true, size: 13, color: { argb: 'FF1E40AF' } };

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=fleetcost_import_template.xlsx');
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/export/vehicle-expense?vehicleId=...&year=2026
 */
const exportVehicleExpense = async (req, res, next) => {
  try {
    const { vehicleId, year, dateFrom, dateTo } = req.query;
    if (!vehicleId) return res.status(400).json({ success: false, message: 'Vehicle ID required.' });

    const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
    if (!vehicle) return res.status(404).json({ success: false, message: 'Vehicle not found.' });

    let dateFilter = {};
    if (year) {
      const y = parseInt(year);
      dateFilter = { gte: new Date(y, 0, 1), lte: new Date(y, 11, 31, 23, 59, 59, 999) };
    } else if (dateFrom || dateTo) {
      if (dateFrom) dateFilter.gte = new Date(dateFrom);
      if (dateTo) { const end = new Date(dateTo); end.setHours(23,59,59,999); dateFilter.lte = end; }
    }

    const where = { isDeleted: false, vehicleId, ...(Object.keys(dateFilter).length ? { date: dateFilter } : {}) };
    const expenses = await prisma.expense.findMany({
      where, include: { party: { select: { name: true } } }, orderBy: { date: 'asc' },
    });

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet(`${vehicle.vehicleNumber}`);

    sheet.mergeCells('A1:G1');
    const t = sheet.getCell('A1');
    t.value = `FleetCost — Vehicle Expense Report — ${vehicle.vehicleNumber} (${vehicle.modelName})${year ? ' — ' + year : ''}`;
    t.font = { bold: true, size: 13, color: { argb: 'FF1E40AF' } };
    t.alignment = { horizontal: 'center', vertical: 'middle' };
    sheet.getRow(1).height = 32;
    sheet.addRow([]);

    sheet.columns = [
      { key: 'sno', width: 6 }, { key: 'date', width: 13 }, { key: 'type', width: 16 },
      { key: 'desc', width: 22 }, { key: 'party', width: 20 }, { key: 'amount', width: 14 }, { key: 'status', width: 12 },
    ];

    const headerRow = sheet.addRow(['S.No','Date','Type','Description','Party','Amount (₹)','Status']);
    styleHeaderRow(headerRow);
    headerRow.height = 26;

    expenses.forEach((e, idx) => {
      const desc = e.serviceExpenseType ? mapServiceExpenseType(e.serviceExpenseType) : (e.serviceType ? e.serviceType.replace(/_/g,' ') : (e.expenseDescription || ''));
      const row = sheet.addRow([idx+1, new Date(e.date).toLocaleDateString('en-IN'), mapExpenseType(e.expenseType), desc, e.party?.name||'', parseFloat(e.amount), e.paymentStatus==='PAID'?'Paid':'Unpaid']);
      styleDataRow(row, idx % 2 === 1);
      row.getCell(6).numFmt = '₹#,##0.00';
    });

    const total = expenses.reduce((s,e) => s + parseFloat(e.amount), 0);
    const totalRow = sheet.addRow(['','','','','TOTAL',total,'']);
    totalRow.getCell(5).font = { bold: true };
    totalRow.getCell(6).font = { bold: true };
    totalRow.getCell(6).numFmt = '₹#,##0.00';

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=vehicle_${vehicle.vehicleNumber}_expenses.xlsx`);
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    next(error);
  }
};

module.exports = { exportExpenses, exportMonthly, exportYearly, exportProfitability, exportVehicleExpense, downloadTemplate };
