
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

  type CreatorProfile {
    id: ID!
    userId: ID!
    displayName: String!
    bio: String
    websiteUrl: String
    verificationStatus: CreatorVerificationStatus!
    verifiedAt: String
    reviewedAt: String
    rejectionReason: String
    createdAt: String!
    updatedAt: String!
  }

  type ResourceSubmission {
    id: ID!
    title: String!
    url: String!
    summary: String
    thumbnailUrl: String
    resourceType: ResourceType!
    accessType: AccessType!
    difficulty: DifficultyLevel!
    language: String
    durationMinutes: Int
    status: SubmissionStatus!
    submittedById: ID!
    provider: Provider!
    category: Category
    reviewedById: ID
    reviewedAt: String
    rejectionReason: String
    createdAt: String!
    updatedAt: String!
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

  type Query {
    health: String!
    me: AuthUser

    providers: [Provider!]!
    categories: [Category!]!

    resources(
      filters: ResourceFiltersInput
      pagination: PaginationInput
    ): ResourceConnection!

    resource(slug: String!): Resource

    bookmarks: [Resource!]!

    myInterests: [Category!]!

    myCreatorProfile: CreatorProfile

    creatorApplications(
      status: CreatorVerificationStatus
    ): [CreatorProfile!]!

    myResourceSubmissions: [ResourceSubmission!]!

    resourceSubmissions(
      status: SubmissionStatus
    ): [ResourceSubmission!]!
  }

  type Mutation {
    bookmarkResource(resourceId: ID!): Resource!
    removeBookmark(resourceId: ID!): Boolean!

    updateMyInterests(categoryIds: [ID!]!): [Category!]!

    applyForCreator(
      displayName: String!
      bio: String
      websiteUrl: String
    ): CreatorProfile!

    reviewCreatorApplication(
      profileId: ID!
      decision: CreatorReviewDecision!
      rejectionReason: String
    ): CreatorProfile!

    submitResource(
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
      categoryId: ID
    ): ResourceSubmission!

    reviewResourceSubmission(
      submissionId: ID!
      decision: SubmissionReviewDecision!
      rejectionReason: String
    ): ResourceSubmission!

    createAdminResource(
      input: CreateAdminResourceInput!
    ): Resource!

    updateAdminResource(
      resourceId: ID!
      input: UpdateAdminResourceInput!
    ): Resource!

    archiveResource(
      resourceId: ID!
    ): Resource!
  }
`;
