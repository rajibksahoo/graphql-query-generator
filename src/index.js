import { Command } from "commander";
import path from "path";
import { fetchSchema } from "./fetchSchema.js";
import { generateAll } from "./generate.js";
import { writeOutputs } from "./writer.js";
import { generateInsomniaCollection } from "./insomnia.js";
import inquirer from "inquirer";

const program = new Command();

program
  .name("graphql-query-generator")
  .description("Generate GraphQL queries and mutations from a schema URL")
  .requiredOption("-u, --url <url>", "GraphQL endpoint URL (e.g. http://localhost:8085/graphql)")
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
  .action(async (options) => {
    try {
      console.log(`Fetching schema from ${options.url}...`);
      
      const headers = {};
      if (options.header) {
        options.header.forEach(h => {
          const [key, ...rest] = h.split(":");
          if (key && rest.length > 0) {
            headers[key.trim()] = rest.join(":").trim();
          }
        });
      }

      const schema = await fetchSchema(options.url, headers);
      console.log("Schema fetched successfully. Generating operations...");

      const genOptions = {
        maxDepth: options.maxDepth,
        excludeFields: options.exclude ? options.exclude.split(',').map(s => s.trim()) : []
      };

      let operations = generateAll(schema, genOptions);
      console.log(`Found ${operations.length} operations.`);

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
          console.log("No operations selected. Exiting...");
          process.exit(0);
        }
      }

      console.log(`Writing ${operations.length} operations to files...`);

      const outDir = path.resolve(process.cwd(), options.outdir);
      await writeOutputs(operations, outDir);

      const insomniaPath = await generateInsomniaCollection(operations, options.url, outDir);
      console.log(`Generated Insomnia collection: ${insomniaPath}`);

      console.log(`Done! Output saved to ${outDir}`);
    } catch (err) {
      console.error("Error:", err.message);
      process.exit(1);
    }
  });

program.parse(process.argv);
