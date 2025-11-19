"use client"

import { useMemo } from "react"
import { type TemporalEmotionSegment } from "~/utils/multimodalEmotionPredictor"
import { cn } from "~/lib/utils"
import { Card } from "~/components/ui/card"

interface EmotionTimelineProps {
    segments: TemporalEmotionSegment[]
    totalDuration: number // Total video duration in seconds
    className?: string
}

const emotionConfig = {
    anger: { 
        label: "Anger", 
        emoji: "😠", 
        color: "bg-chart-1",
        borderColor: "border-chart-1",
    },
    sadness: { 
        label: "Sadness", 
        emoji: "😢", 
        color: "bg-chart-2",
        borderColor: "border-chart-2",
    },
    anxiety: { 
        label: "Anxiety", 
        emoji: "😰", 
        color: "bg-chart-3",
        borderColor: "border-chart-3",
    },
    fear: { 
        label: "Fear", 
        emoji: "😨", 
        color: "bg-chart-4",
        borderColor: "border-chart-4",
    },
    happiness: { 
        label: "Happiness", 
        emoji: "😊", 
        color: "bg-chart-5",
        borderColor: "border-chart-5",
    },
    guilt: { 
        label: "Guilt", 
        emoji: "😔", 
        color: "bg-main",
        borderColor: "border-main",
    },
    neutral: { 
        label: "Neutral", 
        emoji: "😐", 
        color: "bg-secondary-background",
        borderColor: "border-border",
    },
} as const

export function EmotionTimeline({ segments, totalDuration, className }: EmotionTimelineProps) {
    const formatTime = (seconds: number): string => {
        const mins = Math.floor(seconds / 60)
        const secs = (seconds % 60).toFixed(1) // Show 1 decimal place for precision
        return `${mins}:${secs.padStart(4, '0')}`
    }

    // Calculate positions and widths for each segment
    const timelineSegments = useMemo(() => {
        if (totalDuration === 0) return []
        
        return segments.map((segment) => {
            const leftPercent = (segment.startTime / totalDuration) * 100
            const widthPercent = (segment.duration / totalDuration) * 100
            const config = emotionConfig[segment.dominantEmotion]
            
            return {
                ...segment,
                leftPercent,
                widthPercent,
                config,
            }
        })
    }, [segments, totalDuration])

    if (segments.length === 0) {
        return (
            <Card className={cn("p-4", className)}>
                <p className="text-sm text-muted-foreground text-center">
                    No emotion segments detected. The video may be too short or emotions are below the detection threshold.
                </p>
            </Card>
        )
    }

    return (
        <Card className={cn("p-4", className)}>
            <div className="space-y-4">
                <div>
                    <h3 className="text-lg font-semibold mb-2">Emotion Timeline</h3>
                    <p className="text-sm text-muted-foreground">
                        Video segmented by dominant emotion detected
                    </p>
                </div>

                {/* Timeline Bar */}
                <div className="relative w-full h-12 bg-secondary-background rounded-base border-2 border-border overflow-hidden">
                    {timelineSegments.map((segment, index) => {
                        const isNeutral = segment.dominantEmotion === 'neutral'
                        // Use unique key combining emotion and position to ensure proper rendering
                        const uniqueKey = `${segment.dominantEmotion}-${segment.startTime}-${index}`
                        return (
                            <div
                                key={uniqueKey}
                                className={cn(
                                    "absolute h-full flex items-center justify-center text-xs font-semibold",
                                    segment.config.color,
                                    segment.config.borderColor,
                                    "border-r-2",
                                    isNeutral ? "text-foreground" : "text-main-foreground"
                                )}
                                style={{
                                    left: `${segment.leftPercent}%`,
                                    width: `${segment.widthPercent}%`,
                                    zIndex: 1, // Ensure segments are visible
                                }}
                                title={`${segment.config.label}: ${formatTime(segment.startTime)} - ${formatTime(segment.endTime)} (${segment.duration.toFixed(1)}s)`}
                            >
                                {segment.widthPercent > 5 && (
                                    <span className="truncate px-1">
                                        {segment.config.emoji}
                                    </span>
                                )}
                            </div>
                        )
                    })}
                </div>

                {/* Time Labels */}
                <div className="flex justify-between text-xs text-muted-foreground">
                    <span>0:00</span>
                    <span>{formatTime(totalDuration)}</span>
                </div>

                {/* Segment Details */}
                <div className="space-y-2">
                    <h4 className="text-sm font-semibold">Segments:</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                        {segments.map((segment, index) => {
                            const config = emotionConfig[segment.dominantEmotion]
                            const uniqueKey = `${segment.dominantEmotion}-${segment.startTime}-${index}`
                            return (
                                <div
                                    key={uniqueKey}
                                    className={cn(
                                        "flex items-center gap-2 p-2 rounded-base border-2",
                                        config.borderColor,
                                        "bg-secondary-background"
                                    )}
                                >
                                    <span className="text-xl">{config.emoji}</span>
                                    <div className="flex-1 min-w-0">
                                        <div className="font-semibold text-sm">{config.label}</div>
                                        <div className="text-xs text-muted-foreground">
                                            {formatTime(segment.startTime)} - {formatTime(segment.endTime)} 
                                            {" "}({segment.duration.toFixed(1)}s)
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>

                {/* Legend */}
                <div className="pt-2 border-t-2 border-border">
                    <h4 className="text-sm font-semibold mb-2">Emotions:</h4>
                    <div className="flex flex-wrap gap-2">
                        {Object.entries(emotionConfig).map(([emotion, config]) => (
                            <div
                                key={emotion}
                                className="flex items-center gap-1 text-xs"
                            >
                                <span className={cn("w-4 h-4 rounded border-2", config.color, config.borderColor)} />
                                <span>{config.emoji} {config.label}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </Card>
    )
}

