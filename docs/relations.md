# Relations

Teloquent offre un système complet de relations entre modèles, permettant de définir et d'utiliser facilement les associations entre vos tables de base de données.

## Types de relations

Teloquent supporte quatre types de relations principales :

1. **One-to-One** (HasOne) : Un modèle est associé à un seul autre modèle
2. **One-to-Many** (HasMany) : Un modèle est associé à plusieurs autres modèles
3. **Many-to-One** (BelongsTo) : Inverse de One-to-Many, un modèle appartient à un autre modèle
4. **Many-to-Many** (BelongsToMany) : Plusieurs modèles sont associés à plusieurs autres modèles via une table pivot

## Définition des relations

### One-to-One (HasOne)

Une relation One-to-One associe un modèle à exactement un autre modèle.

```typescript
import { Model, Table, Column, PrimaryKey, HasOneRelation } from 'teloquent';
import Profile from './Profile';

@Table('users')
class User extends Model {
  @PrimaryKey()
  public id!: number;
  
  @Column()
  public name!: string;
  
  @HasOneRelation(() => Profile, 'user_id')
  public profile!: Profile;
}
```

Dans cet exemple, chaque utilisateur a un seul profil. Le premier argument de `@HasOneRelation` est une fonction qui retourne le modèle associé, et le second argument est la clé étrangère dans la table associée.

### One-to-Many (HasMany)

Une relation One-to-Many associe un modèle à plusieurs autres modèles.

```typescript
import { Model, Table, Column, PrimaryKey, HasManyRelation } from 'teloquent';
import Post from './Post';

@Table('users')
class User extends Model {
  @PrimaryKey()
  public id!: number;
  
  @Column()
  public name!: string;
  
  @HasManyRelation(() => Post, 'user_id')
  public posts!: Post[];
}
```

Dans cet exemple, chaque utilisateur peut avoir plusieurs posts. Le premier argument de `@HasManyRelation` est une fonction qui retourne le modèle associé, et le second argument est la clé étrangère dans la table associée.

### Many-to-One (BelongsTo)

Une relation Many-to-One est l'inverse d'une relation One-to-Many.

```typescript
import { Model, Table, Column, PrimaryKey, BelongsToRelation } from 'teloquent';
import User from './User';

@Table('posts')
class Post extends Model {
  @PrimaryKey()
  public id!: number;
  
  @Column()
  public title!: string;
  
  @Column()
  public content!: string;
  
  @Column()
  public user_id!: number;
  
  @BelongsToRelation(() => User, 'user_id')
  public user!: User;
}
```

Dans cet exemple, chaque post appartient à un seul utilisateur. Le premier argument de `@BelongsToRelation` est une fonction qui retourne le modèle associé, et le second argument est la clé étrangère dans la table courante.

### Many-to-Many (BelongsToMany)

Une relation Many-to-Many associe plusieurs modèles à plusieurs autres modèles via une table pivot.

```typescript
import { Model, Table, Column, PrimaryKey, BelongsToManyRelation } from 'teloquent';
import Role from './Role';

@Table('users')
class User extends Model {
  @PrimaryKey()
  public id!: number;
  
  @Column()
  public name!: string;
  
  @BelongsToManyRelation(() => Role, 'user_roles', 'user_id', 'role_id')
  public roles!: Role[];
}
```

Dans cet exemple, chaque utilisateur peut avoir plusieurs rôles, et chaque rôle peut être attribué à plusieurs utilisateurs. Les arguments de `@BelongsToManyRelation` sont :
1. Une fonction qui retourne le modèle associé
2. Le nom de la table pivot
3. La clé étrangère de la table courante dans la table pivot
4. La clé étrangère du modèle associé dans la table pivot

## Utilisation des relations

### Chargement différé (Lazy Loading)

Par défaut, les relations sont chargées en mode différé, c'est-à-dire qu'elles ne sont chargées que lorsque vous y accédez.

```typescript
const user = await User.find(1);
const profile = await user.profile; // La relation est chargée à ce moment
```

### Chargement anticipé (Eager Loading)

Pour éviter le problème N+1, vous pouvez charger les relations à l'avance avec la méthode `with`.

```typescript
// Charge les utilisateurs avec leurs profils en une seule requête
const users = await User.query().with('profile').get();

// Accès aux relations chargées (pas de requête supplémentaire)
users.each(user => {
  console.log(user.profile.bio);
});
```

### Chargement anticipé de plusieurs relations

Vous pouvez charger plusieurs relations en une seule requête.

```typescript
const users = await User.query()
  .with('profile')
  .with('posts')
  .with('roles')
  .get();
```

### Chargement anticipé imbriqué

Vous pouvez charger des relations imbriquées en utilisant la notation par points.

```typescript
const users = await User.query()
  .with('posts.comments')
  .get();
```

### Chargement conditionnel

Vous pouvez appliquer des conditions aux relations chargées.

```typescript
const users = await User.query()
  .with('posts', query => query.where('published', true))
  .get();
```

## Manipulation des relations

### Ajout de relations

#### One-to-One et Many-to-One

```typescript
// Associer un profil à un utilisateur
const user = await User.find(1);
const profile = new Profile({ bio: 'Developer' });

// Méthode 1: Associer et sauvegarder
user.profile = profile;
await user.save();

// Méthode 2: Utiliser la relation comme méthode
await user.profile().associate(profile);
```

#### One-to-Many

```typescript
// Ajouter un post à un utilisateur
const user = await User.find(1);
const post = new Post({ title: 'Hello', content: 'World' });

// Méthode 1: Ajouter à la collection et sauvegarder
user.posts.push(post);
await post.save();

// Méthode 2: Utiliser la relation comme méthode
await user.posts().create({
  title: 'Hello',
  content: 'World'
});
```

#### Many-to-Many

```typescript
// Attacher des rôles à un utilisateur
const user = await User.find(1);
const roleIds = [1, 2, 3];

// Attacher des rôles par ID
await user.roles().attach(roleIds);

// Attacher des rôles avec des données pivot
await user.roles().attach([
  { id: 1, pivot: { expires_at: new Date() } },
  { id: 2, pivot: { expires_at: new Date() } }
]);
```

### Suppression de relations

#### One-to-One et Many-to-One

```typescript
// Dissocier un profil
const user = await User.find(1);

// Méthode 1: Dissocier et sauvegarder
user.profile = null;
await user.save();

// Méthode 2: Utiliser la relation comme méthode
await user.profile().dissociate();
```

#### One-to-Many

```typescript
// Supprimer des posts d'un utilisateur
const user = await User.find(1);

// Supprimer tous les posts
await user.posts().delete();

// Supprimer les posts avec une condition
await user.posts().where('published', false).delete();
```

#### Many-to-Many

```typescript
const user = await User.find(1);

// Détacher des rôles spécifiques
await user.roles().detach([1, 2]);

// Détacher tous les rôles
await user.roles().detach();

// Synchroniser les rôles (remplacer tous les rôles par ceux spécifiés)
await user.roles().sync([1, 3, 5]);
```

## Comptage de relations

Vous pouvez compter le nombre d'enregistrements liés sans charger les relations complètes.

```typescript
// Compter les posts de chaque utilisateur
const users = await User.query()
  .withCount('posts')
  .get();

users.each(user => {
  console.log(`${user.name} a ${user.posts_count} articles`);
});

// Compter plusieurs relations
const users = await User.query()
  .withCount('posts')
  .withCount('comments')
  .get();

// Compter avec des conditions
const users = await User.query()
  .withCount('posts', query => query.where('published', true))
  .get();
```

## Relations polymorphiques

Les relations polymorphiques permettent à un modèle d'appartenir à plusieurs types de modèles.

### One-to-One polymorphique

```typescript
import { Model, Table, Column, PrimaryKey, MorphOneRelation } from 'teloquent';

@Table('images')
class Image extends Model {
  @PrimaryKey()
  public id!: number;
  
  @Column()
  public url!: string;
  
  @Column()
  public imageable_id!: number;
  
  @Column()
  public imageable_type!: string;
}

@Table('users')
class User extends Model {
  @PrimaryKey()
  public id!: number;
  
  @MorphOneRelation(() => Image, 'imageable')
  public image!: Image;
}

@Table('posts')
class Post extends Model {
  @PrimaryKey()
  public id!: number;
  
  @MorphOneRelation(() => Image, 'imageable')
  public image!: Image;
}
```

### One-to-Many polymorphique

```typescript
import { Model, Table, Column, PrimaryKey, MorphManyRelation } from 'teloquent';

@Table('comments')
class Comment extends Model {
  @PrimaryKey()
  public id!: number;
  
  @Column()
  public content!: string;
  
  @Column()
  public commentable_id!: number;
  
  @Column()
  public commentable_type!: string;
}

@Table('posts')
class Post extends Model {
  @PrimaryKey()
  public id!: number;
  
  @MorphManyRelation(() => Comment, 'commentable')
  public comments!: Comment[];
}

@Table('videos')
class Video extends Model {
  @PrimaryKey()
  public id!: number;
  
  @MorphManyRelation(() => Comment, 'commentable')
  public comments!: Comment[];
}
```

### Many-to-Many polymorphique

```typescript
import { Model, Table, Column, PrimaryKey, MorphToManyRelation } from 'teloquent';

@Table('tags')
class Tag extends Model {
  @PrimaryKey()
  public id!: number;
  
  @Column()
  public name!: string;
  
  @MorphToManyRelation(() => Post, 'taggable', 'taggables')
  public posts!: Post[];
  
  @MorphToManyRelation(() => Video, 'taggable', 'taggables')
  public videos!: Video[];
}

@Table('posts')
class Post extends Model {
  @PrimaryKey()
  public id!: number;
  
  @MorphToManyRelation(() => Tag, 'taggable', 'taggables')
  public tags!: Tag[];
}
```

## Bonnes pratiques

### Éviter le problème N+1

Le problème N+1 se produit lorsque vous chargez un ensemble de modèles, puis exécutez une requête supplémentaire pour chaque modèle pour charger ses relations. Pour éviter cela, utilisez toujours le chargement anticipé (`with`) lorsque vous savez que vous aurez besoin des relations.

```typescript
// Mauvais (problème N+1)
const posts = await Post.all();
for (const post of posts) {
  const user = await post.user; // Une requête par post
  console.log(user.name);
}

// Bon (chargement anticipé)
const posts = await Post.query().with('user').get();
posts.each(post => {
  console.log(post.user.name); // Pas de requête supplémentaire
});
```

### Utilisation des collections

Les relations qui retournent plusieurs modèles (HasMany, BelongsToMany) retournent des instances de `Collection`, qui offrent de nombreuses méthodes utiles pour manipuler les données.

```typescript
const user = await User.query().with('posts').first();

// Filtrer les posts
const publishedPosts = user.posts.filter(post => post.published);

// Trier les posts
const sortedPosts = user.posts.sortBy('created_at');

// Grouper les posts par catégorie
const postsByCategory = user.posts.groupBy('category');
```

Pour plus d'informations sur les Collections, consultez la [documentation des Collections](./collections.md).
