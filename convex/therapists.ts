import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const getTherapistProfile = query({
    args: {},
    handler: async (ctx) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) {
            throw new Error("Not authenticated");
        }
        const user = await ctx.db.get(userId);
        if (!user || user.role !== "therapist") {
            throw new Error("User is not a therapist");
        }
        return user;
    },
});

export const updateTherapistProfile = mutation({
    args: {
        firstName: v.optional(v.string()),
        lastName: v.optional(v.string()),
        phone: v.optional(v.string()),
        license: v.optional(v.string()),
        experience: v.optional(v.number()),
        specialties: v.optional(v.string()),
        institutions: v.optional(v.string()),
        gender: v.optional(v.string()),
        birthDate: v.optional(v.number()),
        languages: v.optional(v.string()),
        bio: v.optional(v.string()),
        profilePicture: v.optional(v.id("_storage")),
    },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) {
            throw new Error("Not authenticated");
        }
        const user = await ctx.db.get(userId);
        if (!user || user.role !== "therapist") {
            throw new Error("User is not a therapist");
        }

        const updates: any = {};
        if (args.firstName !== undefined) updates.firstName = args.firstName;
        if (args.lastName !== undefined) updates.lastName = args.lastName;
        if (args.phone !== undefined) updates.phone = args.phone;
        if (args.license !== undefined) updates.license = args.license;
        if (args.experience !== undefined) updates.experience = args.experience;
        if (args.specialties !== undefined) updates.specialties = args.specialties;
        if (args.institutions !== undefined) updates.institutions = args.institutions;
        if (args.gender !== undefined) updates.gender = args.gender;
        if (args.birthDate !== undefined) updates.birthDate = args.birthDate;
        if (args.languages !== undefined) updates.languages = args.languages;
        if (args.bio !== undefined) updates.bio = args.bio;
        if (args.profilePicture !== undefined) updates.profilePicture = args.profilePicture;

        await ctx.db.patch(userId, updates);
        return await ctx.db.get(userId);
    },
});

export const getAllChildren = query({
    args: {},
    handler: async (ctx) => {
        const children = await ctx.db.query("kids").collect();
        const childrenWithReports = await Promise.all(
            children.map(async (child) => {
                // Get the most recent report for this child
                const reports = await ctx.db
                    .query("reports")
                    .withIndex("childId", (q) => q.eq("childId", child._id))
                    .order("desc")
                    .take(1);
                
                const lastEvaluationDate = reports.length > 0 ? reports[0].createdAt : undefined;
                
                return {
                    ...child,
                    lastEvaluationDate,
                };
            })
        );
        return childrenWithReports;
    },
});

export const getChildById = query({
    args: { childId: v.id("kids") },
    handler: async (ctx, args) => {
        const child = await ctx.db.get(args.childId);
        if (!child) {
            throw new Error("Child not found");
        }
        return child;
    },
});

export const getChildReports = query({
    args: { childId: v.id("kids") },
    handler: async (ctx, args) => {
        const reports = await ctx.db
            .query("reports")
            .withIndex("childId", (q) => q.eq("childId", args.childId))
            .order("desc")
            .collect();
        return reports;
    },
});

export const getTherapistById = query({
    args: { therapistId: v.id("users") },
    handler: async (ctx, args) => {
        const therapist = await ctx.db.get(args.therapistId);
        if (!therapist || therapist.role !== "therapist") {
            return null;
        }
        return therapist;
    },
});

