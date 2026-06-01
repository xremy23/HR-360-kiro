"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.query = query;
exports.getClient = getClient;
exports.initializeDatabase = initializeDatabase;
const pg_1 = require("pg");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
let pool = null;
let poolInitialized = false;
function createPool() {
    return new pg_1.Pool({
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        database: process.env.DB_NAME || 'emergency_app',
        connectionTimeoutMillis: 5000, // 5 second timeout for connections
        idleTimeoutMillis: 30000,
        max: 20,
    });
}
function getPool() {
    if (!pool) {
        pool = createPool();
        pool.on('error', (err) => {
            console.error('Unexpected error on idle client', err);
        });
    }
    return pool;
}
async function query(text, params) {
    const start = Date.now();
    try {
        const p = getPool();
        const result = await p.query(text, params);
        const duration = Date.now() - start;
        console.log('Executed query', { text, duration, rows: result.rowCount });
        return result;
    }
    catch (error) {
        console.error('Database query error:', error);
        throw error;
    }
}
async function getClient() {
    const p = getPool();
    return p.connect();
}
async function initializeDatabase() {
    // Don't actually try to connect - just mark as initialized
    // Database connections will be lazy-loaded when needed
    poolInitialized = true;
    console.log('Database initialized (lazy connection mode)');
}
exports.default = {
    getPool,
    query,
    getClient,
    initializeDatabase,
};
//# sourceMappingURL=database.js.map