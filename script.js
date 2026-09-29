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
// ===================== Dropdowns =====================
function updateFormCategories() {
  fillSelect(categorySelect, CATEGORIES[getSelectedType()], "Select a category");
}

// ===================== Validation =====================
function clearErrors() {
  form.querySelectorAll(".error").forEach((el) => (el.textContent = ""));
  form.querySelectorAll(".invalid").forEach((el) => el.classList.remove("invalid"));
}

function setError(input, message) {
  document.getElementById(`${input.id}-error`).textContent = message;
  input.classList.add("invalid");
}

function validateForm() {
  clearErrors();
  let valid = true;

  const type = getSelectedType();
  const amountRaw = amountInput.value.trim();
  const amount = Number(amountRaw);
  const category = categorySelect.value;
  const date = dateInput.value;
  const description = descriptionInput.value.trim();

  if (amountRaw === "") {
    setError(amountInput, "Please enter a valid amount.");
    valid = false;
  } else if (!Number.isFinite(amount) || amount <= 0) {
    setError(amountInput, "Amount must be greater than 0.");
    valid = false;
  } else if (!/^\d+(\.\d{1,2})?$/.test(amountRaw)) {
    setError(amountInput, "Use numbers only, with at most 2 decimal places.");
    valid = false;
  } else if (amount > MAX_AMOUNT) {
    setError(amountInput, `Amount can't be more than ${formatMoney(MAX_AMOUNT)}.`);
    valid = false;
  }

  if (!category) {
    setError(categorySelect, "Please select a category.");
    valid = false;
  }

  if (!date) {
    setError(dateInput, "Please pick a date.");
    valid = false;
  } else if (date > todayISO()) {
    setError(dateInput, "Date can't be in the future.");
    valid = false;
  }

  if (!description) {
    setError(descriptionInput, "Please add a short description.");
    valid = false;
  } else if (description.length > 100) {
    setError(descriptionInput, "Keep the description under 100 characters.");
    valid = false;
  }

  if (!valid) {
    form.querySelector(".invalid")?.focus();
    return null;
  }

  return { type, amount: Math.round(amount * 100) / 100, category, date, description };
}

// ===================== Actions =====================
function resetForm() {
  form.reset();
  editingId = null;
  clearErrors();
  updateFormCategories();
  dateInput.value = todayISO();
  submitBtn.textContent = "Add Transaction";
  formTitle.textContent = "Add Transaction";
  cancelEditBtn.classList.add("hidden");
}

// ===================== Rendering =====================
// Temporary - replaced in Step 8
function render() {
  console.log("Transactions:", transactions);
}

// ===================== Event listeners =====================
form.addEventListener("submit", (e) => {
  e.preventDefault();
  const data = validateForm();
  if (!data) return;

  if (editingId) {
    transactions = transactions.map((t) => (t.id === editingId ? { ...t, ...data } : t));
    showToast("Transaction updated.");
  } else {
    transactions.push({ id: generateId(), createdAt: Date.now(), ...data });
    showToast("Transaction added.");
  }

  saveTransactions();
  resetForm();
  render();
});

form.querySelectorAll('input[name="type"]').forEach((radio) =>
  radio.addEventListener("change", updateFormCategories)
);

// Clear a field's error as soon as the user fixes it
[amountInput, categorySelect, dateInput, descriptionInput].forEach((input) =>
  input.addEventListener("input", () => {
    input.classList.remove("invalid");
    document.getElementById(`${input.id}-error`).textContent = "";
  })
);

cancelEditBtn.addEventListener("click", resetForm);

// ===================== Init =====================
dateInput.max = todayISO();
resetForm();
render();