/**
 * Relation BelongsTo pour l'ORM Teloquent
 * 
 * Cette classe représente une relation inverse de HasOne ou HasMany,
 * où le modèle enfant appartient à un modèle parent.
 */

import Model from '../Model';
import QueryBuilder from '../QueryBuilder';
import Relation from './Relation';

export default class BelongsTo<T extends Model> extends Relation<T> {
  // Clé étrangère sur le modèle enfant (le modèle courant)
  protected foreignKey: string;
  
  // Clé du propriétaire sur le modèle parent (le modèle lié)
  protected ownerKey: string;

  /**
   * Constructeur de la relation BelongsTo
   * @param related Classe du modèle lié (parent)
   * @param child Modèle enfant (courant)
   * @param foreignKey Clé étrangère sur le modèle enfant
   * @param ownerKey Clé du propriétaire sur le modèle parent
   */
  constructor(
    related: typeof Model,
    child: Model,
    foreignKey: string,
    ownerKey: string
  ) {
    super(related, child);
    
    this.foreignKey = foreignKey;
    this.ownerKey = ownerKey;
    
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
    // Récupérer la valeur de la clé étrangère sur le modèle enfant
    const foreignKeyValue = this.parent.getAttribute(this.foreignKey);
    
    if (foreignKeyValue !== undefined && foreignKeyValue !== null) {
      // Ajouter la contrainte sur la clé du propriétaire
      this.query.where(this.ownerKey, foreignKeyValue);
    }
  }

  /**
   * Ajoute les contraintes pour l'eager loading
   * @param models Modèles enfants
   */
  protected addEagerConstraints(models: Model[]): void {
    // Récupérer toutes les valeurs de clé étrangère des modèles enfants
    const keys = models
      .map(model => model.getAttribute(this.foreignKey))
      .filter(key => key !== undefined && key !== null);
    
    // Ajouter la contrainte whereIn sur la clé du propriétaire
    this.query.whereIn(this.ownerKey, keys);
  }

  /**
   * Associe les résultats aux modèles enfants
   * @param models Modèles enfants
   * @param results Résultats de la relation
   * @param relation Nom de la relation
   */
  protected matchResults(models: Model[], results: T[], relation: string): void {
    // Créer un dictionnaire des résultats indexé par clé du propriétaire
    const dictionary: Record<string | number, T> = {};
    
    results.forEach(result => {
      const key = result.getAttribute(this.ownerKey);
      if (key !== undefined && key !== null) {
        dictionary[key] = result;
      }
    });
    
    // Associer chaque résultat au modèle enfant correspondant
    models.forEach(model => {
      const key = model.getAttribute(this.foreignKey);
      if (key !== undefined && key !== null && dictionary[key]) {
        model.setRelation(relation, dictionary[key]);
      } else {
        model.setRelation(relation, null);
      }
    });
  }

  /**
   * Récupère la requête pour compter les relations
   * @param models Modèles enfants
   */
  protected async getCountQuery(models: Model[]): Promise<Record<string, number>> {
    // Pour BelongsTo, le comptage n'a pas vraiment de sens car c'est une relation one-to-one
    // Mais nous implémentons quand même pour la cohérence
    
    // Récupérer toutes les valeurs de clé étrangère des modèles enfants
    const keys = models
      .map(model => model.getAttribute(this.foreignKey))
      .filter(key => key !== undefined && key !== null);
    
    // Exécuter la requête de comptage
    const query = this.related.query().getQuery();
    const results = await query
      .select(this.ownerKey)
      .count('* as count')
      .whereIn(this.ownerKey, keys)
      .groupBy(this.ownerKey);
    
    // Convertir les résultats en dictionnaire
    const counts: Record<string, number> = {};
    results.forEach(result => {
      counts[result[this.ownerKey]] = Number(result.count);
    });
    
    return counts;
  }

  /**
   * Associe les compteurs aux modèles enfants
   * @param models Modèles enfants
   * @param results Résultats du comptage
   * @param relation Nom de la relation
   */
  protected matchCounts(models: Model[], results: Record<string, number>, relation: string): void {
    // Associer chaque compteur au modèle enfant correspondant
    models.forEach(model => {
      const key = model.getAttribute(this.foreignKey);
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
   * Pour BelongsTo, on retourne un seul modèle ou null
   */
  protected async getResultsQuery(): Promise<T | null> {
    return this.query.first();
  }

  /**
   * Associe le modèle parent au modèle enfant
   * @param model Modèle parent à associer
   */
  public async associate(model: T): Promise<this> {
    // Mettre à jour la clé étrangère sur le modèle enfant
    this.parent.setAttribute(this.foreignKey, model.getAttribute(this.ownerKey));
    
    // Sauvegarder le modèle enfant
    await this.parent.save();
    
    // Mettre à jour la relation
    this.parent.setRelation(this.getRelationName(), model);
    
    return this;
  }

  /**
   * Dissocie le modèle parent du modèle enfant
   */
  public async dissociate(): Promise<this> {
    // Mettre à jour la clé étrangère sur le modèle enfant à null
    this.parent.setAttribute(this.foreignKey, null);
    
    // Sauvegarder le modèle enfant
    await this.parent.save();
    
    // Mettre à jour la relation
    this.parent.setRelation(this.getRelationName(), null);
    
    return this;
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
