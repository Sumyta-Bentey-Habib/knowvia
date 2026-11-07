export const catalogSchema = `#graphql
  extend type Query {
    providers: [Provider!]!
    categories: [Category!]!
  }
`;
