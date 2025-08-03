/**
 * QueryBuilder pour l'ORM Teloquent
 * 
 * Cette classe permet de construire des requêtes SQL de manière fluide
 * et typée, inspirée du query builder d'Eloquent.
 */

import { Knex } from 'knex';
import Model, { ModelAttributes } from './Model';
import Collection from './Collection';
import { Connection } from './utils/connection';

export default class QueryBuilder<T extends Model> {
  // Modèle associé à ce query builder
  protected model: typeof Model;
  
  // Instance Knex sous-jacente
  protected query: Knex.QueryBuilder;
  
  // Relations à charger avec eager loading
  protected eagerLoad: string[] = [];
  
  // Relations à compter
  protected eagerLoadCount: string[] = [];

  /**
   * Constructeur du QueryBuilder
   * @param model Classe du modèle
   */
  constructor(model: typeof Model) {
    this.model = model;
    this.query = this.getBaseQuery();
  }

  /**
   * Récupère la requête Knex de base pour ce modèle
   */
  protected getBaseQuery(): Knex.QueryBuilder {
    const connection = (this.model as any).getConnection();
    const tableName = this.model.getTableName();
    
    // Ajouter la clause where pour le soft delete si nécessaire
    let query = connection.table(tableName);
    
    if ((this.model as any).usesSoftDeletes) {
      const deletedAt = (this.model as any).DELETED_AT;
      query = query.whereNull(`${tableName}.${deletedAt}`);
    }
    
    return query;
  }

  /**
   * Convertit un résultat de requête en instance de modèle
   * @param result Résultat de la requête
   */
  protected hydrate(result: Record<string, any> | null): T | null {
    if (!result) return null;
    
    const instance = new this.model(result) as T;
    instance.setExists(true);
    
    return instance;
  }

  /**
   * Convertit plusieurs résultats de requête en instances de modèle
   * @param results Résultats de la requête
   */
  protected hydrateMany(results: Record<string, any>[]): T[] {
    return results.map(result => this.hydrate(result)).filter(model => model !== null) as T[];
  }

  /**
   * Charge les relations pour un ensemble de modèles
   * @param models Modèles sur lesquels charger les relations
   */
  protected async loadRelations(models: T[]): Promise<void> {
    if (models.length === 0 || this.eagerLoad.length === 0) {
      return;
    }
    
    // Pour chaque relation à charger
    for (const relation of this.eagerLoad) {
      // Récupérer la méthode de relation sur le premier modèle
      const firstModel = models[0];
      if (typeof (firstModel as any)[relation] !== 'function') {
        continue;
      }
      
      // Récupérer l'instance de relation
      const relationInstance = (firstModel as any)[relation]();
      
      // Charger la relation sur tous les modèles
      await relationInstance.eagerLoadRelation(models, relation);
    }
  }

  /**
   * Charge les compteurs de relations pour un ensemble de modèles
   * @param models Modèles sur lesquels compter les relations
   */
  protected async loadCounts(models: T[]): Promise<void> {
    if (models.length === 0 || this.eagerLoadCount.length === 0) {
      return;
    }
    
    // Pour chaque relation à compter
    for (const relation of this.eagerLoadCount) {
      // Récupérer la méthode de relation sur le premier modèle
      const firstModel = models[0];
      if (typeof (firstModel as any)[relation] !== 'function') {
        continue;
      }
      
      // Récupérer l'instance de relation
      const relationInstance = (firstModel as any)[relation]();
      
      // Compter la relation sur tous les modèles
      await relationInstance.eagerLoadCount(models, relation);
    }
    
    return models;
  }

  /**
   * Trouve un modèle par sa clé primaire
   * @param id Valeur de la clé primaire
   */
  public async find(id: any): Promise<T | null> {
    const primaryKey = this.model.getPrimaryKey();
    return this.where(primaryKey, id).first();
  }

  /**
   * Trouve plusieurs modèles par leurs clés primaires
   * @param ids Valeurs des clés primaires
   */
  public async findMany(ids: any[]): Promise<T[]> {
    const primaryKey = this.model.getPrimaryKey();
    return this.whereIn(primaryKey, ids).get();
  }

  /**
   * Définit une clause where sur la requête
   * @param column Colonne ou conditions
   * @param operator Opérateur ou valeur
   * @param value Valeur (optionnelle)
   */
  public where(column: string | Record<string, any>, operator?: any, value?: any): this {
    if (typeof column === 'object') {
      // Si column est un objet, ajouter plusieurs clauses where
      Object.entries(column).forEach(([key, val]) => {
        this.query = this.query.where(key, val);
      });
    } else if (value === undefined) {
      // Si value n'est pas défini, operator est la valeur
      this.query = this.query.where(column, operator);
    } else {
      // Sinon, utiliser les trois paramètres
      this.query = this.query.where(column, operator, value);
    }
    
    return this;
  }

  /**
   * Définit une clause whereIn sur la requête
   * @param column Colonne
   * @param values Valeurs
   */
  public whereIn(column: string, values: any[]): this {
    this.query = this.query.whereIn(column, values);
    return this;
  }

  /**
   * Définit une clause whereNotIn sur la requête
   * @param column Colonne
   * @param values Valeurs
   */
  public whereNotIn(column: string, values: any[]): this {
    this.query = this.query.whereNotIn(column, values);
    return this;
  }

  /**
   * Définit une clause whereNull sur la requête
   * @param column Colonne
   */
  public whereNull(column: string): this {
    this.query = this.query.whereNull(column);
    return this;
  }

  /**
   * Définit une clause whereNotNull sur la requête
   * @param column Colonne
   */
  public whereNotNull(column: string): this {
    this.query = this.query.whereNotNull(column);
    return this;
  }

  /**
   * Définit une clause orWhere sur la requête
   * @param column Colonne ou conditions
   * @param operator Opérateur ou valeur
   * @param value Valeur (optionnelle)
   */
  public orWhere(column: string | Record<string, any>, operator?: any, value?: any): this {
    if (typeof column === 'object') {
      // Si column est un objet, ajouter plusieurs clauses orWhere
      Object.entries(column).forEach(([key, val]) => {
        this.query = this.query.orWhere(key, val);
      });
    } else if (value === undefined) {
      // Si value n'est pas défini, operator est la valeur
      this.query = this.query.orWhere(column, operator);
    } else {
      // Sinon, utiliser les trois paramètres
      this.query = this.query.orWhere(column, operator, value);
    }
    
    return this;
  }

  /**
   * Définit une clause orderBy sur la requête
   * @param column Colonne
   * @param direction Direction (asc ou desc)
   */
  public orderBy(column: string, direction: 'asc' | 'desc' = 'asc'): this {
    this.query = this.query.orderBy(column, direction);
    return this;
  }

  /**
   * Définit une clause limit sur la requête
   * @param limit Limite
   */
  public limit(limit: number): this {
    this.query = this.query.limit(limit);
    return this;
  }

  /**
   * Définit une clause offset sur la requête
   * @param offset Offset
   */
  public offset(offset: number): this {
    this.query = this.query.offset(offset);
    return this;
  }

  /**
   * Définit les relations à charger avec eager loading
   * @param relations Relations à charger
   */
  public with(...relations: string[]): this {
    this.eagerLoad = [...this.eagerLoad, ...relations];
    return this;
  }

  /**
   * Définit les relations à compter
   * @param relations Relations à compter
   */
  public withCount(...relations: string[]): this {
    this.eagerLoadCount = [...this.eagerLoadCount, ...relations];
    return this;
  }

  /**
   * Exécute la requête et récupère le premier résultat
   */
  public async first(): Promise<T | null> {
    const result = await this.query.first();
    const model = this.hydrate(result);
    
    if (model && (this.eagerLoad.length > 0 || this.eagerLoadCount.length > 0)) {
      const models = [model];
      await this.loadRelations(models);
      await this.loadCounts(models);
      return models[0];
    }
    
    return model;
  }

  /**
   * Exécute la requête et récupère tous les résultats sous forme de Collection
   */
  public async get(): Promise<Collection<T>> {
    const results = await this.query;
    const models = this.hydrateMany(results);
    
    if (this.eagerLoad.length > 0 || this.eagerLoadCount.length > 0) {
      await this.loadRelations(models);
      await this.loadCounts(models);
    }
    
    return new Collection<T>(models);
  }
  
  /**
   * Récupère tous les résultats sous forme de collection
   */
  public async all(): Promise<Collection<T>> {
    return this.get();
  }
  
  /**
   * Récupère un chunk de résultats et exécute un callback pour chaque chunk
   * @param count Nombre d'éléments par chunk
   * @param callback Callback à exécuter pour chaque chunk
   */
  public async chunk(count: number, callback: (items: Collection<T>, page: number) => Promise<void> | void): Promise<boolean> {
    let page = 1;
    let countItems = 0;
    
    do {
      const clone = this.clone();
      const items = await clone.forPage(page, count).get();
      countItems = items.count();
      
      if (countItems === 0) {
        break;
      }
      
      await Promise.resolve(callback(items, page));
      page++;
      
    } while (countItems === count);
    
    return true;
  }
  
  /**
   * Clone le query builder actuel
   */
  public clone(): QueryBuilder<T> {
    const clone = new QueryBuilder<T>(this.model);
    
    // Cloner la requête Knex sous-jacente
    clone.query = this.query.clone();
    
    // Cloner les relations à charger
    clone.eagerLoad = [...this.eagerLoad];
    clone.eagerLoadCount = [...this.eagerLoadCount];
    
    return clone;
  }
  
  /**
   * Récupère une page de résultats
   * @param page Numéro de page
   * @param perPage Nombre d'éléments par page
   */
  public forPage(page: number, perPage: number): this {
    return this.offset((page - 1) * perPage).limit(perPage);
  }

  /**
   * Compte le nombre de résultats
   */
  public async count(): Promise<number> {
    const result = await this.query.count('* as count').first();
    return result ? Number(result.count) : 0;
  }

  /**
   * Insère un nouvel enregistrement dans la base de données
   * @param values Valeurs à insérer
   */
  public async insert(values: ModelAttributes | ModelAttributes[]): Promise<any[]> {
    return this.query.insert(values);
  }

  /**
   * Met à jour des enregistrements dans la base de données
   * @param values Valeurs à mettre à jour
   */
  public async update(values: ModelAttributes): Promise<number> {
    return this.query.update(values);
  }

  /**
   * Supprime des enregistrements de la base de données
   */
  public async delete(): Promise<number> {
    return this.query.delete();
  }

  /**
   * Tronque la table
   */
  public async truncate(): Promise<void> {
    return this.query.truncate();
  }

  /**
   * Récupère la requête SQL brute
   */
  public toSql(): string {
    return this.query.toSQL().sql;
  }

  /**
   * Récupère la requête Knex sous-jacente
   */
  public getQuery(): Knex.QueryBuilder {
    return this.query;
  }
}
