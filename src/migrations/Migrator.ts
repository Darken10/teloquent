/**
 * Gestionnaire de migrations pour l'ORM Teloquent
 * 
 * Cette classe fournit les fonctionnalités pour exécuter, annuler et gérer les migrations.
 */

import path from 'path';
import fs from 'fs';
import { Connection } from '../utils/connection';
import { Migration } from './Migration';
import { Knex } from 'knex';

/**
 * Interface pour les options du Migrator
 */
export interface MigratorOptions {
  connection?: string;
  directory?: string;
  tableName?: string;
}

/**
 * Interface pour les informations d'une migration
 */
export interface MigrationInfo {
  id: number;
  name: string;
  batch: number;
  migration_time: Date;
}

/**
 * Classe pour gérer les migrations
 */
export class Migrator {
  // Nom de la connexion
  private connection?: string;
  
  // Répertoire des migrations
  private directory: string;
  
  // Nom de la table des migrations
  private tableName: string;
  
  // Instance Knex
  private knex: Knex;

  /**
   * Constructeur du Migrator
   * @param options Options du Migrator
   */
  constructor(options: MigratorOptions = {}) {
    this.connection = options.connection;
    this.directory = options.directory || path.resolve(process.cwd(), 'migrations');
    this.tableName = options.tableName || 'migrations';
    this.knex = Connection.getConnection(this.connection);
  }

  /**
   * Initialise la table des migrations si elle n'existe pas
   */
  public async initMigrationsTable(): Promise<void> {
    const hasTable = await this.knex.schema.hasTable(this.tableName);
    
    if (!hasTable) {
      await this.knex.schema.createTable(this.tableName, (table) => {
        table.increments('id');
        table.string('name');
        table.integer('batch');
        table.timestamp('migration_time').defaultTo(this.knex.fn.now());
      });
    }
  }

  /**
   * Récupère toutes les migrations exécutées
   */
  public async getMigrationsRan(): Promise<MigrationInfo[]> {
    await this.initMigrationsTable();
    return this.knex(this.tableName).select('*').orderBy('id');
  }

  /**
   * Récupère la dernière batch de migrations
   */
  public async getLastBatchNumber(): Promise<number> {
    const result = await this.knex(this.tableName)
      .max('batch as max_batch')
      .first();
    
    return result ? (result.max_batch as number) : 0;
  }

  /**
   * Récupère les migrations de la dernière batch
   */
  public async getLastBatchMigrations(): Promise<MigrationInfo[]> {
    const batch = await this.getLastBatchNumber();
    
    if (batch === 0) {
      return [];
    }
    
    return this.knex(this.tableName)
      .where('batch', batch)
      .orderBy('id', 'desc')
      .select('*');
  }

  /**
   * Récupère tous les fichiers de migration
   */
  private async getMigrationFiles(): Promise<string[]> {
    // Créer le répertoire s'il n'existe pas
    if (!fs.existsSync(this.directory)) {
      fs.mkdirSync(this.directory, { recursive: true });
    }
    
    // Lire les fichiers du répertoire
    const files = fs.readdirSync(this.directory);
    
    // Filtrer les fichiers .js et .ts
    return files
      .filter(file => file.endsWith('.js') || file.endsWith('.ts'))
      .sort();
  }

  /**
   * Récupère les migrations en attente
   */
  public async getPendingMigrations(): Promise<string[]> {
    const files = await this.getMigrationFiles();
    const ranMigrations = await this.getMigrationsRan();
    const ranNames = ranMigrations.map(m => m.name);
    
    return files.filter(file => {
      const migrationName = path.parse(file).name;
      return !ranNames.includes(migrationName);
    });
  }

  /**
   * Charge une migration à partir d'un fichier
   * @param file Nom du fichier de migration
   */
  private async loadMigration(file: string): Promise<Migration> {
    const filePath = path.join(this.directory, file);
    const migrationModule = await import(filePath);
    const MigrationClass = migrationModule.default;
    
    if (!MigrationClass) {
      throw new Error(`Migration file ${file} does not export a default class`);
    }
    
    return new MigrationClass(this.connection);
  }

  /**
   * Enregistre une migration exécutée
   * @param name Nom de la migration
   * @param batch Numéro de batch
   */
  private async logMigration(name: string, batch: number): Promise<void> {
    await this.knex(this.tableName).insert({
      name,
      batch,
      migration_time: new Date()
    });
  }

  /**
   * Supprime une migration du journal
   * @param name Nom de la migration
   */
  private async removeMigration(name: string): Promise<void> {
    await this.knex(this.tableName).where('name', name).delete();
  }

  /**
   * Exécute les migrations en attente
   */
  public async migrate(): Promise<string[]> {
    await this.initMigrationsTable();
    
    const pendingFiles = await this.getPendingMigrations();
    
    if (pendingFiles.length === 0) {
      return [];
    }
    
    const batch = await this.getLastBatchNumber() + 1;
    const migratedFiles: string[] = [];
    
    for (const file of pendingFiles) {
      const migration = await this.loadMigration(file);
      const name = path.parse(file).name;
      
      try {
        await migration.up();
        await this.logMigration(name, batch);
        migratedFiles.push(name);
      } catch (error) {
        console.error(`Error running migration ${name}:`, error);
        throw error;
      }
    }
    
    return migratedFiles;
  }

  /**
   * Annule les migrations de la dernière batch
   */
  public async rollback(): Promise<string[]> {
    await this.initMigrationsTable();
    
    const lastBatchMigrations = await this.getLastBatchMigrations();
    
    if (lastBatchMigrations.length === 0) {
      return [];
    }
    
    const rolledBackFiles: string[] = [];
    
    for (const migrationInfo of lastBatchMigrations) {
      const file = `${migrationInfo.name}.ts`;
      
      try {
        const migration = await this.loadMigration(file);
        await migration.down();
        await this.removeMigration(migrationInfo.name);
        rolledBackFiles.push(migrationInfo.name);
      } catch (error) {
        console.error(`Error rolling back migration ${migrationInfo.name}:`, error);
        throw error;
      }
    }
    
    return rolledBackFiles;
  }

  /**
   * Annule toutes les migrations
   */
  public async reset(): Promise<string[]> {
    await this.initMigrationsTable();
    
    const allMigrations = await this.getMigrationsRan();
    
    if (allMigrations.length === 0) {
      return [];
    }
    
    const resetFiles: string[] = [];
    
    // Parcourir les migrations dans l'ordre inverse
    for (let i = allMigrations.length - 1; i >= 0; i--) {
      const migrationInfo = allMigrations[i];
      const file = `${migrationInfo.name}.ts`;
      
      try {
        const migration = await this.loadMigration(file);
        await migration.down();
        await this.removeMigration(migrationInfo.name);
        resetFiles.push(migrationInfo.name);
      } catch (error) {
        console.error(`Error resetting migration ${migrationInfo.name}:`, error);
        throw error;
      }
    }
    
    return resetFiles;
  }

  /**
   * Rafraîchit les migrations (reset + migrate)
   */
  public async refresh(): Promise<{ reset: string[], migrated: string[] }> {
    const reset = await this.reset();
    const migrated = await this.migrate();
    
    return { reset, migrated };
  }

  /**
   * Crée un nouveau fichier de migration
   * @param name Nom de la migration
   */
  public createMigrationFile(name: string): string {
    // Créer le répertoire s'il n'existe pas
    if (!fs.existsSync(this.directory)) {
      fs.mkdirSync(this.directory, { recursive: true });
    }
    
    const timestamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0];
    const fileName = `${timestamp}_${name}.ts`;
    const filePath = path.join(this.directory, fileName);
    
    const template = `
import { Migration } from '../src/migrations/Migration';
import { Schema } from '../src/utils/schema';

export default class ${name.charAt(0).toUpperCase() + name.slice(1)} extends Migration {
  /**
   * Exécute la migration
   */
  public async up(): Promise<void> {
    await Schema.create('table_name', (table) => {
      table.increments('id');
      table.timestamps();
    }, this.connection);
  }

  /**
   * Annule la migration
   */
  public async down(): Promise<void> {
    await Schema.dropIfExists('table_name', this.connection);
  }
}
`.trim();
    
    fs.writeFileSync(filePath, template);
    return filePath;
  }
}
