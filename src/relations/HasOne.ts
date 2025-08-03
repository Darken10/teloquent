/**
 * Relation HasOne pour l'ORM Teloquent
 * 
 * Cette classe représente une relation one-to-one où le modèle parent
 * possède une référence vers un modèle enfant.
 */

import Model from '../Model';
import QueryBuilder from '../QueryBuilder';
import Relation from './Relation';

export default class HasOne<T extends Model> extends Relation<T> {
  // Clé étrangère sur le modèle lié
  protected foreignKey: string;
  
  // Clé locale sur le modèle parent
  protected localKey: string;

  /**
   * Constructeur de la relation HasOne
   * @param related Classe du modèle lié
   * @param parent Modèle parent
   * @param foreignKey Clé étrangère sur le modèle lié
   * @param localKey Clé locale sur le modèle parent
   */
  constructor(
    related: typeof Model,
    parent: Model,
    foreignKey: string,
    localKey: string
  ) {
    super(related, parent);
    
    this.foreignKey = foreignKey;
    this.localKey = localKey;
    
    // Ajouter les contraintes de base
    this.addConstraints();
  }

  /**
   * Récupère le query builder pour cette relation
   */
  protected getRelationQuery(): QueryBuilder<T> {
    return this.related.query() as QueryBuilder<T>;
  }

  /**
   * Ajoute les contraintes pour récupérer les résultats de la relation
   */
  protected addConstraints(): void {
    // Ajouter la contrainte de clé étrangère
    this.query.where(this.foreignKey, this.parent.getAttribute(this.localKey));
  }

  /**
   * Ajoute les contraintes pour l'eager loading
   * @param models Modèles parents
   */
  protected addEagerConstraints(models: Model[]): void {
    // Récupérer toutes les valeurs de clé locale des modèles parents
    const keys = models
      .map(model => model.getAttribute(this.localKey))
      .filter(key => key !== undefined && key !== null);
    
    // Ajouter la contrainte whereIn sur la clé étrangère
    this.query.whereIn(this.foreignKey, keys);
  }

  /**
   * Associe les résultats aux modèles parents
   * @param models Modèles parents
   * @param results Résultats de la relation
   * @param relation Nom de la relation
   */
  protected matchResults(models: Model[], results: T[], relation: string): void {
    // Créer un dictionnaire des résultats indexé par clé étrangère
    const dictionary: Record<string | number, T> = {};
    
    results.forEach(result => {
      const key = result.getAttribute(this.foreignKey);
      if (key !== undefined && key !== null) {
        dictionary[key] = result;
      }
    });
    
    // Associer chaque résultat au modèle parent correspondant
    models.forEach(model => {
      const key = model.getAttribute(this.localKey);
      if (key !== undefined && key !== null && dictionary[key]) {
        model.setRelation(relation, dictionary[key]);
      } else {
        model.setRelation(relation, null);
      }
    });
  }

  /**
   * Récupère la requête pour compter les relations
   * @param models Modèles parents
   */
  protected async getCountQuery(models: Model[]): Promise<Record<string, number>> {
    // Récupérer toutes les valeurs de clé locale des modèles parents
    const keys = models
      .map(model => model.getAttribute(this.localKey))
      .filter(key => key !== undefined && key !== null);
    
    // Exécuter la requête de comptage groupée par clé étrangère
    const query = this.related.query().getQuery();
    const results = await query
      .select(this.foreignKey)
      .count('* as count')
      .whereIn(this.foreignKey, keys)
      .groupBy(this.foreignKey);
    
    // Convertir les résultats en dictionnaire
    const counts: Record<string, number> = {};
    results.forEach(result => {
      counts[result[this.foreignKey]] = Number(result.count);
    });
    
    return counts;
  }

  /**
   * Associe les compteurs aux modèles parents
   * @param models Modèles parents
   * @param results Résultats du comptage
   * @param relation Nom de la relation
   */
  protected matchCounts(models: Model[], results: Record<string, number>, relation: string): void {
    // Associer chaque compteur au modèle parent correspondant
    models.forEach(model => {
      const key = model.getAttribute(this.localKey);
      const relationCountName = `${relation}_count`;
      
      if (key !== undefined && key !== null && results[key]) {
        model.setAttribute(relationCountName, results[key]);
      } else {
        model.setAttribute(relationCountName, 0);
      }
    });
  }

  /**
   * Récupère le résultat de la relation
   * Pour HasOne, on retourne un seul modèle ou null
   */
  protected async getResultsQuery(): Promise<T | null> {
    return this.query.first();
  }

  /**
   * Crée un nouveau modèle lié et l'associe au modèle parent
   * @param attributes Attributs du nouveau modèle
   */
  public async create(attributes: Record<string, any> = {}): Promise<T> {
    // Ajouter la clé étrangère aux attributs
    attributes[this.foreignKey] = this.parent.getAttribute(this.localKey);
    
    // Créer le nouveau modèle
    const instance = await this.related.create(attributes) as T;
    
    // Associer le nouveau modèle au parent
    this.parent.setRelation(this.getRelationName(), instance);
    
    return instance;
  }

  /**
   * Met à jour ou crée un modèle lié
   * @param attributes Attributs pour la mise à jour ou la création
   */
  public async updateOrCreate(attributes: Record<string, any> = {}): Promise<T> {
    // Récupérer le modèle existant
    const instance = await this.getResults() as T | null;
    
    if (instance) {
      // Mettre à jour le modèle existant
      await instance.update(attributes);
      return instance;
    } else {
      // Créer un nouveau modèle
      return this.create(attributes);
    }
  }

  /**
   * Récupère le nom de la relation en se basant sur la pile d'appels
   * Cette méthode est utilisée en interne pour déterminer le nom de la relation
   */
  protected getRelationName(): string {
    // Cette méthode est une approximation et pourrait ne pas fonctionner dans tous les cas
    const stack = new Error().stack || '';
    const callerLine = stack.split('\n')[3] || '';
    const match = callerLine.match(/at\s+(\w+)\s+/);
    return match ? match[1] : 'unknown';
  }
}
