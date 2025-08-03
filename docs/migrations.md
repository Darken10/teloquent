# Migrations

Les migrations dans Teloquent permettent de gérer l'évolution du schéma de votre base de données de manière structurée et contrôlée. Elles fonctionnent comme un système de contrôle de version pour votre base de données, permettant à votre équipe de modifier et de partager facilement le schéma de la base de données.

## Concepts de base

Une migration est un fichier qui contient deux méthodes principales :
- `up()` : Définit les modifications à apporter au schéma (création de tables, ajout de colonnes, etc.)
- `down()` : Définit comment annuler ces modifications (suppression de tables, suppression de colonnes, etc.)

## Création de migrations

### Via la CLI

La façon la plus simple de créer une migration est d'utiliser la CLI de Teloquent :

```bash
npx teloquent make:migration create_users_table
```

Cela générera un fichier de migration dans le répertoire des migrations (par défaut `./migrations`) avec un timestamp comme préfixe, par exemple : `20230101000000_create_users_table.ts`.

### Manuellement

Vous pouvez également créer manuellement un fichier de migration :

```typescript
// migrations/20230101000000_create_users_table.ts
import { Migration } from 'teloquent';

export default class CreateUsersTable extends Migration {
  public async up(): Promise<void> {
    await this.schema.createTable('users', table => {
      table.increments('id');
      table.string('name');
      table.string('email').unique();
      table.string('password');
      table.timestamps();
    });
  }

  public async down(): Promise<void> {
    await this.schema.dropTable('users');
  }
}
```

## Structure d'une migration

Chaque migration étend la classe `Migration` et doit implémenter les méthodes `up()` et `down()`.

```typescript
import { Migration } from 'teloquent';

export default class MyMigration extends Migration {
  public async up(): Promise<void> {
    // Modifications à apporter au schéma
  }

  public async down(): Promise<void> {
    // Comment annuler ces modifications
  }
}
```

## SchemaBuilder

Le SchemaBuilder est accessible via la propriété `schema` de la classe `Migration`. Il offre une API fluide pour définir le schéma de votre base de données.

### Création de tables

```typescript
await this.schema.createTable('users', table => {
  table.increments('id');
  table.string('name', 100).nullable();
  table.string('email').unique();
  table.timestamps();
});
```

### Modification de tables

```typescript
await this.schema.table('users', table => {
  table.string('phone').nullable();
  table.boolean('active').default(true);
});
```

### Suppression de tables

```typescript
await this.schema.dropTable('users');

// Suppression si existe
await this.schema.dropTableIfExists('users');
```

### Renommer des tables

```typescript
await this.schema.renameTable('users', 'app_users');
```

## Types de colonnes

Le SchemaBuilder prend en charge de nombreux types de colonnes :

### Colonnes numériques

```typescript
// Auto-increment
table.increments('id'); // INTEGER PRIMARY KEY AUTO_INCREMENT
table.bigIncrements('id'); // BIGINT PRIMARY KEY AUTO_INCREMENT

// Entiers
table.integer('votes'); // INTEGER
table.bigInteger('big_number'); // BIGINT
table.tinyInteger('small_number'); // TINYINT
table.smallInteger('medium_number'); // SMALLINT
table.mediumInteger('medium_number'); // MEDIUMINT (MySQL)

// Décimaux
table.decimal('amount', 8, 2); // DECIMAL(8,2)
table.float('height'); // FLOAT
table.double('size'); // DOUBLE
```

### Colonnes de texte

```typescript
table.string('name', 100); // VARCHAR(100)
table.text('description'); // TEXT
table.mediumText('medium_description'); // MEDIUMTEXT (MySQL)
table.longText('long_description'); // LONGTEXT (MySQL)
table.char('code', 4); // CHAR(4)
```

### Colonnes de date et heure

```typescript
table.date('birth_date'); // DATE
table.time('appointment'); // TIME
table.dateTime('created_at'); // DATETIME
table.timestamp('logged_at'); // TIMESTAMP
table.timestamps(); // created_at et updated_at
table.timestamp('deleted_at').nullable(); // Pour soft deletes
```

### Colonnes booléennes et binaires

```typescript
table.boolean('active'); // BOOLEAN
table.binary('data'); // BLOB
```

### Colonnes JSON

```typescript
table.json('preferences'); // JSON
table.jsonb('settings'); // JSONB (PostgreSQL)
```

### Colonnes d'énumération

```typescript
table.enum('status', ['pending', 'active', 'cancelled']); // ENUM
```

## Modificateurs de colonnes

Vous pouvez chaîner des modificateurs pour personnaliser les colonnes :

```typescript
// Nullable
table.string('middle_name').nullable();

// Valeur par défaut
table.boolean('active').default(true);
table.dateTime('created_at').defaultTo(this.schema.fn.now());

// Unique
table.string('email').unique();

// Index
table.string('slug').index();

// Commentaire
table.string('code').comment('Product unique code');

// Après une autre colonne (MySQL)
table.string('last_name').after('first_name');
```

## Clés primaires et étrangères

### Clés primaires

```typescript
// Auto-increment primary key
table.increments('id');

// Clé primaire composite
table.primary(['user_id', 'role_id']);
```

### Clés étrangères

```typescript
// Clé étrangère simple
table.integer('user_id').unsigned();
table.foreign('user_id').references('id').inTable('users');

// Avec actions ON DELETE / ON UPDATE
table.integer('user_id').unsigned();
table.foreign('user_id')
  .references('id')
  .inTable('users')
  .onDelete('CASCADE')
  .onUpdate('CASCADE');

// Clé étrangère avec nom personnalisé
table.integer('user_id').unsigned();
table.foreign('user_id', 'fk_user_id')
  .references('id')
  .inTable('users');
```

## Index

```typescript
// Index simple
table.string('email').index();

// Index nommé
table.index('email', 'idx_email');

// Index composite
table.index(['first_name', 'last_name'], 'idx_full_name');

// Index unique
table.unique('email');
table.unique(['account_id', 'slug']);

// Index fulltext (MySQL)
table.text('description');
table.fulltext('description');
```

## Exécution des migrations

### Via la CLI

```bash
# Exécuter toutes les migrations en attente
npx teloquent migrate

# Annuler la dernière migration
npx teloquent migrate:rollback

# Annuler toutes les migrations
npx teloquent migrate:reset

# Annuler toutes les migrations et les réexécuter
npx teloquent migrate:refresh

# Vérifier l'état des migrations
npx teloquent migrate:status
```

### Programmatiquement

```typescript
import { Migrator } from 'teloquent';
import { knex } from 'knex';

const db = knex({
  client: 'mysql',
  connection: {
    // configuration de connexion
  }
});

const migrator = new Migrator(db, {
  directory: './migrations',
  tableName: 'migrations'
});

// Exécuter les migrations
await migrator.up();

// Annuler la dernière migration
await migrator.down();

// Annuler toutes les migrations
await migrator.reset();

// Vérifier l'état des migrations
const status = await migrator.status();
```

## Exemples de migrations

### Création d'une table d'utilisateurs

```typescript
import { Migration } from 'teloquent';

export default class CreateUsersTable extends Migration {
  public async up(): Promise<void> {
    await this.schema.createTable('users', table => {
      table.increments('id');
      table.string('name');
      table.string('email').unique();
      table.string('password');
      table.boolean('active').default(true);
      table.timestamp('email_verified_at').nullable();
      table.timestamps();
    });
  }

  public async down(): Promise<void> {
    await this.schema.dropTable('users');
  }
}
```

### Création d'une table de posts avec clé étrangère

```typescript
import { Migration } from 'teloquent';

export default class CreatePostsTable extends Migration {
  public async up(): Promise<void> {
    await this.schema.createTable('posts', table => {
      table.increments('id');
      table.string('title');
      table.text('content');
      table.integer('user_id').unsigned();
      table.foreign('user_id')
        .references('id')
        .inTable('users')
        .onDelete('CASCADE');
      table.boolean('published').default(false);
      table.timestamps();
      table.timestamp('deleted_at').nullable();
    });
  }

  public async down(): Promise<void> {
    await this.schema.dropTable('posts');
  }
}
```

### Table pivot pour relation many-to-many

```typescript
import { Migration } from 'teloquent';

export default class CreateUserRolesTable extends Migration {
  public async up(): Promise<void> {
    await this.schema.createTable('user_roles', table => {
      table.integer('user_id').unsigned();
      table.integer('role_id').unsigned();
      table.primary(['user_id', 'role_id']);
      table.foreign('user_id')
        .references('id')
        .inTable('users')
        .onDelete('CASCADE');
      table.foreign('role_id')
        .references('id')
        .inTable('roles')
        .onDelete('CASCADE');
      table.timestamp('created_at').defaultTo(this.schema.fn.now());
    });
  }

  public async down(): Promise<void> {
    await this.schema.dropTable('user_roles');
  }
}
```

### Ajout de colonnes à une table existante

```typescript
import { Migration } from 'teloquent';

export default class AddPhoneToUsersTable extends Migration {
  public async up(): Promise<void> {
    await this.schema.table('users', table => {
      table.string('phone').nullable();
      table.string('address').nullable();
    });
  }

  public async down(): Promise<void> {
    await this.schema.table('users', table => {
      table.dropColumn('phone');
      table.dropColumn('address');
    });
  }
}
```

### Modification de colonnes

```typescript
import { Migration } from 'teloquent';

export default class ChangePostContentColumn extends Migration {
  public async up(): Promise<void> {
    await this.schema.table('posts', table => {
      // Modifier le type de colonne (selon le SGBD, peut nécessiter une approche différente)
      table.longText('content').alter();
    });
  }

  public async down(): Promise<void> {
    await this.schema.table('posts', table => {
      table.text('content').alter();
    });
  }
}
```

## Bonnes pratiques

### Nommage des migrations

Suivez une convention de nommage cohérente pour vos migrations :
- `create_table_name_table` pour la création de tables
- `add_column_to_table_name` pour l'ajout de colonnes
- `remove_column_from_table_name` pour la suppression de colonnes
- `change_column_in_table_name` pour la modification de colonnes

### Idempotence

Assurez-vous que vos migrations sont idempotentes, c'est-à-dire qu'elles peuvent être exécutées plusieurs fois sans erreur :

```typescript
// Bon (vérifie si la table existe avant de la créer)
if (!(await this.schema.hasTable('users'))) {
  await this.schema.createTable('users', table => {
    // ...
  });
}

// Bon (vérifie si la colonne existe avant de l'ajouter)
await this.schema.table('users', table => {
  if (!(await this.schema.hasColumn('users', 'phone'))) {
    table.string('phone').nullable();
  }
});
```

### Tests

Testez vos migrations dans un environnement de développement avant de les déployer en production. Assurez-vous que les méthodes `up()` et `down()` fonctionnent correctement.

### Transactions

Les migrations sont exécutées dans des transactions par défaut, mais vous pouvez désactiver ce comportement si nécessaire :

```typescript
export default class MyMigration extends Migration {
  public useTransaction = false;

  public async up(): Promise<void> {
    // ...
  }

  public async down(): Promise<void> {
    // ...
  }
}
```

## Migrations et modèles

Il est recommandé de garder vos migrations et vos modèles synchronisés. Lorsque vous modifiez un modèle (ajout d'une colonne, modification d'une relation), créez une migration correspondante.

```typescript
// Modèle
@Table('users')
class User extends Model {
  @PrimaryKey()
  public id!: number;
  
  @Column()
  public name!: string;
  
  @Column()
  public email!: string;
  
  @Column({ nullable: true })
  public phone?: string; // Nouvelle colonne
}

// Migration correspondante
export default class AddPhoneToUsersTable extends Migration {
  public async up(): Promise<void> {
    await this.schema.table('users', table => {
      table.string('phone').nullable();
    });
  }

  public async down(): Promise<void> {
    await this.schema.table('users', table => {
      table.dropColumn('phone');
    });
  }
}
```
