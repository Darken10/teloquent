/**
 * Exemple d'utilisation des scopes dans Teloquent
 * 
 * Cet exemple montre comment définir et utiliser les différents types de scopes
 * dans les modèles Teloquent.
 */

import { Model, QueryBuilder } from '../src';
import { Table, Column, PrimaryKey, Timestamps } from '../src/decorators';
import { Scope } from '../src/decorators/Scope';
import { GlobalScope } from '../src/scopes';

/**
 * Exemple de scope global sous forme de classe
 * 
 * Ce scope filtre les utilisateurs actifs
 */
class ActiveScope implements GlobalScope {
  apply<T extends Model>(builder: QueryBuilder<T>): void {
    builder.where('active', true);
  }
}

/**
 * Exemple de scope global sous forme de classe avec paramètres
 * 
 * Ce scope filtre les utilisateurs par rôle
 */
class RoleScope implements GlobalScope {
  constructor(private role: string) {}

  apply<T extends Model>(builder: QueryBuilder<T>): void {
    builder.where('role', this.role);
  }
}

/**
 * Modèle User avec différents types de scopes
 */
@Table('users')
class User extends Model {
  @PrimaryKey()
  @Column()
  id!: number;

  @Column()
  name!: string;

  @Column()
  email!: string;

  @Column()
  active!: boolean;

  @Column()
  role!: string;

  @Column()
  created_at!: Date;

  @Column()
  updated_at!: Date;

  @Column()
  last_login_at?: Date;

  /**
   * Boot method appelée automatiquement lors de l'initialisation du modèle
   * 
   * Utilisée pour enregistrer les scopes globaux
   */
  public static boot(): void {
    // Ajouter un scope global sous forme de classe
    this.addGlobalScope(new ActiveScope());

    // Ajouter un scope global sous forme de fonction anonyme
    this.addGlobalScope((query: QueryBuilder<User>) => {
      query.whereNotNull('email');
    }, 'withEmail');
  }

  /**
   * Scope local avec décorateur @Scope
   * 
   * Filtre les utilisateurs qui se sont connectés récemment
   */
  @Scope()
  public static recentlyLoggedIn(query: QueryBuilder<User>): QueryBuilder<User> {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    return query.where('last_login_at', '>=', oneWeekAgo);
  }

  /**
   * Scope local avec préfixe 'scope'
   * 
   * Filtre les utilisateurs par nom
   */
  public static scopeWithName(query: QueryBuilder<User>, name: string): QueryBuilder<User> {
    return query.where('name', 'like', `%${name}%`);
  }

  /**
   * Scope local avec paramètres
   * 
   * Filtre les utilisateurs par rôle
   */
  @Scope()
  public static ofRole(query: QueryBuilder<User>, role: string): QueryBuilder<User> {
    return query.where('role', role);
  }
}

/**
 * Modèle Post avec scopes et relations
 */
@Table('posts')
class Post extends Model {
  @PrimaryKey()
  @Column()
  id!: number;

  @Column()
  user_id!: number;

  @Column()
  title!: string;

  @Column()
  content!: string;

  @Column()
  published!: boolean;

  @Timestamps()
  timestamps!: boolean;

  /**
   * Relation avec le modèle User
   */
  public user() {
    return this.belongsTo(User);
  }

  /**
   * Scope pour les posts publiés
   */
  @Scope()
  public static published(query: QueryBuilder<Post>): QueryBuilder<Post> {
    return query.where('published', true);
  }

  /**
   * Scope avec relation
   * 
   * Filtre les posts par le rôle de l'utilisateur
   */
  @Scope()
  public static fromUserWithRole(query: QueryBuilder<Post>, role: string): QueryBuilder<Post> {
    return query.whereHas('user', (userQuery) => {
      userQuery.where('role', role);
    });
  }
}

/**
 * Exemples d'utilisation des scopes
 */
async function exemples() {
  // Initialiser les modèles
  User.boot();

  console.log('Exemple 1: Utilisation des scopes globaux');
  // Les scopes globaux sont appliqués automatiquement
  const activeUsers = await User.query().get();
  console.log(activeUsers);

  console.log('Exemple 2: Désactiver un scope global');
  // Désactiver le scope ActiveScope
  const allUsers = await User.query()
    .withoutGlobalScope(ActiveScope)
    .get();
  console.log(allUsers);

  console.log('Exemple 3: Désactiver tous les scopes globaux');
  // Désactiver tous les scopes globaux
  const reallyAllUsers = await User.query()
    .withoutGlobalScopes()
    .get();
  console.log(reallyAllUsers);

  console.log('Exemple 4: Utilisation des scopes locaux avec décorateur');
  // Utiliser le scope local recentlyLoggedIn
  const recentUsers = await User.query()
    .recentlyLoggedIn()
    .get();
  console.log(recentUsers);

  console.log('Exemple 5: Utilisation des scopes locaux avec préfixe');
  // Utiliser le scope local withName
  const johnsUsers = await User.query()
    .withName('John')
    .get();
  console.log(johnsUsers);

  console.log('Exemple 6: Utilisation des scopes avec paramètres');
  // Utiliser le scope local ofRole avec un paramètre
  const adminUsers = await User.query()
    .ofRole('admin')
    .get();
  console.log(adminUsers);

  console.log('Exemple 7: Combinaison de scopes');
  // Combiner plusieurs scopes
  const recentAdmins = await User.query()
    .recentlyLoggedIn()
    .ofRole('admin')
    .get();
  console.log(recentAdmins);

  console.log('Exemple 8: Scopes avec relations');
  // Utiliser un scope avec une relation
  const adminPosts = await Post.query()
    .published()
    .fromUserWithRole('admin')
    .get();
  console.log(adminPosts);

  console.log('Exemple 9: Ajouter un scope global dynamiquement');
  // Ajouter un scope global dynamiquement
  User.addGlobalScope(new RoleScope('admin'));
  const onlyAdmins = await User.query().get();
  console.log(onlyAdmins);
}

// Exécuter les exemples
exemples().catch(console.error);
