export const creatorSchema = `#graphql
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

  extend type Query {
    myCreatorProfile: CreatorProfile

    creatorApplications(
      status: CreatorVerificationStatus
    ): [CreatorProfile!]!
  }

  extend type Mutation {
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
  }
`;
