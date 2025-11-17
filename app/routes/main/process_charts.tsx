"use client"

import * as React from "react"
import { useQuery } from "convex/react"
import { api } from "convex/_generated/api"
import type { Id } from "convex/_generated/dataModel"
import { Bar, BarChart, CartesianGrid, XAxis, Pie, PieChart, Line, LineChart, YAxis, Cell } from "recharts"
import { Check, ChevronsUpDown, AlertTriangle, TrendingUp, TrendingDown } from "lucide-react"
import { format } from "date-fns"

import { cn } from "~/lib/utils"
import { Button } from "~/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card"
import { Checkbox } from "~/components/ui/checkbox"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "~/components/ui/command"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "~/components/ui/popover"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "~/components/ui/select"
import {
    type ChartConfig,
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
    ChartLegend,
    ChartLegendContent,
} from "~/components/ui/chart"
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert"

type EmotionType = "anger" | "sadness" | "anxiety" | "fear" | "happiness" | "guilt"

const chartConfig = {
    anger: { label: "Anger", color: "var(--color-chart-1)" },
    sadness: { label: "Sadness", color: "var(--color-chart-2)" },
    anxiety: { label: "Anxiety", color: "var(--color-chart-3)" },
    fear: { label: "Fear", color: "var(--color-chart-4)" },
    happiness: { label: "Happiness", color: "var(--color-chart-5)" },
    guilt: { label: "Guilt", color: "#9B59B6" }, // Purple color distinct from anger
} satisfies ChartConfig

export default function ProcessChartsView() {
    const children = useQuery(api.therapists.getAllChildren)
    const [selectedChild, setSelectedChild] = React.useState<string>("All")
    const [dateRange, setDateRange] = React.useState("30")
    const [selectedEmotions, setSelectedEmotions] = React.useState<Record<EmotionType, boolean>>({
        anger: true,
        sadness: true,
        anxiety: true,
        fear: true,
        happiness: true,
        guilt: true,
    })

    const childId = selectedChild === "All" ? undefined : (selectedChild as Id<"kids">)
    const days = Number.parseInt(dateRange)
    
    // Memoize date values to prevent infinite re-renders
    const dateRangeMemo = React.useMemo(() => {
        const endDate = Date.now()
        const startDate = endDate - (days * 24 * 60 * 60 * 1000)
        return { startDate, endDate }
    }, [days])

    const emotionData = useQuery(api.emotions.getEmotionData, {
        childId,
        startDate: dateRangeMemo.startDate,
        endDate: dateRangeMemo.endDate,
    })

    const emotionTrends = useQuery(api.emotions.getEmotionTrends, {
        childId,
        days,
    })

    const childrenList = React.useMemo(() => {
        if (!children) return [{ value: "All", label: "All Children" }]
        return [
            { value: "All", label: "All Children" },
            ...children.map(child => ({
                value: child._id,
                label: `${child.firstName} ${child.lastName}`,
            })),
        ]
    }, [children])

    // Get reports for assessment progress and insights
    const reports = useQuery(api.report.getAllReports, {
        childId,
        limit: 1000,
    })

    // Prepare assessment-sequence-based chart data
    const assessmentProgressData = React.useMemo(() => {
        if (!reports || reports.length === 0) {
            return []
        }

        // Group reports by child and sort by creation date to determine assessment sequence
        const reportsByChild: Record<string, typeof reports> = {}
        reports.forEach(report => {
            const reportChildId = report.childId
            if (!reportsByChild[reportChildId]) {
                reportsByChild[reportChildId] = []
            }
            reportsByChild[reportChildId].push(report)
        })

        // Sort reports by child by creation date to get sequence numbers
        Object.keys(reportsByChild).forEach(reportChildId => {
            reportsByChild[reportChildId].sort((a, b) => a.createdAt - b.createdAt)
        })

        // Group by assessment sequence number (1st, 2nd, 3rd, etc.)
        const sequenceMap: Record<number, Record<EmotionType, number[]>> = {}

        Object.values(reportsByChild).forEach(childReports => {
            childReports.forEach((report, index) => {
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
        })

        // Convert to array format with averages
        const sequenceNumbers = Object.keys(sequenceMap).map(Number)
        if (sequenceNumbers.length === 0) {
            return []
        }
        
        const maxSequence = Math.max(...sequenceNumbers)
        const result = []
        
        for (let i = 1; i <= Math.min(maxSequence, 10); i++) { // Limit to first 10 assessments
            const data = sequenceMap[i]
            if (!data) continue

            const avg = (arr: number[]) => arr.length > 0 
                ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length * 10) / 10 
                : 0

            const entry: any = {
                assessment: `#${i}`,
            }

            // Only include selected emotions
            Object.keys(selectedEmotions).forEach(emotion => {
                if (selectedEmotions[emotion as EmotionType]) {
                    entry[emotion] = avg(data[emotion as EmotionType])
                }
            })

            result.push(entry)
        }

        return result
    }, [reports, selectedEmotions])

    // Filter and transform data for charts
    const { pieChartData, barChartData } = React.useMemo(() => {
        if (!emotionData || emotionData.length === 0) {
            return { pieChartData: [], barChartData: [] }
        }

        // Pie chart data - total distribution
        const emotionTotals: Record<EmotionType, number> = {
            anger: 0,
            sadness: 0,
            anxiety: 0,
            fear: 0,
            happiness: 0,
            guilt: 0,
        }

        emotionData.forEach(d => {
            Object.keys(emotionTotals).forEach(emotion => {
                if (selectedEmotions[emotion as EmotionType]) {
                    emotionTotals[emotion as EmotionType] += d[emotion as EmotionType] || 0
                }
            })
        })

        const pieData = Object.entries(emotionTotals)
            .filter(([emotion]) => selectedEmotions[emotion as EmotionType])
            .map(([emotion, value], index) => ({
                name: emotion, // Use emotion key for config lookup
                label: chartConfig[emotion as EmotionType].label, // Display label
                value: Math.round(value),
                fill: chartConfig[emotion as EmotionType].color,
            }))
            .filter(item => item.value > 0)

        // Bar chart data - average by emotion
        const barData = Object.entries(emotionTotals)
            .filter(([emotion]) => selectedEmotions[emotion as EmotionType])
            .map(([emotion, total]) => {
                const count = emotionData.filter(d => d[emotion as EmotionType] !== undefined).length
                return {
                    emotion: emotion,
                    emotionLabel: chartConfig[emotion as EmotionType].label,
                    average: count > 0 ? Math.round((total / count) * 10) / 10 : 0,
                    fill: chartConfig[emotion as EmotionType].color,
                }
            })
            .filter(item => item.average > 0)

        return { pieChartData: pieData, barChartData: barData }
    }, [emotionData, selectedEmotions])

    // Get selected child name for insights
    const selectedChildName = React.useMemo(() => {
        if (selectedChild === "All" || !children) return null
        const child = children.find(c => c._id === selectedChild)
        return child ? `${child.firstName} ${child.lastName}` : null
    }, [selectedChild, children])

    // Generate insights
    const insights = React.useMemo(() => {
        if (!emotionTrends || !emotionData || emotionData.length === 0) {
            const noDataMessage = selectedChildName 
                ? `No data available for ${selectedChildName} for the selected period.`
                : "No data available for the selected period."
            return {
                trends: [],
                alerts: [],
                summary: noDataMessage,
                assessmentFrequency: "",
                riskPatterns: [],
            }
        }

        const insightsList: string[] = []
        const alerts: string[] = []
        const riskPatterns: string[] = []
        const childPrefix = selectedChildName ? `${selectedChildName}: ` : ""

        // Trend insights - based on assessment sequence (same as chart)
        // Calculate trends from assessment sequence data
        if (assessmentProgressData.length >= 2) {
            const emotions: EmotionType[] = ["anger", "sadness", "anxiety", "fear", "happiness", "guilt"]
            
            emotions.forEach(emotion => {
                if (!selectedEmotions[emotion]) return
                
                const values = assessmentProgressData
                    .map(d => d[emotion])
                    .filter((v): v is number => v !== undefined && v > 0)
                
                if (values.length < 2) return
                
                // Compare first half vs second half of assessments
                const midpoint = Math.floor(values.length / 2)
                const firstHalf = values.slice(0, midpoint)
                const secondHalf = values.slice(midpoint)
                
                const avgFirst = firstHalf.reduce((sum, v) => sum + v, 0) / firstHalf.length
                const avgSecond = secondHalf.reduce((sum, v) => sum + v, 0) / secondHalf.length
                
                // Calculate percentage change
                const change = avgFirst > 0 ? ((avgSecond - avgFirst) / avgFirst) * 100 : 0
                const changeRounded = Math.round(change * 10) / 10
                
                const emotionLabel = chartConfig[emotion].label
                
                // Only show significant changes (>5% threshold)
                if (change > 5) {
                    // High concern for negative emotions increasing
                    if (["anger", "sadness", "anxiety", "fear", "guilt"].includes(emotion)) {
                        insightsList.push(
                            `${childPrefix}${emotionLabel} is increasing significantly (+${changeRounded}% change across assessments). Consider intervention.`
                        )
                    } else {
                        insightsList.push(
                            `${childPrefix}${emotionLabel} shows improvement (+${changeRounded}% change across assessments).`
                        )
                    }
                } else if (change < -5) {
                    // Good if negative emotions decreasing, concerning if happiness decreasing
                    if (emotion === "happiness") {
                        insightsList.push(
                            `${childPrefix}${emotionLabel} is decreasing (${changeRounded}% change across assessments). Monitor closely.`
                        )
                    } else {
                        insightsList.push(
                            `${childPrefix}${emotionLabel} is decreasing, which is positive progress (${changeRounded}% change across assessments).`
                        )
                    }
                }
            })
        }

        // Assessment frequency insights
        let assessmentFrequency = ""
        if (reports) {
            const reportCount = reports.length
            const daysDiff = days
            const avgFrequency = reportCount / (daysDiff / 7) // reports per week
            
            const freqPrefix = selectedChildName ? `${selectedChildName} - ` : ""
            if (avgFrequency < 0.5) {
                assessmentFrequency = `${freqPrefix}Low assessment frequency (${reportCount} assessment${reportCount !== 1 ? 's' : ''} in ${daysDiff} days). Consider more regular evaluations.`
            } else if (avgFrequency >= 2) {
                assessmentFrequency = `${freqPrefix}Frequent assessments (${reportCount} assessment${reportCount !== 1 ? 's' : ''} in ${daysDiff} days). Good monitoring coverage.`
            } else {
                assessmentFrequency = `${freqPrefix}Moderate assessment frequency (${reportCount} assessment${reportCount !== 1 ? 's' : ''} in ${daysDiff} days).`
            }
        }

        // High-risk patterns
        const totalObservations = emotionData.length
        const avgHappiness = emotionData.reduce((sum, d) => sum + (d.happiness || 0), 0) / totalObservations
        const avgNegative = emotionData.reduce((sum, d) => 
            sum + (d.anger || 0) + (d.sadness || 0) + (d.anxiety || 0) + (d.fear || 0) + (d.guilt || 0), 0
        ) / (totalObservations * 5)

        // Check recent vs earlier data for worsening patterns
        if (emotionData.length >= 4) {
            const midpoint = Math.floor(emotionData.length / 2)
            const recentData = emotionData.slice(midpoint)
            const earlierData = emotionData.slice(0, midpoint)
            
            const recentHappiness = recentData.reduce((sum, d) => sum + (d.happiness || 0), 0) / recentData.length
            const earlierHappiness = earlierData.reduce((sum, d) => sum + (d.happiness || 0), 0) / earlierData.length
            
            if (recentHappiness < earlierHappiness - 2) {
                riskPatterns.push(`${childPrefix}Happiness has declined in recent assessments compared to earlier period.`)
            }
            
            const recentNegative = recentData.reduce((sum, d) => 
                sum + (d.anger || 0) + (d.sadness || 0) + (d.anxiety || 0) + (d.fear || 0) + (d.guilt || 0), 0
            ) / (recentData.length * 5)
            const earlierNegative = earlierData.reduce((sum, d) => 
                sum + (d.anger || 0) + (d.sadness || 0) + (d.anxiety || 0) + (d.fear || 0) + (d.guilt || 0), 0
            ) / (earlierData.length * 5)
            
            if (recentNegative > earlierNegative + 1.5) {
                riskPatterns.push(`${childPrefix}Negative emotions have increased in recent assessments. Intervention may be needed.`)
            }
        }

        // Alerts
        if (emotionTrends.alerts && emotionTrends.alerts.length > 0) {
            alerts.push(...emotionTrends.alerts)
        }

        // Summary statistics
        const subjectText = selectedChildName ? `${selectedChildName}: ` : ""
        let summary = `${subjectText}Analyzed ${totalObservations} data point${totalObservations !== 1 ? 's' : ''} over the selected ${days} day period. `
        if (avgHappiness > 3) {
            summary += selectedChildName ? "Overall emotional well-being appears positive. " : "Overall emotional well-being appears positive across all children. "
        } else if (avgHappiness < 2) {
            summary += selectedChildName ? "Overall emotional well-being needs attention. " : "Overall emotional well-being needs attention across children. "
        } else {
            summary += selectedChildName ? "Overall emotional state is moderate. " : "Overall emotional state is moderate across children. "
        }
        if (avgNegative > 2.5) {
            summary += selectedChildName ? "Negative emotions are elevated and may require intervention. " : "Negative emotions are elevated and may require intervention across some children. "
        } else if (avgNegative < 1.5) {
            summary += selectedChildName ? "Negative emotions are well-managed. " : "Negative emotions are well-managed across children. "
        }

        return {
            trends: insightsList,
            alerts,
            summary,
            assessmentFrequency,
            riskPatterns,
        }
    }, [emotionTrends, emotionData, reports, days, selectedChildName])

    const handleEmotionChange = (emotion: EmotionType) => {
        setSelectedEmotions(prev => ({ ...prev, [emotion]: !prev[emotion] }))
    }

    return (
        <div className="flex flex-col gap-6 p-6 font-base">
            {/* Filters */}
            <div className="flex flex-wrap items-center gap-4">
                <ChildSelector 
                    selectedChild={selectedChild} 
                    onSelectChild={setSelectedChild}
                    childrenList={childrenList}
                />

                <Select value={dateRange} onValueChange={setDateRange}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Select Date Range" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="7">Last 7 Days</SelectItem>
                        <SelectItem value="30">Last Month</SelectItem>
                        <SelectItem value="90">Last 3 Months</SelectItem>
                        <SelectItem value="180">Last 6 Months</SelectItem>
                    </SelectContent>
                </Select>

                <div className="flex items-center gap-4 ml-auto">
                    {Object.keys(selectedEmotions).map((emotion) => (
                        <div key={emotion} className="flex items-center space-x-2">
                            <Checkbox
                                id={emotion}
                                checked={selectedEmotions[emotion as EmotionType]}
                                onCheckedChange={() => handleEmotionChange(emotion as EmotionType)}
                            />
                            <label
                                htmlFor={emotion}
                                className="text-sm font-medium capitalize leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                                {chartConfig[emotion as EmotionType].label}
                            </label>
                        </div>
                    ))}
                </div>
            </div>

            {/* Alerts */}
            {insights.alerts.length > 0 && (
                <Alert variant="warning">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Important Alerts</AlertTitle>
                    <AlertDescription>
                        System alerts for concerning emotion patterns detected in recent assessments
                        <ul className="list-disc list-inside mt-2">
                            {insights.alerts.map((alert, index) => (
                                <li key={index}>{alert}</li>
                            ))}
                        </ul>
                    </AlertDescription>
                </Alert>
            )}

            {/* Charts */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                {/* Assessment Progress Line Chart */}
                <Card className="bg-secondary-background text-foreground lg:col-span-2">
                    <CardHeader>
                        <CardTitle>Emotion Progress by Assessment</CardTitle>
                        <CardDescription>
                            {selectedChild === "All" 
                                ? "Average emotion trends across sequential assessments" 
                                : "Emotion trends across sequential assessments for selected child"}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {assessmentProgressData.length > 0 ? (
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
                                    {Object.keys(selectedEmotions).map((emotion) => {
                                        if (!selectedEmotions[emotion as EmotionType]) return null
                                        const emotionConfig = chartConfig[emotion as EmotionType]
                                        return (
                                            <Line
                                                key={emotion}
                                                type="monotone"
                                                dataKey={emotion}
                                                stroke={emotionConfig.color}
                                                strokeWidth={2}
                                                dot={{ r: 4 }}
                                                activeDot={{ r: 6 }}
                                            />
                                        )
                                    })}
                                </LineChart>
                            </ChartContainer>
                        ) : (
                            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                                No assessment data available
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Pie Chart */}
                <Card className="bg-secondary-background text-foreground">
                    <CardHeader>
                        <CardTitle>Emotion Distribution</CardTitle>
                        <CardDescription>Overall emotional breakdown</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {pieChartData.length > 0 ? (
                            <ChartContainer config={chartConfig} className="mx-auto aspect-square max-h-[300px]">
                                <PieChart>
                                    <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                                    <ChartLegend 
                                        content={
                                            <ChartLegendContent 
                                                nameKey="name" 
                                                className="flex-wrap gap-2 px-2"
                                            />
                                        } 
                                    />
                                    <Pie 
                                        data={pieChartData} 
                                        dataKey="value" 
                                        nameKey="name" 
                                        labelKey="label"
                                        innerRadius={50}
                                        outerRadius={100}
                                    >
                                        {pieChartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.fill} />
                                        ))}
                                    </Pie>
                                </PieChart>
                            </ChartContainer>
                        ) : (
                            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                                No data available
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Assessment Timeline */}
            <Card className="bg-secondary-background text-foreground">
                <CardHeader>
                    <CardTitle>Assessment Timeline</CardTitle>
                    <CardDescription>
                        {selectedChild === "All" 
                            ? "Assessment dates by child - helps identify who needs a new assessment"
                            : "Assessment dates - helps track assessment frequency"}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {reports && reports.length > 0 ? (
                        <div className="space-y-4 max-h-[400px] overflow-y-auto">
                            {selectedChild === "All" ? (
                                // Group by child for "All" view
                                (() => {
                                    const reportsByChild: Record<string, typeof reports> = {}
                                    reports.forEach(report => {
                                        const childId = report.childId
                                        if (!reportsByChild[childId]) {
                                            reportsByChild[childId] = []
                                        }
                                        reportsByChild[childId].push(report)
                                    })

                                    // First, process all children data
                                    const childrenData = Object.entries(reportsByChild)
                                        .map(([childId, childReports]) => {
                                            const child = children?.find(c => c._id === childId)
                                            const childName = child 
                                                ? `${child.firstName} ${child.lastName}` 
                                                : "Unknown Child"
                                            
                                            const sortedReports = [...childReports].sort((a, b) => b.createdAt - a.createdAt)
                                            const lastAssessment = sortedReports[0]
                                            const daysSinceLast = lastAssessment 
                                                ? Math.floor((Date.now() - lastAssessment.createdAt) / (1000 * 60 * 60 * 24))
                                                : null

                                            return {
                                                childId,
                                                childName,
                                                sortedReports,
                                                daysSinceLast,
                                            }
                                        })
                                        .sort((a, b) => {
                                            // Sort by days since last assessment (urgent first)
                                            if (a.daysSinceLast === null) return 1
                                            if (b.daysSinceLast === null) return -1
                                            return b.daysSinceLast - a.daysSinceLast
                                        })

                                    // Then render
                                    return childrenData.map(({ childId, childName, sortedReports, daysSinceLast }) => (
                                        <div key={childId} className="border rounded-lg p-4">
                                            <div className="flex items-center justify-between mb-2">
                                                <h4 className="font-semibold">{childName}</h4>
                                                {daysSinceLast !== null && (
                                                    <span className={`text-xs px-2 py-1 rounded-full ${
                                                        daysSinceLast > 30 
                                                            ? "bg-destructive/10 text-destructive" 
                                                            : daysSinceLast > 14 
                                                            ? "bg-amber-50 text-amber-900 dark:bg-amber-950/20 dark:text-amber-100"
                                                            : "bg-green-50 text-green-900 dark:bg-green-950/20 dark:text-green-100"
                                                    }`}>
                                                        {daysSinceLast === 0 
                                                            ? "Today" 
                                                            : daysSinceLast === 1 
                                                            ? "1 day ago"
                                                            : `${daysSinceLast} days ago`}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="space-y-1">
                                                {sortedReports.slice(0, 5).map((report, idx) => {
                                                    const reportDate = new Date(report.createdAt)
                                                    const prevDate = idx > 0 
                                                        ? new Date(sortedReports[idx - 1].createdAt)
                                                        : null
                                                    const daysDiff = prevDate 
                                                        ? Math.floor((prevDate.getTime() - reportDate.getTime()) / (1000 * 60 * 60 * 24))
                                                        : null

                                                    return (
                                                        <div key={report._id} className="flex items-center justify-between text-sm">
                                                            <span className="text-muted-foreground">
                                                                {format(reportDate, "MMM d, yyyy")}
                                                                {daysDiff !== null && (
                                                                    <span className="ml-2 text-xs opacity-70">
                                                                        ({daysDiff === 0 ? "same day" : `${daysDiff} day${daysDiff !== 1 ? 's' : ''} gap`})
                                                                    </span>
                                                                )}
                                                            </span>
                                                        </div>
                                                    )
                                                })}
                                                {sortedReports.length > 5 && (
                                                    <p className="text-xs text-muted-foreground mt-1">
                                                        + {sortedReports.length - 5} more assessment{sortedReports.length - 5 !== 1 ? 's' : ''}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                })()
                            ) : (
                                // Single child view
                                (() => {
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
                                            <div className="space-y-2">
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
                                })()
                            )}
                        </div>
                    ) : (
                        <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                            No assessments available
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Assessment Sequence Comparison - Grouped Bar Chart */}
            <Card className="bg-secondary-background text-foreground">
                <CardHeader>
                    <CardTitle>Emotion Comparison by Assessment Sequence</CardTitle>
                    <CardDescription>
                        Average emotion intensities at each assessment position
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {assessmentProgressData.length > 0 ? (
                        <ChartContainer config={chartConfig} className="h-[300px] w-full">
                            <BarChart data={assessmentProgressData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis 
                                    dataKey="assessment" 
                                    tickLine={false} 
                                    axisLine={false}
                                    tickFormatter={(value) => value.replace('#', 'Assessment ')}
                                />
                                <YAxis domain={[0, 10]} />
                                <ChartTooltip content={<ChartTooltipContent indicator="dot" />} />
                                <ChartLegend content={<ChartLegendContent />} />
                                {Object.keys(selectedEmotions).map((emotion) => {
                                    if (!selectedEmotions[emotion as EmotionType]) return null
                                    const emotionConfig = chartConfig[emotion as EmotionType]
                                    return (
                                        <Bar
                                            key={emotion}
                                            dataKey={emotion}
                                            fill={emotionConfig.color}
                                            radius={[4, 4, 0, 0]}
                                        />
                                    )
                                })}
                            </BarChart>
                        </ChartContainer>
                    ) : (
                        <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                            No assessment data available
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Average Emotion Intensity Bar Chart */}
            <Card className="bg-secondary-background text-foreground">
                <CardHeader>
                    <CardTitle>Average Emotion Intensity</CardTitle>
                    <CardDescription>Overall average intensity levels for selected emotions</CardDescription>
                </CardHeader>
                <CardContent>
                    {barChartData.length > 0 ? (
                        <ChartContainer config={chartConfig} className="h-[250px] w-full">
                            <BarChart
                                data={barChartData}
                                layout="vertical"
                                margin={{ left: 10, right: 10 }}
                            >
                                <CartesianGrid horizontal={false} />
                                <XAxis type="number" domain={[0, 5]} hide />
                                <YAxis
                                    dataKey="emotionLabel"
                                    type="category"
                                    tickLine={false}
                                    axisLine={false}
                                    tickMargin={5}
                                    tick={{ fill: "var(--foreground)" }}
                                />
                                <ChartTooltip
                                    cursor={false}
                                    content={<ChartTooltipContent indicator="dot" />}
                                />
                                <Bar dataKey="average" radius={5}>
                                    {barChartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.fill} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ChartContainer>
                    ) : (
                        <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                            No data available
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Insights Panel */}
            <Card className="bg-secondary-background text-foreground">
                <CardHeader>
                    <CardTitle>Insights & Analysis</CardTitle>
                    <CardDescription>Key highlights and actionable insights from the selected data</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div>
                            <h4 className="font-semibold mb-2">Summary</h4>
                            <p className="text-sm">{insights.summary}</p>
                        </div>

                        {insights.assessmentFrequency && (
                            <div>
                                <h4 className="font-semibold mb-2">Assessment Frequency</h4>
                                <p className="text-sm">{insights.assessmentFrequency}</p>
                            </div>
                        )}

                        {insights.riskPatterns.length > 0 && (
                            <div>
                                <h4 className="font-semibold mb-2 flex items-center gap-2">
                                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                                    Risk Patterns
                                </h4>
                                <ul className="space-y-1 list-disc list-inside text-sm">
                                    {insights.riskPatterns.map((pattern, index) => (
                                        <li key={index} className="text-amber-900 dark:text-amber-100">{pattern}</li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {insights.trends.length > 0 && (
                            <div>
                                <h4 className="font-semibold mb-2 flex items-center gap-2">
                                    <TrendingUp className="h-4 w-4" />
                                    Emotional Trends
                                </h4>
                                <ul className="space-y-1 list-disc list-inside text-sm">
                                    {insights.trends.map((trend, index) => (
                                        <li key={index}>{trend}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

function ChildSelector({ 
    selectedChild, 
    onSelectChild,
    childrenList 
}: { 
    selectedChild: string
    onSelectChild: (value: string) => void
    childrenList: Array<{ value: string; label: string }>
}) {
    const [open, setOpen] = React.useState(false)

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="neutral"
                    role="combobox"
                    aria-expanded={open}
                    className="w-[200px] justify-between"
                >
                    {childrenList.find((child) => child.value === selectedChild)?.label || "Select child..."}
                    <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-0">
                <Command>
                    <CommandInput placeholder="Search child..." />
                    <CommandList>
                        <CommandEmpty>No child found.</CommandEmpty>
                        <CommandGroup>
                            {childrenList.map((child) => (
                                <CommandItem
                                    key={child.value}
                                    value={child.value}
                                    onSelect={(currentValue) => {
                                        onSelectChild(currentValue === selectedChild ? "All" : currentValue)
                                        setOpen(false)
                                    }}
                                >
                                    <Check
                                        className={cn(
                                            "mr-2 h-4 w-4",
                                            selectedChild === child.value ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                    {child.label}
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    )
}
