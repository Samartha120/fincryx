"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDb = connectDb;
exports.disconnectDb = disconnectDb;
const mongoose_1 = __importDefault(require("mongoose"));
async function connectDb(env) {
    mongoose_1.default.set('strictQuery', true);
    mongoose_1.default.set('bufferCommands', false);
    mongoose_1.default.set('bufferTimeoutMS', 8000);
    await mongoose_1.default.connect(env.MONGO_URI, {
        serverSelectionTimeoutMS: 8000,
        socketTimeoutMS: 45000,
    });
}
async function disconnectDb() {
    await mongoose_1.default.disconnect();
}
