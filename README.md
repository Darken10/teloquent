# Teloquent ORM

Un ORM (Object-Relational Mapping) élégant et puissant pour TypeScript, inspiré par Eloquent de Laravel.

## Caractéristiques

- 🔄 **Pattern Active Record** - Chaque modèle contient sa logique de persistance
- 🔍 **Entièrement typé** - Support TypeScript complet avec inférence de type
- 🧩 **Relations** - Support pour hasOne, hasMany, belongsTo, belongsToMany
- 📦 **Eager loading** - Chargement optimisé des relations
- 🔄 **Query Builder fluide** - API intuitive pour construire des requêtes
- 🗄️ **Migrations** - Système de migration basé sur Knex.js
- 🎭 **Décorateurs** - Définition élégante des modèles avec des décorateurs TypeScript
- 🗑️ **Soft Delete** - Suppression douce des enregistrements
- 🔄 **Timestamps** - Gestion automatique des timestamps
- 🧪 **Tests** - Facilement testable
- 🛠️ **CLI** - Outils en ligne de commande pour les migrations, seeders et génération de modèles

## Installation

```bash
npm install teloquent
# ou
yarn add teloquent
```

## Prérequis

- Node.js 14+
- TypeScript 4.5+
- Une base de données supportée (PostgreSQL, MySQL ou SQLite)

## Configuration

### Configuration de la base de données

Créez un fichier `knexfile.ts` à la racine de votre projet :

```typescript
import dotenv from 'dotenv';
import { Knex } from 'knex';

// Charger les variables d'environnement
dotenv.config();

// Configuration par défaut
const defaultConfig: Knex.Config = {
  client: process.env.DB_CLIENT || 'pg',
  connection: {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 5432,
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'teloquent'
  },
  pool: {
    min: 2,
    max: 10
  },
  migrations: {
    directory: './migrations',
    tableName: 'migrations'
  },
  seeds: {
    directory: './seeders'
  }
};

// Configuration pour différents environnements
const config: Record<string, Knex.Config> = {
  development: {
    ...defaultConfig
  },
  test: {
    ...defaultConfig,
    connection: {
      ...defaultConfig.connection as Knex.PgConnectionConfig,
      database: process.env.TEST_DB_NAME || 'teloquent_test'
    }
  },
  production: {
    ...defaultConfig,
    pool: {
      min: 5,
      max: 30
    }
  }
};

export default config;
```

### Fichier .env

Créez un fichier `.env` à la racine de votre projet :

```
DB_CLIENT=pg
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=teloquent
TEST_DB_NAME=teloquent_test
```

### Initialisation

Dans votre point d'entrée (par exemple `index.ts`), initialisez Teloquent :

```typescript
import { initialize } from 'teloquent';

// Initialiser la connexion à la base de données
initialize('development'); // ou 'production', 'test', etc.
```

## Utilisation

### Définition d'un modèle

```typescript
import { Model } from 'teloquent';
import { Table, PrimaryKey, Column, Timestamps } from 'teloquent/decorators';

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
}

export default User;
```

### Opérations CRUD

```typescript
// Créer
const user = await User.create({
  name: 'John Doe',
  email: 'john@example.com',
  password: 'password123'
});

// Lire
const allUsers = await User.all();
const user = await User.find(1);
const filteredUsers = await User.query().where('name', 'John').get();

// Mettre à jour
user.name = 'Jane Doe';
await user.save();

// Supprimer
await user.delete();
```

### Relations

#### Définition des relations

```typescript
import { Model } from 'teloquent';
import { Table, PrimaryKey, Column, Timestamps, HasManyRelation } from 'teloquent/decorators';
import { HasMany } from 'teloquent/relations';
import Post from './Post';

@Table('users')
@Timestamps()
export class User extends Model {
  @PrimaryKey()
  public id!: number;

  @Column({ nullable: false })
  public name!: string;

  @HasManyRelation(() => Post)
  public posts!: HasMany<Post>;
}
```

```typescript
import { Model } from 'teloquent';
import { Table, PrimaryKey, Column, Timestamps, BelongsToRelation } from 'teloquent/decorators';
import { BelongsTo } from 'teloquent/relations';
import User from './User';

@Table('posts')
@Timestamps()
export class Post extends Model {
  @PrimaryKey()
  public id!: number;

  @Column({ nullable: false })
  public title!: string;

  @Column({ nullable: false })
  public content!: string;

  @Column({ name: 'user_id', nullable: false })
  public userId!: number;

  @BelongsToRelation(() => User, { foreignKey: 'user_id' })
  public user!: BelongsTo<User>;
}
```

#### Utilisation des relations

```typescript
// Récupérer les posts d'un utilisateur
const posts = await user.posts.get();

// Créer un post pour un utilisateur
const post = await user.posts.create({
  title: 'Mon premier post',
  content: 'Contenu du post'
});

// Eager loading
const usersWithPosts = await User.query().with('posts').get();
```

### Query Builder

```typescript
// Requêtes simples
const users = await User.query()
  .where('name', 'like', '%John%')
  .orderBy('created_at', 'desc')
  .limit(10)
  .get();

// Requêtes complexes
const posts = await Post.query()
  .where('published', true)
  .orWhere(query => query.where('user_id', 1).where('title', 'like', '%important%'))
  .with('user')
  .orderBy('created_at', 'desc')
  .paginate(1, 20);
```

### Soft Delete

```typescript
// Activer le soft delete sur un modèle
@Table('posts')
@Timestamps()
@SoftDeletes()
export class Post extends Model {
  // ...
}

// Utilisation
await post.delete(); // Soft delete
await post.restore(); // Restaurer
await post.forceDelete(); // Suppression définitive

// Requêtes avec soft delete
const allPosts = await Post.query().withTrashed().get(); // Inclut les supprimés
const onlyTrashed = await Post.query().onlyTrashed().get(); // Seulement les supprimés
```

## Migrations

### Création d'une migration

```bash
npx teloquent make:migration create_users_table
```

### Exemple de migration

```typescript
import { Migration } from 'teloquent/migrations';
import { Schema } from 'teloquent/utils';

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
```

### Exécution des migrations

```bash
# Exécuter les migrations
npx teloquent migrate

# Annuler la dernière batch de migrations
npx teloquent rollback

# Réinitialiser toutes les migrations
npx teloquent migrate:reset

# Rafraîchir les migrations (reset + migrate)
npx teloquent migrate:refresh
```

## CLI

Teloquent inclut une CLI pour faciliter le développement :

```bash
# Initialiser un nouveau projet
npx teloquent init

# Créer une migration
npx teloquent make:migration create_users_table

# Créer un modèle
npx teloquent make:model User

# Créer un modèle avec une migration
npx teloquent make:model User --migration

# Créer un seeder
npx teloquent make:seeder UserSeeder

# Exécuter les seeders
npx teloquent db:seed
```

## Exemples

Consultez le dossier `examples` pour des exemples complets d'utilisation de Teloquent.

## Licence

MIT
