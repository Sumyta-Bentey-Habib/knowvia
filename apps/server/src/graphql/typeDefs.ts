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

  type Query {
    health: String!
    providers: [Provider!]!
    categories: [Category!]!
    resources: [Resource!]!
  }
`;
