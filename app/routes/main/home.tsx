"use client"

import * as React from "react"
import { useQuery } from "convex/react"
import { api } from "convex/_generated/api"
import { TrendingUp, AlertTriangle, User, FileText, Clock } from "lucide-react"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Cell } from "recharts"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "~/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "~/components/ui/chart"
import UpcomingSessionsTable from "~/components/prox_sesiones_table"
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert"
import { Link } from "react-router"
import { format } from "date-fns"
import { Button } from "~/components/ui/button"
import { ChildName } from "~/components/child-name"

export default function Home() {
    const reports = useQuery(api.report.getAllReports, { limit: 1000 })
    const emotionTrends = useQuery(api.emotions.getEmotionTrends, { days: 7 })

    // Calculate pending evaluations (children without recent reports)
    const children = useQuery(api.therapists.getAllChildren)
    const pendingEvaluationsList = React.useMemo(() => {
        if (!children) return []
        const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
        return children.filter(child => {
            if (!child.lastEvaluationDate) return true
            return child.lastEvaluationDate < sevenDaysAgo
        }).slice(0, 5) // Limit to 5 most recent
    }, [children])

    const latestReportsList = React.useMemo(() => {
        if (!reports) return []
        return reports.slice(0, 5) // Show latest 5 reports
    }, [reports])

    const importantAlertsList = React.useMemo(() => {
        if (!emotionTrends?.alerts) return []
        return emotionTrends.alerts.slice(0, 5) // Show latest 5 alerts
    }, [emotionTrends])

    // Prepare emotion summary bar chart data
    const emotionSummaryData = React.useMemo(() => {
        if (!reports || reports.length === 0) {
            return []
        }

        // Calculate average intensity for each emotion across all reports
        const emotionTotals = {
            anger: [] as number[],
            sadness: [] as number[],
            anxiety: [] as number[],
            fear: [] as number[],
            happiness: [] as number[],
            guilt: [] as number[],
        }

        reports.forEach(report => {
            const emotions = report.emotionData
            if (emotions.anger) emotionTotals.anger.push(emotions.anger)
            if (emotions.sadness) emotionTotals.sadness.push(emotions.sadness)
            if (emotions.anxiety) emotionTotals.anxiety.push(emotions.anxiety)
            if (emotions.fear) emotionTotals.fear.push(emotions.fear)
            if (emotions.happiness) emotionTotals.happiness.push(emotions.happiness)
            if (emotions.guilt) emotionTotals.guilt.push(emotions.guilt)
        })

        const avg = (arr: number[]) => arr.length > 0 
            ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length * 10) / 10 
            : 0

        const getColor = (emotion: string) => {
            const emotionLower = emotion.toLowerCase()
            if (emotionLower === "guilt") return "#9B59B6"
            if (emotionLower === "anger") return "var(--color-chart-1)"
            if (emotionLower === "sadness") return "var(--color-chart-2)"
            if (emotionLower === "anxiety") return "var(--color-chart-3)"
            if (emotionLower === "fear") return "var(--color-chart-4)"
            if (emotionLower === "happiness") return "var(--color-chart-5)"
            return "var(--color-chart-1)"
        }

        return [
            { emotion: "Anger", value: avg(emotionTotals.anger), color: getColor("Anger") },
            { emotion: "Sadness", value: avg(emotionTotals.sadness), color: getColor("Sadness") },
            { emotion: "Anxiety", value: avg(emotionTotals.anxiety), color: getColor("Anxiety") },
            { emotion: "Fear", value: avg(emotionTotals.fear), color: getColor("Fear") },
            { emotion: "Happiness", value: avg(emotionTotals.happiness), color: getColor("Happiness") },
            { emotion: "Guilt", value: avg(emotionTotals.guilt), color: getColor("Guilt") },
        ].filter(item => item.value > 0).sort((a, b) => b.value - a.value)
    }, [reports])

    // Prepare children status overview data
    const childrenStatusData = React.useMemo(() => {
        if (!children || !reports) return []

        // Get latest report per child
        const latestReportsByChild: Record<string, typeof reports[0]> = {}
        reports.forEach(report => {
            const childId = report.childId
            if (!latestReportsByChild[childId] || report.createdAt > latestReportsByChild[childId].createdAt) {
                latestReportsByChild[childId] = report
            }
        })

        // Count reports per child
        const reportCountByChild: Record<string, number> = {}
        reports.forEach(report => {
            const childId = report.childId
            reportCountByChild[childId] = (reportCountByChild[childId] || 0) + 1
        })

        return children.map(child => {
            const latestReport = latestReportsByChild[child._id]
            const reportCount = reportCountByChild[child._id] || 0
            const emotions = latestReport?.emotionData || {}
            
            // Calculate negative emotion score (high is bad)
            const negativeEmotions = [
                emotions.anger || 0,
                emotions.sadness || 0,
                emotions.anxiety || 0,
                emotions.fear || 0,
                emotions.guilt || 0,
            ]
            const negativeScore = negativeEmotions.reduce((a, b) => a + b, 0) / negativeEmotions.length
            const happiness = emotions.happiness || 0

            // Determine status
            let status: "good" | "attention" | "urgent" | "no-data" = "no-data"
            let statusReason = ""
            
            if (!latestReport) {
                status = "attention"
                statusReason = "No evaluations yet"
            } else if (negativeScore >= 7 || happiness <= 2) {
                status = "urgent"
                statusReason = "High negative emotions"
            } else if (negativeScore >= 5 || happiness <= 4) {
                status = "attention"
                statusReason = "Requires follow-up"
            } else {
                status = "good"
                statusReason = "Stable progress"
            }

            return {
                childId: child._id,
                name: `${child.firstName} ${child.lastName}`,
                status,
                statusReason,
                negativeScore: Math.round(negativeScore * 10) / 10,
                happiness: Math.round(happiness * 10) / 10,
                reportCount,
                lastAssessmentDate: latestReport?.createdAt,
            }
        }).filter(childStatus => childStatus.childId) // Filter out any children without valid IDs
        .sort((a, b) => {
            // Sort by status priority (urgent > attention > good > no-data)
            const priority: Record<typeof a.status, number> = { urgent: 0, attention: 1, good: 2, "no-data": 3 }
            return priority[a.status] - priority[b.status]
        })
    }, [children, reports])

    const chartConfig = React.useMemo(() => ({
        anger: { label: "Anger", color: "var(--color-chart-1)" },
        sadness: { label: "Sadness", color: "var(--color-chart-2)" },
        anxiety: { label: "Anxiety", color: "var(--color-chart-3)" },
        fear: { label: "Fear", color: "var(--color-chart-4)" },
        happiness: { label: "Happiness", color: "var(--color-chart-5)" },
        guilt: { label: "Guilt", color: "#9B59B6" }, // Purple color distinct from anger
    } satisfies ChartConfig), [])

    const emotionSummaryConfig = React.useMemo(() => ({
        value: { label: "Average Intensity" },
        ...chartConfig,
    } satisfies ChartConfig), [chartConfig])

    const chartTooltip = React.useMemo(() => <ChartTooltipContent indicator="dot" />, [])

    return (
        <div className="flex flex-col gap-6 p-6">
            {/* Alerts */}
            {importantAlertsList.length > 0 && emotionTrends?.alerts && emotionTrends.alerts.length > 0 && (
                <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Important Alerts</AlertTitle>
                    <AlertDescription>
                        System alerts for concerning emotion patterns detected in recent assessments
                        <ul className="list-disc list-inside mt-2">
                            {emotionTrends.alerts.slice(0, 3).map((alert, index) => (
                                <li key={index}>{alert}</li>
                            ))}
                        </ul>
                    </AlertDescription>
                </Alert>
            )}

            {/* Top summary cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Pending Evaluations */}
                <Card className="bg-secondary-background text-foreground">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <User className="h-5 w-5" />
                            Pending Evaluations
                        </CardTitle>
                        <CardDescription>
                            {pendingEvaluationsList.length} {pendingEvaluationsList.length === 1 ? 'child needs' : 'children need'} evaluation
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {pendingEvaluationsList.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-4">
                                No pending evaluations
                            </p>
                        ) : (
                            <div className="space-y-2">
                                {pendingEvaluationsList.map((child) => (
                                    <Link
                                        key={child._id}
                                        to={`/therapist/children/${child._id}`}
                                        className="block p-2 rounded-md hover:bg-muted transition-colors"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="font-medium text-sm">
                                                    {child.firstName} {child.lastName}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    {child.lastEvaluationDate
                                                        ? `Last: ${format(new Date(child.lastEvaluationDate), "MMM d, yyyy")}`
                                                        : "No evaluations"}
                                                </p>
                                            </div>
                                            <Button variant="neutral" size="sm" className="h-8">
                                                View
                                            </Button>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Latest Reports */}
                <Card className="bg-secondary-background text-foreground">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FileText className="h-5 w-5" />
                            Latest Reports
                        </CardTitle>
                        <CardDescription>
                            {latestReportsList.length} {latestReportsList.length === 1 ? 'recent report' : 'recent reports'}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {latestReportsList.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-4">
                                No reports available
                            </p>
                        ) : (
                            <div className="space-y-2">
                                {latestReportsList.map((report) => (
                                    <Link
                                        key={report._id}
                                        to={`/therapist/reports/${report._id}`}
                                        className="block p-2 rounded-md hover:bg-muted transition-colors"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-sm">
                                                    {report.childId ? (
                                                        <ChildName childId={report.childId} />
                                                    ) : (
                                                        `Report #${report._id.slice(-6)}`
                                                    )}
                                                </p>
                                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                    <Clock className="h-3 w-3" />
                                                    {format(new Date(report.createdAt), "MMM d, yyyy HH:mm")}
                                                </div>
                                            </div>
                                            <Button variant="neutral" size="sm" className="h-8 ml-2">
                                                View
                                            </Button>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Important Alerts */}
                <Card className="bg-secondary-background text-foreground">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-destructive" />
                            Important Alerts
                        </CardTitle>
                        <CardDescription>
                            System alerts for concerning emotion patterns detected in recent assessments
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {importantAlertsList.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-4">
                                No important alerts
                            </p>
                        ) : (
                            <div className="space-y-2">
                                {importantAlertsList.map((alert, index) => (
                                    <div
                                        key={index}
                                        className="p-2 rounded-md bg-destructive/10 border border-destructive/20"
                                    >
                                        <p className="text-sm text-foreground">{alert}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card className="bg-secondary-background text-foreground">
                    <CardHeader>
                        <CardTitle>Emotion Summary</CardTitle>
                        <CardDescription>Average emotion intensities across all assessments</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {emotionSummaryData.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-8">
                                No assessment data available
                            </p>
                        ) : (
                            <ChartContainer config={emotionSummaryConfig} className="h-[300px] w-full">
                                <BarChart data={emotionSummaryData} layout="vertical">
                                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                                    <XAxis type="number" domain={[0, 5]} axisLine={false} tickLine={false} />
                                    <YAxis 
                                        type="category" 
                                        dataKey="emotion" 
                                        axisLine={false} 
                                        tickLine={false}
                                        width={80}
                                    />
                                    <ChartTooltip content={chartTooltip} />
                                    <Bar 
                                        dataKey="value" 
                                        radius={[0, 8, 8, 0]}
                                    >
                                        {emotionSummaryData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ChartContainer>
                        )}
                    </CardContent>
                </Card>

                <Card className="bg-secondary-background text-foreground">
                    <CardHeader>
                        <CardTitle>Children Status</CardTitle>
                        <CardDescription>Overview of who needs attention based on their recent assessments</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {childrenStatusData.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-8">
                                No children data available
                            </p>
                        ) : (
                            <div className="space-y-3 max-h-[300px] overflow-y-auto">
                                {childrenStatusData.map((childStatus) => {
                                    const statusColors = {
                                        urgent: "border-destructive bg-destructive/10",
                                        attention: "border-orange-500 bg-orange-500/10",
                                        good: "border-green-500 bg-green-500/10",
                                        "no-data": "border-muted bg-muted/10",
                                    }
                                    const statusLabels = {
                                        urgent: "Urgent",
                                        attention: "Attention",
                                        good: "Good",
                                        "no-data": "No Data",
                                    }

                                    return (
                                        <Link
                                            key={childStatus.childId}
                                            to={childStatus.childId ? `/therapist/children/${childStatus.childId}` : '#'}
                                            className={`block p-3 rounded-lg border-2 transition-all hover:shadow-md ${statusColors[childStatus.status]}`}
                                            onClick={(e) => {
                                                if (!childStatus.childId) {
                                                    e.preventDefault();
                                                }
                                            }}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <p className="font-semibold text-sm truncate">
                                                            {childStatus.name}
                                                        </p>
                                                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                                                            childStatus.status === "urgent" ? "bg-destructive text-destructive-foreground" :
                                                            childStatus.status === "attention" ? "bg-orange-500 text-white" :
                                                            childStatus.status === "good" ? "bg-green-500 text-white" :
                                                            "bg-muted text-muted-foreground"
                                                        }`}>
                                                            {statusLabels[childStatus.status]}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-muted-foreground mt-1">
                                                        {childStatus.statusReason}
                                                    </p>
                                                    <div className="flex items-center gap-4 mt-2 text-xs">
                                                        {childStatus.lastAssessmentDate && (
                                                            <span className="text-muted-foreground">
                                                                Last: {format(new Date(childStatus.lastAssessmentDate), "MMM d, yyyy")}
                                                            </span>
                                                        )}
                                                        <span className="text-muted-foreground">
                                                            {childStatus.reportCount} {childStatus.reportCount === 1 ? "assessment" : "assessments"}
                                                        </span>
                                                        {childStatus.status !== "no-data" && (
                                                            <span className="text-muted-foreground">
                                                                Happiness: {childStatus.happiness.toFixed(1)}/5
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                <Button variant="ghost" size="sm" className="ml-2">
                                                    View →
                                                </Button>
                                            </div>
                                        </Link>
                                    )
                                })}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Upcoming sessions table */}
            <Card className="bg-secondary-background text-foreground">
                <CardHeader>
                    <CardTitle>Upcoming Sessions</CardTitle>
                </CardHeader>
                <CardContent className="overflow-x-auto">
                    <UpcomingSessionsTable />
                </CardContent>
            </Card>
        </div>
    )
}
