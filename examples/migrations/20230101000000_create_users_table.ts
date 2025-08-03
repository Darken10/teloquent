/**
 * Migration pour créer la table des utilisateurs
 */

import { Migration } from '../../src/migrations/Migration';
import { Schema } from '../../src/utils/schema';

export default class CreateUsersTable extends Migration {
  /**
   * Exécute la migration
   */
  public async up(): Promise<void> {
    await Schema.create('users', (table) => {
      table.increments('id');
      table.string('name').notNullable();
      table.string('email').notNullable().unique();
      table.string('password').nullable();
      table.string('remember_token').nullable();
      table.timestamps();
    }, this.connection);
  }

  /**
   * Annule la migration
   */
  public async down(): Promise<void> {
    await Schema.dropIfExists('users', this.connection);
  }
}
