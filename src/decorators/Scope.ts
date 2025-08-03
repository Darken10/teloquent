/**
 * Décorateur pour les scopes locaux dans Teloquent
 * 
 * Ce décorateur permet de marquer une méthode comme un scope local,
 * ce qui permet de l'utiliser directement dans les requêtes.
 */

import 'reflect-metadata';

const SCOPE_METADATA_KEY = 'teloquent:scopes';

/**
 * Décorateur pour marquer une méthode comme un scope local
 * 
 * @example
 * class User extends Model {
 *   @Scope()
 *   public static active(query: QueryBuilder<User>): QueryBuilder<User> {
 *     return query.where('active', true);
 *   }
 * }
 * 
 * // Utilisation: User.query().active().get();
 */
export function Scope() {
  return function(
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    // Vérifier que la méthode est statique
    if (target.constructor === Function) {
      throw new Error(`Le décorateur @Scope ne peut être utilisé que sur des méthodes statiques`);
    }

    // Récupérer les scopes existants ou initialiser un nouveau tableau
    const existingScopes: string[] = Reflect.getMetadata(SCOPE_METADATA_KEY, target.constructor) || [];
    
    // Ajouter ce scope à la liste
    existingScopes.push(propertyKey);
    
    // Enregistrer les métadonnées mises à jour
    Reflect.defineMetadata(SCOPE_METADATA_KEY, existingScopes, target.constructor);
    
    return descriptor;
  };
}

/**
 * Récupère tous les scopes locaux décorés d'une classe
 * 
 * @param target La classe cible
 */
export function getScopeMetadata(target: any): string[] {
  return Reflect.getMetadata(SCOPE_METADATA_KEY, target) || [];
}

/**
 * Vérifie si une méthode est un scope local (avec le préfixe 'scope')
 * 
 * @param methodName Nom de la méthode
 */
export function isScopeMethod(methodName: string): boolean {
  return methodName.startsWith('scope') && methodName.length > 5 && methodName[5] === methodName[5].toUpperCase();
}

/**
 * Extrait le nom du scope à partir du nom de la méthode
 * 
 * @param methodName Nom de la méthode (avec préfixe 'scope')
 */
export function extractScopeName(methodName: string): string {
  if (!isScopeMethod(methodName)) {
    throw new Error(`Le nom de méthode '${methodName}' n'est pas un scope valide`);
  }
  
  // Extraire le nom du scope et le convertir en camelCase
  const scopeName = methodName.substring(5);
  return scopeName.charAt(0).toLowerCase() + scopeName.slice(1);
}
