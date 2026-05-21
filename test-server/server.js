import { ApolloServer, gql } from "apollo-server";

const typeDefs = gql`
  type User {
    id: ID!
    name: String!
    email: String
    age: Int
    isActive: Boolean
  }

  input UserInput {
    name: String!
    email: String
    age: Int
    isActive: Boolean
  }

  type Query {
    getUser(id: ID!): User
    getAllUsers(limit: Int, offset: Int): [User]
    search(query: String!): [User]
  }

  type Mutation {
    createUser(input: UserInput!): User
    updateUser(id: ID!, input: UserInput!): User
    deleteUser(id: ID!): Boolean
  }
`;

const resolvers = {
  Query: {
    getUser: () => ({ id: "1", name: "Alice", email: "alice@test.com", age: 30, isActive: true }),
    getAllUsers: () => [],
    search: () => [],
  },
  Mutation: {
    createUser: () => ({ id: "2", name: "Bob", email: "bob@test.com", age: 25, isActive: false }),
    updateUser: () => ({ id: "1", name: "Alice", email: "alice2@test.com", age: 31, isActive: true }),
    deleteUser: () => true,
  },
};

const server = new ApolloServer({ typeDefs, resolvers });

server.listen({ port: 8085 }).then(({ url }) => {
  console.log(`🚀 Mock server ready at ${url}graphql`);
});
