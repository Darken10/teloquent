/**
 * Tests unitaires pour la classe QueryBuilder
 */

import { Connection } from '../src/utils/connection';
import { Model } from '../src/Model';
import { Table, PrimaryKey, Column, Timestamps } from '../src/decorators';

// Configurer la connexion de test
beforeAll(async () => {
  // Utiliser une base de données SQLite en mémoire pour les tests
  Connection.addConnection('test', {
    client: 'sqlite3',
    connection: {
      filename: ':memory:'
    },
    useNullAsDefault: true
  });
  
  Connection.setDefaultConnection('test');
  
  // Créer la table de test
  const knex = Connection.getConnection('test');
  await knex.schema.createTable('query_test_models', (table) => {
    table.increments('id');
    table.string('name');
    table.integer('age');
    table.boolean('active');
    table.timestamps();
  });
});

// Nettoyer après les tests
afterAll(async () => {
  const knex = Connection.getConnection('test');
  await knex.schema.dropTable('query_test_models');
  await Connection.closeAll();
});

// Modèle de test
@Table('query_test_models')
@Timestamps()
class QueryTestModel extends Model {
  @PrimaryKey()
  public id!: number;
  
  @Column()
  public name!: string;
  
  @Column()
  public age!: number;
  
  @Column()
  public active!: boolean;
}

describe('QueryBuilder', () => {
  // Insérer des données de test avant chaque test
  beforeEach(async () => {
    await QueryTestModel.query().truncate();
    
    // Insérer des données de test
    await QueryTestModel.create({ name: 'Alice', age: 25, active: true });
    await QueryTestModel.create({ name: 'Bob', age: 30, active: true });
    await QueryTestModel.create({ name: 'Charlie', age: 35, active: false });
    await QueryTestModel.create({ name: 'Dave', age: 40, active: true });
    await QueryTestModel.create({ name: 'Eve', age: 45, active: false });
  });
  
  test('should get all records', async () => {
    const models = await QueryTestModel.query().get();
    expect(models.length).toBe(5);
  });
  
  test('should filter records with where clause', async () => {
    const models = await QueryTestModel.query().where('active', true).get();
    expect(models.length).toBe(3);
    expect(models.every(model => model.active)).toBe(true);
  });
  
  test('should filter records with multiple where clauses', async () => {
    const models = await QueryTestModel.query()
      .where('active', true)
      .where('age', '>', 30)
      .get();
    
    expect(models.length).toBe(1);
    expect(models[0].name).toBe('Dave');
  });
  
  test('should filter records with orWhere clause', async () => {
    const models = await QueryTestModel.query()
      .where('age', '<', 30)
      .orWhere('age', '>', 40)
      .get();
    
    expect(models.length).toBe(2);
    expect(models[0].name).toBe('Alice');
    expect(models[1].name).toBe('Eve');
  });
  
  test('should filter records with whereIn clause', async () => {
    const models = await QueryTestModel.query()
      .whereIn('name', ['Alice', 'Bob', 'Eve'])
      .get();
    
    expect(models.length).toBe(3);
    const names = models.map(model => model.name);
    expect(names).toContain('Alice');
    expect(names).toContain('Bob');
    expect(names).toContain('Eve');
  });
  
  test('should order records', async () => {
    const models = await QueryTestModel.query()
      .orderBy('age', 'desc')
      .get();
    
    expect(models.length).toBe(5);
    expect(models[0].name).toBe('Eve');
    expect(models[1].name).toBe('Dave');
    expect(models[2].name).toBe('Charlie');
    expect(models[3].name).toBe('Bob');
    expect(models[4].name).toBe('Alice');
  });
  
  test('should limit records', async () => {
    const models = await QueryTestModel.query()
      .orderBy('age', 'asc')
      .limit(2)
      .get();
    
    expect(models.length).toBe(2);
    expect(models[0].name).toBe('Alice');
    expect(models[1].name).toBe('Bob');
  });
  
  test('should offset records', async () => {
    const models = await QueryTestModel.query()
      .orderBy('age', 'asc')
      .offset(2)
      .get();
    
    expect(models.length).toBe(3);
    expect(models[0].name).toBe('Charlie');
    expect(models[1].name).toBe('Dave');
    expect(models[2].name).toBe('Eve');
  });
  
  test('should get first record', async () => {
    const model = await QueryTestModel.query()
      .orderBy('age', 'asc')
      .first();
    
    expect(model).toBeDefined();
    expect(model?.name).toBe('Alice');
  });
  
  test('should count records', async () => {
    const count = await QueryTestModel.query().count();
    expect(count).toBe(5);
    
    const activeCount = await QueryTestModel.query().where('active', true).count();
    expect(activeCount).toBe(3);
  });
  
  test('should update records', async () => {
    await QueryTestModel.query()
      .where('age', '<', 30)
      .update({ active: false });
    
    const models = await QueryTestModel.query().where('active', true).get();
    expect(models.length).toBe(2);
    expect(models.every(model => model.age >= 30)).toBe(true);
  });
  
  test('should delete records', async () => {
    await QueryTestModel.query()
      .where('active', false)
      .delete();
    
    const models = await QueryTestModel.query().get();
    expect(models.length).toBe(3);
    expect(models.every(model => model.active)).toBe(true);
  });
  
  test('should handle complex queries', async () => {
    const models = await QueryTestModel.query()
      .where(query => query.where('age', '>', 30).where('active', true))
      .orWhere('name', 'Alice')
      .orderBy('age', 'asc')
      .get();
    
    expect(models.length).toBe(2);
    expect(models[0].name).toBe('Alice');
    expect(models[1].name).toBe('Dave');
  });
});
