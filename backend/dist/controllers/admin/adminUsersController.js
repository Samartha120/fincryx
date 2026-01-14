"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listUsers = listUsers;
const User_1 = require("../../models/User");
const pagination_1 = require("../../utils/pagination");
async function listUsers(req, res) {
    const { page, limit } = (0, pagination_1.parsePagination)(req.query);
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
        User_1.UserModel.find().sort({ createdAt: -1 }).skip(skip).limit(limit).select('-passwordHash -otpCodeHash'),
        User_1.UserModel.countDocuments(),
    ]);
    res.json({
        page,
        limit,
        total,
        items,
    });
}
