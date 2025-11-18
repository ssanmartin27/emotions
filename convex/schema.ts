import { defineSchema, defineTable } from "convex/server";
import { authTables } from "@convex-dev/auth/server";
import { v } from "convex/values";

export default defineSchema({
    ...authTables,
    kids: defineTable({
        firstName: v.string(),
        lastName: v.string(),
        parentId: v.id("users"),
        course: v.string(),
        sex: v.string(),
        age: v.number(),
        therapistId: v.optional(v.id("users")),
        lastEvaluationDate: v.optional(v.number()),
    }),
    users: defineTable({
        firstName: v.string(),
        lastName: v.string(),
        username: v.string(),
        email: v.string(),
        emailVerificationTime: v.optional(v.number()),
        phone: v.optional(v.string()),
        phoneVerificationTime: v.optional(v.number()),
        isAnonymous: v.optional(v.boolean()),
        role: v.union(
            v.literal("parent"),
            v.literal("therapist"),
        ),
        // Therapist-specific fields
        profilePicture: v.optional(v.id("_storage")),
        license: v.optional(v.string()),
        experience: v.optional(v.number()),
        specialties: v.optional(v.string()),
        institutions: v.optional(v.string()),
        gender: v.optional(v.string()),
        birthDate: v.optional(v.number()),
        languages: v.optional(v.string()),
        bio: v.optional(v.string()),
    })
        // An index is crucial for efficiently finding users by their email
        .index("email", ["email"]),
    reports: defineTable({
        text: v.string(),
        childId: v.id("kids"),
        therapistId: v.id("users"),
        sessionId: v.optional(v.id("sessions")),
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
        createdAt: v.number(),
        updatedAt: v.number(),
    })
        .index("childId", ["childId"])
        .index("therapistId", ["therapistId"])
        .index("createdAt", ["createdAt"]),
    sessions: defineTable({
        childId: v.id("kids"),
        therapistId: v.id("users"),
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
        createdAt: v.number(),
    })
        .index("childId", ["childId"])
        .index("therapistId", ["therapistId"])
        .index("scheduledDate", ["scheduledDate"]),
    emotionObservations: defineTable({
        reportId: v.id("reports"),
        childId: v.id("kids"),
        emotion: v.union(
            v.literal("anger"),
            v.literal("sadness"),
            v.literal("anxiety"),
            v.literal("fear"),
            v.literal("happiness"),
            v.literal("guilt"),
        ),
        intensity: v.number(),
        observedAt: v.number(),
        notes: v.optional(v.string()),
    })
        .index("childId", ["childId"])
        .index("emotion", ["emotion"])
        .index("observedAt", ["observedAt"]),
});