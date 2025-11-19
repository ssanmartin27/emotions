"use client"

import { useState, useCallback, useMemo, memo, type FormEvent } from "react"
import { useQuery, useMutation } from "convex/react"
import { api } from "convex/_generated/api"
import { useNavigate, useSearchParams } from "react-router"
import type { Id } from "convex/_generated/dataModel"

import { toast } from "sonner"
import { VideoProcessor, type LandmarkData } from "~/components/video-processor"
import { AudioProcessor, type AudioProcessingData } from "~/components/audio-processor"
import { getEmotionPredictor, type EmotionPredictions } from "~/utils/emotionPredictor"
import { type TemporalEmotionSegment } from "~/utils/multimodalEmotionPredictor"
import { EmotionTimeline } from "~/components/emotion-timeline"
import { Button } from "~/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card"
import { Label } from "~/components/ui/label"
import { Input } from "~/components/ui/input"
import { Upload } from "lucide-react"
import { cn } from "~/lib/utils"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "~/components/ui/select"
import { testQuestions, calculateTestScore, type TestQuestion, assessmentPhases, getTest } from "~/data/testQuestions"
import { AssessmentForm, type AssessmentAnswer } from "~/components/assessment-form"
import { CDIForm, type CDIAnswer } from "~/components/cdi-form"

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
    const [aiPredictions, setAiPredictions] = useState<EmotionPredictions | null>(null)
    const [temporalSegments, setTemporalSegments] = useState<TemporalEmotionSegment[] | null>(null)
    const [videoDuration, setVideoDuration] = useState<number>(0)
    const [audioData, setAudioData] = useState<AudioProcessingData | null>(null)
    const [videoFile, setVideoFile] = useState<File | null>(null)
    const [mediaFile, setMediaFile] = useState<File | null>(null)
    const [assessmentAnswers, setAssessmentAnswers] = useState<AssessmentAnswer[]>([])
    const [showTestDialog, setShowTestDialog] = useState(false)
    const [cdiAnswers, setCdiAnswers] = useState<CDIAnswer[]>([])
    const [cdiTotalScore, setCdiTotalScore] = useState<number | null>(null)
    const [cdiHasDepression, setCdiHasDepression] = useState<boolean | null>(null)
    const [showCdiDialog, setShowCdiDialog] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)

    const handleLandmarksExtracted = useCallback(async (extractedLandmarks: LandmarkData[]) => {
        setLandmarks(extractedLandmarks)
        
        // Calculate video duration from landmarks
        // Use the actual number of frames and FPS to calculate duration
        if (extractedLandmarks.length > 0) {
            const fps = 30 // Assume 30 FPS
            // Duration = (number of frames) / fps
            // Since we process frames, the duration is based on frame count
            const estimatedDuration = extractedLandmarks.length / fps
            setVideoDuration(estimatedDuration)
        }
        
        // Run emotion prediction if we have landmarks
        if (extractedLandmarks.length > 0) {
            try {
                    // Try multimodal predictor first
                    try {
                        const { getMultimodalEmotionPredictor } = await import('~/utils/multimodalEmotionPredictor')
                        const multimodalPredictor = getMultimodalEmotionPredictor()
                        
                        // Convert LandmarkData to MediaPipeData format
                        const mediapipeData = extractedLandmarks.map(lm => ({
                            frame: lm.frame,
                            timestamp: lm.timestamp,
                            blendshapes: lm.faceBlendshapes || [],
                            headPose: lm.headPose || [0, 0, 0],
                            poseLandmarks: lm.poseLandmarks || []
                        }))
                        
                        // Predict using multimodal fusion
                        // Note: fps is the third parameter, audioSequence is optional second parameter
                        const result = await multimodalPredictor.predictFromVideo(mediapipeData, undefined, 30)
                    
                    // Combine with audio if available
                    let finalPredictions = result.overall
                    if (audioData?.emotionPredictions) {
                        finalPredictions = multimodalPredictor.combineWithAudio(result, audioData.emotionPredictions)
                    }
                    
                    // Store predictions
                    setAiPredictions(finalPredictions)
                    setTemporalSegments(result.segments)
                    
                    // Show appropriate success message based on what was used
                    const hasAudio = audioData?.emotionPredictions && Object.values(audioData.emotionPredictions).some(v => v > 0)
                    if (hasAudio) {
                        toast.success("AI emotion timeline generated from multimodal analysis (visual + audio)")
                    } else {
                        toast.success("AI emotion timeline generated from visual analysis")
                    }
                    return
                   } catch (multimodalError) {
                       console.log("Multimodal predictor not available:", multimodalError)
                       // Old predictor expects AUs which are no longer extracted
                       // Skip emotion prediction if multimodal model isn't available
                       toast.info("AI emotion model not available", {
                           description: "Creating report without AI predictions. You can manually set emotion intensities.",
                       })
                       return
                   }
            } catch (error) {
                console.error("Error predicting emotions:", error)
                toast.info("Model not available", {
                    description: "Creating report without AI predictions. You can manually set emotion intensities.",
                })
            }
        }
    }, [audioData])

    const handleEmotionChange = useCallback((emotion: EmotionKey, value: number) => {
        setEmotionData(prev => ({ ...prev, [emotion]: [value] }))
    }, [])

    const handleAudioProcessed = useCallback((data: AudioProcessingData) => {
        setAudioData(data)
    }, [])

    const handleVideoFileChange = useCallback((file: File | null) => {
        setVideoFile(file)
    }, [])

    // Calculate combined emotion data when both video and audio are available
    const combinedEmotionData = useMemo(() => {
        if (!audioData || emotionData.anger[0] === 0 && emotionData.sadness[0] === 0) {
            return undefined
        }

        // Weighted average: 60% video, 40% audio (can be adjusted)
        const videoWeight = 0.6
        const audioWeight = 0.4

        return {
            anger: (emotionData.anger[0] * videoWeight + audioData.emotionPredictions.anger * audioWeight) || undefined,
            sadness: (emotionData.sadness[0] * videoWeight + audioData.emotionPredictions.sadness * audioWeight) || undefined,
            anxiety: (emotionData.anxiety[0] * videoWeight + audioData.emotionPredictions.anxiety * audioWeight) || undefined,
            fear: (emotionData.fear[0] * videoWeight + audioData.emotionPredictions.fear * audioWeight) || undefined,
            happiness: (emotionData.happiness[0] * videoWeight + audioData.emotionPredictions.happiness * audioWeight) || undefined,
            guilt: (emotionData.guilt[0] * videoWeight + audioData.emotionPredictions.guilt * audioWeight) || undefined,
        }
    }, [emotionData, audioData])

    const handleAssessmentComplete = useCallback((answers: AssessmentAnswer[]) => {
        setAssessmentAnswers(answers)
        toast.success("Evaluación completada")
    }, [])

    const handleCdiComplete = useCallback((answers: CDIAnswer[], totalScore: number, hasDepression: boolean) => {
        setCdiAnswers(answers)
        setCdiTotalScore(totalScore)
        setCdiHasDepression(hasDepression)
    }, [])

    // Convert assessment answers to testResults format for backward compatibility
    const testResults = useMemo(() => {
        if (assessmentAnswers.length === 0) return undefined

        return assessmentAnswers.map(answer => {
            const test = getTest(answer.phaseId, answer.testId)
            const question = test?.questions[answer.questionIndex]
            
            return {
                question: question?.question || `Phase ${answer.phaseId}, Test ${answer.testId}, Question ${answer.questionIndex + 1}`,
                answer: answer.answer,
                score: answer.score,
            }
        })
    }, [assessmentAnswers])

    // Calculate completion summary
    const assessmentSummary = useMemo(() => {
        if (assessmentAnswers.length === 0) return null

        const testCounts = new Map<string, number>()
        assessmentPhases.forEach(phase => {
            phase.tests.forEach(test => {
                const key = `${phase.id}-${test.id}`
                const count = assessmentAnswers.filter(
                    a => a.phaseId === phase.id && a.testId === test.id
                ).length
                testCounts.set(key, count)
            })
        })

        let completedTests = 0
        let totalQuestions = 0
        assessmentPhases.forEach(phase => {
            phase.tests.forEach(test => {
                const key = `${phase.id}-${test.id}`
                const answeredCount = testCounts.get(key) || 0
                const totalQuestionsInTest = test.questions.length
                totalQuestions += totalQuestionsInTest
                if (answeredCount === totalQuestionsInTest) {
                    completedTests++
                }
            })
        })

        const totalTests = assessmentPhases.reduce((sum, phase) => sum + phase.tests.length, 0)
        const answeredQuestions = assessmentAnswers.length

        return {
            completedTests,
            totalTests,
            answeredQuestions,
            totalQuestions,
        }
    }, [assessmentAnswers])

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
                faceBlendshapes: lm.faceBlendshapes,
                headPose: lm.headPose,
                poseLandmarks: lm.poseLandmarks,
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
                audioEmotionData: audioData ? {
                    anger: audioData.emotionPredictions.anger || undefined,
                    sadness: audioData.emotionPredictions.sadness || undefined,
                    anxiety: audioData.emotionPredictions.anxiety || undefined,
                    fear: audioData.emotionPredictions.fear || undefined,
                    happiness: audioData.emotionPredictions.happiness || undefined,
                    guilt: audioData.emotionPredictions.guilt || undefined,
                } : undefined,
                transcription: audioData?.transcription?.text,
                sentimentAnalysis: audioData?.sentimentAnalysis ? {
                    overallSentiment: audioData.sentimentAnalysis.overallSentiment,
                    sentimentScore: audioData.sentimentAnalysis.sentimentScore,
                    emotionPhrases: audioData.sentimentAnalysis.emotionPhrases,
                    keyPhrases: audioData.sentimentAnalysis.keyPhrases,
                } : undefined,
                combinedEmotionData,
                testResults,
                assessmentData: assessmentAnswers.length > 0 ? assessmentAnswers : undefined,
                cdiData: cdiAnswers.length > 0 ? {
                    answers: cdiAnswers,
                    totalScore: cdiTotalScore || 0,
                    hasDepression: cdiHasDepression || false,
                } : undefined,
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
    const testAnswersCount = useMemo(() => assessmentAnswers.length, [assessmentAnswers])

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

                        {/* Emotion Timeline Display */}
                        {temporalSegments && temporalSegments.length > 0 && (
                            <div className="grid gap-3">
                                <div>
                                    <Label className="text-lg font-semibold">Video Emotion Timeline</Label>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        Video segmented by dominant emotion detected. Each segment shows the primary emotion during that time period.
                                    </p>
                                </div>
                                <EmotionTimeline 
                                    segments={temporalSegments} 
                                    totalDuration={videoDuration || (temporalSegments.length > 0 ? Math.max(...temporalSegments.map(seg => seg.endTime)) : 0)}
                                />
                            </div>
                        )}

                        {/* CDI Form */}
                        <div className="grid gap-3">
                            <Label className="text-lg font-semibold">CDI Questionnaire (Children's Depression Inventory) - Optional</Label>
                            <Button 
                                type="button" 
                                variant="default"
                                onClick={() => setShowCdiDialog(true)}
                            >
                                {cdiAnswers.length > 0
                                    ? `✓ CDI Completed (Score: ${cdiTotalScore}/54${cdiHasDepression ? " - Depression present" : ""})`
                                    : "📋 Take CDI Questionnaire"}
                            </Button>
                            <CDIForm
                                open={showCdiDialog}
                                onOpenChange={setShowCdiDialog}
                                onComplete={handleCdiComplete}
                            />
                        </div>

                        {/* Assessment Form */}
                        <div className="grid gap-3">
                            <Label className="text-lg font-semibold">Multi-phase Assessment - Optional</Label>
                            <Button 
                                type="button" 
                                variant="default"
                                onClick={() => setShowTestDialog(true)}
                            >
                                {assessmentSummary
                                    ? `✓ Evaluación ${assessmentSummary.completedTests}/${assessmentSummary.totalTests} pruebas completadas`
                                    : "📋 Tomar Evaluación"}
                            </Button>
                            <AssessmentForm
                                open={showTestDialog}
                                onOpenChange={setShowTestDialog}
                                onComplete={handleAssessmentComplete}
                                childAge={children?.find(c => c._id === selectedChildId)?.age}
                            />
                            {assessmentSummary && testResults && (
                                <div className="space-y-1">
                                    <p className="text-sm text-muted-foreground">
                                        Preguntas respondidas: {assessmentSummary.answeredQuestions}/{assessmentSummary.totalQuestions}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        Puntuación general: {calculateTestScore(testResults)}%
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Media File Upload */}
                        {!mediaFile && (
                            <div className="grid gap-3">
                                <Label className="text-lg font-semibold">Media File (Video or Audio)</Label>
                                <div className="border-2 border-dashed border-border rounded-base p-6 text-center">
                                    <input
                                        type="file"
                                        accept="video/*,audio/*"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0]
                                            if (file) {
                                                setMediaFile(file)
                                                // Determine if it's video or audio
                                                if (file.type.startsWith('video/')) {
                                                    setVideoFile(file)
                                                    // VideoProcessor will handle video processing
                                                } else if (file.type.startsWith('audio/')) {
                                                    setVideoFile(null)
                                                    // AudioProcessor will handle audio-only processing
                                                }
                                            }
                                        }}
                                        className="hidden"
                                        id="media-upload"
                                    />
                                    <label
                                        htmlFor="media-upload"
                                        className="cursor-pointer flex flex-col items-center gap-2"
                                    >
                                        <Upload className="h-8 w-8 text-muted-foreground" />
                                        <span className="text-sm font-medium">
                                            Click to upload or drag and drop
                                        </span>
                                        <span className="text-xs text-muted-foreground">
                                            Video or audio file (MP4, MOV, MP3, WAV, etc.)
                                        </span>
                                    </label>
                                </div>
                            </div>
                        )}

                        {/* Video Processing */}
                        {mediaFile && mediaFile.type.startsWith('video/') && (
                            <div className="grid gap-3">
                                <Label className="text-lg font-semibold">Video Processing</Label>
                                <VideoProcessor
                                    initialFile={mediaFile}
                                    onLandmarksExtracted={handleLandmarksExtracted}
                                    onError={handleVideoError}
                                    onAudioExtracted={handleVideoFileChange}
                                    onFileRemoved={() => {
                                        setMediaFile(null)
                                        setVideoFile(null)
                                        setLandmarks([])
                                        setAudioData(null)
                                        setAiPredictions(null)
                                        setTemporalSegments(null)
                                        setVideoDuration(0)
                                        setEmotionData({
                                            anger: [0],
                                            sadness: [0],
                                            anxiety: [0],
                                            fear: [0],
                                            happiness: [0],
                                            guilt: [0],
                                        })
                                    }}
                                />
                                {landmarks.length > 0 && (
                                    <div className="p-4 bg-chart-4/20 border-2 border-border shadow-shadow rounded-base">
                                        <p className="text-sm text-foreground font-base">
                                            ✓ Processed {landmarks.length} frames with facial landmarks and pose data
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Audio Processing */}
                        {mediaFile && (
                            <div className="grid gap-3">
                                <Label className="text-lg font-semibold">
                                    {mediaFile.type.startsWith('video/') ? 'Audio Extraction & Processing' : 'Audio Processing'}
                                </Label>
                                <AudioProcessor
                                    onAudioProcessed={handleAudioProcessed}
                                    onError={handleVideoError}
                                    videoFile={mediaFile.type.startsWith('video/') ? videoFile : null}
                                    initialAudioFile={mediaFile.type.startsWith('audio/') ? mediaFile : null}
                                />
                            </div>
                        )}

                        {/* Combined Analysis Preview */}
                        {combinedEmotionData && (
                            <div className="grid gap-3">
                                <Label className="text-lg font-semibold">Combined Analysis Preview</Label>
                                <div className="p-4 bg-chart-5/20 border-2 border-border shadow-shadow rounded-base">
                                    <p className="text-sm font-semibold mb-2">Combined Emotion Predictions (60% Video + 40% Audio):</p>
                                    <div className="grid grid-cols-2 gap-2 text-xs">
                                        {Object.entries(combinedEmotionData).map(([emotion, value]) => (
                                            value !== undefined && (
                                                <div key={emotion} className="flex justify-between">
                                                    <span className="capitalize">{emotion}:</span>
                                                    <span className="font-medium">{value.toFixed(2)}/5</span>
                                                </div>
                                            )
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

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
