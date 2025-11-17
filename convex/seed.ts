import { mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Seed the database with simulated data for development and testing.
 * This mutation creates:
 * - Parent users
 * - Therapist users
 * - Children linked to parents
 * - Sessions
 * - Reports with emotion data
 * - Emotion observations
 */
export const seedDatabase = mutation({
    args: {},
    handler: async (ctx) => {
        const now = Date.now();
        const oneDay = 24 * 60 * 60 * 1000;
        const oneWeek = 7 * oneDay;

        // Create parent users
        const parent1 = await ctx.db.insert("users", {
            firstName: "Maria",
            lastName: "Garcia",
            username: "maria.garcia",
            email: "maria.garcia@example.com",
            role: "parent",
            phone: "+1-555-0101",
            emailVerificationTime: now - 30 * oneDay,
        });

        const parent2 = await ctx.db.insert("users", {
            firstName: "John",
            lastName: "Smith",
            username: "john.smith",
            email: "john.smith@example.com",
            role: "parent",
            phone: "+1-555-0102",
            emailVerificationTime: now - 20 * oneDay,
        });

        const parent3 = await ctx.db.insert("users", {
            firstName: "Sarah",
            lastName: "Johnson",
            username: "sarah.johnson",
            email: "sarah.johnson@example.com",
            role: "parent",
            phone: "+1-555-0103",
            emailVerificationTime: now - 15 * oneDay,
        });

        // Create therapist users
        const therapist1 = await ctx.db.insert("users", {
            firstName: "Dr. Emily",
            lastName: "Rodriguez",
            username: "emily.rodriguez",
            email: "emily.rodriguez@example.com",
            role: "therapist",
            phone: "+1-555-0201",
            emailVerificationTime: now - 60 * oneDay,
            license: "CA-LCSW-12345",
            experience: 8,
            specialties: "Child Psychology, Anxiety Disorders, Trauma Therapy",
            institutions: "Stanford University, UC Berkeley",
            gender: "Female",
            birthDate: now - 35 * 365 * oneDay,
            languages: "English, Spanish",
            bio: "Licensed clinical social worker with 8 years of experience specializing in child and adolescent mental health.",
        });

        const therapist2 = await ctx.db.insert("users", {
            firstName: "Dr. Michael",
            lastName: "Chen",
            username: "michael.chen",
            email: "michael.chen@example.com",
            role: "therapist",
            phone: "+1-555-0202",
            emailVerificationTime: now - 50 * oneDay,
            license: "CA-PSYD-67890",
            experience: 12,
            specialties: "Developmental Psychology, Behavioral Therapy, Family Counseling",
            institutions: "Harvard University, UCLA",
            gender: "Male",
            birthDate: now - 40 * 365 * oneDay,
            languages: "English, Mandarin",
            bio: "Clinical psychologist with extensive experience in developmental and behavioral interventions for children.",
        });

        // Create children
        const child1 = await ctx.db.insert("kids", {
            firstName: "Sofia",
            lastName: "Garcia",
            parentId: parent1,
            course: "3rd Grade",
            sex: "Female",
            age: 8,
            therapistId: therapist1,
            lastEvaluationDate: now - 7 * oneDay,
        });

        const child2 = await ctx.db.insert("kids", {
            firstName: "Lucas",
            lastName: "Garcia",
            parentId: parent1,
            course: "5th Grade",
            sex: "Male",
            age: 10,
            therapistId: therapist1,
            lastEvaluationDate: now - 14 * oneDay,
        });

        const child3 = await ctx.db.insert("kids", {
            firstName: "Emma",
            lastName: "Smith",
            parentId: parent2,
            course: "2nd Grade",
            sex: "Female",
            age: 7,
            therapistId: therapist2,
            lastEvaluationDate: now - 3 * oneDay,
        });

        const child4 = await ctx.db.insert("kids", {
            firstName: "Oliver",
            lastName: "Smith",
            parentId: parent2,
            course: "4th Grade",
            sex: "Male",
            age: 9,
            therapistId: therapist2,
            lastEvaluationDate: now - 10 * oneDay,
        });

        const child5 = await ctx.db.insert("kids", {
            firstName: "Ava",
            lastName: "Johnson",
            parentId: parent3,
            course: "1st Grade",
            sex: "Female",
            age: 6,
            therapistId: therapist1,
            lastEvaluationDate: now - 5 * oneDay,
        });

        // Create sessions
        const session1 = await ctx.db.insert("sessions", {
            childId: child1,
            therapistId: therapist1,
            scheduledDate: new Date(now + 2 * oneDay).toISOString().split("T")[0],
            scheduledTime: "10:00",
            duration: 60,
            type: "Individual Therapy",
            status: "confirmed",
            notes: "Follow-up session to discuss progress on anxiety management techniques.",
            createdAt: now - 5 * oneDay,
        });

        const session2 = await ctx.db.insert("sessions", {
            childId: child2,
            therapistId: therapist1,
            scheduledDate: new Date(now + 3 * oneDay).toISOString().split("T")[0],
            scheduledTime: "14:00",
            duration: 45,
            type: "Individual Therapy",
            status: "pending",
            notes: "Initial assessment session.",
            createdAt: now - 2 * oneDay,
        });

        const session3 = await ctx.db.insert("sessions", {
            childId: child3,
            therapistId: therapist2,
            scheduledDate: new Date(now + 1 * oneDay).toISOString().split("T")[0],
            scheduledTime: "11:30",
            duration: 60,
            type: "Play Therapy",
            status: "confirmed",
            notes: "Continue working on social skills development.",
            createdAt: now - 7 * oneDay,
        });

        const session4 = await ctx.db.insert("sessions", {
            childId: child4,
            therapistId: therapist2,
            scheduledDate: new Date(now + 4 * oneDay).toISOString().split("T")[0],
            scheduledTime: "15:00",
            duration: 60,
            type: "Behavioral Therapy",
            status: "confirmed",
            createdAt: now - 1 * oneDay,
        });

        const session5 = await ctx.db.insert("sessions", {
            childId: child5,
            therapistId: therapist1,
            scheduledDate: new Date(now - 2 * oneDay).toISOString().split("T")[0],
            scheduledTime: "09:00",
            duration: 45,
            type: "Individual Therapy",
            status: "confirmed",
            notes: "Completed session. Child showed improvement in emotional regulation.",
            createdAt: now - 10 * oneDay,
        });

        // Create reports with emotion data
        const report1 = await ctx.db.insert("reports", {
            text: "Sofia showed significant improvement in managing her anxiety during school activities. She was able to use the breathing techniques we practiced and reported feeling more confident. However, she still experiences some anxiety during test situations.",
            childId: child1,
            therapistId: therapist1,
            sessionId: session5,
            emotionData: {
                anger: 2,
                sadness: 3,
                anxiety: 6,
                fear: 4,
                happiness: 7,
                guilt: 2,
            },
            testResults: [
                { question: "How do you feel about going to school?", answer: "Sometimes worried", score: 3 },
                { question: "Do you feel happy most of the time?", answer: "Yes, usually", score: 4 },
                { question: "How do you handle difficult situations?", answer: "I try to stay calm", score: 4 },
            ],
            richTextContent: JSON.stringify({
                root: {
                    children: [
                        {
                            children: [
                                { detail: 0, format: 0, mode: "normal", style: "", text: "Sofia showed significant improvement in managing her anxiety during school activities.", type: "text", version: 1 },
                            ],
                            direction: "ltr",
                            format: "",
                            indent: 0,
                            type: "paragraph",
                            version: 1,
                        },
                    ],
                    direction: "ltr",
                    format: "",
                    indent: 0,
                    type: "root",
                    version: 1,
                },
            }),
            createdAt: now - 7 * oneDay,
            updatedAt: now - 7 * oneDay,
        });

        const report2 = await ctx.db.insert("reports", {
            text: "Lucas has been struggling with emotional regulation, particularly when frustrated. He shows signs of anger and sometimes withdraws. We're working on identifying triggers and developing coping strategies.",
            childId: child2,
            therapistId: therapist1,
            emotionData: {
                anger: 7,
                sadness: 5,
                anxiety: 4,
                fear: 3,
                happiness: 5,
                guilt: 4,
            },
            testResults: [
                { question: "How do you feel about going to school?", answer: "It's okay", score: 3 },
                { question: "Do you feel happy most of the time?", answer: "Sometimes", score: 2 },
                { question: "How do you handle difficult situations?", answer: "I get angry", score: 2 },
            ],
            createdAt: now - 14 * oneDay,
            updatedAt: now - 14 * oneDay,
        });

        const report3 = await ctx.db.insert("reports", {
            text: "Emma continues to make excellent progress in social interactions. She's more confident in group settings and has been initiating conversations with peers. Her happiness levels have increased significantly.",
            childId: child3,
            therapistId: therapist2,
            sessionId: session3,
            emotionData: {
                anger: 2,
                sadness: 2,
                anxiety: 3,
                fear: 2,
                happiness: 9,
                guilt: 1,
            },
            testResults: [
                { question: "How do you feel about going to school?", answer: "I love it!", score: 5 },
                { question: "Do you feel happy most of the time?", answer: "Yes, always", score: 5 },
                { question: "How do you handle difficult situations?", answer: "I talk to someone", score: 4 },
            ],
            createdAt: now - 3 * oneDay,
            updatedAt: now - 3 * oneDay,
        });

        const report4 = await ctx.db.insert("reports", {
            text: "Oliver has been working on behavioral issues in the classroom. He shows improvement but still needs support with impulse control. We're implementing a reward system to reinforce positive behaviors.",
            childId: child4,
            therapistId: therapist2,
            emotionData: {
                anger: 5,
                sadness: 4,
                anxiety: 5,
                fear: 3,
                happiness: 3,
                guilt: 5,
            },
            createdAt: now - 10 * oneDay,
            updatedAt: now - 10 * oneDay,
        });

        const report5 = await ctx.db.insert("reports", {
            text: "Ava is a young child who has been experiencing separation anxiety. She's making gradual progress with emotional regulation techniques. Parent involvement has been excellent.",
            childId: child5,
            therapistId: therapist1,
            emotionData: {
                anger: 3,
                sadness: 4,
                anxiety: 7,
                fear: 6,
                happiness: 5,
                guilt: 2,
            },
            testResults: [
                { question: "How do you feel about going to school?", answer: "I miss my mom", score: 2 },
                { question: "Do you feel happy most of the time?", answer: "Sometimes", score: 3 },
                { question: "How do you handle difficult situations?", answer: "I cry", score: 2 },
            ],
            createdAt: now - 5 * oneDay,
            updatedAt: now - 5 * oneDay,
        });

        // Create additional reports for historical data
        const report6 = await ctx.db.insert("reports", {
            text: "Follow-up assessment for Sofia. Continued progress noted in anxiety management.",
            childId: child1,
            therapistId: therapist1,
            emotionData: {
                anger: 2,
                sadness: 2,
                anxiety: 5,
                fear: 3,
                happiness: 8,
                guilt: 1,
            },
            createdAt: now - 21 * oneDay,
            updatedAt: now - 21 * oneDay,
        });

        const report7 = await ctx.db.insert("reports", {
            text: "Previous assessment for Lucas showing baseline emotional state.",
            childId: child2,
            therapistId: therapist1,
            emotionData: {
                anger: 8,
                sadness: 6,
                anxiety: 5,
                fear: 4,
                happiness: 4,
                guilt: 5,
            },
            createdAt: now - 28 * oneDay,
            updatedAt: now - 28 * oneDay,
        });

        const report8 = await ctx.db.insert("reports", {
            text: "Initial assessment for Emma showing positive baseline emotional state.",
            childId: child3,
            therapistId: therapist2,
            emotionData: {
                anger: 2,
                sadness: 2,
                anxiety: 2,
                fear: 2,
                happiness: 8,
                guilt: 1,
            },
            createdAt: now - 35 * oneDay,
            updatedAt: now - 35 * oneDay,
        });

        // Create emotion observations
        const emotions = ["anger", "sadness", "anxiety", "fear", "happiness", "guilt"] as const;
        
        // Observations for report1 (Sofia)
        for (let i = 0; i < 3; i++) {
            const emotion = emotions[Math.floor(Math.random() * emotions.length)];
            await ctx.db.insert("emotionObservations", {
                reportId: report1,
                childId: child1,
                emotion,
                intensity: Math.floor(Math.random() * 5) + 1,
                observedAt: now - (7 + i) * oneDay,
                notes: `Observed ${emotion} during session activity.`,
            });
        }

        // Observations for report2 (Lucas)
        for (let i = 0; i < 4; i++) {
            const emotion = emotions[Math.floor(Math.random() * emotions.length)];
            await ctx.db.insert("emotionObservations", {
                reportId: report2,
                childId: child2,
                emotion,
                intensity: Math.floor(Math.random() * 5) + 3,
                observedAt: now - (14 + i) * oneDay,
                notes: `Observed ${emotion} during behavioral assessment.`,
            });
        }

        // Observations for report3 (Emma)
        for (let i = 0; i < 2; i++) {
            const emotion = emotions[Math.floor(Math.random() * emotions.length)];
            await ctx.db.insert("emotionObservations", {
                reportId: report3,
                childId: child3,
                emotion,
                intensity: Math.floor(Math.random() * 3) + 1,
                observedAt: now - (3 + i) * oneDay,
                notes: `Observed ${emotion} during social interaction activity.`,
            });
        }

        // Observations for report5 (Ava)
        for (let i = 0; i < 3; i++) {
            const emotion = emotions[Math.floor(Math.random() * emotions.length)];
            await ctx.db.insert("emotionObservations", {
                reportId: report5,
                childId: child5,
                emotion,
                intensity: Math.floor(Math.random() * 5) + 2,
                observedAt: now - (5 + i) * oneDay,
                notes: `Observed ${emotion} during play therapy session.`,
            });
        }

        return {
            success: true,
            message: "Database seeded successfully",
            counts: {
                parents: 3,
                therapists: 2,
                children: 5,
                sessions: 5,
                reports: 8,
                emotionObservations: 12,
            },
        };
    },
});




