import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const createSession = mutation({
    args: {
        childId: v.id("kids"),
        scheduledDate: v.string(),
        scheduledTime: v.string(),
        duration: v.number(),
        type: v.string(),
        status: v.union(
            v.literal("confirmed"),
            v.literal("pending"),
            v.literal("canceled"),
        ),
        notes: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const therapistId = await getAuthUserId(ctx);
        if (!therapistId) {
            throw new Error("Not authenticated");
        }
        const user = await ctx.db.get(therapistId);
        if (!user || user.role !== "therapist") {
            throw new Error("User is not a therapist");
        }

        const sessionId = await ctx.db.insert("sessions", {
            childId: args.childId,
            therapistId,
            scheduledDate: args.scheduledDate,
            scheduledTime: args.scheduledTime,
            duration: args.duration,
            type: args.type,
            status: args.status,
            notes: args.notes,
            createdAt: Date.now(),
        });

        return sessionId;
    },
});

export const getSessions = query({
    args: {
        childId: v.optional(v.id("kids")),
        therapistId: v.optional(v.id("users")),
        startDate: v.optional(v.string()),
        endDate: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        let sessions;
        
        if (args.childId) {
            const childId = args.childId;
            sessions = await ctx.db
                .query("sessions")
                .withIndex("childId", (q) => q.eq("childId", childId))
                .collect();
        } else if (args.therapistId) {
            const therapistId = args.therapistId;
            sessions = await ctx.db
                .query("sessions")
                .withIndex("therapistId", (q) => q.eq("therapistId", therapistId))
                .collect();
        } else {
            sessions = await ctx.db
                .query("sessions")
                .withIndex("scheduledDate")
                .collect();
        }
        
        // Filter by date range if provided
        let filtered = sessions;
        if (args.startDate) {
            filtered = filtered.filter(s => s.scheduledDate >= args.startDate!);
        }
        if (args.endDate) {
            filtered = filtered.filter(s => s.scheduledDate <= args.endDate!);
        }
        
        return filtered.sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate));
    },
});

export const updateSession = mutation({
    args: {
        sessionId: v.id("sessions"),
        scheduledDate: v.optional(v.string()),
        scheduledTime: v.optional(v.string()),
        duration: v.optional(v.number()),
        type: v.optional(v.string()),
        status: v.optional(v.union(
            v.literal("confirmed"),
            v.literal("pending"),
            v.literal("canceled"),
        )),
        notes: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const therapistId = await getAuthUserId(ctx);
        if (!therapistId) {
            throw new Error("Not authenticated");
        }
        const session = await ctx.db.get(args.sessionId);
        if (!session) {
            throw new Error("Session not found");
        }
        if (session.therapistId !== therapistId) {
            throw new Error("Not authorized to update this session");
        }

        const updates: any = {};
        if (args.scheduledDate !== undefined) updates.scheduledDate = args.scheduledDate;
        if (args.scheduledTime !== undefined) updates.scheduledTime = args.scheduledTime;
        if (args.duration !== undefined) updates.duration = args.duration;
        if (args.type !== undefined) updates.type = args.type;
        if (args.status !== undefined) updates.status = args.status;
        if (args.notes !== undefined) updates.notes = args.notes;

        await ctx.db.patch(args.sessionId, updates);
        return await ctx.db.get(args.sessionId);
    },
});

export const deleteSession = mutation({
    args: { sessionId: v.id("sessions") },
    handler: async (ctx, args) => {
        const therapistId = await getAuthUserId(ctx);
        if (!therapistId) {
            throw new Error("Not authenticated");
        }
        const session = await ctx.db.get(args.sessionId);
        if (!session) {
            throw new Error("Session not found");
        }
        if (session.therapistId !== therapistId) {
            throw new Error("Not authorized to delete this session");
        }

        await ctx.db.delete(args.sessionId);
    },
});

