/**
 * Utilitaires de schéma pour les migrations dans l'ORM Teloquent
 * 
 * Ces classes fournissent une API fluide pour créer et modifier des tables
 * dans la base de données, similaire à celle de Laravel.
 */

import { Knex } from 'knex';
import { Connection } from './connection';

/**
 * Classe de construction de schéma
 */
export class SchemaBuilder {
  // Instance Knex
  private knex: Knex;

  /**
   * Constructeur du SchemaBuilder
   * @param connectionName Nom de la connexion (optionnel)
   */
  constructor(connectionName?: string) {
    this.knex = Connection.getConnection(connectionName);
  }

  /**
   * Vérifie si une table existe
   * @param tableName Nom de la table
   */
  public async hasTable(tableName: string): Promise<boolean> {
    return this.knex.schema.hasTable(tableName);
  }

  /**
   * Vérifie si une colonne existe dans une table
   * @param tableName Nom de la table
   * @param columnName Nom de la colonne
   */
  public async hasColumn(tableName: string, columnName: string): Promise<boolean> {
    return this.knex.schema.hasColumn(tableName, columnName);
  }

  /**
   * Crée une nouvelle table
   * @param tableName Nom de la table
   * @param callback Fonction de construction de la table
   */
  public async createTable(
    tableName: string,
    callback: (table: TableBuilder) => void
  ): Promise<void> {
    await this.knex.schema.createTable(tableName, (table: Knex.CreateTableBuilder) => {
      const builder = new TableBuilder(table);
      callback(builder);
    });
  }

  /**
   * Modifie une table existante
   * @param tableName Nom de la table
   * @param callback Fonction de modification de la table
   */
  public async alterTable(
    tableName: string,
    callback: (table: TableBuilder) => void
  ): Promise<void> {
    await this.knex.schema.alterTable(tableName, (table: Knex.AlterTableBuilder) => {
      const builder = new TableBuilder(table);
      callback(builder);
    });
  }

  /**
   * Renomme une table
   * @param from Nom actuel de la table
   * @param to Nouveau nom de la table
   */
  public async renameTable(from: string, to: string): Promise<void> {
    await this.knex.schema.renameTable(from, to);
  }

  /**
   * Supprime une table
   * @param tableName Nom de la table
   */
  public async dropTable(tableName: string): Promise<void> {
    await this.knex.schema.dropTable(tableName);
  }

  /**
   * Supprime une table si elle existe
   * @param tableName Nom de la table
   */
  public async dropTableIfExists(tableName: string): Promise<void> {
    await this.knex.schema.dropTableIfExists(tableName);
  }

  /**
   * Exécute une requête SQL brute
   * @param sql Requête SQL
   * @param bindings Paramètres de la requête
   */
  public async raw(sql: string, bindings?: any[]): Promise<any> {
    return this.knex.raw(sql, bindings);
  }
}

/**
 * Classe de construction de table
 */
export class TableBuilder {
  // Instance Knex.TableBuilder
  private builder: Knex.TableBuilder;

  /**
   * Constructeur du TableBuilder
   * @param builder Instance Knex.TableBuilder
   */
  constructor(builder: Knex.TableBuilder) {
    this.builder = builder;
  }

  /**
   * Ajoute une colonne d'identifiant auto-incrémenté
   * @param columnName Nom de la colonne (par défaut: 'id')
   */
  public increments(columnName: string = 'id'): ColumnBuilder {
    return new ColumnBuilder(this.builder.increments(columnName));
  }

  /**
   * Ajoute une colonne d'identifiant auto-incrémenté big integer
   * @param columnName Nom de la colonne (par défaut: 'id')
   */
  public bigIncrements(columnName: string = 'id'): ColumnBuilder {
    return new ColumnBuilder(this.builder.bigIncrements(columnName));
  }

  /**
   * Ajoute une colonne de type integer
   * @param columnName Nom de la colonne
   */
  public integer(columnName: string): ColumnBuilder {
    return new ColumnBuilder(this.builder.integer(columnName));
  }

  /**
   * Ajoute une colonne de type big integer
   * @param columnName Nom de la colonne
   */
  public bigInteger(columnName: string): ColumnBuilder {
    return new ColumnBuilder(this.builder.bigInteger(columnName));
  }

  /**
   * Ajoute une colonne de type text
   * @param columnName Nom de la colonne
   */
  public text(columnName: string): ColumnBuilder {
    return new ColumnBuilder(this.builder.text(columnName));
  }

  /**
   * Ajoute une colonne de type string (varchar)
   * @param columnName Nom de la colonne
   * @param length Longueur maximale (par défaut: 255)
   */
  public string(columnName: string, length: number = 255): ColumnBuilder {
    return new ColumnBuilder(this.builder.string(columnName, length));
  }

  /**
   * Ajoute une colonne de type float
   * @param columnName Nom de la colonne
   * @param precision Précision
   * @param scale Échelle
   */
  public float(columnName: string, precision?: number, scale?: number): ColumnBuilder {
    return new ColumnBuilder(this.builder.float(columnName, precision, scale));
  }

  /**
   * Ajoute une colonne de type decimal
   * @param columnName Nom de la colonne
   * @param precision Précision
   * @param scale Échelle
   */
  public decimal(columnName: string, precision: number = 8, scale: number = 2): ColumnBuilder {
    return new ColumnBuilder(this.builder.decimal(columnName, precision, scale));
  }

  /**
   * Ajoute une colonne de type boolean
   * @param columnName Nom de la colonne
   */
  public boolean(columnName: string): ColumnBuilder {
    return new ColumnBuilder(this.builder.boolean(columnName));
  }

  /**
   * Ajoute une colonne de type date
   * @param columnName Nom de la colonne
   */
  public date(columnName: string): ColumnBuilder {
    return new ColumnBuilder(this.builder.date(columnName));
  }

  /**
   * Ajoute une colonne de type datetime
   * @param columnName Nom de la colonne
   */
  public dateTime(columnName: string): ColumnBuilder {
    return new ColumnBuilder(this.builder.dateTime(columnName));
  }

  /**
   * Ajoute une colonne de type time
   * @param columnName Nom de la colonne
   */
  public time(columnName: string): ColumnBuilder {
    return new ColumnBuilder(this.builder.time(columnName));
  }

  /**
   * Ajoute une colonne de type timestamp
   * @param columnName Nom de la colonne
   */
  public timestamp(columnName: string): ColumnBuilder {
    return new ColumnBuilder(this.builder.timestamp(columnName));
  }

  /**
   * Ajoute des colonnes de timestamps (created_at, updated_at)
   * @param useTimestamps Activer les timestamps (par défaut: true)
   */
  public timestamps(useTimestamps: boolean = true): void {
    if (useTimestamps) {
      this.builder.timestamps();
    }
  }

  /**
   * Ajoute une colonne de timestamp pour le soft delete
   * @param columnName Nom de la colonne (par défaut: 'deleted_at')
   */
  public softDeletes(columnName: string = 'deleted_at'): ColumnBuilder {
    return new ColumnBuilder(this.builder.timestamp(columnName).nullable());
  }

  /**
   * Ajoute une colonne de type JSON
   * @param columnName Nom de la colonne
   */
  public json(columnName: string): ColumnBuilder {
    return new ColumnBuilder(this.builder.json(columnName));
  }

  /**
   * Ajoute une colonne de type JSONB
   * @param columnName Nom de la colonne
   */
  public jsonb(columnName: string): ColumnBuilder {
    return new ColumnBuilder(this.builder.jsonb(columnName));
  }

  /**
   * Ajoute une colonne de type UUID
   * @param columnName Nom de la colonne
   */
  public uuid(columnName: string): ColumnBuilder {
    return new ColumnBuilder(this.builder.uuid(columnName));
  }

  /**
   * Ajoute une clé primaire
   * @param columnNames Noms des colonnes
   */
  public primary(columnNames: string | string[]): TableBuilder {
    this.builder.primary(columnNames);
    return this;
  }

  /**
   * Ajoute une clé étrangère
   * @param columns Colonnes de la clé étrangère
   * @param foreignTable Table référencée
   * @param foreignColumns Colonnes référencées
   */
  public foreign(
    columns: string | string[],
    foreignTable?: string,
    foreignColumns?: string | string[]
  ): ForeignKeyBuilder {
    return new ForeignKeyBuilder(this.builder.foreign(columns), foreignTable, foreignColumns);
  }

  /**
   * Ajoute un index
   * @param columnNames Noms des colonnes
   * @param indexName Nom de l'index (optionnel)
   */
  public index(columnNames: string | string[], indexName?: string): TableBuilder {
    this.builder.index(columnNames, indexName);
    return this;
  }

  /**
   * Ajoute un index unique
   * @param columnNames Noms des colonnes
   * @param indexName Nom de l'index (optionnel)
   */
  public unique(columnNames: string | string[], indexName?: string): TableBuilder {
    this.builder.unique(columnNames, indexName);
    return this;
  }

  /**
   * Supprime une colonne
   * @param columnName Nom de la colonne
   */
  public dropColumn(columnName: string): TableBuilder {
    this.builder.dropColumn(columnName);
    return this;
  }

  /**
   * Supprime plusieurs colonnes
   * @param columnNames Noms des colonnes
   */
  public dropColumns(...columnNames: string[]): TableBuilder {
    this.builder.dropColumns(...columnNames);
    return this;
  }

  /**
   * Renomme une colonne
   * @param from Nom actuel de la colonne
   * @param to Nouveau nom de la colonne
   */
  public renameColumn(from: string, to: string): TableBuilder {
    this.builder.renameColumn(from, to);
    return this;
  }

  /**
   * Supprime un index
   * @param indexName Nom de l'index
   */
  public dropIndex(indexName: string): TableBuilder {
    this.builder.dropIndex(indexName);
    return this;
  }

  /**
   * Supprime une clé étrangère
   * @param constraintName Nom de la contrainte
   */
  public dropForeign(constraintName: string): TableBuilder {
    this.builder.dropForeign(constraintName);
    return this;
  }

  /**
   * Supprime une clé primaire
   * @param constraintName Nom de la contrainte
   */
  public dropPrimary(constraintName?: string): TableBuilder {
    this.builder.dropPrimary(constraintName);
    return this;
  }

  /**
   * Supprime un index unique
   * @param indexName Nom de l'index
   */
  public dropUnique(indexName: string): TableBuilder {
    this.builder.dropUnique(indexName);
    return this;
  }
}

/**
 * Classe de construction de colonne
 */
export class ColumnBuilder {
  // Instance Knex.ColumnBuilder
  private builder: Knex.ColumnBuilder;

  /**
   * Constructeur du ColumnBuilder
   * @param builder Instance Knex.ColumnBuilder
   */
  constructor(builder: Knex.ColumnBuilder) {
    this.builder = builder;
  }

  /**
   * Définit la colonne comme nullable
   */
  public nullable(): ColumnBuilder {
    this.builder.nullable();
    return this;
  }

  /**
   * Définit la colonne comme non nullable
   */
  public notNullable(): ColumnBuilder {
    this.builder.notNullable();
    return this;
  }

  /**
   * Définit une valeur par défaut pour la colonne
   * @param value Valeur par défaut
   */
  public defaultTo(value: any): ColumnBuilder {
    this.builder.defaultTo(value);
    return this;
  }

  /**
   * Définit la colonne comme clé primaire
   */
  public primary(): ColumnBuilder {
    this.builder.primary();
    return this;
  }

  /**
   * Définit la colonne comme unique
   */
  public unique(): ColumnBuilder {
    this.builder.unique();
    return this;
  }

  /**
   * Ajoute un commentaire à la colonne
   * @param comment Commentaire
   */
  public comment(comment: string): ColumnBuilder {
    this.builder.comment(comment);
    return this;
  }

  /**
   * Définit la colonne comme unsigned (pour les types numériques)
   */
  public unsigned(): ColumnBuilder {
    this.builder.unsigned();
    return this;
  }

  /**
   * Définit la colonne comme index
   */
  public index(): ColumnBuilder {
    this.builder.index();
    return this;
  }
}

/**
 * Classe de construction de clé étrangère
 */
export class ForeignKeyBuilder {
  // Instance Knex.ForeignConstraintBuilder
  private builder: Knex.ForeignConstraintBuilder;
  
  // Table référencée
  private foreignTable?: string;
  
  // Colonnes référencées
  private foreignColumns?: string | string[];

  /**
   * Constructeur du ForeignKeyBuilder
   * @param builder Instance Knex.ForeignConstraintBuilder
   * @param foreignTable Table référencée
   * @param foreignColumns Colonnes référencées
   */
  constructor(
    builder: Knex.ForeignConstraintBuilder,
    foreignTable?: string,
    foreignColumns?: string | string[]
  ) {
    this.builder = builder;
    this.foreignTable = foreignTable;
    this.foreignColumns = foreignColumns;
    
    // Référencer la table et les colonnes si fournies
    if (foreignTable) {
      this.references(foreignColumns || 'id').on(foreignTable);
    }
  }

  /**
   * Définit les colonnes référencées
   * @param columns Colonnes référencées
   */
  public references(columns: string | string[]): ForeignKeyBuilder {
    this.builder.references(columns);
    return this;
  }

  /**
   * Définit la table référencée
   * @param tableName Nom de la table
   */
  public on(tableName: string): ForeignKeyBuilder {
    this.builder.inTable(tableName);
    return this;
  }

  /**
   * Définit l'action ON DELETE
   * @param action Action à effectuer
   */
  public onDelete(action: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION'): ForeignKeyBuilder {
    this.builder.onDelete(action);
    return this;
  }

  /**
   * Définit l'action ON UPDATE
   * @param action Action à effectuer
   */
  public onUpdate(action: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION'): ForeignKeyBuilder {
    this.builder.onUpdate(action);
    return this;
  }
}

/**
 * Classe de schéma statique pour un accès facile
 */
export class Schema {
  /**
   * Crée une nouvelle instance de SchemaBuilder
   * @param connectionName Nom de la connexion (optionnel)
   */
  public static builder(connectionName?: string): SchemaBuilder {
    return new SchemaBuilder(connectionName);
  }

  /**
   * Vérifie si une table existe
   * @param tableName Nom de la table
   * @param connectionName Nom de la connexion (optionnel)
   */
  public static async hasTable(tableName: string, connectionName?: string): Promise<boolean> {
    return new SchemaBuilder(connectionName).hasTable(tableName);
  }

  /**
   * Vérifie si une colonne existe dans une table
   * @param tableName Nom de la table
   * @param columnName Nom de la colonne
   * @param connectionName Nom de la connexion (optionnel)
   */
  public static async hasColumn(
    tableName: string,
    columnName: string,
    connectionName?: string
  ): Promise<boolean> {
    return new SchemaBuilder(connectionName).hasColumn(tableName, columnName);
  }

  /**
   * Crée une nouvelle table
   * @param tableName Nom de la table
   * @param callback Fonction de construction de la table
   * @param connectionName Nom de la connexion (optionnel)
   */
  public static async create(
    tableName: string,
    callback: (table: TableBuilder) => void,
    connectionName?: string
  ): Promise<void> {
    return new SchemaBuilder(connectionName).createTable(tableName, callback);
  }

  /**
   * Modifie une table existante
   * @param tableName Nom de la table
   * @param callback Fonction de modification de la table
   * @param connectionName Nom de la connexion (optionnel)
   */
  public static async table(
    tableName: string,
    callback: (table: TableBuilder) => void,
    connectionName?: string
  ): Promise<void> {
    return new SchemaBuilder(connectionName).alterTable(tableName, callback);
  }

  /**
   * Renomme une table
   * @param from Nom actuel de la table
   * @param to Nouveau nom de la table
   * @param connectionName Nom de la connexion (optionnel)
   */
  public static async rename(
    from: string,
    to: string,
    connectionName?: string
  ): Promise<void> {
    return new SchemaBuilder(connectionName).renameTable(from, to);
  }

  /**
   * Supprime une table
   * @param tableName Nom de la table
   * @param connectionName Nom de la connexion (optionnel)
   */
  public static async drop(tableName: string, connectionName?: string): Promise<void> {
    return new SchemaBuilder(connectionName).dropTable(tableName);
  }

  /**
   * Supprime une table si elle existe
   * @param tableName Nom de la table
   * @param connectionName Nom de la connexion (optionnel)
   */
  public static async dropIfExists(tableName: string, connectionName?: string): Promise<void> {
    return new SchemaBuilder(connectionName).dropTableIfExists(tableName);
  }
}
