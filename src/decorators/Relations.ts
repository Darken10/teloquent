/**
 * Décorateurs de relations pour l'ORM Teloquent
 * 
 * Ces décorateurs permettent de définir les relations entre les modèles.
 */

import { addRelationMetadata, RelationType } from './metadata';
import Model from '../Model';

/**
 * Interface pour les options de relation HasOne
 */
export interface HasOneOptions {
  foreignKey?: string;
  localKey?: string;
}

/**
 * Décorateur pour définir une relation HasOne
 * @param relatedModel Fonction retournant la classe du modèle lié
 * @param options Options de la relation
 */
export function HasOneRelation(
  relatedModel: () => typeof Model,
  options: HasOneOptions = {}
) {
  return function (target: any, propertyKey: string) {
    // Ajouter les métadonnées de la relation
    addRelationMetadata(target, propertyKey, {
      type: RelationType.HAS_ONE,
      relatedModel,
      foreignKey: options.foreignKey,
      localKey: options.localKey
    });
    
    // Définir un getter pour la propriété
    Object.defineProperty(target, propertyKey, {
      get: function() {
        // Créer une instance de la relation HasOne
        return this.hasOne(
          relatedModel(),
          options.foreignKey,
          options.localKey
        );
      },
      configurable: true
    });
  };
}

/**
 * Interface pour les options de relation HasMany
 */
export interface HasManyOptions {
  foreignKey?: string;
  localKey?: string;
}

/**
 * Décorateur pour définir une relation HasMany
 * @param relatedModel Fonction retournant la classe du modèle lié
 * @param options Options de la relation
 */
export function HasManyRelation(
  relatedModel: () => typeof Model,
  options: HasManyOptions = {}
) {
  return function (target: any, propertyKey: string) {
    // Ajouter les métadonnées de la relation
    addRelationMetadata(target, propertyKey, {
      type: RelationType.HAS_MANY,
      relatedModel,
      foreignKey: options.foreignKey,
      localKey: options.localKey
    });
    
    // Définir un getter pour la propriété
    Object.defineProperty(target, propertyKey, {
      get: function() {
        // Créer une instance de la relation HasMany
        return this.hasMany(
          relatedModel(),
          options.foreignKey,
          options.localKey
        );
      },
      configurable: true
    });
  };
}

/**
 * Interface pour les options de relation BelongsTo
 */
export interface BelongsToOptions {
  foreignKey?: string;
  ownerKey?: string;
}

/**
 * Décorateur pour définir une relation BelongsTo
 * @param relatedModel Fonction retournant la classe du modèle lié
 * @param options Options de la relation
 */
export function BelongsToRelation(
  relatedModel: () => typeof Model,
  options: BelongsToOptions = {}
) {
  return function (target: any, propertyKey: string) {
    // Ajouter les métadonnées de la relation
    addRelationMetadata(target, propertyKey, {
      type: RelationType.BELONGS_TO,
      relatedModel,
      foreignKey: options.foreignKey,
      localKey: options.ownerKey
    });
    
    // Définir un getter pour la propriété
    Object.defineProperty(target, propertyKey, {
      get: function() {
        // Créer une instance de la relation BelongsTo
        return this.belongsTo(
          relatedModel(),
          options.foreignKey,
          options.ownerKey
        );
      },
      configurable: true
    });
  };
}

/**
 * Interface pour les options de relation BelongsToMany
 */
export interface BelongsToManyOptions {
  pivotTable?: string;
  foreignPivotKey?: string;
  relatedPivotKey?: string;
  parentKey?: string;
  relatedKey?: string;
}

/**
 * Décorateur pour définir une relation BelongsToMany
 * @param relatedModel Fonction retournant la classe du modèle lié
 * @param options Options de la relation
 */
export function BelongsToManyRelation(
  relatedModel: () => typeof Model,
  options: BelongsToManyOptions = {}
) {
  return function (target: any, propertyKey: string) {
    // Ajouter les métadonnées de la relation
    addRelationMetadata(target, propertyKey, {
      type: RelationType.BELONGS_TO_MANY,
      relatedModel,
      pivotTable: options.pivotTable,
      foreignPivotKey: options.foreignPivotKey,
      relatedPivotKey: options.relatedPivotKey,
      localKey: options.parentKey,
      foreignKey: options.relatedKey
    });
    
    // Définir un getter pour la propriété
    Object.defineProperty(target, propertyKey, {
      get: function() {
        // Créer une instance de la relation BelongsToMany
        return this.belongsToMany(
          relatedModel(),
          options.pivotTable,
          options.foreignPivotKey,
          options.relatedPivotKey,
          options.parentKey,
          options.relatedKey
        );
      },
      configurable: true
    });
  };
}
