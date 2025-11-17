import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const getParentProfile = query({
    args: {},
    handler: async (ctx) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) {
            throw new Error("Not authenticated");
        }
        const user = await ctx.db.get(userId);
        if (!user || user.role !== "parent") {
            throw new Error("User is not a parent");
        }
        return user;
    },
});

export const updateParentProfile = mutation({
    args: {
        firstName: v.optional(v.string()),
        lastName: v.optional(v.string()),
        phone: v.optional(v.string()),
        profilePicture: v.optional(v.id("_storage")),
    },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) {
            throw new Error("Not authenticated");
        }
        const user = await ctx.db.get(userId);
        if (!user || user.role !== "parent") {
            throw new Error("User is not a parent");
        }

        const updates: any = {};
        if (args.firstName !== undefined) updates.firstName = args.firstName;
        if (args.lastName !== undefined) updates.lastName = args.lastName;
        if (args.phone !== undefined) updates.phone = args.phone;
        if (args.profilePicture !== undefined) updates.profilePicture = args.profilePicture;

        await ctx.db.patch(userId, updates);
        return await ctx.db.get(userId);
    },
});

export const getParentChildren = query({
    args: {},
    handler: async (ctx) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) {
            throw new Error("Not authenticated");
        }
        const user = await ctx.db.get(userId);
        if (!user || user.role !== "parent") {
            throw new Error("User is not a parent");
        }

        const children = await ctx.db
            .query("kids")
            .filter((q) => q.eq(q.field("parentId"), userId))
            .collect();

        // Get last evaluation date for each child
        const childrenWithReports = await Promise.all(
            children.map(async (child) => {
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

export const getParentReports = query({
    args: {
        childId: v.optional(v.id("kids")),
        limit: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) {
            throw new Error("Not authenticated");
        }
        const user = await ctx.db.get(userId);
        if (!user || user.role !== "parent") {
            throw new Error("User is not a parent");
        }

        // Get all children for this parent
        const children = await ctx.db
            .query("kids")
            .filter((q) => q.eq(q.field("parentId"), userId))
            .collect();

        const childIds = children.map((c) => c._id);

        if (childIds.length === 0) {
            return [];
        }

        // If specific childId provided, verify it belongs to parent
        if (args.childId) {
            const childId = args.childId;
            if (!childIds.includes(childId)) {
                throw new Error("Child not found or access denied");
            }
            const reports = await ctx.db
                .query("reports")
                .withIndex("childId", (q) => q.eq("childId", childId))
                .order("desc")
                .take(args.limit || 100);
            return reports;
        }

        // Get all reports for all children
        const allReports = await Promise.all(
            childIds.map(async (childId) => {
                const reports = await ctx.db
                    .query("reports")
                    .withIndex("childId", (q) => q.eq("childId", childId))
                    .order("desc")
                    .collect();
                return reports;
            })
        );

        const flattened = allReports.flat();
        flattened.sort((a, b) => b.createdAt - a.createdAt);
        return flattened.slice(0, args.limit || 100);
    },
});

export const getChildReportsForParent = query({
    args: { childId: v.id("kids") },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) {
            throw new Error("Not authenticated");
        }
        const user = await ctx.db.get(userId);
        if (!user || user.role !== "parent") {
            throw new Error("User is not a parent");
        }

        // Verify child belongs to parent
        const child = await ctx.db.get(args.childId);
        if (!child || child.parentId !== userId) {
            throw new Error("Child not found or access denied");
        }

        const reports = await ctx.db
            .query("reports")
            .withIndex("childId", (q) => q.eq("childId", args.childId))
            .order("desc")
            .collect();

        return reports;
    },
});

export const getParentEmotionData = query({
    args: {
        childId: v.optional(v.id("kids")),
        startDate: v.optional(v.number()),
        endDate: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) {
            throw new Error("Not authenticated");
        }
        const user = await ctx.db.get(userId);
        if (!user || user.role !== "parent") {
            throw new Error("User is not a parent");
        }

        // Get all children for this parent
        const children = await ctx.db
            .query("kids")
            .filter((q) => q.eq(q.field("parentId"), userId))
            .collect();

        const childIds = children.map((c) => c._id);

        if (childIds.length === 0) {
            return [];
        }

        // If specific childId provided, verify it belongs to parent
        const targetChildIds = args.childId
            ? (childIds.includes(args.childId) ? [args.childId] : [])
            : childIds;

        if (targetChildIds.length === 0) {
            return [];
        }

        // Get emotion observations for target children
        let observations = await ctx.db.query("emotionObservations").collect();

        observations = observations.filter((obs) => targetChildIds.includes(obs.childId));

        if (args.startDate) {
            observations = observations.filter((obs) => obs.observedAt >= args.startDate!);
        }
        if (args.endDate) {
            observations = observations.filter((obs) => obs.observedAt <= args.endDate!);
        }

        // Group by date and emotion
        const grouped: Record<string, Record<string, number[]>> = {};

        for (const obs of observations) {
            const date = new Date(obs.observedAt).toISOString().split("T")[0];
            if (!grouped[date]) {
                grouped[date] = {};
            }
            if (!grouped[date][obs.emotion]) {
                grouped[date][obs.emotion] = [];
            }
            grouped[date][obs.emotion].push(obs.intensity);
        }

        // Convert to array format
        const result = Object.entries(grouped).map(([date, emotions]) => {
            const entry: any = { date };
            for (const [emotion, intensities] of Object.entries(emotions)) {
                const avg = intensities.reduce((sum, val) => sum + val, 0) / intensities.length;
                entry[emotion] = Math.round(avg * 10) / 10;
            }
            return entry;
        });

        return result.sort((a, b) => a.date.localeCompare(b.date));
    },
});

export const getDailyRecommendations = query({
    args: {
        childId: v.optional(v.id("kids")),
    },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) {
            throw new Error("Not authenticated");
        }
        const user = await ctx.db.get(userId);
        if (!user || user.role !== "parent") {
            throw new Error("User is not a parent");
        }

        // Get children
        const children = await ctx.db
            .query("kids")
            .filter((q) => q.eq(q.field("parentId"), userId))
            .collect();

        const targetChildren = args.childId
            ? children.filter((c) => c._id === args.childId)
            : children;

        if (targetChildren.length === 0) {
            return [];
        }

        const recommendations = await Promise.all(
            targetChildren.map(async (child) => {
                // Get recent reports (last 14 days)
                const fourteenDaysAgo = Date.now() - 14 * 24 * 60 * 60 * 1000;
                const recentReports = await ctx.db
                    .query("reports")
                    .withIndex("childId", (q) => q.eq("childId", child._id))
                    .filter((q) => q.gte(q.field("createdAt"), fourteenDaysAgo))
                    .order("desc")
                    .collect();

                // Get recent emotion data
                const recentObservations = await ctx.db
                    .query("emotionObservations")
                    .withIndex("childId", (q) => q.eq("childId", child._id))
                    .filter((q) => q.gte(q.field("observedAt"), fourteenDaysAgo))
                    .collect();

                // Analyze data
                let recommendation = "";

                if (recentReports.length === 0) {
                    recommendation = `No recent assessments for ${child.firstName}. Consider scheduling an evaluation to track emotional well-being.`;
                } else {
                    const latestReport = recentReports[0];
                    const emotions = latestReport.emotionData || {};

                    // Calculate averages
                    const negativeEmotions = [
                        emotions.anger || 0,
                        emotions.sadness || 0,
                        emotions.anxiety || 0,
                        emotions.fear || 0,
                        emotions.guilt || 0,
                    ];
                    const avgNegative = negativeEmotions.reduce((a, b) => a + b, 0) / negativeEmotions.length;
                    const happiness = emotions.happiness || 0;

                    // Check test score if available
                    let testScore = null;
                    if (latestReport.testResults && latestReport.testResults.length > 0) {
                        const totalScore = latestReport.testResults.reduce(
                            (sum, r) => sum + r.score,
                            0
                        );
                        testScore = (totalScore / (latestReport.testResults.length * 4)) * 100;
                    }

                    // Generate recommendation based on data
                    if (avgNegative > 3 || happiness < 1.5) {
                        recommendation = `${child.firstName} is showing elevated levels of negative emotions. Consider engaging in calming activities together, maintaining open communication, and consulting with the therapist for additional support strategies.`;
                    } else if (testScore !== null && testScore > 60) {
                        recommendation = `${child.firstName}'s assessment indicates areas that need attention. Focus on positive reinforcement, create a supportive environment, and follow the therapist's recommendations closely.`;
                    } else if (happiness > 3 && avgNegative < 1.5) {
                        recommendation = `${child.firstName} is showing positive emotional well-being. Continue the current supportive practices and maintain regular check-ins.`;
                    } else {
                        // Check trends
                        if (recentReports.length > 1) {
                            const previousReport = recentReports[1];
                            const prevHappiness = previousReport.emotionData?.happiness || 0;
                            if (happiness > prevHappiness) {
                                recommendation = `${child.firstName} is showing improvement in emotional well-being. Keep up the positive support and continue monitoring progress.`;
                            } else {
                                recommendation = `${child.firstName} may benefit from additional support. Review recent assessments with the therapist and implement suggested strategies.`;
                            }
                        } else {
                            recommendation = `Continue monitoring ${child.firstName}'s emotional well-being. Stay engaged with the assessment process and communicate any concerns with the therapist.`;
                        }
                    }
                }

                return {
                    childId: child._id,
                    childName: `${child.firstName} ${child.lastName}`,
                    recommendation,
                    date: new Date().toISOString().split("T")[0],
                };
            })
        );

        return recommendations;
    },
});

