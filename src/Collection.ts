/**
 * Classe Collection pour l'ORM Teloquent
 * 
 * Cette classe fournit des méthodes utilitaires pour manipuler des ensembles de modèles,
 * similaire aux collections de Laravel.
 */

import Model from './Model';

/**
 * Classe Collection pour manipuler des ensembles de modèles
 */
export class Collection<T extends Model> {
  /**
   * Les éléments de la collection
   */
  protected items: T[];

  /**
   * Constructeur de la collection
   * @param items Éléments initiaux de la collection
   */
  constructor(items: T[] = []) {
    this.items = items;
  }

  /**
   * Crée une nouvelle instance de Collection
   * @param items Éléments de la collection
   */
  public static make<T extends Model>(items: T[] = []): Collection<T> {
    return new Collection<T>(items);
  }

  /**
   * Retourne tous les éléments de la collection
   */
  public all(): T[] {
    return this.items;
  }

  /**
   * Retourne le premier élément de la collection
   */
  public first(): T | undefined {
    return this.items[0];
  }

  /**
   * Retourne le dernier élément de la collection
   */
  public last(): T | undefined {
    return this.items[this.items.length - 1];
  }

  /**
   * Retourne le nombre d'éléments dans la collection
   */
  public count(): number {
    return this.items.length;
  }

  /**
   * Vérifie si la collection est vide
   */
  public isEmpty(): boolean {
    return this.items.length === 0;
  }

  /**
   * Vérifie si la collection n'est pas vide
   */
  public isNotEmpty(): boolean {
    return !this.isEmpty();
  }

  /**
   * Retourne l'élément à l'index spécifié
   * @param index Index de l'élément
   */
  public get(index: number): T | undefined {
    return this.items[index];
  }

  /**
   * Ajoute un élément à la collection
   * @param item Élément à ajouter
   */
  public push(item: T): this {
    this.items.push(item);
    return this;
  }

  /**
   * Ajoute plusieurs éléments à la collection
   * @param items Éléments à ajouter
   */
  public concat(items: T[]): Collection<T> {
    return new Collection<T>(this.items.concat(items));
  }

  /**
   * Filtre les éléments de la collection
   * @param callback Fonction de filtrage
   */
  public filter(callback: (item: T, index: number) => boolean): Collection<T> {
    return new Collection<T>(this.items.filter(callback));
  }

  /**
   * Transforme les éléments de la collection
   * @param callback Fonction de transformation
   */
  public map<U>(callback: (item: T, index: number) => U): Collection<U> {
    return new Collection<U>(this.items.map(callback));
  }

  /**
   * Réduit les éléments de la collection à une seule valeur
   * @param callback Fonction de réduction
   * @param initialValue Valeur initiale
   */
  public reduce<U>(callback: (carry: U, item: T) => U, initialValue: U): U {
    return this.items.reduce(callback, initialValue);
  }

  /**
   * Applique une fonction à chaque élément de la collection
   * @param callback Fonction à appliquer
   */
  public each(callback: (item: T, index: number) => void): this {
    this.items.forEach(callback);
    return this;
  }

  /**
   * Trie les éléments de la collection
   * @param compareFunction Fonction de comparaison
   */
  public sort(compareFunction?: (a: T, b: T) => number): Collection<T> {
    const sorted = [...this.items];
    sorted.sort(compareFunction);
    return new Collection<T>(sorted);
  }

  /**
   * Trie les éléments de la collection par une clé
   * @param key Clé de tri
   * @param direction Direction de tri (asc ou desc)
   */
  public sortBy(key: keyof T, direction: 'asc' | 'desc' = 'asc'): Collection<T> {
    return this.sort((a, b) => {
      const valueA = a[key];
      const valueB = b[key];
      
      if (valueA === valueB) {
        return 0;
      }
      
      if (direction === 'asc') {
        return valueA < valueB ? -1 : 1;
      } else {
        return valueA > valueB ? -1 : 1;
      }
    });
  }

  /**
   * Retourne une tranche de la collection
   * @param start Index de début
   * @param end Index de fin (optionnel)
   */
  public slice(start: number, end?: number): Collection<T> {
    return new Collection<T>(this.items.slice(start, end));
  }

  /**
   * Retourne les n premiers éléments de la collection
   * @param n Nombre d'éléments
   */
  public take(n: number): Collection<T> {
    return this.slice(0, n);
  }

  /**
   * Retourne les n derniers éléments de la collection
   * @param n Nombre d'éléments
   */
  public takeLast(n: number): Collection<T> {
    return this.slice(-n);
  }

  /**
   * Groupe les éléments de la collection par une clé
   * @param key Clé de groupement
   */
  public groupBy(key: keyof T): Record<string, Collection<T>> {
    const groups: Record<string, Collection<T>> = {};
    
    this.each((item) => {
      const groupKey = String(item[key]);
      
      if (!groups[groupKey]) {
        groups[groupKey] = new Collection<T>([]);
      }
      
      groups[groupKey].push(item);
    });
    
    return groups;
  }

  /**
   * Trouve un élément dans la collection
   * @param callback Fonction de recherche
   */
  public find(callback: (item: T) => boolean): T | undefined {
    return this.items.find(callback);
  }

  /**
   * Trouve l'index d'un élément dans la collection
   * @param callback Fonction de recherche
   */
  public findIndex(callback: (item: T) => boolean): number {
    return this.items.findIndex(callback);
  }

  /**
   * Vérifie si un élément existe dans la collection
   * @param callback Fonction de vérification
   */
  public contains(callback: (item: T) => boolean): boolean {
    return this.findIndex(callback) !== -1;
  }

  /**
   * Extrait une liste de valeurs pour une clé donnée
   * @param key Clé à extraire
   */
  public pluck<K extends keyof T>(key: K): Collection<T[K]> {
    return this.map(item => item[key]);
  }

  /**
   * Retourne un objet avec des clés et des valeurs extraites de la collection
   * @param keyField Champ à utiliser comme clé
   * @param valueField Champ à utiliser comme valeur
   */
  public keyBy<K extends keyof T, V extends keyof T>(keyField: K, valueField: V): Record<string, T[V]> {
    const result: Record<string, T[V]> = {};
    
    this.each((item) => {
      const key = String(item[keyField]);
      result[key] = item[valueField];
    });
    
    return result;
  }

  /**
   * Retourne un tableau des valeurs uniques pour une clé donnée
   * @param key Clé à extraire
   */
  public unique<K extends keyof T>(key: K): Collection<T[K]> {
    const uniqueValues = new Set<T[K]>();
    
    this.each((item) => {
      uniqueValues.add(item[key]);
    });
    
    return new Collection<T[K]>(Array.from(uniqueValues));
  }

  /**
   * Retourne la somme des valeurs pour une clé donnée
   * @param key Clé à additionner
   */
  public sum<K extends keyof T>(key: K): number {
    return this.reduce((total, item) => {
      const value = item[key];
      return total + (typeof value === 'number' ? value : 0);
    }, 0);
  }

  /**
   * Retourne la moyenne des valeurs pour une clé donnée
   * @param key Clé à moyenner
   */
  public avg<K extends keyof T>(key: K): number {
    if (this.isEmpty()) {
      return 0;
    }
    
    return this.sum(key) / this.count();
  }

  /**
   * Retourne la valeur minimale pour une clé donnée
   * @param key Clé à comparer
   */
  public min<K extends keyof T>(key: K): number | undefined {
    if (this.isEmpty()) {
      return undefined;
    }
    
    return this.reduce((min, item) => {
      const value = item[key];
      if (typeof value !== 'number') {
        return min;
      }
      
      return min === undefined || value < min ? value : min;
    }, undefined as number | undefined);
  }

  /**
   * Retourne la valeur maximale pour une clé donnée
   * @param key Clé à comparer
   */
  public max<K extends keyof T>(key: K): number | undefined {
    if (this.isEmpty()) {
      return undefined;
    }
    
    return this.reduce((max, item) => {
      const value = item[key];
      if (typeof value !== 'number') {
        return max;
      }
      
      return max === undefined || value > max ? value : max;
    }, undefined as number | undefined);
  }

  /**
   * Divise la collection en plusieurs collections de taille spécifiée
   * @param size Taille des chunks
   */
  public chunk(size: number): Collection<Collection<T>> {
    const chunks = new Collection<Collection<T>>();
    
    for (let i = 0; i < this.items.length; i += size) {
      chunks.push(new Collection<T>(this.items.slice(i, i + size)));
    }
    
    return chunks;
  }

  /**
   * Fusionne les éléments de la collection en un seul tableau
   */
  public flatten<U>(): Collection<U> {
    const result: U[] = [];
    
    this.each((item: any) => {
      if (Array.isArray(item)) {
        result.push(...item);
      } else {
        result.push(item);
      }
    });
    
    return new Collection<U>(result);
  }

  /**
   * Inverse l'ordre des éléments de la collection
   */
  public reverse(): Collection<T> {
    return new Collection<T>([...this.items].reverse());
  }

  /**
   * Mélange les éléments de la collection
   */
  public shuffle(): Collection<T> {
    const items = [...this.items];
    
    for (let i = items.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [items[i], items[j]] = [items[j], items[i]];
    }
    
    return new Collection<T>(items);
  }

  /**
   * Convertit la collection en tableau
   */
  public toArray(): T[] {
    return [...this.items];
  }

  /**
   * Convertit la collection en objet JSON
   */
  public toJSON(): Record<string, any>[] {
    return this.items.map(item => item.toJSON());
  }

  /**
   * Implémentation de l'itérateur pour permettre l'utilisation de for...of
   */
  public [Symbol.iterator](): Iterator<T> {
    let index = 0;
    const items = this.items;
    
    return {
      next(): IteratorResult<T> {
        if (index < items.length) {
          return { value: items[index++], done: false };
        } else {
          return { value: undefined as any, done: true };
        }
      }
    };
  }
}

export default Collection;
