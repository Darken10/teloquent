# Fonctionnalités avancées

Ce document couvre les fonctionnalités avancées de Teloquent qui vous permettront de tirer pleinement parti de l'ORM dans des scénarios complexes.

## Table des matières

- [Événements de modèle](#événements-de-modèle)
- [Observateurs](#observateurs)
- [Accesseurs et mutateurs](#accesseurs-et-mutateurs)
- [Attributs calculés](#attributs-calculés)
- [Sérialisation personnalisée](#sérialisation-personnalisée)
- [Requêtes brutes](#requêtes-brutes)
- [Transactions](#transactions)
- [Gestion des connexions multiples](#gestion-des-connexions-multiples)
- [Polymorphisme](#polymorphisme)
- [Soft Deletes avancés](#soft-deletes-avancés)
- [Gestion de cache](#gestion-de-cache)
- [Optimisation des performances](#optimisation-des-performances)
- [Tests](#tests)
- [Extensibilité](#extensibilité)

## Événements de modèle

Teloquent fournit un système d'événements puissant qui vous permet de réagir aux différentes étapes du cycle de vie d'un modèle.

### Hooks de cycle de vie

```typescript
import { Model, Table, BeforeSave, AfterSave, BeforeDelete, AfterDelete } from 'teloquent';

@Table('users')
class User extends Model {
  @BeforeSave()
  public beforeSave(): void {
    // Exécuté avant la sauvegarde du modèle
    if (this.isDirty('password')) {
      this.password = hashPassword(this.password);
    }
  }
  
  @AfterSave()
  public afterSave(): void {
    // Exécuté après la sauvegarde du modèle
    if (this.wasRecentlyCreated) {
      this.sendWelcomeEmail();
    }
  }
  
  @BeforeDelete()
  public beforeDelete(): void {
    // Exécuté avant la suppression du modèle
    this.archiveUserData();
  }
  
  @AfterDelete()
  public afterDelete(): void {
    // Exécuté après la suppression du modèle
    this.notifyAdmins();
  }
}
```

### Événements globaux

Vous pouvez également écouter des événements au niveau global :

```typescript
import { Model, Event } from 'teloquent';

// Écouter tous les événements de sauvegarde
Event.listen('model.saving', (model: Model) => {
  console.log(`Saving model ${model.constructor.name} with ID ${model.id}`);
});

// Écouter les événements pour un modèle spécifique
Event.listen('user.created', (user: User) => {
  console.log(`New user created: ${user.name}`);
});
```

### Liste des événements disponibles

- `model.retrieving` : Avant de récupérer un modèle depuis la base de données
- `model.retrieved` : Après avoir récupéré un modèle
- `model.saving` : Avant de sauvegarder un modèle
- `model.saved` : Après avoir sauvegardé un modèle
- `model.creating` : Avant de créer un nouveau modèle
- `model.created` : Après avoir créé un nouveau modèle
- `model.updating` : Avant de mettre à jour un modèle existant
- `model.updated` : Après avoir mis à jour un modèle
- `model.deleting` : Avant de supprimer un modèle
- `model.deleted` : Après avoir supprimé un modèle
- `model.restoring` : Avant de restaurer un modèle soft-deleted
- `model.restored` : Après avoir restauré un modèle

## Observateurs

Les observateurs sont une alternative aux hooks de cycle de vie qui permettent d'extraire la logique d'événements dans des classes dédiées.

### Création d'un observateur

```typescript
import { ModelObserver } from 'teloquent';
import User from './models/User';

class UserObserver extends ModelObserver<User> {
  public creating(user: User): void {
    // Logique avant création
  }
  
  public created(user: User): void {
    // Logique après création
  }
  
  public updating(user: User): void {
    // Logique avant mise à jour
  }
  
  public updated(user: User): void {
    // Logique après mise à jour
  }
  
  public deleting(user: User): void {
    // Logique avant suppression
  }
  
  public deleted(user: User): void {
    // Logique après suppression
  }
}
```

### Enregistrement d'un observateur

```typescript
import { Observer } from 'teloquent';
import User from './models/User';
import UserObserver from './observers/UserObserver';

// Enregistrer l'observateur
Observer.observe(User, new UserObserver());
```

## Accesseurs et mutateurs

Les accesseurs et mutateurs vous permettent de transformer les données lors de la lecture ou de l'écriture.

### Accesseurs

```typescript
import { Model, Table, Column } from 'teloquent';

@Table('users')
class User extends Model {
  @Column()
  public first_name!: string;
  
  @Column()
  public last_name!: string;
  
  // Accesseur simple
  get name(): string {
    return `${this.first_name} ${this.last_name}`;
  }
  
  // Accesseur avec logique
  get formattedCreatedAt(): string {
    return this.created_at.toLocaleDateString();
  }
  
  // Accesseur pour une colonne existante
  get email(): string {
    return this.getAttribute('email').toLowerCase();
  }
}
```

### Mutateurs

```typescript
import { Model, Table, Column } from 'teloquent';

@Table('users')
class User extends Model {
  // Mutateur pour une colonne existante
  set email(value: string) {
    this.setAttribute('email', value.toLowerCase());
  }
  
  // Mutateur avec logique
  set password(value: string) {
    this.setAttribute('password', hashPassword(value));
  }
  
  // Mutateur pour un attribut calculé
  set name(value: string) {
    const parts = value.split(' ');
    this.first_name = parts[0] || '';
    this.last_name = parts.slice(1).join(' ') || '';
  }
}
```

### Accesseurs et mutateurs avec décorateurs

```typescript
import { Model, Table, Column, Accessor, Mutator } from 'teloquent';

@Table('users')
class User extends Model {
  @Column()
  public first_name!: string;
  
  @Column()
  public last_name!: string;
  
  @Accessor()
  public getFullNameAttribute(): string {
    return `${this.first_name} ${this.last_name}`;
  }
  
  @Mutator()
  public setFullNameAttribute(value: string): void {
    const parts = value.split(' ');
    this.first_name = parts[0] || '';
    this.last_name = parts.slice(1).join(' ') || '';
  }
}

// Utilisation
const user = new User();
user.full_name = 'John Doe'; // Utilise le mutateur
console.log(user.full_name); // Utilise l'accesseur, affiche "John Doe"
```

## Attributs calculés

Les attributs calculés sont des propriétés qui ne sont pas stockées dans la base de données mais calculées à partir d'autres attributs.

```typescript
import { Model, Table, Column, Computed } from 'teloquent';

@Table('products')
class Product extends Model {
  @Column()
  public price!: number;
  
  @Column()
  public tax_rate!: number;
  
  // Attribut calculé simple
  get priceWithTax(): number {
    return this.price * (1 + this.tax_rate / 100);
  }
  
  // Attribut calculé avec décorateur
  @Computed()
  public get discountedPrice(): number {
    return this.price * 0.9;
  }
  
  // Attribut calculé qui sera inclus dans la sérialisation
  @Computed({ serialize: true })
  public get formattedPrice(): string {
    return `$${this.price.toFixed(2)}`;
  }
}
```

## Sérialisation personnalisée

Teloquent offre plusieurs façons de personnaliser la sérialisation des modèles en JSON.

### Attributs cachés et visibles

```typescript
import { Model, Table } from 'teloquent';

@Table('users')
class User extends Model {
  // Attributs à cacher lors de la sérialisation
  public static hidden = ['password', 'remember_token'];
  
  // Alternative: spécifier uniquement les attributs visibles
  public static visible = ['id', 'name', 'email', 'created_at'];
}
```

### Appends

Vous pouvez inclure des attributs calculés dans la sérialisation :

```typescript
import { Model, Table } from 'teloquent';

@Table('users')
class User extends Model {
  // Attributs calculés à inclure dans la sérialisation
  public static appends = ['full_name', 'is_admin'];
  
  get fullName(): string {
    return `${this.first_name} ${this.last_name}`;
  }
  
  get isAdmin(): boolean {
    return this.role === 'admin';
  }
}
```

### Méthode toJSON personnalisée

```typescript
import { Model, Table } from 'teloquent';

@Table('users')
class User extends Model {
  public toJSON(): Record<string, any> {
    // Appeler la méthode parent
    const json = super.toJSON();
    
    // Ajouter des attributs personnalisés
    json.full_name = `${this.first_name} ${this.last_name}`;
    
    // Supprimer des attributs sensibles
    delete json.password;
    
    return json;
  }
}
```

### Sérialisation des relations

Par défaut, les relations chargées sont incluses dans la sérialisation :

```typescript
// Charger et sérialiser une relation
const user = await User.query().with('posts').first();
const json = user.toJSON(); // Inclut les posts

// Sérialiser avec des relations imbriquées
const user = await User.query()
  .with('posts.comments')
  .with('profile')
  .first();
const json = user.toJSON(); // Inclut les posts avec leurs commentaires et le profil
```

## Requêtes brutes

Pour les cas où le QueryBuilder ne suffit pas, vous pouvez exécuter des requêtes SQL brutes.

### Requêtes brutes avec DB

```typescript
import { DB } from 'teloquent';

// Requête SELECT brute
const users = await DB.raw('SELECT * FROM users WHERE active = ?', [true]);

// Requête INSERT brute
await DB.raw('INSERT INTO users (name, email) VALUES (?, ?)', ['John', 'john@example.com']);

// Requête avec expressions complexes
const results = await DB.raw(`
  SELECT 
    users.*, 
    COUNT(posts.id) as post_count
  FROM users
  LEFT JOIN posts ON users.id = posts.user_id
  GROUP BY users.id
  HAVING post_count > ?
`, [5]);
```

### Expressions brutes dans le QueryBuilder

```typescript
import { User, DB } from 'teloquent';

// Sélection brute
const users = await User.query()
  .select('*')
  .selectRaw('COUNT(posts.id) as post_count')
  .join('posts', 'users.id', '=', 'posts.user_id')
  .groupBy('users.id')
  .havingRaw('post_count > ?', [5])
  .get();

// Condition WHERE brute
const users = await User.query()
  .whereRaw('YEAR(created_at) = ?', [2023])
  .get();

// Ordre brut
const users = await User.query()
  .orderByRaw('FIELD(status, "active", "pending", "inactive")')
  .get();
```

### Requêtes brutes avec hydratation de modèle

```typescript
import { User, DB } from 'teloquent';

// Exécuter une requête brute et hydrater les résultats en modèles
const sql = 'SELECT * FROM users WHERE active = ? ORDER BY created_at DESC';
const bindings = [true];
const users = await User.fromQuery(sql, bindings);
```

## Transactions

Les transactions permettent d'exécuter plusieurs opérations comme une seule unité atomique.

### Utilisation basique

```typescript
import { DB } from 'teloquent';

await DB.transaction(async (trx) => {
  // Toutes les requêtes dans cette fonction utilisent la même transaction
  const user = await User.query(trx)
    .where('email', 'john@example.com')
    .first();
  
  await Post.query(trx).insert({
    title: 'New Post',
    user_id: user.id
  });
  
  await user.$query(trx).update({ post_count: user.post_count + 1 });
});
```

### Gestion manuelle des transactions

```typescript
import { DB } from 'teloquent';

const trx = await DB.beginTransaction();

try {
  const user = await User.query(trx)
    .where('email', 'john@example.com')
    .first();
  
  await Post.query(trx).insert({
    title: 'New Post',
    user_id: user.id
  });
  
  await user.$query(trx).update({ post_count: user.post_count + 1 });
  
  await trx.commit();
} catch (error) {
  await trx.rollback();
  throw error;
}
```

### Transactions imbriquées

```typescript
import { DB } from 'teloquent';

await DB.transaction(async (outerTrx) => {
  // Première opération
  await User.query(outerTrx).insert({ name: 'John' });
  
  // Transaction imbriquée
  await DB.transaction(async (innerTrx) => {
    await Post.query(innerTrx).insert({ title: 'Post' });
  }, outerTrx); // Passer la transaction parente
  
  // Si la transaction imbriquée réussit, cette opération sera exécutée
  await Comment.query(outerTrx).insert({ content: 'Comment' });
});
```

### Transactions avec points de sauvegarde

```typescript
import { DB } from 'teloquent';

const trx = await DB.beginTransaction();

try {
  await User.query(trx).insert({ name: 'John' });
  
  // Créer un point de sauvegarde
  await trx.savepoint('users_inserted');
  
  try {
    await Post.query(trx).insert({ title: 'Invalid Post' });
  } catch (error) {
    // Revenir au point de sauvegarde en cas d'erreur
    await trx.rollbackTo('users_inserted');
    
    // Continuer avec une autre opération
    await Post.query(trx).insert({ title: 'Valid Post' });
  }
  
  await trx.commit();
} catch (error) {
  await trx.rollback();
  throw error;
}
```
