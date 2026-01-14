"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sha256Base64Url = sha256Base64Url;
const crypto_1 = __importDefault(require("crypto"));
function sha256Base64Url(input) {
    const digest = crypto_1.default.createHash('sha256').update(input).digest('base64');
    return digest.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}
