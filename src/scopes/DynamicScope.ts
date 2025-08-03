/**
 * Support pour les scopes dynamiques dans Teloquent
 * 
 * Les scopes dynamiques permettent de créer des scopes à la volée
 * avec des paramètres personnalisés.
 */

import QueryBuilder from '../QueryBuilder';
import Model from '../Model';

/**
 * Type pour une fonction de scope dynamique
 */
export type DynamicScopeCallback<T extends Model, P extends any[]> = 
  (query: QueryBuilder<T>, ...parameters: P) => QueryBuilder<T>;

/**
 * Classe pour créer des scopes dynamiques
 */
export class DynamicScope<T extends Model, P extends any[]> {
  /**
   * Constructeur pour un scope dynamique
   * 
   * @param callback La fonction de rappel du scope
   */
  constructor(private callback: DynamicScopeCallback<T, P>) {}

  /**
   * Applique le scope dynamique à la requête
   * 
   * @param query Le query builder
   * @param parameters Les paramètres du scope
   */
  public apply(query: QueryBuilder<T>, ...parameters: P): QueryBuilder<T> {
    return this.callback(query, ...parameters);
  }
}
