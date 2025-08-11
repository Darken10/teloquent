/**
 * Relation BelongsToMany pour l'ORM Teloquent
 * 
 * Cette classe représente une relation many-to-many entre deux modèles,
 * utilisant une table pivot pour stocker les associations.
 */

// Définir le type KnexQuery localement pour éviter les problèmes d'importation
type KnexQuery = any;
import Model from '../Model';
import QueryBuilder from '../QueryBuilder';
import Relation from './Relation';
import { Connection } from '../utils/connection';

export default class BelongsToMany<T extends Model> extends Relation<T> {
  // Table pivot pour la relation
  protected table: string;
  
  // Clé étrangère du modèle parent dans la table pivot
  protected foreignPivotKey: string;
  
  // Clé étrangère du modèle lié dans la table pivot
  protected relatedPivotKey: string;
  
  // Clé du modèle parent
  protected parentKey: string;
  
  // Clé du modèle lié
  protected relatedKey: string;
  
  // Attributs supplémentaires pour la table pivot
  protected pivotColumns: string[] = [];

  /**
   * Constructeur de la relation BelongsToMany
   * @param related Classe du modèle lié
   * @param parent Modèle parent
   * @param table Table pivot
   * @param foreignPivotKey Clé étrangère du modèle parent dans la table pivot
   * @param relatedPivotKey Clé étrangère du modèle lié dans la table pivot
   * @param parentKey Clé du modèle parent
   * @param relatedKey Clé du modèle lié
   */
  constructor(
    related: typeof Model,
    parent: Model,
    table: string,
    foreignPivotKey: string,
    relatedPivotKey: string,
    parentKey: string,
    relatedKey: string
  ) {
    super(related, parent);
    
    this.table = table;
    this.foreignPivotKey = foreignPivotKey;
    this.relatedPivotKey = relatedPivotKey;
    this.parentKey = parentKey;
    this.relatedKey = relatedKey;
    
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
    // Récupérer la valeur de la clé du modèle parent
    const parentKeyValue = this.parent.getAttribute(this.parentKey);
    
    if (parentKeyValue !== undefined && parentKeyValue !== null) {
      this.setJoin();
      
      // Ajouter la contrainte sur la clé étrangère du modèle parent dans la table pivot
      this.query.where(`${this.table}.${this.foreignPivotKey}`, parentKeyValue);
    }
  }

  /**
   * Ajoute les contraintes pour l'eager loading
   * @param models Modèles parents
   */
  protected addEagerConstraints(models: Model[]): void {
    this.setJoin();
    
    // Récupérer toutes les valeurs de clé du modèle parent
    const keys = models
      .map(model => model.getAttribute(this.parentKey))
      .filter(key => key !== undefined && key !== null);
    
    // Ajouter la contrainte whereIn sur la clé étrangère du modèle parent dans la table pivot
    this.query.whereIn(`${this.table}.${this.foreignPivotKey}`, keys);
  }

  /**
   * Configure la jointure entre la table du modèle lié et la table pivot
   */
  protected setJoin(): void {
    const baseQuery = this.query.getQuery();
    const relatedTable = this.related.getTableName();
    
    // Vérifier si la jointure existe déjà
    const joinExists = (baseQuery as any)._statements?.some(
      (statement: any) => statement.type === 'join' && statement.table === this.table
    );
    
    if (!joinExists) {
      // Ajouter la jointure
      this.query.getQuery().join(
        this.table,
        `${relatedTable}.${this.relatedKey}`,
        '=',
        `${this.table}.${this.relatedPivotKey}`
      );
      
      // Sélectionner les colonnes du modèle lié et de la table pivot
      this.query.getQuery().select(`${relatedTable}.*`);
      
      // Ajouter les colonnes de la table pivot si nécessaire
      if (this.pivotColumns.length > 0) {
        this.pivotColumns.forEach(column => {
          this.query.getQuery().select(`${this.table}.${column} as pivot_${column}`);
        });
      }
    }
  }

  /**
   * Définit les colonnes supplémentaires à récupérer de la table pivot
   * @param columns Colonnes à récupérer
   */
  public withPivot(...columns: string[]): this {
    this.pivotColumns = [...this.pivotColumns, ...columns];
    return this;
  }

  /**
   * Associe les résultats aux modèles parents
   * @param models Modèles parents
   * @param results Résultats de la relation
   * @param relation Nom de la relation
   */
  protected matchResults(models: Model[], results: T[], relation: string): void {
    // Récupérer les informations de la table pivot pour chaque résultat
    const pivotData: Record<string, Record<string, any>> = {};
    
    // Récupérer les données de la table pivot depuis les résultats
    results.forEach(result => {
      const attributes = (result as any).getAttributes();
      const pivotAttributes: Record<string, any> = {};
      
      // Extraire les attributs de la table pivot
      Object.keys(attributes).forEach(key => {
        if (key.startsWith('pivot_')) {
          const pivotKey = key.replace('pivot_', '');
          pivotAttributes[pivotKey] = attributes[key];
        }
      });
      
      // Stocker les données de la table pivot
      const foreignPivotValue = pivotAttributes[this.foreignPivotKey];
      const relatedPivotValue = pivotAttributes[this.relatedPivotKey];
      
      if (foreignPivotValue !== undefined && relatedPivotValue !== undefined) {
        const pivotKey = `${foreignPivotValue}_${relatedPivotValue}`;
        pivotData[pivotKey] = pivotAttributes;
      }
    });
    
    // Créer un dictionnaire des résultats groupés par clé étrangère du modèle parent
    const dictionary: Record<string | number, T[]> = {};
    
    results.forEach(result => {
      // Récupérer la valeur de la clé étrangère du modèle parent dans la table pivot
      const pivotAttributes = (result as any).getAttributes();
      let foreignPivotValue: any = null;
      
      // Chercher la valeur dans les attributs pivot
      Object.keys(pivotAttributes).forEach(key => {
        if (key === `pivot_${this.foreignPivotKey}`) {
          foreignPivotValue = pivotAttributes[key];
        }
      });
      
      if (foreignPivotValue !== undefined && foreignPivotValue !== null) {
        if (!dictionary[foreignPivotValue]) {
          dictionary[foreignPivotValue] = [];
        }
        
        // Ajouter les informations de la table pivot au résultat
        const relatedPivotValue = result.getAttribute(this.relatedKey);
        if (relatedPivotValue !== undefined && relatedPivotValue !== null) {
          const pivotKey = `${foreignPivotValue}_${relatedPivotValue}`;
          (result as any).pivot = pivotData[pivotKey] || {};
        }
        
        dictionary[foreignPivotValue].push(result);
      }
    });
    
    // Associer chaque groupe de résultats au modèle parent correspondant
    models.forEach(model => {
      const key = model.getAttribute(this.parentKey);
      if (key !== undefined && key !== null && dictionary[key]) {
        model.setRelation(relation, dictionary[key]);
      } else {
        model.setRelation(relation, []);
      }
    });
  }

  /**
   * Récupère la requête pour compter les relations
   * @param models Modèles parents
   */
  protected async getCountQuery(models: Model[]): Promise<Record<string, number>> {
    // Récupérer toutes les valeurs de clé du modèle parent
    const keys = models
      .map(model => model.getAttribute(this.parentKey))
      .filter(key => key !== undefined && key !== null);
    
    // Récupérer la connexion à la base de données
    const connection = (this.related as any).getConnection();
    
    // Exécuter la requête de comptage groupée par clé étrangère du modèle parent
    const results = await connection
      .table(this.table)
      .select(this.foreignPivotKey)
      .count('* as count')
      .whereIn(this.foreignPivotKey, keys)
      .groupBy(this.foreignPivotKey);
    
    // Convertir les résultats en dictionnaire
    const counts: Record<string, number> = {};
    results.forEach((result: Record<string, any>) => {
      counts[result[this.foreignPivotKey]] = Number(result.count);
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
      const key = model.getAttribute(this.parentKey);
      const relationCountName = `${relation}_count`;
      
      if (key !== undefined && key !== null && results[key]) {
        model.setAttribute(relationCountName, results[key]);
      } else {
        model.setAttribute(relationCountName, 0);
      }
    });
  }

  /**
   * Récupère le query builder pour la table pivot
   */
  protected getPivotQuery(): KnexQuery {
    const connection = (this.related as any).getConnection();
    return connection.table(this.table);
  }

  /**
   * Attache un ou plusieurs modèles liés au modèle parent
   * @param ids IDs des modèles à attacher
   * @param attributes Attributs supplémentaires pour la table pivot
   */
  public async attach(
    ids: any | any[],
    attributes: Record<string, any> = {}
  ): Promise<void> {
    const records = this.formatAttachRecords(ids, attributes);
    
    if (records.length === 0) {
      return;
    }
    
    await this.getPivotQuery().insert(records);
  }

  /**
   * Détache un ou plusieurs modèles liés du modèle parent
   * @param ids IDs des modèles à détacher (null pour tous)
   */
  public async detach(ids: any | any[] | null = null): Promise<number> {
    const query = this.getPivotQuery().where(
      this.foreignPivotKey,
      this.parent.getAttribute(this.parentKey)
    );
    
    // Si des IDs sont spécifiés, ajouter une contrainte whereIn
    if (ids !== null) {
      const idsArray = Array.isArray(ids) ? ids : [ids];
      query.whereIn(this.relatedPivotKey, idsArray);
    }
    
    return await query.delete();
  }

  /**
   * Synchronise les modèles liés avec ceux fournis
   * @param ids IDs des modèles à synchroniser
   * @param attributes Attributs supplémentaires pour la table pivot
   */
  public async sync(
    ids: any | any[],
    attributes: Record<string, any> = {}
  ): Promise<void> {
    // Détacher tous les modèles existants
    await this.detach();
    
    // Attacher les nouveaux modèles
    if (ids && (Array.isArray(ids) ? ids.length > 0 : true)) {
      await this.attach(ids, attributes);
    }
  }

  /**
   * Met à jour les attributs de la table pivot pour un ou plusieurs modèles liés
   * @param ids IDs des modèles à mettre à jour
   * @param attributes Attributs à mettre à jour
   */
  public async updateExistingPivot(
    ids: any | any[],
    attributes: Record<string, any>
  ): Promise<number> {
    if (Object.keys(attributes).length === 0) {
      return 0;
    }
    
    const idsArray = Array.isArray(ids) ? ids : [ids];
    
    return await this.getPivotQuery()
      .where(this.foreignPivotKey, this.parent.getAttribute(this.parentKey))
      .whereIn(this.relatedPivotKey, idsArray)
      .update(attributes);
  }

  /**
   * Formate les enregistrements pour l'attachement
   * @param ids IDs des modèles à attacher
   * @param attributes Attributs supplémentaires pour la table pivot
   */
  protected formatAttachRecords(
    ids: any | any[],
    attributes: Record<string, any> = {}
  ): Record<string, any>[] {
    const records: Record<string, any>[] = [];
    const parentId = this.parent.getAttribute(this.parentKey);
    
    if (parentId === undefined || parentId === null) {
      return records;
    }
    
    const idsArray = Array.isArray(ids)
      ? ids
      : ids instanceof Model
        ? [ids.getAttribute(this.relatedKey)]
        : [ids];
    
    idsArray.forEach(id => {
      if (id !== undefined && id !== null) {
        records.push({
          [this.foreignPivotKey]: parentId,
          [this.relatedPivotKey]: id,
          ...attributes
        });
      }
    });
    
    return records;
  }

  /**
   * Crée un nouveau modèle lié et l'attache au modèle parent
   * @param attributes Attributs du nouveau modèle
   * @param pivotAttributes Attributs supplémentaires pour la table pivot
   */
  public async create(
    attributes: Record<string, any> = {},
    pivotAttributes: Record<string, any> = {}
  ): Promise<T> {
    // Créer le nouveau modèle
    const instance = await this.related.create(attributes) as T;
    
    // Attacher le nouveau modèle au parent
    await this.attach(instance.getAttribute(this.relatedKey), pivotAttributes);
    
    // Ajouter les informations de la table pivot au modèle
    (instance as any).pivot = pivotAttributes;
    
    // Récupérer la relation actuelle
    const relationName = this.getRelationName();
    const currentRelation = this.parent.getRelation(relationName) || [];
    
    // Ajouter le nouveau modèle à la relation
    if (Array.isArray(currentRelation)) {
      currentRelation.push(instance);
      this.parent.setRelation(relationName, currentRelation);
    } else {
      this.parent.setRelation(relationName, [instance]);
    }
    
    return instance;
  }

  /**
   * Crée plusieurs nouveaux modèles liés et les attache au modèle parent
   * @param records Attributs des nouveaux modèles
   * @param pivotAttributes Attributs supplémentaires pour la table pivot
   */
  public async createMany(
    records: Record<string, any>[] = [],
    pivotAttributes: Record<string, any> = {}
  ): Promise<T[]> {
    if (records.length === 0) {
      return [];
    }
    
    const instances: T[] = [];
    
    // Créer chaque modèle individuellement
    for (const attributes of records) {
      const instance = await this.create(attributes, pivotAttributes);
      instances.push(instance);
    }
    
    return instances;
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
