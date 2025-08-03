# Décorateurs

Les décorateurs sont une fonctionnalité puissante de TypeScript que Teloquent utilise pour définir les modèles, les colonnes et les relations de manière déclarative et typée. Ils permettent de simplifier la configuration des modèles et d'améliorer la lisibilité du code.

## Configuration de TypeScript

Pour utiliser les décorateurs, vous devez activer l'option `experimentalDecorators` dans votre fichier `tsconfig.json` :

```json
{
  "compilerOptions": {
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,
    // autres options...
  }
}
```

## Décorateurs de modèle

### @Table

Le décorateur `@Table` définit le nom de la table associée au modèle dans la base de données.

```typescript
import { Model, Table } from 'teloquent';

@Table('users') // Table 'users' dans la base de données
class User extends Model {
  // ...
}

// Sans argument, utilise le nom du modèle au pluriel
@Table()
class Product extends Model { // Table 'products' dans la base de données
  // ...
}
```

### @Timestamps

Le décorateur `@Timestamps` ajoute automatiquement les colonnes `created_at` et `updated_at` au modèle et gère leur mise à jour.

```typescript
import { Model, Table, Timestamps } from 'teloquent';

@Table('users')
@Timestamps() // Ajoute created_at et updated_at
class User extends Model {
  // ...
}
```

### @SoftDeletes

Le décorateur `@SoftDeletes` active la suppression douce pour le modèle, ajoutant une colonne `deleted_at` qui est remplie lors de la suppression au lieu de supprimer réellement l'enregistrement.

```typescript
import { Model, Table, Timestamps, SoftDeletes } from 'teloquent';

@Table('users')
@Timestamps()
@SoftDeletes() // Ajoute deleted_at
class User extends Model {
  // ...
}
```

## Décorateurs de colonne

### @Column

Le décorateur `@Column` définit une propriété comme une colonne de la table.

```typescript
import { Model, Table, Column } from 'teloquent';

@Table('users')
class User extends Model {
  @Column() // Nom de colonne = nom de la propriété
  public name!: string;

  @Column('user_email') // Nom de colonne personnalisé
  public email!: string;

  @Column({ nullable: true }) // Colonne nullable
  public bio?: string;

  @Column({ default: false }) // Valeur par défaut
  public active!: boolean;
  
  @Column({ type: 'json' }) // Type de colonne spécifique
  public preferences!: Record<string, any>;
}
```

Options disponibles pour `@Column` :
- `name` : Nom de la colonne dans la base de données (si différent du nom de la propriété)
- `nullable` : Si la colonne peut être NULL
- `default` : Valeur par défaut
- `type` : Type de colonne spécifique
- `hidden` : Si la colonne doit être cachée lors de la sérialisation
- `cast` : Fonction de conversion pour les valeurs lues/écrites

### @PrimaryKey

Le décorateur `@PrimaryKey` définit la clé primaire du modèle.

```typescript
import { Model, Table, PrimaryKey } from 'teloquent';

@Table('users')
class User extends Model {
  @PrimaryKey() // Clé primaire auto-incrémentée
  public id!: number;

  @PrimaryKey('user_id') // Nom personnalisé pour la clé primaire
  public id!: number;
  
  @PrimaryKey({ type: 'uuid' }) // Clé primaire de type UUID
  public id!: string;
}
```

### @Dates

Le décorateur `@Dates` marque une colonne comme contenant une date, qui sera automatiquement convertie en objet `Date`.

```typescript
import { Model, Table, Column, Dates } from 'teloquent';

@Table('users')
class User extends Model {
  @Column()
  @Dates()
  public birth_date!: Date;
  
  @Column()
  @Dates('YYYY-MM-DD') // Format personnalisé
  public registration_date!: Date;
}
```

### @Hidden

Le décorateur `@Hidden` marque une colonne comme devant être cachée lors de la sérialisation (par exemple, les mots de passe).

```typescript
import { Model, Table, Column, Hidden } from 'teloquent';

@Table('users')
class User extends Model {
  @Column()
  @Hidden() // Ne sera pas inclus dans toJSON()
  public password!: string;
}
```

### @Cast

Le décorateur `@Cast` permet de définir des fonctions de conversion pour les valeurs lues/écrites.

```typescript
import { Model, Table, Column, Cast } from 'teloquent';

@Table('users')
class User extends Model {
  @Column()
  @Cast({
    get: (value: string) => value.toUpperCase(),
    set: (value: string) => value.toLowerCase()
  })
  public username!: string;
}
```

## Décorateurs de relation

### @HasOneRelation

Le décorateur `@HasOneRelation` définit une relation one-to-one.

```typescript
import { Model, Table, PrimaryKey, HasOneRelation } from 'teloquent';
import Profile from './Profile';

@Table('users')
class User extends Model {
  @PrimaryKey()
  public id!: number;
  
  @HasOneRelation(() => Profile, 'user_id')
  public profile!: Profile;
  
  @HasOneRelation(() => Profile, 'user_id', 'id', {
    onDelete: 'cascade',
    constraints: true
  })
  public customProfile!: Profile;
}
```

Options disponibles :
- Premier argument : Fonction qui retourne le modèle associé
- Deuxième argument : Clé étrangère dans la table associée
- Troisième argument (optionnel) : Clé locale (par défaut, la clé primaire)
- Quatrième argument (optionnel) : Options supplémentaires

### @HasManyRelation

Le décorateur `@HasManyRelation` définit une relation one-to-many.

```typescript
import { Model, Table, PrimaryKey, HasManyRelation } from 'teloquent';
import Post from './Post';

@Table('users')
class User extends Model {
  @PrimaryKey()
  public id!: number;
  
  @HasManyRelation(() => Post, 'user_id')
  public posts!: Post[];
  
  @HasManyRelation(() => Post, 'author_id', 'id', {
    orderBy: { created_at: 'desc' }
  })
  public authoredPosts!: Post[];
}
```

Options disponibles :
- Premier argument : Fonction qui retourne le modèle associé
- Deuxième argument : Clé étrangère dans la table associée
- Troisième argument (optionnel) : Clé locale (par défaut, la clé primaire)
- Quatrième argument (optionnel) : Options supplémentaires

### @BelongsToRelation

Le décorateur `@BelongsToRelation` définit une relation many-to-one (inverse de one-to-many).

```typescript
import { Model, Table, PrimaryKey, Column, BelongsToRelation } from 'teloquent';
import User from './User';

@Table('posts')
class Post extends Model {
  @PrimaryKey()
  public id!: number;
  
  @Column()
  public user_id!: number;
  
  @BelongsToRelation(() => User, 'user_id')
  public user!: User;
  
  @Column('author_id')
  public authorId!: number;
  
  @BelongsToRelation(() => User, 'author_id', 'id')
  public author!: User;
}
```

Options disponibles :
- Premier argument : Fonction qui retourne le modèle associé
- Deuxième argument : Clé étrangère dans la table courante
- Troisième argument (optionnel) : Clé de référence dans la table associée (par défaut, la clé primaire)
- Quatrième argument (optionnel) : Options supplémentaires

### @BelongsToManyRelation

Le décorateur `@BelongsToManyRelation` définit une relation many-to-many via une table pivot.

```typescript
import { Model, Table, PrimaryKey, BelongsToManyRelation } from 'teloquent';
import Role from './Role';

@Table('users')
class User extends Model {
  @PrimaryKey()
  public id!: number;
  
  @BelongsToManyRelation(() => Role, 'user_roles', 'user_id', 'role_id')
  public roles!: Role[];
  
  @BelongsToManyRelation(() => Role, 'user_roles', 'user_id', 'role_id', {
    pivotTable: 'user_roles',
    pivotColumns: ['expires_at'],
    withTimestamps: true
  })
  public rolesWithExpiry!: Role[];
}
```

Options disponibles :
- Premier argument : Fonction qui retourne le modèle associé
- Deuxième argument : Nom de la table pivot
- Troisième argument : Clé étrangère de la table courante dans la table pivot
- Quatrième argument : Clé étrangère du modèle associé dans la table pivot
- Cinquième argument (optionnel) : Options supplémentaires

### @MorphOneRelation

Le décorateur `@MorphOneRelation` définit une relation polymorphique one-to-one.

```typescript
import { Model, Table, PrimaryKey, MorphOneRelation } from 'teloquent';
import Image from './Image';

@Table('users')
class User extends Model {
  @PrimaryKey()
  public id!: number;
  
  @MorphOneRelation(() => Image, 'imageable')
  public image!: Image;
}
```

### @MorphManyRelation

Le décorateur `@MorphManyRelation` définit une relation polymorphique one-to-many.

```typescript
import { Model, Table, PrimaryKey, MorphManyRelation } from 'teloquent';
import Comment from './Comment';

@Table('posts')
class Post extends Model {
  @PrimaryKey()
  public id!: number;
  
  @MorphManyRelation(() => Comment, 'commentable')
  public comments!: Comment[];
}
```

### @MorphToRelation

Le décorateur `@MorphToRelation` définit la partie inverse d'une relation polymorphique.

```typescript
import { Model, Table, PrimaryKey, Column, MorphToRelation } from 'teloquent';

@Table('comments')
class Comment extends Model {
  @PrimaryKey()
  public id!: number;
  
  @Column()
  public commentable_id!: number;
  
  @Column()
  public commentable_type!: string;
  
  @MorphToRelation('commentable')
  public commentable!: any; // Le type dépend du modèle parent
}
```

### @MorphToManyRelation

Le décorateur `@MorphToManyRelation` définit une relation polymorphique many-to-many.

```typescript
import { Model, Table, PrimaryKey, MorphToManyRelation } from 'teloquent';
import Tag from './Tag';

@Table('posts')
class Post extends Model {
  @PrimaryKey()
  public id!: number;
  
  @MorphToManyRelation(() => Tag, 'taggable', 'taggables')
  public tags!: Tag[];
}
```

## Décorateurs de validation

### @Required

Le décorateur `@Required` marque une propriété comme requise lors de la création ou de la mise à jour.

```typescript
import { Model, Table, Column, Required } from 'teloquent';

@Table('users')
class User extends Model {
  @Column()
  @Required()
  public email!: string;
}
```

### @Min / @Max

Les décorateurs `@Min` et `@Max` définissent des contraintes de valeur minimale et maximale.

```typescript
import { Model, Table, Column, Min, Max } from 'teloquent';

@Table('products')
class Product extends Model {
  @Column()
  @Min(0)
  public price!: number;
  
  @Column()
  @Min(0)
  @Max(100)
  public stock!: number;
}
```

### @Email

Le décorateur `@Email` valide que la valeur est une adresse email valide.

```typescript
import { Model, Table, Column, Email } from 'teloquent';

@Table('users')
class User extends Model {
  @Column()
  @Email()
  public email!: string;
}
```

### @Regex

Le décorateur `@Regex` valide que la valeur correspond à une expression régulière.

```typescript
import { Model, Table, Column, Regex } from 'teloquent';

@Table('users')
class User extends Model {
  @Column()
  @Regex(/^[A-Za-z0-9]+$/)
  public username!: string;
}
```

## Décorateurs de hooks

### @BeforeSave / @AfterSave

Les décorateurs `@BeforeSave` et `@AfterSave` définissent des méthodes à exécuter avant ou après la sauvegarde d'un modèle.

```typescript
import { Model, Table, Column, BeforeSave, AfterSave } from 'teloquent';

@Table('users')
class User extends Model {
  @Column()
  public password!: string;
  
  @BeforeSave()
  public hashPassword(): void {
    if (this.isDirty('password')) {
      this.password = hashPassword(this.password);
    }
  }
  
  @AfterSave()
  public async sendWelcomeEmail(): Promise<void> {
    if (this.wasRecentlyCreated) {
      await sendEmail(this.email, 'Welcome to our platform!');
    }
  }
}
```

### @BeforeDelete / @AfterDelete

Les décorateurs `@BeforeDelete` et `@AfterDelete` définissent des méthodes à exécuter avant ou après la suppression d'un modèle.

```typescript
import { Model, Table, BeforeDelete, AfterDelete } from 'teloquent';

@Table('users')
class User extends Model {
  @BeforeDelete()
  public async archiveUserData(): Promise<void> {
    await archiveService.archiveUser(this.id);
  }
  
  @AfterDelete()
  public async notifyAdmins(): Promise<void> {
    await notificationService.notifyUserDeleted(this.id);
  }
}
```

## Décorateurs de scope

### @Scope

Le décorateur `@Scope` définit une méthode comme un scope de requête.

```typescript
import { Model, Table, Scope, QueryBuilder } from 'teloquent';

@Table('users')
class User extends Model {
  @Scope()
  public static active(query: QueryBuilder<User>): QueryBuilder<User> {
    return query.where('active', true);
  }
  
  @Scope()
  public static ofRole(query: QueryBuilder<User>, role: string): QueryBuilder<User> {
    return query.where('role', role);
  }
}

// Utilisation
const activeAdmins = await User.query().active().ofRole('admin').get();
```

## Décorateurs personnalisés

Vous pouvez créer vos propres décorateurs pour répondre à des besoins spécifiques.

```typescript
import { Model } from 'teloquent';

// Décorateur personnalisé
function Uppercase() {
  return function(target: any, propertyKey: string) {
    // Remplacer le getter/setter de la propriété
    let value: any;
    
    Object.defineProperty(target, propertyKey, {
      get() {
        return value;
      },
      set(newValue: string) {
        value = typeof newValue === 'string' ? newValue.toUpperCase() : newValue;
      },
      enumerable: true,
      configurable: true
    });
  };
}

// Utilisation
@Table('users')
class User extends Model {
  @Column()
  @Uppercase()
  public name!: string;
}

const user = new User();
user.name = 'john'; // Sera automatiquement converti en 'JOHN'
```

## Combinaison de décorateurs

Vous pouvez combiner plusieurs décorateurs sur une même propriété ou classe.

```typescript
@Table('users')
@Timestamps()
@SoftDeletes()
class User extends Model {
  @PrimaryKey()
  public id!: number;
  
  @Column()
  @Required()
  @Email()
  public email!: string;
  
  @Column()
  @Required()
  @Hidden()
  public password!: string;
  
  @Column({ nullable: true })
  @Dates()
  public last_login!: Date;
  
  @HasManyRelation(() => Post, 'user_id')
  public posts!: Post[];
}
```

## Ordre des décorateurs

L'ordre des décorateurs peut être important, car ils sont appliqués de bas en haut.

```typescript
@Table('users')
class User extends Model {
  @Column()
  @Hidden() // Appliqué en premier
  @Cast({   // Appliqué en second
    get: (value) => decrypt(value),
    set: (value) => encrypt(value)
  })
  public secret!: string;
}
```

## Métadonnées de réflexion

Teloquent utilise les métadonnées de réflexion pour stocker et récupérer des informations sur les modèles, les colonnes et les relations. C'est pourquoi il est important d'activer `emitDecoratorMetadata` dans votre `tsconfig.json`.

Ces métadonnées sont utilisées pour :
- Déterminer les types de colonnes
- Configurer les relations
- Valider les données
- Générer des migrations

## Bonnes pratiques

### Typage strict

Utilisez toujours le typage strict pour vos propriétés de modèle. Ajoutez `!` ou `?` selon que la propriété est requise ou optionnelle.

```typescript
@Column()
public name!: string; // Propriété requise

@Column({ nullable: true })
public bio?: string; // Propriété optionnelle
```

### Organisation des décorateurs

Organisez vos décorateurs de manière cohérente :

```typescript
@Table('users')
@Timestamps()
@SoftDeletes()
class User extends Model {
  // Clé primaire d'abord
  @PrimaryKey()
  public id!: number;
  
  // Colonnes ensuite
  @Column()
  @Required()
  public name!: string;
  
  // Relations à la fin
  @HasManyRelation(() => Post, 'user_id')
  public posts!: Post[];
}
```

### Documentation des propriétés

Documentez vos propriétés pour améliorer la lisibilité et la maintenabilité :

```typescript
@Table('users')
class User extends Model {
  /**
   * Adresse email de l'utilisateur.
   * Doit être unique et valide.
   */
  @Column()
  @Required()
  @Email()
  public email!: string;
}
```

### Éviter la surcharge de décorateurs

N'utilisez que les décorateurs nécessaires pour éviter de surcharger votre code :

```typescript
// Trop de décorateurs
@Column()
@Required()
@Min(3)
@Max(50)
@Regex(/^[A-Za-z0-9]+$/)
@Cast({ get: (v) => v.trim() })
public username!: string;

// Mieux : utiliser un validateur personnalisé
@Column()
@Validate(validateUsername)
public username!: string;
```

## Dépannage

### Les décorateurs ne fonctionnent pas

Si vos décorateurs ne semblent pas fonctionner :
- Vérifiez que `experimentalDecorators` et `emitDecoratorMetadata` sont activés dans `tsconfig.json`
- Assurez-vous d'importer correctement les décorateurs
- Vérifiez l'ordre des décorateurs

### Erreurs de typage

Si vous rencontrez des erreurs de typage :
- Assurez-vous que les types des propriétés correspondent aux types attendus par les décorateurs
- Utilisez `!` pour les propriétés requises et `?` pour les propriétés optionnelles
- Vérifiez que vous utilisez les bons génériques pour les relations

### Problèmes de performance

Si vous rencontrez des problèmes de performance :
- Limitez le nombre de décorateurs utilisés
- Évitez les décorateurs qui effectuent des opérations coûteuses
- Utilisez des décorateurs personnalisés optimisés pour vos besoins spécifiques
