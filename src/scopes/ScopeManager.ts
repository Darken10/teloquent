/**
 * Gestionnaire de scopes pour Teloquent
 * 
 * Cette classe gère les scopes globaux et locaux pour les modèles Teloquent.
 */

import { GlobalScope, GlobalScopeCallback } from './GlobalScope';
import QueryBuilder from '../QueryBuilder';
import Model from '../Model';

export class ScopeManager {
  /**
   * Map des scopes globaux par modèle et par nom
   * La clé externe est le nom de la classe du modèle
   * La clé interne est le nom du scope ou la classe du scope
   */
  private static globalScopes: Map<string, Map<string | Function, GlobalScope | GlobalScopeCallback>> = new Map();

  /**
   * Ajoute un scope global à un modèle
   * 
   * @param modelClass La classe du modèle
   * @param scope Le scope global ou une fonction de rappel
   * @param name Le nom du scope (optionnel, requis si scope est une fonction)
   */
  public static addGlobalScope(
    modelClass: typeof Model,
    scope: GlobalScope | GlobalScopeCallback,
    name?: string
  ): void {
    const modelName = modelClass.name;
    
    // Initialiser la map pour ce modèle si elle n'existe pas
    if (!this.globalScopes.has(modelName)) {
      this.globalScopes.set(modelName, new Map());
    }
    
    const modelScopes = this.globalScopes.get(modelName)!;
    
    // Déterminer la clé du scope
    const key = typeof scope === 'function' 
      ? (name || scope.name || `scope_${Date.now()}`)
      : scope.constructor;
      
    // Ajouter le scope à la map
    modelScopes.set(key, scope);
  }

  /**
   * Supprime un scope global d'un modèle
   * 
   * @param modelClass La classe du modèle
   * @param scope Le scope global à supprimer (classe ou nom)
   */
  public static removeGlobalScope(
    modelClass: typeof Model,
    scope: Function | string
  ): boolean {
    const modelName = modelClass.name;
    
    if (!this.globalScopes.has(modelName)) {
      return false;
    }
    
    const modelScopes = this.globalScopes.get(modelName)!;
    return modelScopes.delete(scope);
  }

  /**
   * Récupère tous les scopes globaux pour un modèle
   * 
   * @param modelClass La classe du modèle
   */
  public static getGlobalScopes(
    modelClass: typeof Model
  ): Map<string | Function, GlobalScope | GlobalScopeCallback> {
    const modelName = modelClass.name;
    
    if (!this.globalScopes.has(modelName)) {
      return new Map();
    }
    
    return new Map(this.globalScopes.get(modelName)!);
  }

  /**
   * Applique tous les scopes globaux à un query builder
   * 
   * @param builder Le query builder
   * @param modelClass La classe du modèle
   * @param excludedScopes Les scopes à exclure (optionnel)
   */
  public static applyGlobalScopes<T extends Model>(
    builder: QueryBuilder<T>,
    modelClass: typeof Model,
    excludedScopes: (string | Function)[] = []
  ): void {
    const modelName = modelClass.name;
    
    if (!this.globalScopes.has(modelName)) {
      return;
    }
    
    const modelScopes = this.globalScopes.get(modelName)!;
    
    // Appliquer chaque scope global qui n'est pas exclu
    modelScopes.forEach((scope, key) => {
      if (excludedScopes.includes(key)) {
        return;
      }
      
      if (typeof scope === 'function') {
        scope(builder);
      } else {
        scope.apply(builder);
      }
    });
  }
}
