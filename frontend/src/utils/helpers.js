// Format currency in Indian Rupees
export const formatCurrency = (value) => {
  const num = parseFloat(value || 0);
  return '₹' + num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

// Format date for display
export const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

// Format date for input[type=date] (YYYY-MM-DD)
export const formatDateForInput = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Expense type labels
export const EXPENSE_TYPE_LABELS = {
  WASHING: 'Washing',
  FUEL: 'Fuel',
  VEHICLE_SERVICE: 'Vehicle Service',
  OFFICE: 'Office',
};

// Vehicle category labels
export const VEHICLE_CATEGORY_LABELS = {
  TWO_WHEELER: '2 Wheeler',
  FOUR_WHEELER: '4 Wheeler',
};

// Vehicle sub-category labels
export const VEHICLE_SUB_CATEGORY_LABELS = {
  HATCHBACK: 'Hatchback',
  SEDAN: 'Sedan',
  SUV: 'SUV',
  COMPACT_SUV: 'Compact SUV',
  MOTORCYCLE_ABOVE_200CC: 'Motorcycle Above 200cc',
  SCOOTY_ABOVE_125CC: 'Scooty Above 125cc',
  MOTORCYCLE_BELOW_200CC: 'Motorcycle Below 200cc',
  MUV: 'MUV',
  SCOOTY_BELOW_110CC: 'Scooty Below 110cc',
};

// Service expense type labels
export const SERVICE_EXPENSE_TYPE_LABELS = {
  RENT_SHARE: 'Rent Share',
  SERVICE: 'Service',
  PURCHASE: 'Purchase',
  TOLL_GATE: 'Toll Gate',
  EMI: 'EMI',
  PAINT: 'Paint',
  TOWING_CHARGE: 'Towing Charge',
  PUC: 'PUC',
  INSURANCE: 'Insurance',
  GPS: 'GPS',
  OTHER: 'Other',
};

// Washing service type labels
export const WASHING_SERVICE_TYPE_LABELS = {
  BODY_WASH: 'Body Wash',
  INTERIOR_CLEANING: 'Interior Cleaning',
  EXTERIOR_CLEANING: 'Exterior Cleaning',
  VACUUM_CLEANING: 'Vacuum Cleaning',
  POLISHING: 'Polishing',
  WAXING: 'Waxing',
  FULL_CLEANING: 'Full Cleaning',
  DETAILING: 'Detailing',
  OTHER: 'Other',
};

// Payment method labels
export const PAYMENT_METHOD_LABELS = {
  SBI: 'SBI',
  CASH: 'Cash',
  UPI: 'UPI',
  NA: 'N/A',
};

// Party type labels
export const PARTY_TYPE_LABELS = {
  FUEL_STATION: 'Fuel Station',
  WASHING_CENTER: 'Washing Center',
  SERVICE_CENTER: 'Service Center',
  SUPPLIER: 'Supplier',
  OFFICE_VENDOR: 'Office Vendor',
  OTHER: 'Other',
};

export const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

// Get current year
export const CURRENT_YEAR = new Date().getFullYear();

// Get range of years for select
export const getYearOptions = (from = 2020) => {
  const years = [];
  for (let y = CURRENT_YEAR; y >= from; y--) years.push(y);
  return years;
};

// Extract error message from axios error
export const getErrorMessage = (error) => {
  return error?.response?.data?.message || error?.message || 'An unexpected error occurred.';
};

// Format profit margin
export const formatMargin = (margin) => {
  if (margin === null || margin === undefined) return 'N/A';
  return margin.toFixed(2) + '%';
};
