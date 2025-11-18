"use client"

import { useQuery, useMutation } from "convex/react"
import { api } from "convex/_generated/api"
import { useParams, useNavigate } from "react-router"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card"
import { Button } from "~/components/ui/button"
import { format } from "date-fns"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Line, LineChart } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "~/components/ui/chart"
import { toast } from "sonner"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "~/components/ui/alert-dialog"
import * as React from "react"

export default function ReportDetailView() {
    const { reportId } = useParams()
    const navigate = useNavigate()
    const [showDeleteDialog, setShowDeleteDialog] = React.useState(false)
    
    const report = useQuery(api.report.getReportById, { 
        reportId: reportId as any 
    })
    const deleteReport = useMutation(api.report.deleteReport)

    if (!report) {
        return (
            <div className="p-6">
                <p>Loading report...</p>
            </div>
        )
    }

    const handleDelete = async () => {
        try {
            await deleteReport({ reportId: reportId as any })
            toast.success("Report deleted")
            navigate("/therapist/reports")
        } catch (error) {
            toast.error("Failed to delete report")
        } finally {
            setShowDeleteDialog(false)
        }
    }

    const emotionChartData = [
        { emotion: "Anger", value: report.emotionData.anger || 0 },
        { emotion: "Sadness", value: report.emotionData.sadness || 0 },
        { emotion: "Anxiety", value: report.emotionData.anxiety || 0 },
        { emotion: "Fear", value: report.emotionData.fear || 0 },
        { emotion: "Happiness", value: report.emotionData.happiness || 0 },
        { emotion: "Guilt", value: report.emotionData.guilt || 0 },
    ].filter(item => item.value > 0)

    const audioEmotionChartData = report.audioEmotionData ? [
        { emotion: "Anger", value: report.audioEmotionData.anger || 0 },
        { emotion: "Sadness", value: report.audioEmotionData.sadness || 0 },
        { emotion: "Anxiety", value: report.audioEmotionData.anxiety || 0 },
        { emotion: "Fear", value: report.audioEmotionData.fear || 0 },
        { emotion: "Happiness", value: report.audioEmotionData.happiness || 0 },
        { emotion: "Guilt", value: report.audioEmotionData.guilt || 0 },
    ].filter(item => item.value > 0) : []

    const combinedEmotionChartData = report.combinedEmotionData ? [
        { emotion: "Anger", value: report.combinedEmotionData.anger || 0 },
        { emotion: "Sadness", value: report.combinedEmotionData.sadness || 0 },
        { emotion: "Anxiety", value: report.combinedEmotionData.anxiety || 0 },
        { emotion: "Fear", value: report.combinedEmotionData.fear || 0 },
        { emotion: "Happiness", value: report.combinedEmotionData.happiness || 0 },
        { emotion: "Guilt", value: report.combinedEmotionData.guilt || 0 },
    ].filter(item => item.value > 0) : []

    const chartConfig = {
        value: { label: "Intensity", color: "var(--color-chart-1)" },
    } satisfies ChartConfig

    const testScore = report.testResults && report.testResults.length > 0
        ? Math.round(
            (report.testResults.reduce((sum, r) => sum + r.score, 0) / (report.testResults.length * 4)) * 100
        )
        : null

    return (
        <>
            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete this report
                            and remove all associated data from the database.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setShowDeleteDialog(false)}>
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            <div className="flex flex-col gap-6 max-w-4xl mx-auto">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                        <div>
                            <h1 className="text-2xl font-bold">Report Details</h1>
                            <p className="text-muted-foreground">
                                {format(new Date(report.createdAt), "MMMM d, yyyy 'at' h:mm a")}
                            </p>
                        </div>
                        <div className="flex gap-2 flex-shrink-0">
                            <Button
                                variant="neutral"
                                onClick={() => navigate(`/therapist/reports/${reportId}/edit`)}
                            >
                                Edit
                            </Button>
                            <Button
                                variant="destructive"
                                onClick={() => setShowDeleteDialog(true)}
                            >
                                Delete
                            </Button>
                        </div>
                    </div>

            {/* Report Content */}
            <Card>
                <CardHeader>
                    <CardTitle>Report Content</CardTitle>
                </CardHeader>
                    <CardContent>
                        <div className="prose max-w-none overflow-x-auto">
                            <p className="whitespace-pre-wrap break-words">{report.text}</p>
                        </div>
                        {report.richTextContent && (
                            <div className="mt-4 overflow-x-auto">
                                <h3 className="font-semibold mb-2">Rich Text Content</h3>
                                <div 
                                    className="prose max-w-none break-words"
                                    dangerouslySetInnerHTML={{ __html: report.richTextContent }}
                                />
                            </div>
                        )}
                    </CardContent>
            </Card>

            {/* Emotion Analysis Tabs */}
            <Card>
                <CardHeader>
                    <CardTitle>Emotion Analysis</CardTitle>
                    <CardDescription>Emotional states from video and audio analysis</CardDescription>
                </CardHeader>
                <CardContent>
                    <Tabs 
                        defaultValue={
                            emotionChartData.length > 0 ? "video" : 
                            audioEmotionChartData.length > 0 ? "audio" : 
                            "combined"
                        } 
                        className="w-full"
                    >
                        <TabsList>
                            {emotionChartData.length > 0 && <TabsTrigger value="video">Video Analysis</TabsTrigger>}
                            {audioEmotionChartData.length > 0 && <TabsTrigger value="audio">Audio Analysis</TabsTrigger>}
                            {combinedEmotionChartData.length > 0 && <TabsTrigger value="combined">Combined Analysis</TabsTrigger>}
                        </TabsList>
                        
                        {/* Video Analysis */}
                        {emotionChartData.length > 0 && (
                            <TabsContent value="video" className="space-y-4">
                                <div className="w-full overflow-x-auto">
                                    <ChartContainer config={chartConfig} className="h-[300px] w-full min-w-[300px]">
                                        <BarChart data={emotionChartData}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="emotion" />
                                            <YAxis domain={[0, 5]} />
                                            <ChartTooltip content={<ChartTooltipContent />} />
                                            <Bar dataKey="value" fill="var(--color-chart-1)" radius={[8, 8, 0, 0]} />
                                        </BarChart>
                                    </ChartContainer>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {Object.entries(report.emotionData).map(([emotion, value]) => {
                                        if (value === undefined || value === 0) return null
                                        return (
                                            <div key={emotion} className="flex justify-between">
                                                <span className="capitalize">{emotion}:</span>
                                                <span className="font-semibold">{value}/5</span>
                                            </div>
                                        )
                                    })}
                                </div>
                            </TabsContent>
                        )}

                        {/* Audio Analysis */}
                        {audioEmotionChartData.length > 0 && (
                            <TabsContent value="audio" className="space-y-4">
                                <div className="w-full overflow-x-auto">
                                    <ChartContainer config={chartConfig} className="h-[300px] w-full min-w-[300px]">
                                        <BarChart data={audioEmotionChartData}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="emotion" />
                                            <YAxis domain={[0, 5]} />
                                            <ChartTooltip content={<ChartTooltipContent />} />
                                            <Bar dataKey="value" fill="var(--color-chart-2)" radius={[8, 8, 0, 0]} />
                                        </BarChart>
                                    </ChartContainer>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {report.audioEmotionData && Object.entries(report.audioEmotionData).map(([emotion, value]) => {
                                        if (value === undefined || value === 0) return null
                                        return (
                                            <div key={emotion} className="flex justify-between">
                                                <span className="capitalize">{emotion}:</span>
                                                <span className="font-semibold">{value}/5</span>
                                            </div>
                                        )
                                    })}
                                </div>
                            </TabsContent>
                        )}

                        {/* Combined Analysis */}
                        {combinedEmotionChartData.length > 0 && (
                            <TabsContent value="combined" className="space-y-4">
                                <div className="p-3 bg-chart-5/10 border border-chart-5/20 rounded-lg">
                                    <p className="text-sm text-muted-foreground">
                                        Combined analysis uses weighted average: 60% video + 40% audio
                                    </p>
                                </div>
                                <div className="w-full overflow-x-auto">
                                    <ChartContainer config={chartConfig} className="h-[300px] w-full min-w-[300px]">
                                        <BarChart data={combinedEmotionChartData}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="emotion" />
                                            <YAxis domain={[0, 5]} />
                                            <ChartTooltip content={<ChartTooltipContent />} />
                                            <Bar dataKey="value" fill="var(--color-chart-5)" radius={[8, 8, 0, 0]} />
                                        </BarChart>
                                    </ChartContainer>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {report.combinedEmotionData && Object.entries(report.combinedEmotionData).map(([emotion, value]) => {
                                        if (value === undefined || value === 0) return null
                                        return (
                                            <div key={emotion} className="flex justify-between">
                                                <span className="capitalize">{emotion}:</span>
                                                <span className="font-semibold">{value.toFixed(2)}/5</span>
                                            </div>
                                        )
                                    })}
                                </div>
                            </TabsContent>
                        )}
                    </Tabs>
                </CardContent>
            </Card>

            {/* Transcription */}
            {report.transcription && (
                <Card>
                    <CardHeader>
                        <CardTitle>Audio Transcription</CardTitle>
                        <CardDescription>Transcribed text from audio analysis</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="prose max-w-none">
                            <p className="whitespace-pre-wrap break-words">{report.transcription}</p>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Sentiment Analysis */}
            {report.sentimentAnalysis && (
                <Card>
                    <CardHeader>
                        <CardTitle>Sentiment Analysis</CardTitle>
                        <CardDescription>Analysis of transcribed text for emotional indicators</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center gap-4">
                            <div>
                                <p className="text-sm text-muted-foreground">Overall Sentiment</p>
                                <p className="text-lg font-semibold capitalize">
                                    {report.sentimentAnalysis.overallSentiment}
                                    {" "}
                                    <span className="text-sm font-normal text-muted-foreground">
                                        ({report.sentimentAnalysis.sentimentScore > 0 ? '+' : ''}{report.sentimentAnalysis.sentimentScore.toFixed(2)})
                                    </span>
                                </p>
                            </div>
                        </div>

                        {report.sentimentAnalysis.emotionPhrases && report.sentimentAnalysis.emotionPhrases.length > 0 && (
                            <div>
                                <p className="text-sm font-semibold mb-2">Emotion-Specific Phrases</p>
                                <div className="space-y-2">
                                    {report.sentimentAnalysis.emotionPhrases.map((phrase, idx) => (
                                        <div key={idx} className="p-3 border rounded-lg bg-muted/50">
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="text-sm font-semibold capitalize">{phrase.emotion}</span>
                                                <span className="text-xs text-muted-foreground">
                                                    Confidence: {(phrase.confidence * 100).toFixed(0)}%
                                                </span>
                                            </div>
                                            <p className="text-sm text-muted-foreground italic">"{phrase.text}"</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {report.sentimentAnalysis.keyPhrases && report.sentimentAnalysis.keyPhrases.length > 0 && (
                            <div>
                                <p className="text-sm font-semibold mb-2">Key Phrases</p>
                                <div className="flex flex-wrap gap-2">
                                    {report.sentimentAnalysis.keyPhrases.map((phrase, idx) => (
                                        <span
                                            key={idx}
                                            className={`px-3 py-1 rounded-full text-xs ${
                                                phrase.sentiment === 'positive' 
                                                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                                    : phrase.sentiment === 'negative'
                                                    ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                                    : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
                                            }`}
                                        >
                                            {phrase.text}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Test Results */}
            {report.testResults && report.testResults.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Test Results</CardTitle>
                        <CardDescription>
                            {testScore !== null && (
                                <span className={testScore < 50 ? "text-red-500" : testScore < 70 ? "text-yellow-500" : "text-green-500"}>
                                    Overall Score: {testScore}%
                                </span>
                            )}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {report.testResults.map((result, index) => (
                                <div key={index} className="border rounded-lg p-4">
                                    <p className="font-semibold mb-2">{result.question}</p>
                                    <div className="flex justify-between items-center">
                                        <span className="text-muted-foreground">Answer: {result.answer}</span>
                                        <span className="font-semibold">Score: {result.score}/4</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Landmarks Visualization */}
            {report.landmarks && report.landmarks.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Facial Analysis Data</CardTitle>
                        <CardDescription>
                            Action Units and pose landmarks extracted from video ({report.landmarks.length} frames)
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Tabs defaultValue="aus" className="w-full">
                            <TabsList>
                                <TabsTrigger value="aus">Action Units</TabsTrigger>
                                <TabsTrigger value="emotions">Emotions Over Time</TabsTrigger>
                            </TabsList>
                            
                            <TabsContent value="aus" className="space-y-4">
                                <div className="text-sm text-muted-foreground">
                                    Action Unit intensities over time
                                </div>
                                <div className="w-full overflow-x-auto">
                                    <ChartContainer config={chartConfig} className="h-[400px] w-full min-w-[600px]">
                                    <LineChart data={report.landmarks.map((lm, idx) => ({
                                        frame: lm.frame,
                                        timestamp: typeof lm.timestamp === 'number' ? lm.timestamp.toFixed(2) : lm.timestamp,
                                        AU01: lm.aus.AU01,
                                        AU02: lm.aus.AU02,
                                        AU04: lm.aus.AU04,
                                        AU05: lm.aus.AU05,
                                        AU06: lm.aus.AU06,
                                        AU07: lm.aus.AU07,
                                        AU12: lm.aus.AU12,
                                        AU14: lm.aus.AU14,
                                        AU15: lm.aus.AU15,
                                        AU17: lm.aus.AU17,
                                        AU20: lm.aus.AU20,
                                        AU25: lm.aus.AU25,
                                    }))}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="frame" />
                                        <YAxis domain={[0, 5]} />
                                        <ChartTooltip content={<ChartTooltipContent />} />
                                        <Line type="monotone" dataKey="AU01" stroke="#8884d8" strokeWidth={2} />
                                        <Line type="monotone" dataKey="AU02" stroke="#82ca9d" strokeWidth={2} />
                                        <Line type="monotone" dataKey="AU04" stroke="#ffc658" strokeWidth={2} />
                                        <Line type="monotone" dataKey="AU05" stroke="#ff7300" strokeWidth={2} />
                                        <Line type="monotone" dataKey="AU06" stroke="#00ff00" strokeWidth={2} />
                                        <Line type="monotone" dataKey="AU12" stroke="#0088fe" strokeWidth={2} />
                                    </LineChart>
                                    </ChartContainer>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-xs">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 bg-[#8884d8]"></div>
                                        <span>AU01 (Inner brow)</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 bg-[#82ca9d]"></div>
                                        <span>AU02 (Outer brow)</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 bg-[#ffc658]"></div>
                                        <span>AU04 (Brow lowerer)</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 bg-[#ff7300]"></div>
                                        <span>AU05 (Upper lid)</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 bg-[#00ff00]"></div>
                                        <span>AU06 (Cheek)</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 bg-[#0088fe]"></div>
                                        <span>AU12 (Lip corner)</span>
                                    </div>
                                </div>
                            </TabsContent>
                            
                            <TabsContent value="emotions" className="space-y-4">
                                <div className="text-sm text-muted-foreground">
                                    Predicted emotion intensities over time
                                </div>
                                <div className="w-full overflow-x-auto">
                                    <ChartContainer config={chartConfig} className="h-[400px] w-full min-w-[600px]">
                                    <LineChart data={report.landmarks.map((lm) => ({
                                        frame: lm.frame,
                                        timestamp: typeof lm.timestamp === 'number' ? lm.timestamp.toFixed(2) : lm.timestamp,
                                        // Note: These would need to be calculated from AUs or stored separately
                                        // For now, showing static emotion data
                                        anger: report.emotionData.anger || 0,
                                        sadness: report.emotionData.sadness || 0,
                                        anxiety: report.emotionData.anxiety || 0,
                                        fear: report.emotionData.fear || 0,
                                        happiness: report.emotionData.happiness || 0,
                                        guilt: report.emotionData.guilt || 0,
                                    }))}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="frame" />
                                        <YAxis domain={[0, 5]} />
                                        <ChartTooltip content={<ChartTooltipContent />} />
                                        <Line type="monotone" dataKey="anger" stroke="#ff0000" strokeWidth={2} name="Anger" />
                                        <Line type="monotone" dataKey="sadness" stroke="#0000ff" strokeWidth={2} name="Sadness" />
                                        <Line type="monotone" dataKey="anxiety" stroke="#ff00ff" strokeWidth={2} name="Anxiety" />
                                        <Line type="monotone" dataKey="fear" stroke="#800080" strokeWidth={2} name="Fear" />
                                        <Line type="monotone" dataKey="happiness" stroke="#00ff00" strokeWidth={2} name="Happiness" />
                                        <Line type="monotone" dataKey="guilt" stroke="#ffa500" strokeWidth={2} name="Guilt" />
                                    </LineChart>
                                    </ChartContainer>
                                </div>
                            </TabsContent>
                        </Tabs>
                    </CardContent>
                </Card>
            )}
            </div>
        </>
    )
}

