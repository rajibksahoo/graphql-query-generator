import fs from "fs/promises";
import path from "path";

function generateId(prefix) {
  // simple pseudo-random id generator for insomnia
  return `${prefix}_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
}

export async function generateInsomniaCollection(operations, url, outDir) {
  const workspaceId = generateId('wrk');
  const folderId = generateId('fld');
  
  const resources = [
    {
      _id: workspaceId,
      parentId: null,
      modified: Date.now(),
      created: Date.now(),
      name: "GraphQL Generated Queries",
      description: "Auto-generated GraphQL collection",
      scope: "collection",
      _type: "workspace"
    },
    {
      _id: folderId,
      parentId: workspaceId,
      modified: Date.now(),
      created: Date.now(),
      name: url,
      description: "Auto-generated folder for endpoint",
      _type: "request_group"
    }
  ];

  for (const op of operations) {
    const reqId = generateId('req');
    const bodyTextObj = {
      query: op.query,
      variables: op.variables,
      operationName: op.opName
    };

    resources.push({
      _id: reqId,
      parentId: folderId,
      modified: Date.now(),
      created: Date.now(),
      url: url,
      name: op.name,
      description: `Generated ${op.type}`,
      method: "POST",
      body: {
        mimeType: "application/json",
        text: JSON.stringify(bodyTextObj)
      },
      headers: [
        {
          name: "Content-Type",
          value: "application/json"
        }
      ],
      _type: "request"
    });
  }

  const exportData = {
    _type: "export",
    __export_format: 4,
    __export_date: new Date().toISOString(),
    __export_source: "graphql-query-generator:v1",
    resources: resources
  };

  const collectionPath = path.join(outDir, "insomnia_collection.json");
  await fs.writeFile(collectionPath, JSON.stringify(exportData, null, 2), "utf8");
  
  return collectionPath;
}
