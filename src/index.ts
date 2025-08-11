/**
 * Teloquent - An Eloquent-inspired ORM for TypeScript
 * 
 * Inspiré du fonctionnement d'Eloquent (l'ORM de Laravel), Teloquent est un ORM
 * complet en TypeScript qui utilise le pattern Active Record et supporte
 * PostgreSQL, MySQL et SQLite via knex.js.
 */

/**
 * Point d'entrée principal pour l'ORM Teloquent
 */

import Model from './Model';
import QueryBuilder from './QueryBuilder';
import Collection from './Collection';
import { Connection } from './utils/connection';

// Exporter les classes principales
export { Model, QueryBuilder, Collection, Connection };

// Exporter les décorateurs
export * from './decorators';
export { Scope } from './decorators/Scope';

// Exporter les scopes
export * from './scopes';

// Exporter les utilitaires de migration
import { Schema, SchemaBuilder } from './utils/schema';
export { Schema, SchemaBuilder };

// Exporter les utilitaires de connexion à la base de données
import { ConnectionConfig } from './utils/connection';
export { ConnectionConfig };

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
