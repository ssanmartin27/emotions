"use client"

import { useState, useCallback, useMemo, memo, type FormEvent } from "react"
import { useQuery, useMutation } from "convex/react"
import { api } from "convex/_generated/api"
import { useNavigate, useSearchParams } from "react-router"
import type { Id } from "convex/_generated/dataModel"

import { toast } from "sonner"
import { VideoProcessor, type LandmarkData } from "~/components/video-processor"
import { getEmotionPredictor } from "~/utils/emotionPredictor"
import { Button } from "~/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card"
import { Label } from "~/components/ui/label"
import { Input } from "~/components/ui/input"
import { cn } from "~/lib/utils"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "~/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "~/components/ui/select"
import { testQuestions, calculateTestScore, type TestQuestion } from "~/data/testQuestions"

// Memoized Emotion Card Component to prevent unnecessary re-renders
type EmotionKey = "anger" | "sadness" | "anxiety" | "fear" | "happiness" | "guilt"

interface EmotionCardProps {
    emotion: string
    emotionKey: EmotionKey
    currentValue: number
    emotionConfig: {
        label: string
        emoji: string
        bgColor: string
        textColor: string
        activeColor: string
        borderColor: string
    }
    onEmotionChange: (emotion: EmotionKey, value: number) => void
}

const EmotionCard = memo(({ emotion, emotionKey, currentValue, emotionConfig, onEmotionChange }: EmotionCardProps) => {
    return (
        <Card 
            key={emotion} 
            className={`${emotionConfig.bgColor} flex flex-col`}
        >
            <div className="flex items-center gap-3 mb-4">
                <span className="text-3xl">{emotionConfig.emoji}</span>
                <div className="flex-1">
                    <Label className={`text-base font-heading ${emotionConfig.textColor}`}>
                        {emotionConfig.label}
                    </Label>
                    <p className="text-xs text-muted-foreground mt-1">
                        {currentValue === 0 ? "Not present" : `Intensity: ${currentValue}/5`}
                    </p>
                </div>
            </div>
            <div className="flex flex-wrap gap-2 justify-center">
                {[1, 2, 3, 4, 5].map((value) => {
                    const isSelected = value <= currentValue
                    return (
                        <button
                            key={value}
                            type="button"
                            onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                onEmotionChange(emotionKey, value)
                            }}
                            className={cn(
                                "w-10 h-10 rounded-base font-heading text-sm border-2 shadow-shadow",
                                isSelected 
                                    ? `${emotionConfig.activeColor} text-main-foreground border-border` 
                                    : "bg-secondary-background text-foreground border-border hover:bg-accent"
                            )}
                            aria-label={`Set ${emotionConfig.label} to ${value}`}
                        >
                            {value}
                        </button>
                    )
                })}
            </div>
        </Card>
    )
})
EmotionCard.displayName = "EmotionCard"

export default function CreateReportPage() {
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const childIdFromUrl = searchParams.get("childId")

    const children = useQuery(api.therapists.getAllChildren)
    const createReport = useMutation(api.report.createReport)

    const [selectedChildId, setSelectedChildId] = useState<string>(childIdFromUrl || "")
    const [textContent, setTextContent] = useState("")
    const [landmarks, setLandmarks] = useState<LandmarkData[]>([])
    const [emotionData, setEmotionData] = useState({
        anger: [0] as number[],
        sadness: [0] as number[],
        anxiety: [0] as number[],
        fear: [0] as number[],
        happiness: [0] as number[],
        guilt: [0] as number[],
    })
    const [testAnswers, setTestAnswers] = useState<Record<number, string>>({})
    const [showTestDialog, setShowTestDialog] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)

    const handleLandmarksExtracted = useCallback(async (extractedLandmarks: LandmarkData[]) => {
        setLandmarks(extractedLandmarks)
        
        // Run emotion prediction if we have landmarks
        if (extractedLandmarks.length > 0) {
            try {
                const predictor = getEmotionPredictor()
                
                // Check if model is available before trying to load
                const modelAvailable = await predictor.isModelAvailable()
                if (!modelAvailable) {
                    console.log("Model not available, skipping emotion prediction")
                    toast.info("Model not available", {
                        description: "Creating report without AI predictions. You can manually set emotion intensities.",
                    })
                    return
                }
                
                await predictor.loadModel()
                
                // Extract AUs from landmarks
                const ausArray = extractedLandmarks.map((lm) => lm.aus)
                
                // Predict emotions
                const predictions = await predictor.predictTimeSeries(ausArray)
                
                // Update emotion data
                setEmotionData({
                    anger: [predictions.anger],
                    sadness: [predictions.sadness],
                    anxiety: [predictions.anxiety],
                    fear: [predictions.fear],
                    happiness: [predictions.happiness],
                    guilt: [predictions.guilt],
                })
                
                toast.success("Emotions predicted from video analysis")
            } catch (error) {
                console.error("Error predicting emotions:", error)
                toast.info("Model not available", {
                    description: "Creating report without AI predictions. You can manually set emotion intensities.",
                })
            }
        }
    }, [])

    const handleEmotionChange = useCallback((emotion: EmotionKey, value: number) => {
        setEmotionData(prev => ({ ...prev, [emotion]: [value] }))
    }, [])

    const handleTestAnswer = (questionIndex: number, answer: string) => {
        setTestAnswers(prev => ({ ...prev, [questionIndex]: answer }))
    }

    const testResults = useMemo(() => {
        if (Object.keys(testAnswers).length === 0) return undefined

        return testQuestions.map((question, index) => {
            const answer = testAnswers[index] || ""
            const optionIndex = question.options.indexOf(answer)
            const score = optionIndex >= 0 ? question.weights[optionIndex] : 0

            return {
                question: question.question,
                answer,
                score,
            }
        })
    }, [testAnswers])

    async function handleSubmit(event: FormEvent) {
        event.preventDefault()

        if (!selectedChildId) {
            toast.error("Please select a child")
            return
        }

        if (!textContent.trim()) {
            toast.error("Please enter report text")
            return
        }

        setIsSubmitting(true)

        try {
            // Convert landmarks to database format
            const landmarksData = landmarks.length > 0 ? landmarks.map((lm) => ({
                frame: lm.frame,
                timestamp: lm.timestamp,
                faceLandmarks: lm.faceLandmarks,
                poseLandmarks: lm.poseLandmarks,
                aus: lm.aus,
            })) : undefined

            // Create report
            await createReport({
                childId: selectedChildId as Id<"kids">,
                text: textContent,
                landmarks: landmarksData,
                emotionData: {
                    anger: emotionData.anger[0] || undefined,
                    sadness: emotionData.sadness[0] || undefined,
                    anxiety: emotionData.anxiety[0] || undefined,
                    fear: emotionData.fear[0] || undefined,
                    happiness: emotionData.happiness[0] || undefined,
                    guilt: emotionData.guilt[0] || undefined,
                },
                testResults,
            })

            toast.success("Report created successfully")
            navigate(`/therapist/reports`)
        } catch (error) {
            toast.error("Failed to create report")
            console.error(error)
        } finally {
            setIsSubmitting(false)
        }
    }

    const childrenList = children || []

    // Memoize emotion config to avoid recreating on every render
    const emotionConfigs = useMemo(() => ({
        anger: { 
            label: "Anger", 
            emoji: "😠", 
            bgColor: "bg-chart-1/20",
            textColor: "text-foreground",
            activeColor: "bg-chart-1",
            borderColor: "border-chart-1",
        },
        sadness: { 
            label: "Sadness", 
            emoji: "😢", 
            bgColor: "bg-chart-2/20",
            textColor: "text-foreground",
            activeColor: "bg-chart-2",
            borderColor: "border-chart-2",
        },
        anxiety: { 
            label: "Anxiety", 
            emoji: "😰", 
            bgColor: "bg-chart-3/20",
            textColor: "text-foreground",
            activeColor: "bg-chart-3",
            borderColor: "border-chart-3",
        },
        fear: { 
            label: "Fear", 
            emoji: "😨", 
            bgColor: "bg-chart-4/20",
            textColor: "text-foreground",
            activeColor: "bg-chart-4",
            borderColor: "border-chart-4",
        },
        happiness: { 
            label: "Happiness", 
            emoji: "😊", 
            bgColor: "bg-chart-5/20",
            textColor: "text-foreground",
            activeColor: "bg-chart-5",
            borderColor: "border-chart-5",
        },
        guilt: { 
            label: "Guilt", 
            emoji: "😔", 
            bgColor: "bg-secondary-background",
            textColor: "text-foreground",
            activeColor: "bg-main",
            borderColor: "border-border",
        },
    }), [])

    // Memoize test answers count
    const testAnswersCount = useMemo(() => Object.keys(testAnswers).length, [testAnswers])

    // Memoize error handler for VideoProcessor
    const handleVideoError = useCallback((error: Error) => {
        toast.error("Video processing error", {
            description: error.message,
        })
    }, [])

    return (
        <div className="flex flex-col gap-6 p-6">
            <Card className="border-2 border-chart-1 shadow-[4px_4px_0px_0px_#FF6678]">
                <CardHeader>
                    <CardTitle>Create New Report</CardTitle>
                    <CardDescription>Document observations and evaluations for a child</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-8">
                        {/* Child Selector */}
                        <div className="grid gap-3">
                            <Label htmlFor="child">Child *</Label>
                            <Select
                                value={selectedChildId}
                                onValueChange={setSelectedChildId}
                                required
                            >
                                <SelectTrigger id="child">
                                    <SelectValue placeholder="Select a child" />
                                </SelectTrigger>
                                <SelectContent>
                                    {childrenList.map((child) => (
                                        <SelectItem key={child._id} value={child._id}>
                                            {child.firstName} {child.lastName}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Report Text */}
                        <div className="grid gap-3">
                            <Label htmlFor="text">Report Text *</Label>
                            <textarea
                                id="text"
                                className="min-h-[200px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                value={textContent}
                                onChange={(e) => setTextContent(e.target.value)}
                                required
                                placeholder="Enter your observations and notes..."
                            />
                        </div>

                        {/* Emotion Data Entry */}
                        <div className="grid gap-6">
                            <div>
                                <Label className="text-lg font-semibold">Emotion Observations</Label>
                                <p className="text-sm text-muted-foreground mt-1">Rate the intensity of each emotion from 1 to 5</p>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {(Object.keys(emotionData) as EmotionKey[]).map((emotionKey) => {
                                    const currentValue = emotionData[emotionKey][0]
                                    const emotionConfig = emotionConfigs[emotionKey]

                                    return (
                                        <EmotionCard
                                            key={emotionKey}
                                            emotion={emotionKey}
                                            emotionKey={emotionKey}
                                            currentValue={currentValue}
                                            emotionConfig={emotionConfig}
                                            onEmotionChange={handleEmotionChange}
                                        />
                                    )
                                })}
                            </div>
                        </div>

                        {/* Test Dialog */}
                        <div className="grid gap-3">
                            <Label className="text-lg font-semibold">Optional Assessment Test</Label>
                            <Dialog open={showTestDialog} onOpenChange={setShowTestDialog}>
                                <DialogTrigger asChild>
                                    <Button type="button" variant="default">
                                        {testAnswersCount > 0
                                            ? `✓ Test Completed (${testAnswersCount}/20)`
                                            : "📋 Take Assessment Test"}
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                                    <DialogHeader>
                                        <DialogTitle>Emotional Assessment Test</DialogTitle>
                                        <DialogDescription>
                                            Please answer the following questions. This test helps assess the child's emotional well-being.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="space-y-6 py-4">
                                        {testQuestions.map((question, index) => (
                                            <div key={index} className="space-y-2">
                                                <Label className="text-base">
                                                    {index + 1}. {question.question}
                                                </Label>
                                                <div className="space-y-2">
                                                    {question.options.map((option) => (
                                                        <label
                                                            key={option}
                                                            className="flex items-center space-x-2 cursor-pointer p-2 rounded hover:bg-accent"
                                                        >
                                                            <input
                                                                type="radio"
                                                                name={`question-${index}`}
                                                                value={option}
                                                                checked={testAnswers[index] === option}
                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                                handleTestAnswer(index, e.target.value)
                                            }
                                                                className="cursor-pointer"
                                                            />
                                                            <span>{option}</span>
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <DialogFooter>
                                        <Button
                                            type="button"
                                            variant="neutral"
                                            onClick={() => setShowTestDialog(false)}
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            type="button"
                                            onClick={() => {
                                                if (testAnswersCount === testQuestions.length) {
                                                    setShowTestDialog(false)
                                                    toast.success("Test completed")
                                                } else {
                                                    toast.warning(
                                                        `Please answer all questions (${testAnswersCount}/${testQuestions.length})`
                                                    )
                                                }
                                            }}
                                        >
                                            Complete Test
                                        </Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                            {testAnswersCount > 0 && testResults && (
                                <p className="text-sm text-muted-foreground">
                                    Test score: {calculateTestScore(testResults)}%
                                </p>
                            )}
                        </div>

                        {/* Video Processing */}
                        <div className="grid gap-3">
                            <Label className="text-lg font-semibold">Video Processing (Optional)</Label>
                            <VideoProcessor
                                onLandmarksExtracted={handleLandmarksExtracted}
                                onError={handleVideoError}
                            />
                            {landmarks.length > 0 && (
                                <div className="p-4 bg-chart-4/20 border-2 border-border shadow-shadow rounded-base">
                                    <p className="text-sm text-foreground font-base">
                                        ✓ Processed {landmarks.length} frames with facial landmarks and pose data
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Submit Button */}
                        <div className="flex gap-4 pt-4 border-t-2 border-border">
                            <Button 
                                type="submit" 
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? "Creating..." : "✨ Create Report"}
                            </Button>
                            <Button
                                type="button"
                                variant="neutral"
                                onClick={() => navigate(-1)}
                            >
                                Cancel
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
