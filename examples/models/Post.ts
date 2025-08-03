/**
 * Exemple de modèle Post pour Teloquent
 */

import { Model } from '../../src/Model';
import { Table, PrimaryKey, Column, Timestamps, BelongsToRelation, SoftDeletes } from '../../src/decorators';
import { BelongsTo } from '../../src/relations/BelongsTo';
import User from './User';

@Table('posts')
@Timestamps()
@SoftDeletes()
export class Post extends Model {
  @PrimaryKey()
  public id!: number;

  @Column({ nullable: false })
  public title!: string;

  @Column({ nullable: false })
  public content!: string;

  @Column({ name: 'user_id', nullable: false })
  public userId!: number;

  @Column({ nullable: true, defaultValue: false })
  public published!: boolean;

  @BelongsToRelation(() => User, { foreignKey: 'user_id' })
  public user!: BelongsTo<User>;

  /**
   * Scope pour les posts publiés
   */
  public static published<T extends typeof Post>(this: T) {
    return this.query().where('published', true);
  }

  /**
   * Publie le post
   */
  public async publish(): Promise<void> {
    this.published = true;
    await this.save();
  }

  /**
   * Dépublie le post
   */
  public async unpublish(): Promise<void> {
    this.published = false;
    await this.save();
  }

  /**
   * Récupère l'extrait du contenu
   * @param length Longueur de l'extrait
   */
  public excerpt(length: number = 100): string {
    if (!this.content) return '';
    
    if (this.content.length <= length) {
      return this.content;
    }
    
    return this.content.substring(0, length) + '...';
  }
}

export default Post;
