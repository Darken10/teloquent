/**
 * Utilitaire de connexion à la base de données pour l'ORM Teloquent
 * 
 * Cette classe gère les connexions à la base de données via Knex.js.
 */

import knex, { Knex } from 'knex';
import config from '../../knexfile';

/**
 * Interface pour la configuration de connexion
 */
export interface ConnectionConfig {
  client: string;
  connection: Knex.Config['connection'];
  pool?: {
    min?: number;
    max?: number;
  };
  migrations?: {
    directory?: string;
    tableName?: string;
  };
  seeds?: {
    directory?: string;
  };
  [key: string]: any;
}

/**
 * Classe de gestion des connexions à la base de données
 */
export class Connection {
  // Connexions actives
  private static connections: Record<string, Knex> = {};
  
  // Connexion par défaut
  private static defaultConnection: string = 'default';

  /**
   * Initialise les connexions à la base de données
   * @param config Configuration de connexion ou nom de l'environnement
   */
  public static initialize(config: ConnectionConfig | string): void {
    if (typeof config === 'string') {
      // Utiliser la configuration du fichier knexfile.ts
      const env = config || process.env.NODE_ENV || 'development';
      this.addConnection('default', this.getConfigForEnvironment(env));
    } else {
      // Utiliser la configuration fournie
      this.addConnection('default', config);
    }
  }

  /**
   * Récupère la configuration pour un environnement donné
   * @param env Nom de l'environnement
   */
  private static getConfigForEnvironment(env: string): ConnectionConfig {
    const envConfig = (config as Record<string, ConnectionConfig>)[env];
    
    if (!envConfig) {
      throw new Error(`Configuration not found for environment: ${env}`);
    }
    
    return envConfig;
  }

  /**
   * Ajoute une connexion
   * @param name Nom de la connexion
   * @param config Configuration de la connexion
   */
  public static addConnection(name: string, config: ConnectionConfig): void {
    if (this.connections[name]) {
      this.connections[name].destroy();
    }
    
    this.connections[name] = knex(config);
  }

  /**
   * Récupère une connexion par son nom
   * @param name Nom de la connexion (optionnel, utilise la connexion par défaut si non spécifié)
   */
  public static getConnection(name?: string): Knex {
    const connectionName = name || this.defaultConnection;
    
    if (!this.connections[connectionName]) {
      if (connectionName === this.defaultConnection) {
        // Initialiser la connexion par défaut avec l'environnement de développement
        this.initialize('development');
      } else {
        throw new Error(`Connection not found: ${connectionName}`);
      }
    }
    
    return this.connections[connectionName];
  }

  /**
   * Définit la connexion par défaut
   * @param name Nom de la connexion
   */
  public static setDefaultConnection(name: string): void {
    if (!this.connections[name]) {
      throw new Error(`Cannot set default connection: ${name} does not exist`);
    }
    
    this.defaultConnection = name;
  }

  /**
   * Ferme toutes les connexions
   */
  public static closeAll(): Promise<void[]> {
    const promises = Object.values(this.connections).map(connection => connection.destroy());
    this.connections = {};
    return Promise.all(promises);
  }

  /**
   * Ferme une connexion spécifique
   * @param name Nom de la connexion
   */
  public static close(name: string): Promise<void> {
    if (!this.connections[name]) {
      return Promise.resolve();
    }
    
    const promise = this.connections[name].destroy();
    delete this.connections[name];
    return promise;
  }
}
