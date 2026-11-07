export const submissionSchema = `#graphql
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

  extend type Query {
    myResourceSubmissions: [ResourceSubmission!]!

    resourceSubmissions(
      status: SubmissionStatus
    ): [ResourceSubmission!]!
  }

  extend type Mutation {
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
  }
`;
