import Password from "./customProfile"
import { convexAuth } from "@convex-dev/auth/server";
import { ResendOTPPasswordReset } from "./ResendOTPPasswordReset";
import { ResendOTP } from "./ResendOTP";
import { query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";


export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [Password],
  callbacks: {
    createOrUpdateUser: async (ctx, { profile, existingUserId }) => {
      if (existingUserId) return existingUserId;
      const {
        email,
        firstName,
        lastName,
        role,
        username,
        childrenJson, // keep aside, don’t insert into users
      } = profile as Record<string, any>;

      // Only insert the fields your schema knows about
      const userId = await ctx.db.insert("users", {
        email,
        firstName,
        lastName,
        role,
        username,
      });

      // Handle children separately
      if (childrenJson) {
        const children = JSON.parse(childrenJson);
        for (const child of children) {
          await ctx.db.insert("kids", {
            parentId: userId,
            ...child,
          });
        }
      }

      return userId;
    }
  }

});

export const currentUser = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      return null;
    }
    return await ctx.db.get(userId);
  },
});