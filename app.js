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

const CATEGORY_META = {
  'Alimentação': { icon: '🛒', color: '#12a594' },
  'Carro': { icon: '🚘', color: '#e29432' },
  'Combustível': { icon: '⛽', color: '#d56552' },
  'Casa': { icon: '🏠', color: '#5b83d6' },
  'Contas': { icon: '🧾', color: '#7e65cf' },
  'Ginásio': { icon: '🏋️', color: '#4aa96c' },
  'Lazer': { icon: '🎮', color: '#e15b8f' },
  'Saúde': { icon: '🩺', color: '#47a3c7' },
  'Compras': { icon: '🛍️', color: '#9a71c5' },
  'Amortização': { icon: '📉', color: '#bf7b2b' },
  'Salário': { icon: '💼', color: '#1a9259' },
  'Poupança': { icon: '💰', color: '#0f988a' },
  'Investimentos': { icon: '📈', color: '#397bd8' },
  'Outros': { icon: '•••', color: '#84918e' }
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
  return CATEGORY_META[category] || { icon: '•', color: FALLBACK_COLORS[index % FALLBACK_COLORS.length] };
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
  const typeLabels = { income: 'Receita', expense: 'Despesa', saving: 'Poupança', investment: 'Investimento', carfund: 'Fundo carro' };
  const meta = categoryMeta(t.category || 'Outros', index);
  const sign = t.type === 'income' ? '+' : t.type === 'expense' ? '−' : '→';
  const deleteButton = canDelete && !t.locked
    ? `<button class="tx-delete" type="button" data-delete-tx="${escapeHtml(t.id)}">Eliminar</button>`
    : '';
  return `<div class="tx-row">
    <span class="tx-icon" style="background:${meta.color}20;color:${meta.color}">${meta.icon}</span>
    <div class="tx-main"><strong>${escapeHtml(t.description || typeLabels[t.type] || 'Movimento')}</strong><small>${escapeHtml(t.category || typeLabels[t.type] || 'Movimento')} · ${datePT(t.date)}</small></div>
    <div><strong class="tx-amount ${escapeHtml(t.type)}">${sign}${euro(t.amount)}</strong>${deleteButton}</div>
  </div>`;
}

function deleteTransaction(id) {
  const index = vault.transactions.findIndex(t => t.id === id);
  if (index < 0) return;
  const t = vault.transactions[index];
  if (!confirm(`Eliminar o movimento “${t.description}”?`)) return;

  const amount = Number(t.amount) || 0;
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
    CATEGORY_META[name] = { icon: '•', color: colors[name] || FALLBACK_COLORS[index] };
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

  const cards = [
    { color: 'mint', icon: '◎', title: 'Objetivo de poupança', text: `Já concluíste <strong>${pctText(savingsPct)}</strong> da meta anual. Faltam ${euro(savingsRemaining)} — cerca de ${euro(monthlyNeeded)} por mês até dezembro.` },
    { color: current.expense <= previous.expense ? 'mint' : 'rose', icon: '↕', title: 'Ritmo de despesas', text: spendingText },
    { color: 'amber', icon: '🚘', title: 'Crédito automóvel', text: projection.count ? `Ao ritmo atual, o carro ficará pago em <strong>${datePT(projection.payoffDate, { month: 'long', year: 'numeric' })}</strong>, após cerca de ${projection.count} prestações.` : 'O crédito está liquidado ou precisa de dados atualizados.' },
    { color: 'blue', icon: '↗', title: 'Rendimento estimado', text: `Os investimentos estão a gerar aproximadamente <strong>${euro(dailyYield)} por dia</strong> e ${euro(dailyYield * 365)} por ano à taxa atual.` },
    { color: 'rose', icon: '◔', title: 'Maior categoria', text: top[1] ? `A categoria com mais gastos este mês é <strong>${escapeHtml(top[0])}</strong>, com ${euro(top[1])}.` : 'Ainda não existem despesas registadas neste mês.' },
    { color: current.balance >= 0 ? 'mint' : 'rose', icon: '≋', title: 'Saldo mensal', text: current.balance >= 0 ? `As receitas superam as despesas em <strong>${euro(current.balance)}</strong> este mês.` : `As despesas superam as receitas em <strong>${euro(Math.abs(current.balance))}</strong> este mês.` }
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

function updateCategoryForType() {
  const type = $('txType')?.value;
  const category = $('txCategory');
  if (!category) return;
  const defaults = { income: 'Salário', expense: 'Alimentação', saving: 'Poupança', investment: 'Investimentos', carfund: 'Carro' };
  if (defaults[type]) category.value = defaults[type];
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
      if (button.dataset.txType && $('txType')) {
        $('txType').value = button.dataset.txType;
        updateCategoryForType();
      }
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
  $('txType').addEventListener('change', updateCategoryForType);
  $('expenseMonthSelect').addEventListener('change', event => {
    selectedExpenseMonth = event.target.value;
    renderExpenses();
  });

  $('txForm').addEventListener('submit', event => {
    if (event.submitter?.value === 'cancel') return;
    event.preventDefault();
    const amount = Number($('txAmount').value);
    if (!(amount > 0)) return alert('Introduz um valor válido.');
    const type = $('txType').value;
    if (['expense', 'saving', 'investment', 'carfund'].includes(type) && amount > vault.balances.current) {
      return alert('O valor é superior ao saldo da conta corrente. Atualiza o saldo ou introduz um valor inferior.');
    }

    if (type === 'income') vault.balances.current = round2(vault.balances.current + amount);
    if (type === 'expense') vault.balances.current = round2(vault.balances.current - amount);
    if (type === 'saving') {
      vault.balances.current = round2(vault.balances.current - amount);
      vault.balances.savings = round2(vault.balances.savings + amount);
    }
    if (type === 'investment') {
      vault.balances.current = round2(vault.balances.current - amount);
      vault.balances.investments = round2(vault.balances.investments + amount);
    }
    if (type === 'carfund') {
      vault.balances.current = round2(vault.balances.current - amount);
      vault.balances.carFund = round2(vault.balances.carFund + amount);
    }

    vault.transactions.push({
      id: makeId(), type,
      description: $('txDesc').value.trim(),
      amount: round2(amount),
      category: $('txCategory').value,
      date: $('txDate').value
    });
    save();
    event.target.reset();
    $('txDate').value = todayISO();
    $('txType').value = 'income';
    updateCategoryForType();
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
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js?v=13.0.0').catch(console.error);
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
else init();
