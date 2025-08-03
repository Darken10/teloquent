# QueryBuilder

Le QueryBuilder de Teloquent offre une API fluide et chainable pour construire des requêtes SQL complexes de manière intuitive et typée.

## Concepts de base

Le QueryBuilder est accessible via la méthode statique `query()` de n'importe quel modèle. Il permet de construire des requêtes SQL sans avoir à écrire de SQL brut.

```typescript
import User from './models/User';

// Obtenir une instance du QueryBuilder
const query = User.query();
```

## Récupération de données

### Récupérer tous les enregistrements

```typescript
// Récupérer tous les utilisateurs
const users = await User.query().get();
```

### Récupérer un seul enregistrement

```typescript
// Récupérer le premier enregistrement
const user = await User.query().first();

// Récupérer par ID
const user = await User.find(1);
// Équivalent à:
const user = await User.query().where('id', 1).first();

// Récupérer par ID ou échouer
const user = await User.findOrFail(1); // Lance une exception si non trouvé
```

### Récupérer une colonne spécifique

```typescript
// Récupérer une liste de valeurs d'une colonne
const emails = await User.query().pluck('email');
```

## Clauses Where

### Conditions simples

```typescript
// Égalité
const users = await User.query().where('active', true).get();

// Différentes opérateurs
const users = await User.query()
  .where('age', '>', 18)
  .where('status', '<>', 'inactive')
  .get();
```

### Conditions multiples

```typescript
// AND (implicite)
const users = await User.query()
  .where('active', true)
  .where('age', '>', 18)
  .get();

// OR
const users = await User.query()
  .where('active', true)
  .orWhere('role', 'admin')
  .get();
```

### Conditions groupées

```typescript
// Grouper des conditions
const users = await User.query()
  .where('active', true)
  .where(query => {
    query.where('role', 'admin')
      .orWhere('role', 'moderator');
  })
  .get();

// Équivalent SQL:
// SELECT * FROM users WHERE active = true AND (role = 'admin' OR role = 'moderator')
```

### Conditions sur les colonnes

```typescript
// Comparer deux colonnes
const users = await User.query()
  .whereColumn('updated_at', '>', 'created_at')
  .get();
```

### Conditions IN

```typescript
// IN
const users = await User.query()
  .whereIn('id', [1, 2, 3])
  .get();

// NOT IN
const users = await User.query()
  .whereNotIn('id', [1, 2, 3])
  .get();
```

### Conditions NULL

```typescript
// IS NULL
const users = await User.query()
  .whereNull('deleted_at')
  .get();

// IS NOT NULL
const users = await User.query()
  .whereNotNull('email_verified_at')
  .get();
```

### Conditions de date

```typescript
// Date
const posts = await Post.query()
  .whereDate('created_at', '2023-01-01')
  .get();

// Mois
const posts = await Post.query()
  .whereMonth('created_at', 1) // Janvier
  .get();

// Année
const posts = await Post.query()
  .whereYear('created_at', 2023)
  .get();
```

### Recherche de texte

```typescript
// LIKE
const users = await User.query()
  .where('name', 'like', 'John%')
  .get();

// Recherche insensible à la casse (selon le SGBD)
const users = await User.query()
  .where('name', 'ilike', 'john%')
  .get();
```

## Tri et limite

### Tri

```typescript
// Tri ascendant
const users = await User.query()
  .orderBy('name')
  .get();

// Tri descendant
const users = await User.query()
  .orderBy('created_at', 'desc')
  .get();

// Tri multiple
const users = await User.query()
  .orderBy('role')
  .orderBy('name')
  .get();
```

### Limite et décalage

```typescript
// Limiter le nombre de résultats
const users = await User.query()
  .limit(10)
  .get();

// Sauter des résultats (offset)
const users = await User.query()
  .offset(10)
  .limit(10)
  .get();

// Pagination manuelle
const page = 2;
const perPage = 15;
const users = await User.query()
  .offset((page - 1) * perPage)
  .limit(perPage)
  .get();
```

## Pagination

Teloquent offre des méthodes de pagination intégrées.

```typescript
// Pagination simple
const result = await User.query().paginate(1, 15);
// result = {
//   data: Collection<User>, // Les données de la page actuelle
//   total: 100,            // Nombre total d'enregistrements
//   per_page: 15,          // Nombre d'enregistrements par page
//   current_page: 1,       // Page actuelle
//   last_page: 7,          // Dernière page
//   from: 1,               // Premier index de la page
//   to: 15                 // Dernier index de la page
// }

// Accès aux données paginées
result.data.each(user => {
  console.log(user.name);
});

// Pagination par chunks
await User.query().chunk(100, async (users, page) => {
  console.log(`Traitement de la page ${page}`);
  // Traiter le chunk d'utilisateurs
});

// Récupérer une page spécifique
const page3 = await User.query().forPage(3, 20).get();
```

## Jointures

### Jointure interne (INNER JOIN)

```typescript
const users = await User.query()
  .join('posts', 'users.id', '=', 'posts.user_id')
  .select('users.*', 'posts.title')
  .get();
```

### Jointure externe (LEFT JOIN)

```typescript
const users = await User.query()
  .leftJoin('posts', 'users.id', '=', 'posts.user_id')
  .select('users.*', 'posts.title')
  .get();
```

### Jointure avec conditions

```typescript
const users = await User.query()
  .join('posts', query => {
    query.on('users.id', '=', 'posts.user_id')
      .where('posts.published', true);
  })
  .select('users.*', 'posts.title')
  .get();
```

## Agrégations

### Count

```typescript
// Compter les enregistrements
const count = await User.query().count();

// Compter avec une condition
const activeCount = await User.query()
  .where('active', true)
  .count();

// Compter une colonne spécifique
const emailCount = await User.query()
  .countDistinct('email');
```

### Sum, Avg, Min, Max

```typescript
// Somme
const totalViews = await Post.query().sum('views');

// Moyenne
const avgAge = await User.query().avg('age');

// Minimum
const minPrice = await Product.query().min('price');

// Maximum
const maxPrice = await Product.query().max('price');
```

### Groupement

```typescript
// Grouper par catégorie
const postsByCategory = await Post.query()
  .select('category')
  .selectRaw('COUNT(*) as post_count')
  .groupBy('category')
  .get();

// Grouper avec condition HAVING
const popularCategories = await Post.query()
  .select('category')
  .selectRaw('COUNT(*) as post_count')
  .groupBy('category')
  .having('post_count', '>', 10)
  .get();
```

## Requêtes avancées

### Sous-requêtes

```typescript
// Sous-requête dans SELECT
const users = await User.query()
  .select('users.*')
  .selectSub(
    Post.query()
      .whereColumn('posts.user_id', 'users.id')
      .selectRaw('COUNT(*)')
      .as('post_count')
  )
  .get();

// Sous-requête dans WHERE
const users = await User.query()
  .whereExists(
    Post.query()
      .whereColumn('posts.user_id', 'users.id')
      .where('posts.published', true)
  )
  .get();
```

### Requêtes brutes

```typescript
// Sélection brute
const users = await User.query()
  .selectRaw('COUNT(*) as user_count, active')
  .groupBy('active')
  .get();

// Condition brute
const users = await User.query()
  .whereRaw('YEAR(created_at) = ?', [2023])
  .get();

// Ordre brut
const users = await User.query()
  .orderByRaw('FIELD(status, "active", "pending", "inactive")')
  .get();
```

### Requêtes conditionnelles

```typescript
// Appliquer une condition si...
const query = User.query();

if (hasAdminAccess) {
  query.withTrashed(); // Inclure les enregistrements soft deleted
}

if (searchTerm) {
  query.where('name', 'like', `%${searchTerm}%`);
}

const users = await query.get();
```

### Requêtes avec relations

```typescript
// Filtrer par relation
const users = await User.query()
  .whereHas('posts', query => {
    query.where('published', true);
  })
  .get();

// Filtrer par nombre de relations
const popularAuthors = await User.query()
  .withCount('posts')
  .having('posts_count', '>', 5)
  .get();

// Charger des relations avec le QueryBuilder
const users = await User.query()
  .with('posts', query => {
    query.where('published', true)
      .orderBy('created_at', 'desc');
  })
  .get();
```

## Insertion, mise à jour et suppression

### Insertion

```typescript
// Insérer un enregistrement
const userId = await User.query().insertGetId({
  name: 'John Doe',
  email: 'john@example.com',
  password: 'password123'
});

// Insérer plusieurs enregistrements
await User.query().insert([
  { name: 'John', email: 'john@example.com' },
  { name: 'Jane', email: 'jane@example.com' }
]);
```

### Mise à jour

```typescript
// Mettre à jour un enregistrement
await User.query()
  .where('id', 1)
  .update({ name: 'John Updated' });

// Mettre à jour ou insérer
await User.query()
  .updateOrInsert(
    { email: 'john@example.com' }, // Condition
    { name: 'John Doe', active: true } // Valeurs
  );

// Incrémenter / Décrémenter
await Post.query()
  .where('id', 1)
  .increment('views', 1);

await Product.query()
  .where('id', 1)
  .decrement('stock', 5);
```

### Suppression

```typescript
// Supprimer par ID
await User.query()
  .where('id', 1)
  .delete();

// Supprimer avec condition
await User.query()
  .where('active', false)
  .delete();

// Tronquer la table (supprimer tous les enregistrements)
await User.query().truncate();
```

## Soft Deletes

Si votre modèle utilise le décorateur `@SoftDeletes`, les enregistrements ne seront pas réellement supprimés de la base de données, mais marqués comme supprimés avec un timestamp dans la colonne `deleted_at`.

```typescript
// Inclure les enregistrements soft deleted
const allUsers = await User.query()
  .withTrashed()
  .get();

// Uniquement les enregistrements soft deleted
const deletedUsers = await User.query()
  .onlyTrashed()
  .get();

// Restaurer les enregistrements soft deleted
await User.query()
  .where('id', 1)
  .restore();

// Supprimer définitivement
await User.query()
  .where('id', 1)
  .forceDelete();
```

## Transactions

Les transactions permettent d'exécuter plusieurs requêtes comme une seule unité atomique.

```typescript
import { DB } from 'teloquent';

// Utilisation basique
await DB.transaction(async (trx) => {
  // Toutes les requêtes dans cette fonction utilisent la même transaction
  const user = await User.query(trx)
    .where('email', 'john@example.com')
    .first();
  
  await Post.query(trx).insert({
    title: 'New Post',
    user_id: user.id
  });
});

// Gestion manuelle des transactions
const trx = await DB.beginTransaction();

try {
  const user = await User.query(trx)
    .where('email', 'john@example.com')
    .first();
  
  await Post.query(trx).insert({
    title: 'New Post',
    user_id: user.id
  });
  
  await trx.commit();
} catch (error) {
  await trx.rollback();
  throw error;
}
```

## Déboguer les requêtes

```typescript
// Afficher la requête SQL générée
const query = User.query().where('active', true);
console.log(query.toSql());

// Afficher les paramètres de la requête
console.log(query.getBindings());

// Activer le mode debug pour toutes les requêtes
import { DB } from 'teloquent';
DB.enableQueryLog();

// Récupérer le journal des requêtes
const queries = DB.getQueryLog();
```

## Bonnes pratiques

### Réutiliser les requêtes avec des scopes

Les scopes permettent de définir des requêtes courantes et de les réutiliser.

```typescript
// Dans le modèle
class User extends Model {
  public static scopeActive(query: QueryBuilder<User>): QueryBuilder<User> {
    return query.where('active', true);
  }
  
  public static scopeOfRole(query: QueryBuilder<User>, role: string): QueryBuilder<User> {
    return query.where('role', role);
  }
}

// Utilisation
const activeAdmins = await User.query()
  .active()
  .ofRole('admin')
  .get();
```

### Éviter les requêtes N+1

Utilisez toujours le chargement anticipé des relations pour éviter le problème N+1.

```typescript
// Mauvais
const posts = await Post.all();
for (const post of posts) {
  const author = await post.user; // Une requête par post
}

// Bon
const posts = await Post.query().with('user').get();
```

### Utiliser les collections

Le QueryBuilder retourne des instances de `Collection` qui offrent de nombreuses méthodes utiles pour manipuler les données.

```typescript
const users = await User.query().get();

// Filtrer après récupération
const activeUsers = users.filter(user => user.active);

// Transformer les données
const userNames = users.map(user => user.name);

// Grouper les résultats
const usersByRole = users.groupBy('role');
```

Pour plus d'informations sur les Collections, consultez la [documentation des Collections](./collections.md).
