import { describe, it, expect } from 'vitest';
import { generateInsomniaCollection } from '../../src/insomnia.js';
import os from 'os';
import path from 'path';
import fs from 'fs/promises';

describe('generateInsomniaCollection', () => {
  it('creates a valid collection file', async () => {
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'insomnia-test-'));
    const operations = [
      { query: 'query GetUser { getUser { id } }', variables: { id: '1' }, opName: 'GetUser', name: 'getUser', type: 'query' },
      { query: 'mutation CreateUser { createUser { id } }', variables: { name: '' }, opName: 'CreateUser', name: 'createUser', type: 'mutation' }
    ];
    const url = 'http://localhost:8085/graphql';

    const filePath = await generateInsomniaCollection(operations, url, tmpDir);
    const raw = await fs.readFile(filePath, 'utf8');
    const collection = JSON.parse(raw);

    expect(collection._type).toBe('export');
    expect(collection.__export_format).toBe(4);
    // workspace + folder + 2 requests = 4 resources
    expect(collection.resources).toHaveLength(4);

    const folder = collection.resources.find(r => r._type === 'request_group');
    expect(folder.name).toBe(url);

    const requests = collection.resources.filter(r => r._type === 'request');
    expect(requests).toHaveLength(2);

    const req = requests[0];
    expect(req.body.mimeType).toBe('application/json');

    const bodyParsed = JSON.parse(req.body.text);
    expect(typeof bodyParsed.variables).toBe('object');
    expect(typeof bodyParsed.query).toBe('string');
    expect(typeof bodyParsed.operationName).toBe('string');

    await fs.rm(tmpDir, { recursive: true, force: true });
  });
});
