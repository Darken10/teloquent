/**
 * Décorateurs Timestamps et SoftDeletes pour l'ORM Teloquent
 * 
 * Ces décorateurs permettent d'activer les timestamps automatiques
 * et le soft delete sur un modèle.
 */

import { setModelMetadata, addColumnMetadata } from './metadata';

/**
 * Interface pour les options de timestamps
 */
export interface TimestampsOptions {
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Décorateur pour activer les timestamps automatiques sur un modèle
 * @param options Options des timestamps
 */
export function Timestamps(options: TimestampsOptions = {}) {
  return function (target: Function) {
    // Définir les métadonnées du modèle
    setModelMetadata(target, { timestamps: true });
    
    // Définir la propriété usesTimestamps sur la classe
    Object.defineProperty(target, 'usesTimestamps', {
      value: true,
      writable: false,
      configurable: true
    });
    
    // Définir les noms des colonnes de timestamps
    if (options.createdAt) {
      Object.defineProperty(target, 'CREATED_AT', {
        value: options.createdAt,
        writable: false,
        configurable: true
      });
    }
    
    if (options.updatedAt) {
      Object.defineProperty(target, 'UPDATED_AT', {
        value: options.updatedAt,
        writable: false,
        configurable: true
      });
    }
    
    // Ajouter les colonnes de timestamps au prototype
    const prototype = target.prototype;
    
    // Colonne created_at
    addColumnMetadata(prototype, options.createdAt || 'created_at', {
      columnName: options.createdAt || 'created_at',
      type: 'timestamp',
      nullable: true
    });
    
    // Colonne updated_at
    addColumnMetadata(prototype, options.updatedAt || 'updated_at', {
      columnName: options.updatedAt || 'updated_at',
      type: 'timestamp',
      nullable: true
    });
    
    return target;
  };
}

/**
 * Interface pour les options de soft delete
 */
export interface SoftDeletesOptions {
  deletedAt?: string;
}

/**
 * Décorateur pour activer le soft delete sur un modèle
 * @param options Options du soft delete
 */
export function SoftDeletes(options: SoftDeletesOptions = {}) {
  return function (target: Function) {
    // Définir les métadonnées du modèle
    setModelMetadata(target, { softDeletes: true });
    
    // Définir la propriété usesSoftDeletes sur la classe
    Object.defineProperty(target, 'usesSoftDeletes', {
      value: true,
      writable: false,
      configurable: true
    });
    
    // Définir le nom de la colonne deleted_at
    if (options.deletedAt) {
      Object.defineProperty(target, 'DELETED_AT', {
        value: options.deletedAt,
        writable: false,
        configurable: true
      });
    }
    
    // Ajouter la colonne deleted_at au prototype
    const prototype = target.prototype;
    
    addColumnMetadata(prototype, options.deletedAt || 'deleted_at', {
      columnName: options.deletedAt || 'deleted_at',
      type: 'timestamp',
      nullable: true
    });
    
    return target;
  };
}
