/**
 * Décorateurs Column et PrimaryKey pour l'ORM Teloquent
 * 
 * Ces décorateurs permettent de définir les colonnes d'un modèle
 * et leurs propriétés.
 */

import { addColumnMetadata, setModelMetadata } from './metadata';

/**
 * Interface pour les options de colonne
 */
export interface ColumnOptions {
  name?: string;
  type?: string;
  nullable?: boolean;
  defaultValue?: any;
  cast?: string;
}

/**
 * Décorateur pour définir une colonne d'un modèle
 * @param options Options de la colonne
 */
export function Column(options: ColumnOptions = {}) {
  return function (target: any, propertyKey: string) {
    // Ajouter les métadonnées de la colonne
    addColumnMetadata(target, propertyKey, {
      columnName: options.name || propertyKey,
      type: options.type,
      nullable: options.nullable,
      defaultValue: options.defaultValue,
      cast: options.cast
    });
  };
}

/**
 * Décorateur pour définir une colonne comme clé primaire
 * @param options Options de la colonne
 */
export function PrimaryKey(options: ColumnOptions = {}) {
  return function (target: any, propertyKey: string) {
    // Ajouter les métadonnées de la colonne
    addColumnMetadata(target, propertyKey, {
      columnName: options.name || propertyKey,
      type: options.type || 'increments',
      nullable: false,
      defaultValue: options.defaultValue,
      cast: options.cast,
      isPrimary: true
    });
    
    // Définir la propriété primaryKey sur la classe
    setModelMetadata(target.constructor, { primaryKey: propertyKey });
    
    // Définir la propriété primaryKey sur la classe
    Object.defineProperty(target.constructor, 'primaryKey', {
      value: propertyKey,
      writable: false,
      configurable: true
    });
  };
}
