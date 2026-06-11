import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { writeOutputs } from '../../src/writer.js';
import os from 'os';
import path from 'path';
import fs from 'fs/promises';

describe('writeOutputs', () => {
  let tmpDir;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'writer-test-'));
  });

  afterEach(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  it('creates queries and mutations subdirs with correct files', async () => {
    const operations = [
      { type: 'query', name: 'getUser', query: 'query GetUser { getUser { id } }', variables: { id: '1' } },
      { type: 'mutation', name: 'createUser', query: 'mutation CreateUser { createUser { id } }', variables: { name: '' } }
    ];

    await writeOutputs(operations, tmpDir);

    const queryGraphql = await fs.readFile(path.join(tmpDir, 'queries', 'getUser.graphql'), 'utf8');
    expect(queryGraphql).toContain('query GetUser');

    const queryVars = JSON.parse(await fs.readFile(path.join(tmpDir, 'queries', 'getUser.json'), 'utf8'));
    expect(queryVars).toEqual({ id: '1' });

    const mutGraphql = await fs.readFile(path.join(tmpDir, 'mutations', 'createUser.graphql'), 'utf8');
    expect(mutGraphql).toContain('mutation CreateUser');
  });

  it('clears stale files on re-run', async () => {
    const ops1 = [{ type: 'query', name: 'oldQuery', query: 'query OldQuery { old }', variables: {} }];
    await writeOutputs(ops1, tmpDir);

    const ops2 = [{ type: 'query', name: 'newQuery', query: 'query NewQuery { new }', variables: {} }];
    await writeOutputs(ops2, tmpDir);

    const files = await fs.readdir(path.join(tmpDir, 'queries'));
    expect(files).not.toContain('oldQuery.graphql');
    expect(files).toContain('newQuery.graphql');
  });
});
