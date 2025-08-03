/**
 * Tests unitaires pour la classe Model
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
  await knex.schema.createTable('test_models', (table) => {
    table.increments('id');
    table.string('name');
    table.string('email');
    table.timestamps();
  });
});

// Nettoyer après les tests
afterAll(async () => {
  const knex = Connection.getConnection('test');
  await knex.schema.dropTable('test_models');
  await Connection.closeAll();
});

// Modèle de test
@Table('test_models')
@Timestamps()
class TestModel extends Model {
  @PrimaryKey()
  public id!: number;
  
  @Column()
  public name!: string;
  
  @Column()
  public email!: string;
}

describe('Model', () => {
  // Nettoyer la table avant chaque test
  beforeEach(async () => {
    await TestModel.query().truncate();
  });
  
  test('should create a new model instance', () => {
    const model = new TestModel({ name: 'Test', email: 'test@example.com' });
    expect(model.name).toBe('Test');
    expect(model.email).toBe('test@example.com');
  });
  
  test('should save a model to the database', async () => {
    const model = new TestModel({ name: 'Test', email: 'test@example.com' });
    await model.save();
    
    expect(model.id).toBeDefined();
    expect(model.created_at).toBeDefined();
    expect(model.updated_at).toBeDefined();
    
    // Vérifier que le modèle est bien enregistré
    const found = await TestModel.find(model.id);
    expect(found).toBeDefined();
    expect(found?.name).toBe('Test');
  });
  
  test('should update a model in the database', async () => {
    const model = await TestModel.create({ name: 'Test', email: 'test@example.com' });
    
    model.name = 'Updated';
    await model.save();
    
    // Vérifier que le modèle est bien mis à jour
    const found = await TestModel.find(model.id);
    expect(found?.name).toBe('Updated');
  });
  
  test('should delete a model from the database', async () => {
    const model = await TestModel.create({ name: 'Test', email: 'test@example.com' });
    await model.delete();
    
    // Vérifier que le modèle est bien supprimé
    const found = await TestModel.find(model.id);
    expect(found).toBeNull();
  });
  
  test('should find a model by ID', async () => {
    const model = await TestModel.create({ name: 'Test', email: 'test@example.com' });
    const found = await TestModel.find(model.id);
    
    expect(found).toBeDefined();
    expect(found?.id).toBe(model.id);
    expect(found?.name).toBe('Test');
  });
  
  test('should find a model by attributes', async () => {
    await TestModel.create({ name: 'Test1', email: 'test1@example.com' });
    await TestModel.create({ name: 'Test2', email: 'test2@example.com' });
    
    const found = await TestModel.findBy('email', 'test2@example.com');
    
    expect(found).toBeDefined();
    expect(found?.name).toBe('Test2');
  });
  
  test('should get all models', async () => {
    await TestModel.create({ name: 'Test1', email: 'test1@example.com' });
    await TestModel.create({ name: 'Test2', email: 'test2@example.com' });
    
    const models = await TestModel.all();
    
    expect(models.length).toBe(2);
    expect(models[0].name).toBe('Test1');
    expect(models[1].name).toBe('Test2');
  });
  
  test('should convert model to JSON', async () => {
    const model = await TestModel.create({ name: 'Test', email: 'test@example.com' });
    const json = model.toJSON();
    
    expect(json).toHaveProperty('id');
    expect(json).toHaveProperty('name', 'Test');
    expect(json).toHaveProperty('email', 'test@example.com');
    expect(json).toHaveProperty('created_at');
    expect(json).toHaveProperty('updated_at');
  });
});
