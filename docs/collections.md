# Teloquent Collections

## Introduction

Les Collections dans Teloquent sont inspirées des Collections de Laravel. Elles fournissent une couche d'abstraction élégante et fluide pour travailler avec des ensembles de modèles. Au lieu de manipuler des tableaux bruts de modèles, les Collections offrent une API riche et chainable pour transformer, filtrer, trier et manipuler vos données.

## Obtenir des Collections

Dans Teloquent, les méthodes qui retournent plusieurs modèles retournent désormais des instances de `Collection` au lieu de tableaux simples :

```typescript
// Récupérer tous les utilisateurs (retourne une Collection)
const users = await User.all();

// Récupérer des utilisateurs avec des conditions (retourne une Collection)
const activeUsers = await User.query().where('active', true).get();

// Paginer les résultats (retourne une Collection dans la propriété data)
const paginatedUsers = await User.query().paginate(1, 15);
console.log(paginatedUsers.data); // Collection d'utilisateurs
```

## Méthodes disponibles

### Création et conversion

| Méthode | Description |
|---------|-------------|
| `Model.newCollection(items)` | Crée une nouvelle Collection à partir d'un tableau de modèles |
| `collection.toArray()` | Convertit la Collection en tableau simple |
| `collection.toJSON()` | Convertit la Collection en tableau d'objets JSON |

```typescript
// Création d'une Collection à partir d'un tableau
const posts = [
  new Post({ title: 'Premier article' }),
  new Post({ title: 'Deuxième article' })
];
const collection = Model.newCollection(posts);

// Conversion en tableau
const array = collection.toArray();

// Conversion en JSON
const json = collection.toJSON();
```

### Accès aux éléments

| Méthode | Description |
|---------|-------------|
| `collection.all()` | Récupère tous les éléments de la Collection |
| `collection.get(index)` | Récupère l'élément à l'index spécifié |
| `collection.first()` | Récupère le premier élément de la Collection |
| `collection.last()` | Récupère le dernier élément de la Collection |
| `collection.random()` | Récupère un élément aléatoire de la Collection |

```typescript
// Récupérer le premier élément
const firstPost = posts.first();

// Récupérer le dernier élément
const lastPost = posts.last();

// Récupérer un élément aléatoire
const randomPost = posts.random();
```

### Inspection

| Méthode | Description |
|---------|-------------|
| `collection.count()` | Retourne le nombre d'éléments dans la Collection |
| `collection.isEmpty()` | Vérifie si la Collection est vide |
| `collection.isNotEmpty()` | Vérifie si la Collection n'est pas vide |
| `collection.contains(callback)` | Vérifie si la Collection contient un élément correspondant au callback |

```typescript
// Vérifier le nombre d'éléments
const count = posts.count();

// Vérifier si la Collection est vide
if (posts.isEmpty()) {
  console.log('Aucun article trouvé');
}

// Vérifier si un élément existe
const hasFeatured = posts.contains(post => post.featured === true);
```

### Itération

| Méthode | Description |
|---------|-------------|
| `collection.each(callback)` | Itère sur chaque élément de la Collection |
| `collection.forEach(callback)` | Alias de each() |
| `collection.map(callback)` | Transforme chaque élément et retourne une nouvelle Collection |
| `collection.filter(callback)` | Filtre les éléments selon un callback et retourne une nouvelle Collection |
| `collection.reject(callback)` | Inverse de filter(), exclut les éléments correspondant au callback |
| `collection.reduce(callback, initial)` | Réduit la Collection à une seule valeur |

```typescript
// Itérer sur chaque élément
posts.each(post => {
  console.log(post.title);
});

// Transformer les éléments
const titles = posts.map(post => post.title);

// Filtrer les éléments
const publishedPosts = posts.filter(post => post.published === true);

// Réduire à une valeur unique
const totalViews = posts.reduce((total, post) => total + post.views, 0);
```

### Manipulation

| Méthode | Description |
|---------|-------------|
| `collection.pluck(key)` | Extrait une propriété de chaque élément |
| `collection.unique(key?)` | Retourne une Collection sans doublons |
| `collection.sortBy(key)` | Trie la Collection selon une clé |
| `collection.sortByDesc(key)` | Trie la Collection selon une clé en ordre décroissant |
| `collection.reverse()` | Inverse l'ordre des éléments |
| `collection.shuffle()` | Mélange aléatoirement les éléments |
| `collection.chunk(size)` | Divise la Collection en plusieurs Collections de taille spécifiée |
| `collection.take(count)` | Prend un nombre spécifié d'éléments |
| `collection.skip(count)` | Saute un nombre spécifié d'éléments |

```typescript
// Extraire une propriété de chaque élément
const titles = posts.pluck('title');

// Obtenir des valeurs uniques
const uniqueAuthors = posts.pluck('author_id').unique();

// Trier la Collection
const sortedPosts = posts.sortBy('created_at');
const newestFirst = posts.sortByDesc('created_at');

// Diviser en chunks
const chunks = posts.chunk(3);
chunks.each(chunk => {
  console.log(`Groupe de ${chunk.count()} articles`);
});
```

### Agrégation

| Méthode | Description |
|---------|-------------|
| `collection.sum(key?)` | Calcule la somme des valeurs |
| `collection.avg(key?)` | Calcule la moyenne des valeurs |
| `collection.min(key?)` | Trouve la valeur minimale |
| `collection.max(key?)` | Trouve la valeur maximale |
| `collection.groupBy(key)` | Groupe les éléments selon une clé |

```typescript
// Calculer la somme
const totalViews = posts.sum('views');

// Calculer la moyenne
const avgRating = posts.avg('rating');

// Trouver le minimum et maximum
const oldestDate = posts.min('created_at');
const newestDate = posts.max('created_at');

// Grouper par catégorie
const postsByCategory = posts.groupBy('category');
```

### Combinaison et comparaison

| Méthode | Description |
|---------|-------------|
| `collection.merge(items)` | Fusionne avec une autre Collection ou un tableau |
| `collection.concat(items)` | Concatène avec une autre Collection ou un tableau |
| `collection.diff(items)` | Retourne les éléments qui ne sont pas dans l'autre Collection |
| `collection.intersect(items)` | Retourne les éléments présents dans les deux Collections |

```typescript
// Fusionner des Collections
const allPosts = recentPosts.merge(oldPosts);

// Concaténer des Collections
const combinedPosts = featurePosts.concat(regularPosts);

// Différence entre Collections
const uniqueToPosts1 = posts1.diff(posts2);

// Intersection entre Collections
const inBothCollections = posts1.intersect(posts2);
```

### Pagination avec QueryBuilder

Le QueryBuilder de Teloquent offre des méthodes spéciales pour travailler avec des Collections paginées :

```typescript
// Paginer les résultats
const result = await Post.query().paginate(1, 15);
console.log(`Page ${result.current_page} sur ${result.last_page}`);
console.log(`${result.total} résultats au total`);
result.data.each(post => {
  console.log(post.title);
});

// Traiter les résultats par chunks
await Post.query().chunk(10, async (posts, page) => {
  console.log(`Traitement de la page ${page}`);
  await processItems(posts);
});

// Récupérer une page spécifique
const page3 = await Post.query().forPage(3, 20).get();
```

## Exemple complet

```typescript
import { Model } from '../src';
import User from './models/User';
import Post from './models/Post';

async function main() {
  // Récupérer tous les utilisateurs
  const users = await User.all();
  
  // Filtrer les utilisateurs actifs
  const activeUsers = users.filter(user => user.active === true);
  
  // Récupérer les posts avec leurs auteurs
  const posts = await Post.query().with('user').get();
  
  // Grouper les posts par auteur
  const postsByAuthor = posts.groupBy(post => post.user.name);
  
  // Afficher les statistiques
  console.log(`Nombre d'utilisateurs: ${users.count()}`);
  console.log(`Utilisateurs actifs: ${activeUsers.count()}`);
  console.log(`Nombre de posts: ${posts.count()}`);
  
  // Trouver les posts les plus populaires
  const popularPosts = posts
    .sortByDesc('views')
    .take(5);
  
  console.log('Posts les plus populaires:');
  popularPosts.each(post => {
    console.log(`- ${post.title} (${post.views} vues)`);
  });
  
  // Calculer la moyenne des vues par catégorie
  const avgViewsByCategory = posts
    .groupBy('category')
    .map((posts, category) => ({
      category,
      avgViews: posts.avg('views')
    }));
  
  console.log('Moyenne des vues par catégorie:');
  avgViewsByCategory.forEach(item => {
    console.log(`- ${item.category}: ${item.avgViews} vues en moyenne`);
  });
}

main();
```

## Intégration avec les relations

Les Collections fonctionnent parfaitement avec les relations de Teloquent. Lorsque vous chargez des relations qui retournent plusieurs modèles, elles sont automatiquement encapsulées dans des Collections :

```typescript
// Charger une relation hasMany
const user = await User.find(1);
const posts = await user.posts; // Retourne une Collection de posts

// Filtrer les posts de l'utilisateur
const publishedPosts = posts.filter(post => post.published === true);

// Charger plusieurs relations
const users = await User.query()
  .with('posts')
  .with('comments')
  .get();

users.each(user => {
  console.log(`${user.name} a écrit ${user.posts.count()} articles`);
  
  // Vous pouvez utiliser toutes les méthodes de Collection sur les relations
  const recentComments = user.comments
    .sortByDesc('created_at')
    .take(5);
});
```

## Création de Collections personnalisées

Vous pouvez étendre la classe Collection pour ajouter vos propres méthodes :

```typescript
import Collection from '../src/Collection';
import Post from './models/Post';

class PostCollection extends Collection<Post> {
  // Ajouter des méthodes spécifiques aux posts
  published() {
    return this.filter(post => post.published === true);
  }
  
  featured() {
    return this.filter(post => post.featured === true);
  }
  
  byCategory(category: string) {
    return this.filter(post => post.category === category);
  }
}

// Utilisation
const posts = new PostCollection([
  new Post({ title: 'Article 1', published: true, featured: false }),
  new Post({ title: 'Article 2', published: true, featured: true })
]);

const publishedPosts = posts.published();
const featuredPosts = posts.featured();
```

## Conclusion

Les Collections de Teloquent offrent une API puissante et expressive pour manipuler des ensembles de modèles. Elles simplifient considérablement le code nécessaire pour effectuer des opérations courantes sur vos données et rendent votre code plus lisible et maintenable.

En combinant les Collections avec le QueryBuilder et les relations de Teloquent, vous disposez d'un système complet et élégant pour travailler avec vos données, inspiré des meilleures pratiques de Laravel mais adapté à l'écosystème TypeScript.
