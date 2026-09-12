/**
 * VaultFlow — Modern Personal Expense Tracker
 * Frontend Logic & Interactions
 */

// Category icons and aesthetic colors
const CATEGORY_CONFIG = {
  'Food & Dining': { icon: '🍔', color: '#f59e0b' },
  'Housing': { icon: '🏠', color: '#6366f1' },
  'Utilities': { icon: '💡', color: '#06b6d4' },
  'Transportation': { icon: '🚗', color: '#3b82f6' },
  'Shopping': { icon: '🛍️', color: '#ec4899' },
  'Entertainment': { icon: '🎬', color: '#8b5cf6' },
  'Health & Fitness': { icon: '💊', color: '#10b981' },
  'Salary': { icon: '💼', color: '#10b981' },
  'Freelance': { icon: '💻', color: '#14b8a6' },
  'Investments': { icon: '📈', color: '#8b5cf6' },
  'Other': { icon: '✨', color: '#64748b' }
};

// Payment Method Icons
const PAYMENT_ICONS = {
  'Credit Card': '💳',
  'Debit Card': '💳',
  'Bank Transfer': '🏛️',
  'Cash': '💵',
  'Apple Pay / Google Pay': '📱',
  'Other': '✨'
};

// Application State
const state = {
  transactions: [],
  summary: null,
  filters: {
    search: '',
    type: 'all',
    category: 'all',
    sortBy: 'date_desc'
  },
  chartView: 'expense', // 'expense' or 'income'
  editingId: null,
  deletingId: null,
  categoryChart: null,
  trendChart: null
};

// DOM Elements
const elements = {
  // Stats
  netBalanceValue: document.getElementById('netBalanceValue'),
  totalIncomeValue: document.getElementById('totalIncomeValue'),
  totalExpenseValue: document.getElementById('totalExpenseValue'),
  savingsRateValue: document.getElementById('savingsRateValue'),
  savingsProgressBar: document.getElementById('savingsProgressBar'),
  incomeCountBadge: document.getElementById('incomeCountBadge'),
  expenseCountBadge: document.getElementById('expenseCountBadge'),
  balanceStatusBadge: document.getElementById('balanceStatusBadge'),
  currentDateDisplay: document.getElementById('currentDateDisplay'),

  // Filters & Controls
  searchInput: document.getElementById('searchInput'),
  clearSearchBtn: document.getElementById('clearSearchBtn'),
  typeFilterBtns: document.querySelectorAll('.type-filter-btn'),
  categoryFilter: document.getElementById('categoryFilter'),
  sortBySelect: document.getElementById('sortBySelect'),
  resetFiltersBtn: document.getElementById('resetFiltersBtn'),
  txCountNumber: document.getElementById('txCountNumber'),

  // List & States
  transactionsList: document.getElementById('transactionsList'),
  emptyState: document.getElementById('emptyState'),
  loadingState: document.getElementById('loadingState'),
  emptyAddBtn: document.getElementById('emptyAddBtn'),

  // Modals
  txModal: document.getElementById('txModal'),
  modalTitle: document.getElementById('modalTitle'),
  modalSubtitle: document.getElementById('modalSubtitle'),
  txForm: document.getElementById('txForm'),
  txId: document.getElementById('txId'),
  txTitle: document.getElementById('txTitle'),
  txAmount: document.getElementById('txAmount'),
  txCategory: document.getElementById('txCategory'),
  txDate: document.getElementById('txDate'),
  txPaymentMethod: document.getElementById('txPaymentMethod'),
  txNotes: document.getElementById('txNotes'),
  openAddModalBtn: document.getElementById('openAddModalBtn'),
  closeModalBtn: document.getElementById('closeModalBtn'),
  cancelModalBtn: document.getElementById('cancelModalBtn'),

  // Errors
  txTitleError: document.getElementById('txTitleError'),
  txAmountError: document.getElementById('txAmountError'),

  // Delete Modal
  deleteModal: document.getElementById('deleteModal'),
  deleteTxTitle: document.getElementById('deleteTxTitle'),
  cancelDeleteBtn: document.getElementById('cancelDeleteBtn'),
  confirmDeleteBtn: document.getElementById('confirmDeleteBtn'),

  // Charts
  categoryChartCanvas: document.getElementById('categoryChart'),
  categoryLegend: document.getElementById('categoryLegend'),
  monthlyTrendChartCanvas: document.getElementById('monthlyTrendChart'),
  chartExpenseToggle: document.getElementById('chartExpenseToggle'),
  chartIncomeToggle: document.getElementById('chartIncomeToggle'),

  // Theme & Toast
  themeToggleBtn: document.getElementById('themeToggleBtn'),
  themeIcon: document.getElementById('themeIcon'),
  toastContainer: document.getElementById('toastContainer')
};

// Utilities
const formatCurrency = (val) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2
  }).format(val || 0);
};

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const d = new Date(parts[0], parts[1] - 1, parts[2]);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }
  return dateStr;
};

// Debounce helper for search
function debounce(func, wait = 250) {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  setCurrentDate();
  setupEventListeners();
  loadData();
  lucide.createIcons();
});

function setCurrentDate() {
  const options = { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' };
  elements.currentDateDisplay.textContent = new Date().toLocaleDateString('en-US', options);
}

// Theme Handling
function initTheme() {
  const savedTheme = localStorage.getItem('vaultflow_theme') || 'dark';
  document.documentElement.setAttribute('data-theme', savedTheme);
  updateThemeIcon(savedTheme);
}

function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', newTheme);
  localStorage.setItem('vaultflow_theme', newTheme);
  updateThemeIcon(newTheme);

  // Update chart theme colors
  if (state.categoryChart) {
    state.categoryChart.update();
  }
  if (state.trendChart) {
    updateTrendChartTheme(newTheme);
  }
}

function updateThemeIcon(theme) {
  if (theme === 'light') {
    elements.themeIcon.setAttribute('data-lucide', 'moon');
  } else {
    elements.themeIcon.setAttribute('data-lucide', 'sun');
  }
  lucide.createIcons();
}

// Toast Notifications
function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;

  const iconName = type === 'success' ? 'check-circle' : type === 'error' ? 'alert-circle' : 'info';

  toast.innerHTML = `
    <div class="toast-icon"><i data-lucide="${iconName}"></i></div>
    <span>${message}</span>
  `;

  elements.toastContainer.appendChild(toast);
  lucide.createIcons();

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// Fetch Data from Server
async function loadData() {
  showLoading(true);
  try {
    await Promise.all([fetchTransactions(), fetchSummary()]);
  } catch (err) {
    console.error('Error loading data:', err);
    showToast('Failed to load records from SQLite database.', 'error');
  } finally {
    showLoading(false);
  }
}

function showLoading(isLoading) {
  if (isLoading) {
    elements.loadingState.style.display = 'flex';
  } else {
    elements.loadingState.style.display = 'none';
  }
}

async function fetchTransactions() {
  const params = new URLSearchParams();
  if (state.filters.search) params.append('search', state.filters.search);
  if (state.filters.type && state.filters.type !== 'all') params.append('type', state.filters.type);
  if (state.filters.category && state.filters.category !== 'all') params.append('category', state.filters.category);
  if (state.filters.sortBy) params.append('sortBy', state.filters.sortBy);

  const res = await fetch(`/api/transactions?${params.toString()}`);
  if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
  const json = await res.json();
  state.transactions = json.data || [];
  renderTransactions();
}

async function fetchSummary() {
  const res = await fetch('/api/stats/summary');
  if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
  const json = await res.json();
  state.summary = json;
  updateSummaryMetrics(json);
  renderCharts(json);
}

// Update Top Metric Cards
function updateSummaryMetrics(data) {
  const { summary } = data;
  if (!summary) return;

  // Net Balance
  elements.netBalanceValue.textContent = formatCurrency(summary.balance);
  if (summary.balance < 0) {
    elements.netBalanceValue.style.color = 'var(--expense-color)';
    elements.balanceStatusBadge.className = 'badge badge-expense';
    elements.balanceStatusBadge.innerHTML = '<i data-lucide="trending-down"></i> Negative';
  } else {
    elements.netBalanceValue.style.color = 'var(--text-primary)';
    elements.balanceStatusBadge.className = 'badge badge-success';
    elements.balanceStatusBadge.innerHTML = '<i data-lucide="trending-up"></i> Healthy';
  }

  // Total Income
  elements.totalIncomeValue.textContent = formatCurrency(summary.totalIncome);
  const totalIncomeCount = data.incomeCategories.reduce((acc, c) => acc + c.count, 0);
  elements.incomeCountBadge.textContent = `${totalIncomeCount} deposits`;

  // Total Expenses
  elements.totalExpenseValue.textContent = formatCurrency(summary.totalExpense);
  const totalExpenseCount = data.expenseCategories.reduce((acc, c) => acc + c.count, 0);
  elements.expenseCountBadge.textContent = `${totalExpenseCount} transactions`;

  // Savings Rate
  const rate = Math.min(100, Math.max(0, summary.savingsRate));
  elements.savingsRateValue.textContent = `${rate}%`;
  elements.savingsProgressBar.style.width = `${rate}%`;

  lucide.createIcons();
}

// Render Transactions List Table
function renderTransactions() {
  const tbody = elements.transactionsList;
  tbody.innerHTML = '';

  elements.txCountNumber.textContent = state.transactions.length;

  if (state.transactions.length === 0) {
    elements.emptyState.style.display = 'flex';
    document.getElementById('transactionsTable').style.display = 'none';
    lucide.createIcons();
    return;
  }

  elements.emptyState.style.display = 'none';
  document.getElementById('transactionsTable').style.display = 'table';

  state.transactions.forEach((tx) => {
    const tr = document.createElement('tr');
    tr.id = `tx-row-${tx.id}`;

    const config = CATEGORY_CONFIG[tx.category] || { icon: '🏷️', color: '#64748b' };
    const paymentIcon = PAYMENT_ICONS[tx.payment_method] || '💳';
    const isIncome = tx.type === 'income';

    const formattedAmount = `${isIncome ? '+' : '-'}${formatCurrency(tx.amount)}`;
    const amountClass = isIncome ? 'amount-income' : 'amount-expense';

    tr.innerHTML = `
      <td>
        <div class="tx-main-cell">
          <div class="tx-cat-icon" style="background-color: ${config.color}20; color: ${config.color};" title="${tx.category}">
            ${config.icon}
          </div>
          <div class="tx-info">
            <span class="tx-title">${escapeHtml(tx.title)}</span>
            ${tx.notes ? `<span class="tx-notes" title="${escapeHtml(tx.notes)}">${escapeHtml(tx.notes)}</span>` : ''}
          </div>
        </div>
      </td>
      <td>
        <span class="cat-pill">${escapeHtml(tx.category)}</span>
      </td>
      <td>
        <span class="method-tag">${paymentIcon} ${escapeHtml(tx.payment_method || 'Card')}</span>
      </td>
      <td>
        <span class="date-text">${formatDate(tx.date)}</span>
      </td>
      <td class="text-right">
        <span class="amount-text ${amountClass}">${formattedAmount}</span>
      </td>
      <td class="text-center">
        <div class="tx-actions">
          <button class="action-btn edit-btn" data-id="${tx.id}" title="Edit transaction" aria-label="Edit transaction">
            <i data-lucide="edit-3"></i>
          </button>
          <button class="action-btn delete-btn" data-id="${tx.id}" data-title="${escapeHtml(tx.title)}" title="Delete transaction" aria-label="Delete transaction">
            <i data-lucide="trash-2"></i>
          </button>
        </div>
      </td>
    `;

    tbody.appendChild(tr);
  });

  lucide.createIcons();
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Chart.js Visualizations
function renderCharts(data) {
  renderCategoryChart(data);
  renderMonthlyTrendChart(data);
}

function renderCategoryChart(data) {
  const ctx = elements.categoryChartCanvas.getContext('2d');
  const items = state.chartView === 'expense' ? data.expenseCategories : data.incomeCategories;

  const labels = items.map((item) => item.category);
  const values = items.map((item) => item.total);
  const backgroundColors = labels.map(
    (cat) => (CATEGORY_CONFIG[cat] && CATEGORY_CONFIG[cat].color) || '#6366f1'
  );

  if (state.categoryChart) {
    state.categoryChart.destroy();
  }

  if (items.length === 0) {
    elements.categoryLegend.innerHTML = '<span class="stat-subtext">No data for this type yet.</span>';
    return;
  }

  state.categoryChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels,
      datasets: [
        {
          data: values,
          backgroundColor: backgroundColors,
          borderWidth: 2,
          borderColor: document.documentElement.getAttribute('data-theme') === 'light' ? '#ffffff' : '#111726',
          hoverOffset: 6
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '72%',
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) => ` ${ctx.label}: ${formatCurrency(ctx.raw)}`
          }
        }
      }
    }
  });

  // Render HTML custom legend
  elements.categoryLegend.innerHTML = labels
    .map((label, idx) => {
      const color = backgroundColors[idx];
      const val = formatCurrency(values[idx]);
      return `
        <div class="legend-item">
          <span class="legend-dot" style="background-color: ${color};"></span>
          <span>${label} (${val})</span>
        </div>
      `;
    })
    .join('');
}

function renderMonthlyTrendChart(data) {
  const ctx = elements.monthlyTrendChartCanvas.getContext('2d');
  const trends = data.monthlyTrends || [];

  const labels = trends.map((t) => t.month);
  const incomeData = trends.map((t) => t.income);
  const expenseData = trends.map((t) => t.expense);

  const isLight = document.documentElement.getAttribute('data-theme') === 'light';
  const gridColor = isLight ? 'rgba(0, 0, 0, 0.06)' : 'rgba(255, 255, 255, 0.06)';
  const textColor = isLight ? '#64748b' : '#94a3b8';

  if (state.trendChart) {
    state.trendChart.destroy();
  }

  state.trendChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: 'Income',
          data: incomeData,
          backgroundColor: '#10b981',
          borderRadius: 6,
          barPercentage: 0.6,
          categoryPercentage: 0.6
        },
        {
          label: 'Expenses',
          data: expenseData,
          backgroundColor: '#f43f5e',
          borderRadius: 6,
          barPercentage: 0.6,
          categoryPercentage: 0.6
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
          labels: {
            color: textColor,
            usePointStyle: true,
            boxWidth: 8,
            font: { family: 'Inter', size: 12 }
          }
        },
        tooltip: {
          callbacks: {
            label: (ctx) => ` ${ctx.dataset.label}: ${formatCurrency(ctx.raw)}`
          }
        }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: textColor, font: { family: 'Inter', size: 11 } }
        },
        y: {
          grid: { color: gridColor },
          ticks: {
            color: textColor,
            font: { family: 'Inter', size: 11 },
            callback: (val) => `$${val}`
          }
        }
      }
    }
  });
}

function updateTrendChartTheme(theme) {
  if (!state.trendChart) return;
  const isLight = theme === 'light';
  const gridColor = isLight ? 'rgba(0, 0, 0, 0.06)' : 'rgba(255, 255, 255, 0.06)';
  const textColor = isLight ? '#64748b' : '#94a3b8';

  state.trendChart.options.scales.y.grid.color = gridColor;
  state.trendChart.options.scales.x.ticks.color = textColor;
  state.trendChart.options.scales.y.ticks.color = textColor;
  state.trendChart.options.plugins.legend.labels.color = textColor;
  state.trendChart.update();
}

// Modal Handlers
function openAddModal(prefillType = 'expense') {
  state.editingId = null;
  elements.txId.value = '';
  elements.txForm.reset();
  elements.modalTitle.textContent = 'Add Transaction';
  elements.modalSubtitle.textContent = 'Log a new income or expense into your database.';

  // Default type and date
  const radio = document.querySelector(`input[name="txType"][value="${prefillType}"]`);
  if (radio) radio.checked = true;
  elements.txDate.value = new Date().toISOString().split('T')[0];

  clearErrors();
  elements.txModal.classList.add('active');
  elements.txModal.setAttribute('aria-hidden', 'false');
  elements.txTitle.focus();
}

function openEditModal(id) {
  const tx = state.transactions.find((t) => t.id === Number(id));
  if (!tx) return;

  state.editingId = tx.id;
  elements.txId.value = tx.id;
  elements.txTitle.value = tx.title;
  elements.txAmount.value = tx.amount;
  elements.txCategory.value = tx.category;
  elements.txDate.value = tx.date;
  elements.txPaymentMethod.value = tx.payment_method || 'Credit Card';
  elements.txNotes.value = tx.notes || '';

  const radio = document.querySelector(`input[name="txType"][value="${tx.type}"]`);
  if (radio) radio.checked = true;

  elements.modalTitle.textContent = 'Edit Transaction';
  elements.modalSubtitle.textContent = 'Modify your existing record.';

  clearErrors();
  elements.txModal.classList.add('active');
  elements.txModal.setAttribute('aria-hidden', 'false');
  elements.txTitle.focus();
}

function closeModal() {
  elements.txModal.classList.remove('active');
  elements.txModal.setAttribute('aria-hidden', 'true');
  state.editingId = null;
}

function clearErrors() {
  elements.txTitleError.style.display = 'none';
  elements.txTitleError.textContent = '';
  elements.txAmountError.style.display = 'none';
  elements.txAmountError.textContent = '';
}

// Form Submission (Add or Update)
elements.txForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  clearErrors();

  const title = elements.txTitle.value.trim();
  const amount = parseFloat(elements.txAmount.value);
  const type = document.querySelector('input[name="txType"]:checked')?.value || 'expense';
  const category = elements.txCategory.value;
  const date = elements.txDate.value;
  const payment_method = elements.txPaymentMethod.value;
  const notes = elements.txNotes.value.trim();

  let hasError = false;
  if (!title) {
    elements.txTitleError.textContent = 'Please enter a title for the transaction.';
    elements.txTitleError.style.display = 'block';
    hasError = true;
  }
  if (isNaN(amount) || amount <= 0) {
    elements.txAmountError.textContent = 'Please enter a valid amount greater than $0.';
    elements.txAmountError.style.display = 'block';
    hasError = true;
  }

  if (hasError) return;

  const payload = { title, amount, type, category, date, payment_method, notes };
  const isEditing = Boolean(state.editingId);
  const url = isEditing ? `/api/transactions/${state.editingId}` : '/api/transactions';
  const method = isEditing ? 'PUT' : 'POST';

  try {
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.error || 'Failed to save transaction');
    }

    closeModal();
    showToast(isEditing ? 'Transaction updated successfully!' : 'New transaction added!', 'success');
    await loadData();
  } catch (err) {
    console.error('Error saving transaction:', err);
    showToast(err.message || 'Error occurred while saving.', 'error');
  }
});

// Delete Modal Handlers
function openDeleteModal(id, title) {
  state.deletingId = id;
  elements.deleteTxTitle.textContent = `"${title}"`;
  elements.deleteModal.classList.add('active');
  elements.deleteModal.setAttribute('aria-hidden', 'false');
}

function closeDeleteModal() {
  state.deletingId = null;
  elements.deleteModal.classList.remove('active');
  elements.deleteModal.setAttribute('aria-hidden', 'true');
}

async function confirmDelete() {
  if (!state.deletingId) return;

  try {
    const res = await fetch(`/api/transactions/${state.deletingId}`, { method: 'DELETE' });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to delete transaction');
    }

    closeDeleteModal();
    showToast('Transaction removed from database.', 'info');
    await loadData();
  } catch (err) {
    console.error('Error deleting transaction:', err);
    showToast(err.message || 'Error deleting transaction.', 'error');
  }
}

// Event Listeners Setup
function setupEventListeners() {
  // Theme Toggle
  elements.themeToggleBtn.addEventListener('click', toggleTheme);

  // Modal Open / Close
  elements.openAddModalBtn.addEventListener('click', () => openAddModal());
  elements.emptyAddBtn.addEventListener('click', () => openAddModal());
  elements.closeModalBtn.addEventListener('click', closeModal);
  elements.cancelModalBtn.addEventListener('click', closeModal);

  // Delete Modal
  elements.cancelDeleteBtn.addEventListener('click', closeDeleteModal);
  elements.confirmDeleteBtn.addEventListener('click', confirmDelete);

  // Close modals on outside click
  window.addEventListener('click', (e) => {
    if (e.target === elements.txModal) closeModal();
    if (e.target === elements.deleteModal) closeDeleteModal();
  });

  // Close modals on Escape key
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeModal();
      closeDeleteModal();
    }
  });

  // Table action clicks (event delegation)
  elements.transactionsList.addEventListener('click', (e) => {
    const editBtn = e.target.closest('.edit-btn');
    if (editBtn) {
      openEditModal(editBtn.dataset.id);
      return;
    }

    const deleteBtn = e.target.closest('.delete-btn');
    if (deleteBtn) {
      openDeleteModal(deleteBtn.dataset.id, deleteBtn.dataset.title);
      return;
    }
  });

  // Search input debounced
  const debouncedSearch = debounce(() => {
    state.filters.search = elements.searchInput.value.trim();
    elements.clearSearchBtn.style.display = state.filters.search ? 'flex' : 'none';
    fetchTransactions();
  }, 300);

  elements.searchInput.addEventListener('input', debouncedSearch);
  elements.clearSearchBtn.addEventListener('click', () => {
    elements.searchInput.value = '';
    state.filters.search = '';
    elements.clearSearchBtn.style.display = 'none';
    fetchTransactions();
  });

  // Type filter buttons
  elements.typeFilterBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      elements.typeFilterBtns.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      state.filters.type = btn.dataset.type;
      fetchTransactions();
    });
  });

  // Category filter
  elements.categoryFilter.addEventListener('change', (e) => {
    state.filters.category = e.target.value;
    fetchTransactions();
  });

  // Sort By
  elements.sortBySelect.addEventListener('change', (e) => {
    state.filters.sortBy = e.target.value;
    fetchTransactions();
  });

  // Reset Filters
  elements.resetFiltersBtn.addEventListener('click', () => {
    elements.searchInput.value = '';
    state.filters.search = '';
    elements.clearSearchBtn.style.display = 'none';

    elements.typeFilterBtns.forEach((b) => b.classList.remove('active'));
    document.querySelector('.type-filter-btn[data-type="all"]').classList.add('active');
    state.filters.type = 'all';

    elements.categoryFilter.value = 'all';
    state.filters.category = 'all';

    elements.sortBySelect.value = 'date_desc';
    state.filters.sortBy = 'date_desc';

    fetchTransactions();
  });

  // Chart view toggles (Expense vs Income)
  elements.chartExpenseToggle.addEventListener('click', () => {
    if (state.chartView === 'expense') return;
    state.chartView = 'expense';
    elements.chartExpenseToggle.classList.add('active');
    elements.chartIncomeToggle.classList.remove('active');
    if (state.summary) renderCategoryChart(state.summary);
  });

  elements.chartIncomeToggle.addEventListener('click', () => {
    if (state.chartView === 'income') return;
    state.chartView = 'income';
    elements.chartIncomeToggle.classList.add('active');
    elements.chartExpenseToggle.classList.remove('active');
    if (state.summary) renderCategoryChart(state.summary);
  });
}
