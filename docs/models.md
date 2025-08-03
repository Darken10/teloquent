# Modèles

Les modèles sont au cœur de Teloquent. Chaque modèle représente une table dans votre base de données et fournit une interface orientée objet pour interagir avec cette table.

## Création d'un modèle

Pour créer un modèle, vous devez étendre la classe `Model` de Teloquent et utiliser les décorateurs pour définir les propriétés du modèle.

```typescript
import { Model, Table, Column, PrimaryKey, Timestamps } from 'teloquent';

@Table('users')
@Timestamps()
class User extends Model {
  @PrimaryKey()
  public id!: number;
  
  @Column()
  public name!: string;
  
  @Column()
  public email!: string;
  
  @Column({ nullable: true })
  public bio?: string;
}
```

## Décorateurs de modèle

### @Table

Le décorateur `@Table` spécifie le nom de la table associée au modèle.

```typescript
@Table('users') // Table 'users' dans la base de données
class User extends Model {}
```

Si vous ne spécifiez pas de nom de table, Teloquent utilisera le nom du modèle au pluriel (en minuscules).

### @Timestamps

Le décorateur `@Timestamps` ajoute automatiquement les colonnes `created_at` et `updated_at` au modèle.

```typescript
@Table('users')
@Timestamps() // Ajoute created_at et updated_at
class User extends Model {}
```

### @SoftDeletes

Le décorateur `@SoftDeletes` active la suppression douce pour le modèle, ajoutant une colonne `deleted_at`.

```typescript
@Table('users')
@Timestamps()
@SoftDeletes() // Ajoute deleted_at
class User extends Model {}
```

## Décorateurs de colonne

### @Column

Le décorateur `@Column` définit une propriété comme une colonne de la table.

```typescript
@Column() // Nom de colonne = nom de la propriété
public name!: string;

@Column('user_email') // Nom de colonne personnalisé
public email!: string;

@Column({ nullable: true }) // Colonne nullable
public bio?: string;

@Column({ default: false }) // Valeur par défaut
public active!: boolean;
```

### @PrimaryKey

Le décorateur `@PrimaryKey` définit la clé primaire du modèle.

```typescript
@PrimaryKey() // Clé primaire auto-incrémentée
public id!: number;

@PrimaryKey('user_id') // Nom personnalisé pour la clé primaire
public id!: number;
```

### @Dates

Le décorateur `@Dates` marque une colonne comme contenant une date, qui sera automatiquement convertie en objet `Date`.

```typescript
@Column()
@Dates()
public birth_date!: Date;
```

## Propriétés de modèle

### Propriétés statiques

Vous pouvez personnaliser le comportement de votre modèle en définissant des propriétés statiques.

```typescript
class User extends Model {
  // Nom de la table (alternative au décorateur @Table)
  public static tableName = 'users';
  
  // Nom de la clé primaire (alternative au décorateur @PrimaryKey)
  public static primaryKey = 'id';
  
  // Connexion à utiliser
  public static connection = 'default';
  
  // Utiliser les timestamps (alternative au décorateur @Timestamps)
  public static usesTimestamps = true;
  
  // Utiliser les soft deletes (alternative au décorateur @SoftDeletes)
  public static usesSoftDeletes = true;
  
  // Colonnes à cacher lors de la sérialisation
  public static hidden = ['password'];
}
```

### Attributs et accesseurs

Les attributs du modèle sont accessibles directement comme des propriétés.

```typescript
const user = await User.find(1);
console.log(user.name); // Accès à l'attribut 'name'
user.email = 'new@example.com'; // Modification de l'attribut 'email'
```

## Opérations CRUD

### Création

```typescript
// Méthode 1: Créer et sauvegarder
const user = new User();
user.name = 'John Doe';
user.email = 'john@example.com';
await user.save();

// Méthode 2: Créer à partir d'un objet
const user = new User({
  name: 'John Doe',
  email: 'john@example.com'
});
await user.save();

// Méthode 3: Création statique
const user = await User.create({
  name: 'John Doe',
  email: 'john@example.com'
});
```

### Lecture

```typescript
// Trouver par ID
const user = await User.find(1);

// Trouver par ID ou échouer
const user = await User.findOrFail(1); // Lance une exception si non trouvé

// Trouver par un autre attribut
const user = await User.query().where('email', 'john@example.com').first();

// Récupérer tous les enregistrements
const users = await User.all();
```

### Mise à jour

```typescript
// Méthode 1: Modifier et sauvegarder
const user = await User.find(1);
user.name = 'Jane Doe';
await user.save();

// Méthode 2: Mise à jour en masse
await User.query().where('active', false).update({ active: true });
```

### Suppression

```typescript
// Méthode 1: Supprimer une instance
const user = await User.find(1);
await user.delete();

// Méthode 2: Suppression en masse
await User.query().where('active', false).delete();

// Avec soft delete
await user.delete(); // Soft delete (définit deleted_at)
await user.forceDelete(); // Suppression définitive

// Restaurer un soft delete
await user.restore();
```

## Attributs calculés

Vous pouvez définir des attributs calculés qui ne sont pas stockés dans la base de données.

```typescript
class User extends Model {
  // ... colonnes définies avec @Column
  
  // Attribut calculé
  get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }
}

const user = await User.find(1);
console.log(user.fullName); // Accès à l'attribut calculé
```

## Accesseurs et mutateurs

Les accesseurs et mutateurs vous permettent de transformer les données lors de la lecture ou de l'écriture.

```typescript
class User extends Model {
  // Accesseur: transforme la donnée lors de la lecture
  get name(): string {
    return this.getAttribute('name').toUpperCase();
  }
  
  // Mutateur: transforme la donnée lors de l'écriture
  set password(value: string) {
    this.setAttribute('password', hashPassword(value));
  }
}
```

## Sérialisation

### toJSON

La méthode `toJSON` convertit le modèle en objet JSON.

```typescript
const user = await User.find(1);
const json = user.toJSON();
```

### Attributs cachés

Vous pouvez spécifier des attributs à exclure lors de la sérialisation.

```typescript
class User extends Model {
  public static hidden = ['password', 'remember_token'];
}
```

### Attributs visibles

Vous pouvez spécifier les seuls attributs à inclure lors de la sérialisation.

```typescript
class User extends Model {
  public static visible = ['id', 'name', 'email'];
}
```

## Événements de modèle

Teloquent fournit des hooks pour réagir aux événements du cycle de vie du modèle.

```typescript
class User extends Model {
  public static booted(): void {
    // Appelé une fois lors du chargement de la classe
  }
  
  public beforeSave(): void {
    // Appelé avant la sauvegarde
  }
  
  public afterSave(): void {
    // Appelé après la sauvegarde
  }
  
  public beforeDelete(): void {
    // Appelé avant la suppression
  }
  
  public afterDelete(): void {
    // Appelé après la suppression
  }
}
```

## Scopes

Les scopes vous permettent de réutiliser des requêtes courantes.

```typescript
class User extends Model {
  // Scope pour les utilisateurs actifs
  public static scopeActive(query: QueryBuilder<User>): QueryBuilder<User> {
    return query.where('active', true);
  }
  
  // Scope avec paramètre
  public static scopeOfType(query: QueryBuilder<User>, type: string): QueryBuilder<User> {
    return query.where('type', type);
  }
}

// Utilisation des scopes
const activeUsers = await User.query().active().get();
const adminUsers = await User.query().ofType('admin').get();
```

## Utilisation avancée

### Transactions

```typescript
import { DB } from 'teloquent';

await DB.transaction(async (trx) => {
  const user = new User({ name: 'John' });
  await user.save(trx);
  
  const post = new Post({ title: 'Hello', userId: user.id });
  await post.save(trx);
});
```

### Requêtes brutes

```typescript
import { DB } from 'teloquent';

const results = await DB.raw('SELECT * FROM users WHERE active = ?', [true]);
```

### Requêtes personnalisées

```typescript
class User extends Model {
  // Méthode statique personnalisée
  public static async findByEmail(email: string): Promise<User | null> {
    return this.query().where('email', email).first();
  }
  
  // Méthode d'instance personnalisée
  public async activate(): Promise<void> {
    this.active = true;
    await this.save();
  }
}

// Utilisation
const user = await User.findByEmail('john@example.com');
await user.activate();
```
