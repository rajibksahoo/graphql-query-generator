import fs from "fs/promises";
import path from "path";

export async function writeOutputs(operations, outDir) {
  const tmpDir = outDir + '.tmp';
  const queriesDir = path.join(tmpDir, "queries");
  const mutationsDir = path.join(tmpDir, "mutations");

  // Clean up any previous failed temp write
  await fs.rm(tmpDir, { recursive: true, force: true });
  await fs.mkdir(queriesDir, { recursive: true });
  await fs.mkdir(mutationsDir, { recursive: true });

  for (const op of operations) {
    const dir = op.type === "query" ? queriesDir : mutationsDir;

    const queryPath = path.join(dir, `${op.name}.graphql`);
    await fs.writeFile(queryPath, op.query, "utf8");

    const varsPath = path.join(dir, `${op.name}.json`);
    await fs.writeFile(varsPath, JSON.stringify(op.variables, null, 2), "utf8");
  }

  // Atomically replace the output directory
  await fs.rm(outDir, { recursive: true, force: true });
  await fs.rename(tmpDir, outDir);
}
