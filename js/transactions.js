// LocalStorage helpers
function getTransactions() {
  return JSON.parse(localStorage.getItem('transactions')) || [];
}

function saveTransactions(data) {
  localStorage.setItem('transactions', JSON.stringify(data));
}

// DOM elements
const form = document.getElementById("transactionForm");
const list = document.getElementById("transactionList");
const searchInput = document.getElementById("search");
const filterType = document.getElementById("filterType");

let transactions = getTransactions();

// Render transactions
function renderTransactions(data = transactions) {
  list.innerHTML = "";
  if (data.length === 0) {
    list.innerHTML = `<p class="text-center text-gray-400">No transactions yet.</p>`;
    return;
  }

  data.forEach((t, i) => {
    const color = t.type === "income"
      ? "bg-blue-100 border-blue-200"
      : "bg-pink-100 border-pink-200";
    const symbol = t.type === "income" ? "+" : "-";
    const textColor = t.type === "income" ? "text-blue-600" : "text-pink-600";

    const div = document.createElement("div");
    div.className = `p-4 rounded-2xl border ${color} shadow flex justify-between items-center`;

    div.innerHTML = `
      <div>
        <h4 class="font-semibold text-gray-700">${t.description}</h4>
        <p class="text-sm text-gray-500">${t.category}</p>
      </div>
      <div class="text-right">
        <p class="font-bold ${textColor}">${symbol}$${t.amount.toFixed(2)}</p>
        <button data-index="${i}" class="delete text-gray-400 hover:${t.type==='income'?'text-blue-600':'text-pink-600'} text-sm">Delete</button>
      </div>
    `;
    list.appendChild(div);
  });
}

// Add transaction
form.addEventListener("submit", (e) => {
  e.preventDefault();
  const desc = document.getElementById("description").value.trim();
  const amount = parseFloat(document.getElementById("amount").value);
  const type = document.getElementById("type").value;
  const category = document.getElementById("category").value;

  if (!desc || !amount) return;

  transactions.push({ description: desc, amount, type, category });
  saveTransactions(transactions);
  renderTransactions();

  form.reset();
  Swal.fire("Added!", "Transaction added successfully!", "success");
});

// Delete transaction
list.addEventListener("click", (e) => {
  if (e.target.classList.contains("delete")) {
    const index = e.target.dataset.index;
    transactions.splice(index, 1);
    saveTransactions(transactions);
    renderTransactions();
    Swal.fire("Deleted", "Transaction removed.", "info");
  }
});

// Search filter
searchInput.addEventListener("input", () => {
  const query = searchInput.value.toLowerCase();
  const filtered = transactions.filter(t => t.description.toLowerCase().includes(query));
  renderTransactions(filtered);
});

// Type filter
filterType.addEventListener("change", () => {
  const type = filterType.value;
  const filtered = type === "all" ? transactions : transactions.filter(t => t.type === type);
  renderTransactions(filtered);
});

// Initial render
renderTransactions();
