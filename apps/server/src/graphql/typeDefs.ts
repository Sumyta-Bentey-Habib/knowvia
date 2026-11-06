
export const typeDefs = `#graphql
  enum ResourceType {
    ARTICLE
    VIDEO
    COURSE
    TUTORIAL
    DOCUMENT
    OTHER
  }

  enum AccessType {
    FREE
    PAID
    SUBSCRIPTION
    FREEMIUM
    UNKNOWN
  }

  enum DifficultyLevel {
    BEGINNER
    INTERMEDIATE
    ADVANCED
    ALL_LEVELS
    UNKNOWN
  }

  enum ResourceSource {
    ADMIN_CURATED
    CREATOR_SUBMISSION
  }

  type Provider {
    id: ID!
    name: String!
    slug: String!
    websiteUrl: String
  }

    enum UserRole {
    USER
    CREATOR
    ADMIN
  }

  type Category {
    id: ID!
    name: String!
    slug: String!
    description: String
  }

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

  type PageInfo {
    totalItems: Int!
    currentPage: Int!
    pageSize: Int!
    totalPages: Int!
    hasNextPage: Boolean!
    hasPreviousPage: Boolean!
  }

  type ResourceConnection {
    items: [Resource!]!
    pageInfo: PageInfo!
  }

  type Query {
    health: String!
    providers: [Provider!]!
    categories: [Category!]!

    resources(
      filters: ResourceFiltersInput
      pagination: PaginationInput
    ): ResourceConnection!
  }
    type AuthUser {
    id: ID!
    name: String!
    email: String!
    emailVerified: Boolean!
    image: String
    role: UserRole!
  }
`;
