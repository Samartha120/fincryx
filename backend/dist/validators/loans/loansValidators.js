"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminDecisionBodySchema = exports.listLoansQuerySchema = exports.applyLoanBodySchema = void 0;
const zod_1 = require("zod");
const money_1 = require("../../utils/money");
exports.applyLoanBodySchema = zod_1.z.object({
    accountId: zod_1.z.string().min(1),
    principalMinor: money_1.moneyMinorSchema,
    annualInterestBps: zod_1.z.coerce.number().int().min(0).max(100000),
    termMonths: zod_1.z.coerce.number().int().min(1).max(600),
});
exports.listLoansQuerySchema = zod_1.z.object({
    page: zod_1.z.coerce.number().int().min(1).default(1),
    limit: zod_1.z.coerce.number().int().min(1).max(100).default(20),
    status: zod_1.z.enum(['pending', 'approved', 'rejected']).optional(),
});
exports.adminDecisionBodySchema = zod_1.z.object({
    decision: zod_1.z.enum(['approved', 'rejected']),
    decisionNote: zod_1.z.string().max(200).optional(),
});
