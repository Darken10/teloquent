/**
 * Décorateur Table pour l'ORM Teloquent
 * 
 * Ce décorateur permet de définir le nom de la table pour un modèle.
 */

import { setModelMetadata } from './metadata';

/**
 * Décorateur pour définir le nom de la table d'un modèle
 * @param tableName Nom de la table
 */
export function Table(tableName: string) {
  return function (target: Function) {
    // Définir les métadonnées du modèle
    setModelMetadata(target, { tableName });
    
    // Définir la propriété tableName sur la classe
    Object.defineProperty(target, 'tableName', {
      value: tableName,
      writable: false,
      configurable: true
    });
    
    return target;
  };
}
