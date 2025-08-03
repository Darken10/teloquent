/**
 * Teloquent - An Eloquent-inspired ORM for TypeScript
 * 
 * Inspiré du fonctionnement d'Eloquent (l'ORM de Laravel), Teloquent est un ORM
 * complet en TypeScript qui utilise le pattern Active Record et supporte
 * PostgreSQL, MySQL et SQLite via knex.js.
 */

// Importer et exporter la classe Model de base
import Model from './Model';
export { Model };

// Exporter les classes de relations
import { HasOne, HasMany, BelongsTo, BelongsToMany } from './relations';
export { HasOne, HasMany, BelongsTo, BelongsToMany };

// Exporter le QueryBuilder
import QueryBuilder from './QueryBuilder';
export { QueryBuilder };

// Exporter les décorateurs
import { 
  Table, 
  Column, 
  PrimaryKey, 
  Timestamps, 
  SoftDeletes,
  HasOneRelation,
  HasManyRelation,
  BelongsToRelation,
  BelongsToManyRelation
} from './decorators';

export {
  Table,
  Column,
  PrimaryKey,
  Timestamps,
  SoftDeletes,
  HasOneRelation,
  HasManyRelation,
  BelongsToRelation,
  BelongsToManyRelation
};

// Exporter les utilitaires de migration
import { Schema, SchemaBuilder } from './utils/schema';
export { Schema, SchemaBuilder };

// Exporter les utilitaires de connexion à la base de données
import { Connection, ConnectionConfig } from './utils/connection';
export { Connection, ConnectionConfig };

// Version du package
export const VERSION = '1.0.0';

// Fonction d'initialisation de Teloquent
export function initialize(config: ConnectionConfig): void {
  Connection.initialize(config);
}

// Exporter par défaut
export default {
  Model,
  QueryBuilder,
  initialize,
  VERSION
};
