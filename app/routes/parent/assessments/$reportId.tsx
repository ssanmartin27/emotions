"use client"

import { useQuery } from "convex/react"
import { api } from "convex/_generated/api"
import { useParams, useNavigate } from "react-router"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card"
import { Button } from "~/components/ui/button"
import { format } from "date-fns"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Line, LineChart } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "~/components/ui/chart"
import { Download, ArrowLeft } from "lucide-react"
import { generatePDF } from "~/utils/pdfGenerator"
import { TherapistName } from "~/components/therapist-name"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs"

export default function AssessmentDetailView() {
    const { reportId } = useParams()
    const navigate = useNavigate()

    const report = useQuery(
        api.report.getReportById,
        reportId ? { reportId: reportId as any } : "skip"
    )
    const children = useQuery(api.parents.getParentChildren)
    
    // Move therapist query before early return to avoid hook count mismatch
    const therapist = useQuery(
        api.therapists.getTherapistById,
        report?.therapistId ? { therapistId: report.therapistId as any } : "skip"
    )

    if (!report) {
        return (
            <div className="p-6">
                <p>Loading assessment...</p>
            </div>
        )
    }

    const child = children?.find((c) => c._id === report.childId)
    const childName = child ? `${child.firstName} ${child.lastName}` : "Unknown Child"

    // Show all emotions, not just non-zero ones
    const emotionChartData = [
        { emotion: "Anger", value: report.emotionData.anger || 0 },
        { emotion: "Sadness", value: report.emotionData.sadness || 0 },
        { emotion: "Anxiety", value: report.emotionData.anxiety || 0 },
        { emotion: "Fear", value: report.emotionData.fear || 0 },
        { emotion: "Happiness", value: report.emotionData.happiness || 0 },
        { emotion: "Guilt", value: report.emotionData.guilt || 0 },
    ]

    const chartConfig = {
        value: { label: "Intensity", color: "var(--color-chart-1)" },
    } satisfies ChartConfig

    const testScore =
        report.testResults && report.testResults.length > 0
            ? Math.round(
                  (report.testResults.reduce((sum, r) => sum + r.score, 0) /
                      (report.testResults.length * 4)) *
                      100
              )
            : null

    const handleDownloadPDF = async () => {
        if (!report || !child) return
        const evaluatorName = therapist
            ? `${therapist.firstName} ${therapist.lastName}`
            : "Therapist"
        await generatePDF({
            report: {
                _id: report._id,
                createdAt: report.createdAt,
                text: report.text,
                emotionData: report.emotionData,
                testResults: report.testResults,
                richTextContent: report.richTextContent,
            },
            childName,
            evaluatorName,
        })
    }

    return (
        <div className="flex flex-col gap-6 w-full min-w-0 max-w-full">
            {/* Header */}
            <div className="flex justify-between items-center flex-wrap gap-4 w-full">
                <div className="flex items-center gap-4 flex-wrap">
                    <Button variant="neutral" onClick={() => navigate("/parent/assessments")}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold">Assessment Details</h1>
                        <p className="text-muted-foreground">
                            {format(new Date(report.createdAt), "MMMM d, yyyy 'at' h:mm a")}
                        </p>
                    </div>
                </div>
                <Button onClick={handleDownloadPDF}>
                    <Download className="mr-2 h-4 w-4" />
                    Download PDF
                </Button>
            </div>

            {/* Assessment Information */}
            <Card className="w-full max-w-full">
                <CardHeader>
                    <CardTitle>Assessment Information</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 w-full">
                    <div>
                        <p className="text-sm text-muted-foreground">Child</p>
                        <p className="font-semibold">{childName}</p>
                    </div>
                    <div>
                        <p className="text-sm text-muted-foreground">Assessment Date</p>
                        <p className="font-semibold">
                            {format(new Date(report.createdAt), "MMMM d, yyyy")}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                            {format(new Date(report.createdAt), "h:mm a")}
                        </p>
                    </div>
                    {report.updatedAt && report.updatedAt !== report.createdAt && (
                        <div>
                            <p className="text-sm text-muted-foreground">Last Updated</p>
                            <p className="font-semibold">
                                {format(new Date(report.updatedAt), "MMMM d, yyyy")}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                                {format(new Date(report.updatedAt), "h:mm a")}
                            </p>
                        </div>
                    )}
                    <div>
                        <p className="text-sm text-muted-foreground">Evaluator</p>
                        <p className="font-semibold">
                            {report.therapistId ? (
                                <TherapistName therapistId={report.therapistId} />
                            ) : (
                                "Unknown"
                            )}
                        </p>
                    </div>
                    {report.sessionId && (
                        <div>
                            <p className="text-sm text-muted-foreground">Session</p>
                            <p className="font-semibold text-sm">Linked to session</p>
                        </div>
                    )}
                    {testScore !== null && (
                        <div>
                            <p className="text-sm text-muted-foreground">Test Score</p>
                            <p
                                className={`font-semibold ${
                                    testScore < 50
                                        ? "text-red-500"
                                        : testScore < 70
                                        ? "text-yellow-500"
                                        : "text-green-500"
                                }`}
                            >
                                {testScore}%
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Emotional State */}
            <Card className="w-full max-w-full">
                <CardHeader>
                    <CardTitle>Emotional State</CardTitle>
                    <CardDescription>Observed emotional states during assessment</CardDescription>
                </CardHeader>
                <CardContent className="w-full max-w-full overflow-x-auto">
                    <div className="min-w-[600px]">
                        <ChartContainer config={chartConfig} className="h-[300px] w-full">
                        <BarChart data={emotionChartData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="emotion" />
                            <YAxis domain={[0, 5]} />
                            <ChartTooltip content={<ChartTooltipContent />} />
                            <Bar
                                dataKey="value"
                                fill="var(--color-chart-1)"
                                radius={[8, 8, 0, 0]}
                            />
                        </BarChart>
                        </ChartContainer>
                    </div>
                    <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-4">
                        {Object.entries(report.emotionData).map(([emotion, value]) => (
                            <div key={emotion} className="flex justify-between items-center border rounded-lg p-3">
                                <span className="capitalize font-medium">{emotion}:</span>
                                <span className="font-semibold text-lg">
                                    {value !== undefined && value !== null ? `${value}/5` : "N/A"}
                                </span>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Notes */}
            <Card className="w-full max-w-full">
                <CardHeader>
                    <CardTitle>Notes</CardTitle>
                </CardHeader>
                <CardContent className="w-full max-w-full overflow-x-auto">
                    <div className="prose max-w-none min-w-0">
                        <p className="whitespace-pre-wrap break-words">{report.text}</p>
                    </div>
                    {report.richTextContent && (
                        <div className="mt-4">
                            <h3 className="font-semibold mb-2">Additional Notes</h3>
                            <div
                                className="prose max-w-none min-w-0 break-words"
                                dangerouslySetInnerHTML={{ __html: report.richTextContent }}
                            />
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Recommendations */}
            <Card className="w-full max-w-full">
                <CardHeader>
                    <CardTitle>Recommendations</CardTitle>
                </CardHeader>
                <CardContent className="w-full max-w-full">
                    <p className="text-muted-foreground">
                        Recommendations are provided by the therapist based on the assessment
                        results. Please review these with your child's therapist for personalized
                        guidance.
                    </p>
                    {/* In a full implementation, recommendations would come from the report or therapist notes */}
                </CardContent>
            </Card>

            {/* Test Results */}
            {report.testResults && report.testResults.length > 0 && (
                <Card className="w-full max-w-full">
                    <CardHeader>
                        <CardTitle>Test Results</CardTitle>
                        <CardDescription>
                            {testScore !== null && (
                                <span
                                    className={
                                        testScore < 50
                                            ? "text-red-500"
                                            : testScore < 70
                                            ? "text-yellow-500"
                                            : "text-green-500"
                                    }
                                >
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
                                        <span className="text-muted-foreground">
                                            Answer: {result.answer}
                                        </span>
                                        <span className="font-semibold">Score: {result.score}/4</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Landmarks / Facial Analysis Data */}
            {report.landmarks && report.landmarks.length > 0 && (
                <Card className="w-full max-w-full">
                    <CardHeader>
                        <CardTitle>Facial Analysis Data</CardTitle>
                        <CardDescription>
                            Action Units and pose landmarks extracted from video ({report.landmarks.length} frames)
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="w-full max-w-full overflow-x-auto">
                        <div className="min-w-[600px]">
                            <Tabs defaultValue="aus" className="w-full">
                            <TabsList>
                                <TabsTrigger value="aus">Action Units</TabsTrigger>
                                <TabsTrigger value="overview">Overview</TabsTrigger>
                            </TabsList>
                            
                            <TabsContent value="aus" className="space-y-4">
                                <div className="text-sm text-muted-foreground">
                                    Action Unit intensities over time during the assessment
                                </div>
                                <ChartContainer config={chartConfig} className="h-[400px] w-full">
                                    <LineChart data={report.landmarks.map((lm) => ({
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
                                        <Line type="monotone" dataKey="AU01" stroke="#8884d8" strokeWidth={2} name="AU01 (Inner brow)" />
                                        <Line type="monotone" dataKey="AU02" stroke="#82ca9d" strokeWidth={2} name="AU02 (Outer brow)" />
                                        <Line type="monotone" dataKey="AU04" stroke="#ffc658" strokeWidth={2} name="AU04 (Brow lowerer)" />
                                        <Line type="monotone" dataKey="AU05" stroke="#ff7300" strokeWidth={2} name="AU05 (Upper lid)" />
                                        <Line type="monotone" dataKey="AU06" stroke="#00ff00" strokeWidth={2} name="AU06 (Cheek)" />
                                        <Line type="monotone" dataKey="AU12" stroke="#0088fe" strokeWidth={2} name="AU12 (Lip corner)" />
                                        <Line type="monotone" dataKey="AU14" stroke="#ff00ff" strokeWidth={2} name="AU14 (Dimpler)" />
                                        <Line type="monotone" dataKey="AU15" stroke="#ffff00" strokeWidth={2} name="AU15 (Lip corner depressor)" />
                                        <Line type="monotone" dataKey="AU17" stroke="#00ffff" strokeWidth={2} name="AU17 (Chin raiser)" />
                                        <Line type="monotone" dataKey="AU20" stroke="#800080" strokeWidth={2} name="AU20 (Lip stretcher)" />
                                        <Line type="monotone" dataKey="AU25" stroke="#ffa500" strokeWidth={2} name="AU25 (Lips part)" />
                                    </LineChart>
                                </ChartContainer>
                                <div className="text-xs text-muted-foreground">
                                    <p className="mb-2">Action Units (AUs) measure facial muscle movements. Higher values indicate stronger activation.</p>
                                </div>
                            </TabsContent>
                            
                            <TabsContent value="overview" className="space-y-4">
                                <div className="text-sm text-muted-foreground mb-4">
                                    Summary of facial analysis data collected during the assessment
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="border rounded-lg p-4">
                                        <p className="font-semibold mb-2">Total Frames Analyzed</p>
                                        <p className="text-2xl font-bold">{report.landmarks.length}</p>
                                    </div>
                                    <div className="border rounded-lg p-4">
                                        <p className="font-semibold mb-2">Duration</p>
                                        <p className="text-2xl font-bold">
                                            {report.landmarks.length > 0
                                                ? `${((report.landmarks[report.landmarks.length - 1].timestamp - report.landmarks[0].timestamp) / 1000).toFixed(1)}s`
                                                : "N/A"}
                                        </p>
                                    </div>
                                </div>
                                <div className="border rounded-lg p-4">
                                    <p className="font-semibold mb-3">Average Action Unit Intensities</p>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                        {[
                                            { name: "AU01", label: "Inner brow" },
                                            { name: "AU02", label: "Outer brow" },
                                            { name: "AU04", label: "Brow lowerer" },
                                            { name: "AU05", label: "Upper lid" },
                                            { name: "AU06", label: "Cheek" },
                                            { name: "AU07", label: "Lid tightener" },
                                            { name: "AU12", label: "Lip corner" },
                                            { name: "AU14", label: "Dimpler" },
                                            { name: "AU15", label: "Lip corner depressor" },
                                            { name: "AU17", label: "Chin raiser" },
                                            { name: "AU20", label: "Lip stretcher" },
                                            { name: "AU25", label: "Lips part" },
                                        ].map(({ name, label }) => {
                                            const avg = report.landmarks.reduce((sum, lm) => sum + lm.aus[name as keyof typeof lm.aus], 0) / report.landmarks.length
                                            return (
                                                <div key={name} className="flex justify-between items-center">
                                                    <span className="text-sm text-muted-foreground">{name}</span>
                                                    <span className="text-sm font-semibold">{avg.toFixed(2)}</span>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>
                            </TabsContent>
                            </Tabs>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}

