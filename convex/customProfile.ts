import { Password } from "@convex-dev/auth/providers/Password";
import { DataModel } from "./_generated/dataModel"; // This path assumes the file is in your `convex/` directory.
// Make sure to import your OTP handlers. The path might differ for your project.
import { ResendOTP} from "./ResendOTP"
import {ResendOTPPasswordReset} from "./ResendOTPPasswordReset";

/**
 * This custom password provider allows you to save additional fields
 * from your sign-up form to the `users` table in your Convex database.
 * * To use this, replace the built-in `Password` provider in your `convex/auth.ts`
 * file with an import from this file.
 */
export default Password<DataModel>({
    profile(params, ctx) {
        // `params` are the values sent from the frontend `signIn` call.
        // During sign-in, only email and password are provided.
        // Only return full profile data during sign-up.
        
        // For sign-in, we don't need to return profile data
        // The auth system will find the user by email
        if (params.flow === "signIn") {
            return {
                email: params.email as string,
            };
        }

        // For sign-up, return all profile fields
        return {
            email: params.email as string,
            firstName: params.firstName as string,
            lastName: params.lastName as string,
            username: params.username as string,
            role: params.role as ("therapist"|"parent"),
            childrenJson: params.childrenJson as string | undefined
        };
    },
    // Add your email verification and password reset handlers here
    verify: ResendOTP,
    reset: ResendOTPPasswordReset,
});