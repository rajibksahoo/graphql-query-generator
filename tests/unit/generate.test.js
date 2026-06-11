import { describe, it, expect } from 'vitest';
import { buildSchema } from 'graphql';
import { generateAll, generateOperation } from '../../src/generate.js';

const schema6Fields = buildSchema(`
  type Query {
    getProduct: Product
  }
  type Product {
    id: ID
    name: String
    price: Float
    inStock: Boolean
    sku: String
    category: String
    description: String
  }
`);

const schemaWithEnum = buildSchema(`
  enum Status { ACTIVE INACTIVE }
  type Query {
    getStatus: Status
    findByStatus(status: Status!): Boolean
  }
`);

const schemaWithUnion = buildSchema(`
  type Cat { meow: String }
  type Dog { woof: String }
  union Animal = Cat | Dog
  type Query {
    getAnimal: Animal
  }
`);

const schemaInputObject = buildSchema(`
  input UserInput { name: String! email: String }
  type User { id: ID name: String }
  type Query { dummy: Boolean }
  type Mutation {
    createUser(input: UserInput!): User
  }
`);

describe('generateAll', () => {
  it('includes more than 5 fields when type has 7 fields (regression test)', () => {
    const ops = generateAll(schema6Fields, { maxDepth: 10 });
    expect(ops).toHaveLength(1);
    const query = ops[0].query;
    // All 7 fields must appear
    expect(query).toContain('id');
    expect(query).toContain('name');
    expect(query).toContain('price');
    expect(query).toContain('inStock');
    expect(query).toContain('sku');
    expect(query).toContain('category');
    expect(query).toContain('description');
  });

  it('respects maxDepth and does not stack overflow', () => {
    const circularSchema = buildSchema(`
      type A { b: B }
      type B { a: A }
      type Query { getA: A }
    `);
    // Should not throw
    expect(() => generateAll(circularSchema, { maxDepth: 5 })).not.toThrow();
  });

  it('generates inline fragments for union types', () => {
    const ops = generateAll(schemaWithUnion, { maxDepth: 10 });
    expect(ops[0].query).toContain('... on Cat');
    expect(ops[0].query).toContain('... on Dog');
  });

  it('resolves enum argument to first enum value', () => {
    const ops = generateAll(schemaWithEnum, { maxDepth: 10 });
    const findOp = ops.find(op => op.name === 'findByStatus');
    expect(findOp.variables.status).toBe('ACTIVE');
  });

  it('recurses into InputObject fields', () => {
    const ops = generateAll(schemaInputObject, { maxDepth: 10 });
    const createOp = ops.find(op => op.name === 'createUser');
    expect(createOp.variables.input).toEqual({ name: '', email: '' });
  });

  it('wraps list type default in array', () => {
    const listSchema = buildSchema(`
      type Query { getNames(tags: [String]): Boolean }
    `);
    const ops = generateAll(listSchema, { maxDepth: 10 });
    expect(ops[0].variables.tags).toEqual(['']);
  });
});
