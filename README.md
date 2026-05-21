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

**Examples:**
```bash
# Basic usage
node src/index.js -u http://localhost:8085/graphql

# Custom output directory
node src/index.js -u http://localhost:8085/graphql -o my-queries

# With Authorization Header
node src/index.js -u https://api.yoursite.com/graphql -H "Authorization: Bearer <token>"
```

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
