# Scopes dans Teloquent

## Introduction

Les scopes dans Teloquent, inspirés de Laravel, vous permettent d'encapsuler des logiques de requête complexes ou fréquemment utilisées dans des méthodes réutilisables. Cela permet de maintenir votre code propre, expressif et DRY (Don't Repeat Yourself).

Teloquent propose trois types de scopes :
- **Scopes globaux** : appliqués automatiquement à toutes les requêtes d'un modèle
- **Scopes locaux** : méthodes définies sur un modèle qui peuvent être chaînées dans les requêtes
- **Scopes dynamiques** : scopes locaux qui acceptent des paramètres

## Scopes globaux

Les scopes globaux vous permettent d'ajouter automatiquement des contraintes à toutes les requêtes pour un modèle donné. Ils sont particulièrement utiles pour des fonctionnalités comme le soft delete, le multi-tenancy, ou le filtrage automatique par statut.

### Définir un scope global

Vous pouvez définir un scope global de deux façons :

#### 1. En tant que classe implémentant l'interface GlobalScope

```typescript
import { GlobalScope, QueryBuilder, Model } from 'teloquent';

class ActiveScope implements GlobalScope {
  apply<T extends Model>(builder: QueryBuilder<T>): void {
    builder.where('active', true);
  }
}
```

#### 2. En tant que fonction callback

```typescript
import { QueryBuilder, Model } from 'teloquent';

const activeScope = (query: QueryBuilder<any>) => {
  query.where('active', true);
};
```

### Appliquer un scope global à un modèle

Vous pouvez appliquer un scope global à un modèle en utilisant la méthode statique `addGlobalScope` :

```typescript
// Avec une classe
User.addGlobalScope(new ActiveScope());

// Avec une fonction callback
User.addGlobalScope((query) => {
  query.where('active', true);
}, 'active');
```

Le meilleur endroit pour ajouter des scopes globaux est dans la méthode `boot` du modèle :

```typescript
@Table('users')
class User extends Model {
  // Propriétés du modèle...

  public static boot(): void {
    // Ajouter des scopes globaux ici
    this.addGlobalScope(new ActiveScope());
  }
}
```

### Supprimer un scope global

Vous pouvez supprimer un scope global en utilisant la méthode statique `removeGlobalScope` :

```typescript
User.removeGlobalScope(ActiveScope);
// ou
User.removeGlobalScope('active');
```

### Désactiver les scopes globaux pour une requête

Vous pouvez désactiver un ou plusieurs scopes globaux pour une requête spécifique :

```typescript
// Désactiver un scope global spécifique
User.query().withoutGlobalScope(ActiveScope).get();

// Désactiver tous les scopes globaux
User.query().withoutGlobalScopes().get();
```

## Scopes locaux

Les scopes locaux vous permettent de définir des contraintes de requête réutilisables que vous pouvez chaîner dans vos requêtes. Ils sont définis comme des méthodes statiques sur votre modèle.

### Définir un scope local

Vous pouvez définir un scope local de deux façons :

#### 1. Avec le décorateur @Scope

```typescript
import { Model, Table, Column, PrimaryKey } from 'teloquent';
import { Scope } from 'teloquent';

@Table('users')
class User extends Model {
  @PrimaryKey()
  @Column()
  id!: number;

  @Column()
  name!: string;

  @Column()
  active!: boolean;

  @Column()
  role!: string;

  @Scope()
  public static active(query: QueryBuilder<User>): QueryBuilder<User> {
    return query.where('active', true);
  }
}
```

#### 2. Avec le préfixe 'scope'

Vous pouvez également définir des scopes locaux en préfixant le nom de la méthode par 'scope' (avec la première lettre du nom en majuscule) :

```typescript
@Table('users')
class User extends Model {
  // ...

  public static scopeActive(query: QueryBuilder<User>): QueryBuilder<User> {
    return query.where('active', true);
  }
}
```

### Utiliser un scope local

Une fois définis, vous pouvez utiliser les scopes locaux dans vos requêtes en chaînant les méthodes :

```typescript
// Utiliser un scope local
const activeUsers = await User.query().active().get();

// Combiner plusieurs scopes
const activeAdmins = await User.query()
  .active()
  .where('role', 'admin')
  .get();
```

## Scopes dynamiques

Les scopes dynamiques sont des scopes locaux qui acceptent des paramètres, ce qui les rend encore plus flexibles et réutilisables.

### Définir un scope dynamique

Vous pouvez définir un scope dynamique de la même manière qu'un scope local, mais en ajoutant des paramètres supplémentaires à la méthode :

```typescript
@Table('users')
class User extends Model {
  // ...

  // Avec le décorateur @Scope
  @Scope()
  public static ofRole(query: QueryBuilder<User>, role: string): QueryBuilder<User> {
    return query.where('role', role);
  }

  // Avec le préfixe 'scope'
  public static scopeCreatedBetween(
    query: QueryBuilder<User>,
    start: Date,
    end: Date
  ): QueryBuilder<User> {
    return query
      .where('created_at', '>=', start)
      .where('created_at', '<=', end);
  }
}
```

### Utiliser un scope dynamique

Vous pouvez utiliser les scopes dynamiques en passant les paramètres nécessaires :

```typescript
// Utiliser un scope dynamique avec un paramètre
const admins = await User.query().ofRole('admin').get();

// Utiliser un scope dynamique avec plusieurs paramètres
const usersLastMonth = await User.query()
  .createdBetween(
    new Date('2023-07-01'),
    new Date('2023-07-31')
  )
  .get();

// Combiner des scopes dynamiques et des scopes locaux
const activeAdmins = await User.query()
  .active()
  .ofRole('admin')
  .get();
```

## Scopes avec relations

Vous pouvez également utiliser les scopes pour filtrer les requêtes basées sur des relations.

### Filtrer par relation

La méthode `whereHas` vous permet de filtrer les modèles en fonction des contraintes sur leurs relations :

```typescript
// Récupérer tous les posts des utilisateurs actifs
const posts = await Post.query()
  .whereHas('user', (query) => {
    query.where('active', true);
  })
  .get();

// Récupérer tous les posts des utilisateurs avec un rôle spécifique
const adminPosts = await Post.query()
  .whereHas('user', (query) => {
    query.where('role', 'admin');
  })
  .get();
```

### Combiner les scopes et les relations

Vous pouvez également définir des scopes qui utilisent des relations :

```typescript
@Table('posts')
class Post extends Model {
  // ...

  @Scope()
  public static fromActiveUsers(query: QueryBuilder<Post>): QueryBuilder<Post> {
    return query.whereHas('user', (userQuery) => {
      userQuery.where('active', true);
    });
  }

  @Scope()
  public static fromUserWithRole(query: QueryBuilder<Post>, role: string): QueryBuilder<Post> {
    return query.whereHas('user', (userQuery) => {
      userQuery.where('role', role);
    });
  }
}

// Utilisation
const activePosts = await Post.query().fromActiveUsers().get();
const adminPosts = await Post.query().fromUserWithRole('admin').get();
```
const users = await User.query()
  .withoutGlobalScope(ActiveScope)
  .withoutGlobalScope('recent')
  .get();

## Bonnes pratiques

### Organisation des scopes

Pour les projets de grande envergure, il est recommandé d'organiser vos scopes dans des fichiers séparés :

```typescript
// scopes/UserScopes.ts
import { GlobalScope, QueryBuilder, Model } from 'teloquent';

export class ActiveUsersScope implements GlobalScope {
  public apply<T extends Model>(builder: QueryBuilder<T>): void {
    builder.where('active', true);
  }
}

export class RecentUsersScope implements GlobalScope {
  public apply<T extends Model>(builder: QueryBuilder<T>): void {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    builder.where('created_at', '>', thirtyDaysAgo);
  }
}
```

### Réutilisation des scopes

Créez des scopes réutilisables pour les contraintes communes :

```typescript
@Table('users')
class User extends Model {
  // ...
  
  @Scope()
  public static active(query: QueryBuilder<User>): QueryBuilder<User> {
    return query.where('active', true);
  }
  
  @Scope()
  public static withRole(query: QueryBuilder<User>, role: string): QueryBuilder<User> {
    return query.where('role', role);
  }
  
  // Réutilisation des scopes dans d'autres scopes
  @Scope()
  public static activeAdmins(query: QueryBuilder<User>): QueryBuilder<User> {
    return query.active().withRole('admin');
  }
}
```

### Performance

Soyez attentif à la performance lors de l'utilisation des scopes, en particulier avec les relations :

```typescript
// Évitez les requêtes N+1 en utilisant eager loading avec les scopes
const posts = await Post.query()
  .fromUserWithRole('admin')
  .with('user') // Chargement eager de la relation user
  .get();
```

## Conclusion

Les scopes dans Teloquent offrent une façon élégante et puissante de réutiliser la logique de requête dans votre application. En utilisant les scopes globaux, locaux et dynamiques, vous pouvez :

- Centraliser la logique de requête commune
- Améliorer la lisibilité et la maintenabilité du code
- Appliquer automatiquement des contraintes à tous les modèles
- Créer des API fluides et expressives pour vos requêtes

En combinant les scopes avec d'autres fonctionnalités de Teloquent comme les relations et le chargement eager, vous pouvez construire des requêtes complexes tout en gardant votre code propre et maintenable.

// Exemple d'utilisation combinée
const users = await User.query()
  .withoutGlobalScopes([ActiveScope, TenantScope])
  .active()
  .ofRole('admin')
  .get();
```



## Bonnes pratiques

### Nommage des scopes

- Utilisez des noms clairs et descriptifs pour vos scopes
- Préfixez les scopes de filtrage par `where`, `of`, `with`, etc.
- Préfixez les scopes d'ordre par `orderBy`
- Utilisez des verbes pour les scopes d'action

### Organisation des scopes

- Pour les applications complexes, envisagez de placer les scopes globaux dans des fichiers séparés
- Regroupez les scopes connexes dans des traits ou des classes utilitaires
- Documentez le comportement de chaque scope, surtout s'il est complexe

### Exemples de nommage de scopes

```typescript
class Post extends Model {
  // Filtrage
  @Scope() public static published(q: QueryBuilder<Post>): QueryBuilder<Post> { /* ... */ }
  @Scope() public static ofCategory(q: QueryBuilder<Post>, category: string): QueryBuilder<Post> { /* ... */ }
  @Scope() public static withTags(q: QueryBuilder<Post>): QueryBuilder<Post> { /* ... */ }
  
  // Ordre
  @Scope() public static orderByPopularity(q: QueryBuilder<Post>): QueryBuilder<Post> { /* ... */ }
  @Scope() public static orderByRecent(q: QueryBuilder<Post>): QueryBuilder<Post> { /* ... */ }
  
  // Action
  @Scope() public static markAsRead(q: QueryBuilder<Post>): QueryBuilder<Post> { /* ... */ }
}
```

## Exemple complet

```typescript
import { Model, Table, Column, PrimaryKey, HasManyRelation, BelongsToRelation, Scope, GlobalScope, QueryBuilder } from 'teloquent';
import Post from './Post';
import Comment from './Comment';

// Définition d'un scope global
class SoftDeleteScope implements GlobalScope {
  public apply<T extends Model>(builder: QueryBuilder<T>): void {
    builder.whereNull('deleted_at');
  }
}

@Table('users')
class User extends Model {
  @PrimaryKey()
  public id!: number;
  
  @Column()
  public name!: string;
  
  @Column()
  public email!: string;
  
  @Column()
  public role!: string;
  
  @Column()
  public active!: boolean;
  
  @Column({ nullable: true })
  public deleted_at?: Date;
  
  @HasManyRelation(() => Post, 'user_id')
  public posts!: Post[];
  
  @HasManyRelation(() => Comment, 'user_id')
  public comments!: Comment[];
  
  // Ajouter des scopes globaux
  public static {
    User.addGlobalScope(new SoftDeleteScope());
    User.addGlobalScope('active', (builder) => {
      builder.where('active', true);
    });
  }
  
  // Scopes locaux
  @Scope()
  public static ofRole(query: QueryBuilder<User>, role: string): QueryBuilder<User> {
    return query.where('role', role);
  }
  
  @Scope()
  public static withVerifiedEmail(query: QueryBuilder<User>): QueryBuilder<User> {
    return query.whereNotNull('email_verified_at');
  }
  
  @Scope()
  public static withPosts(query: QueryBuilder<User>): QueryBuilder<User> {
    return query.whereHas('posts');
  }
  
  @Scope()
  public static orderByPostCount(query: QueryBuilder<User>, direction: 'asc' | 'desc' = 'desc'): QueryBuilder<User> {
    return query
      .withCount('posts')
      .orderBy('posts_count', direction);
  }
}

// Utilisation des scopes
async function main() {
  // Scopes globaux appliqués automatiquement (active = true, deleted_at = null)
  const users = await User.all();
  
  // Utilisation de scopes locaux
  const admins = await User.query()
    .ofRole('admin')
    .withVerifiedEmail()
    .get();
  
  // Désactivation de scopes globaux
  const allUsers = await User.query()
    .withoutGlobalScope('active')
    .get();
  
  // Combinaison de scopes et autres méthodes
  const topAuthors = await User.query()
    .withPosts()
    .orderByPostCount()
    .limit(10)
    .get();
  
  // Scopes avec relations
  const activeAdminsWithPosts = await User.query()
    .ofRole('admin')
    .with('posts', query => query.where('published', true))
    .paginate(1, 15);
}

main();
```

## Conclusion

Les scopes dans Teloquent offrent un moyen puissant et expressif d'encapsuler des logiques de requête complexes. En utilisant des scopes globaux et locaux, vous pouvez maintenir votre code propre, réutilisable et facile à comprendre.

Les scopes vous permettent de :

- Centraliser la logique de requête
- Éviter la duplication de code
- Créer une API expressive pour vos modèles
- Appliquer automatiquement des contraintes à toutes les requêtes
- Combiner facilement des conditions complexes

En suivant les bonnes pratiques de nommage et d'organisation, les scopes peuvent considérablement améliorer la maintenabilité et la lisibilité de votre code.
