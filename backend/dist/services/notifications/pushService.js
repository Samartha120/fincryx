"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendDailySpendNotification = exports.sendUserNotification = void 0;
const mongoose_1 = require("mongoose");
const User_1 = require("../../models/User");
const Transaction_1 = require("../../models/Transaction");

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

function isExpoToken(token) {
  return typeof token === 'string' && token.startsWith('ExpoPushToken[');
}

async function getDailySpendMinor(userId) {
  const userObjectId = new mongoose_1.Types.ObjectId(userId);
  const start = new Date();
  start.setHours(0, 0, 0, 0);

  const txs = await Transaction_1.TransactionModel.find({
    userId: userObjectId,
    createdAt: { $gte: start },
    fromAccountId: { $exists: true },
  }).select('amountMinor');

  return txs.reduce((sum, t) => sum + (Number.isFinite(t.amountMinor) ? t.amountMinor : 0), 0);
}

async function sendUserNotification(userId, payload) {
  const user = await User_1.UserModel.findById(userId).select('pushTokens');
  if (!user || !Array.isArray(user.pushTokens) || user.pushTokens.length === 0) return;

  const tokens = user.pushTokens.filter(isExpoToken);
  if (tokens.length === 0) return;

  let dailySpendMinor = undefined;
  if (payload.includeDailySpend) {
    try {
      dailySpendMinor = await getDailySpendMinor(userId);
    } catch {
      dailySpendMinor = undefined;
    }
  }

  const body = tokens.map((token) => ({
    to: token,
    title: payload.title,
    body: payload.body,
    data: {
      ...(payload.data || {}),
      dailySpendMinor,
    },
    sound: 'default',
  }));

  try {
    await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch (err) {
    console.warn('[push] Failed to send push notification', err instanceof Error ? err.message : err);
  }
}
exports.sendUserNotification = sendUserNotification;

async function sendDailySpendNotification(userId, currency) {
  const dailySpendMinor = await getDailySpendMinor(userId);
  const user = await User_1.UserModel.findById(userId).select('pushTokens');
  if (!user || !Array.isArray(user.pushTokens) || user.pushTokens.length === 0) return;

  const tokens = user.pushTokens.filter(isExpoToken);
  if (tokens.length === 0) return;

  const body = tokens.map((token) => ({
    to: token,
    title: 'Daily spend updated',
    body: `Today’s spend: ${dailySpendMinor} ${currency}`,
    data: {
      type: 'daily-spend',
      dailySpendMinor,
      currency,
    },
    sound: 'default',
  }));

  try {
    await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch (err) {
    console.warn('[push] Failed to send daily spend notification', err instanceof Error ? err.message : err);
  }
}
exports.sendDailySpendNotification = sendDailySpendNotification;
