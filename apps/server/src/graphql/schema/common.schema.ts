export const commonSchema = `#graphql
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

  enum ResourceStatus {
    DRAFT
    PUBLISHED
    ARCHIVED
  }

  enum SubmissionStatus {
    PENDING
    APPROVED
    REJECTED
  }

  enum SubmissionReviewDecision {
    APPROVE
    REJECT
  }

  enum UserRole {
    USER
    CREATOR
    ADMIN
  }

  enum CreatorVerificationStatus {
    PENDING
    VERIFIED
    REJECTED
    SUSPENDED
  }

  enum CreatorReviewDecision {
    APPROVE
    REJECT
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

  type AuthUser {
    id: ID!
    name: String!
    email: String!
    emailVerified: Boolean!
    image: String
    role: UserRole!
  }
`;
