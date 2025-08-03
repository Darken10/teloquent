/**
 * Exemple de modèle User pour Teloquent
 */

import { Model } from '../../src/Model';
import { Table, PrimaryKey, Column, Timestamps, HasManyRelation } from '../../src/decorators';
import { HasMany } from '../../src/relations/HasMany';
import Post from './Post';

@Table('users')
@Timestamps()
export class User extends Model {
  @PrimaryKey()
  public id!: number;

  @Column({ nullable: false })
  public name!: string;

  @Column({ nullable: false })
  public email!: string;

  @Column({ nullable: true })
  public password!: string;

  @Column({ name: 'remember_token', nullable: true })
  public rememberToken?: string;

  @HasManyRelation(() => Post)
  public posts!: HasMany<Post>;

  /**
   * Vérifie si l'utilisateur a des posts
   */
  public async hasPosts(): Promise<boolean> {
    return (await this.posts.count()) > 0;
  }

  /**
   * Récupère les derniers posts de l'utilisateur
   * @param limit Nombre de posts à récupérer
   */
  public async getLatestPosts(limit: number = 5): Promise<Post[]> {
    return this.posts.orderBy('created_at', 'desc').limit(limit).get();
  }
}

export default User;
