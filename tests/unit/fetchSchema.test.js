import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fetchSchema } from '../../src/fetchSchema.js';

describe('fetchSchema', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('throws on non-2xx response', async () => {
    fetch.mockResolvedValue({ ok: false, status: 401, statusText: 'Unauthorized' });
    await expect(fetchSchema('http://example.com/graphql')).rejects.toThrow('401');
  });

  it('throws on GraphQL errors', async () => {
    fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ errors: [{ message: 'introspection disabled' }] })
    });
    await expect(fetchSchema('http://example.com/graphql')).rejects.toThrow('introspection');
  });

  it('throws on missing __schema', async () => {
    fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ data: { notASchema: true } })
    });
    await expect(fetchSchema('http://example.com/graphql')).rejects.toThrow('introspection result');
  });
});
