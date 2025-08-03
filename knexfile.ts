import { Knex } from 'knex';
import dotenv from 'dotenv';

// Charger les variables d'environnement
dotenv.config();

// Configuration par défaut
const defaultConfig: Knex.Config = {
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
const config: { [key: string]: Knex.Config } = {
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

export default config;
