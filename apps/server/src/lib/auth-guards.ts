
import { GraphQLError } from "graphql";

import type { GraphQLContext } from "../types/context.js";

export function requireAuth(context: GraphQLContext) {
  const session = context.session;

  if (!session) {
    throw new GraphQLError("Authentication required.", {
      extensions: {
        code: "UNAUTHENTICATED",
      },
    });
  }

  return session.user;
}

export function requireRole(
  context: GraphQLContext,
  allowedRoles: readonly string[],
) {
  const user = requireAuth(context);

  if (
    typeof user.role !== "string" ||
    !allowedRoles.includes(user.role)
  ) {
    throw new GraphQLError("You are not authorized to perform this action.", {
      extensions: {
        code: "FORBIDDEN",
      },
    });
  }

  return user;
}
