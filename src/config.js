import fs from 'fs';
import path from 'path';

export function loadConfig() {
  const configPath = path.join(process.cwd(), '.graphqlgenrc.json');
  if (!fs.existsSync(configPath)) return {};
  try {
    return JSON.parse(fs.readFileSync(configPath, 'utf8'));
  } catch (err) {
    console.error(`Warning: Failed to parse .graphqlgenrc.json: ${err.message}`);
    return {};
  }
}
