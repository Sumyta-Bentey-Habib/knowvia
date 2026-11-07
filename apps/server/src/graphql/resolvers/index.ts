import { catalogResolvers } from "./catalog.resolvers.js";
import { creatorResolvers } from "./creator.resolvers.js";
import { resourceResolvers } from "./resource.resolvers.js";
import { submissionResolvers } from "./submission.resolvers.js";
import { userResolvers } from "./user.resolvers.js";

export const resolvers = {
    Query: {
        health: () => "learnbraid API is running 🚀",

        ...catalogResolvers.Query,
        ...resourceResolvers.Query,
        ...creatorResolvers.Query,
        ...submissionResolvers.Query,
        ...userResolvers.Query,
    },

    Mutation: {
        ...resourceResolvers.Mutation,
        ...creatorResolvers.Mutation,
        ...submissionResolvers.Mutation,
    },

    Resource: resourceResolvers.Resource,
    CreatorProfile: creatorResolvers.CreatorProfile,
    ResourceSubmission: submissionResolvers.ResourceSubmission,
};
