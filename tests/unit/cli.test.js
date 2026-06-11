import { describe, it, expect } from 'vitest';
import { execFile } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';

const execFileAsync = promisify(execFile);
const cliPath = path.resolve(fileURLToPath(import.meta.url), '../../../src/index.js');

// These tests load the real CLI entry point in a child process, catching
// module-level errors (bad imports, syntax errors) that unit tests miss.
describe('CLI entry point', () => {
  it('prints the version with --version', async () => {
    const { stdout } = await execFileAsync('node', [cliPath, '--version']);
    expect(stdout.trim()).toMatch(/^\d+\.\d+\.\d+$/);
  });

  it('prints usage with --help', async () => {
    const { stdout } = await execFileAsync('node', [cliPath, '--help']);
    expect(stdout).toContain('--url');
    expect(stdout).toContain('--max-depth');
    expect(stdout).toContain('--timeout');
    expect(stdout).toContain('--dry-run');
  });

  it('exits with an error when no url is given', async () => {
    // Run from a temp dir so a .graphqlgenrc.json in the repo can't supply a url
    await expect(execFileAsync('node', [cliPath], { cwd: os.tmpdir() })).rejects.toMatchObject({
      code: 1,
      stderr: expect.stringContaining('--url is required'),
    });
  });

  it('rejects a non-numeric --max-depth at parse time', async () => {
    await expect(
      execFileAsync('node', [cliPath, '-u', 'http://localhost:9/graphql', '-d', 'abc'])
    ).rejects.toMatchObject({
      code: 1,
      stderr: expect.stringContaining('positive integer'),
    });
  });
});
