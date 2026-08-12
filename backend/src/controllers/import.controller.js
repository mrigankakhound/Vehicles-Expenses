const ExcelJS = require('exceljs');
const multer = require('multer');
const prisma = require('../config/prisma');

// Store upload in memory (not disk)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowed = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
    ];
    if (allowed.includes(file.mimetype) || file.originalname.endsWith('.xlsx') || file.originalname.endsWith('.xls')) {
      cb(null, true);
    } else {
      cb(new Error('Only Excel files (.xlsx, .xls) are accepted.'), false);
    }
  },
}).single('file');

const VALID_EXPENSE_TYPES = ['WASHING', 'FUEL', 'VEHICLE_SERVICE', 'OFFICE'];
const VALID_WASHING_TYPES = ['BODY_WASH','INTERIOR_CLEANING','EXTERIOR_CLEANING','VACUUM_CLEANING','POLISHING','WAXING','FULL_CLEANING','DETAILING','OTHER'];
const VALID_SERVICE_TYPES = ['RENT_SHARE','SERVICE','PURCHASE','TOLL_GATE','EMI','PAINT','TOWING_CHARGE','PUC','INSURANCE','GPS','OTHER'];
const VALID_PAYMENT_METHODS = ['SBI', 'CASH', 'UPI', 'NA'];
const VALID_PAYMENT_STATUSES = ['PAID', 'UNPAID'];

const parseDate = (val) => {
  if (!val) return null;
  const str = String(val).trim();
  // DD/MM/YYYY
  const ddmmyyyy = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (ddmmyyyy) {
    const [, d, m, y] = ddmmyyyy;
    const date = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
    return isNaN(date.getTime()) ? null : date;
  }
  // ISO or JS date
  const d = new Date(str);
  return isNaN(d.getTime()) ? null : d;
};

/**
 * POST /api/import/expenses
 */
const importExpenses = async (req, res, next) => {
  upload(req, res, async (uploadErr) => {
    if (uploadErr) {
      return res.status(400).json({ success: false, message: uploadErr.message });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload an Excel file.' });
    }

    try {
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(req.file.buffer);

      const sheet = workbook.worksheets[0];
      if (!sheet) {
        return res.status(400).json({ success: false, message: 'Excel file has no worksheets.' });
      }

      const rows = [];
      sheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return; // skip header
        const values = row.values; // 1-indexed
        rows.push({
          rowNumber,
          date: values[1],
          expenseType: values[2] ? String(values[2]).trim().toUpperCase() : null,
          vehicleNumber: values[3] ? String(values[3]).trim().toUpperCase() : null,
          serviceType: values[4] ? String(values[4]).trim().toUpperCase() : null,
          serviceExpenseType: values[5] ? String(values[5]).trim().toUpperCase() : null,
          expenseDescription: values[6] ? String(values[6]).trim() : null,
          amount: values[7],
          partyName: values[8] ? String(values[8]).trim() : null,
          mop: values[9] ? String(values[9]).trim().toUpperCase() : null,
          paymentStatus: values[10] ? String(values[10]).trim().toUpperCase() : null,
          note: values[11] ? String(values[11]).trim() : null,
        });
      });

      if (rows.length === 0) {
        return res.status(400).json({ success: false, message: 'The Excel file contains no data rows.' });
      }

      // Pre-load all vehicles and parties for validation
      const [allVehicles, allParties] = await Promise.all([
        prisma.vehicle.findMany({ select: { id: true, vehicleNumber: true } }),
        prisma.party.findMany({ select: { id: true, name: true, status: true } }),
      ]);

      const vehicleMap = {};
      allVehicles.forEach((v) => { vehicleMap[v.vehicleNumber.toUpperCase()] = v.id; });

      const partyMap = {};
      allParties.forEach((p) => { partyMap[p.name.toLowerCase()] = p.id; });

      const errors = [];
      const validRecords = [];

      for (const row of rows) {
        const rowErrors = [];
        const { rowNumber, expenseType, vehicleNumber, serviceType, serviceExpenseType, expenseDescription, amount, mop, paymentStatus, partyName } = row;

        // Skip completely empty rows
        if (!expenseType && !vehicleNumber && !amount && !mop && !paymentStatus) continue;

        // Validate expense type
        if (!expenseType || !VALID_EXPENSE_TYPES.includes(expenseType)) {
          rowErrors.push(`Invalid Expense Type "${row.expenseType}". Must be one of: ${VALID_EXPENSE_TYPES.join(', ')}`);
        }

        // Parse date
        const parsedDate = parseDate(row.date);
        if (!parsedDate) {
          rowErrors.push(`Invalid Date "${row.date}". Use DD/MM/YYYY format.`);
        }

        // Parse amount
        const parsedAmount = parseFloat(String(amount).replace(/[^0-9.]/g, ''));
        if (isNaN(parsedAmount) || parsedAmount <= 0) {
          rowErrors.push(`Invalid Amount "${amount}". Must be a positive number.`);
        }

        // Validate MOP
        if (!mop || !VALID_PAYMENT_METHODS.includes(mop)) {
          rowErrors.push(`Invalid MOP "${row.mop}". Must be: SBI, CASH, UPI, NA`);
        }

        // Validate payment status
        if (!paymentStatus || !VALID_PAYMENT_STATUSES.includes(paymentStatus)) {
          rowErrors.push(`Invalid Payment Status "${row.paymentStatus}". Must be PAID or UNPAID.`);
        }

        // Type-specific validation
        let vehicleId = null;
        let partyId = null;

        if (expenseType && expenseType !== 'OFFICE') {
          // Vehicle required
          if (!vehicleNumber) {
            rowErrors.push(`Vehicle Number is required for ${expenseType} expenses.`);
          } else {
            vehicleId = vehicleMap[vehicleNumber.toUpperCase()];
            if (!vehicleId) {
              rowErrors.push(`Vehicle "${vehicleNumber}" does not exist in the system.`);
            }
          }
        }

        if (expenseType === 'WASHING' && serviceType && !VALID_WASHING_TYPES.includes(serviceType)) {
          rowErrors.push(`Invalid Service Type "${serviceType}" for Washing.`);
        }

        if (expenseType === 'VEHICLE_SERVICE' && !serviceExpenseType) {
          rowErrors.push(`Service Expense Type is required for VEHICLE_SERVICE expenses.`);
        } else if (expenseType === 'VEHICLE_SERVICE' && serviceExpenseType && !VALID_SERVICE_TYPES.includes(serviceExpenseType)) {
          rowErrors.push(`Invalid Service Expense Type "${serviceExpenseType}".`);
        }

        if (expenseType === 'OFFICE' && !expenseDescription) {
          rowErrors.push(`Expense Description is required for OFFICE expenses.`);
        }

        // Resolve party
        if (partyName) {
          partyId = partyMap[partyName.toLowerCase()];
          // If party not found, we'll create it during import
        }

        if (rowErrors.length > 0) {
          errors.push({ row: rowNumber, errors: rowErrors });
        } else {
          validRecords.push({ ...row, parsedDate, parsedAmount, vehicleId, partyId });
        }
      }

      // If there are errors, return them without inserting anything
      if (errors.length > 0) {
        return res.status(422).json({
          success: false,
          message: `Import validation failed. ${errors.length} row(s) have errors.`,
          data: { errors, validCount: validRecords.length, errorCount: errors.length },
        });
      }

      // All valid — import in a single transaction
      const imported = await prisma.$transaction(async (tx) => {
        const results = [];

        for (const record of validRecords) {
          let partyId = record.partyId;

          // Create party if it doesn't exist
          if (record.partyName && !partyId) {
            const newParty = await tx.party.create({
              data: { name: record.partyName, type: 'OTHER', status: 'ACTIVE' },
            });
            partyId = newParty.id;
            // Update map for subsequent rows
            partyMap[record.partyName.toLowerCase()] = partyId;
          }

          const expense = await tx.expense.create({
            data: {
              expenseType: record.expenseType,
              date: record.parsedDate,
              vehicleId: record.vehicleId || null,
              partyId: partyId || null,
              amount: record.parsedAmount,
              paymentMethod: record.mop,
              paymentStatus: record.paymentStatus,
              serviceType: record.serviceType || null,
              serviceExpenseType: record.serviceExpenseType || null,
              expenseDescription: record.expenseDescription || null,
              note: record.note || null,
            },
          });

          results.push(expense);
        }

        return results;
      });

      res.status(201).json({
        success: true,
        message: `Successfully imported ${imported.length} expense record(s).`,
        data: { importedCount: imported.length },
      });
    } catch (error) {
      next(error);
    }
  });
};

module.exports = { importExpenses };
