export const userSchema = `#graphql
  extend type Query {
    me: AuthUser
    myInterests: [Category!]!
  }

  extend type Mutation {
    updateMyInterests(categoryIds: [ID!]!): [Category!]!
  }
`;
