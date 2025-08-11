/**
 * Classe de base Model pour l'ORM Teloquent
 * 
 * Cette classe implémente le pattern Active Record et fournit
 * les fonctionnalités de base pour interagir avec la base de données.
 */

import { Knex } from 'knex';
import pluralize from 'pluralize';
import QueryBuilder from './QueryBuilder';
import Collection from './Collection';
import { Connection } from './utils/connection';
import { HasOne, HasMany, BelongsTo, BelongsToMany } from './relations';
import { ModelMetadata, getModelMetadata } from './decorators/metadata';
import { GlobalScope, GlobalScopeCallback, ScopeManager } from './scopes';

export type ModelAttributes = Record<string, any>;
export type ModelRelations = Record<string, any>;

export default abstract class Model {
  // Propriétés statiques qui peuvent être surchargées par les classes dérivées
  protected static tableName: string;
  protected static primaryKey: string = 'id';
  protected static connection: string = 'default';
  protected static usesTimestamps: boolean = true;
  protected static usesSoftDeletes: boolean = false;
  
  // Colonnes de timestamps
  protected static CREATED_AT: string = 'created_at';
  protected static UPDATED_AT: string = 'updated_at';
  protected static DELETED_AT: string = 'deleted_at';

  // Attributs du modèle
  protected attributes: ModelAttributes = {};
  protected original: ModelAttributes = {};
  protected relations: ModelRelations = {};
  protected exists: boolean = false;

  /**
   * Constructeur du modèle
   * @param attributes Attributs initiaux du modèle
   */
  constructor(attributes: ModelAttributes = {}) {
    this.fill(attributes);
  }

  /**
   * Remplit le modèle avec les attributs fournis
   * @param attributes Attributs à remplir
   */
  public fill(attributes: ModelAttributes): this {
    Object.keys(attributes).forEach(key => {
      this.setAttribute(key, attributes[key]);
    });
    return this;
  }

  /**
   * Définit un attribut sur le modèle
   * @param key Clé de l'attribut
   * @param value Valeur de l'attribut
   */
  public setAttribute(key: string, value: any): this {
    this.attributes[key] = value;
    return this;
  }

  /**
   * Récupère un attribut du modèle
   * @param key Clé de l'attribut
   * @param defaultValue Valeur par défaut si l'attribut n'existe pas
   */
  public getAttribute(key: string, defaultValue: any = null): any {
    return key in this.attributes ? this.attributes[key] : defaultValue;
  }

  /**
   * Récupère tous les attributs du modèle
   */
  public getAttributes(): ModelAttributes {
    return { ...this.attributes };
  }

  /**
   * Récupère la valeur de la clé primaire du modèle
   */
  public getKey(): any {
    return this.getAttribute(this.constructor.prototype.getPrimaryKey());
  }

  /**
   * Vérifie si le modèle existe dans la base de données
   */
  public getExists(): boolean {
    return this.exists;
  }

  /**
   * Définit si le modèle existe dans la base de données
   */
  public setExists(exists: boolean): this {
    this.exists = exists;
    return this;
  }

  /**
   * Récupère une relation chargée
   * @param key Nom de la relation
   */
  public getRelation(key: string): any {
    return this.relations[key] || null;
  }

  /**
   * Définit une relation sur le modèle
   * @param key Nom de la relation
   * @param value Valeur de la relation
   */
  public setRelation(key: string, value: any): this {
    this.relations[key] = value;
    return this;
  }

  /**
   * Récupère toutes les relations chargées
   */
  public getRelations(): ModelRelations {
    return { ...this.relations };
  }

  /**
   * Récupère le nom de la table pour ce modèle
   */
  public static getTableName(): string {
    if (this.tableName) {
      return this.tableName;
    }

    // Utiliser les métadonnées si disponibles
    const metadata = getModelMetadata(this);
    if (metadata && metadata.tableName) {
      return metadata.tableName;
    }

    // Sinon, utiliser le nom de la classe au pluriel et en snake_case
    return pluralize(this.name.replace(/([a-z])([A-Z])/g, '$1_$2').toLowerCase());
  }

  /**
   * Récupère le nom de la table pour ce modèle (instance)
   */
  public getTable(): string {
    return (this.constructor as typeof Model).getTableName();
  }

  /**
   * Récupère le nom de la clé primaire pour ce modèle
   */
  public static getPrimaryKey(): string {
    // Utiliser les métadonnées si disponibles
    const metadata = getModelMetadata(this);
    if (metadata && metadata.primaryKey) {
      return metadata.primaryKey;
    }

    return this.primaryKey;
  }

  /**
   * Récupère le nom de la clé primaire pour ce modèle (instance)
   */
  public getPrimaryKey(): string {
    return (this.constructor as typeof Model).getPrimaryKey();
  }

  /**
   * Récupère la connexion à la base de données pour ce modèle
   */
  protected static getConnection(): Knex {
    return Connection.getConnection(this.connection);
  }

  /**
   * Récupère le query builder pour ce modèle
   */
  public static query<T extends typeof Model>(this: T): QueryBuilder<InstanceType<T>> {
    return new QueryBuilder<InstanceType<T>>(this);
  }

  /**
   * Trouve un modèle par sa clé primaire
   * @param id Valeur de la clé primaire
   */
  public static async find<T extends typeof Model>(this: T, id: any): Promise<InstanceType<T> | null> {
    return this.query().find(id) as Promise<InstanceType<T> | null>;
  }

  /**
   * Trouve plusieurs modèles par leurs clés primaires
   * @param ids Valeurs des clés primaires
   */
  public static async findMany<T extends typeof Model>(this: T, ids: any[]): Promise<InstanceType<T>[]> {
    return this.query().findMany(ids) as Promise<InstanceType<T>[]>;
  }

  /**
   * Récupère le premier modèle correspondant aux critères
   * @param conditions Conditions de recherche
   */
  public static async first<T extends typeof Model>(
    this: T,
    conditions: Record<string, any> = {}
  ): Promise<InstanceType<T> | null> {
    return this.query().where(conditions).first() as Promise<InstanceType<T> | null>;
  }

  /**
   * Récupère tous les modèles de la base de données
   */
  public static async all<T extends typeof Model>(this: T): Promise<Collection<InstanceType<T>>> {
    return this.query().get();
  }

  /**
   * Crée un nouveau modèle avec les attributs fournis
   * @param attributes Attributs du nouveau modèle
   */
  public static async create<T extends typeof Model>(
    this: T,
    attributes: ModelAttributes
  ): Promise<InstanceType<T>> {
    // Utiliser this comme constructeur pour créer une instance
    // Le cast est nécessaire car TypeScript ne comprend pas que this est un constructeur
    const model = new (this as any)(attributes) as InstanceType<T>;
    await model.save();
    return model;
  }

  /**
   * Définit une clause where sur le query builder
   * @param column Colonne ou conditions
   * @param operator Opérateur ou valeur
   * @param value Valeur (optionnelle)
   */
  public static where<T extends typeof Model>(
    this: T,
    column: string | Record<string, any>,
    operator?: any,
    value?: any
  ): QueryBuilder<InstanceType<T>> {
    return this.query().where(column, operator, value);
  }

  /**
   * Définit une clause orWhere sur le query builder
   * @param column Colonne ou conditions
   * @param operator Opérateur ou valeur
   * @param value Valeur (optionnelle)
   */
  public static orWhere<T extends typeof Model>(
    this: T,
    column: string | Record<string, any>,
    operator?: any,
    value?: any
  ): QueryBuilder<InstanceType<T>> {
    return this.query().orWhere(column, operator, value);
  }

  /**
   * Définit une clause orderBy sur le query builder
   * @param column Colonne
   * @param direction Direction (asc ou desc)
   */
  public static orderBy<T extends typeof Model>(
    this: T,
    column: string,
    direction: 'asc' | 'desc' = 'asc'
  ): QueryBuilder<InstanceType<T>> {
    return this.query().orderBy(column, direction);
  }

  /**
   * Définit une clause limit sur le query builder
   * @param limit Limite
   */
  public static limit<T extends typeof Model>(this: T, limit: number): QueryBuilder<InstanceType<T>> {
    return this.query().limit(limit);
  }

  /**
   * Définit une clause offset sur le query builder
   * @param offset Offset
   */
  public static offset<T extends typeof Model>(this: T, offset: number): QueryBuilder<InstanceType<T>> {
    return this.query().offset(offset);
  }

  /**
   * Définit une clause with sur le query builder pour le eager loading
   * @param relations Relations à charger
   */
  public static with<T extends typeof Model>(
    this: T,
    ...relations: string[]
  ): QueryBuilder<InstanceType<T>> {
    return this.query().with(...relations);
  }

  /**
   * Définit une clause withCount sur le query builder
   * @param relations Relations à compter
   */
  public static withCount<T extends typeof Model>(
    this: T,
    ...relations: string[]
  ): QueryBuilder<InstanceType<T>> {
    return this.query().withCount(...relations);
  }

  /**
   * Enregistre le modèle dans la base de données
   */
  public async save(): Promise<this> {
    const query = (this.constructor as typeof Model).query();
    const attributes = this.getAttributes();
    const primaryKey = this.getPrimaryKey();
    const now = new Date();

    // Ajouter les timestamps si nécessaire
    if ((this.constructor as typeof Model).usesTimestamps) {
      const createdAt = (this.constructor as typeof Model).CREATED_AT;
      const updatedAt = (this.constructor as typeof Model).UPDATED_AT;

      if (!this.exists && !attributes[createdAt]) {
        attributes[createdAt] = now;
      }

      if (updatedAt && !attributes[updatedAt]) {
        attributes[updatedAt] = now;
      }
    }

    if (this.exists) {
      // Mise à jour d'un modèle existant
      const id = this.getKey();
      if (id !== undefined) {
        await query.where(primaryKey, id).update(attributes);
      }
    } else {
      // Création d'un nouveau modèle
      const [id] = await query.insert(attributes);
      if (id !== undefined) {
        this.setAttribute(primaryKey, id);
        this.setExists(true);
      }
    }

    // Mettre à jour les attributs originaux
    this.original = { ...this.attributes };

    return this;
  }

  /**
   * Met à jour le modèle avec les attributs fournis
   * @param attributes Attributs à mettre à jour
   */
  public async update(attributes: ModelAttributes): Promise<this> {
    this.fill(attributes);
    return this.save();
  }

  /**
   * Supprime le modèle de la base de données
   */
  public async delete(): Promise<boolean> {
    if (!this.exists) {
      return false;
    }

    const query = (this.constructor as typeof Model).query();
    const primaryKey = this.getPrimaryKey();
    const id = this.getKey();

    if ((this.constructor as typeof Model).usesSoftDeletes) {
      // Soft delete
      const deletedAt = (this.constructor as typeof Model).DELETED_AT;
      await query.where(primaryKey, id).update({ [deletedAt]: new Date() });
    } else {
      // Hard delete
      await query.where(primaryKey, id).delete();
    }

    this.setExists(false);
    return true;
  }

  /**
   * Restaure un modèle soft-deleted
   */
  public async restore(): Promise<boolean> {
    if (!this.exists || !(this.constructor as typeof Model).usesSoftDeletes) {
      return false;
    }

    const query = (this.constructor as typeof Model).query();
    const primaryKey = this.getPrimaryKey();
    const id = this.getKey();
    const deletedAt = (this.constructor as typeof Model).DELETED_AT;

    await query.where(primaryKey, id).update({ [deletedAt]: null });
    this.setAttribute(deletedAt, null);
    return true;
  }

  /**
   * Définit une relation hasOne
   * @param related Classe du modèle lié
   * @param foreignKey Clé étrangère (optionnelle)
   * @param localKey Clé locale (optionnelle)
   */
  public hasOne<T extends typeof Model>(
    related: T,
    foreignKey?: string,
    localKey?: string
  ): HasOne<InstanceType<T>> {
    const instance = new HasOne<InstanceType<T>>(
      related,
      this,
      foreignKey || `${this.constructor.name.toLowerCase()}_id`,
      localKey || this.getPrimaryKey()
    );
    return instance as HasOne<InstanceType<T>>;
  }

  /**
   * Définit une relation hasMany
   * @param related Classe du modèle lié
   * @param foreignKey Clé étrangère (optionnelle)
   * @param localKey Clé locale (optionnelle)
   */
  public hasMany<T extends typeof Model>(
    related: T,
    foreignKey?: string,
    localKey?: string
  ): HasMany<InstanceType<T>> {
    const instance = new HasMany<InstanceType<T>>(
      related,
      this,
      foreignKey || `${this.constructor.name.toLowerCase()}_id`,
      localKey || this.getPrimaryKey()
    );
    return instance as HasMany<InstanceType<T>>;
  }

  /**
   * Définit une relation belongsTo
   * @param related Classe du modèle lié
   * @param foreignKey Clé étrangère (optionnelle)
   * @param ownerKey Clé du propriétaire (optionnelle)
   */
  public belongsTo<T extends typeof Model>(
    related: T,
    foreignKey?: string,
    ownerKey?: string
  ): BelongsTo<InstanceType<T>> {
    // Utiliser le nom de la classe plutôt que d'instancier la classe abstraite
    const foreignKeyName = foreignKey || `${related.name.toLowerCase()}_id`;
    // Utiliser la clé primaire par défaut si ownerKey n'est pas fourni
    const defaultOwnerKey = 'id';
    
    const instance = new BelongsTo<InstanceType<T>>(
      related,
      this,
      foreignKeyName,
      ownerKey || defaultOwnerKey
    );
    return instance as BelongsTo<InstanceType<T>>;
  }

  /**
   * Définit une relation belongsToMany
   * @param related Classe du modèle lié
   * @param pivotTable Table pivot (optionnelle)
   * @param foreignPivotKey Clé étrangère pivot (optionnelle)
   * @param relatedPivotKey Clé pivot liée (optionnelle)
   * @param parentKey Clé parente (optionnelle)
   * @param relatedKey Clé liée (optionnelle)
   */
  public belongsToMany<T extends typeof Model>(
    related: T,
    pivotTable?: string,
    foreignPivotKey?: string,
    relatedPivotKey?: string,
    parentKey?: string,
    relatedKey?: string
  ): BelongsToMany<InstanceType<T>> {
    // Utiliser le nom de la table plutôt que d'instancier la classe abstraite
    const relatedTableName = related.prototype.getTable ? related.prototype.getTable() : related.name.toLowerCase() + 's';
    
    // Déterminer le nom de la table pivot si non fourni
    const table = pivotTable || [
      this.getTable(),
      relatedTableName
    ].sort().join('_');
    
    // Déterminer les noms des clés si non fournis
    const foreignKey = foreignPivotKey || `${this.constructor.name.toLowerCase()}_id`;
    const relatedPivotKeyName = relatedPivotKey || `${related.name.toLowerCase()}_id`;
    
    // Clés primaires par défaut
    const defaultParentKey = this.getPrimaryKey();
    const defaultRelatedKey = 'id';
    
    const instance = new BelongsToMany<InstanceType<T>>(
      related,
      this,
      table,
      foreignKey,
      relatedPivotKeyName,
      parentKey || defaultParentKey,
      relatedKey || defaultRelatedKey
    );
    
    return instance as BelongsToMany<InstanceType<T>>;
  }

  /**
   * Méthode magique pour accéder aux attributs et relations
   */
  public async __get(key: string): Promise<any> {
    // Vérifier si c'est un attribut
    if (key in this.attributes) {
      return this.getAttribute(key);
    }

    // Vérifier si c'est une relation déjà chargée
    if (key in this.relations) {
      return this.getRelation(key);
    }

    // Vérifier si c'est une méthode de relation
    if (typeof (this as any)[key] === 'function') {
      const relation = (this as any)[key]();
      if (
        relation instanceof HasOne ||
        relation instanceof HasMany ||
        relation instanceof BelongsTo ||
        relation instanceof BelongsToMany
      ) {
        // Lazy loading de la relation
        const result = await relation.getResults();
        this.setRelation(key, result);
        return result;
      }
    }

    return undefined;
  }

  /**
   * Convertit le modèle en objet JSON
   */
  public toJSON(): Record<string, any> {
    const attributes = this.getAttributes();
    const relations = this.getRelations();
    
    return {
      ...attributes,
      ...Object.keys(relations).reduce((acc, key) => {
        const relation = relations[key];
        if (relation instanceof Collection) {
          acc[key] = relation.toJSON();
        } else if (relation instanceof Model) {
          acc[key] = relation.toJSON();
        } else if (Array.isArray(relation)) {
          acc[key] = relation.map(item => item.toJSON());
        } else {
          acc[key] = relation;
        }
        return acc;
      }, {} as Record<string, any>)
    };
  }
  
  /**
   * Crée une nouvelle collection à partir d'un tableau de modèles
   * @param models Modèles à inclure dans la collection
   */
  public static newCollection<T extends Model>(models: T[] = []): Collection<T> {
    return new Collection<T>(models);
  }
  
  /**
   * Ajoute un scope global au modèle
   * 
   * @param scope Le scope global ou une fonction de rappel
   * @param name Le nom du scope (optionnel, requis si scope est une fonction)
   */
  public static addGlobalScope<T extends typeof Model>(
    this: T,
    scope: GlobalScope | GlobalScopeCallback,
    name?: string
  ): void {
    ScopeManager.addGlobalScope(this, scope, name);
  }
  
  /**
   * Supprime un scope global du modèle
   * 
   * @param scope Le scope global à supprimer (classe ou nom)
   */
  public static removeGlobalScope<T extends typeof Model>(
    this: T,
    scope: Function | string
  ): boolean {
    return ScopeManager.removeGlobalScope(this, scope);
  }
  
  /**
   * Récupère tous les scopes globaux du modèle
   */
  public static getGlobalScopes<T extends typeof Model>(
    this: T
  ): Map<string | Function, GlobalScope | GlobalScopeCallback> {
    return ScopeManager.getGlobalScopes(this);
  }
}
