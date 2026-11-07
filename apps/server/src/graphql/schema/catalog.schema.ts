export const catalogSchema = `#graphql
  input CreateProviderInput {
    name: String!
    slug: String!
    websiteUrl: String
  }

  input UpdateProviderInput {
    name: String
    slug: String
    websiteUrl: String
  }

  input CreateCategoryInput {
    name: String!
    slug: String!
    description: String
    parentId: ID
  }

  input UpdateCategoryInput {
    name: String
    slug: String
    description: String
    parentId: ID
  }

  extend type Query {
    providers: [Provider!]!
    categories: [Category!]!

    adminProviders: [Provider!]!
    adminCategories: [Category!]!
  }

  extend type Mutation {
    createProvider(input: CreateProviderInput!): Provider!
    updateProvider(
      providerId: ID!
      input: UpdateProviderInput!
    ): Provider!
    setProviderActive(
      providerId: ID!
      isActive: Boolean!
    ): Provider!

    createCategory(input: CreateCategoryInput!): Category!
    updateCategory(
      categoryId: ID!
      input: UpdateCategoryInput!
    ): Category!
    setCategoryActive(
      categoryId: ID!
      isActive: Boolean!
    ): Category!
  }
`;
