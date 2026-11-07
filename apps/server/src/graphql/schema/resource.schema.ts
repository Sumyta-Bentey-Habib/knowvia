export const resourceSchema = `#graphql
  type Resource {
    id: ID!
    title: String!
    slug: String!
    summary: String
    url: String!
    thumbnailUrl: String
    resourceType: ResourceType!
    accessType: AccessType!
    difficulty: DifficultyLevel!
    language: String
    durationMinutes: Int
    status: ResourceStatus!
    source: ResourceSource!
    createdAt: String!
    provider: Provider!
    categories: [Category!]!
  }

  input ResourceFiltersInput {
    search: String
    providerSlug: String
    categorySlug: String
    resourceType: ResourceType
    difficulty: DifficultyLevel
    accessType: AccessType
  }

  input PaginationInput {
    page: Int = 1
    limit: Int = 12
  }

  input CreateAdminResourceInput {
    title: String!
    url: String!
    summary: String
    thumbnailUrl: String
    resourceType: ResourceType!
    accessType: AccessType
    difficulty: DifficultyLevel
    language: String
    durationMinutes: Int
    providerId: ID!
    categoryIds: [ID!]
    status: ResourceStatus = DRAFT
  }

  input UpdateAdminResourceInput {
    title: String
    url: String
    summary: String
    thumbnailUrl: String
    resourceType: ResourceType
    accessType: AccessType
    difficulty: DifficultyLevel
    language: String
    durationMinutes: Int
    providerId: ID
    categoryIds: [ID!]
    status: ResourceStatus
  }

  extend type Query {
    resources(
      filters: ResourceFiltersInput
      pagination: PaginationInput
    ): ResourceConnection!

    resource(slug: String!): Resource

    bookmarks: [Resource!]!
  }

  type Mutation {
    bookmarkResource(resourceId: ID!): Resource!
    removeBookmark(resourceId: ID!): Boolean!

    createAdminResource(
      input: CreateAdminResourceInput!
    ): Resource!

    updateAdminResource(
      resourceId: ID!
      input: UpdateAdminResourceInput!
    ): Resource!

    archiveResource(resourceId: ID!): Resource!
  }
`;
