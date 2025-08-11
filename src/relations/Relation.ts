/**
 * Classe de base pour les relations dans l'ORM Teloquent
 * 
 * Cette classe abstraite fournit les fonctionnalités de base pour toutes
 * les classes de relations (HasOne, HasMany, BelongsTo, BelongsToMany).
 */

// Définir le type KnexQuery localement pour éviter les problèmes d'importation
type KnexQuery = any;
import Model from '../Model';
import QueryBuilder from '../QueryBuilder';

export default abstract class Relation<T extends Model> {
  // Modèle parent de la relation
  protected parent: Model;
  
  // Classe du modèle lié
  protected related: typeof Model;
  
  // Query builder pour la relation
  protected query: QueryBuilder<T>;

  /**
   * Constructeur de la relation
   * @param related Classe du modèle lié
   * @param parent Modèle parent
   */
  constructor(related: typeof Model, parent: Model) {
    this.related = related;
    this.parent = parent;
    this.query = this.getRelationQuery();
  }

  /**
   * Récupère le query builder pour cette relation
   * Cette méthode doit être implémentée par les classes dérivées
   */
  protected abstract getRelationQuery(): QueryBuilder<T>;

  /**
   * Ajoute les contraintes pour récupérer les résultats de la relation
   * Cette méthode doit être implémentée par les classes dérivées
   */
  protected abstract addConstraints(): void;

  /**
   * Ajoute les contraintes pour l'eager loading
   * @param models Modèles parents
   * Cette méthode doit être implémentée par les classes dérivées
   */
  protected abstract addEagerConstraints(models: Model[]): void;

  /**
   * Associe les résultats aux modèles parents
   * @param models Modèles parents
   * @param results Résultats de la relation
   * @param relation Nom de la relation
   * Cette méthode doit être implémentée par les classes dérivées
   */
  protected abstract matchResults(models: Model[], results: T[], relation: string): void;

  /**
   * Récupère les résultats de la relation
   */
  public async getResults(): Promise<T | T[]> {
    // Ajouter les contraintes pour cette relation
    this.addConstraints();
    
    // Exécuter la requête
    return this.getResultsQuery();
  }

  /**
   * Récupère les résultats de la requête
   * Cette méthode peut être surchargée par les classes dérivées
   */
  protected async getResultsQuery(): Promise<T | T[]> {
    const results = await this.query.get();
    // Convertir la Collection en tableau pour respecter le type de retour
    return results.all();
  }

  /**
   * Charge la relation sur plusieurs modèles (eager loading)
   * @param models Modèles sur lesquels charger la relation
   * @param relation Nom de la relation
   */
  public async eagerLoadRelation(models: Model[], relation: string): Promise<void> {
    // Ajouter les contraintes pour l'eager loading
    this.addEagerConstraints(models);
    
    // Récupérer les résultats
    const results = await this.query.get();
    
    // Associer les résultats aux modèles parents
    // Convertir la Collection en tableau pour respecter le type attendu
    this.matchResults(models, results.all(), relation);
  }

  /**
   * Compte les relations pour plusieurs modèles (eager loading count)
   * @param models Modèles sur lesquels compter la relation
   * @param relation Nom de la relation
   */
  public async eagerLoadCount(models: Model[], relation: string): Promise<void> {
    // Ajouter les contraintes pour l'eager loading
    this.addEagerConstraints(models);
    
    // Regrouper les résultats par clé étrangère
    const results = await this.getCountQuery(models);
    
    // Associer les compteurs aux modèles parents
    this.matchCounts(models, results, relation);
  }

  /**
   * Récupère la requête pour compter les relations
   * @param models Modèles parents
   * Cette méthode doit être implémentée par les classes dérivées
   */
  protected abstract getCountQuery(models: Model[]): Promise<Record<string, number>>;

  /**
   * Associe les compteurs aux modèles parents
   * @param models Modèles parents
   * @param results Résultats du comptage
   * @param relation Nom de la relation
   * Cette méthode doit être implémentée par les classes dérivées
   */
  protected abstract matchCounts(models: Model[], results: Record<string, number>, relation: string): void;

  /**
   * Récupère le query builder de la relation
   */
  public getQuery(): QueryBuilder<T> {
    return this.query;
  }

  /**
   * Récupère le modèle parent de la relation
   */
  public getParent(): Model {
    return this.parent;
  }

  /**
   * Récupère la classe du modèle lié
   */
  public getRelated(): typeof Model {
    return this.related;
  }

  /**
   * Ajoute une clause where à la requête
   */
  public where(column: string | Record<string, any>, operator?: any, value?: any): this {
    this.query.where(column, operator, value);
    return this;
  }

  /**
   * Ajoute une clause orWhere à la requête
   */
  public orWhere(column: string | Record<string, any>, operator?: any, value?: any): this {
    this.query.orWhere(column, operator, value);
    return this;
  }

  /**
   * Ajoute une clause orderBy à la requête
   */
  public orderBy(column: string, direction: 'asc' | 'desc' = 'asc'): this {
    this.query.orderBy(column, direction);
    return this;
  }

  /**
   * Ajoute une clause limit à la requête
   */
  public limit(limit: number): this {
    this.query.limit(limit);
    return this;
  }

  /**
   * Ajoute une clause offset à la requête
   */
  public offset(offset: number): this {
    this.query.offset(offset);
    return this;
  }

  /**
   * Ajoute des relations à charger avec eager loading
   */
  public with(...relations: string[]): this {
    this.query.with(...relations);
    return this;
  }

  /**
   * Ajoute des relations à compter
   */
  public withCount(...relations: string[]): this {
    this.query.withCount(...relations);
    return this;
  }
}
