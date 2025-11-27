import { defineAuth } from "@aws-amplify/backend";

/**
 * Define and configure your auth resource
 * Supports email/password authentication with custom user attributes
 * @see https://docs.amplify.aws/gen2/build-a-backend/auth
 */
export const auth = defineAuth({
  loginWith: {
    email: true,
  },
});
