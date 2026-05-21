import { getIntrospectionQuery, buildClientSchema } from "graphql";

export async function fetchSchema(url, headers = {}) {
  const query = getIntrospectionQuery();
  
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    body: JSON.stringify({ query }),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch schema from ${url}: ${response.status} ${response.statusText}`);
  }

  const { data, errors } = await response.json();
  if (errors) {
    throw new Error(`GraphQL introspection errors: ${JSON.stringify(errors, null, 2)}`);
  }

  // Convert the introspection response into a GraphQLSchema object
  return buildClientSchema(data);
}
