import { commonSchema } from "./common.schema.js";
import { catalogSchema } from "./catalog.schema.js";
import { resourceSchema } from "./resource.schema.js";
import { userSchema } from "./user.schema.js";
import { creatorSchema } from "./creator.schema.js";
import { submissionSchema } from "./submission.schema.js";

const rootSchema = `#graphql
  type Query {
    health: String!
  }
`;

export const typeDefs = [
    rootSchema,
    commonSchema,
    catalogSchema,
    resourceSchema,
    userSchema,
    creatorSchema,
    submissionSchema,
].join("\n");
