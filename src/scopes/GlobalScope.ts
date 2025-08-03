/**
 * Interface pour les scopes globaux dans Teloquent
 * 
 * Les scopes globaux permettent d'appliquer automatiquement des contraintes
 * à toutes les requêtes pour un modèle donné.
 */

import QueryBuilder from '../QueryBuilder';
import Model from '../Model';

export interface GlobalScope {
  /**
   * Applique le scope global à la requête
   * @param builder Le QueryBuilder sur lequel appliquer le scope
   */
  apply<T extends Model>(builder: QueryBuilder<T>): void;
}

/**
 * Type pour une fonction de scope global
 */
export type GlobalScopeCallback = <T extends Model>(builder: QueryBuilder<T>) => void;
