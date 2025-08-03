/**
 * Classe de base pour les migrations dans l'ORM Teloquent
 * 
 * Cette classe fournit la structure de base pour les migrations.
 */

import { Schema } from '../utils/schema';
import { Connection } from '../utils/connection';
import { Knex } from 'knex';

/**
 * Classe abstraite pour les migrations
 */
export abstract class Migration {
  /**
   * Nom de la connexion à utiliser
   */
  protected connection?: string;
  
  /**
   * Instance de Schema pour les opérations de schéma
   */
  protected schema: Schema;
  
  /**
   * Instance de Knex pour les requêtes brutes
   */
  protected knex: Knex;

  /**
   * Constructeur de la migration
   * @param connection Nom de la connexion (optionnel)
   */
  constructor(connection?: string) {
    this.connection = connection;
    this.knex = Connection.getConnection(connection);
    this.schema = Schema;
  }

  /**
   * Méthode à implémenter pour appliquer la migration
   */
  public abstract up(): Promise<void>;

  /**
   * Méthode à implémenter pour annuler la migration
   */
  public abstract down(): Promise<void>;
}
