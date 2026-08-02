'use strict';

const STORE = 'dealers_data_v2';
const DATA_VERSION = 9;
const THEME_STORE = 'dealers_theme_v2';
const memoryStorage = new Map();
const storageGet = key => { try { return localStorage.getItem(key); } catch { return memoryStorage.get(key) ?? null; } };
const storageSet = (key, value) => { try { localStorage.setItem(key, value); } catch { memoryStorage.set(key, value); } };
const $ = id => document.getElementById(id);
const round2 = value => Math.round((Number(value || 0) + Number.EPSILON) * 100) / 100;
const euro = value => new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(Number(value) || 0);
const compactEuro = value => new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(Number(value) || 0);
const pctText = value => `${Math.round(Number(value) || 0)}%`;
const makeId = () => globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`;
const todayISO = () => new Date().toISOString().slice(0, 10);
const escapeHtml = value => {
  const div = document.createElement('div');
  div.textContent = value ?? '';
  return div.innerHTML;
};

const ICONS = Object.freeze({
  wallet: `<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M5.25 7.25V6.9A2.4 2.4 0 0 1 7.65 4.5h9.1a2.1 2.1 0 0 1 2.1 2.1v.65"></path><rect x="3.5" y="7.25" width="17" height="10.75" rx="2.8"></rect><path d="M15.15 10.7h5.35v3.85h-5.35a1.92 1.92 0 0 1 0-3.85Z"></path><path d="M7.1 10.15h3.6"></path><circle cx="16.95" cy="12.62" r="0.9" fill="currentColor" stroke="none"></circle></svg>` ,
  globe: `<svg aria-hidden="true" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"></circle><path d="M3 12h18M12 3c2.2 2.45 3.3 5.45 3.3 9S14.2 18.55 12 21M12 3C9.8 5.45 8.7 8.45 8.7 12S9.8 18.55 12 21"></path></svg>`,
  savings: `<svg aria-hidden="true" class="savings-coins" viewBox="0 0 24 24"><ellipse cx="8" cy="14" rx="4" ry="2"></ellipse><path d="M4 14v4c0 1.15 1.8 2.05 4 2.05s4-.9 4-2.05v-4"></path><path d="M4 16.05c0 1.15 1.8 2.05 4 2.05s4-.9 4-2.05"></path><ellipse cx="15.5" cy="7.5" rx="4.5" ry="2.15"></ellipse><path d="M11 7.5v8.5c0 1.2 2 2.15 4.5 2.15S20 17.2 20 16V7.5"></path><path d="M11 11.7c0 1.2 2 2.15 4.5 2.15s4.5-.95 4.5-2.15"></path><path d="M11 15.9c0 1.2 2 2.15 4.5 2.15s4.5-.95 4.5-2.15"></path></svg>`,
  trend: `<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M4 19h16M6 16l4-4 3 2 5-7M15 7h3v3M7 19v-2M11 19v-4M15 19v-6M19 19V9"></path></svg>`,
  receipt: `<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M6 3.5h12v17l-2-1.4-2 1.4-2-1.4-2 1.4-2-1.4-2 1.4v-17Z"></path><path d="M9 8h6M9 12h6M9 16h4"></path></svg>`,
  calendar: `<svg aria-hidden="true" viewBox="0 0 24 24"><rect x="3.5" y="5.5" width="17" height="15" rx="2.5"></rect><path d="M7 3.5v4M17 3.5v4M3.5 10h17"></path><path d="m8 15 2 2 5-5"></path></svg>`,
  pie: `<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M11 3.5a8.5 8.5 0 1 0 8.5 8.5H11V3.5Z"></path><path d="M14 3.8A7.8 7.8 0 0 1 20.2 10H14V3.8Z"></path></svg>`,
  coins_down: `<svg aria-hidden="true" viewBox="0 0 24 24"><ellipse cx="9.5" cy="7" rx="4.5" ry="2"></ellipse><path d="M5 7v4c0 1.1 2 2 4.5 2s4.5-.9 4.5-2V7M5 11v4c0 1.1 2 2 4.5 2 1.2 0 2.3-.2 3.1-.5"></path><path d="M18 11v8m-3-3 3 3 3-3"></path></svg>`,
  coins: `<svg aria-hidden="true" viewBox="0 0 24 24"><ellipse cx="12" cy="6.5" rx="6" ry="2.5"></ellipse><path d="M6 6.5v5c0 1.4 2.7 2.5 6 2.5s6-1.1 6-2.5v-5M6 11.5v5c0 1.4 2.7 2.5 6 2.5s6-1.1 6-2.5v-5"></path></svg>`,
  car: `<svg aria-hidden="true" class="audi-rings" viewBox="0 0 76 24" preserveAspectRatio="xMidYMid meet"><circle cx="12" cy="12" r="9.2"></circle><circle cx="29.3" cy="12" r="9.2"></circle><circle cx="46.7" cy="12" r="9.2"></circle><circle cx="64" cy="12" r="9.2"></circle></svg>`,
  home: `<svg aria-hidden="true" viewBox="0 0 24 24"><path d="m3.5 11 8.5-7.5 8.5 7.5v8.5a1.5 1.5 0 0 1-1.5 1.5h-4.5v-6h-5v6H5a1.5 1.5 0 0 1-1.5-1.5V11Z"></path></svg>`,
  sparkles: `<svg aria-hidden="true" viewBox="0 0 24 24"><path d="m12 3 1.1 3.1L16.2 7.2l-3.1 1.1L12 11.5l-1.1-3.2-3.1-1.1 3.1-1.1L12 3Z"></path><path d="m18.2 13.2.8 2.1 2.1.8-2.1.8-.8 2.1-.8-2.1-2.1-.8 2.1-.8.8-2.1ZM5.2 14.3l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7.7-1.8Z"></path></svg>`,
  plus: `<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"></path></svg>`,
  arrow_down_circle: `<svg aria-hidden="true" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"></circle><path d="M12 7v10M8.5 13.5 12 17l3.5-3.5"></path></svg>`,
  arrow_up_circle: `<svg aria-hidden="true" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"></circle><path d="M12 17V7M8.5 10.5 12 7l3.5 3.5"></path></svg>`,
  calendar_check: `<svg aria-hidden="true" viewBox="0 0 24 24"><rect x="3.5" y="5.5" width="17" height="15" rx="2.5"></rect><path d="M7 3.5v4M17 3.5v4M3.5 10h17"></path><path d="m8 15 2 2 5-5"></path></svg>`,
  list: `<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M8 6h12M8 12h12M8 18h12"></path><circle cx="4" cy="6" r="1"></circle><circle cx="4" cy="12" r="1"></circle><circle cx="4" cy="18" r="1"></circle></svg>`,
  sliders: `<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M4 7h7M15 7h5M4 12h3M11 12h9M4 17h10M18 17h2"></path><circle cx="13" cy="7" r="2"></circle><circle cx="9" cy="12" r="2"></circle><circle cx="16" cy="17" r="2"></circle></svg>`,
  plus_circle: `<svg aria-hidden="true" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"></circle><path d="M12 8v8M8 12h8"></path></svg>`,
  basket: `<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M4 9h16l-1.5 10h-13L4 9Z"></path><path d="m8 9 4-5 4 5M9 13v3M15 13v3"></path></svg>`,
  droplet: `<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M5 21V4.5A1.5 1.5 0 0 1 6.5 3h7A1.5 1.5 0 0 1 15 4.5V21M4 21h12M8 7h4v4H8z"></path><path d="M15 8h2l2 2v7a2 2 0 0 0 2 2V9l-2-2"></path></svg>`,
  dumbbell: `<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M7 7v10M17 7v10M4 9v6M20 9v6M7 12h10"></path></svg>`,
  gamepad: `<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M7 8h10a4 4 0 0 1 3.8 5.2l-1.4 4.2a2 2 0 0 1-3.1 1l-2.1-1.7H9.8l-2.1 1.7a2 2 0 0 1-3.1-1l-1.4-4.2A4 4 0 0 1 7 8Z"></path><path d="M8 11v4M6 13h4M16 12h.01M18 14h.01"></path></svg>`,
  heart: `<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M12 21s-8-4.7-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 10c0 6.3-8 11-8 11Z"></path><path d="M8 12h2l1-2 2 4 1-2h2"></path></svg>`,
  bag: `<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M5 8h14l-1 13H6L5 8Z"></path><path d="M9 9V6a3 3 0 0 1 6 0v3"></path></svg>`,
  briefcase: `<svg aria-hidden="true" viewBox="0 0 24 24"><rect x="3.5" y="6.5" width="17" height="12" rx="2.5"></rect><path d="M8 6.5V4.5h8v2M3.5 11h17M10 14.5h4"></path></svg>`,
  dots: `<svg aria-hidden="true" viewBox="0 0 24 24"><circle cx="5" cy="12" r="1.5"></circle><circle cx="12" cy="12" r="1.5"></circle><circle cx="19" cy="12" r="1.5"></circle></svg>`,
  check_wallet: `<svg aria-hidden="true" viewBox="0 0 24 24"><rect x="3.5" y="6.5" width="17" height="11" rx="2.5"></rect><path d="M3.5 10h17M7 14h4"></path></svg>`,
  clock_calendar: `<svg aria-hidden="true" viewBox="0 0 24 24"><rect x="3.5" y="5.5" width="17" height="15" rx="2.5"></rect><path d="M7 3.5v4M17 3.5v4M3.5 10h17"></path><path d="m8 15 2 2 5-5"></path></svg>`,
});

const CATEGORY_META = {
  'Alimentação': { icon: ICONS.basket, color: '#12a594' },
  'Carro': { icon: ICONS.car, color: '#e29432' },
  'Combustível': { icon: ICONS.droplet, color: '#d56552' },
  'Casa': { icon: ICONS.home, color: '#5b83d6' },
  'Contas': { icon: ICONS.receipt, color: '#7e65cf' },
  'Ginásio': { icon: ICONS.dumbbell, color: '#4aa96c' },
  'Lazer': { icon: ICONS.gamepad, color: '#e15b8f' },
  'Saúde': { icon: ICONS.heart, color: '#47a3c7' },
  'Compras': { icon: ICONS.bag, color: '#9a71c5' },
  'Amortização': { icon: ICONS.coins_down, color: '#bf7b2b' },
  'Salário': { icon: ICONS.briefcase, color: '#1a9259' },
  'Poupança': { icon: ICONS.savings, color: '#0f988a' },
  'Investimentos': { icon: ICONS.trend, color: '#397bd8' },
  'Outros': { icon: ICONS.dots, color: '#84918e' }
};
const FALLBACK_COLORS = ['#12a594', '#e29432', '#5b83d6', '#e15b8f', '#7e65cf', '#d56552', '#4aa96c', '#47a3c7'];

function blank() {
  return {
    version: DATA_VERSION,
    balances: { current: 0, savings: 0, investments: 0, carFund: 0 },
    marketInvestments: [],
    savingsGoal: 0,
    carFundGoal: 0,
    annualRate: 0,
    transactions: [],
    annualClosures: {},
    monthlyBudgets: {},
    budgetDefaults: { savings: 0, amortization: 0, insurance: 0 },
    insuranceReserve: { balance: 0, monthlyDefault: 0, history: [] },
    appMeta: { lastOpenedYear: new Date().getFullYear() },
    carArchived: false,
    loan: {
      originalBalance: 0,
      balance: 0,
      payment: 0,
      annualRate: 0,
      stampRate: 0,
      nextDate: '',
      liquidatedDate: '',
      officialTotalPayments: 84,
      officialPaidPayments: 10,
      officialLastDate: '2032-09-01',
      officialScheduleActive: true,
      history: []
    }
  };
}

function normalize(data) {
  const source = data && typeof data === 'object' ? data : {};
  const base = blank();
  const sourceVersion = Number(source.version) || 0;
  const sourceLoan = source.loan || {};
  const paymentHistoryCount = Array.isArray(sourceLoan.history)
    ? sourceLoan.history.filter(item => item?.type === 'payment').length
    : 0;
  const hasExtraHistory = Array.isArray(sourceLoan.history)
    ? sourceLoan.history.some(item => item?.type === 'extra')
    : false;
  const normalizedLoan = {
    ...base.loan,
    ...sourceLoan,
    officialTotalPayments: Math.max(0, Number(sourceLoan.officialTotalPayments ?? 84) || 0),
    officialPaidPayments: Math.max(0, Number(sourceLoan.officialPaidPayments ?? Math.max(10, paymentHistoryCount)) || 0),
    officialLastDate: sourceLoan.officialLastDate || '2032-09-01',
    officialScheduleActive: sourceLoan.officialScheduleActive === undefined
      ? !hasExtraHistory
      : Boolean(sourceLoan.officialScheduleActive),
    history: Array.isArray(sourceLoan.history) ? sourceLoan.history : []
  };
  if (sourceVersion < 8 && Number(normalizedLoan.balance) > 0) {
    normalizedLoan.officialTotalPayments = 84;
    normalizedLoan.officialPaidPayments = 10;
    normalizedLoan.officialLastDate = '2032-09-01';
    normalizedLoan.officialScheduleActive = !hasExtraHistory;
    normalizedLoan.nextDate = '2026-08-01';
  }
  normalizedLoan.officialPaidPayments = Math.min(
    normalizedLoan.officialTotalPayments || normalizedLoan.officialPaidPayments,
    normalizedLoan.officialPaidPayments
  );
  if (Number(normalizedLoan.originalBalance) > 0 && Number(normalizedLoan.balance) <= 0.005 && !normalizedLoan.liquidatedDate) {
    const lastRecord = [...normalizedLoan.history].sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')))[0];
    normalizedLoan.liquidatedDate = lastRecord?.date || '';
  }
  return {
    ...base,
    ...source,
    version: DATA_VERSION,
    balances: { ...base.balances, ...(source.balances || {}) },
    loan: normalizedLoan,
    annualClosures: source.annualClosures && typeof source.annualClosures === 'object' ? source.annualClosures : {},
    monthlyBudgets: source.monthlyBudgets && typeof source.monthlyBudgets === 'object' ? source.monthlyBudgets : {},
    budgetDefaults: { ...base.budgetDefaults, ...(source.budgetDefaults || {}) },
    insuranceReserve: { ...base.insuranceReserve, ...(source.insuranceReserve || {}), history: Array.isArray(source.insuranceReserve?.history) ? source.insuranceReserve.history : [] },
    appMeta: { ...base.appMeta, ...(source.appMeta || {}) },
    carArchived: Boolean(source.carArchived),
    transactions: Array.isArray(source.transactions)
      ? source.transactions.map(transaction => {
          const item = { ...transaction };
          if (item.type === 'income' && item.from === 'external' && item.to === 'external' && !item.externalIncome) item.type = 'expense';
          return item;
        })
      : [],
    marketInvestments: Array.isArray(source.marketInvestments) ? source.marketInvestments : []
  };
}

function load() {
  try {
    return normalize(JSON.parse(storageGet(STORE)) || blank());
  } catch {
    return blank();
  }
}

let vault = load();
let selectedExpenseMonth = new Date().toISOString().slice(0, 7);
let currentPage = 'home';
let selectedAnnualYear = null;
let selectedBudgetMonth = new Date().toISOString().slice(0, 7);
let selectedExteriorMonth = new Date().toISOString().slice(0, 7);
let selectedExteriorPeriod = 'month';

function save() {
  vault.version = DATA_VERSION;
  storageSet(STORE, JSON.stringify(vault));
}

function setText(id, value) {
  const element = $(id);
  if (element) element.textContent = value;
}

function setWidth(id, value) {
  const element = $(id);
  if (element) element.style.width = `${Math.max(0, Math.min(100, Number(value) || 0))}%`;
}

function datePT(value, options = {}) {
  if (!value) return '—';
  return new Date(`${value}T12:00:00`).toLocaleDateString('pt-PT', options);
}

function monthLabel(monthKey, format = 'long') {
  const [year, month] = monthKey.split('-').map(Number);
  const label = new Date(year, month - 1, 1).toLocaleDateString('pt-PT', format === 'short'
    ? { month: 'short' }
    : { month: 'long', year: 'numeric' });
  return label.charAt(0).toUpperCase() + label.slice(1).replace('.', '');
}

function addMonths(dateValue, count) {
  if (!dateValue) return '';
  const date = new Date(`${dateValue}T12:00:00`);
  date.setMonth(date.getMonth() + count);
  return date.toISOString().slice(0, 10);
}

function previousMonth(monthKey) {
  const [year, month] = monthKey.split('-').map(Number);
  const date = new Date(year, month - 2, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function daysInMonth(monthKey) {
  const [year, month] = monthKey.split('-').map(Number);
  return new Date(year, month, 0).getDate();
}

function daysElapsedInMonth(monthKey) {
  const now = new Date();
  const currentKey = now.toISOString().slice(0, 7);
  return monthKey === currentKey ? now.getDate() : daysInMonth(monthKey);
}

function sumBalances() {
  const b = vault.balances;
  return round2(Number(b.current) + Number(b.savings) + Number(b.investments) + Number(b.carFund));
}

function isExteriorIncome(transaction) {
  return transaction?.type === 'income' && transaction.from === 'external' && transaction.to === 'external' && transaction.externalIncome === true;
}

function isExteriorExpense(transaction) {
  return transaction?.type === 'expense' && transaction.from === 'external' && transaction.to === 'external';
}

function exteriorBalance() {
  return round2(vault.transactions.reduce((total, transaction) => {
    const amount = Number(transaction.amount || 0);
    if (isExteriorIncome(transaction)) return total + amount;
    if (isExteriorExpense(transaction)) return total - amount;
    if (transaction.type === 'transfer' && transaction.from === 'external' && transaction.to !== 'external') return total - amount;
    if (transaction.type === 'transfer' && transaction.to === 'external' && transaction.from !== 'external') return total + amount;
    return total;
  }, 0));
}

function exteriorStats(period = 'month') {
  const now = new Date();
  const monthKey = now.toISOString().slice(0, 7);
  const yearKey = String(now.getFullYear());
  const inPeriod = transaction => {
    const date = String(transaction.date || '');
    if (period === 'all') return true;
    if (period === 'year') return date.startsWith(yearKey);
    return date.startsWith(monthKey);
  };
  const income = round2(vault.transactions.filter(transaction => isExteriorIncome(transaction) && inPeriod(transaction)).reduce((sum, transaction) => sum + Number(transaction.amount || 0), 0));
  const expense = round2(vault.transactions.filter(transaction => isExteriorExpense(transaction) && inPeriod(transaction)).reduce((sum, transaction) => sum + Number(transaction.amount || 0), 0));
  return { income, expense, net: round2(income - expense) };
}

function sumStablePatrimony() {
  const currentMonth = currentMonthKey();
  const pendingInsurance = Object.entries(vault.monthlyBudgets || {}).reduce((sum, [month, budget]) => month <= currentMonth ? sum + Number(budget?.reserves?.insurance || 0) : sum, 0);
  return round2(sumBalances() + exteriorBalance() - pendingInsurance);
}

function sumPatrimonyTotal() {
  return round2(sumStablePatrimony() + marketPortfolioSummary().current);
}

function installmentParts(balance = vault.loan.balance, payment = vault.loan.payment) {
  const interest = round2(balance * (Number(vault.loan.annualRate) / 12));
  const stamp = round2(interest * Number(vault.loan.stampRate));
  const capital = round2(Math.min(balance, Math.max(0, Number(payment) - interest - stamp)));
  return { interest, stamp, capital, total: round2(capital + interest + stamp) };
}

function loanHasExtraAmortization() {
  return vault.loan.officialScheduleActive === false
    || vault.loan.history.some(item => item?.type === 'extra');
}

function projectLoan() {
  let balance = Number(vault.loan.balance) || 0;
  const payment = Number(vault.loan.payment) || 0;
  if (balance <= 0 || payment <= 0) {
    return { count: 0, payoffDate: '', interestTotal: 0, mode: 'liquidated' };
  }

  const totalPayments = Math.max(0, Number(vault.loan.officialTotalPayments) || 0);
  const paidPayments = Math.max(0, Number(vault.loan.officialPaidPayments) || 0);
  const useOfficialSchedule = !loanHasExtraAmortization() && totalPayments > 0;

  if (useOfficialSchedule) {
    const count = Math.max(0, totalPayments - Math.min(totalPayments, paidPayments));
    const payoffDate = vault.loan.officialLastDate
      || (count > 0 ? addMonths(vault.loan.nextDate || todayISO(), count - 1) : '');
    const interestTotal = round2(Math.max(0, count * payment - balance));
    return { count, payoffDate, interestTotal, mode: 'official' };
  }

  let count = 0;
  let interestTotal = 0;
  let date = vault.loan.nextDate || todayISO();

  while (balance > 0.005 && count < 600) {
    const parts = installmentParts(balance, vault.loan.payment);
    if (parts.capital <= 0) break;
    balance = round2(Math.max(0, balance - parts.capital));
    interestTotal += parts.interest + parts.stamp;
    count += 1;
    if (balance > 0) date = addMonths(date, 1);
  }

  return { count, payoffDate: date, interestTotal: round2(interestTotal), mode: 'simulation' };
}

function getMonthStats(monthKey = selectedExpenseMonth) {
  const expenses = vault.transactions.filter(t => t.type === 'expense' && String(t.date || '').slice(0, 7) === monthKey);
  const incomes = vault.transactions.filter(t => t.type === 'income' && String(t.date || '').slice(0, 7) === monthKey);
  const expense = round2(expenses.reduce((sum, t) => sum + Number(t.amount || 0), 0));
  const income = round2(incomes.reduce((sum, t) => sum + Number(t.amount || 0), 0));
  const categories = {};
  expenses.forEach(t => {
    const category = t.category || 'Outros';
    categories[category] = round2((categories[category] || 0) + Number(t.amount || 0));
  });
  const sortedCategories = Object.entries(categories).sort((a, b) => b[1] - a[1]);
  return { income, expense, balance: round2(income - expense), expenses, incomes, categories, sortedCategories };
}

function currentYearExpenses() {
  const year = String(new Date().getFullYear());
  return round2(vault.transactions
    .filter(t => t.type === 'expense' && String(t.date || '').startsWith(year))
    .reduce((sum, t) => sum + Number(t.amount || 0), 0));
}


function loanIsLiquidated() {
  return Number(vault.loan.originalBalance) > 0 && Number(vault.loan.balance) <= 0.005;
}

function loanHistorySummary() {
  const items = [...vault.loan.history].sort((a, b) => String(a.date || '').localeCompare(String(b.date || '')));
  const payments = items.filter(item => item.type === 'payment');
  const extras = items.filter(item => item.type === 'extra');
  const totalPaid = round2(items.reduce((sum, item) => sum + Number(item.total ?? item.amount ?? 0), 0));
  const interestPaid = round2(payments.reduce((sum, item) => sum + Number(item.interest || 0) + Number(item.stamp || 0), 0));
  const extrasPaid = round2(extras.reduce((sum, item) => sum + Number(item.amount || 0), 0));
  return {
    totalPaid,
    interestPaid,
    extrasPaid,
    paymentCount: payments.length,
    firstDate: items[0]?.date || '',
    lastDate: items[items.length - 1]?.date || ''
  };
}

function syncLoanStatus() {
  let changed = false;
  if (loanIsLiquidated()) {
    if (!vault.loan.liquidatedDate) {
      vault.loan.liquidatedDate = loanHistorySummary().lastDate || todayISO();
      changed = true;
    }
  } else {
    if (vault.loan.liquidatedDate) {
      vault.loan.liquidatedDate = '';
      changed = true;
    }
    if (vault.carArchived) {
      vault.carArchived = false;
      changed = true;
    }
  }
  if (changed) save();
}

function annualFlowStats(year) {
  const yearKey = String(year);
  const transactions = vault.transactions.filter(transaction => String(transaction.date || '').startsWith(yearKey));
  const income = round2(transactions.filter(transaction => transaction.type === 'income').reduce((sum, transaction) => sum + Number(transaction.amount || 0), 0));
  const expense = round2(transactions.filter(transaction => transaction.type === 'expense').reduce((sum, transaction) => sum + Number(transaction.amount || 0), 0));
  const exteriorIncome = round2(transactions.filter(isExteriorIncome).reduce((sum, transaction) => sum + Number(transaction.amount || 0), 0));
  const exteriorExpense = round2(transactions.filter(isExteriorExpense).reduce((sum, transaction) => sum + Number(transaction.amount || 0), 0));
  const accountFlow = account => {
    const incoming = transactions.filter(transaction => transaction.to === account || (account === 'savings' && transaction.type === 'saving') || (account === 'investments' && transaction.type === 'investment') || (account === 'carFund' && transaction.type === 'carfund')).reduce((sum, transaction) => sum + Number(transaction.amount || 0), 0);
    const outgoing = transactions.filter(transaction => transaction.from === account).reduce((sum, transaction) => sum + Number(transaction.amount || 0), 0);
    return { incoming: round2(incoming), outgoing: round2(outgoing), net: round2(incoming - outgoing) };
  };
  return {
    income,
    expense,
    net: round2(income - expense),
    exteriorIncome,
    exteriorExpense,
    exteriorNet: round2(exteriorIncome - exteriorExpense),
    savings: accountFlow('savings'),
    investments: accountFlow('investments'),
    carFund: accountFlow('carFund')
  };
}

function annualLoanStats(year) {
  const yearKey = String(year);
  const items = vault.loan.history.filter(item => String(item.date || '').startsWith(yearKey));
  const payments = items.filter(item => item.type === 'payment');
  const extras = items.filter(item => item.type === 'extra');
  return {
    paid: round2(items.reduce((sum, item) => sum + Number(item.total ?? item.amount ?? 0), 0)),
    paymentsPaid: round2(payments.reduce((sum, item) => sum + Number(item.total || 0), 0)),
    extrasPaid: round2(extras.reduce((sum, item) => sum + Number(item.amount || 0), 0)),
    interestPaid: round2(payments.reduce((sum, item) => sum + Number(item.interest || 0) + Number(item.stamp || 0), 0)),
    paymentCount: payments.length,
    extraCount: extras.length
  };
}

function buildAnnualClosure(year, options = {}) {
  const yearKey = String(year);
  const existing = vault.annualClosures?.[yearKey];
  const preserveSnapshot = Boolean(options.preserveSnapshot && existing);
  const flow = annualFlowStats(year);
  const loanYear = annualLoanStats(year);
  const market = marketPortfolioSummary();
  const snapshot = preserveSnapshot ? existing.snapshot : {
    current: round2(vault.balances.current),
    savings: round2(vault.balances.savings),
    investments: round2(vault.balances.investments),
    carFund: round2(vault.balances.carFund),
    insuranceReserve: round2(vault.insuranceReserve?.balance || 0),
    exterior: round2(exteriorBalance()),
    marketInvested: round2(market.invested),
    marketCurrent: round2(market.current),
    marketResult: round2(market.result),
    patrimonyTotal: round2(sumPatrimonyTotal()),
    loanBalance: round2(vault.loan.balance)
  };
  const marketStartedInYear = round2(vault.marketInvestments
    .filter(item => String(item.date || '').startsWith(yearKey))
    .reduce((sum, item) => sum + Number(item.invested || 0), 0));
  return {
    year: Number(year),
    createdAt: existing?.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    automatic: Boolean(options.automatic),
    flow,
    loan: {
      ...loanYear,
      balanceAtClose: snapshot.loanBalance,
      liquidated: snapshot.loanBalance <= 0.005 && Number(vault.loan.originalBalance) > 0,
      liquidatedDate: vault.loan.liquidatedDate || ''
    },
    investments: {
      startedInYear: marketStartedInYear,
      investedAtClose: snapshot.marketInvested,
      marketValueAtClose: snapshot.marketCurrent,
      resultAtClose: snapshot.marketResult,
      returnAtClose: snapshot.marketInvested > 0 ? (snapshot.marketResult / snapshot.marketInvested) * 100 : 0
    },
    snapshot
  };
}

function saveAnnualClosure(year, options = {}) {
  if (!vault.annualClosures || typeof vault.annualClosures !== 'object') vault.annualClosures = {};
  vault.annualClosures[String(year)] = buildAnnualClosure(year, options);
  selectedAnnualYear = String(year);
  save();
}

function refreshAnnualClosureForDate(dateValue) {
  const year = String(dateValue || '').slice(0, 4);
  if (!/^\d{4}$/.test(year) || !vault.annualClosures?.[year]) return;
  saveAnnualClosure(Number(year), {
    preserveSnapshot: true,
    automatic: Boolean(vault.annualClosures[year]?.automatic)
  });
}

function ensureAnnualTransition() {
  const currentYear = new Date().getFullYear();
  const lastOpenedYear = Number(vault.appMeta?.lastOpenedYear || currentYear);
  if (lastOpenedYear < currentYear) {
    for (let year = lastOpenedYear; year < currentYear; year += 1) {
      saveAnnualClosure(year, { automatic: true });
    }
  }
  if (!vault.appMeta || vault.appMeta.lastOpenedYear !== currentYear) {
    vault.appMeta = { ...(vault.appMeta || {}), lastOpenedYear: currentYear };
    save();
  }
}

function renderCarState() {
  const liquidated = loanIsLiquidated();
  document.querySelectorAll('[data-car-active]').forEach(element => { element.hidden = liquidated; });
  if ($('carLiquidatedPanel')) $('carLiquidatedPanel').hidden = !liquidated;
  if ($('homeCarFundGoalCard')) $('homeCarFundGoalCard').hidden = liquidated;
  if ($('carNavButton')) $('carNavButton').hidden = Boolean(vault.carArchived);
  document.querySelector('.bottom-nav')?.classList.toggle('car-archived', Boolean(vault.carArchived));
  if ($('archivedCarCard')) $('archivedCarCard').hidden = !vault.carArchived;

  const summary = loanHistorySummary();
  setText('carLiquidatedDate', vault.loan.liquidatedDate ? `Liquidado em ${datePT(vault.loan.liquidatedDate)}` : 'Crédito liquidado');
  setText('carClosedOriginal', euro(vault.loan.originalBalance));
  setText('carClosedPaid', euro(summary.totalPaid));
  setText('carClosedInterest', euro(summary.interestPaid));
  setText('carClosedPayments', summary.paymentCount);
  setText('carClosedExtras', euro(summary.extrasPaid));
  setText('carClosedLastDate', datePT(summary.lastDate));
  setText('carClosedFund', euro(vault.balances.carFund));
  setText('archivedCarDate', vault.loan.liquidatedDate ? `Liquidado em ${datePT(vault.loan.liquidatedDate)}` : 'Crédito liquidado');
}

function renderAnnualHistory() {
  const currentYear = new Date().getFullYear();
  const currentFlow = annualFlowStats(currentYear);
  setText('annualCurrentIncome', euro(currentFlow.income));
  setText('annualCurrentExpense', euro(currentFlow.expense));
  const currentNet = $('annualCurrentNet');
  if (currentNet) {
    currentNet.textContent = `${currentFlow.net > 0 ? '+' : currentFlow.net < 0 ? '−' : ''}${euro(Math.abs(currentFlow.net))}`;
    currentNet.className = currentFlow.net > 0 ? 'positive' : currentFlow.net < 0 ? 'negative' : '';
  }
  setText('annualCurrentPatrimony', euro(sumPatrimonyTotal()));
  setText('annualCloseHeading', `Fechar ${currentYear}`);
  const closeButton = $('closeCurrentYearButton');
  if (closeButton) closeButton.textContent = vault.annualClosures[String(currentYear)] ? `Atualizar fecho de ${currentYear}` : `Fechar ${currentYear} agora`;

  const years = Object.keys(vault.annualClosures || {}).sort((a, b) => Number(b) - Number(a));
  const list = $('annualYearList');
  if (list) {
    list.innerHTML = years.length ? years.map(year => {
      const closure = vault.annualClosures[year];
      const selected = String(selectedAnnualYear || years[0]) === String(year);
      return `<button class="annual-year-row ${selected ? 'active' : ''}" data-annual-year="${escapeHtml(year)}" type="button"><span><strong>${escapeHtml(year)}</strong><small>${closure.automatic ? 'Fecho automático' : 'Fecho manual'}</small></span><span><strong>${euro(closure.snapshot?.patrimonyTotal || 0)}</strong><small>Património total</small></span><span aria-hidden="true">›</span></button>`;
    }).join('') : '<div class="empty-state"><span>📅</span>Ainda não existe nenhum ano fechado.</div>';
  }

  if (!selectedAnnualYear || !vault.annualClosures[String(selectedAnnualYear)]) selectedAnnualYear = years[0] || null;
  const detail = $('annualDetail');
  const empty = $('annualDetailEmpty');
  const closure = selectedAnnualYear ? vault.annualClosures[String(selectedAnnualYear)] : null;
  if (!detail || !empty) return;
  empty.hidden = Boolean(closure);
  detail.hidden = !closure;
  if (!closure) return;

  const flow = closure.flow || {};
  const snapshot = closure.snapshot || {};
  const investments = closure.investments || {};
  const loan = closure.loan || {};
  detail.innerHTML = `
    <div class="annual-detail-head"><div><span class="eyebrow">Fecho guardado</span><h2>Resumo de ${escapeHtml(closure.year)}</h2><p>Fotografia criada em ${datePT(String(closure.createdAt || '').slice(0, 10))}.</p></div><span class="annual-status-badge">Fechado</span></div>
    <div class="annual-detail-section"><h3>Ganhos e gastos</h3><div class="annual-value-list">
      <div><span>Receitas totais</span><strong class="positive">+${euro(flow.income || 0)}</strong></div>
      <div><span>Despesas totais</span><strong class="negative">−${euro(flow.expense || 0)}</strong></div>
      <div class="annual-total-row"><span>Saldo do ano</span><strong class="${Number(flow.net) >= 0 ? 'positive' : 'negative'}">${Number(flow.net) >= 0 ? '+' : '−'}${euro(Math.abs(Number(flow.net) || 0))}</strong></div>
    </div></div>
    <div class="annual-detail-section"><h3>Movimentos exteriores</h3><div class="annual-value-list">
      <div><span>Receitas exteriores</span><strong class="positive">+${euro(flow.exteriorIncome || 0)}</strong></div>
      <div><span>Despesas exteriores</span><strong class="negative">−${euro(flow.exteriorExpense || 0)}</strong></div>
      <div class="annual-total-row"><span>Saldo exterior no fecho</span><strong>${euro(snapshot.exterior || 0)}</strong></div>
    </div></div>
    <div class="annual-detail-section"><h3>Poupança e património</h3><div class="annual-value-list">
      <div><span>Poupança final</span><strong>${euro(snapshot.savings || 0)}</strong></div>
      <div><span>Dinheiro a render</span><strong>${euro(snapshot.investments || 0)}</strong></div>
      <div><span>Fundo carro</span><strong>${euro(snapshot.carFund || 0)}</strong></div>
      <div><span>Conta corrente</span><strong>${euro(snapshot.current || 0)}</strong></div>
      <div><span>Reserva do seguro (fora do património)</span><strong>${euro(snapshot.insuranceReserve || 0)}</strong></div>
      <div class="annual-total-row"><span>Património total</span><strong class="positive">${euro(snapshot.patrimonyTotal || 0)}</strong></div>
    </div></div>
    <div class="annual-detail-section"><h3>ETF e ações</h3><div class="annual-value-list">
      <div><span>Valor investido acumulado</span><strong>${euro(investments.investedAtClose || 0)}</strong></div>
      <div><span>Valor de mercado no fecho</span><strong>${euro(investments.marketValueAtClose || 0)}</strong></div>
      <div><span>Resultado</span><strong class="${Number(investments.resultAtClose) >= 0 ? 'positive' : 'negative'}">${Number(investments.resultAtClose) >= 0 ? '+' : ''}${euro(investments.resultAtClose || 0)}</strong></div>
      <div><span>Rentabilidade</span><strong>${Number(investments.returnAtClose || 0).toFixed(2).replace('.', ',')}%</strong></div>
    </div></div>
    <div class="annual-detail-section"><h3>Crédito automóvel</h3><div class="annual-value-list">
      <div><span>Total pago no ano</span><strong>${euro(loan.paid || 0)}</strong></div>
      <div><span>Amortizações extra</span><strong>${euro(loan.extrasPaid || 0)}</strong></div>
      <div><span>Juros e imposto pagos</span><strong>${euro(loan.interestPaid || 0)}</strong></div>
      <div><span>Dívida restante</span><strong>${euro(loan.balanceAtClose || 0)}</strong></div>
      <div class="annual-total-row"><span>Estado</span><strong class="${loan.liquidated ? 'positive' : ''}">${loan.liquidated ? 'Crédito liquidado' : 'Em curso'}</strong></div>
    </div></div>
    <button class="secondary-btn full" data-recalculate-annual="${escapeHtml(String(closure.year))}" type="button">Recalcular movimentos de ${escapeHtml(String(closure.year))}</button>`;
}

function netFlowForMonth(monthKey) {
  const stats = getMonthStats(monthKey);
  return round2(stats.income - stats.expense);
}

function categoryMeta(category, index = 0) {
  return CATEGORY_META[category] || { icon: ICONS.dots, color: FALLBACK_COLORS[index % FALLBACK_COLORS.length] };
}

function renderTransactions() {
  const target = $('txList');
  if (!target) return;
  const items = [...vault.transactions]
    .sort((a, b) => `${b.date || ''}${b.id || ''}`.localeCompare(`${a.date || ''}${a.id || ''}`))
    .slice(0, 10);

  if (!items.length) {
    target.innerHTML = '<div class="empty-state"><span>↗</span>Ainda não existem movimentos.<br>Adiciona o primeiro para veres os teus resumos.</div>';
    return;
  }

  target.innerHTML = items.map((t, index) => transactionRowHtml(t, index, true)).join('');
  target.querySelectorAll('[data-delete-tx]').forEach(button => {
    button.addEventListener('click', () => deleteTransaction(button.dataset.deleteTx));
  });
}

function transactionRowHtml(t, index = 0, canDelete = false) {
  const typeLabels = { income: 'Receita', expense: 'Despesa', transfer: 'Transferência', saving: 'Poupança', investment: 'Investimento', carfund: 'Fundo carro' };
  const meta = categoryMeta(t.category || 'Outros', index);
  const displayType = t.type;
  const sign = displayType === 'income' ? '+' : displayType === 'expense' ? '−' : '';
  const route = isExteriorIncome(t) ? 'Receita exterior' : isExteriorExpense(t) ? 'Despesa exterior' : t.from && t.to ? `${accountLabel(t.from)} → ${accountLabel(t.to)}` : (t.category || typeLabels[displayType] || 'Movimento');
  const deleteButton = canDelete && !t.locked
    ? `<button class="tx-delete" type="button" data-delete-tx="${escapeHtml(t.id)}">Eliminar</button>`
    : '';
  return `<div class="tx-row">
    <span class="tx-icon" style="background:${meta.color}20;color:${meta.color}">${meta.icon}</span>
    <div class="tx-main"><strong>${escapeHtml(t.description || typeLabels[t.type] || 'Movimento')}</strong><small>${escapeHtml(route)} · ${datePT(t.date)}</small></div>
    <div><strong class="tx-amount ${escapeHtml(displayType)}">${sign}${euro(t.amount)}</strong>${deleteButton}</div>
  </div>`;
}

function deleteTransaction(id) {
  const index = vault.transactions.findIndex(t => t.id === id);
  if (index < 0) return;
  const t = vault.transactions[index];
  if (!confirm(`Eliminar o movimento “${t.description}”?`)) return;

  const amount = Number(t.amount) || 0;
  if (t.from && t.to) {
    const fromKey = BALANCE_KEY_BY_ACCOUNT[t.from];
    const toKey = BALANCE_KEY_BY_ACCOUNT[t.to];
    if (toKey && Number(vault.balances[toKey] || 0) < amount) {
      return alert(`Não é possível eliminar: o saldo em ${accountLabel(t.to)} já é inferior a este movimento.`);
    }
    if (toKey) vault.balances[toKey] = round2(Number(vault.balances[toKey] || 0) - amount);
    if (fromKey) vault.balances[fromKey] = round2(Number(vault.balances[fromKey] || 0) + amount);
    vault.transactions.splice(index, 1);
    save();
    refreshAnnualClosureForDate(t.date);
    render();
    return;
  }
  if (t.type === 'income') vault.balances.current = round2(vault.balances.current - amount);
  if (t.type === 'expense') vault.balances.current = round2(vault.balances.current + amount);
  if (t.type === 'saving') {
    if (vault.balances.savings < amount) return alert('Não é possível eliminar: o saldo da poupança já é inferior a este movimento.');
    vault.balances.savings = round2(vault.balances.savings - amount);
    vault.balances.current = round2(vault.balances.current + amount);
  }
  if (t.type === 'investment') {
    if (vault.balances.investments < amount) return alert('Não é possível eliminar: o saldo de investimentos já é inferior a este movimento.');
    vault.balances.investments = round2(vault.balances.investments - amount);
    vault.balances.current = round2(vault.balances.current + amount);
  }
  if (t.type === 'carfund') {
    if (vault.balances.carFund < amount) return alert('Não é possível eliminar: o fundo carro já é inferior a este movimento.');
    vault.balances.carFund = round2(vault.balances.carFund - amount);
    vault.balances.current = round2(vault.balances.current + amount);
  }

  vault.transactions.splice(index, 1);
  save();
  refreshAnnualClosureForDate(t.date);
  render();
}

function renderExpenseMonthOptions() {
  const select = $('expenseMonthSelect');
  if (!select) return;
  const months = new Set();
  const now = new Date();
  for (let i = 0; i < 18; i += 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  }
  vault.transactions.forEach(t => {
    const key = String(t.date || '').slice(0, 7);
    if (/^\d{4}-\d{2}$/.test(key)) months.add(key);
  });
  const sorted = [...months].sort().reverse();
  if (!months.has(selectedExpenseMonth)) selectedExpenseMonth = sorted[0];
  select.innerHTML = sorted.map(month => `<option value="${month}" ${month === selectedExpenseMonth ? 'selected' : ''}>${monthLabel(month)}</option>`).join('');
}

function renderExpenses() {
  const stats = getMonthStats(selectedExpenseMonth);
  const previous = getMonthStats(previousMonth(selectedExpenseMonth));
  const elapsed = Math.max(1, daysElapsedInMonth(selectedExpenseMonth));
  const average = round2(stats.expense / elapsed);
  const isCurrent = selectedExpenseMonth === new Date().toISOString().slice(0, 7);
  const forecast = isCurrent ? round2(average * daysInMonth(selectedExpenseMonth)) : stats.expense;
  const spendingRatio = stats.income > 0 ? round2((stats.expense / stats.income) * 100) : null;

  setText('expenseTotal', euro(stats.expense));
  setText('expenseDailyAvg', euro(average));
  setText('expenseForecast', euro(forecast));
  setText('expenseIncomeRatio', spendingRatio === null ? (stats.expense > 0 ? '—' : '0%') : pctText(spendingRatio));
  setText('expenseIncomeRatioSub', spendingRatio === null && stats.expense > 0 ? 'sem ganhos registados' : 'dos ganhos do mês');
  setText('expenseDonutTotal', euro(stats.expense));

  const comparisonElement = $('expenseVsLast');
  if (comparisonElement) {
    if (previous.expense <= 0 && stats.expense <= 0) {
      comparisonElement.textContent = 'Sem comparação';
      comparisonElement.className = 'metric-tag neutral';
    } else if (previous.expense <= 0) {
      comparisonElement.textContent = 'Primeiro mês com dados';
      comparisonElement.className = 'metric-tag neutral';
    } else {
      const difference = ((stats.expense - previous.expense) / previous.expense) * 100;
      comparisonElement.textContent = `${difference > 0 ? '↑' : '↓'} ${Math.abs(difference).toFixed(0)}% vs. mês anterior`;
      comparisonElement.className = `metric-tag ${difference > 0 ? 'up' : 'down'}`;
    }
  }

  const legend = $('expenseLegend');
  if (legend) {
    legend.innerHTML = stats.sortedCategories.length
      ? stats.sortedCategories.slice(0, 8).map(([category, amount], index) => {
          const meta = categoryMeta(category, index);
          const percentage = stats.expense ? Math.round((amount / stats.expense) * 100) : 0;
          return `<div class="legend-item"><span class="legend-dot" style="background:${meta.color}"></span><span>${escapeHtml(category)}</span><strong>${percentage}%</strong></div>`;
        }).join('')
      : '<span class="muted">Sem despesas neste período.</span>';
  }

  const breakdown = $('categoryBreakdown');
  if (breakdown) {
    breakdown.innerHTML = stats.sortedCategories.length
      ? stats.sortedCategories.map(([category, amount], index) => {
          const meta = categoryMeta(category, index);
          const percentage = stats.expense ? Math.round((amount / stats.expense) * 100) : 0;
          return `<div class="category-row"><span class="cat-icon" style="background:${meta.color}20;color:${meta.color}">${meta.icon}</span><div class="category-body"><div class="category-title"><strong>${escapeHtml(category)}</strong><span>${percentage}%</span></div><div class="mini-progress"><span style="width:${percentage}%;background:${meta.color}"></span></div></div><strong>${euro(amount)}</strong></div>`;
        }).join('')
      : '<div class="empty-state"><span>🧾</span>Não existem despesas neste mês.</div>';
  }

  const expenseList = $('expenseList');
  if (expenseList) {
    const items = [...stats.expenses].sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')));
    expenseList.innerHTML = items.length
      ? items.map((t, index) => transactionRowHtml(t, index, true)).join('')
      : '<div class="empty-state"><span>🧾</span>Não existem despesas neste mês.</div>';
  }

  requestAnimationFrame(renderExpenseCharts);
}

function lastSixMonths() {
  const [year, month] = selectedExpenseMonth.split('-').map(Number);
  const result = [];
  for (let i = 5; i >= 0; i -= 1) {
    const d = new Date(year, month - 1 - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    result.push({ key, label: monthLabel(key, 'short'), value: getMonthStats(key).expense });
  }
  return result;
}

function setupCanvas(canvas) {
  if (!canvas) return null;
  const rect = canvas.getBoundingClientRect();
  const width = Math.max(240, rect.width || canvas.parentElement?.clientWidth || 320);
  const height = Math.max(200, rect.height || width);
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  canvas.width = Math.round(width * dpr);
  canvas.height = Math.round(height * dpr);
  const ctx = canvas.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { ctx, width, height };
}

function drawDonut(canvas, entries, total) {
  const setup = setupCanvas(canvas);
  if (!setup) return;
  const { ctx, width, height } = setup;
  ctx.clearRect(0, 0, width, height);
  const centerX = width / 2;
  const centerY = height / 2;
  const radius = Math.min(width, height) * 0.38;
  const lineWidth = Math.max(18, radius * 0.23);
  const style = getComputedStyle(document.documentElement);
  const soft = style.getPropertyValue('--soft').trim() || '#e7f0ee';

  ctx.lineWidth = lineWidth;
  ctx.lineCap = 'round';
  ctx.strokeStyle = soft;
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.stroke();

  if (total <= 0) return;
  let start = -Math.PI / 2;
  entries.forEach(([category, amount], index) => {
    const portion = amount / total;
    const gap = Math.min(0.035, portion * 0.2);
    const end = start + Math.PI * 2 * portion;
    ctx.strokeStyle = categoryMeta(category, index).color;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, start + gap, end - gap);
    ctx.stroke();
    start = end;
  });
}

function drawBars(canvas, data) {
  const setup = setupCanvas(canvas);
  if (!setup) return;
  const { ctx, width, height } = setup;
  ctx.clearRect(0, 0, width, height);
  const style = getComputedStyle(document.documentElement);
  const muted = style.getPropertyValue('--muted').trim() || '#71807d';
  const line = style.getPropertyValue('--line').trim() || '#dce8e5';
  const brand = style.getPropertyValue('--brand').trim() || '#087d72';
  const brand2 = style.getPropertyValue('--brand-2').trim() || '#12aa9b';
  const padding = { top: 18, right: 10, bottom: 42, left: 10 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;
  const maxValue = Math.max(...data.map(d => d.value), 1);
  const slot = chartW / data.length;
  const barW = Math.min(48, slot * 0.55);

  ctx.strokeStyle = line;
  ctx.lineWidth = 1;
  for (let i = 0; i <= 3; i += 1) {
    const y = padding.top + (chartH / 3) * i;
    ctx.beginPath();
    ctx.moveTo(padding.left, y);
    ctx.lineTo(width - padding.right, y);
    ctx.stroke();
  }

  const gradient = ctx.createLinearGradient(0, padding.top, 0, padding.top + chartH);
  gradient.addColorStop(0, brand2);
  gradient.addColorStop(1, brand);
  ctx.textAlign = 'center';
  ctx.font = '700 11px -apple-system, BlinkMacSystemFont, sans-serif';

  data.forEach((item, index) => {
    const x = padding.left + slot * index + slot / 2;
    const barH = Math.max(item.value > 0 ? 5 : 0, (item.value / maxValue) * (chartH - 18));
    const y = padding.top + chartH - barH;
    ctx.fillStyle = gradient;
    roundRect(ctx, x - barW / 2, y, barW, barH, 9);
    ctx.fill();
    ctx.fillStyle = muted;
    ctx.fillText(item.label.replace('.', ''), x, height - 14);
    if (item.value > 0 && height > 270) {
      ctx.fillText(compactEuro(item.value), x, Math.max(12, y - 7));
    }
  });
}

function roundRect(ctx, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
}

function renderExpenseCharts() {
  if (currentPage !== 'expenses') return;
  const stats = getMonthStats(selectedExpenseMonth);
  drawDonut($('expenseDonut'), stats.sortedCategories, stats.expense);
  const sixMonths = lastSixMonths();
  drawBars($('expenseBars'), sixMonths);
  const average = round2(sixMonths.reduce((sum, m) => sum + m.value, 0) / sixMonths.length);
  const best = sixMonths.reduce((min, m) => m.value < min.value ? m : min, sixMonths[0]);
  setText('expenseSixMonthAvg', `Média: ${euro(average)}`);
  setText('expenseBestMonth', `Melhor mês: ${best.value > 0 ? best.label : '—'}`);
}

function renderAllocationChart() {
  if (currentPage !== 'wealth') return;
  const b = vault.balances;
  const marketCurrent = marketPortfolioSummary().current;
  const exteriorCurrent = exteriorBalance();
  const entries = [
    ['Conta corrente', Number(b.current) || 0],
    ['Poupança', Number(b.savings) || 0],
    ['Dinheiro a render', Number(b.investments) || 0],
    ['Fundo carro', Number(b.carFund) || 0],
    ['Exterior', Math.max(0, Number(exteriorCurrent) || 0)],
    ['Investimentos (ETF / ações)', Number(marketCurrent) || 0]
  ].filter(([, amount]) => amount > 0);
  const colors = {
    'Conta corrente': '#0f988a',
    'Poupança': '#36b87d',
    'Dinheiro a render': '#397bd8',
    'Fundo carro': '#e29432',
    'Exterior': '#56c98c',
    'Investimentos (ETF / ações)': '#8f6bff'
  };
  entries.forEach(([name], index) => {
    CATEGORY_META[name] = { icon: ICONS.dots, color: colors[name] || FALLBACK_COLORS[index] };
  });
  const total = sumPatrimonyTotal();
  const chartTotal = round2(entries.reduce((sum, [, amount]) => sum + Number(amount || 0), 0));
  drawDonut($('allocationDonut'), entries, chartTotal);
  setText('allocationTotal', euro(total));
  const legend = $('allocationLegend');
  if (legend) {
    const positiveRows = entries.map(([name, amount], index) => `<div class="legend-item"><span class="legend-dot" style="background:${colors[name] || FALLBACK_COLORS[index]}"></span><span>${name}</span><strong>${chartTotal ? Math.round(amount / chartTotal * 100) : 0}%</strong></div>`).join('');
    const negativeExterior = exteriorCurrent < 0 ? `<div class="legend-item"><span class="legend-dot" style="background:${colors.Exterior}"></span><span>Exterior</span><strong class="negative">−${euro(Math.abs(exteriorCurrent))}</strong></div>` : '';
    legend.innerHTML = positiveRows || negativeExterior
      ? `${positiveRows}${negativeExterior}`
      : '<span class="muted">Atualiza os saldos para veres a distribuição.</span>';
  }
}

function renderExteriorOverview() {
  const period = $('exteriorPeriodSelect')?.value || 'month';
  const stats = exteriorStats(period);
  const balance = exteriorBalance();
  setText('exteriorIncome', `+${euro(stats.income)}`);
  setText('exteriorExpense', `−${euro(stats.expense)}`);
  const balanceElement = $('exteriorBalance');
  if (balanceElement) {
    balanceElement.textContent = `${balance > 0 ? '+' : balance < 0 ? '−' : ''}${euro(Math.abs(balance))}`;
    balanceElement.classList.toggle('positive', balance > 0);
    balanceElement.classList.toggle('negative', balance < 0);
  }
}

function renderLoanHistory() {
  const items = [...vault.loan.history].sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')));
  const history = $('loanHistory');
  const timeline = $('loanTimeline');
  const html = items.length
    ? items.map(h => {
        const isPayment = h.type === 'payment';
        const value = Number(h.amount ?? h.total ?? 0);
        return `<div class="history-row"><div><strong>${isPayment ? 'Prestação mensal' : 'Amortização extra'}</strong><small>${datePT(h.date)}${isPayment ? ` · Capital ${euro(h.capital)} · Custos ${euro(Number(h.interest || 0) + Number(h.stamp || 0))}` : ''}</small></div><strong>${euro(value)}</strong></div>`;
      }).join('')
    : '<div class="empty-state"><span>🚘</span>Ainda não existem pagamentos registados.</div>';
  if (history) history.innerHTML = html;

  if (timeline) {
    timeline.innerHTML = items.length
      ? items.slice(0, 6).map(h => `<div class="timeline-item"><div><strong>${h.type === 'payment' ? 'Prestação mensal' : 'Amortização extra'}</strong><small>${datePT(h.date)}</small></div><strong>${euro(h.amount ?? h.total)}</strong></div>`).join('')
      : '<div class="empty-state"><span>🚘</span>Regista uma prestação para iniciar a linha temporal.</div>';
  }
}

function renderInsights() {
  const target = $('insightsList');
  if (!target) return;
  const currentMonth = new Date().toISOString().slice(0, 7);
  const current = getMonthStats(currentMonth);
  const previous = getMonthStats(previousMonth(currentMonth));
  const savingsTotal = round2((Number(vault.balances.savings) || 0) + (Number(vault.balances.investments) || 0));
  const savingsPct = vault.savingsGoal ? Math.min(100, savingsTotal / vault.savingsGoal * 100) : 0;
  const savingsRemaining = Math.max(0, vault.savingsGoal - savingsTotal);
  const monthsLeft = Math.max(1, 12 - new Date().getMonth());
  const monthlyNeeded = savingsRemaining / monthsLeft;
  const projection = projectLoan();
  const dailyYield = vault.balances.investments * (vault.annualRate / 100) / 365;
  const top = current.sortedCategories[0] || ['Sem despesas', 0];
  let spendingText = 'Ainda não existem dados suficientes para comparar as despesas.';
  if (previous.expense > 0) {
    const diff = ((current.expense - previous.expense) / previous.expense) * 100;
    spendingText = diff <= 0
      ? `Gastaste <strong>${Math.abs(diff).toFixed(0)}% menos</strong> do que no mês anterior.`
      : `Gastaste <strong>${Math.abs(diff).toFixed(0)}% mais</strong> do que no mês anterior.`;
  }

  const totalBalance = sumStablePatrimony();
  const cards = [
    { color: 'mint', icon: ICONS.wallet, title: 'Saldo total', text: `O teu saldo estável atual é <strong>${euro(totalBalance)}</strong>, somando conta corrente, poupança, dinheiro a render, fundo do carro e saldo exterior. Os ETF e ações aparecem à parte no gráfico de património.` },
    { color: 'mint', icon: ICONS.savings, title: 'Objetivo de poupança', text: `Já concluíste <strong>${pctText(savingsPct)}</strong> da meta anual. Faltam ${euro(savingsRemaining)} — cerca de ${euro(monthlyNeeded)} por mês até dezembro.` },
    { color: current.expense <= previous.expense ? 'mint' : 'rose', icon: ICONS.receipt, title: 'Ritmo de despesas', text: spendingText },
    { color: 'amber', icon: ICONS.coins_down, title: 'Crédito automóvel', text: projection.count ? `Ao ritmo atual, o carro ficará pago em <strong>${datePT(projection.payoffDate, { month: 'long', year: 'numeric' })}</strong>, após cerca de ${projection.count} prestações.` : 'O crédito está liquidado ou precisa de dados atualizados.' },
    { color: 'blue', icon: ICONS.trend, title: 'Rendimento estimado', text: `O dinheiro a render está a gerar aproximadamente <strong>${euro(dailyYield)} por dia</strong> e ${euro(dailyYield * 365)} por ano à taxa atual.` },
    { color: 'rose', icon: ICONS.pie, title: 'Maior categoria', text: top[1] ? `A categoria com mais gastos este mês é <strong>${escapeHtml(top[0])}</strong>, com ${euro(top[1])}.` : 'Ainda não existem despesas registadas neste mês.' }
  ];

  target.innerHTML = cards.map(card => `<article class="insight-card"><span class="insight-icon ${card.color}">${card.icon}</span><h3>${card.title}</h3><p>${card.text}</p></article>`).join('');
}


function marketPortfolioSummary() {
  const items = Array.isArray(vault.marketInvestments) ? vault.marketInvestments : [];
  const invested = round2(items.reduce((sum, item) => sum + Number(item.invested || 0), 0));
  const current = round2(items.reduce((sum, item) => sum + Number(item.currentValue || 0), 0));
  const result = round2(current - invested);
  const returnPct = invested > 0 ? (result / invested) * 100 : 0;
  return { invested, current, result, returnPct };
}

function marketTypeLabel(item) {
  return [item.type || 'Investimento', item.ticker, item.broker].filter(Boolean).join(' · ');
}

function renderMarketInvestments() {
  const summary = marketPortfolioSummary();
  setText('marketInvestedTotal', euro(summary.invested));
  setText('marketCurrentTotal', euro(summary.current));
  setText('marketResultTotal', `${summary.result >= 0 ? '+' : ''}${euro(summary.result)}`);
  setText('marketReturnTotal', `${summary.returnPct >= 0 ? '+' : ''}${summary.returnPct.toFixed(2).replace('.', ',')}%`);
  setText('homeMarketCurrent', euro(summary.current));
  setText('homeMarketResult', `${summary.result >= 0 ? '+' : ''}${euro(summary.result)}`);

  const resultElement = $('marketResultTotal');
  const returnElement = $('marketReturnTotal');
  const homeResult = $('homeMarketResult');
  [resultElement, returnElement, homeResult].forEach(element => {
    if (!element) return;
    element.classList.toggle('positive', summary.result > 0);
    element.classList.toggle('negative', summary.result < 0);
  });

  const target = $('marketInvestmentList');
  if (!target) return;
  const items = [...vault.marketInvestments].sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')));
  if (!items.length) {
    target.innerHTML = '<div class="market-empty"><strong>Ainda não tens ETF ou ações registados.</strong><small>Adiciona o primeiro investimento para acompanhares o valor atual e a rentabilidade.</small></div>';
    return;
  }

  target.innerHTML = items.map(item => {
    const invested = Number(item.invested || 0);
    const current = Number(item.currentValue || 0);
    const result = round2(current - invested);
    const returnPct = invested > 0 ? (result / invested) * 100 : 0;
    const initial = escapeHtml((item.ticker || item.name || '?').trim().charAt(0).toUpperCase());
    return `<article class="market-item">
      <div class="market-item-head">
        <span class="market-symbol">${initial}</span>
        <div class="market-name"><strong>${escapeHtml(item.name || 'Investimento')}</strong><small>${escapeHtml(marketTypeLabel(item))}</small></div>
        <button class="market-edit" data-investment-edit="${escapeHtml(item.id)}" type="button">Editar</button>
      </div>
      <div class="market-item-values">
        <div><small>Investido</small><strong>${euro(invested)}</strong></div>
        <div><small>Valor atual</small><strong>${euro(current)}</strong></div>
        <div><small>Resultado</small><strong class="${result > 0 ? 'positive' : result < 0 ? 'negative' : ''}">${result >= 0 ? '+' : ''}${euro(result)}</strong></div>
        <div><small>Rentabilidade</small><strong class="${result > 0 ? 'positive' : result < 0 ? 'negative' : ''}">${returnPct >= 0 ? '+' : ''}${returnPct.toFixed(2).replace('.', ',')}%</strong></div>
      </div>
      <button class="market-delete" data-investment-delete="${escapeHtml(item.id)}" type="button">Eliminar</button>
    </article>`;
  }).join('');
}

function resetInvestmentForm() {
  const form = $('investmentForm');
  if (!form) return;
  form.reset();
  $('investmentId').value = '';
  $('investmentDate').value = todayISO();
  $('investmentDialogTitle').textContent = 'Adicionar investimento';
  $('investmentSubmit').textContent = 'Guardar investimento';
}

function openInvestmentEditor(id) {
  const item = vault.marketInvestments.find(investment => investment.id === id);
  if (!item) return;
  $('investmentId').value = item.id;
  $('investmentName').value = item.name || '';
  $('investmentTicker').value = item.ticker || '';
  $('investmentType').value = item.type || 'ETF';
  $('investmentInvested').value = Number(item.invested || 0);
  $('investmentCurrent').value = Number(item.currentValue || 0);
  $('investmentDate').value = item.date || todayISO();
  $('investmentBroker').value = item.broker || '';
  $('investmentDialogTitle').textContent = 'Editar investimento';
  $('investmentSubmit').textContent = 'Guardar alterações';
  openDialog('investmentDialog');
}

function render() {
  const b = vault.balances;
  const currentMonth = new Date().toISOString().slice(0, 7);
  ensureBudget(currentMonth);
  const total = sumStablePatrimony();
  const stats = getMonthStats(currentMonth);
  const flow = netFlowForMonth(currentMonth);

  setText('totalWealth', euro(total));
  setText('homeCurrent', euro(b.current));
  setText('homeSavings', euro(b.savings));
  setText('homeSavingsCard', euro(b.savings));
  setText('homeInvestments', euro(b.investments));
  setText('homeCarFund', euro(b.carFund));
  setText('homeLoanBalance', euro(vault.loan.balance));
  setText('monthIncome', euro(stats.income));
  setText('monthExpenses', euro(stats.expense));
  setText('monthExpensesSummary', euro(stats.expense));
  setText('monthBalance', euro(stats.balance));
  setText('yearExpenses', euro(currentYearExpenses()));

  const wealthChange = $('wealthChange');
  if (wealthChange) {
    wealthChange.textContent = flow === 0 ? 'Sem alterações este mês' : `${flow > 0 ? '↑' : '↓'} ${euro(Math.abs(flow))} este mês`;
    wealthChange.className = `status-chip ${flow > 0 ? 'up' : flow < 0 ? 'down' : ''}`;
  }

  const savingsTotal = round2((Number(b.savings) || 0) + (Number(b.investments) || 0));
  const savingsPct = vault.savingsGoal ? Math.min(100, (savingsTotal / vault.savingsGoal) * 100) : 0;
  setWidth('savingsProgress', savingsPct);
  setWidth('savingsPageProgress', savingsPct);
  setText('savingsNow', euro(savingsTotal));
  setText('savingsPct', pctText(savingsPct));
  setText('savingsGoalLabel', euro(vault.savingsGoal));
  setText('savingsPageNow', euro(savingsTotal));
  setText('savingsPagePct', pctText(savingsPct));
  setText('savingsPageGoal', `Meta: ${euro(vault.savingsGoal)}`);
  setText('savingsPageRemaining', `Faltam ${euro(Math.max(0, vault.savingsGoal - savingsTotal))}`);

  const carPct = vault.carFundGoal ? Math.min(100, (b.carFund / vault.carFundGoal) * 100) : 0;
  setWidth('carFundProgress', carPct);
  setWidth('carPageFundProgress', carPct);
  setText('carFundNow', euro(b.carFund));
  setText('carFundPct', pctText(carPct));
  setText('carFundGoalLabel', euro(vault.carFundGoal));
  setText('carPageFundNow', euro(b.carFund));
  setText('carPageFundRemaining', `Faltam ${euro(Math.max(0, Number(vault.carFundGoal || 0) - Number(b.carFund || 0)))}`);
  setText('carPageFundGoal', `Meta: ${euro(vault.carFundGoal)}`);

  setText('sCurrent', euro(b.current));
  setText('sSavings', euro(b.savings));
  setText('sInvestments', euro(b.investments));
  const annualYield = round2(b.investments * (vault.annualRate / 100));
  const monthlyYield = round2(annualYield / 12);
  const dailyYield = round2(annualYield / 365);
  setText('sDailyYield', euro(dailyYield));
  setText('annualRateLabel', `${Number(vault.annualRate).toFixed(2).replace('.', ',')}%`);
  setText('yieldDaily', euro(dailyYield));
  setText('yieldMonthly', euro(monthlyYield));
  setText('yieldAnnual', euro(annualYield));

  const loanPaid = round2(Math.max(0, vault.loan.originalBalance - vault.loan.balance));
  const loanPct = vault.loan.originalBalance ? Math.min(100, (loanPaid / vault.loan.originalBalance) * 100) : 0;
  setText('loanBalance', euro(vault.loan.balance));
  setText('loanPaidAmount', euro(loanPaid));
  setText('loanInitialAmount', euro(vault.loan.originalBalance));
  setText('loanPct', `${pctText(loanPct)} liquidado`);
  setText('loanRingPct', pctText(loanPct));
  setWidth('loanProgress', loanPct);
  const ring = $('loanRing');
  if (ring) ring.style.setProperty('--p', loanPct.toFixed(1));

  const parts = installmentParts();
  setText('nextPaymentDate', datePT(vault.loan.nextDate, { day: '2-digit', month: 'short' }));
  setText('monthlyPayment', euro(vault.loan.payment));
  const officialTotal = Math.max(0, Number(vault.loan.officialTotalPayments) || 0);
  const officialPaid = Math.max(0, Number(vault.loan.officialPaidPayments) || 0);
  const nextContractNumber = officialTotal > 0 ? Math.min(officialTotal, officialPaid + 1) : 0;
  setText('paymentContractPosition', !loanHasExtraAmortization() && nextContractNumber
    ? `prestação ${nextContractNumber} de ${officialTotal}`
    : 'prestação prevista');
  setText('nextCapital', euro(parts.capital));
  setText('nextCosts', euro(parts.interest + parts.stamp));
  const countdown = $('paymentCountdown');
  if (countdown) {
    if (!vault.loan.nextDate) {
      countdown.textContent = 'Configura o crédito';
      countdown.className = 'metric-tag neutral';
    } else {
      const daysUntil = Math.ceil((new Date(`${vault.loan.nextDate}T12:00:00`) - new Date()) / 86400000);
      countdown.textContent = daysUntil > 1 ? `Faltam ${daysUntil} dias` : daysUntil === 1 ? 'Falta 1 dia' : daysUntil === 0 ? 'É hoje' : `${Math.abs(daysUntil)} dias em atraso`;
      countdown.className = `metric-tag ${daysUntil < 0 ? 'up' : 'neutral'}`;
    }
  }

  const projection = projectLoan();
  setText('estimatedPayoff', projection.count ? datePT(projection.payoffDate) : 'Liquidado');
  setText('remainingPayments', projection.count);
  setText('projectedInterest', euro(projection.interestTotal));
  setText('projectionMode', projection.mode === 'official' ? 'Plano oficial' : projection.mode === 'simulation' ? 'Recalculado após amortização' : 'Crédito liquidado');
  const paidInterest = vault.loan.history.reduce((sum, h) => sum + Number(h.interest || 0) + Number(h.stamp || 0), 0);
  setText('loanInterestPaid', euro(paidInterest));

  if ($('balanceCurrent')) $('balanceCurrent').value = b.current;
  if ($('balanceSavings')) $('balanceSavings').value = b.savings;
  if ($('balanceInvestments')) $('balanceInvestments').value = b.investments;
  if ($('balanceCarFund')) $('balanceCarFund').value = b.carFund;
  if ($('annualRateInput')) $('annualRateInput').value = vault.annualRate;
  if ($('savingsGoalInput')) $('savingsGoalInput').value = vault.savingsGoal;
  if ($('carGoalInput')) $('carGoalInput').value = vault.carFundGoal;
  if ($('paymentDate')) $('paymentDate').value = vault.loan.nextDate || todayISO();
  if ($('extraDate')) $('extraDate').value = todayISO();
  if ($('loanOriginalInput')) $('loanOriginalInput').value = Number(vault.loan.originalBalance) || 0;
  if ($('loanBalanceInput')) $('loanBalanceInput').value = Number(vault.loan.balance) || 0;
  if ($('loanPaymentInput')) $('loanPaymentInput').value = Number(vault.loan.payment) || 0;
  if ($('loanRateInput')) $('loanRateInput').value = round2((Number(vault.loan.annualRate) || 0) * 100);
  if ($('loanStampInput')) $('loanStampInput').value = round2((Number(vault.loan.stampRate) || 0) * 100);
  if ($('loanNextDateInput')) $('loanNextDateInput').value = vault.loan.nextDate || '';
  if ($('loanTotalPaymentsInput')) $('loanTotalPaymentsInput').value = Number(vault.loan.officialTotalPayments) || 0;
  if ($('loanPaidPaymentsInput')) $('loanPaidPaymentsInput').value = Number(vault.loan.officialPaidPayments) || 0;
  if ($('loanLastDateInput')) $('loanLastDateInput').value = vault.loan.officialLastDate || '';

  renderTransactions();
  renderExpenseMonthOptions();
  renderExpenses();
  renderLoanHistory();
  renderInsights();
  renderMarketInvestments();
  renderExteriorOverview();
  renderBudgetFeatures();
  renderPortfolioChart();
  renderCarState();
  renderAnnualHistory();
  requestAnimationFrame(renderAllocationChart);
}

function showPage(name) {
  if (name === 'car' && vault.carArchived) name = 'insights';
  currentPage = name;
  document.querySelectorAll('.page').forEach(page => page.classList.toggle('active', page.id === `page-${name}`));
  document.querySelectorAll('.bottom-nav [data-page]').forEach(button => button.classList.toggle('active', button.dataset.page === name));
  window.scrollTo({ top: 0, behavior: 'smooth' });
  requestAnimationFrame(() => {
    if (name === 'expenses') renderExpenseCharts();
    if (name === 'wealth') renderAllocationChart();
    if (name === 'annual') renderAnnualHistory();
    if (name === 'budget') renderBudgetFeatures();
    if (name === 'wealth') renderPortfolioChart();
  });
}

function openDialog(id) {
  const dialog = $(id);
  if (dialog?.showModal) dialog.showModal();
}

const BALANCE_KEY_BY_ACCOUNT = Object.freeze({ current: 'current', savings: 'savings', investments: 'investments', carFund: 'carFund' });
const ACCOUNT_LABELS = Object.freeze({ external: 'Exterior', current: 'Conta corrente', savings: 'Poupança', investments: 'Dinheiro a render', carFund: 'Fundo carro', insuranceReserve: 'Reserva do seguro' });

function accountLabel(account) {
  return ACCOUNT_LABELS[account] || 'Conta';
}

const MOVEMENT_MODE_META = Object.freeze({
  income: {
    title: 'Dinheiro a entrar',
    subtitle: 'Regista aqui os teus recebimentos',
    submit: 'Guardar receita',
    icon: `<svg aria-hidden="true" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"></circle><path d="M12 7v10M8.5 13.5 12 17l3.5-3.5"></path></svg>`
  },
  expense: {
    title: 'Dinheiro a sair',
    subtitle: 'Regista aqui as tuas despesas',
    submit: 'Guardar despesa',
    icon: `<svg aria-hidden="true" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"></circle><path d="M12 17V7M8.5 10.5 12 7l3.5 3.5"></path></svg>`
  },
  transfer: {
    title: 'Transferir dinheiro',
    subtitle: 'Move dinheiro entre contas',
    submit: 'Guardar transferência',
    icon: `<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M6.5 8.25h11"></path><path d="m14.5 5.25 3 3-3 3"></path><path d="M17.5 15.75h-11"></path><path d="m9.5 12.75-3 3 3 3"></path></svg>`
  }
});

let movementMode = 'expense';

function movementModeForPreset(type) {
  if (type === 'income') return 'income';
  if (type === 'expense') return 'expense';
  return 'transfer';
}

function setAccountOptionState(mode) {
  const from = $('txFrom');
  const to = $('txTo');
  if (!from || !to) return;
  [...from.options, ...to.options].forEach(option => { option.disabled = false; });
  const fromExternal = [...from.options].find(option => option.value === 'external');
  const toExternal = [...to.options].find(option => option.value === 'external');
  if (fromExternal) fromExternal.textContent = mode === 'expense' ? 'Exterior — não alterar saldos' : 'Exterior';
  if (toExternal) toExternal.textContent = mode === 'income' ? 'Exterior — não alterar saldos' : 'Exterior';
}

function updateExternalMovementHint() {
  const hint = $('txExternalHint');
  const text = $('txExternalHintText');
  if (!hint || !text) return;
  const from = $('txFrom')?.value;
  const to = $('txTo')?.value;
  let message = '';
  if (movementMode === 'income' && to === 'external') message = 'Conta como receita e aumenta o saldo Exterior, sem alterar as contas da app.';
  else if (movementMode === 'expense' && from === 'external') message = 'Conta como despesa e reduz o saldo Exterior, sem alterar as contas da app.';
  else if (movementMode === 'transfer' && (from === 'external' || to === 'external')) message = 'Move dinheiro entre o Exterior e uma conta. Não conta como receita nem como despesa.';
  hint.hidden = !message;
  text.textContent = message;
}

function updateCategoryForTransfer() {
  const from = $('txFrom')?.value;
  const to = $('txTo')?.value;
  const category = $('txCategory');
  if (!category) return;
  if (movementMode === 'income') category.value = 'Salário';
  else if (movementMode === 'expense' && category.value === 'Salário') category.value = 'Alimentação';
  else if (to === 'savings' || from === 'savings') category.value = 'Poupança';
  else if (to === 'investments' || from === 'investments') category.value = 'Investimentos';
  else if (to === 'carFund' || from === 'carFund') category.value = 'Carro';
  else if (movementMode === 'transfer') category.value = 'Outros';
  updateExternalMovementHint();
}

function setMovementMode(mode, options = {}) {
  const nextMode = MOVEMENT_MODE_META[mode] ? mode : 'expense';
  movementMode = nextMode;
  const dialog = $('txDialog');
  if (dialog) dialog.dataset.mode = nextMode;

  document.querySelectorAll('[data-movement-mode]').forEach(button => {
    const active = button.dataset.movementMode === nextMode;
    button.classList.toggle('active', active);
    button.setAttribute('aria-selected', active ? 'true' : 'false');
  });

  const fromField = $('txFromField');
  const toField = $('txToField');
  const arrow = $('txTransferArrow');
  const categoryField = $('txCategoryField');
  const incomeBudgetFields = $('txIncomeBudgetFields');
  const expenseBudgetFields = $('txExpenseBudgetFields');
  if (fromField) fromField.hidden = nextMode === 'income';
  if (toField) toField.hidden = nextMode === 'expense';
  if (arrow) arrow.hidden = nextMode !== 'transfer';
  if (categoryField) categoryField.hidden = nextMode === 'transfer';
  if (incomeBudgetFields) incomeBudgetFields.hidden = nextMode !== 'income';
  if (expenseBudgetFields) expenseBudgetFields.hidden = nextMode !== 'expense';

  const meta = MOVEMENT_MODE_META[nextMode];
  if ($('txModeTitle')) $('txModeTitle').textContent = meta.title;
  if ($('txModeSubtitle')) $('txModeSubtitle').textContent = meta.subtitle;
  if ($('txModeIcon')) $('txModeIcon').innerHTML = meta.icon;
  if ($('txSubmit')) $('txSubmit').textContent = meta.submit;

  setAccountOptionState(nextMode);

  if (!options.keepAccounts) {
    if (nextMode === 'income') {
      $('txFrom').value = 'external';
      $('txTo').value = options.to || 'current';
    } else if (nextMode === 'expense') {
      $('txFrom').value = options.from || 'current';
      $('txTo').value = 'external';
    } else {
      $('txFrom').value = options.from || 'current';
      $('txTo').value = options.to || 'savings';
      if ($('txFrom').value === $('txTo').value) $('txTo').value = 'savings';
    }
  }
  updateCategoryForTransfer();
  updateExternalMovementHint();
  updateBudgetMonthSuggestion();
}

function setTransferPreset(type) {
  const presets = {
    income: { mode: 'income', to: 'current' },
    expense: { mode: 'expense', from: 'current' },
    saving: { mode: 'transfer', from: 'current', to: 'savings' },
    investment: { mode: 'transfer', from: 'current', to: 'investments' },
    carfund: { mode: 'transfer', from: 'current', to: 'carFund' }
  };
  const preset = presets[type] || presets.expense;
  setMovementMode(preset.mode, preset);
}

function transactionType(from, to) {
  if (movementMode === 'income') return 'income';
  if (movementMode === 'expense') return 'expense';
  if (movementMode === 'transfer') return 'transfer';
  if (from === 'external' && to !== 'external') return 'income';
  if (to === 'external') return 'expense';
  return 'transfer';
}

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  storageSet(THEME_STORE, theme);
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.content = theme === 'dark' ? '#081310' : '#f8fbfa';
  const toggle = $('themeToggle');
  if (toggle) {
    const nextTheme = theme === 'dark' ? 'claro' : 'escuro';
    toggle.setAttribute('aria-label', `Ativar modo ${nextTheme}`);
    toggle.title = `Ativar modo ${nextTheme}`;
  }
  requestAnimationFrame(() => {
    renderExpenseCharts();
    renderAllocationChart();
    renderPortfolioChart();
  });
}

function initTheme() {
  const stored = storageGet(THEME_STORE);
  applyTheme(stored || 'dark');
}

function init() {
  initTheme();
  ensureAnnualTransition();
  syncLoanStatus();
  $('txDate').value = todayISO();
  if ($('investmentDate')) $('investmentDate').value = todayISO();
  setTransferPreset('expense');

  document.querySelectorAll('[data-movement-mode]').forEach(button => {
    button.addEventListener('click', () => setMovementMode(button.dataset.movementMode));
  });

  document.querySelectorAll('[data-page]').forEach(button => {
    button.addEventListener('click', event => {
      if (button.dataset.page) {
        event.preventDefault();
        showPage(button.dataset.page);
      }
    });
  });

  document.querySelectorAll('[data-open]').forEach(button => {
    button.addEventListener('click', () => {
      if (button.dataset.txType) setTransferPreset(button.dataset.txType);
      openDialog(button.dataset.open);
    });
  });

  document.querySelectorAll('[data-new-investment]').forEach(button => {
    button.addEventListener('click', resetInvestmentForm);
  });

  document.querySelectorAll('[data-close]').forEach(button => {
    button.addEventListener('click', event => {
      event.preventDefault();
      const dialog = $(button.dataset.close) || button.closest('dialog');
      if (dialog?.open) dialog.close();
    });
  });

  document.querySelectorAll('dialog').forEach(dialog => {
    dialog.addEventListener('click', event => {
      const rect = dialog.getBoundingClientRect();
      const outside = event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom;
      if (outside) dialog.close();
    });
  });

  $('themeToggle')?.addEventListener('click', () => applyTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'));
  $('txFrom').addEventListener('change', updateCategoryForTransfer);
  $('txTo').addEventListener('change', updateCategoryForTransfer);
  $('txDate').addEventListener('change', updateBudgetMonthSuggestion);
  $('txIncomeKind')?.addEventListener('change', updateBudgetMonthSuggestion);
  $('expenseMonthSelect').addEventListener('change', event => {
    selectedExpenseMonth = event.target.value;
    renderExpenses();
  });
  $('exteriorPeriodSelect')?.addEventListener('change', event => { selectedExteriorPeriod = event.target.value; renderExteriorOverview(); });
  $('exteriorMonthSelect')?.addEventListener('change', event => { selectedExteriorMonth = event.target.value; renderExteriorOverview(); });
  $('budgetMonthSelect')?.addEventListener('change', event => { selectedBudgetMonth = event.target.value; renderBudgetFeatures(); });


  $('annualYearList')?.addEventListener('click', event => {
    const button = event.target.closest('[data-annual-year]');
    if (!button) return;
    selectedAnnualYear = button.dataset.annualYear;
    renderAnnualHistory();
  });

  $('annualDetail')?.addEventListener('click', event => {
    const button = event.target.closest('[data-recalculate-annual]');
    if (!button) return;
    const year = Number(button.dataset.recalculateAnnual);
    if (!confirm(`Recalcular os movimentos de ${year}? Os saldos guardados no fecho mantêm-se.`)) return;
    saveAnnualClosure(year, { preserveSnapshot: true, automatic: vault.annualClosures[String(year)]?.automatic });
    renderAnnualHistory();
  });

  $('closeCurrentYearButton')?.addEventListener('click', () => {
    const year = new Date().getFullYear();
    const exists = Boolean(vault.annualClosures[String(year)]);
    const message = exists
      ? `Atualizar o fecho de ${year} com os saldos e valores atuais?`
      : `Criar o fecho anual de ${year} com os valores atuais?`;
    if (!confirm(message)) return;
    saveAnnualClosure(year, { automatic: false });
    render();
    alert(`Fecho de ${year} guardado com sucesso.`);
  });

  $('archiveCarButton')?.addEventListener('click', () => openDialog('archiveCarDialog'));
  $('confirmArchiveCar')?.addEventListener('click', () => {
    if (!loanIsLiquidated()) return alert('Só podes arquivar o carro depois de liquidar o crédito.');
    vault.carArchived = true;
    save();
    $('archiveCarDialog')?.close();
    render();
    showPage('insights');
  });
  $('restoreCarButton')?.addEventListener('click', () => {
    vault.carArchived = false;
    save();
    render();
    showPage('car');
  });
  $('moveCarFundButton')?.addEventListener('click', () => {
    setMovementMode('transfer', { from: 'carFund', to: 'savings' });
    openDialog('txDialog');
  });

  $('txForm').addEventListener('submit', event => {
    if (event.submitter?.value === 'cancel') return;
    event.preventDefault();
    const amount = Number($('txAmount').value);
    if (!(amount > 0)) return alert('Introduz um valor válido.');

    let from = $('txFrom').value;
    let to = $('txTo').value;
    if (movementMode === 'income') from = 'external';
    if (movementMode === 'expense') to = 'external';

    if (movementMode === 'transfer' && from === to) return alert('Escolhe contas diferentes para a transferência.');
    if (movementMode === 'transfer' && from === 'external' && to === 'external') return alert('Escolhe uma conta da aplicação num dos lados da transferência.');

    const fromKey = BALANCE_KEY_BY_ACCOUNT[from];
    const toKey = BALANCE_KEY_BY_ACCOUNT[to];
    if (fromKey && amount > Number(vault.balances[fromKey] || 0)) {
      return alert(`Saldo insuficiente em ${accountLabel(from)}.`);
    }

    if (fromKey) vault.balances[fromKey] = round2(Number(vault.balances[fromKey] || 0) - amount);
    if (toKey) vault.balances[toKey] = round2(Number(vault.balances[toKey] || 0) + amount);

    const type = transactionType(from, to);
    const category = movementMode === 'transfer' ? (
      to === 'savings' || from === 'savings' ? 'Poupança' :
      to === 'investments' || from === 'investments' ? 'Investimentos' :
      to === 'carFund' || from === 'carFund' ? 'Carro' : 'Outros'
    ) : $('txCategory').value;
    vault.transactions.push({
      id: makeId(),
      type,
      from,
      to,
      description: $('txDesc').value.trim(),
      amount: round2(amount),
      category,
      date: $('txDate').value,
      incomeKind: movementMode === 'income' ? $('txIncomeKind')?.value || 'other' : '',
      budgetMonth: movementMode === 'income' ? ($('txBudgetMonth')?.value || String($('txDate').value).slice(0, 7)) : movementMode === 'expense' ? ($('txExpenseBudgetMonth')?.value || String($('txDate').value).slice(0, 7)) : '',
      countsInBudget: movementMode === 'expense' ? Boolean($('txCountsBudget')?.checked) : movementMode === 'income',
      externalIncome: movementMode === 'income' && from === 'external' && to === 'external'
    });
    save();
    refreshAnnualClosureForDate($('txDate').value);
    event.target.reset();
    $('txDate').value = todayISO();
    setTransferPreset('expense');
    $('txDialog').close();
    render();
  });

  $('investmentForm')?.addEventListener('submit', event => {
    if (event.submitter?.value === 'cancel') return;
    event.preventDefault();
    const name = $('investmentName').value.trim();
    const invested = Number($('investmentInvested').value);
    const currentValue = Number($('investmentCurrent').value);
    if (!name) return alert('Indica o nome do investimento.');
    if (invested < 0 || currentValue < 0) return alert('Os valores não podem ser negativos.');

    const id = $('investmentId').value || makeId();
    const record = {
      id,
      name,
      ticker: $('investmentTicker').value.trim().toUpperCase(),
      type: $('investmentType').value,
      invested: round2(invested),
      currentValue: round2(currentValue),
      date: $('investmentDate').value || todayISO(),
      broker: $('investmentBroker').value.trim()
    };
    const existingIndex = vault.marketInvestments.findIndex(item => item.id === id);
    if (existingIndex >= 0) vault.marketInvestments[existingIndex] = record;
    else vault.marketInvestments.push(record);
    save();
    $('investmentDialog').close();
    resetInvestmentForm();
    render();
  });

  $('marketInvestmentList')?.addEventListener('click', event => {
    const editButton = event.target.closest('[data-investment-edit]');
    if (editButton) {
      openInvestmentEditor(editButton.dataset.investmentEdit);
      return;
    }
    const deleteButton = event.target.closest('[data-investment-delete]');
    if (!deleteButton) return;
    const id = deleteButton.dataset.investmentDelete;
    const item = vault.marketInvestments.find(investment => investment.id === id);
    if (!item || !confirm(`Eliminar ${item.name}?`)) return;
    vault.marketInvestments = vault.marketInvestments.filter(investment => investment.id !== id);
    save();
    render();
  });

  $('balancesForm').addEventListener('submit', event => {
    if (event.submitter?.value === 'cancel') return;
    event.preventDefault();
    vault.balances = {
      current: round2($('balanceCurrent').value),
      savings: round2($('balanceSavings').value),
      investments: round2($('balanceInvestments').value),
      carFund: round2($('balanceCarFund').value)
    };
    save(); $('balancesDialog').close(); render();
  });

  $('rateForm').addEventListener('submit', event => {
    if (event.submitter?.value === 'cancel') return;
    event.preventDefault();
    vault.annualRate = Number($('annualRateInput').value) || 0;
    save(); $('rateDialog').close(); render();
  });

  $('savingsGoalForm').addEventListener('submit', event => {
    if (event.submitter?.value === 'cancel') return;
    event.preventDefault();
    vault.savingsGoal = Math.max(0, Number($('savingsGoalInput').value) || 0);
    save(); $('savingsGoalDialog').close(); render();
  });

  $('carGoalForm').addEventListener('submit', event => {
    if (event.submitter?.value === 'cancel') return;
    event.preventDefault();
    vault.carFundGoal = Math.max(0, Number($('carGoalInput').value) || 0);
    save(); $('carGoalDialog').close(); render();
  });

  $('transferForm').addEventListener('submit', event => {
    if (event.submitter?.value === 'cancel') return;
    event.preventDefault();
    const amount = Number($('transferAmount').value);
    if (!(amount > 0)) return alert('Introduz um valor válido.');
    if (amount > vault.balances.current) return alert('Saldo insuficiente na conta corrente.');
    vault.balances.current = round2(vault.balances.current - amount);
    vault.balances.carFund = round2(vault.balances.carFund + amount);
    vault.transactions.push({ id: makeId(), type: 'carfund', description: 'Transferência para fundo carro', amount: round2(amount), category: 'Carro', date: todayISO() });
    save(); event.target.reset(); $('transferDialog').close(); render();
  });

  $('loanSettingsForm').addEventListener('submit', event => {
    if (event.submitter?.value === 'cancel') return;
    event.preventDefault();
    const originalBalance = Math.max(0, Number($('loanOriginalInput').value) || 0);
    const balance = Math.max(0, Number($('loanBalanceInput').value) || 0);
    const payment = Math.max(0, Number($('loanPaymentInput').value) || 0);
    const annualRatePct = Math.max(0, Number($('loanRateInput').value) || 0);
    const stampRatePct = Math.max(0, Number($('loanStampInput').value) || 0);
    const officialTotalPayments = Math.max(0, Math.trunc(Number($('loanTotalPaymentsInput').value) || 0));
    const officialPaidPayments = Math.max(0, Math.trunc(Number($('loanPaidPaymentsInput').value) || 0));
    if (originalBalance > 0 && balance > originalBalance) return alert('A dívida atual não pode ser superior ao valor inicial financiado.');
    if (officialTotalPayments > 0 && officialPaidPayments > officialTotalPayments) return alert('As prestações pagas não podem ultrapassar o total do contrato.');
    vault.loan.originalBalance = round2(originalBalance);
    vault.loan.balance = round2(balance);
    vault.loan.payment = round2(payment);
    vault.loan.annualRate = annualRatePct / 100;
    vault.loan.stampRate = stampRatePct / 100;
    vault.loan.nextDate = $('loanNextDateInput').value || '';
    vault.loan.officialTotalPayments = officialTotalPayments;
    vault.loan.officialPaidPayments = Math.min(officialTotalPayments || officialPaidPayments, officialPaidPayments);
    vault.loan.officialLastDate = $('loanLastDateInput').value || '';
    if (!vault.loan.history.some(item => item?.type === 'extra')) vault.loan.officialScheduleActive = true;
    if (balance > 0) {
      vault.loan.liquidatedDate = '';
      vault.carArchived = false;
    } else if (originalBalance > 0 && !vault.loan.liquidatedDate) {
      vault.loan.liquidatedDate = todayISO();
    }
    save();
    syncLoanStatus();
    $('loanSettingsDialog').close();
    render();
  });

  $('paymentForm').addEventListener('submit', event => {
    if (event.submitter?.value === 'cancel') return;
    event.preventDefault();
    if (vault.loan.balance <= 0 || vault.loan.payment <= 0) return alert('Configura primeiro os dados do crédito.');
    const parts = installmentParts();
    const fromCurrent = $('paymentFromCurrent').checked;
    if (fromCurrent && parts.total > vault.balances.current) return alert('Saldo insuficiente na conta corrente. Desmarca a opção de desconto ou atualiza o saldo.');
    if (fromCurrent) vault.balances.current = round2(vault.balances.current - parts.total);
    const officialTotal = Math.max(0, Number(vault.loan.officialTotalPayments) || 0);
    const nextOfficialPaid = officialTotal > 0
      ? Math.min(officialTotal, (Number(vault.loan.officialPaidPayments) || 0) + 1)
      : Number(vault.loan.officialPaidPayments) || 0;
    const finalOfficialPayment = !loanHasExtraAmortization() && officialTotal > 0 && nextOfficialPaid >= officialTotal;
    vault.loan.officialPaidPayments = nextOfficialPaid;
    vault.loan.balance = round2(Math.max(0, vault.loan.balance - parts.capital));
    const paymentDate = $('paymentDate').value;
    if (vault.loan.balance <= 0.005 || finalOfficialPayment) {
      vault.loan.balance = 0;
      vault.loan.liquidatedDate = paymentDate;
      vault.loan.nextDate = '';
    } else {
      vault.loan.nextDate = addMonths(vault.loan.nextDate || paymentDate, 1);
    }
    const historyId = makeId();
    vault.loan.history.push({ id: historyId, type: 'payment', date: paymentDate, ...parts });
    vault.transactions.push({ id: makeId(), type: 'expense', description: 'Prestação do carro', amount: parts.total, category: 'Carro', date: paymentDate, locked: true, loanHistoryId: historyId });
    save(); syncLoanStatus(); refreshAnnualClosureForDate(paymentDate); $('paymentDialog').close(); render();
  });

  $('extraForm').addEventListener('submit', event => {
    if (event.submitter?.value === 'cancel') return;
    event.preventDefault();
    const amount = Number($('extraAmount').value);
    const source = $('extraSource').value;
    if (!(amount > 0)) return alert('Introduz um valor válido.');
    if (vault.loan.balance <= 0) return alert('Configura primeiro os dados do crédito.');
    if (amount > vault.loan.balance) return alert('O valor ultrapassa a dívida atual.');
    if (source === 'carFund' && amount > vault.balances.carFund) return alert('O fundo carro não tem saldo suficiente.');
    if (source === 'current' && amount > vault.balances.current) return alert('A conta corrente não tem saldo suficiente.');
    if (source === 'carFund') vault.balances.carFund = round2(vault.balances.carFund - amount);
    if (source === 'current') vault.balances.current = round2(vault.balances.current - amount);
    vault.loan.balance = round2(vault.loan.balance - amount);
    vault.loan.officialScheduleActive = false;
    const date = $('extraDate').value;
    if (vault.loan.balance <= 0.005) {
      vault.loan.balance = 0;
      vault.loan.liquidatedDate = date;
      vault.loan.nextDate = '';
    }
    const historyId = makeId();
    vault.loan.history.push({ id: historyId, type: 'extra', date, amount: round2(amount), source });
    vault.transactions.push({ id: makeId(), type: 'expense', description: 'Amortização extraordinária do carro', amount: round2(amount), category: 'Amortização', date, locked: true, loanHistoryId: historyId });
    save(); syncLoanStatus(); refreshAnnualClosureForDate(date); event.target.reset(); $('extraDate').value = todayISO(); $('extraDialog').close(); render();
  });

  $('exportBackup').addEventListener('click', () => {
    const payload = { app: 'DEALER$', format: 6, data: vault, exported: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `DEALERS-backup-${todayISO()}.json`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });

  $('importBackup').addEventListener('change', async event => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const backup = JSON.parse(await file.text());
      const imported = normalize(backup.data || backup);
      if (!confirm('Isto vai substituir os dados atuais. Continuar?')) return;
      vault = imported;
      save(); syncLoanStatus(); render();
      if (vault.carArchived && currentPage === 'car') showPage('insights');
      alert('Cópia importada com sucesso.');
    } catch (error) {
      console.error(error);
      alert('O ficheiro selecionado não é uma cópia válida da DEALER$.');
    } finally {
      event.target.value = '';
    }
  });

  initBudgetFeatureListeners();

  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      renderExpenseCharts();
      renderAllocationChart();
      renderPortfolioChart();
    }, 120);
  });

  render();
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js?v=23.30.0').catch(console.error);
}

/* ===== DEALER$ 23.30 — orçamento mensal, reservas e histórico editável ===== */
function currentMonthKey() { return new Date().toISOString().slice(0, 7); }
function nextMonthKey(monthKey) {
  const [year, month] = String(monthKey).split('-').map(Number);
  const date = new Date(year, month, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}
function monthKeyFromDate(value) { return String(value || '').slice(0, 7); }
function monthEndDate(monthKey) { return `${monthKey}-${String(daysInMonth(monthKey)).padStart(2, '0')}`; }
function safeNumber(value) { return Math.max(0, round2(Number(value) || 0)); }
function ensureBudget(monthKey = currentMonthKey()) {
  if (!vault.monthlyBudgets || typeof vault.monthlyBudgets !== 'object') vault.monthlyBudgets = {};
  if (!vault.budgetDefaults || typeof vault.budgetDefaults !== 'object') vault.budgetDefaults = { savings: 0, amortization: 0, insurance: 0 };
  if (!vault.monthlyBudgets[monthKey]) {
    vault.monthlyBudgets[monthKey] = {
      reserves: {
        savings: safeNumber(vault.budgetDefaults.savings),
        amortization: safeNumber(vault.budgetDefaults.amortization),
        insurance: safeNumber(vault.budgetDefaults.insurance)
      },
      committed: { savings: 0, amortization: 0, insurance: 0 },
      closed: false,
      createdAt: new Date().toISOString()
    };
    save();
  }
  const budget = vault.monthlyBudgets[monthKey];
  budget.reserves = { savings: 0, amortization: 0, insurance: 0, ...(budget.reserves || {}) };
  budget.committed = { savings: 0, amortization: 0, insurance: 0, ...(budget.committed || {}) };
  return budget;
}
function assignedBudgetMonth(transaction) {
  return transaction?.budgetMonth || monthKeyFromDate(transaction?.date);
}
function budgetStats(monthKey = selectedBudgetMonth) {
  const budget = ensureBudget(monthKey);
  const incomeTransactions = vault.transactions.filter(transaction => transaction.type === 'income' && assignedBudgetMonth(transaction) === monthKey);
  const expenseTransactions = vault.transactions.filter(transaction => transaction.type === 'expense' && transaction.countsInBudget !== false && assignedBudgetMonth(transaction) === monthKey);
  const returnTransactions = vault.transactions.filter(transaction => transaction.budgetReturn && assignedBudgetMonth(transaction) === monthKey);
  const sum = items => round2(items.reduce((total, item) => total + Number(item.amount || 0), 0));
  const salary = sum(incomeTransactions.filter(item => item.incomeKind === 'salary' || (!item.incomeKind && item.category === 'Salário')));
  const bonus = sum(incomeTransactions.filter(item => item.incomeKind === 'bonus'));
  const other = round2(sum(incomeTransactions) - salary - bonus);
  const income = round2(salary + bonus + other);
  const expense = round2(expenseTransactions.reduce((total, item) => total + Number(item.budgetImpact ?? item.amount ?? 0), 0));
  const returned = sum(returnTransactions);
  const reserved = round2(Object.values(budget.reserves).reduce((total, value) => total + Number(value || 0), 0));
  const available = round2(income + returned - expense - reserved);
  return { budget, salary, bonus, other, income, expense, returned, reserved, available, incomeTransactions, expenseTransactions, returnTransactions };
}
function renderBudgetMonthOptions() {
  const select = $('budgetMonthSelect');
  if (!select) return;
  const months = new Set([currentMonthKey(), selectedBudgetMonth]);
  const now = new Date();
  for (let i = -2; i < 18; i += 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  }
  Object.keys(vault.monthlyBudgets || {}).forEach(key => months.add(key));
  vault.transactions.forEach(t => months.add(assignedBudgetMonth(t)));
  const sorted = [...months].filter(key => /^\d{4}-\d{2}$/.test(key)).sort().reverse();
  if (!sorted.includes(selectedBudgetMonth)) selectedBudgetMonth = currentMonthKey();
  select.innerHTML = sorted.map(key => `<option value="${key}" ${key === selectedBudgetMonth ? 'selected' : ''}>${monthLabel(key)}</option>`).join('');
}
function reserveLabel(type) { return ({ savings: 'Poupança', amortization: 'Amortização', insurance: 'Seguro' })[type] || type; }
function reserveIcon(type) { return type === 'savings' ? ICONS.savings : type === 'amortization' ? ICONS.car : ICONS.check_wallet; }
function renderBudgetFeatures() {
  renderBudgetMonthOptions();
  const month = selectedBudgetMonth || currentMonthKey();
  const stats = budgetStats(month);
  const isCurrent = month === currentMonthKey();
  const day = new Date().getDate();
  const daysLeft = isCurrent ? Math.max(1, daysInMonth(month) - day + 1) : 1;
  const usedBase = Math.max(0, stats.income + stats.returned);
  const usedPct = usedBase > 0 ? Math.min(100, ((stats.expense + stats.reserved) / usedBase) * 100) : 0;
  setText('homeBudgetTitle', monthLabel(currentMonthKey()));
  const homeStats = budgetStats(currentMonthKey());
  setText('homeBudgetIncome', euro(homeStats.income));
  setText('homeBudgetReserved', euro(homeStats.reserved));
  setText('homeBudgetSpent', euro(homeStats.expense));
  setText('homeBudgetAvailable', euro(homeStats.available));
  setText('homeBudgetStatus', homeStats.budget.closed ? 'Fechado' : 'Em curso');
  setWidth('homeBudgetProgress', homeStats.income > 0 ? Math.min(100, ((homeStats.expense + homeStats.reserved) / homeStats.income) * 100) : 0);
  setText('homeExterior', euro(exteriorBalance()));

  setText('budgetPageTitle', monthLabel(month));
  setText('budgetMonthEyebrow', `1 a ${daysInMonth(month)} de ${monthLabel(month)}`);
  setText('budgetPageStatus', stats.budget.closed ? 'Fechado' : (isCurrent ? 'Em curso' : 'Aberto'));
  setText('budgetAvailable', euro(stats.available));
  setText('budgetSalary', euro(stats.salary));
  setText('budgetBonus', euro(stats.bonus));
  setText('budgetOtherIncome', euro(stats.other));
  setText('budgetIncomeTotal', euro(stats.income));
  setText('budgetSpent', euro(stats.expense));
  setText('budgetReserved', euro(stats.reserved));
  setText('budgetReturns', euro(stats.returned));
  setText('budgetDaily', euro(stats.available > 0 ? stats.available / daysLeft : 0));
  setText('budgetDaysLeft', isCurrent ? `${daysLeft} dias restantes` : 'mês concluído');

  const list = $('pendingReserveList');
  if (list) list.innerHTML = ['savings', 'amortization', 'insurance'].map(type => {
    const value = Number(stats.budget.reserves[type] || 0);
    const committed = Number(stats.budget.committed[type] || 0);
    return `<article class="pending-reserve-row"><span class="pending-icon">${reserveIcon(type)}</span><div><strong>${reserveLabel(type)} pendente</strong><small>${committed > 0 ? `${euro(committed)} já transferidos este mês` : 'Ainda utilizável'}</small></div><strong>${euro(value)}</strong><button class="text-btn" data-edit-reserve="${type}" type="button">Editar</button></article>`;
  }).join('');

  const insurance = vault.insuranceReserve || { balance: 0, monthlyDefault: 0 };
  setText('insuranceReserveBalance', euro(insurance.balance));
  setText('insuranceMonthlyDefault', euro(insurance.monthlyDefault || vault.budgetDefaults?.insurance || 0));

  const budgetList = $('budgetTransactionList');
  if (budgetList) {
    const items = [...stats.incomeTransactions, ...stats.expenseTransactions, ...stats.returnTransactions]
      .sort((a, b) => `${b.date || ''}${b.id || ''}`.localeCompare(`${a.date || ''}${a.id || ''}`));
    budgetList.innerHTML = items.length ? items.map((item, index) => transactionRowHtml(item, index, true)).join('') : '<div class="empty-state"><span>◎</span>Ainda não há movimentos atribuídos a este orçamento.</div>';
  }
  const closeButton = $('closeBudgetMonth');
  if (closeButton) {
    closeButton.disabled = stats.budget.closed;
    closeButton.textContent = stats.budget.closed ? 'Mês fechado' : 'Fechar mês';
  }
}
function updateBudgetMonthSuggestion() {
  const date = $('txDate')?.value || todayISO();
  const dateMonth = monthKeyFromDate(date);
  const day = Number(String(date).slice(8, 10)) || 1;
  const kind = $('txIncomeKind')?.value || 'salary';
  if ($('txExpenseBudgetMonth') && movementMode === 'expense') $('txExpenseBudgetMonth').value = dateMonth;
  if ($('txBudgetMonth') && movementMode === 'income') {
    $('txBudgetMonth').value = kind === 'salary' && day >= 20 ? nextMonthKey(dateMonth) : dateMonth;
  }
}
function settleReserve(type, monthKey = selectedBudgetMonth, silent = false) {
  const budget = ensureBudget(monthKey);
  const amount = safeNumber(budget.reserves[type]);
  if (!(amount > 0)) { if (!silent) alert('Esta reserva não tem valor pendente.'); return true; }
  if (amount > Number(vault.balances.current || 0)) { if (!silent) alert('A conta corrente não tem saldo suficiente para transferir esta reserva.'); return false; }
  vault.balances.current = round2(Number(vault.balances.current || 0) - amount);
  let to = '';
  if (type === 'savings') { vault.balances.savings = round2(Number(vault.balances.savings || 0) + amount); to = 'savings'; }
  if (type === 'amortization') { vault.balances.carFund = round2(Number(vault.balances.carFund || 0) + amount); to = 'carFund'; }
  if (type === 'insurance') {
    vault.insuranceReserve.balance = round2(Number(vault.insuranceReserve.balance || 0) + amount);
    vault.insuranceReserve.history.push({ id: makeId(), type: 'deposit', amount, date: todayISO(), month: monthKey });
    to = 'insuranceReserve';
  }
  budget.committed[type] = round2(Number(budget.committed[type] || 0) + amount);
  budget.reserves[type] = 0;
  const settlementDate = monthKey === currentMonthKey() ? todayISO() : monthEndDate(monthKey);
  vault.transactions.push({ id: makeId(), type: 'transfer', from: 'current', to, description: `Reserva mensal — ${reserveLabel(type)}`, amount, category: type === 'amortization' ? 'Amortização' : type === 'savings' ? 'Poupança' : 'Contas', date: settlementDate, budgetMonth: monthKey, countsInBudget: false, reserveSettlement: type, locked: true });
  save();
  if (!silent) render();
  return true;
}
function closeBudgetMonth(monthKey = selectedBudgetMonth) {
  const budget = ensureBudget(monthKey);
  if (budget.closed) return;
  if (!confirm(`Fechar ${monthLabel(monthKey)} e transferir as reservas pendentes?`)) return;
  for (const type of ['savings', 'amortization', 'insurance']) if (!settleReserve(type, monthKey, true)) { render(); return; }
  budget.closed = true;
  budget.closedAt = new Date().toISOString();
  save(); render();
}
function exteriorDelta(transaction) {
  const amount = Number(transaction.amount || 0);
  if (isExteriorIncome(transaction)) return amount;
  if (isExteriorExpense(transaction)) return -amount;
  if (transaction.type === 'transfer' && transaction.from === 'external' && transaction.to !== 'external') return -amount;
  if (transaction.type === 'transfer' && transaction.to === 'external' && transaction.from !== 'external') return amount;
  return 0;
}
function exteriorBalanceAt(dateInclusive = '9999-12-31') {
  return round2(vault.transactions.filter(t => String(t.date || '') <= dateInclusive).reduce((sum, t) => sum + exteriorDelta(t), 0));
}
function exteriorStats(period = selectedExteriorPeriod, month = selectedExteriorMonth) {
  const now = new Date();
  let start = '0000-01-01', end = '9999-12-31';
  if (period === 'month') { start = `${month}-01`; end = monthEndDate(month); }
  if (period === 'year') { start = `${now.getFullYear()}-01-01`; end = `${now.getFullYear()}-12-31`; }
  const items = vault.transactions.filter(t => String(t.date || '') >= start && String(t.date || '') <= end && exteriorDelta(t) !== 0);
  const income = round2(items.filter(isExteriorIncome).reduce((sum, t) => sum + Number(t.amount || 0), 0));
  const expense = round2(items.filter(isExteriorExpense).reduce((sum, t) => sum + Number(t.amount || 0), 0));
  const transfers = round2(items.filter(t => t.type === 'transfer').reduce((sum, t) => sum + exteriorDelta(t), 0));
  const openingDate = period === 'all' ? '0000-01-01' : new Date(`${start}T12:00:00`).toISOString().slice(0, 10);
  const opening = period === 'all' ? 0 : round2(vault.transactions.filter(t => String(t.date || '') < openingDate).reduce((sum, t) => sum + exteriorDelta(t), 0));
  const closing = period === 'all' ? exteriorBalance() : exteriorBalanceAt(end);
  return { income, expense, transfers, opening, closing, net: round2(income - expense + transfers), items };
}
function renderExteriorMonthOptions() {
  const select = $('exteriorMonthSelect');
  if (!select) return;
  const months = new Set([currentMonthKey(), selectedExteriorMonth]);
  vault.transactions.forEach(t => { if (exteriorDelta(t) !== 0) months.add(monthKeyFromDate(t.date)); });
  const sorted = [...months].filter(key => /^\d{4}-\d{2}$/.test(key)).sort().reverse();
  if (!sorted.includes(selectedExteriorMonth)) selectedExteriorMonth = currentMonthKey();
  select.innerHTML = sorted.map(key => `<option value="${key}" ${key === selectedExteriorMonth ? 'selected' : ''}>${monthLabel(key)}</option>`).join('');
}
function renderExteriorOverview() {
  renderExteriorMonthOptions();
  const select = $('exteriorPeriodSelect'); if (select) select.value = selectedExteriorPeriod;
  const monthField = $('exteriorMonthField'); if (monthField) monthField.hidden = selectedExteriorPeriod !== 'month';
  const stats = exteriorStats(selectedExteriorPeriod, selectedExteriorMonth);
  setText('exteriorIncome', `+${euro(stats.income)}`);
  setText('exteriorExpense', `−${euro(stats.expense)}`);
  setText('exteriorTransfers', `${stats.transfers >= 0 ? '+' : '−'}${euro(Math.abs(stats.transfers))}`);
  setText('exteriorOpening', euro(stats.opening));
  setText('exteriorClosing', euro(stats.closing));
  setText('exteriorBalance', euro(stats.closing));
  setText('exteriorBalanceLabel', selectedExteriorPeriod === 'month' ? 'Saldo no fim do mês' : selectedExteriorPeriod === 'year' ? 'Saldo atual' : 'Saldo exterior atual');
  const list = $('exteriorTransactionList');
  if (list) list.innerHTML = stats.items.length ? [...stats.items].sort((a,b)=>String(b.date||'').localeCompare(String(a.date||''))).map((t,i)=>transactionRowHtml(t,i,true)).join('') : '<div class="empty-state"><span>◎</span>Sem movimentos exteriores neste período.</div>';
}
function renderPortfolioChart() {
  const total = marketPortfolioSummary().current;
  setText('portfolioDonutTotal', euro(total));
  const entries = vault.marketInvestments.map(item => [item.name || item.ticker || 'Investimento', Number(item.currentValue || 0)]).filter(([, value]) => value > 0);
  const legend = $('portfolioLegend');
  if (legend) legend.innerHTML = entries.length ? entries.map(([name, value], index) => `<div class="legend-item"><span class="legend-dot" style="background:${categoryMeta(name,index).color}"></span><span>${escapeHtml(name)}</span><strong>${total > 0 ? Math.round(value / total * 100) : 0}%</strong></div>`).join('') : '<span class="muted">Adiciona investimentos para veres a distribuição.</span>';
  if (currentPage === 'wealth') requestAnimationFrame(() => drawDonut($('portfolioDonut'), entries, total));
}
function transactionRowHtml(t, index = 0, canManage = false) {
  const typeLabels = { income: 'Receita', expense: 'Despesa', transfer: 'Transferência', saving: 'Poupança', investment: 'Investimento', carfund: 'Fundo carro' };
  const meta = categoryMeta(t.category || 'Outros', index);
  const displayType = t.type;
  const sign = displayType === 'income' ? '+' : displayType === 'expense' ? '−' : '';
  const route = isExteriorIncome(t) ? 'Receita exterior' : isExteriorExpense(t) ? 'Despesa exterior' : t.from && t.to ? `${accountLabel(t.from)} → ${accountLabel(t.to)}` : (t.category || typeLabels[displayType] || 'Movimento');
  const menuButton = canManage && !t.locked ? `<button class="tx-options" type="button" data-tx-menu="${escapeHtml(t.id)}" aria-label="Opções do movimento">•••</button>` : '';
  return `<div class="tx-row"><span class="tx-icon" style="background:${meta.color}20;color:${meta.color}">${meta.icon}</span><div class="tx-main"><strong>${escapeHtml(t.description || typeLabels[t.type] || 'Movimento')}</strong><small>${escapeHtml(route)} · ${datePT(t.date)}${t.budgetMonth ? ` · Orçamento ${escapeHtml(monthLabel(t.budgetMonth))}` : ''}</small></div><div class="tx-tail"><strong class="tx-amount ${escapeHtml(displayType)}">${sign}${euro(t.amount)}</strong>${menuButton}</div></div>`;
}
function renderTransactions() {
  const target = $('txList'); if (!target) return;
  const items = [...vault.transactions].sort((a,b)=>`${b.date||''}${b.id||''}`.localeCompare(`${a.date||''}${a.id||''}`)).slice(0,10);
  target.innerHTML = items.length ? items.map((t,i)=>transactionRowHtml(t,i,true)).join('') : '<div class="empty-state"><span>↗</span>Ainda não existem movimentos.</div>';
}
function getFinancialState() {
  return { balances: { ...vault.balances }, insurance: Number(vault.insuranceReserve?.balance || 0) };
}
function applyTransactionEffect(state, transaction, direction = 1) {
  const amount = Number(transaction.amount || 0) * direction;
  const changeAccount = (account, delta) => {
    if (account === 'insuranceReserve') state.insurance = round2(state.insurance + delta);
    const key = BALANCE_KEY_BY_ACCOUNT[account];
    if (key) state.balances[key] = round2(Number(state.balances[key] || 0) + delta);
  };
  if (transaction.insurancePayment) {
    state.insurance = round2(state.insurance - Number(transaction.insuranceUsed || 0) * direction);
    state.balances.current = round2(Number(state.balances.current || 0) - Number(transaction.currentUsed || 0) * direction);
    return;
  }
  if (transaction.from || transaction.to) {
    changeAccount(transaction.from, -amount);
    changeAccount(transaction.to, amount);
    return;
  }
  if (transaction.type === 'income') state.balances.current = round2(Number(state.balances.current || 0) + amount);
  if (transaction.type === 'expense') state.balances.current = round2(Number(state.balances.current || 0) - amount);
  if (transaction.type === 'saving') { state.balances.current = round2(state.balances.current - amount); state.balances.savings = round2(state.balances.savings + amount); }
  if (transaction.type === 'investment') { state.balances.current = round2(state.balances.current - amount); state.balances.investments = round2(state.balances.investments + amount); }
  if (transaction.type === 'carfund') { state.balances.current = round2(state.balances.current - amount); state.balances.carFund = round2(state.balances.carFund + amount); }
}
function commitFinancialState(state) { vault.balances = { ...state.balances }; vault.insuranceReserve.balance = round2(state.insurance); }
function stateIsValid(state) { return Object.values(state.balances).every(value => Number(value) >= -0.005) && Number(state.insurance) >= -0.005; }
function deleteTransaction(id) {
  const index = vault.transactions.findIndex(t => t.id === id); if (index < 0) return;
  const transaction = vault.transactions[index];
  if (transaction.locked) return alert('Este movimento está ligado ao crédito e não pode ser apagado aqui.');
  if (!confirm(`Apagar “${transaction.description}”? Os totais deste mês e dos seguintes serão recalculados.`)) return;
  const state = getFinancialState(); applyTransactionEffect(state, transaction, -1);
  if (!stateIsValid(state)) return alert('Não é possível apagar porque um dos saldos ficaria negativo. Atualiza primeiro os saldos ou corrige o movimento.');
  commitFinancialState(state); vault.transactions.splice(index, 1); save(); refreshAnnualClosureForDate(transaction.date); render(); $('txActionDialog')?.close();
}
function openTransactionActions(id) {
  const item = vault.transactions.find(t => t.id === id); if (!item) return;
  if (item.locked) return alert('Este movimento é gerido na página do crédito.');
  $('txActionId').value = id; setText('txActionTitle', item.description || 'Movimento'); openDialog('txActionDialog');
}
function openTransactionEditor(id) {
  const item = vault.transactions.find(t => t.id === id); if (!item || item.locked) return;
  $('txEditId').value = id; $('txEditDesc').value = item.description || ''; $('txEditAmount').value = Number(item.amount || 0); $('txEditDate').value = item.date || todayISO(); $('txEditCategory').value = item.category || 'Outros'; $('txEditBudgetMonth').value = assignedBudgetMonth(item); $('txEditCountsBudget').checked = item.type === 'income' || (item.type === 'expense' && item.countsInBudget !== false); $('txActionDialog')?.close(); openDialog('txEditDialog');
}
function openReserveEditor(type) {
  const budget = ensureBudget(selectedBudgetMonth); $('reserveEditType').value = type; setText('reserveEditTitle', reserveLabel(type)); setText('reserveEditCurrent', `Valor atual: ${euro(budget.reserves[type])}`); $('reserveEditValue').value = Number(budget.reserves[type] || 0); openDialog('reserveEditDialog');
}
function prepareBudgetSettings() {
  const month = selectedBudgetMonth || currentMonthKey(); const budget = ensureBudget(month);
  $('budgetSettingsMonth').value = month; $('budgetSavingsReserve').value = Number(budget.reserves.savings || 0); $('budgetAmortReserve').value = Number(budget.reserves.amortization || 0); $('budgetInsuranceReserve').value = Number(budget.reserves.insurance || 0); $('saveBudgetDefaults').checked = false;
}
function prepareInsuranceDialog() {
  setText('insuranceDialogBalance', euro(vault.insuranceReserve.balance)); $('insuranceDefaultInput').value = Number(vault.insuranceReserve.monthlyDefault || vault.budgetDefaults.insurance || 0); $('insuranceAdjustAmount').value = ''; $('insurancePaymentAmount').value = ''; $('insurancePaymentDate').value = todayISO();
}
function openDialog(id) {
  if (id === 'budgetSettingsDialog') prepareBudgetSettings();
  if (id === 'insuranceDialog') prepareInsuranceDialog();
  const dialog = $(id); if (dialog?.showModal && !dialog.open) dialog.showModal();
}
function initBudgetFeatureListeners() {
  document.addEventListener('click', event => {
    const menu = event.target.closest('[data-tx-menu]'); if (menu) { event.preventDefault(); openTransactionActions(menu.dataset.txMenu); return; }
    const reserve = event.target.closest('[data-edit-reserve]'); if (reserve) { event.preventDefault(); openReserveEditor(reserve.dataset.editReserve); }
  });
  $('budgetSettingsForm')?.addEventListener('submit', event => {
    if (event.submitter?.value === 'cancel') return; event.preventDefault();
    const month = $('budgetSettingsMonth').value || selectedBudgetMonth; const budget = ensureBudget(month);
    budget.reserves.savings = safeNumber($('budgetSavingsReserve').value); budget.reserves.amortization = safeNumber($('budgetAmortReserve').value); budget.reserves.insurance = safeNumber($('budgetInsuranceReserve').value);
    if ($('saveBudgetDefaults').checked) {
      vault.budgetDefaults = { ...budget.reserves };
      vault.insuranceReserve.monthlyDefault = budget.reserves.insurance;
    }
    selectedBudgetMonth = month; save(); $('budgetSettingsDialog').close(); render();
  });
  $('reserveEditForm')?.addEventListener('submit', event => {
    event.preventDefault(); const type = $('reserveEditType').value; ensureBudget(selectedBudgetMonth).reserves[type] = safeNumber($('reserveEditValue').value); save(); $('reserveEditDialog').close(); render();
  });
  $('settleReserveNow')?.addEventListener('click', () => { const type = $('reserveEditType').value; if (settleReserve(type, selectedBudgetMonth)) $('reserveEditDialog').close(); });
  $('cancelReserve')?.addEventListener('click', () => { const type = $('reserveEditType').value; ensureBudget(selectedBudgetMonth).reserves[type] = 0; save(); $('reserveEditDialog').close(); render(); });
  $('closeBudgetMonth')?.addEventListener('click', () => closeBudgetMonth(selectedBudgetMonth));
  $('editTxButton')?.addEventListener('click', () => openTransactionEditor($('txActionId').value));
  $('deleteTxButton')?.addEventListener('click', () => deleteTransaction($('txActionId').value));
  $('txEditForm')?.addEventListener('submit', event => {
    event.preventDefault(); const id = $('txEditId').value; const index = vault.transactions.findIndex(t => t.id === id); if (index < 0) return;
    const old = vault.transactions[index]; const updated = { ...old, description: $('txEditDesc').value.trim(), amount: round2($('txEditAmount').value), date: $('txEditDate').value, category: $('txEditCategory').value, budgetMonth: $('txEditBudgetMonth').value || monthKeyFromDate($('txEditDate').value), countsInBudget: old.type === 'income' ? true : Boolean($('txEditCountsBudget').checked) };
    if (!(updated.amount > 0)) return alert('Introduz um valor válido.');
    const state = getFinancialState(); applyTransactionEffect(state, old, -1); applyTransactionEffect(state, updated, 1);
    if (!stateIsValid(state)) return alert('A correção deixaria um saldo negativo.');
    commitFinancialState(state); vault.transactions[index] = updated; save(); refreshAnnualClosureForDate(old.date); refreshAnnualClosureForDate(updated.date); $('txEditDialog').close(); render();
  });
  $('insuranceForm')?.addEventListener('submit', event => {
    if (event.submitter?.value === 'cancel') return; event.preventDefault();
    const value = safeNumber($('insuranceDefaultInput').value); vault.insuranceReserve.monthlyDefault = value; vault.budgetDefaults.insurance = value; save(); $('insuranceDialog').close(); render();
  });
  $('adjustInsuranceReserve')?.addEventListener('click', () => {
    const amount = safeNumber($('insuranceAdjustAmount').value); if (!(amount > 0)) return alert('Introduz um valor válido.');
    const action = $('insuranceAdjustAction').value;
    if (action === 'add') { if (amount > vault.balances.current) return alert('Saldo insuficiente na conta corrente.'); vault.balances.current = round2(vault.balances.current - amount); vault.insuranceReserve.balance = round2(vault.insuranceReserve.balance + amount); }
    else { if (amount > vault.insuranceReserve.balance) return alert('A reserva do seguro não tem esse valor.'); vault.insuranceReserve.balance = round2(vault.insuranceReserve.balance - amount); vault.balances.current = round2(vault.balances.current + amount); }
    vault.insuranceReserve.history.push({ id: makeId(), type: action, amount, date: todayISO() }); save(); prepareInsuranceDialog(); render();
  });
  $('payInsuranceButton')?.addEventListener('click', () => {
    const amount = safeNumber($('insurancePaymentAmount').value); const date = $('insurancePaymentDate').value || todayISO(); if (!(amount > 0)) return alert('Introduz o valor real do seguro.');
    const availableReserve = Number(vault.insuranceReserve.balance || 0); const insuranceUsed = Math.min(availableReserve, amount); const currentUsed = round2(Math.max(0, amount - insuranceUsed));
    if (currentUsed > Number(vault.balances.current || 0)) return alert('A reserva e a conta corrente não chegam para pagar este valor.');
    vault.insuranceReserve.balance = round2(availableReserve - insuranceUsed); vault.balances.current = round2(vault.balances.current - currentUsed);
    const month = monthKeyFromDate(date);
    vault.transactions.push({ id: makeId(), type: 'expense', from: 'insuranceReserve', to: 'external', description: 'Seguro anual', amount, category: 'Contas', date, budgetMonth: month, countsInBudget: true, budgetImpact: currentUsed, insurancePayment: true, insuranceUsed, currentUsed, locked: true });
    const surplus = Number(vault.insuranceReserve.balance || 0);
    if (surplus > 0) {
      vault.insuranceReserve.balance = 0; vault.balances.current = round2(vault.balances.current + surplus);
      vault.transactions.push({ id: makeId(), type: 'transfer', from: 'insuranceReserve', to: 'current', description: 'Sobra do seguro devolvida', amount: surplus, category: 'Contas', date, budgetMonth: month, budgetReturn: true, countsInBudget: false, locked: true });
    }
    vault.insuranceReserve.history.push({ id: makeId(), type: 'payment', amount, insuranceUsed, currentUsed, date }); save(); $('insuranceDialog').close(); render();
  });
}


if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
else init();
