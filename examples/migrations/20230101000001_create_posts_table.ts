/**
 * Migration pour créer la table des posts
 */

import { Migration } from '../../src/migrations/Migration';
import { Schema } from '../../src/utils/schema';

export default class CreatePostsTable extends Migration {
  /**
   * Exécute la migration
   */
  public async up(): Promise<void> {
    await Schema.create('posts', (table) => {
      table.increments('id');
      table.string('title').notNullable();
      table.text('content').notNullable();
      table.integer('user_id').unsigned().notNullable();
      table.boolean('published').defaultTo(false);
      table.timestamps();
      table.softDeletes();
      
      // Clé étrangère
      table.foreign('user_id')
        .references('id')
        .on('users')
        .onDelete('CASCADE');
    }, this.connection);
  }

  /**
   * Annule la migration
   */
  public async down(): Promise<void> {
    await Schema.dropIfExists('posts', this.connection);
  }
}
