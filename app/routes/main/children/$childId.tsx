"use client"

import { useQuery } from "convex/react"
import { api } from "convex/_generated/api"
import { useParams, useNavigate, Link } from "react-router"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card"
import { Button } from "~/components/ui/button"
import { format } from "date-fns"
import * as React from "react"
import { Line, LineChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent, type ChartConfig } from "~/components/ui/chart"

export default function ChildDetailView() {
    const { childId } = useParams()
    const navigate = useNavigate()
    
    const child = useQuery(api.therapists.getChildById, { 
        childId: childId as any 
    })
    const reports = useQuery(api.therapists.getChildReports, { 
        childId: childId as any 
    })
    const emotionData = useQuery(api.emotions.getEmotionData, {
        childId: childId as any,
    })

    if (!childId) {
        return (
            <div className="p-6">
                <p>Invalid child ID. Please go back and try again.</p>
            </div>
        )
    }

    if (!child) {
        return (
            <div className="p-6">
                <p>Loading child information...</p>
            </div>
        )
    }

    const recentReports = reports?.slice(0, 5) || []

    // Prepare assessment-sequence-based chart data
    const assessmentProgressData = React.useMemo(() => {
        if (!reports || reports.length === 0) {
            return []
        }

        // Sort reports by creation date to determine assessment sequence
        const sortedReports = [...reports].sort((a, b) => a.createdAt - b.createdAt)

        // Group by assessment sequence number (1st, 2nd, 3rd, etc.)
        const sequenceMap: Record<number, {
            anger: number[]
            sadness: number[]
            anxiety: number[]
            fear: number[]
            happiness: number[]
            guilt: number[]
        }> = {}

        sortedReports.forEach((report, index) => {
            const sequenceNum = index + 1
            if (!sequenceMap[sequenceNum]) {
                sequenceMap[sequenceNum] = {
                    anger: [], sadness: [], anxiety: [], fear: [], happiness: [], guilt: []
                }
            }

            const emotions = report.emotionData
            if (emotions.anger) sequenceMap[sequenceNum].anger.push(emotions.anger)
            if (emotions.sadness) sequenceMap[sequenceNum].sadness.push(emotions.sadness)
            if (emotions.anxiety) sequenceMap[sequenceNum].anxiety.push(emotions.anxiety)
            if (emotions.fear) sequenceMap[sequenceNum].fear.push(emotions.fear)
            if (emotions.happiness) sequenceMap[sequenceNum].happiness.push(emotions.happiness)
            if (emotions.guilt) sequenceMap[sequenceNum].guilt.push(emotions.guilt)
        })

        // Convert to array format with averages
        const maxSequence = Object.keys(sequenceMap).length
        if (maxSequence === 0) {
            return []
        }

        const result = []
        const avg = (arr: number[]) => arr.length > 0 
            ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length * 10) / 10 
            : 0

        for (let i = 1; i <= Math.min(maxSequence, 20); i++) { // Limit to first 20 assessments
            const data = sequenceMap[i]
            if (!data) continue

            result.push({
                assessment: `#${i}`,
                anger: avg(data.anger),
                sadness: avg(data.sadness),
                anxiety: avg(data.anxiety),
                fear: avg(data.fear),
                happiness: avg(data.happiness),
                guilt: avg(data.guilt),
            })
        }

        return result
    }, [reports])

    const chartConfig = {
        anger: { label: "Anger", color: "var(--color-chart-1)" },
        sadness: { label: "Sadness", color: "var(--color-chart-2)" },
        anxiety: { label: "Anxiety", color: "var(--color-chart-3)" },
        fear: { label: "Fear", color: "var(--color-chart-4)" },
        happiness: { label: "Happiness", color: "var(--color-chart-5)" },
        guilt: { label: "Guilt", color: "#9B59B6" },
    } satisfies ChartConfig

    return (
        <div className="flex flex-col gap-6 p-6">
            {/* Child Information Card */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-2xl">
                        {child.firstName} {child.lastName}
                    </CardTitle>
                    <CardDescription>Child Profile</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                    <div>
                        <p className="text-sm text-muted-foreground">Age</p>
                        <p className="text-lg font-semibold">{child.age} years old</p>
                    </div>
                    <div>
                        <p className="text-sm text-muted-foreground">Course</p>
                        <p className="text-lg font-semibold">{child.course}</p>
                    </div>
                    <div>
                        <p className="text-sm text-muted-foreground">Sex</p>
                        <p className="text-lg font-semibold">{child.sex}</p>
                    </div>
                    <div>
                        <p className="text-sm text-muted-foreground">Last Evaluation</p>
                        <p className="text-lg font-semibold">
                            {child.lastEvaluationDate
                                ? format(new Date(child.lastEvaluationDate), "MMM d, yyyy")
                                : "Never"}
                        </p>
                    </div>
                </CardContent>
            </Card>

            {/* Quick Actions */}
            <div className="flex gap-4">
                <Button
                    onClick={() => navigate(`/therapist/create-report?childId=${childId}`)}
                >
                    Create Report
                </Button>
                <Button
                    variant="outline"
                    onClick={() => navigate(`/therapist/children/${childId}/reports`)}
                >
                    View All Reports
                </Button>
                <Button
                    variant="outline"
                    onClick={() => navigate(`/therapist/calendar`)}
                >
                    Schedule Session
                </Button>
            </div>

            {/* Emotion Progress by Assessment */}
            {assessmentProgressData.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Emotion Progress by Assessment</CardTitle>
                        <CardDescription>Emotion trends across sequential assessments</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ChartContainer config={chartConfig} className="h-[300px] w-full">
                            <LineChart data={assessmentProgressData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis 
                                    dataKey="assessment" 
                                    tickLine={false}
                                    axisLine={false}
                                    tickMargin={8}
                                    tickFormatter={(value) => value.replace('#', 'Assessment ')}
                                />
                                <YAxis domain={[0, 5]} />
                                <ChartTooltip content={<ChartTooltipContent indicator="dot" />} />
                                <ChartLegend content={<ChartLegendContent />} />
                                <Line 
                                    type="monotone"
                                    dataKey="happiness"
                                    stroke="var(--color-chart-5)"
                                    strokeWidth={2}
                                    dot={{ r: 4 }}
                                    activeDot={{ r: 6 }}
                                />
                                <Line 
                                    type="monotone"
                                    dataKey="sadness"
                                    stroke="var(--color-chart-2)"
                                    strokeWidth={2}
                                    dot={{ r: 4 }}
                                    activeDot={{ r: 6 }}
                                />
                                <Line 
                                    type="monotone"
                                    dataKey="anxiety"
                                    stroke="var(--color-chart-3)"
                                    strokeWidth={2}
                                    dot={{ r: 4 }}
                                    activeDot={{ r: 6 }}
                                />
                                <Line 
                                    type="monotone"
                                    dataKey="anger"
                                    stroke="var(--color-chart-1)"
                                    strokeWidth={2}
                                    dot={{ r: 4 }}
                                    activeDot={{ r: 6 }}
                                />
                                <Line 
                                    type="monotone"
                                    dataKey="fear"
                                    stroke="var(--color-chart-4)"
                                    strokeWidth={2}
                                    dot={{ r: 4 }}
                                    activeDot={{ r: 6 }}
                                />
                                <Line 
                                    type="monotone"
                                    dataKey="guilt"
                                    stroke="#9B59B6"
                                    strokeWidth={2}
                                    dot={{ r: 4 }}
                                    activeDot={{ r: 6 }}
                                />
                            </LineChart>
                        </ChartContainer>
                    </CardContent>
                </Card>
            )}

            {/* Assessment Timeline */}
            {reports && reports.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Assessment Timeline</CardTitle>
                        <CardDescription>Assessment dates - helps track assessment frequency</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {(() => {
                            const sortedReports = [...reports].sort((a, b) => b.createdAt - a.createdAt)
                            const lastAssessment = sortedReports[0]
                            const daysSinceLast = lastAssessment 
                                ? Math.floor((Date.now() - lastAssessment.createdAt) / (1000 * 60 * 60 * 24))
                                : null

                            return (
                                <>
                                    {daysSinceLast !== null && (
                                        <div className={`mb-4 p-3 rounded-lg ${
                                            daysSinceLast > 30 
                                                ? "bg-destructive/10 border border-destructive/20" 
                                                : daysSinceLast > 14 
                                                ? "bg-amber-50 border border-amber-200 dark:bg-amber-950/20 dark:border-amber-800"
                                                : "bg-green-50 border border-green-200 dark:bg-green-950/20 dark:border-green-800"
                                        }`}>
                                            <p className="text-sm font-semibold mb-1">
                                                {daysSinceLast === 0 
                                                    ? "Last assessment was today" 
                                                    : daysSinceLast === 1 
                                                    ? "Last assessment was 1 day ago"
                                                    : `Last assessment was ${daysSinceLast} days ago`}
                                            </p>
                                            {daysSinceLast > 14 && (
                                                <p className="text-xs opacity-80">
                                                    {daysSinceLast > 30 
                                                        ? "Consider scheduling a new assessment soon"
                                                        : "Consider scheduling a new assessment"}
                                                </p>
                                            )}
                                        </div>
                                    )}
                                    <div className="space-y-2 max-h-[400px] overflow-y-auto">
                                        {sortedReports.map((report, idx) => {
                                            const reportDate = new Date(report.createdAt)
                                            const prevDate = idx > 0 
                                                ? new Date(sortedReports[idx - 1].createdAt)
                                                : null
                                            const daysDiff = prevDate 
                                                ? Math.floor((prevDate.getTime() - reportDate.getTime()) / (1000 * 60 * 60 * 24))
                                                : null

                                            return (
                                                <div key={report._id} className="flex items-center justify-between p-2 border rounded hover:bg-accent/50">
                                                    <div>
                                                        <span className="text-sm font-medium">
                                                            {format(reportDate, "MMM d, yyyy 'at' h:mm a")}
                                                        </span>
                                                        {daysDiff !== null && (
                                                            <span className="ml-2 text-xs text-muted-foreground">
                                                                ({daysDiff === 0 ? "same day" : `${daysDiff} day${daysDiff !== 1 ? 's' : ''} since previous`})
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </>
                            )
                        })()}
                    </CardContent>
                </Card>
            )}

            {/* Recent Reports */}
            <Card>
                <CardHeader>
                    <CardTitle>Recent Reports</CardTitle>
                    <CardDescription>Latest evaluation reports</CardDescription>
                </CardHeader>
                <CardContent>
                    {recentReports.length === 0 ? (
                        <p className="text-muted-foreground">No reports yet.</p>
                    ) : (
                        <div className="space-y-4">
                            {recentReports.map((report) => (
                                <div
                                    key={report._id}
                                    className="border rounded-lg p-4 hover:bg-accent cursor-pointer"
                                    onClick={() => navigate(`/therapist/reports/${report._id}`)}
                                >
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="font-semibold">
                                                {format(new Date(report.createdAt), "MMM d, yyyy 'at' h:mm a")}
                                            </p>
                                            <p className="text-sm text-muted-foreground mt-1">
                                                {report.text.substring(0, 100)}...
                                            </p>
                                        </div>
                                        <Button variant="link" size="sm">
                                            View →
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}

