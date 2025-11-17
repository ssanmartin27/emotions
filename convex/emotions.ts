import { query } from "./_generated/server";
import { v } from "convex/values";

export const getEmotionData = query({
    args: {
        childId: v.optional(v.id("kids")),
        startDate: v.optional(v.number()),
        endDate: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        let observations = await ctx.db.query("emotionObservations").collect();
        
        // Filter by child if provided
        if (args.childId) {
            observations = observations.filter(obs => obs.childId === args.childId);
        }
        
        // Filter by date range if provided
        if (args.startDate) {
            observations = observations.filter(obs => obs.observedAt >= args.startDate!);
        }
        if (args.endDate) {
            observations = observations.filter(obs => obs.observedAt <= args.endDate!);
        }
        
        // Group by date and emotion
        const grouped: Record<string, Record<string, number[]>> = {};
        
        for (const obs of observations) {
            const date = new Date(obs.observedAt).toISOString().split('T')[0];
            if (!grouped[date]) {
                grouped[date] = {};
            }
            if (!grouped[date][obs.emotion]) {
                grouped[date][obs.emotion] = [];
            }
            grouped[date][obs.emotion].push(obs.intensity);
        }
        
        // Convert to array format and calculate averages
        const result = Object.entries(grouped).map(([date, emotions]) => {
            const entry: any = { date };
            for (const [emotion, intensities] of Object.entries(emotions)) {
                const avg = intensities.reduce((sum, val) => sum + val, 0) / intensities.length;
                entry[emotion] = Math.round(avg * 10) / 10; // Round to 1 decimal
            }
            return entry;
        });
        
        return result.sort((a, b) => a.date.localeCompare(b.date));
    },
});

export const getEmotionTrends = query({
    args: {
        childId: v.optional(v.id("kids")),
        days: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const days = args.days || 30;
        const endDate = Date.now();
        const startDate = endDate - (days * 24 * 60 * 60 * 1000);
        
        // Get emotion data directly
        let observations = await ctx.db.query("emotionObservations").collect();
        
        if (args.childId) {
            observations = observations.filter(obs => obs.childId === args.childId);
        }
        
        observations = observations.filter(obs => 
            obs.observedAt >= startDate && obs.observedAt <= endDate
        );
        
        // Group by date and emotion
        const grouped: Record<string, Record<string, number[]>> = {};
        
        for (const obs of observations) {
            const date = new Date(obs.observedAt).toISOString().split('T')[0];
            if (!grouped[date]) {
                grouped[date] = {};
            }
            if (!grouped[date][obs.emotion]) {
                grouped[date][obs.emotion] = [];
            }
            grouped[date][obs.emotion].push(obs.intensity);
        }
        
        // Convert to array format
        const data = Object.entries(grouped).map(([date, emotions]) => {
            const entry: any = { date };
            for (const [emotion, intensities] of Object.entries(emotions)) {
                const avg = intensities.reduce((sum, val) => sum + val, 0) / intensities.length;
                entry[emotion] = Math.round(avg * 10) / 10;
            }
            return entry;
        }).sort((a, b) => a.date.localeCompare(b.date));
        
        if (!data || data.length === 0) {
            return {
                trends: {},
                correlations: {},
                alerts: [],
            };
        }
        
        // Calculate trends for each emotion
        const emotions = ["anger", "sadness", "anxiety", "fear", "happiness", "guilt"] as const;
        const trends: Record<string, { change: number; direction: "increasing" | "decreasing" | "stable" }> = {};
        
        for (const emotion of emotions) {
            const values = data
                .map(d => d[emotion])
                .filter((v): v is number => v !== undefined);
            
            if (values.length < 2) {
                continue;
            }
            
            const midpoint = Math.floor(values.length / 2);
            const firstHalf = values.slice(0, midpoint);
            const secondHalf = values.slice(midpoint);
            
            const avgFirst = firstHalf.reduce((sum, v) => sum + v, 0) / firstHalf.length;
            const avgSecond = secondHalf.reduce((sum, v) => sum + v, 0) / secondHalf.length;
            
            const change = ((avgSecond - avgFirst) / avgFirst) * 100;
            
            trends[emotion] = {
                change: Math.round(change * 10) / 10,
                direction: change > 5 ? "increasing" : change < -5 ? "decreasing" : "stable",
            };
        }
        
        // Calculate correlations between emotions
        const correlations: Record<string, Record<string, number>> = {};
        for (const emotion1 of emotions) {
            correlations[emotion1] = {};
            for (const emotion2 of emotions) {
                if (emotion1 === emotion2) continue;
                
                const values1 = data.map(d => d[emotion1]).filter((v): v is number => v !== undefined);
                const values2 = data.map(d => d[emotion2]).filter((v): v is number => v !== undefined);
                
                if (values1.length < 2 || values2.length < 2) continue;
                
                // Simple correlation calculation
                const avg1 = values1.reduce((sum, v) => sum + v, 0) / values1.length;
                const avg2 = values2.reduce((sum, v) => sum + v, 0) / values2.length;
                
                let numerator = 0;
                let denom1 = 0;
                let denom2 = 0;
                
                for (let i = 0; i < Math.min(values1.length, values2.length); i++) {
                    const diff1 = values1[i] - avg1;
                    const diff2 = values2[i] - avg2;
                    numerator += diff1 * diff2;
                    denom1 += diff1 * diff1;
                    denom2 += diff2 * diff2;
                }
                
                const correlation = denom1 === 0 || denom2 === 0 
                    ? 0 
                    : numerator / Math.sqrt(denom1 * denom2);
                
                correlations[emotion1][emotion2] = Math.round(correlation * 100) / 100;
            }
        }
        
        // Generate alerts
        const alerts: string[] = [];
        const recentData = data.slice(-7); // Last 7 days
        
        for (const emotion of emotions) {
            const values = recentData
                .map(d => d[emotion])
                .filter((v): v is number => v !== undefined);
            
            if (values.length === 0) continue;
            
            const avg = values.reduce((sum, v) => sum + v, 0) / values.length;
            
            // Alert for high negative emotions
            if (["anger", "sadness", "anxiety", "fear", "guilt"].includes(emotion) && avg > 3.5) {
                alerts.push(`High levels of ${emotion} detected in recent observations (average: ${avg.toFixed(1)}/5)`);
            }
            
            // Alert for low positive emotions
            if (emotion === "happiness" && avg < 1.5) {
                alerts.push(`Low levels of happiness detected in recent observations (average: ${avg.toFixed(1)}/5)`);
            }
        }
        
        return {
            trends,
            correlations,
            alerts,
        };
    },
});

