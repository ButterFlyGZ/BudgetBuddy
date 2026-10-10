import { getTransactions } from './storage.js';

document.addEventListener("DOMContentLoaded", () => {
  const transactions = getTransactions();

  const income = transactions
    .filter(t => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);

  const expense = transactions
    .filter(t => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  document.getElementById("total-income").textContent = `$${income.toFixed(2)}`;
  document.getElementById("total-expense").textContent = `$${expense.toFixed(2)}`;
  document.getElementById("total-balance").textContent = `$${(income - expense).toFixed(2)}`;
});
