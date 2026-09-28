// ===================== Constants =====================
const STORAGE_KEY = "expenseTracker.transactions";

const CATEGORIES = {
  income: ["Salary", "Freelance", "Investment", "Gift", "Other Income"],
  expense: ["Food", "Transport", "Shopping", "Bills", "Health", "Entertainment", "Education", "Other Expense"],
};

const MAX_AMOUNT = 10000000; // 1 crore

const currency = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" });



// ===================== DOM references =====================
const form = document.getElementById("transaction-form");
const amountInput = document.getElementById("amount");
const categorySelect = document.getElementById("category");
const dateInput = document.getElementById("date");
const descriptionInput = document.getElementById("description");
const submitBtn = document.getElementById("submit-btn");
const cancelEditBtn = document.getElementById("cancel-edit");
const formTitle = document.getElementById("form-title");

const filterType = document.getElementById("filter-type");
const filterCategory = document.getElementById("filter-category");
const filterMonth = document.getElementById("filter-month");
const clearFiltersBtn = document.getElementById("clear-filters");
const filterInfo = document.getElementById("filter-info");
const listEl = document.getElementById("transaction-list");
const emptyState = document.getElementById("empty-state");

const balanceEl = document.getElementById("balance");
const incomeEl = document.getElementById("total-income");
const expenseEl = document.getElementById("total-expense");

const monthlyTable = document.getElementById("monthly-table");
const monthlyBody = document.getElementById("monthly-summary-body");
const monthlyEmpty = document.getElementById("monthly-empty");
const chartEl = document.getElementById("category-chart");
const chartTitle = document.getElementById("chart-title");
const toastEl = document.getElementById("toast");

// ===================== Storage =====================
function loadTransactions() {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!Array.isArray(data)) return [];
    // Ignore any corrupted entries
    return data.filter(
      (t) =>
        t &&
        (t.type === "income" || t.type === "expense") &&
        typeof t.amount === "number" &&
        typeof t.date === "string"
    );
  } catch {
    return [];
  }
}

function saveTransactions() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
  } catch {
    showToast("Could not save data. Browser storage may be full or disabled.", "error");
  }
}

// ===================== State =====================
let transactions = loadTransactions();
let editingId = null;

// ===================== Helpers =====================
function generateId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

// Today's date as YYYY-MM-DD in local time (toISOString alone uses UTC)
function todayISO() {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60000;
  return new Date(now - offset).toISOString().slice(0, 10);
}

function formatMoney(value) {
  return currency.format(value);
}

function formatDate(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatMonth(key) {
  const [y, m] = key.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("en-IN", { month: "long", year: "numeric" });
}

// Prevents user-entered text from being rendered as HTML
function escapeHTML(str) {
  const map = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
  return String(str).replace(/[&<>"']/g, (c) => map[c]);
}

// options: array of strings, or [value, label] pairs
function fillSelect(select, options, placeholder) {
  select.innerHTML = "";
  if (placeholder) select.add(new Option(placeholder, ""));
  options.forEach((o) => {
    const [value, label] = Array.isArray(o) ? o : [o, o];
    select.add(new Option(label, value));
  });
}

function getSelectedType() {
  return form.querySelector('input[name="type"]:checked').value;
}

function setSelectedType(type) {
  form.querySelector(`input[name="type"][value="${type}"]`).checked = true;
}

let toastTimer;
function showToast(message, kind = "success") {
  toastEl.textContent = message;
  toastEl.className = `toast show ${kind}`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove("show"), 2500);
}