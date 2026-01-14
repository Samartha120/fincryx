"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.computeEmiSchedule = computeEmiSchedule;
function roundToMinorUnits(value) {
    return Math.round(value);
}
function computeEmiSchedule(input) {
    const principal = input.principalMinor;
    const months = input.termMonths;
    const annualRate = input.annualInterestBps / 10000;
    const monthlyRate = annualRate / 12;
    if (months <= 0)
        throw new Error('termMonths must be positive');
    if (principal <= 0)
        throw new Error('principalMinor must be positive');
    // Zero-interest loan: equal principal payments.
    if (monthlyRate === 0) {
        const basePayment = Math.floor(principal / months);
        let remaining = principal;
        const rows = [];
        for (let month = 1; month <= months; month++) {
            const principalPart = month === months ? remaining : basePayment;
            const interestPart = 0;
            const payment = principalPart + interestPart;
            remaining -= principalPart;
            rows.push({
                month,
                paymentMinor: payment,
                principalMinor: principalPart,
                interestMinor: interestPart,
                remainingPrincipalMinor: remaining,
            });
        }
        return {
            monthlyPaymentMinor: rows[0].paymentMinor,
            totalPayableMinor: principal,
            totalInterestMinor: 0,
            rows,
        };
    }
    const r = monthlyRate;
    const pow = Math.pow(1 + r, months);
    const monthlyPayment = (principal * r * pow) / (pow - 1);
    const monthlyPaymentMinor = roundToMinorUnits(monthlyPayment);
    let remaining = principal;
    let totalInterest = 0;
    const rows = [];
    for (let month = 1; month <= months; month++) {
        const interest = roundToMinorUnits(remaining * r);
        let principalPart = monthlyPaymentMinor - interest;
        // Handle rounding drift on last installment.
        if (month === months) {
            principalPart = remaining;
        }
        const payment = principalPart + interest;
        remaining -= principalPart;
        totalInterest += interest;
        rows.push({
            month,
            paymentMinor: payment,
            principalMinor: principalPart,
            interestMinor: interest,
            remainingPrincipalMinor: remaining < 0 ? 0 : remaining,
        });
    }
    const totalPayableMinor = principal + totalInterest;
    return {
        monthlyPaymentMinor,
        totalPayableMinor,
        totalInterestMinor: totalInterest,
        rows,
    };
}
