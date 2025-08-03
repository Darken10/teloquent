# Exemples d'utilisation

Cette section présente des exemples concrets d'utilisation de Teloquent dans différents scénarios pour vous aider à comprendre comment implémenter l'ORM dans vos projets.

## Table des matières

- [Configuration de base](#configuration-de-base)
- [Modèles simples](#modèles-simples)
- [Relations entre modèles](#relations-entre-modèles)
- [Requêtes avancées](#requêtes-avancées)
- [Utilisation des collections](#utilisation-des-collections)
- [Migrations et schéma](#migrations-et-schéma)
- [Application complète](#application-complète)

## Configuration de base

### Installation et configuration

Commencez par installer Teloquent et ses dépendances :

```bash
npm install teloquent knex --save
```

Créez un fichier de configuration pour votre base de données :

```typescript
// src/database.ts
import { Model } from 'teloquent';
import dotenv from 'dotenv';

// Charger les variables d'environnement
dotenv.config();

// Configurer la connexion à la base de données
Model.setConnection({
  client: process.env.DB_CLIENT || 'mysql',
  connection: {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'teloquent_example'
  },
  debug: process.env.NODE_ENV === 'development'
});

// Exporter pour utilisation dans d'autres fichiers
export default Model;
```

### Structure du projet

Une structure de projet typique pour une application utilisant Teloquent :

```
my-project/
├── src/
│   ├── models/
│   │   ├── User.ts
│   │   ├── Post.ts
│   │   └── Comment.ts
│   ├── migrations/
│   │   ├── 20230101000000_create_users_table.ts
│   │   ├── 20230101000001_create_posts_table.ts
│   │   └── 20230101000002_create_comments_table.ts
│   ├── database.ts
│   └── index.ts
├── .env
├── package.json
└── tsconfig.json
```

## Modèles simples

### Modèle d'utilisateur

```typescript
// src/models/User.ts
import { Model, Table, Column, PrimaryKey, Timestamps, SoftDeletes } from 'teloquent';
import Post from './Post';
import Comment from './Comment';

@Table('users')
@Timestamps()
@SoftDeletes()
export default class User extends Model {
  @PrimaryKey()
  public id!: number;
  
  @Column()
  public name!: string;
  
  @Column()
  public email!: string;
  
  @Column()
  public password!: string;
  
  @Column({ nullable: true })
  public bio?: string;
  
  @Column({ default: false })
  public active!: boolean;
  
  @Column({ nullable: true })
  public email_verified_at?: Date;
  
  // Relations seront définies plus tard
}
```

### Utilisation de base

```typescript
// src/index.ts
import './database'; // Importer la configuration de la base de données
import User from './models/User';

async function main() {
  try {
    // Créer un utilisateur
    const user = new User();
    user.name = 'John Doe';
    user.email = 'john@example.com';
    user.password = 'password123';
    user.active = true;
    await user.save();
    
    console.log('Utilisateur créé:', user.toJSON());
    
    // Récupérer tous les utilisateurs
    const users = await User.all();
    console.log('Tous les utilisateurs:', users.toJSON());
    
    // Trouver un utilisateur par ID
    const foundUser = await User.find(1);
    if (foundUser) {
      console.log('Utilisateur trouvé:', foundUser.toJSON());
    }
    
    // Mettre à jour un utilisateur
    if (foundUser) {
      foundUser.name = 'Jane Doe';
      await foundUser.save();
      console.log('Utilisateur mis à jour:', foundUser.toJSON());
    }
    
    // Supprimer un utilisateur (soft delete)
    if (foundUser) {
      await foundUser.delete();
      console.log('Utilisateur supprimé (soft delete)');
    }
    
    // Récupérer les utilisateurs supprimés
    const deletedUsers = await User.query().onlyTrashed().get();
    console.log('Utilisateurs supprimés:', deletedUsers.toJSON());
    
    // Restaurer un utilisateur
    if (deletedUsers.length > 0) {
      await deletedUsers[0].restore();
      console.log('Utilisateur restauré:', deletedUsers[0].toJSON());
    }
  } catch (error) {
    console.error('Erreur:', error);
  }
}

main();
```

## Relations entre modèles

### Définition des modèles avec relations

```typescript
// src/models/User.ts (avec relations)
import { Model, Table, Column, PrimaryKey, Timestamps, SoftDeletes, HasManyRelation } from 'teloquent';
import Post from './Post';
import Comment from './Comment';

@Table('users')
@Timestamps()
@SoftDeletes()
export default class User extends Model {
  @PrimaryKey()
  public id!: number;
  
  @Column()
  public name!: string;
  
  @Column()
  public email!: string;
  
  @Column()
  public password!: string;
  
  @HasManyRelation(() => Post, 'user_id')
  public posts!: Post[];
  
  @HasManyRelation(() => Comment, 'user_id')
  public comments!: Comment[];
}

// src/models/Post.ts
import { Model, Table, Column, PrimaryKey, Timestamps, BelongsToRelation, HasManyRelation } from 'teloquent';
import User from './User';
import Comment from './Comment';

@Table('posts')
@Timestamps()
export default class Post extends Model {
  @PrimaryKey()
  public id!: number;
  
  @Column()
  public title!: string;
  
  @Column()
  public content!: string;
  
  @Column()
  public user_id!: number;
  
  @Column({ default: false })
  public published!: boolean;
  
  @BelongsToRelation(() => User, 'user_id')
  public user!: User;
  
  @HasManyRelation(() => Comment, 'post_id')
  public comments!: Comment[];
}

// src/models/Comment.ts
import { Model, Table, Column, PrimaryKey, Timestamps, BelongsToRelation } from 'teloquent';
import User from './User';
import Post from './Post';

@Table('comments')
@Timestamps()
export default class Comment extends Model {
  @PrimaryKey()
  public id!: number;
  
  @Column()
  public content!: string;
  
  @Column()
  public user_id!: number;
  
  @Column()
  public post_id!: number;
  
  @BelongsToRelation(() => User, 'user_id')
  public user!: User;
  
  @BelongsToRelation(() => Post, 'post_id')
  public post!: Post;
}
```

### Utilisation des relations

```typescript
// src/examples/relations.ts
import '../database';
import User from '../models/User';
import Post from '../models/Post';
import Comment from '../models/Comment';

async function relationExamples() {
  try {
    // Créer un utilisateur
    const user = await User.create({
      name: 'John Doe',
      email: 'john@example.com',
      password: 'password123'
    });
    
    // Créer un post pour cet utilisateur
    const post = new Post();
    post.title = 'Mon premier post';
    post.content = 'Contenu du post';
    post.user_id = user.id;
    await post.save();
    
    // Créer un commentaire
    const comment = new Comment();
    comment.content = 'Super post!';
    comment.user_id = user.id;
    comment.post_id = post.id;
    await comment.save();
    
    // Charger les relations
    const userWithPosts = await User.query()
      .with('posts')
      .where('id', user.id)
      .first();
    
    console.log('Utilisateur avec posts:', userWithPosts?.toJSON());
    
    // Charger des relations imbriquées
    const userWithPostsAndComments = await User.query()
      .with('posts.comments')
      .where('id', user.id)
      .first();
    
    console.log('Utilisateur avec posts et commentaires:', userWithPostsAndComments?.toJSON());
    
    // Charger des relations avec conditions
    const userWithPublishedPosts = await User.query()
      .with('posts', query => query.where('published', true))
      .where('id', user.id)
      .first();
    
    console.log('Utilisateur avec posts publiés:', userWithPublishedPosts?.toJSON());
    
    // Compter les relations
    const usersWithPostCount = await User.query()
      .withCount('posts')
      .get();
    
    console.log('Utilisateurs avec nombre de posts:', usersWithPostCount.toJSON());
    
    // Filtrer par relation
    const usersWithComments = await User.query()
      .whereHas('comments', query => query.where('created_at', '>', new Date(Date.now() - 86400000)))
      .get();
    
    console.log('Utilisateurs avec commentaires récents:', usersWithComments.toJSON());
  } catch (error) {
    console.error('Erreur:', error);
  }
}

relationExamples();
```

## Requêtes avancées

### Requêtes complexes

```typescript
// src/examples/queries.ts
import '../database';
import User from '../models/User';
import Post from '../models/Post';

async function queryExamples() {
  try {
    // Requête avec conditions multiples
    const activeUsers = await User.query()
      .where('active', true)
      .where(query => {
        query.where('role', 'admin')
          .orWhere('role', 'moderator');
      })
      .orderBy('name')
      .get();
    
    console.log('Utilisateurs actifs (admin ou moderator):', activeUsers.toJSON());
    
    // Requête avec jointure
    const postsWithAuthors = await Post.query()
      .join('users', 'posts.user_id', '=', 'users.id')
      .select('posts.*', 'users.name as author_name')
      .where('posts.published', true)
      .orderBy('posts.created_at', 'desc')
      .get();
    
    console.log('Posts publiés avec auteurs:', postsWithAuthors.toJSON());
    
    // Requête avec agrégation
    const postStats = await Post.query()
      .select('user_id')
      .selectRaw('COUNT(*) as post_count')
      .selectRaw('MAX(created_at) as last_post_date')
      .groupBy('user_id')
      .having('post_count', '>', 5)
      .orderBy('post_count', 'desc')
      .get();
    
    console.log('Statistiques des posts par utilisateur:', postStats.toJSON());
    
    // Requête avec sous-requête
    const popularAuthors = await User.query()
      .whereIn('id', query => {
        query.select('user_id')
          .from('posts')
          .groupBy('user_id')
          .havingRaw('COUNT(*) > 10');
      })
      .get();
    
    console.log('Auteurs populaires:', popularAuthors.toJSON());
    
    // Pagination
    const page = 1;
    const perPage = 10;
    const paginatedUsers = await User.query()
      .paginate(page, perPage);
    
    console.log('Utilisateurs paginés:', {
      data: paginatedUsers.data.toJSON(),
      total: paginatedUsers.total,
      current_page: paginatedUsers.current_page,
      last_page: paginatedUsers.last_page
    });
    
    // Chunking pour traiter de grandes quantités de données
    await User.query().chunk(100, async (users, page) => {
      console.log(`Traitement du lot ${page} (${users.length} utilisateurs)`);
      // Traitement par lot
    });
  } catch (error) {
    console.error('Erreur:', error);
  }
}

queryExamples();
```

### Transactions

```typescript
// src/examples/transactions.ts
import '../database';
import { DB } from 'teloquent';
import User from '../models/User';
import Post from '../models/Post';

async function transactionExamples() {
  try {
    // Transaction simple
    await DB.transaction(async (trx) => {
      const user = await User.query(trx).create({
        name: 'Jane Doe',
        email: 'jane@example.com',
        password: 'password123'
      });
      
      await Post.query(trx).insert([
        {
          title: 'Premier post de Jane',
          content: 'Contenu du post',
          user_id: user.id
        },
        {
          title: 'Deuxième post de Jane',
          content: 'Contenu du post',
          user_id: user.id
        }
      ]);
      
      console.log('Transaction réussie');
    });
    
    // Transaction avec gestion manuelle
    const trx = await DB.beginTransaction();
    
    try {
      const user = await User.query(trx).create({
        name: 'Bob Smith',
        email: 'bob@example.com',
        password: 'password123'
      });
      
      await Post.query(trx).insert({
        title: 'Post de Bob',
        content: 'Contenu du post',
        user_id: user.id
      });
      
      await trx.commit();
      console.log('Transaction manuelle réussie');
    } catch (error) {
      await trx.rollback();
      console.error('Transaction annulée:', error);
    }
  } catch (error) {
    console.error('Erreur:', error);
  }
}

transactionExamples();
```

## Utilisation des collections

### Manipulation de collections

```typescript
// src/examples/collections.ts
import '../database';
import User from '../models/User';

async function collectionExamples() {
  try {
    // Récupérer une collection d'utilisateurs
    const users = await User.all();
    
    // Filtrer la collection
    const activeUsers = users.filter(user => user.active);
    console.log('Utilisateurs actifs:', activeUsers.toJSON());
    
    // Mapper la collection
    const userNames = users.map(user => user.name);
    console.log('Noms des utilisateurs:', userNames);
    
    // Trier la collection
    const sortedUsers = users.sortBy('name');
    console.log('Utilisateurs triés par nom:', sortedUsers.toJSON());
    
    // Trier par une clé en ordre décroissant
    const newestUsers = users.sortByDesc('created_at');
    console.log('Utilisateurs les plus récents:', newestUsers.toJSON());
    
    // Grouper par une propriété
    const usersByActive = users.groupBy('active');
    console.log('Utilisateurs groupés par statut actif:', usersByActive);
    
    // Réduire la collection
    const totalPosts = users.reduce((total, user) => total + (user.posts_count || 0), 0);
    console.log('Nombre total de posts:', totalPosts);
    
    // Découper en chunks
    const chunks = users.chunk(3);
    console.log('Utilisateurs en chunks de 3:', chunks.toJSON());
    
    // Prendre les premiers éléments
    const firstThree = users.take(3);
    console.log('Trois premiers utilisateurs:', firstThree.toJSON());
    
    // Sauter des éléments
    const skipTwo = users.skip(2);
    console.log('Utilisateurs en sautant les 2 premiers:', skipTwo.toJSON());
    
    // Rechercher dans la collection
    const john = users.find(user => user.name.includes('John'));
    console.log('Utilisateur John:', john?.toJSON());
    
    // Vérifier si tous les éléments satisfont une condition
    const allHaveEmail = users.every(user => !!user.email);
    console.log('Tous les utilisateurs ont un email:', allHaveEmail);
    
    // Vérifier si au moins un élément satisfait une condition
    const anyAdmin = users.some(user => user.role === 'admin');
    console.log('Au moins un utilisateur est admin:', anyAdmin);
    
    // Obtenir une valeur unique d'une propriété
    const uniqueRoles = users.pluck('role').unique();
    console.log('Rôles uniques:', uniqueRoles);
    
    // Calculer la moyenne
    const avgAge = users.avg('age');
    console.log('Âge moyen:', avgAge);
    
    // Calculer la somme
    const totalAge = users.sum('age');
    console.log('Somme des âges:', totalAge);
    
    // Obtenir le min et max
    const minAge = users.min('age');
    const maxAge = users.max('age');
    console.log('Âge min:', minAge, 'Âge max:', maxAge);
  } catch (error) {
    console.error('Erreur:', error);
  }
}

collectionExamples();
```

### Collections et relations

```typescript
// src/examples/collection-relations.ts
import '../database';
import User from '../models/User';

async function collectionRelationsExamples() {
  try {
    // Charger les utilisateurs avec leurs posts
    const users = await User.query().with('posts').get();
    
    // Filtrer les utilisateurs qui ont au moins un post
    const activeAuthors = users.filter(user => user.posts.length > 0);
    console.log('Auteurs actifs:', activeAuthors.toJSON());
    
    // Obtenir tous les posts de tous les utilisateurs
    const allPosts = users.flatMap(user => user.posts);
    console.log('Tous les posts:', allPosts.toJSON());
    
    // Grouper les posts par utilisateur
    const postsByUser = users.mapWithKeys(user => [user.id, user.posts]);
    console.log('Posts par utilisateur:', postsByUser);
    
    // Calculer le nombre moyen de posts par utilisateur
    const avgPostsPerUser = users.avg(user => user.posts.length);
    console.log('Nombre moyen de posts par utilisateur:', avgPostsPerUser);
    
    // Trouver l'utilisateur avec le plus de posts
    const userWithMostPosts = users.sortByDesc(user => user.posts.length).first();
    console.log('Utilisateur avec le plus de posts:', userWithMostPosts?.toJSON());
    
    // Transformer les données pour un format spécifique
    const formattedUsers = users.map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      post_count: user.posts.length,
      latest_post: user.posts.length > 0 ? user.posts.sortByDesc('created_at').first() : null
    }));
    console.log('Utilisateurs formatés:', formattedUsers);
  } catch (error) {
    console.error('Erreur:', error);
  }
}

collectionRelationsExamples();
```

## Migrations et schéma

### Création de migrations

```typescript
// src/migrations/20230101000000_create_users_table.ts
import { Migration } from 'teloquent';

export default class CreateUsersTable extends Migration {
  public async up(): Promise<void> {
    await this.schema.createTable('users', table => {
      table.increments('id');
      table.string('name');
      table.string('email').unique();
      table.string('password');
      table.text('bio').nullable();
      table.boolean('active').default(true);
      table.timestamp('email_verified_at').nullable();
      table.timestamps();
      table.timestamp('deleted_at').nullable();
    });
  }

  public async down(): Promise<void> {
    await this.schema.dropTable('users');
  }
}

// src/migrations/20230101000001_create_posts_table.ts
import { Migration } from 'teloquent';

export default class CreatePostsTable extends Migration {
  public async up(): Promise<void> {
    await this.schema.createTable('posts', table => {
      table.increments('id');
      table.string('title');
      table.text('content');
      table.integer('user_id').unsigned();
      table.boolean('published').default(false);
      table.timestamps();
      
      table.foreign('user_id')
        .references('id')
        .inTable('users')
        .onDelete('CASCADE');
    });
  }

  public async down(): Promise<void> {
    await this.schema.dropTable('posts');
  }
}

// src/migrations/20230101000002_create_comments_table.ts
import { Migration } from 'teloquent';

export default class CreateCommentsTable extends Migration {
  public async up(): Promise<void> {
    await this.schema.createTable('comments', table => {
      table.increments('id');
      table.text('content');
      table.integer('user_id').unsigned();
      table.integer('post_id').unsigned();
      table.timestamps();
      
      table.foreign('user_id')
        .references('id')
        .inTable('users')
        .onDelete('CASCADE');
      
      table.foreign('post_id')
        .references('id')
        .inTable('posts')
        .onDelete('CASCADE');
    });
  }

  public async down(): Promise<void> {
    await this.schema.dropTable('comments');
  }
}
```

### Exécution des migrations

```typescript
// src/examples/run-migrations.ts
import { Migrator } from 'teloquent';
import { knex } from 'knex';
import path from 'path';

async function runMigrations() {
  try {
    // Configurer la connexion à la base de données
    const db = knex({
      client: 'mysql',
      connection: {
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'teloquent_example'
      }
    });
    
    // Créer une instance du Migrator
    const migrator = new Migrator(db, {
      directory: path.join(__dirname, '../migrations'),
      tableName: 'migrations'
    });
    
    // Exécuter les migrations
    console.log('Exécution des migrations...');
    const [batchNo, log] = await migrator.up();
    
    console.log(`Migrations exécutées (batch ${batchNo}):`);
    log.forEach(migration => {
      console.log(`- ${migration}`);
    });
    
    // Vérifier l'état des migrations
    const status = await migrator.status();
    console.log('État des migrations:');
    status.forEach(migration => {
      console.log(`- ${migration.name}: ${migration.batch ? 'Exécutée (batch ' + migration.batch + ')' : 'En attente'}`);
    });
    
    // Fermer la connexion
    await db.destroy();
  } catch (error) {
    console.error('Erreur lors de l\'exécution des migrations:', error);
  }
}

runMigrations();
```
