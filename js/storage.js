// js/storage.js

export function getTransactions() {
  return JSON.parse(localStorage.getItem('transactions')) || [];
}

export function saveTransactions(data) {
  localStorage.setItem('transactions', JSON.stringify(data));
}
