import { createRequire } from 'module';
import { Command } from "commander";
import path from "path";
import { fetchSchema } from "./fetchSchema.js";
import { generateAll } from "./generate.js";
import { writeOutputs } from "./writer.js";
import { generateInsomniaCollection } from "./insomnia.js";
import inquirer from "inquirer";
import { loadConfig } from './config.js';

const require = createRequire(import.meta.url);
const pkg = require('../package.json');

const program = new Command();

program
  .name("graphql-query-generator")
  .description("Generate GraphQL queries and mutations from a schema URL")
  .version(pkg.version)
  .option("-u, --url <url>", "GraphQL endpoint URL (e.g. http://localhost:8085/graphql)")
  .option("-o, --outdir <path>", "Output directory", "output")
  .option("-H, --header <key:value...>", "Custom headers to include in introspection request")
  .option("-d, --max-depth <number>", "Maximum depth for nested queries", (val) => {
    const n = parseInt(val, 10);
    if (isNaN(n) || n < 1) {
      console.error(`Error: --max-depth must be a positive integer, got: ${val}`);
      process.exit(1);
    }
    return n;
  }, 10)
  .option("-e, --exclude <fields>", "Comma-separated list of fields to exclude from queries")
  .option("-i, --interactive", "Interactive mode to manually select which queries/mutations to generate")
  .option("-t, --timeout <ms>", "Fetch timeout in milliseconds", (val) => {
    const n = parseInt(val, 10);
    if (isNaN(n) || n < 1) {
      console.error(`Error: --timeout must be a positive integer, got: ${val}`);
      process.exit(1);
    }
    return n;
  }, 30000)
  .option("--verbose", "Enable verbose logging")
  .option("--quiet", "Suppress all non-error output")
  .option("--dry-run", "Preview operations without writing files")
  .action(async (options) => {
    try {
      const fileConfig = loadConfig();
      // CLI flags override config file values
      const merged = { ...fileConfig, ...Object.fromEntries(
        Object.entries(options).filter(([, v]) => v !== undefined && v !== false)
      ) };
      // Apply merged values back (url from config if not in CLI)
      if (!options.url && merged.url) options.url = merged.url;
      if (!options.outdir || options.outdir === 'output') options.outdir = merged.outdir || options.outdir;
      if (merged.maxDepth && options.maxDepth === 10) options.maxDepth = merged.maxDepth;
      if (!options.exclude && merged.exclude) options.exclude = merged.exclude;
      if (!options.timeout || options.timeout === 30000) options.timeout = merged.timeout || options.timeout || 30000;
      if (merged.verbose) options.verbose = true;
      if (merged.quiet) options.quiet = true;

      if (!options.url) {
        console.error("Error: --url is required (or set 'url' in .graphqlgenrc.json)");
        process.exit(1);
      }

      const log = (msg) => { if (!options.quiet) console.log(msg); };
      const verbose = (msg) => { if (options.verbose && !options.quiet) console.log(msg); };

      log(`Fetching schema from ${options.url}...`);

      const headers = {};
      if (options.header) {
        options.header.forEach(h => {
          const [key, ...rest] = h.split(":");
          if (key && rest.length > 0) {
            headers[key.trim()] = rest.join(":").trim();
          }
        });
      }

      const hasAuthHeader = Object.keys(headers).some(k => k.toLowerCase() === 'authorization');
      if (hasAuthHeader && options.url.startsWith('http://')) {
        console.warn('Warning: Sending Authorization header over an unencrypted HTTP connection.');
      }

      const schema = await fetchSchema(options.url, headers, options.timeout);
      log("Schema fetched successfully. Generating operations...");

      const genOptions = {
        maxDepth: options.maxDepth,
        excludeFields: options.exclude ? options.exclude.split(',').map(s => s.trim()) : []
      };

      let operations = generateAll(schema, genOptions);
      log(`Found ${operations.length} operations.`);

      if (options.interactive && operations.length > 0) {
        const choices = operations.map(op => ({
          name: `[${op.type.toUpperCase()}] ${op.name}`,
          value: op.name
        }));

        let selectedOps;
        try {
          const result = await inquirer.prompt([
            {
              type: "checkbox",
              name: "selectedOps",
              message: "Select queries/mutations to generate (space to select, enter to confirm):",
              choices,
              pageSize: 20
            }
          ]);
          selectedOps = result.selectedOps;
        } catch (err) {
          if (err.isTtyError || (err.message && (err.message.includes('force closed') || err.message.includes('canceled')))) {
            process.exit(0);
          }
          throw err;
        }

        operations = operations.filter(op => selectedOps.includes(op.name));

        if (operations.length === 0) {
          log("No operations selected. Exiting...");
          process.exit(0);
        }
      }

      if (options.dryRun) {
        log(`[Dry run] Would generate ${operations.length} operations:`);
        operations.forEach(op => log(`  [${op.type.toUpperCase()}] ${op.name}`));
        log('[Dry run] No files written.');
        return;
      }

      log(`Writing ${operations.length} operations to files...`);

      const outDir = path.resolve(process.cwd(), options.outdir);
      await writeOutputs(operations, outDir);

      const insomniaPath = await generateInsomniaCollection(operations, options.url, outDir);
      verbose(`Generated Insomnia collection: ${insomniaPath}`);

      log(`Done! Output saved to ${outDir}`);
    } catch (err) {
      console.error("Error:", err.message);
      process.exit(1);
    }
  });

program.parse(process.argv);
