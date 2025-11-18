import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";


export const createReport = mutation({
    args: {
        childId: v.id("kids"),
        sessionId: v.optional(v.id("sessions")),
        text: v.string(),
        landmarks: v.optional(v.array(v.object({
            frame: v.number(),
            timestamp: v.number(),
            faceLandmarks: v.array(v.number()),
            poseLandmarks: v.array(v.number()),
            aus: v.object({
                AU01: v.number(),
                AU02: v.number(),
                AU04: v.number(),
                AU05: v.number(),
                AU06: v.number(),
                AU07: v.number(),
                AU12: v.number(),
                AU14: v.number(),
                AU15: v.number(),
                AU17: v.number(),
                AU20: v.number(),
                AU25: v.number(),
            }),
        }))),
        emotionData: v.object({
            anger: v.optional(v.number()),
            sadness: v.optional(v.number()),
            anxiety: v.optional(v.number()),
            fear: v.optional(v.number()),
            happiness: v.optional(v.number()),
            guilt: v.optional(v.number()),
        }),
        audioEmotionData: v.optional(v.object({
            anger: v.optional(v.number()),
            sadness: v.optional(v.number()),
            anxiety: v.optional(v.number()),
            fear: v.optional(v.number()),
            happiness: v.optional(v.number()),
            guilt: v.optional(v.number()),
        })),
        transcription: v.optional(v.string()),
        sentimentAnalysis: v.optional(v.object({
            overallSentiment: v.union(v.literal("positive"), v.literal("negative"), v.literal("neutral")),
            sentimentScore: v.number(),
            emotionPhrases: v.optional(v.array(v.object({
                text: v.string(),
                emotion: v.union(
                    v.literal("anger"),
                    v.literal("sadness"),
                    v.literal("anxiety"),
                    v.literal("fear"),
                    v.literal("happiness"),
                    v.literal("guilt")
                ),
                confidence: v.number(),
                startIndex: v.number(),
                endIndex: v.number(),
            }))),
            keyPhrases: v.optional(v.array(v.object({
                text: v.string(),
                sentiment: v.union(v.literal("positive"), v.literal("negative"), v.literal("neutral")),
                relevance: v.number(),
            }))),
        })),
        combinedEmotionData: v.optional(v.object({
            anger: v.optional(v.number()),
            sadness: v.optional(v.number()),
            anxiety: v.optional(v.number()),
            fear: v.optional(v.number()),
            happiness: v.optional(v.number()),
            guilt: v.optional(v.number()),
        })),
        testResults: v.optional(v.array(v.object({
            question: v.string(),
            answer: v.string(),
            score: v.number(),
        }))),
        richTextContent: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        try {
            const therapistId = await getAuthUserId(ctx);
            if (!therapistId) {
                throw new Error("Not authenticated");
            }
            const user = await ctx.db.get(therapistId);
            if (!user || user.role !== "therapist") {
                throw new Error("User is not a therapist");
            }

            // Validate child exists
            const child = await ctx.db.get(args.childId);
            if (!child) {
                throw new Error(`Child with ID ${args.childId} not found`);
            }

            // Ensure emotionData is properly formatted (remove undefined values)
            const cleanedEmotionData: Record<string, number | undefined> = {};
            const emotions = ["anger", "sadness", "anxiety", "fear", "happiness", "guilt"] as const;
            for (const emotion of emotions) {
                const value = args.emotionData[emotion];
                if (value !== undefined && value !== null && !isNaN(value)) {
                    cleanedEmotionData[emotion] = value;
                }
            }

            // Clean audio emotion data
            const cleanedAudioEmotionData: Record<string, number | undefined> = {};
            if (args.audioEmotionData) {
                for (const emotion of emotions) {
                    const value = args.audioEmotionData[emotion];
                    if (value !== undefined && value !== null && !isNaN(value)) {
                        cleanedAudioEmotionData[emotion] = value;
                    }
                }
            }

            // Clean combined emotion data
            const cleanedCombinedEmotionData: Record<string, number | undefined> = {};
            if (args.combinedEmotionData) {
                for (const emotion of emotions) {
                    const value = args.combinedEmotionData[emotion];
                    if (value !== undefined && value !== null && !isNaN(value)) {
                        cleanedCombinedEmotionData[emotion] = value;
                    }
                }
            }

            const now = Date.now();
            const reportId = await ctx.db.insert("reports", {
                childId: args.childId,
                therapistId,
                sessionId: args.sessionId,
                text: args.text,
                landmarks: args.landmarks,
                emotionData: cleanedEmotionData,
                audioEmotionData: Object.keys(cleanedAudioEmotionData).length > 0 ? cleanedAudioEmotionData : undefined,
                transcription: args.transcription,
                sentimentAnalysis: args.sentimentAnalysis,
                combinedEmotionData: Object.keys(cleanedCombinedEmotionData).length > 0 ? cleanedCombinedEmotionData : undefined,
                testResults: args.testResults,
                richTextContent: args.richTextContent,
                createdAt: now,
                updatedAt: now,
            });

            // Create emotion observations for aggregation
            for (const emotion of emotions) {
                const intensity = cleanedEmotionData[emotion];
                if (intensity !== undefined && intensity > 0) {
                    await ctx.db.insert("emotionObservations", {
                        reportId,
                        childId: args.childId,
                        emotion,
                        intensity,
                        observedAt: now,
                    });
                }
            }

            // Update child's last evaluation date
            await ctx.db.patch(args.childId, {
                lastEvaluationDate: now,
            });

            return reportId;
        } catch (error) {
            console.error("Error creating report:", error);
            console.error("Args received:", JSON.stringify(args, null, 2));
            throw error;
        }
    },
});

export const getReportById = query({
    args: { reportId: v.id("reports") },
    handler: async (ctx, args) => {
        const report = await ctx.db.get(args.reportId);
        if (!report) {
            throw new Error("Report not found");
        }
        return report;
    },
});

export const getAllReports = query({
    args: {
        childId: v.optional(v.id("kids")),
        therapistId: v.optional(v.id("users")),
        limit: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        if (args.childId) {
            const childId = args.childId;
            const reports = await ctx.db
                .query("reports")
                .withIndex("childId", (q) => q.eq("childId", childId))
                .order("desc")
                .take(args.limit || 100);
            return reports;
        } else if (args.therapistId) {
            const therapistId = args.therapistId;
            const reports = await ctx.db
                .query("reports")
                .withIndex("therapistId", (q) => q.eq("therapistId", therapistId))
                .order("desc")
                .take(args.limit || 100);
            return reports;
        } else {
            const reports = await ctx.db
                .query("reports")
                .withIndex("createdAt")
                .order("desc")
                .take(args.limit || 100);
            return reports;
        }
    },
});

export const updateReport = mutation({
    args: {
        reportId: v.id("reports"),
        text: v.optional(v.string()),
        landmarks: v.optional(v.array(v.object({
            frame: v.number(),
            timestamp: v.number(),
            faceLandmarks: v.array(v.number()),
            poseLandmarks: v.array(v.number()),
            aus: v.object({
                AU01: v.number(),
                AU02: v.number(),
                AU04: v.number(),
                AU05: v.number(),
                AU06: v.number(),
                AU07: v.number(),
                AU12: v.number(),
                AU14: v.number(),
                AU15: v.number(),
                AU17: v.number(),
                AU20: v.number(),
                AU25: v.number(),
            }),
        }))),
        emotionData: v.optional(v.object({
            anger: v.optional(v.number()),
            sadness: v.optional(v.number()),
            anxiety: v.optional(v.number()),
            fear: v.optional(v.number()),
            happiness: v.optional(v.number()),
            guilt: v.optional(v.number()),
        })),
        testResults: v.optional(v.array(v.object({
            question: v.string(),
            answer: v.string(),
            score: v.number(),
        }))),
        richTextContent: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const therapistId = await getAuthUserId(ctx);
        if (!therapistId) {
            throw new Error("Not authenticated");
        }
        const report = await ctx.db.get(args.reportId);
        if (!report) {
            throw new Error("Report not found");
        }
        if (report.therapistId !== therapistId) {
            throw new Error("Not authorized to update this report");
        }

        const updates: any = {
            updatedAt: Date.now(),
        };
        if (args.text !== undefined) updates.text = args.text;
        if (args.landmarks !== undefined) updates.landmarks = args.landmarks;
        if (args.emotionData !== undefined) updates.emotionData = args.emotionData;
        if (args.testResults !== undefined) updates.testResults = args.testResults;
        if (args.richTextContent !== undefined) updates.richTextContent = args.richTextContent;

        await ctx.db.patch(args.reportId, updates);
        return await ctx.db.get(args.reportId);
    },
});

export const deleteReport = mutation({
    args: { reportId: v.id("reports") },
    handler: async (ctx, args) => {
        const therapistId = await getAuthUserId(ctx);
        if (!therapistId) {
            throw new Error("Not authenticated");
        }
        const report = await ctx.db.get(args.reportId);
        if (!report) {
            throw new Error("Report not found");
        }
        if (report.therapistId !== therapistId) {
            throw new Error("Not authorized to delete this report");
        }

        // Delete associated emotion observations
        const observations = await ctx.db
            .query("emotionObservations")
            .filter((q) => q.eq(q.field("reportId"), args.reportId))
            .collect();
        for (const obs of observations) {
            await ctx.db.delete(obs._id);
        }

        await ctx.db.delete(args.reportId);
    },
});

// Generate upload URL for file uploads
export const generateUploadUrl = mutation({
    handler: async (ctx) => {
        return await ctx.storage.generateUploadUrl();
    },
});

// Get storage URL for a file
export const getStorageUrl = query({
    args: { storageId: v.id("_storage") },
    handler: async (ctx, args) => {
        return await ctx.storage.getUrl(args.storageId);
    },
});

// Keep the old sendVideo for backward compatibility
export const sendVideo = mutation({
    args: { storageId: v.id("_storage"), text: v.string() },
    handler: async (ctx, args) => {
        // This is deprecated - use createReport instead
        throw new Error("sendVideo is deprecated. Use createReport instead.");
    },
});

