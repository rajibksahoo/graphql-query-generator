import { Command } from "commander";
import path from "path";
import { fetchSchema } from "./fetchSchema.js";
import { generateAll } from "./generate.js";
import { writeOutputs } from "./writer.js";
import { generateInsomniaCollection } from "./insomnia.js";

const program = new Command();

program
  .name("graphql-query-generator")
  .description("Generate GraphQL queries and mutations from a schema URL")
  .requiredOption("-u, --url <url>", "GraphQL endpoint URL (e.g. http://localhost:8085/graphql)")
  .option("-o, --outdir <path>", "Output directory", "output")
  .option("-H, --header <key:value...>", "Custom headers to include in introspection request")
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

      const operations = generateAll(schema);
      console.log(`Found ${operations.length} operations. Writing to files...`);

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
