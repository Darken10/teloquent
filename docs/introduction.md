# Introduction à Teloquent

## Qu'est-ce que Teloquent ?

Teloquent est un ORM (Object-Relational Mapping) pour TypeScript inspiré de Laravel Eloquent. Il offre une API fluide et entièrement typée pour interagir avec votre base de données relationnelle. Teloquent combine la puissance du typage statique de TypeScript avec l'élégance et l'expressivité d'Eloquent.

## Caractéristiques principales

- **Typage fort** : Profitez du système de types de TypeScript pour éviter les erreurs à l'exécution
- **API fluide** : Interface chainable et intuitive pour construire des requêtes
- **Décorateurs** : Utilisez les décorateurs TypeScript pour définir vos modèles et relations
- **Active Record** : Chaque modèle représente une table et une instance représente une ligne
- **Relations** : Support complet pour les relations One-to-One, One-to-Many, Many-to-One et Many-to-Many
- **Collections** : Manipulez facilement des ensembles de modèles avec l'API de Collections
- **Migrations** : Gérez l'évolution de votre schéma de base de données
- **CLI** : Outils en ligne de commande pour générer des modèles, migrations, etc.

## Installation

### Prérequis

- Node.js (v14 ou supérieur)
- TypeScript (v4.5 ou supérieur)
- Une base de données supportée (MySQL, PostgreSQL, SQLite, MSSQL)

### Installation via NPM

```bash
npm install teloquent knex --save
```

### Installation via Yarn

```bash
yarn add teloquent knex
```

## Configuration

### Configuration de base

Créez un fichier de configuration pour votre base de données :

```typescript
// database.ts
import { Model } from 'teloquent';

Model.setConnection({
  client: 'mysql',
  connection: {
    host: 'localhost',
    user: 'root',
    password: 'password',
    database: 'my_database'
  }
});
```

### Configuration avancée

Pour des configurations plus avancées, vous pouvez spécifier des options supplémentaires :

```typescript
import { Model } from 'teloquent';

Model.setConnection({
  client: 'mysql',
  connection: {
    host: 'localhost',
    user: 'root',
    password: 'password',
    database: 'my_database'
  },
  pool: {
    min: 2,
    max: 10
  },
  debug: process.env.NODE_ENV === 'development',
  migrations: {
    tableName: 'migrations',
    directory: './migrations'
  }
});
```

### Configurations multiples

Vous pouvez configurer plusieurs connexions et les utiliser selon vos besoins :

```typescript
import { Model, Connection } from 'teloquent';

// Connexion par défaut
Model.setConnection({
  client: 'mysql',
  connection: {
    host: 'localhost',
    user: 'root',
    password: 'password',
    database: 'my_database'
  }
}, 'default');

// Connexion secondaire
Connection.addConnection({
  client: 'postgres',
  connection: {
    host: 'localhost',
    user: 'postgres',
    password: 'password',
    database: 'analytics'
  }
}, 'analytics');

// Utilisation d'une connexion spécifique dans un modèle
class User extends Model {
  public static connection = 'default';
}

class Analytics extends Model {
  public static connection = 'analytics';
}
```

## Premier pas avec Teloquent

### Création d'un modèle simple

```typescript
import { Model, Table, Column, PrimaryKey, Timestamps } from 'teloquent';

@Table('users')
@Timestamps()
class User extends Model {
  @PrimaryKey()
  public id!: number;
  
  @Column()
  public name!: string;
  
  @Column()
  public email!: string;
  
  @Column()
  public password!: string;
}
```

### Utilisation de base

```typescript
// Créer un nouvel utilisateur
const user = new User();
user.name = 'John Doe';
user.email = 'john@example.com';
user.password = 'password123';
await user.save();

// Récupérer tous les utilisateurs
const users = await User.all();

// Requête avec conditions
const activeUsers = await User.query()
  .where('active', true)
  .get();

// Trouver par ID
const user = await User.find(1);

// Mettre à jour
user.name = 'Jane Doe';
await user.save();

// Supprimer
await user.delete();
```

## Structure du projet recommandée

Pour un projet Teloquent bien organisé, nous recommandons la structure suivante :

```
my-project/
├── src/
│   ├── models/
│   │   ├── User.ts
│   │   ├── Post.ts
│   │   └── ...
│   ├── migrations/
│   │   ├── 20230101000000_create_users_table.ts
│   │   ├── 20230101000001_create_posts_table.ts
│   │   └── ...
│   ├── database.ts
│   └── index.ts
├── package.json
└── tsconfig.json
```

## Prochaines étapes

Maintenant que vous avez configuré Teloquent et créé votre premier modèle, vous pouvez explorer les fonctionnalités plus avancées :

- [Modèles et attributs](./models.md)
- [Relations entre modèles](./relations.md)
- [Requêtes avec QueryBuilder](./query-builder.md)
- [Collections](./collections.md)
- [Migrations](./migrations.md)
