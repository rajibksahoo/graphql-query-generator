# GraphQL Query Generator

A powerful Node.js CLI tool that automatically connects to any GraphQL endpoint, introspects the schema, and generates `.graphql` files for all available queries and mutations. It also creates corresponding `.json` files containing variable payloads populated with sensible, easily overridable default values.

## Features

- **Full Schema Introspection**: Connects to your GraphQL endpoint (e.g. `http://localhost:8085/graphql`) and extracts the complete AST.
- **Query & Mutation Generation**: Generates clean, ready-to-use `.graphql` templates for every query and mutation.
- **Smart Variable Extraction**: Extracts all required arguments and builds a complete, decoupled variables JSON file.
- **Easily Overridable Defaults**: Generates default scalar values and deeply nested input objects. You can easily configure the global default mappings (e.g., set `String` to always default to `""`) inside `src/defaults.js`.
- **Insomnia Collection Export**: Automatically generates an `insomnia_collection.json` file containing all your queries and variables, ready to be imported into Insomnia for immediate testing.

## Getting Started

### Prerequisites

- Node.js v18 or higher (uses native fetch)
- npm

### Installation

Clone the repository and install the dependencies:

```bash
git clone https://github.com/rajibksahoo/graphql-query-generator.git
cd graphql-query-generator
npm install
```

### Usage

Run the CLI tool from your terminal by passing the URL to your GraphQL API:

```bash
node src/index.js -u <YOUR_GRAPHQL_ENDPOINT>
```

#### Options

- `-u, --url <url>` (Required): The GraphQL endpoint URL to introspect.
- `-o, --outdir <path>` (Optional): The output directory where generated files will be saved (default is `output/`).
- `-H, --header <key:value>` (Optional): Custom HTTP headers to include in the introspection request (e.g., for Authorization).
- `-d, --max-depth <number>` (Optional): Maximum depth to traverse nested queries (default is 10).
- `-e, --exclude <fields>` (Optional): Comma-separated list of field names to exclude from the generated queries (e.g., `password,token`).
- `-i, --interactive` (Optional): Launches an interactive checkbox list to select which queries or mutations to generate (space to select, enter to confirm).
- `-t, --timeout <ms>` (Optional): Timeout for the introspection request in milliseconds (default is 30000).
- `--verbose` (Optional): Enables extra logging (e.g., the Insomnia collection path).
- `--quiet` (Optional): Suppresses all non-error output.
- `--dry-run` (Optional): Lists the operations that would be generated without writing any files.
- `-V, --version`: Prints the tool version.

**Examples:**
```bash
# Basic usage
node src/index.js -u http://localhost:8085/graphql

# Custom output directory
node src/index.js -u http://localhost:8085/graphql -o my-queries

# With Authorization Header
node src/index.js -u https://api.yoursite.com/graphql -H "Authorization: Bearer <token>"

# Limit depth and exclude specific fields
node src/index.js -u http://localhost:8085/graphql -d 5 -e email,isActive

# Interactive Mode (Select specific queries to generate)
node src/index.js -u http://localhost:8085/graphql -i

# Preview without writing files
node src/index.js -u http://localhost:8085/graphql --dry-run
```

### Config File

Instead of passing flags every time, you can place a `.graphqlgenrc.json` in the directory you run the tool from. CLI flags always override config file values.

```json
{
  "url": "http://localhost:8085/graphql",
  "outdir": "generated",
  "maxDepth": 8,
  "exclude": "createdAt,updatedAt",
  "header": ["Authorization: Bearer my-token"],
  "timeout": 15000
}
```

Supported keys: `url`, `outdir`, `header`, `maxDepth`, `exclude`, `timeout`, `verbose`, `quiet`.

> **Security note:** If you put an Authorization token in the config file, don't commit it. The tool also warns when an Authorization header is sent over plain `http://`.

### Customizing Default Values

You can customize the default values that the generator injects into the `.json` variables files by modifying `src/defaults.js`:

```javascript
export const typeDefaults = {
  String: "",
  Int: 0,
  Float: 0.0,
  Boolean: false,
  ID: "1",
  // Add your custom scalar defaults below
};
```
These defaults will recursively apply to complex nested `InputObjectTypes` encountered in mutations.

### Importing to Insomnia

Every time you run the tool, an `insomnia_collection.json` file is generated inside your output directory. You can import this file directly into Insomnia to start testing your queries immediately:

1. Open the Insomnia application.
2. Click the **+** (plus) icon or **Create** button next to your projects.
3. Select **Import From** -> **File**.
4. Choose the generated `output/insomnia_collection.json` file.
5. A new workspace named "GraphQL Generated Queries" will appear containing all your separated queries and variables ready for execution!

### Local Mock Server Testing

This project comes with a built-in mock GraphQL server so you can test the CLI without needing a real endpoint.

1. Start the mock server:
   ```bash
   npm run test-server
   ```
2. In a separate terminal, run the CLI against the mock server:
   ```bash
   node src/index.js -u http://localhost:8085/graphql
   ```
3. Check the `output/` directory for the generated `.graphql` and `.json` files!

### Running the Tests

```bash
npm test            # run the full Vitest suite (unit + integration)
npm run test:watch  # watch mode
```

The integration tests start their own Apollo server on port 18085 — no manual setup needed.

### Reliability Notes

- Output is written atomically: files are staged in `<outdir>.tmp` and renamed into place, so a failed run never leaves a partially-written output directory.
- The introspection request times out after 30 seconds by default (configurable with `--timeout`).
