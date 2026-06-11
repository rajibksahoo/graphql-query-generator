import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { ApolloServer, gql } from 'apollo-server';
import { fetchSchema } from '../../src/fetchSchema.js';
import { generateAll } from '../../src/generate.js';
import { writeOutputs } from '../../src/writer.js';
import os from 'os';
import path from 'path';
import fs from 'fs/promises';

const typeDefs = gql`
  type User {
    id: ID!
    name: String!
    email: String
  }
  type Query {
    getUser(id: ID!): User
    getAllUsers: [User]
  }
  type Mutation {
    createUser(name: String!): User
  }
`;

const resolvers = {
  Query: {
    getUser: () => ({ id: '1', name: 'Test', email: 'test@example.com' }),
    getAllUsers: () => [],
  },
  Mutation: {
    createUser: (_, { name }) => ({ id: '2', name, email: null }),
  },
};

describe('pipeline integration', () => {
  let server;
  let tmpDir;
  const PORT = 18085;
  const URL = `http://localhost:${PORT}/graphql`;

  beforeAll(async () => {
    server = new ApolloServer({ typeDefs, resolvers });
    await server.listen({ port: PORT });
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'pipeline-test-'));
  });

  afterAll(async () => {
    await server.stop();
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  it('fetches schema and generates operations', async () => {
    const schema = await fetchSchema(URL);
    const operations = generateAll(schema, { maxDepth: 5 });
    expect(operations.length).toBeGreaterThan(0);
    expect(operations.some(op => op.type === 'query')).toBe(true);
    expect(operations.some(op => op.type === 'mutation')).toBe(true);
  });

  it('writes output files correctly', async () => {
    const schema = await fetchSchema(URL);
    const operations = generateAll(schema, { maxDepth: 5 });
    await writeOutputs(operations, tmpDir);

    const queryFiles = await fs.readdir(path.join(tmpDir, 'queries'));
    expect(queryFiles.some(f => f.endsWith('.graphql'))).toBe(true);
    expect(queryFiles.some(f => f.endsWith('.json'))).toBe(true);

    const mutationFiles = await fs.readdir(path.join(tmpDir, 'mutations'));
    expect(mutationFiles.some(f => f.endsWith('.graphql'))).toBe(true);
  });
});
