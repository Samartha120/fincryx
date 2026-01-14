"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.moneyMinorSchema = void 0;
exports.assertNonNegativeMinor = assertNonNegativeMinor;
const zod_1 = require("zod");
exports.moneyMinorSchema = zod_1.z
    .number()
    .int('Amount must be an integer in minor units')
    .positive('Amount must be positive');
function assertNonNegativeMinor(value, label) {
    if (!Number.isInteger(value) || value < 0) {
        throw new Error(`${label} must be a non-negative integer (minor units)`);
    }
}
