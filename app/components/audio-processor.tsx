"use client"

import { useEffect, useRef, useState, useCallback, useMemo } from "react"
import { Button } from "~/components/ui/button"
import { Progress } from "~/components/ui/progress"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "~/components/ui/tooltip"
import { Upload, X, Volume2 } from "lucide-react"
import { toast } from "sonner"
import { 
    processAudioFile, 
    extractAudioFromVideo,
    normalizeAudio,
    padOrTruncateAudio,
    type AudioProcessingResult 
} from "~/utils/audioProcessor"
import { getAudioEmotionPredictor, type EmotionPredictions } from "~/utils/audioEmotionPredictor"
import { transcribeAudio, getTranscriptionService, type TranscriptionResult } from "~/utils/transcriptionService"
import { getSentimentAnalyzer, type SentimentAnalysisResult } from "~/utils/sentimentAnalyzer"

export interface AudioProcessingData {
    audioData: Float32Array
    sampleRate: number
    duration: number
    emotionPredictions: EmotionPredictions
    transcription?: TranscriptionResult
    sentimentAnalysis?: SentimentAnalysisResult
}

interface AudioProcessorProps {
    onAudioProcessed: (data: AudioProcessingData) => void
    onError?: (error: Error) => void
    videoFile?: File | null // Optional video file to extract audio from
    initialAudioFile?: File | null // Optional initial audio file
}

export function AudioProcessor({ onAudioProcessed, onError, videoFile, initialAudioFile }: AudioProcessorProps) {
    const audioRef = useRef<HTMLAudioElement>(null)
    const [audioFile, setAudioFile] = useState<File | null>(null)
    const [isProcessing, setIsProcessing] = useState(false)
    const [isTranscribing, setIsTranscribing] = useState(false)
    const [progress, setProgress] = useState(0)
    const [processingStage, setProcessingStage] = useState<string>("")
    const [audioData, setAudioData] = useState<AudioProcessingData | null>(null)
    const [processedAudioData, setProcessedAudioData] = useState<Float32Array | null>(null)
    const [processedSampleRate, setProcessedSampleRate] = useState<number>(16000)

    // Process audio when video file is provided
    useEffect(() => {
        if (videoFile && !audioFile && !isProcessing) {
            toast.info("Extracting audio from video...")
            handleExtractAudioFromVideo(videoFile)
        }
    }, [videoFile])

    // Use initialAudioFile if provided (and it's an audio file, not video)
    useEffect(() => {
        if (initialAudioFile && initialAudioFile.type.startsWith('audio/') && !audioFile) {
            setAudioFile(initialAudioFile)
            handleProcessAudioFile(initialAudioFile)
        }
    }, [initialAudioFile])

    const handleExtractAudioFromVideo = async (video: File) => {
        setIsProcessing(true)
        setProgress(0)
        setProcessingStage("Extracting audio from video...")

        try {
            const result = await extractAudioFromVideo(video)
            await processAudioData(result)
        } catch (error) {
            console.error("Error extracting audio from video:", error)
            if (onError) {
                onError(error instanceof Error ? error : new Error(String(error)))
            } else {
                toast.error("Failed to extract audio from video")
            }
            setIsProcessing(false)
        }
    }

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (file) {
            // Check if it's an audio file
            if (file.type.startsWith('audio/') || 
                file.name.match(/\.(mp3|wav|m4a|ogg|flac|aac)$/i)) {
                setAudioFile(file)
                handleProcessAudioFile(file)
            } else {
                toast.error("Please select an audio file")
            }
        }
    }

    const handleProcessAudioFile = async (file: File) => {
        setIsProcessing(true)
        setProgress(0)
        setProcessingStage("Loading audio file...")

        try {
            const result = await processAudioFile(file)
            await processAudioData(result)
        } catch (error) {
            console.error("Error processing audio file:", error)
            if (onError) {
                onError(error instanceof Error ? error : new Error(String(error)))
            } else {
                toast.error("Failed to process audio file")
            }
            setIsProcessing(false)
        }
    }

    const processAudioData = async (result: AudioProcessingResult) => {
        try {
            // Step 1: Normalize and prepare audio
            setProgress(10)
            setProcessingStage("Preprocessing audio...")
            const normalizedAudio = normalizeAudio(result.audioData)
            const maxLength = result.sampleRate * 10 // 10 seconds max
            const processedAudio = padOrTruncateAudio(normalizedAudio, maxLength)

            // Step 2: Predict emotions (with model validation)
            setProgress(30)
            setProcessingStage("Checking audio emotion model...")
            const predictor = getAudioEmotionPredictor()
            let emotionPredictions: EmotionPredictions = { anger: 0, sadness: 0, anxiety: 0, fear: 0, happiness: 0, guilt: 0 }
            try {
                const modelAvailable = await predictor.isModelAvailable()
                if (modelAvailable) {
                    setProcessingStage("Analyzing emotions from audio...")
                    emotionPredictions = await predictor.predictEmotions(
                        processedAudio,
                        result.sampleRate
                    )
                } else {
                    setProcessingStage("Audio emotion model not available, skipping...")
                    toast.warning("Audio emotion model not available. Emotion predictions will be skipped.")
                }
            } catch (emotionError) {
                console.warn("Audio emotion prediction failed:", emotionError)
                toast.warning("Audio emotion prediction failed. Continuing with other analyses...")
            }

            // Step 3: Store processed audio for transcription (user-initiated)
            // Transcription will be triggered by button click
            // Reset transcription state when processing new file
            setIsTranscribing(false)
            setProcessedAudioData(processedAudio)
            setProcessedSampleRate(result.sampleRate)

            // Complete without transcription - user will trigger it via button
            setProgress(100)
            setProcessingStage("Complete!")

            const processedData: AudioProcessingData = {
                audioData: processedAudio,
                sampleRate: result.sampleRate,
                duration: result.duration,
                emotionPredictions,
                // Explicitly no transcription or sentiment analysis - user will trigger it
                transcription: undefined,
                sentimentAnalysis: undefined,
            }

            setAudioData(processedData)
            onAudioProcessed(processedData)
            
            toast.success("Audio processed successfully")
        } catch (error) {
            console.error("Error processing audio data:", error)
            if (onError) {
                onError(error instanceof Error ? error : new Error(String(error)))
            } else {
                toast.error("Failed to process audio")
            }
        } finally {
            setIsProcessing(false)
        }
    }

    const handleRemove = () => {
        setAudioFile(null)
        setAudioData(null)
        setProcessedAudioData(null)
        setProgress(0)
        setProcessingStage("")
        setIsTranscribing(false)
        if (audioRef.current) {
            audioRef.current.src = ""
        }
    }

    // Handle transcription button click - process everything (blocking is okay)
    const handleTranscribe = async () => {
        // Read current state values directly (not from closure)
        const currentProcessedAudio = processedAudioData
        const currentAudioData = audioData
        const currentSampleRate = processedSampleRate

        if (!currentProcessedAudio || !currentAudioData) {
            toast.error("No audio data available for transcription")
            return
        }

        setIsTranscribing(true)
        setProcessingStage("Transcribing audio in Spanish...")
        setProgress(0)

        try {
            // Step 1: Transcribe audio (blocking - process everything)
            setProgress(20)
            setProcessingStage("Transcribing audio in Spanish (this may take a moment)...")
            
            const transcription = await transcribeAudio(
                currentProcessedAudio,
                currentSampleRate,
                'es',
                (progress) => {
                    // Update progress between 20-60%
                    const mappedProgress = 20 + (progress * 0.4)
                    setProgress(mappedProgress)
                }
            )

            if (transcription && transcription.text) {
                console.log("Transcription successful:", transcription.text.substring(0, 50) + "...")
                // Verify it's in Spanish
                if (transcription.text && transcription.text.length > 0) {
                    const spanishWords = ['el', 'la', 'de', 'que', 'y', 'a', 'en', 'un', 'es', 'se', 'no', 'te', 'lo', 'le', 'da', 'su', 'por', 'son', 'con', 'para']
                    const textLower = transcription.text.toLowerCase().trim()
                    const isSpanish = spanishWords.some(word => {
                        const wordWithSpaces = ' ' + word + ' '
                        return textLower.includes(wordWithSpaces) || 
                               textLower.startsWith(word + ' ') || 
                               textLower.endsWith(' ' + word) ||
                               textLower === word
                    })
                    if (!isSpanish && transcription.text.length > 10) {
                        console.warn("⚠️ Warning: Transcription may not be in Spanish. Text:", transcription.text.substring(0, 100))
                    }
                }
            }

            // Step 2: Analyze sentiment (if transcription available)
            setProgress(70)
            setProcessingStage("Analyzing sentiment...")
            let sentimentAnalysis: SentimentAnalysisResult | undefined
            if (transcription?.text) {
                try {
                    const analyzer = getSentimentAnalyzer()
                    sentimentAnalysis = await analyzer.analyzeSentiment(transcription.text)
                } catch (sentimentError) {
                    console.warn("Sentiment analysis failed:", sentimentError)
                    toast.warning("Sentiment analysis failed. Continuing without sentiment analysis...")
                }
            }

            // Step 3: Update audio data with transcription and sentiment
            // Use functional update to ensure we're updating the latest state
            setAudioData((prevData) => {
                if (!prevData) return prevData
                
                const updatedData: AudioProcessingData = {
                    ...prevData,
                    transcription,
                    sentimentAnalysis,
                }

                onAudioProcessed(updatedData)
                return updatedData
            })

            setProgress(100)
            setProcessingStage("Complete!")
            toast.success("Transcription and sentiment analysis completed")
        } catch (transError) {
            console.error("Transcription failed:", transError)
            toast.error("Transcription failed. Please try again.")
        } finally {
            setIsTranscribing(false)
            setProgress(100)
        }
    }

    // Component to highlight transcription with emotion tooltips
    const TranscriptionWithHighlights = ({ text, emotionPhrases }: { text: string; emotionPhrases: Array<{ text: string; emotion: string; startIndex: number; endIndex: number }> }) => {
        const highlightedText = useMemo(() => {
            if (!text || emotionPhrases.length === 0) {
                return <span className="text-sm text-muted-foreground">{text}</span>
            }

            // Sort phrases by startIndex
            const sortedPhrases = [...emotionPhrases].sort((a, b) => a.startIndex - b.startIndex)
            
            const parts: Array<{ text: string; emotion?: string; isHighlight: boolean }> = []
            let lastIndex = 0

            sortedPhrases.forEach((phrase) => {
                // Add text before the phrase
                if (phrase.startIndex > lastIndex) {
                    parts.push({
                        text: text.substring(lastIndex, phrase.startIndex),
                        isHighlight: false,
                    })
                }
                
                // Add the highlighted phrase
                parts.push({
                    text: text.substring(phrase.startIndex, phrase.endIndex),
                    emotion: phrase.emotion,
                    isHighlight: true,
                })
                
                lastIndex = phrase.endIndex
            })

            // Add remaining text
            if (lastIndex < text.length) {
                parts.push({
                    text: text.substring(lastIndex),
                    isHighlight: false,
                })
            }

            return (
                <TooltipProvider>
                    <p className="text-sm text-muted-foreground">
                        {parts.map((part, idx) => {
                            if (part.isHighlight && part.emotion) {
                                return (
                                    <Tooltip key={idx}>
                                        <TooltipTrigger asChild>
                                            <span className="underline decoration-2 decoration-chart-4 cursor-help font-medium">
                                                {part.text}
                                            </span>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p className="capitalize">{part.emotion}</p>
                                        </TooltipContent>
                                    </Tooltip>
                                )
                            }
                            return <span key={idx}>{part.text}</span>
                        })}
                    </p>
                </TooltipProvider>
            )
        }, [text, emotionPhrases])

        return highlightedText
    }

    return (
        <Card className="bg-secondary-background">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Volume2 className="h-5 w-5" />
                    Audio Processing {videoFile ? "(from video)" : ""}
                </CardTitle>
                <CardDescription>
                    {videoFile 
                        ? "Audio will be extracted and processed automatically after video processing completes"
                        : "Upload an audio file to analyze emotions, transcribe, and analyze sentiment"}
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {!videoFile && (
                    <div className="flex items-center gap-4">
                        <input
                            type="file"
                            accept="audio/*,.mp3,.wav,.m4a,.ogg,.flac,.aac"
                            onChange={handleFileSelect}
                            className="hidden"
                            id="audio-upload"
                            disabled={isProcessing}
                        />
                        <label htmlFor="audio-upload">
                            <Button
                                type="button"
                                variant="default"
                                asChild
                                disabled={isProcessing}
                            >
                                <span>
                                    <Upload className="h-4 w-4 mr-2" />
                                    {audioFile ? "Change Audio" : "Upload Audio"}
                                </span>
                            </Button>
                        </label>
                        {audioFile && (
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-muted-foreground">
                                    {audioFile.name}
                                </span>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleRemove}
                                    disabled={isProcessing}
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        )}
                    </div>
                )}

                {isProcessing && (
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">{processingStage}</span>
                            <span className="text-muted-foreground">{progress}%</span>
                        </div>
                        <Progress value={progress} />
                    </div>
                )}

                {audioData && !isProcessing && (
                    <div className="space-y-4 p-4 bg-chart-4/20 border-2 border-border rounded-base">
                        <div>
                            <p className="text-sm font-semibold mb-2">Emotion Predictions:</p>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                                {Object.entries(audioData.emotionPredictions).map(([emotion, value]) => (
                                    <div key={emotion} className="flex justify-between">
                                        <span className="capitalize">{emotion}:</span>
                                        <span className="font-medium">{value.toFixed(2)}/5</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Transcription Button - show if transcription not done yet */}
                        {!audioData.transcription && processedAudioData && (
                            <div className="border-t border-border pt-4">
                                <p className="text-sm font-semibold mb-2">Transcription & Sentiment Analysis</p>
                                <p className="text-xs text-muted-foreground mb-3">
                                    Click the button below to transcribe the audio and analyze sentiment. This may take a moment.
                                </p>
                                <Button
                                    type="button"
                                    onClick={handleTranscribe}
                                    disabled={isTranscribing}
                                    className="w-full"
                                >
                                    {isTranscribing ? (
                                        <>
                                            Transcribing... ({Math.round(progress)}%)
                                        </>
                                    ) : (
                                        "🎤 Transcribe Audio & Analyze Sentiment"
                                    )}
                                </Button>
                                {isTranscribing && (
                                    <div className="mt-3 space-y-2">
                                        <Progress value={progress} />
                                        <p className="text-xs text-muted-foreground text-center">{processingStage}</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {audioData.transcription && audioData.transcription.text ? (
                            <div>
                                <p className="text-sm font-semibold mb-2">Transcription:</p>
                                <TranscriptionWithHighlights
                                    text={audioData.transcription.text}
                                    emotionPhrases={audioData.sentimentAnalysis?.emotionPhrases || []}
                                />
                            </div>
                        ) : audioData.transcription && !audioData.transcription.text ? (
                            <div>
                                <p className="text-sm font-semibold mb-2">Transcription:</p>
                                <p className="text-sm text-muted-foreground italic">No transcription available (empty result)</p>
                            </div>
                        ) : null}

                        {audioData.sentimentAnalysis && (
                            <div>
                                <p className="text-sm font-semibold mb-2">Sentiment:</p>
                                <p className="text-sm capitalize">
                                    {audioData.sentimentAnalysis.overallSentiment} 
                                    {" "}({audioData.sentimentAnalysis.sentimentScore.toFixed(2)})
                                </p>
                                {audioData.sentimentAnalysis.emotionPhrases.length > 0 && (
                                    <div className="mt-2">
                                        <p className="text-xs font-semibold mb-1">Emotion Phrases:</p>
                                        <div className="space-y-1">
                                            {audioData.sentimentAnalysis.emotionPhrases.slice(0, 3).map((phrase, idx) => (
                                                <p key={idx} className="text-xs text-muted-foreground">
                                                    <span className="capitalize">{phrase.emotion}:</span> {phrase.text}
                                                </p>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {audioFile && !isProcessing && (
                    <audio
                        ref={audioRef}
                        src={URL.createObjectURL(audioFile)}
                        controls
                        className="w-full"
                    />
                )}
            </CardContent>
        </Card>
    )
}

