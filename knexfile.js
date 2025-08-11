"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
// Charger les variables d'environnement
dotenv_1.default.config();
// Configuration par défaut
const defaultConfig = {
    client: process.env.DB_CLIENT || 'sqlite3',
    connection: {
        filename: process.env.DB_FILENAME || './database.sqlite',
    },
    migrations: {
        directory: './src/migrations',
        tableName: 'migrations',
    },
    seeds: {
        directory: './src/seeds',
    },
    useNullAsDefault: true,
};
// Configurations spécifiques pour chaque environnement
const config = {
    development: {
        ...defaultConfig,
    },
    test: {
        ...defaultConfig,
        connection: {
            filename: ':memory:',
        },
    },
    production: {
        client: process.env.DB_CLIENT || 'pg',
        connection: {
            host: process.env.DB_HOST || 'localhost',
            port: Number(process.env.DB_PORT) || 5432,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
        },
        pool: {
            min: 2,
            max: 10,
        },
        migrations: {
            directory: './dist/migrations',
            tableName: 'migrations',
        },
        seeds: {
            directory: './dist/seeds',
        },
    },
};
exports.default = config;
//# sourceMappingURL=knexfile.js.map