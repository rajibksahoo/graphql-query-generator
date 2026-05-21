import fs from "fs/promises";
import path from "path";

export async function writeOutputs(operations, outDir) {
  const queriesDir = path.join(outDir, "queries");
  const mutationsDir = path.join(outDir, "mutations");

  // Clear existing directories to prevent stale files from remaining
  await fs.rm(queriesDir, { recursive: true, force: true });
  await fs.rm(mutationsDir, { recursive: true, force: true });

  await fs.mkdir(queriesDir, { recursive: true });
  await fs.mkdir(mutationsDir, { recursive: true });

  for (const op of operations) {
    const dir = op.type === "query" ? queriesDir : mutationsDir;
    
    const queryPath = path.join(dir, `${op.name}.graphql`);
    await fs.writeFile(queryPath, op.query, "utf8");

    const varsPath = path.join(dir, `${op.name}.json`);
    await fs.writeFile(varsPath, JSON.stringify(op.variables, null, 2), "utf8");
    
    console.log(`Generated ${op.type}: ${op.name}`);
  }
}
