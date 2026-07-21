'use strict';

const STORE = 'dealers_data_v2';
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
    version: 5,
    balances: { current: 0, savings: 0, investments: 0, carFund: 0 },
    savingsGoal: 0,
    carFundGoal: 0,
    annualRate: 0,
    transactions: [],
    loan: {
      originalBalance: 0,
      balance: 0,
      payment: 0,
      annualRate: 0,
      stampRate: 0,
      nextDate: '',
      history: []
    }
  };
}

function normalize(data) {
  const source = data && typeof data === 'object' ? data : {};
  const base = blank();
  return {
    ...base,
    ...source,
    version: 5,
    balances: { ...base.balances, ...(source.balances || {}) },
    loan: {
      ...base.loan,
      ...(source.loan || {}),
      history: Array.isArray(source.loan?.history) ? source.loan.history : []
    },
    transactions: Array.isArray(source.transactions) ? source.transactions : []
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

function save() {
  vault.version = 5;
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

function installmentParts(balance = vault.loan.balance, payment = vault.loan.payment) {
  const interest = round2(balance * (Number(vault.loan.annualRate) / 12));
  const stamp = round2(interest * Number(vault.loan.stampRate));
  const capital = round2(Math.min(balance, Math.max(0, Number(payment) - interest - stamp)));
  return { interest, stamp, capital, total: round2(capital + interest + stamp) };
}

function projectLoan() {
  let balance = Number(vault.loan.balance) || 0;
  const payment = Number(vault.loan.payment) || 0;
  if (balance <= 0 || payment <= 0) return { count: 0, payoffDate: '', interestTotal: 0 };
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

  return { count, payoffDate: date, interestTotal: round2(interestTotal) };
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
  const sign = t.type === 'income' ? '+' : t.type === 'expense' ? '−' : '↔';
  const route = t.from && t.to ? `${accountLabel(t.from)} → ${accountLabel(t.to)}` : (t.category || typeLabels[t.type] || 'Movimento');
  const deleteButton = canDelete && !t.locked
    ? `<button class="tx-delete" type="button" data-delete-tx="${escapeHtml(t.id)}">Eliminar</button>`
    : '';
  return `<div class="tx-row">
    <span class="tx-icon" style="background:${meta.color}20;color:${meta.color}">${meta.icon}</span>
    <div class="tx-main"><strong>${escapeHtml(t.description || typeLabels[t.type] || 'Movimento')}</strong><small>${escapeHtml(route)} · ${datePT(t.date)}</small></div>
    <div><strong class="tx-amount ${escapeHtml(t.type)}">${sign}${euro(t.amount)}</strong>${deleteButton}</div>
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
      ? items.map((t, index) => transactionRowHtml(t, index, false)).join('')
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
  const entries = [
    ['Conta corrente', Number(b.current) || 0],
    ['Poupança', Number(b.savings) || 0],
    ['Investimentos', Number(b.investments) || 0],
    ['Fundo carro', Number(b.carFund) || 0]
  ].filter(([, amount]) => amount > 0);
  const colors = {
    'Conta corrente': '#0f988a',
    'Poupança': '#36b87d',
    'Investimentos': '#397bd8',
    'Fundo carro': '#e29432'
  };
  entries.forEach(([name], index) => {
    CATEGORY_META[name] = { icon: ICONS.dots, color: colors[name] || FALLBACK_COLORS[index] };
  });
  const total = sumBalances();
  drawDonut($('allocationDonut'), entries, total);
  setText('allocationTotal', euro(total));
  const legend = $('allocationLegend');
  if (legend) {
    legend.innerHTML = entries.length
      ? entries.map(([name, amount], index) => `<div class="legend-item"><span class="legend-dot" style="background:${colors[name] || FALLBACK_COLORS[index]}"></span><span>${name}</span><strong>${total ? Math.round(amount / total * 100) : 0}%</strong></div>`).join('')
      : '<span class="muted">Atualiza os saldos para veres a distribuição.</span>';
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
  const savingsPct = vault.savingsGoal ? Math.min(100, vault.balances.savings / vault.savingsGoal * 100) : 0;
  const savingsRemaining = Math.max(0, vault.savingsGoal - vault.balances.savings);
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

  const totalBalance = sumBalances();
  const cards = [
    { color: 'mint', icon: ICONS.wallet, title: 'Saldo total', text: `O teu saldo total atual é <strong>${euro(totalBalance)}</strong>, somando conta corrente, poupança, investimentos e fundo do carro.` },
    { color: 'mint', icon: ICONS.savings, title: 'Objetivo de poupança', text: `Já concluíste <strong>${pctText(savingsPct)}</strong> da meta anual. Faltam ${euro(savingsRemaining)} — cerca de ${euro(monthlyNeeded)} por mês até dezembro.` },
    { color: current.expense <= previous.expense ? 'mint' : 'rose', icon: ICONS.receipt, title: 'Ritmo de despesas', text: spendingText },
    { color: 'amber', icon: ICONS.coins_down, title: 'Crédito automóvel', text: projection.count ? `Ao ritmo atual, o carro ficará pago em <strong>${datePT(projection.payoffDate, { month: 'long', year: 'numeric' })}</strong>, após cerca de ${projection.count} prestações.` : 'O crédito está liquidado ou precisa de dados atualizados.' },
    { color: 'blue', icon: ICONS.trend, title: 'Rendimento estimado', text: `Os investimentos estão a gerar aproximadamente <strong>${euro(dailyYield)} por dia</strong> e ${euro(dailyYield * 365)} por ano à taxa atual.` },
    { color: 'rose', icon: ICONS.pie, title: 'Maior categoria', text: top[1] ? `A categoria com mais gastos este mês é <strong>${escapeHtml(top[0])}</strong>, com ${euro(top[1])}.` : 'Ainda não existem despesas registadas neste mês.' }
  ];

  target.innerHTML = cards.map(card => `<article class="insight-card"><span class="insight-icon ${card.color}">${card.icon}</span><h3>${card.title}</h3><p>${card.text}</p></article>`).join('');
}

function render() {
  const b = vault.balances;
  const total = sumBalances();
  const currentMonth = new Date().toISOString().slice(0, 7);
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

  const savingsPct = vault.savingsGoal ? Math.min(100, (b.savings / vault.savingsGoal) * 100) : 0;
  setWidth('savingsProgress', savingsPct);
  setWidth('savingsPageProgress', savingsPct);
  setText('savingsNow', euro(b.savings));
  setText('savingsPct', pctText(savingsPct));
  setText('savingsGoalLabel', euro(vault.savingsGoal));
  setText('savingsPageNow', euro(b.savings));
  setText('savingsPagePct', pctText(savingsPct));
  setText('savingsPageGoal', `Meta: ${euro(vault.savingsGoal)}`);
  setText('savingsPageRemaining', `Faltam ${euro(Math.max(0, vault.savingsGoal - b.savings))}`);

  const carPct = vault.carFundGoal ? Math.min(100, (b.carFund / vault.carFundGoal) * 100) : 0;
  setWidth('carFundProgress', carPct);
  setWidth('carPageFundProgress', carPct);
  setText('carFundNow', euro(b.carFund));
  setText('carFundPct', pctText(carPct));
  setText('carFundGoalLabel', euro(vault.carFundGoal));
  setText('carPageFundNow', euro(b.carFund));
  setText('carPageFundPct', pctText(carPct));
  setText('carPageFundGoal', euro(vault.carFundGoal));

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
  setText('estimatedPayoff', projection.count ? datePT(projection.payoffDate, { month: 'short', year: 'numeric' }) : 'Liquidado');
  setText('remainingPayments', projection.count);
  setText('projectedInterest', euro(projection.interestTotal));
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

  renderTransactions();
  renderExpenseMonthOptions();
  renderExpenses();
  renderLoanHistory();
  renderInsights();
  requestAnimationFrame(renderAllocationChart);
}

function showPage(name) {
  currentPage = name;
  document.querySelectorAll('.page').forEach(page => page.classList.toggle('active', page.id === `page-${name}`));
  document.querySelectorAll('.bottom-nav [data-page]').forEach(button => button.classList.toggle('active', button.dataset.page === name));
  window.scrollTo({ top: 0, behavior: 'smooth' });
  requestAnimationFrame(() => {
    if (name === 'expenses') renderExpenseCharts();
    if (name === 'wealth') renderAllocationChart();
  });
}

function openDialog(id) {
  const dialog = $(id);
  if (dialog?.showModal) dialog.showModal();
}

const BALANCE_KEY_BY_ACCOUNT = Object.freeze({ current: 'current', savings: 'savings', investments: 'investments', carFund: 'carFund' });
const ACCOUNT_LABELS = Object.freeze({ external: 'Exterior', current: 'Conta corrente', savings: 'Poupança', investments: 'Investimentos', carFund: 'Fundo carro' });

function accountLabel(account) {
  return ACCOUNT_LABELS[account] || 'Conta';
}

function updateCategoryForTransfer() {
  const from = $('txFrom')?.value;
  const to = $('txTo')?.value;
  const category = $('txCategory');
  if (!category) return;
  if (from === 'external' && to === 'current') category.value = 'Salário';
  else if (to === 'external') category.value = 'Alimentação';
  else if (to === 'savings' || from === 'savings') category.value = 'Poupança';
  else if (to === 'investments' || from === 'investments') category.value = 'Investimentos';
  else if (to === 'carFund' || from === 'carFund') category.value = 'Carro';
  else category.value = 'Outros';
}

function setTransferPreset(type) {
  const presets = {
    income: ['external', 'current'],
    expense: ['current', 'external'],
    saving: ['current', 'savings'],
    investment: ['current', 'investments'],
    carfund: ['current', 'carFund']
  };
  const [from, to] = presets[type] || ['current', 'external'];
  if ($('txFrom')) $('txFrom').value = from;
  if ($('txTo')) $('txTo').value = to;
  updateCategoryForTransfer();
}

function transactionType(from, to) {
  if (from === 'external') return 'income';
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
  });
}

function initTheme() {
  const stored = storageGet(THEME_STORE);
  applyTheme(stored || 'dark');
}

function init() {
  initTheme();
  $('txDate').value = todayISO();
  setTransferPreset('expense');

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
  $('expenseMonthSelect').addEventListener('change', event => {
    selectedExpenseMonth = event.target.value;
    renderExpenses();
  });

  $('txForm').addEventListener('submit', event => {
    if (event.submitter?.value === 'cancel') return;
    event.preventDefault();
    const amount = Number($('txAmount').value);
    if (!(amount > 0)) return alert('Introduz um valor válido.');

    const from = $('txFrom').value;
    const to = $('txTo').value;
    if (from === to) return alert('Escolhe locais diferentes para a origem e o destino.');
    if (from === 'external' && to === 'external') return alert('Escolhe pelo menos uma conta da aplicação.');

    const fromKey = BALANCE_KEY_BY_ACCOUNT[from];
    const toKey = BALANCE_KEY_BY_ACCOUNT[to];
    if (fromKey && amount > Number(vault.balances[fromKey] || 0)) {
      return alert(`Saldo insuficiente em ${accountLabel(from)}.`);
    }

    if (fromKey) vault.balances[fromKey] = round2(Number(vault.balances[fromKey] || 0) - amount);
    if (toKey) vault.balances[toKey] = round2(Number(vault.balances[toKey] || 0) + amount);

    const type = transactionType(from, to);
    vault.transactions.push({
      id: makeId(),
      type,
      from,
      to,
      description: $('txDesc').value.trim(),
      amount: round2(amount),
      category: $('txCategory').value,
      date: $('txDate').value
    });
    save();
    event.target.reset();
    $('txDate').value = todayISO();
    setTransferPreset('expense');
    $('txDialog').close();
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
    if (originalBalance > 0 && balance > originalBalance) return alert('A dívida atual não pode ser superior ao valor inicial financiado.');
    vault.loan.originalBalance = round2(originalBalance);
    vault.loan.balance = round2(balance);
    vault.loan.payment = round2(payment);
    vault.loan.annualRate = annualRatePct / 100;
    vault.loan.stampRate = stampRatePct / 100;
    vault.loan.nextDate = $('loanNextDateInput').value || '';
    save();
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
    vault.loan.balance = round2(Math.max(0, vault.loan.balance - parts.capital));
    const paymentDate = $('paymentDate').value;
    vault.loan.nextDate = addMonths(vault.loan.nextDate || paymentDate, 1);
    const historyId = makeId();
    vault.loan.history.push({ id: historyId, type: 'payment', date: paymentDate, ...parts });
    vault.transactions.push({ id: makeId(), type: 'expense', description: 'Prestação do carro', amount: parts.total, category: 'Carro', date: paymentDate, locked: true, loanHistoryId: historyId });
    save(); $('paymentDialog').close(); render();
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
    const date = $('extraDate').value;
    const historyId = makeId();
    vault.loan.history.push({ id: historyId, type: 'extra', date, amount: round2(amount), source });
    vault.transactions.push({ id: makeId(), type: 'expense', description: 'Amortização extraordinária do carro', amount: round2(amount), category: 'Amortização', date, locked: true, loanHistoryId: historyId });
    save(); event.target.reset(); $('extraDate').value = todayISO(); $('extraDialog').close(); render();
  });

  $('exportBackup').addEventListener('click', () => {
    const payload = { app: 'DEALER$', format: 5, data: vault, exported: new Date().toISOString() };
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
      save(); render();
      alert('Cópia importada com sucesso.');
    } catch (error) {
      console.error(error);
      alert('O ficheiro selecionado não é uma cópia válida da DEALER$.');
    } finally {
      event.target.value = '';
    }
  });

  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      renderExpenseCharts();
      renderAllocationChart();
    }, 120);
  });

  render();
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js?v=23.10.0').catch(console.error);
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
else init();
