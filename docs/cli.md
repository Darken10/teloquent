# CLI (Command Line Interface)

Teloquent fournit une interface en ligne de commande (CLI) puissante pour vous aider à générer et gérer les composants de votre application. La CLI facilite la création de modèles, migrations, seeders et autres fichiers nécessaires à votre projet.

## Installation

La CLI de Teloquent est incluse dans le package principal. Vous pouvez l'utiliser via npx :

```bash
npx teloquent <commande>
```

Pour une utilisation plus pratique, vous pouvez ajouter un script dans votre `package.json` :

```json
{
  "scripts": {
    "teloquent": "teloquent"
  }
}
```

Puis l'utiliser avec :

```bash
npm run teloquent <commande>
```

## Configuration

Par défaut, la CLI cherche un fichier de configuration `teloquent.config.js` ou `teloquent.config.ts` à la racine de votre projet. Vous pouvez spécifier un chemin différent avec l'option `--config` :

```bash
npx teloquent --config=./config/teloquent.js <commande>
```

Exemple de fichier de configuration :

```typescript
// teloquent.config.ts
export default {
  // Répertoire des modèles
  modelsPath: './src/models',
  
  // Répertoire des migrations
  migrationsPath: './src/migrations',
  
  // Répertoire des seeders
  seedersPath: './src/seeders',
  
  // Configuration de la base de données
  connection: {
    client: 'mysql',
    connection: {
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'teloquent'
    }
  }
};
```

## Commandes disponibles

### Aide

Pour afficher l'aide générale :

```bash
npx teloquent --help
```

Pour afficher l'aide d'une commande spécifique :

```bash
npx teloquent make:model --help
```

### Initialisation du projet

```bash
npx teloquent init
```

Cette commande initialise un nouveau projet Teloquent en :
- Créant un fichier de configuration `teloquent.config.ts`
- Créant les répertoires nécessaires (modèles, migrations, seeders)
- Créant un fichier de connexion à la base de données

### Génération de modèles

```bash
npx teloquent make:model User
```

Options disponibles :
- `--migration` ou `-m` : Génère également une migration pour le modèle
- `--timestamps` ou `-t` : Ajoute automatiquement les timestamps au modèle
- `--softDeletes` ou `-s` : Ajoute le support des soft deletes au modèle
- `--fillable=name,email,password` : Définit les attributs remplissables
- `--table=custom_table_name` : Spécifie un nom de table personnalisé

Exemple avec options :

```bash
npx teloquent make:model User -m -t -s --fillable=name,email,password
```

Cela générera un fichier modèle comme celui-ci :

```typescript
// src/models/User.ts
import { Model, Table, Column, PrimaryKey, Timestamps, SoftDeletes } from 'teloquent';

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
  
  // Attributs remplissables
  public static fillable = ['name', 'email', 'password'];
}
```

### Génération de migrations

```bash
npx teloquent make:migration create_users_table
```

Options disponibles :
- `--create=table_name` : Génère une migration pour créer une nouvelle table
- `--table=table_name` : Génère une migration pour modifier une table existante

Exemples :

```bash
# Création d'une nouvelle table
npx teloquent make:migration create_users_table --create=users

# Modification d'une table existante
npx teloquent make:migration add_phone_to_users --table=users
```

Cela générera un fichier de migration comme celui-ci :

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
      table.timestamps();
    });
  }

  public async down(): Promise<void> {
    await this.schema.dropTable('users');
  }
}
```

### Exécution des migrations

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

Options disponibles pour `migrate` :
- `--step=N` : Limite le nombre de migrations à exécuter
- `--force` : Force l'exécution en production (utiliser avec précaution)

### Génération de seeders

Les seeders permettent de remplir votre base de données avec des données de test ou initiales.

```bash
npx teloquent make:seeder UserSeeder
```

Cela générera un fichier seeder comme celui-ci :

```typescript
// src/seeders/UserSeeder.ts
import { Seeder } from 'teloquent';
import User from '../models/User';

export default class UserSeeder extends Seeder {
  public async run(): Promise<void> {
    await User.create([
      {
        name: 'Admin User',
        email: 'admin@example.com',
        password: 'password'
      },
      {
        name: 'Regular User',
        email: 'user@example.com',
        password: 'password'
      }
    ]);
  }
}
```

### Exécution des seeders

```bash
# Exécuter tous les seeders
npx teloquent db:seed

# Exécuter un seeder spécifique
npx teloquent db:seed --class=UserSeeder
```

### Génération de factories

Les factories permettent de générer des données de test avec des valeurs aléatoires.

```bash
npx teloquent make:factory UserFactory
```

Cela générera un fichier factory comme celui-ci :

```typescript
// src/factories/UserFactory.ts
import { Factory } from 'teloquent';
import User from '../models/User';
import { faker } from '@faker-js/faker';

export default class UserFactory extends Factory<User> {
  public model = User;
  
  public definition(): Partial<User> {
    return {
      name: faker.person.fullName(),
      email: faker.internet.email(),
      password: 'password',
      created_at: new Date()
    };
  }
}
```

### Autres commandes utiles

```bash
# Générer un fichier de relation
npx teloquent make:relation UserPosts

# Générer un fichier de middleware
npx teloquent make:middleware AuthMiddleware

# Générer un fichier de service
npx teloquent make:service UserService

# Vider le cache de la base de données
npx teloquent cache:clear
```

## Commandes personnalisées

Vous pouvez créer vos propres commandes pour la CLI de Teloquent.

1. Créez un fichier de commande :

```typescript
// src/commands/HelloCommand.ts
import { Command } from 'teloquent/cli';

export default class HelloCommand extends Command {
  // Signature de la commande (nom et arguments)
  public signature = 'hello {name?}';
  
  // Description de la commande
  public description = 'Say hello to someone';
  
  // Méthode exécutée lorsque la commande est appelée
  public async handle(): Promise<void> {
    const name = this.argument('name') || 'World';
    this.info(`Hello, ${name}!`);
  }
}
```

2. Enregistrez votre commande dans le fichier de configuration :

```typescript
// teloquent.config.ts
import HelloCommand from './src/commands/HelloCommand';

export default {
  // ... autres configurations
  
  // Commandes personnalisées
  commands: [
    HelloCommand
  ]
};
```

3. Utilisez votre commande :

```bash
npx teloquent hello John
# Output: Hello, John!
```

## Hooks de commande

Vous pouvez définir des hooks qui s'exécutent avant ou après certaines commandes :

```typescript
// teloquent.config.ts
export default {
  // ... autres configurations
  
  // Hooks
  hooks: {
    // Avant d'exécuter les migrations
    beforeMigrate: async () => {
      console.log('Sauvegarde de la base de données...');
      // Logique de sauvegarde
    },
    
    // Après avoir exécuté les migrations
    afterMigrate: async () => {
      console.log('Migrations terminées avec succès!');
    }
  }
};
```

## Environnements

La CLI de Teloquent prend en charge différents environnements (développement, test, production) via la variable d'environnement `NODE_ENV` ou l'option `--env` :

```bash
# Utiliser l'environnement de test
NODE_ENV=test npx teloquent migrate

# Ou avec l'option --env
npx teloquent migrate --env=test
```

Vous pouvez définir des configurations spécifiques à chaque environnement :

```typescript
// teloquent.config.ts
export default {
  // Configuration par défaut
  
  // Configurations spécifiques aux environnements
  environments: {
    development: {
      connection: {
        database: 'teloquent_dev'
      }
    },
    test: {
      connection: {
        database: 'teloquent_test'
      }
    },
    production: {
      connection: {
        database: 'teloquent_prod'
      }
    }
  }
};
```

## Bonnes pratiques

### Organisation des commandes

Organisez vos commandes en groupes logiques :

```bash
# Commandes de génération
npx teloquent make:model
npx teloquent make:migration
npx teloquent make:seeder

# Commandes de base de données
npx teloquent migrate
npx teloquent db:seed
npx teloquent db:reset

# Commandes utilitaires
npx teloquent cache:clear
npx teloquent config:publish
```

### Scripts npm

Ajoutez des scripts dans votre `package.json` pour les commandes fréquemment utilisées :

```json
{
  "scripts": {
    "migrate": "teloquent migrate",
    "migrate:rollback": "teloquent migrate:rollback",
    "seed": "teloquent db:seed",
    "refresh": "teloquent migrate:refresh && teloquent db:seed",
    "make:model": "teloquent make:model",
    "make:migration": "teloquent make:migration"
  }
}
```

### Automatisation

Intégrez les commandes Teloquent dans vos scripts de déploiement ou CI/CD :

```bash
# Exemple de script de déploiement
npm install
npm run build
NODE_ENV=production npm run migrate
NODE_ENV=production npm run seed
```

## Dépannage

### Problèmes courants

#### Les migrations ne s'exécutent pas

Vérifiez que :
- Le fichier de configuration est correctement configuré
- La base de données est accessible
- Les migrations sont dans le bon répertoire

#### Erreurs de syntaxe dans les fichiers générés

Si vous rencontrez des erreurs de syntaxe dans les fichiers générés, vérifiez :
- La version de TypeScript utilisée
- Les templates personnalisés si vous en avez

#### Commande non trouvée

Si vous obtenez une erreur "commande non trouvée", vérifiez :
- Que Teloquent est correctement installé
- Que vous utilisez la bonne syntaxe (par exemple, `npx teloquent` au lieu de `teloquent`)
- Que le chemin vers le binaire est correct

### Journalisation

Activez la journalisation détaillée pour déboguer les problèmes :

```bash
npx teloquent migrate --verbose
```

### Aide et support

Si vous rencontrez des problèmes avec la CLI de Teloquent, vous pouvez :
- Consulter la documentation complète
- Vérifier les issues GitHub
- Poser une question sur le forum de support
