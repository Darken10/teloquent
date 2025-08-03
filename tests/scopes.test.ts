/**
 * Tests unitaires pour le système de scopes dans Teloquent
 */

import 'reflect-metadata';
import { Model, QueryBuilder } from '../src';
import { Table, Column, PrimaryKey } from '../src/decorators';
import { Scope } from '../src/decorators/Scope';
import { GlobalScope } from '../src/scopes';
import { Connection } from '../src/utils/connection';
import { expect } from 'chai';
import * as sinon from 'sinon';

// Configurer la connexion à la base de données pour les tests
before(() => {
  Connection.configure({
    client: 'sqlite3',
    connection: {
      filename: ':memory:'
    },
    useNullAsDefault: true
  });
});

describe('Système de scopes Teloquent', () => {
  // Classe de scope global pour les tests
  class ActiveScope implements GlobalScope {
    apply<T extends Model>(builder: QueryBuilder<T>): void {
      builder.where('active', true);
    }
  }

  // Modèle de test avec scopes
  @Table('test_users')
  class TestUser extends Model {
    @PrimaryKey()
    @Column()
    id!: number;

    @Column()
    name!: string;

    @Column()
    active!: boolean;

    @Column()
    role!: string;

    // Scope local avec décorateur
    @Scope()
    public static admin(query: QueryBuilder<TestUser>): QueryBuilder<TestUser> {
      return query.where('role', 'admin');
    }

    // Scope local avec préfixe
    public static scopeManager(query: QueryBuilder<TestUser>): QueryBuilder<TestUser> {
      return query.where('role', 'manager');
    }

    // Scope local avec paramètre
    @Scope()
    public static withRole(query: QueryBuilder<TestUser>, role: string): QueryBuilder<TestUser> {
      return query.where('role', role);
    }
  }

  beforeEach(() => {
    // Réinitialiser les scopes globaux avant chaque test
    TestUser['globalScopes'] = new Map();
  });

  describe('Scopes globaux', () => {
    it('devrait ajouter un scope global', () => {
      // Arrange
      const activeScope = new ActiveScope();
      
      // Act
      TestUser.addGlobalScope(activeScope);
      
      // Assert
      const scopes = TestUser.getGlobalScopes();
      expect(scopes.size).to.equal(1);
      expect(scopes.has(ActiveScope)).to.be.true;
    });

    it('devrait ajouter un scope global avec callback', () => {
      // Arrange
      const callback = (query: QueryBuilder<TestUser>) => {
        query.where('active', true);
      };
      
      // Act
      TestUser.addGlobalScope(callback, 'active');
      
      // Assert
      const scopes = TestUser.getGlobalScopes();
      expect(scopes.size).to.equal(1);
      expect(scopes.has('active')).to.be.true;
    });

    it('devrait supprimer un scope global', () => {
      // Arrange
      const activeScope = new ActiveScope();
      TestUser.addGlobalScope(activeScope);
      
      // Act
      TestUser.removeGlobalScope(ActiveScope);
      
      // Assert
      const scopes = TestUser.getGlobalScopes();
      expect(scopes.size).to.equal(0);
    });

    it('devrait appliquer les scopes globaux au query builder', () => {
      // Arrange
      const activeScope = new ActiveScope();
      TestUser.addGlobalScope(activeScope);
      
      // Mock de la méthode where du query builder
      const whereSpy = sinon.spy(QueryBuilder.prototype, 'where');
      
      // Act
      const query = TestUser.query();
      
      // Assert
      expect(whereSpy.calledWith('active', true)).to.be.true;
      
      // Cleanup
      whereSpy.restore();
    });

    it('devrait exclure un scope global spécifique', () => {
      // Arrange
      const activeScope = new ActiveScope();
      TestUser.addGlobalScope(activeScope);
      
      // Mock de la méthode where du query builder
      const whereSpy = sinon.spy(QueryBuilder.prototype, 'where');
      
      // Act
      const query = TestUser.query().withoutGlobalScope(ActiveScope);
      
      // Assert
      expect(whereSpy.called).to.be.false;
      
      // Cleanup
      whereSpy.restore();
    });

    it('devrait exclure tous les scopes globaux', () => {
      // Arrange
      const activeScope = new ActiveScope();
      TestUser.addGlobalScope(activeScope);
      
      // Mock de la méthode where du query builder
      const whereSpy = sinon.spy(QueryBuilder.prototype, 'where');
      
      // Act
      const query = TestUser.query().withoutGlobalScopes();
      
      // Assert
      expect(whereSpy.called).to.be.false;
      
      // Cleanup
      whereSpy.restore();
    });
  });

  describe('Scopes locaux', () => {
    it('devrait appliquer un scope local avec décorateur', () => {
      // Arrange
      const whereSpy = sinon.spy(QueryBuilder.prototype, 'where');
      
      // Act
      const query = TestUser.query().admin();
      
      // Assert
      expect(whereSpy.calledWith('role', 'admin')).to.be.true;
      
      // Cleanup
      whereSpy.restore();
    });

    it('devrait appliquer un scope local avec préfixe', () => {
      // Arrange
      const whereSpy = sinon.spy(QueryBuilder.prototype, 'where');
      
      // Act
      const query = TestUser.query().manager();
      
      // Assert
      expect(whereSpy.calledWith('role', 'manager')).to.be.true;
      
      // Cleanup
      whereSpy.restore();
    });

    it('devrait appliquer un scope local avec paramètre', () => {
      // Arrange
      const whereSpy = sinon.spy(QueryBuilder.prototype, 'where');
      
      // Act
      const query = TestUser.query().withRole('developer');
      
      // Assert
      expect(whereSpy.calledWith('role', 'developer')).to.be.true;
      
      // Cleanup
      whereSpy.restore();
    });

    it('devrait combiner plusieurs scopes locaux', () => {
      // Arrange
      const whereSpy = sinon.spy(QueryBuilder.prototype, 'where');
      
      // Act
      const query = TestUser.query().admin().withRole('developer');
      
      // Assert
      expect(whereSpy.calledWith('role', 'admin')).to.be.true;
      expect(whereSpy.calledWith('role', 'developer')).to.be.true;
      
      // Cleanup
      whereSpy.restore();
    });
  });

  describe('Intégration avec le QueryBuilder', () => {
    it('devrait intercepter les appels de méthodes pour les scopes locaux', () => {
      // Arrange
      const proxyHandler = {
        get: function(target: any, prop: string) {
          if (typeof prop === 'string' && prop !== 'then') {
            if (typeof target[prop] === 'undefined') {
              return (...args: any[]) => target.__call(prop, args);
            }
          }
          return target[prop];
        }
      };
      
      const queryBuilder = new QueryBuilder(TestUser);
      const proxiedBuilder = new Proxy(queryBuilder, proxyHandler);
      
      // Mock de la méthode __call
      const callSpy = sinon.spy(queryBuilder, '__call');
      
      // Act
      (proxiedBuilder as any).admin();
      
      // Assert
      expect(callSpy.calledWith('admin', [])).to.be.true;
      
      // Cleanup
      callSpy.restore();
    });
  });
});
