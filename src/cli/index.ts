#!/usr/bin/env node

/**
 * CLI pour l'ORM Teloquent
 * 
 * Cette CLI permet de générer des migrations, des modèles et d'exécuter les migrations.
 */

import { Command } from 'commander';
import path from 'path';
import fs from 'fs';
import chalk from 'chalk';
import { Migrator } from '../migrations';
import { Connection } from '../utils/connection';

// Initialiser le programme
const program = new Command();

program
  .name('teloquent')
  .description('CLI pour l\'ORM Teloquent')
  .version('0.1.0');

// Commande pour initialiser le projet
program
  .command('init')
  .description('Initialise un nouveau projet Teloquent')
  .action(async () => {
    try {
      // Créer les répertoires nécessaires
      const dirs = [
        'migrations',
        'models',
        'seeders'
      ];
      
      dirs.forEach(dir => {
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
          console.log(chalk.green(`✓ Répertoire ${dir} créé`));
        } else {
          console.log(chalk.yellow(`! Répertoire ${dir} existe déjà`));
        }
      });
      
      // Créer le fichier knexfile.ts s'il n'existe pas
      const knexfilePath = path.join(process.cwd(), 'knexfile.ts');
      
      if (!fs.existsSync(knexfilePath)) {
        const knexfileContent = `
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
`.trim();
        
        fs.writeFileSync(knexfilePath, knexfileContent);
        console.log(chalk.green('✓ Fichier knexfile.ts créé'));
      } else {
        console.log(chalk.yellow('! Fichier knexfile.ts existe déjà'));
      }
      
      // Créer le fichier .env s'il n'existe pas
      const envPath = path.join(process.cwd(), '.env');
      
      if (!fs.existsSync(envPath)) {
        const envContent = `
# Configuration de la base de données
DB_CLIENT=pg
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=
DB_NAME=teloquent
TEST_DB_NAME=teloquent_test
`.trim();
        
        fs.writeFileSync(envPath, envContent);
        console.log(chalk.green('✓ Fichier .env créé'));
      } else {
        console.log(chalk.yellow('! Fichier .env existe déjà'));
      }
      
      console.log(chalk.green('\nInitialisation terminée avec succès!'));
      console.log(chalk.blue('\nÉtapes suivantes:'));
      console.log('1. Configurez votre base de données dans le fichier .env');
      console.log('2. Créez des migrations avec teloquent make:migration');
      console.log('3. Exécutez les migrations avec teloquent migrate');
      console.log('4. Créez des modèles avec teloquent make:model');
      
    } catch (error) {
      console.error(chalk.red('Erreur lors de l\'initialisation:'), error);
      process.exit(1);
    }
  });

// Commande pour créer une migration
program
  .command('make:migration <name>')
  .description('Crée un nouveau fichier de migration')
  .option('-d, --directory <directory>', 'Répertoire des migrations')
  .action(async (name, options) => {
    try {
      const directory = options.directory || path.join(process.cwd(), 'migrations');
      const migrator = new Migrator({ directory });
      
      const filePath = migrator.createMigrationFile(name);
      console.log(chalk.green(`Migration créée: ${filePath}`));
      
    } catch (error) {
      console.error(chalk.red('Erreur lors de la création de la migration:'), error);
      process.exit(1);
    }
  });

// Commande pour exécuter les migrations
program
  .command('migrate')
  .description('Exécute les migrations en attente')
  .option('-d, --directory <directory>', 'Répertoire des migrations')
  .option('-c, --connection <connection>', 'Nom de la connexion à utiliser')
  .option('-t, --table <table>', 'Nom de la table des migrations')
  .action(async (options) => {
    try {
      // Initialiser la connexion
      Connection.initialize(process.env.NODE_ENV || 'development');
      
      const migrator = new Migrator({
        directory: options.directory || path.join(process.cwd(), 'migrations'),
        connection: options.connection,
        tableName: options.table
      });
      
      console.log(chalk.blue('Exécution des migrations...'));
      
      const migratedFiles = await migrator.migrate();
      
      if (migratedFiles.length === 0) {
        console.log(chalk.yellow('Aucune migration à exécuter.'));
      } else {
        console.log(chalk.green(`${migratedFiles.length} migration(s) exécutée(s):`));
        migratedFiles.forEach(file => {
          console.log(chalk.green(`  ✓ ${file}`));
        });
      }
      
      // Fermer la connexion
      await Connection.closeAll();
      
    } catch (error) {
      console.error(chalk.red('Erreur lors de l\'exécution des migrations:'), error);
      process.exit(1);
    }
  });

// Commande pour annuler les migrations
program
  .command('rollback')
  .description('Annule la dernière batch de migrations')
  .option('-d, --directory <directory>', 'Répertoire des migrations')
  .option('-c, --connection <connection>', 'Nom de la connexion à utiliser')
  .option('-t, --table <table>', 'Nom de la table des migrations')
  .action(async (options) => {
    try {
      // Initialiser la connexion
      Connection.initialize(process.env.NODE_ENV || 'development');
      
      const migrator = new Migrator({
        directory: options.directory || path.join(process.cwd(), 'migrations'),
        connection: options.connection,
        tableName: options.table
      });
      
      console.log(chalk.blue('Annulation des migrations...'));
      
      const rolledBackFiles = await migrator.rollback();
      
      if (rolledBackFiles.length === 0) {
        console.log(chalk.yellow('Aucune migration à annuler.'));
      } else {
        console.log(chalk.green(`${rolledBackFiles.length} migration(s) annulée(s):`));
        rolledBackFiles.forEach(file => {
          console.log(chalk.green(`  ✓ ${file}`));
        });
      }
      
      // Fermer la connexion
      await Connection.closeAll();
      
    } catch (error) {
      console.error(chalk.red('Erreur lors de l\'annulation des migrations:'), error);
      process.exit(1);
    }
  });

// Commande pour réinitialiser les migrations
program
  .command('migrate:reset')
  .description('Annule toutes les migrations')
  .option('-d, --directory <directory>', 'Répertoire des migrations')
  .option('-c, --connection <connection>', 'Nom de la connexion à utiliser')
  .option('-t, --table <table>', 'Nom de la table des migrations')
  .action(async (options) => {
    try {
      // Initialiser la connexion
      Connection.initialize(process.env.NODE_ENV || 'development');
      
      const migrator = new Migrator({
        directory: options.directory || path.join(process.cwd(), 'migrations'),
        connection: options.connection,
        tableName: options.table
      });
      
      console.log(chalk.blue('Réinitialisation des migrations...'));
      
      const resetFiles = await migrator.reset();
      
      if (resetFiles.length === 0) {
        console.log(chalk.yellow('Aucune migration à réinitialiser.'));
      } else {
        console.log(chalk.green(`${resetFiles.length} migration(s) réinitialisée(s):`));
        resetFiles.forEach(file => {
          console.log(chalk.green(`  ✓ ${file}`));
        });
      }
      
      // Fermer la connexion
      await Connection.closeAll();
      
    } catch (error) {
      console.error(chalk.red('Erreur lors de la réinitialisation des migrations:'), error);
      process.exit(1);
    }
  });

// Commande pour rafraîchir les migrations
program
  .command('migrate:refresh')
  .description('Annule toutes les migrations puis les réexécute')
  .option('-d, --directory <directory>', 'Répertoire des migrations')
  .option('-c, --connection <connection>', 'Nom de la connexion à utiliser')
  .option('-t, --table <table>', 'Nom de la table des migrations')
  .action(async (options) => {
    try {
      // Initialiser la connexion
      Connection.initialize(process.env.NODE_ENV || 'development');
      
      const migrator = new Migrator({
        directory: options.directory || path.join(process.cwd(), 'migrations'),
        connection: options.connection,
        tableName: options.table
      });
      
      console.log(chalk.blue('Rafraîchissement des migrations...'));
      
      const { reset, migrated } = await migrator.refresh();
      
      console.log(chalk.green(`${reset.length} migration(s) réinitialisée(s)`));
      console.log(chalk.green(`${migrated.length} migration(s) exécutée(s)`));
      
      // Fermer la connexion
      await Connection.closeAll();
      
    } catch (error) {
      console.error(chalk.red('Erreur lors du rafraîchissement des migrations:'), error);
      process.exit(1);
    }
  });

// Commande pour créer un modèle
program
  .command('make:model <name>')
  .description('Crée un nouveau modèle')
  .option('-d, --directory <directory>', 'Répertoire des modèles')
  .option('-m, --migration', 'Crée également une migration pour le modèle')
  .action(async (name, options) => {
    try {
      const directory = options.directory || path.join(process.cwd(), 'models');
      
      // Créer le répertoire s'il n'existe pas
      if (!fs.existsSync(directory)) {
        fs.mkdirSync(directory, { recursive: true });
      }
      
      // Nom de la classe et de la table
      const className = name.charAt(0).toUpperCase() + name.slice(1);
      const tableName = name.toLowerCase() + 's';
      
      // Chemin du fichier
      const filePath = path.join(directory, `${className}.ts`);
      
      // Contenu du modèle
      const modelContent = `
import { Model } from 'teloquent';
import { Table, PrimaryKey, Column, Timestamps } from 'teloquent/decorators';

@Table('${tableName}')
@Timestamps()
export class ${className} extends Model {
  @PrimaryKey()
  public id!: number;
  
  // Définissez vos colonnes ici
  // @Column()
  // public name!: string;
  
  // Définissez vos relations ici
  // @HasManyRelation(() => RelatedModel)
  // public relatedModels!: HasMany<RelatedModel>;
}

export default ${className};
`.trim();
      
      // Écrire le fichier du modèle
      fs.writeFileSync(filePath, modelContent);
      console.log(chalk.green(`Modèle créé: ${filePath}`));
      
      // Créer une migration si demandé
      if (options.migration) {
        const migrator = new Migrator({
          directory: path.join(process.cwd(), 'migrations')
        });
        
        const migrationName = `create_${tableName}_table`;
        const migrationPath = migrator.createMigrationFile(migrationName);
        
        // Remplacer le contenu de la migration
        const migrationContent = `
import { Migration } from '../src/migrations/Migration';
import { Schema } from '../src/utils/schema';

export default class Create${className}sTable extends Migration {
  /**
   * Exécute la migration
   */
  public async up(): Promise<void> {
    await Schema.create('${tableName}', (table) => {
      table.increments('id');
      
      // Définissez vos colonnes ici
      // table.string('name');
      
      table.timestamps();
    }, this.connection);
  }

  /**
   * Annule la migration
   */
  public async down(): Promise<void> {
    await Schema.dropIfExists('${tableName}', this.connection);
  }
}
`.trim();
        
        fs.writeFileSync(migrationPath, migrationContent);
        console.log(chalk.green(`Migration créée: ${migrationPath}`));
      }
      
    } catch (error) {
      console.error(chalk.red('Erreur lors de la création du modèle:'), error);
      process.exit(1);
    }
  });

// Commande pour créer un seeder
program
  .command('make:seeder <name>')
  .description('Crée un nouveau seeder')
  .option('-d, --directory <directory>', 'Répertoire des seeders')
  .action(async (name, options) => {
    try {
      const directory = options.directory || path.join(process.cwd(), 'seeders');
      
      // Créer le répertoire s'il n'existe pas
      if (!fs.existsSync(directory)) {
        fs.mkdirSync(directory, { recursive: true });
      }
      
      // Nom de la classe
      const className = name.charAt(0).toUpperCase() + name.slice(1) + 'Seeder';
      
      // Chemin du fichier
      const filePath = path.join(directory, `${className}.ts`);
      
      // Contenu du seeder
      const seederContent = `
import { Connection } from '../src/utils/connection';
import { Knex } from 'knex';

export class ${className} {
  /**
   * Instance Knex
   */
  private knex: Knex;
  
  /**
   * Constructeur du seeder
   * @param connection Nom de la connexion (optionnel)
   */
  constructor(connection?: string) {
    this.knex = Connection.getConnection(connection);
  }
  
  /**
   * Exécute le seeder
   */
  public async run(): Promise<void> {
    // Insérer des données
    await this.knex('table_name').insert([
      {
        // Données à insérer
      }
    ]);
  }
}

export default ${className};
`.trim();
      
      // Écrire le fichier du seeder
      fs.writeFileSync(filePath, seederContent);
      console.log(chalk.green(`Seeder créé: ${filePath}`));
      
    } catch (error) {
      console.error(chalk.red('Erreur lors de la création du seeder:'), error);
      process.exit(1);
    }
  });

// Commande pour exécuter les seeders
program
  .command('db:seed')
  .description('Exécute tous les seeders')
  .option('-d, --directory <directory>', 'Répertoire des seeders')
  .option('-c, --connection <connection>', 'Nom de la connexion à utiliser')
  .action(async (options) => {
    try {
      // Initialiser la connexion
      Connection.initialize(process.env.NODE_ENV || 'development');
      
      const directory = options.directory || path.join(process.cwd(), 'seeders');
      
      // Vérifier si le répertoire existe
      if (!fs.existsSync(directory)) {
        console.log(chalk.yellow(`Le répertoire ${directory} n'existe pas.`));
        process.exit(0);
      }
      
      // Lire les fichiers du répertoire
      const files = fs.readdirSync(directory)
        .filter(file => file.endsWith('.js') || file.endsWith('.ts'))
        .sort();
      
      if (files.length === 0) {
        console.log(chalk.yellow('Aucun seeder trouvé.'));
        process.exit(0);
      }
      
      console.log(chalk.blue('Exécution des seeders...'));
      
      // Exécuter chaque seeder
      for (const file of files) {
        const filePath = path.join(directory, file);
        const seederModule = await import(filePath);
        const SeederClass = seederModule.default;
        
        if (!SeederClass) {
          console.log(chalk.yellow(`Le seeder ${file} n'exporte pas de classe par défaut.`));
          continue;
        }
        
        const seeder = new SeederClass(options.connection);
        await seeder.run();
        
        console.log(chalk.green(`  ✓ ${file}`));
      }
      
      console.log(chalk.green(`${files.length} seeder(s) exécuté(s)`));
      
      // Fermer la connexion
      await Connection.closeAll();
      
    } catch (error) {
      console.error(chalk.red('Erreur lors de l\'exécution des seeders:'), error);
      process.exit(1);
    }
  });

// Exécuter le programme
program.parse(process.argv);
