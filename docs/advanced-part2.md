# Fonctionnalités avancées (Suite)

## Gestion des connexions multiples

Teloquent vous permet de travailler avec plusieurs connexions de base de données simultanément.

### Configuration des connexions multiples

```typescript
import { Model, Connection } from 'teloquent';

// Connexion par défaut
Model.setConnection({
  client: 'mysql',
  connection: {
    host: 'localhost',
    user: 'root',
    password: 'password',
    database: 'app_db'
  }
}, 'default');

// Connexion secondaire
Connection.addConnection({
  client: 'postgres',
  connection: {
    host: 'analytics-server',
    user: 'postgres',
    password: 'password',
    database: 'analytics_db'
  }
}, 'analytics');
```

### Utilisation de connexions spécifiques dans les modèles

```typescript
import { Model, Table } from 'teloquent';

@Table('users')
class User extends Model {
  // Utiliser la connexion par défaut
  public static connection = 'default';
}

@Table('metrics')
class Metric extends Model {
  // Utiliser la connexion analytics
  public static connection = 'analytics';
}
```

### Changement dynamique de connexion

```typescript
import { Model, DB } from 'teloquent';

// Changer la connexion pour une requête spécifique
const users = await User.query()
  .connection('analytics')
  .where('active', true)
  .get();

// Utiliser DB avec une connexion spécifique
const results = await DB.connection('analytics')
  .table('metrics')
  .where('date', '>', '2023-01-01')
  .get();
```

### Réplication et lecture/écriture séparées

```typescript
import { Model, Connection } from 'teloquent';

// Configuration avec réplication
Connection.addConnection({
  client: 'mysql',
  connection: {
    host: 'master-db',
    user: 'root',
    password: 'password',
    database: 'app_db'
  },
  replicas: [
    {
      host: 'replica-db-1',
      user: 'readonly',
      password: 'password',
      database: 'app_db'
    },
    {
      host: 'replica-db-2',
      user: 'readonly',
      password: 'password',
      database: 'app_db'
    }
  ]
}, 'replicated');

// Forcer l'utilisation du maître
const users = await User.query()
  .connection('replicated')
  .useWriteConnection()
  .get();
```

## Polymorphisme

Le polymorphisme permet à un modèle d'appartenir à plusieurs types de modèles différents.

### Relations polymorphiques One-to-One

```typescript
import { Model, Table, Column, PrimaryKey, MorphOneRelation, MorphToRelation } from 'teloquent';

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
  
  @MorphToRelation('imageable')
  public imageable!: User | Post; // Peut être un User ou un Post
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

### Relations polymorphiques One-to-Many

```typescript
import { Model, Table, Column, PrimaryKey, MorphManyRelation, MorphToRelation } from 'teloquent';

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
  
  @MorphToRelation('commentable')
  public commentable!: Post | Video;
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

### Relations polymorphiques Many-to-Many

```typescript
import { Model, Table, Column, PrimaryKey, MorphToManyRelation, MorphedByManyRelation } from 'teloquent';

@Table('tags')
class Tag extends Model {
  @PrimaryKey()
  public id!: number;
  
  @Column()
  public name!: string;
  
  @MorphedByManyRelation(() => Post, 'taggable', 'taggables')
  public posts!: Post[];
  
  @MorphedByManyRelation(() => Video, 'taggable', 'taggables')
  public videos!: Video[];
}

@Table('posts')
class Post extends Model {
  @PrimaryKey()
  public id!: number;
  
  @MorphToManyRelation(() => Tag, 'taggable', 'taggables')
  public tags!: Tag[];
}

@Table('videos')
class Video extends Model {
  @PrimaryKey()
  public id!: number;
  
  @MorphToManyRelation(() => Tag, 'taggable', 'taggables')
  public tags!: Tag[];
}
```

### Utilisation des relations polymorphiques

```typescript
// Créer une relation polymorphique
const post = await Post.find(1);
const comment = new Comment({ content: 'Great post!' });
await post.comments().save(comment);

// Récupérer le parent polymorphique
const comment = await Comment.find(1);
const commentable = await comment.commentable; // Post ou Video

// Vérifier le type
if (commentable instanceof Post) {
  console.log('Commentaire sur un post');
} else if (commentable instanceof Video) {
  console.log('Commentaire sur une vidéo');
}
```

## Soft Deletes avancés

Les soft deletes permettent de "supprimer" des enregistrements sans les retirer réellement de la base de données.

### Configuration avancée

```typescript
import { Model, Table, SoftDeletes } from 'teloquent';

@Table('users')
@SoftDeletes({
  column: 'deleted_at', // Colonne par défaut
  cascadeDeletes: true, // Supprimer en cascade
  clearRelations: ['posts', 'comments'] // Relations à effacer
})
class User extends Model {
  // ...
}
```

### Requêtes avec soft deletes

```typescript
// Inclure les enregistrements soft deleted
const allUsers = await User.query()
  .withTrashed()
  .get();

// Uniquement les enregistrements soft deleted
const deletedUsers = await User.query()
  .onlyTrashed()
  .get();

// Restaurer les enregistrements soft deleted
await User.query()
  .where('id', 1)
  .restore();

// Supprimer définitivement
await User.query()
  .where('id', 1)
  .forceDelete();
```

### Soft deletes avec relations

```typescript
// Soft delete en cascade
const user = await User.find(1);
await user.delete(); // Supprime également les posts et commentaires associés

// Restauration en cascade
await user.restore({ cascade: true });
```

## Gestion de cache

Teloquent offre un système de cache intégré pour améliorer les performances des requêtes fréquentes.

### Configuration du cache

```typescript
import { Cache } from 'teloquent';

// Configuration du cache
Cache.setConfig({
  driver: 'redis', // redis, memcached, file, memory
  connection: {
    host: 'localhost',
    port: 6379
  },
  prefix: 'teloquent:',
  ttl: 3600 // Durée de vie en secondes
});
```

### Mise en cache des requêtes

```typescript
// Mettre en cache une requête pour 60 secondes
const users = await User.query()
  .where('active', true)
  .cache(60)
  .get();

// Mettre en cache avec une clé personnalisée
const activeUsers = await User.query()
  .where('active', true)
  .cache('active_users', 3600)
  .get();

// Mettre en cache les résultats d'une relation
const user = await User.query()
  .with(['posts' => query => query.cache(60)])
  .first();
```

### Invalidation du cache

```typescript
import { Cache } from 'teloquent';

// Invalider une clé spécifique
await Cache.forget('active_users');

// Invalider plusieurs clés
await Cache.forget(['active_users', 'admin_users']);

// Invalider toutes les clés liées à un modèle
await Cache.forgetModel(User);

// Invalider tout le cache
await Cache.flush();
```

### Cache automatique avec tags

```typescript
// Mettre en cache avec des tags
const users = await User.query()
  .cacheTags(['users', 'active'])
  .cache(60)
  .get();

// Invalider par tag
await Cache.forgetTag('users');
```

## Optimisation des performances

### Eager loading efficace

```typescript
// Charger uniquement les colonnes nécessaires
const users = await User.query()
  .select('id', 'name', 'email')
  .with('posts', query => query.select('id', 'title', 'user_id'))
  .get();

// Limiter le nombre de relations chargées
const users = await User.query()
  .with('posts', query => query.limit(5).orderBy('created_at', 'desc'))
  .get();

// Charger les relations avec conditions
const users = await User.query()
  .with('posts', query => query.where('published', true))
  .get();
```

### Chunking pour les grandes quantités de données

```typescript
// Traiter les utilisateurs par lots de 100
await User.query().chunk(100, async (users, page) => {
  console.log(`Traitement du lot ${page}`);
  for (const user of users) {
    await processUser(user);
  }
});

// Chunking avec condition
await User.query()
  .where('active', true)
  .chunk(100, async (users) => {
    // Traitement par lot
  });
```

### Lazy collections pour l'efficacité mémoire

```typescript
// Utiliser un curseur pour traiter de grandes quantités de données
const cursor = User.query().cursor();

for await (const user of cursor) {
  await processUser(user);
}
```

### Requêtes optimisées

```typescript
// Utiliser des index
const users = await User.query()
  .where('email', 'john@example.com') // Supposons que email est indexé
  .first();

// Éviter les sous-requêtes inutiles
const count = await User.query().count();

// Utiliser des jointures au lieu de requêtes séparées
const posts = await Post.query()
  .join('users', 'posts.user_id', '=', 'users.id')
  .select('posts.*', 'users.name as author_name')
  .where('users.active', true)
  .get();
```

## Tests

### Configuration des tests

```typescript
import { Model, Connection } from 'teloquent';

// Avant les tests
beforeAll(async () => {
  // Configurer une connexion de test
  Model.setConnection({
    client: 'sqlite',
    connection: {
      filename: ':memory:'
    },
    useNullAsDefault: true
  }, 'testing');
  
  // Exécuter les migrations
  await runMigrations();
});

// Après chaque test
afterEach(async () => {
  // Nettoyer la base de données
  await truncateTables();
});

// Après tous les tests
afterAll(async () => {
  // Fermer la connexion
  await Connection.close('testing');
});
```

### Tests de modèles

```typescript
import User from '../models/User';

test('Créer un utilisateur', async () => {
  const user = await User.create({
    name: 'John Doe',
    email: 'john@example.com'
  });
  
  expect(user.id).toBeDefined();
  expect(user.name).toBe('John Doe');
});

test('Mettre à jour un utilisateur', async () => {
  const user = await User.create({
    name: 'John Doe',
    email: 'john@example.com'
  });
  
  user.name = 'Jane Doe';
  await user.save();
  
  const updatedUser = await User.find(user.id);
  expect(updatedUser.name).toBe('Jane Doe');
});
```

### Tests de relations

```typescript
import User from '../models/User';
import Post from '../models/Post';

test('Relation hasMany', async () => {
  const user = await User.create({
    name: 'John Doe',
    email: 'john@example.com'
  });
  
  await Post.create({
    title: 'First Post',
    content: 'Content',
    user_id: user.id
  });
  
  await Post.create({
    title: 'Second Post',
    content: 'Content',
    user_id: user.id
  });
  
  const posts = await user.posts;
  expect(posts).toHaveLength(2);
  expect(posts[0].title).toBe('First Post');
});
```

### Tests avec factories

```typescript
import { factory } from '../factories';

test('Créer des utilisateurs avec factory', async () => {
  // Créer un utilisateur
  const user = await factory.create('User');
  expect(user.id).toBeDefined();
  
  // Créer plusieurs utilisateurs
  const users = await factory.createMany('User', 5);
  expect(users).toHaveLength(5);
  
  // Créer avec des attributs spécifiques
  const admin = await factory.create('User', { role: 'admin' });
  expect(admin.role).toBe('admin');
});
```

## Extensibilité

### Macros pour QueryBuilder

```typescript
import { QueryBuilder } from 'teloquent';

// Ajouter une méthode personnalisée au QueryBuilder
QueryBuilder.macro('whereActive', function() {
  return this.where('active', true);
});

// Utilisation
const activeUsers = await User.query().whereActive().get();
```

### Extension de modèle

```typescript
import { Model } from 'teloquent';

// Ajouter une méthode à tous les modèles
Model.extend('archive', async function() {
  this.archived_at = new Date();
  await this.save();
});

// Utilisation
const user = await User.find(1);
await user.archive();
```

### Plugins

```typescript
import { Plugin, Model } from 'teloquent';

// Créer un plugin
class AuditPlugin implements Plugin {
  public register(): void {
    // Ajouter un hook à tous les modèles
    Model.hook('saving', async (model: Model) => {
      if (model.isDirty()) {
        await this.logChanges(model);
      }
    });
  }
  
  private async logChanges(model: Model): Promise<void> {
    const changes = model.getDirty();
    await AuditLog.create({
      model_type: model.constructor.name,
      model_id: model.id,
      changes: JSON.stringify(changes),
      user_id: getCurrentUserId()
    });
  }
}

// Enregistrer le plugin
import { Teloquent } from 'teloquent';
Teloquent.use(new AuditPlugin());
```

### Services personnalisés

```typescript
import { Service } from 'teloquent';
import User from './models/User';

class UserService extends Service {
  public async register(data: {
    name: string;
    email: string;
    password: string;
  }): Promise<User> {
    const user = await User.create({
      name: data.name,
      email: data.email,
      password: hashPassword(data.password)
    });
    
    await this.sendWelcomeEmail(user);
    
    return user;
  }
  
  private async sendWelcomeEmail(user: User): Promise<void> {
    // Logique d'envoi d'email
  }
}

// Utilisation
const userService = new UserService();
const user = await userService.register({
  name: 'John Doe',
  email: 'john@example.com',
  password: 'password123'
});
```
