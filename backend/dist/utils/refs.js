"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateTransactionReference = generateTransactionReference;
exports.generateAccountNumber = generateAccountNumber;
function generateTransactionReference() {
    // Simple, collision-resistant-enough reference for demo purposes.
    // Format: TX-<epoch>-<rand>
    return `TX-${Date.now()}-${Math.random().toString(16).slice(2, 10)}`.toUpperCase();
}
function generateAccountNumber() {
    // Mock internal account number. Format: 10 digits.
    const base = `${Date.now()}${Math.floor(Math.random() * 1e6)}`;
    return base.slice(-10);
}
