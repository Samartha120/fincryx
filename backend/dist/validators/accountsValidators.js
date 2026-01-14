"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.transferBodySchema = void 0;
const zod_1 = require("zod");
const money_1 = require("../utils/money");
exports.transferBodySchema = zod_1.z.object({
    fromAccountId: zod_1.z.string().min(1),
    toAccountNumber: zod_1.z.string().min(6).max(32),
    amountMinor: money_1.moneyMinorSchema,
    note: zod_1.z.string().max(140).optional(),
});
