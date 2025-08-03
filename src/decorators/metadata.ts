/**
 * Système de métadonnées pour les décorateurs
 * 
 * Ce fichier fournit les fonctions et interfaces pour stocker et récupérer
 * les métadonnées des modèles, colonnes et relations.
 */

import 'reflect-metadata';
import Model from '../Model';

// Clés de métadonnées
const MODEL_METADATA_KEY = 'teloquent:model';
const COLUMN_METADATA_KEY = 'teloquent:column';
const RELATION_METADATA_KEY = 'teloquent:relation';

// Types de relations
export enum RelationType {
  HAS_ONE = 'hasOne',
  HAS_MANY = 'hasMany',
  BELONGS_TO = 'belongsTo',
  BELONGS_TO_MANY = 'belongsToMany'
}

// Interface pour les métadonnées de modèle
export interface ModelMetadata {
  tableName?: string;
  primaryKey?: string;
  timestamps?: boolean;
  softDeletes?: boolean;
  columns: ColumnMetadata[];
  relations: RelationMetadata[];
}

// Interface pour les métadonnées de colonne
export interface ColumnMetadata {
  propertyKey: string;
  columnName?: string;
  isPrimary?: boolean;
  type?: string;
  nullable?: boolean;
  defaultValue?: any;
  cast?: string;
}

// Interface pour les métadonnées de relation
export interface RelationMetadata {
  propertyKey: string;
  type: RelationType;
  relatedModel: () => typeof Model;
  foreignKey?: string;
  localKey?: string;
  pivotTable?: string;
  foreignPivotKey?: string;
  relatedPivotKey?: string;
}

/**
 * Récupère ou initialise les métadonnées d'un modèle
 * @param target Classe du modèle
 */
export function getModelMetadata(target: any): ModelMetadata {
  if (!Reflect.hasMetadata(MODEL_METADATA_KEY, target)) {
    Reflect.defineMetadata(MODEL_METADATA_KEY, {
      columns: [],
      relations: []
    }, target);
  }
  
  return Reflect.getMetadata(MODEL_METADATA_KEY, target);
}

/**
 * Définit les métadonnées d'un modèle
 * @param target Classe du modèle
 * @param metadata Métadonnées à définir
 */
export function setModelMetadata(target: any, metadata: Partial<ModelMetadata>): void {
  const existingMetadata = getModelMetadata(target);
  Reflect.defineMetadata(MODEL_METADATA_KEY, {
    ...existingMetadata,
    ...metadata
  }, target);
}

/**
 * Ajoute les métadonnées d'une colonne à un modèle
 * @param target Classe du modèle
 * @param propertyKey Nom de la propriété
 * @param metadata Métadonnées de la colonne
 */
export function addColumnMetadata(
  target: any,
  propertyKey: string,
  metadata: Partial<ColumnMetadata>
): void {
  const modelMetadata = getModelMetadata(target.constructor);
  
  // Vérifier si la colonne existe déjà
  const existingColumnIndex = modelMetadata.columns.findIndex(
    column => column.propertyKey === propertyKey
  );
  
  if (existingColumnIndex !== -1) {
    // Mettre à jour la colonne existante
    modelMetadata.columns[existingColumnIndex] = {
      ...modelMetadata.columns[existingColumnIndex],
      ...metadata,
      propertyKey
    };
  } else {
    // Ajouter une nouvelle colonne
    modelMetadata.columns.push({
      propertyKey,
      ...metadata
    });
  }
  
  // Mettre à jour les métadonnées du modèle
  setModelMetadata(target.constructor, { columns: modelMetadata.columns });
}

/**
 * Ajoute les métadonnées d'une relation à un modèle
 * @param target Classe du modèle
 * @param propertyKey Nom de la propriété
 * @param metadata Métadonnées de la relation
 */
export function addRelationMetadata(
  target: any,
  propertyKey: string,
  metadata: Partial<RelationMetadata>
): void {
  const modelMetadata = getModelMetadata(target.constructor);
  
  // Vérifier si la relation existe déjà
  const existingRelationIndex = modelMetadata.relations.findIndex(
    relation => relation.propertyKey === propertyKey
  );
  
  if (existingRelationIndex !== -1) {
    // Mettre à jour la relation existante
    modelMetadata.relations[existingRelationIndex] = {
      ...modelMetadata.relations[existingRelationIndex],
      ...metadata,
      propertyKey
    } as RelationMetadata;
  } else {
    // Ajouter une nouvelle relation
    modelMetadata.relations.push({
      propertyKey,
      ...metadata
    } as RelationMetadata);
  }
  
  // Mettre à jour les métadonnées du modèle
  setModelMetadata(target.constructor, { relations: modelMetadata.relations });
}

/**
 * Récupère les métadonnées d'une colonne
 * @param target Classe du modèle
 * @param propertyKey Nom de la propriété
 */
export function getColumnMetadata(target: any, propertyKey: string): ColumnMetadata | undefined {
  const modelMetadata = getModelMetadata(target);
  return modelMetadata.columns.find(column => column.propertyKey === propertyKey);
}

/**
 * Récupère les métadonnées d'une relation
 * @param target Classe du modèle
 * @param propertyKey Nom de la propriété
 */
export function getRelationMetadata(target: any, propertyKey: string): RelationMetadata | undefined {
  const modelMetadata = getModelMetadata(target);
  return modelMetadata.relations.find(relation => relation.propertyKey === propertyKey);
}
