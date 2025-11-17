"use client"

import * as React from "react"
import { useQuery } from "convex/react"
import { api } from "convex/_generated/api"
import { useNavigate, useSearchParams } from "react-router"
import type { Id } from "convex/_generated/dataModel"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card"
import { Button } from "~/components/ui/button"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "~/components/ui/select"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, Bar, BarChart, Pie, PieChart, Cell } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "~/components/ui/chart"
import { format } from "date-fns"
import { Check, ChevronsUpDown } from "lucide-react"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "~/components/ui/popover"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "~/components/ui/command"
import { cn } from "~/lib/utils"

const chartConfig = {
    anger: { label: "Anger", color: "var(--color-chart-1)" },
    sadness: { label: "Sadness", color: "var(--color-chart-2)" },
    anxiety: { label: "Anxiety", color: "var(--color-chart-3)" },
    fear: { label: "Fear", color: "var(--color-chart-4)" },
    happiness: { label: "Happiness", color: "var(--color-chart-5)" },
    guilt: { label: "Guilt", color: "var(--color-chart-1)" },
} satisfies ChartConfig

export default function ProgressPage() {
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const childIdFromUrl = searchParams.get("childId")

    const children = useQuery(api.parents.getParentChildren)
    const [selectedChild, setSelectedChild] = React.useState<string>(
        childIdFromUrl || "All"
    )

    const childId = selectedChild === "All" ? undefined : (selectedChild as Id<"kids">)
    const days = 30
    const endDate = Date.now()
    const startDate = endDate - (days * 24 * 60 * 60 * 1000)

    const emotionData = useQuery(api.parents.getParentEmotionData, {
        childId,
        startDate,
        endDate,
    })

    const reports = useQuery(api.parents.getParentReports, {
        childId,
        limit: 10,
    })

    const recommendations = useQuery(api.parents.getDailyRecommendations, {
        childId,
    })

    const childrenList = React.useMemo(() => {
        if (!children) return [{ value: "All", label: "All Children" }]
        return [
            { value: "All", label: "All Children" },
            ...children.map((child) => ({
                value: child._id,
                label: `${child.firstName} ${child.lastName}`,
            })),
        ]
    }, [children])

    // Prepare chart data
    const { areaChartData, pieChartData, barChartData } = React.useMemo(() => {
        if (!emotionData || emotionData.length === 0) {
            return { areaChartData: [], pieChartData: [], barChartData: [] }
        }

        // Area chart - emotion trends over time
        const areaData = emotionData.map((d) => ({
            date: new Date(d.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
            happiness: d.happiness || 0,
            sadness: d.sadness || 0,
            anxiety: d.anxiety || 0,
        }))

        // Pie chart - total distribution
        const emotionTotals: Record<string, number> = {
            anger: 0,
            sadness: 0,
            anxiety: 0,
            fear: 0,
            happiness: 0,
            guilt: 0,
        }

        emotionData.forEach((d) => {
            Object.keys(emotionTotals).forEach((emotion) => {
                emotionTotals[emotion] += d[emotion as keyof typeof d] || 0
            })
        })

        const pieData = Object.entries(emotionTotals)
            .filter(([_, value]) => value > 0)
            .map(([emotion, value], index) => ({
                name: chartConfig[emotion as keyof typeof chartConfig].label,
                value: Math.round(value),
                fill: chartConfig[emotion as keyof typeof chartConfig].color,
            }))

        // Bar chart - average by emotion
        const barData = Object.entries(emotionTotals)
            .filter(([_, value]) => value > 0)
            .map(([emotion, total]) => {
                const count = emotionData.filter((d) => d[emotion as keyof typeof d] !== undefined).length
                return {
                    emotion: chartConfig[emotion as keyof typeof chartConfig].label,
                    average: count > 0 ? Math.round((total / count) * 10) / 10 : 0,
                    color: chartConfig[emotion as keyof typeof chartConfig].color,
                }
            })

        return { areaChartData: areaData, pieChartData: pieData, barChartData: barData }
    }, [emotionData])

    return (
        <div className="flex flex-col gap-6 p-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Progress Charts</h1>
                    <p className="text-muted-foreground mt-2">
                        Track emotional well-being over time
                    </p>
                </div>
                <ChildSelector
                    selectedChild={selectedChild}
                    onSelectChild={(value) => {
                        setSelectedChild(value)
                        if (value === "All") {
                            navigate("/parent/progress")
                        } else {
                            navigate(`/parent/progress?childId=${value}`)
                        }
                    }}
                    childrenList={childrenList}
                />
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Emotion Trends */}
                <Card>
                    <CardHeader>
                        <CardTitle>Emotion Trends</CardTitle>
                        <CardDescription>Emotional state over the last 30 days</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {areaChartData.length > 0 ? (
                            <ChartContainer config={chartConfig} className="h-[300px] w-full">
                                <AreaChart data={areaChartData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="date" />
                                    <YAxis domain={[0, 5]} />
                                    <ChartTooltip content={<ChartTooltipContent />} />
                                    <Area
                                        type="monotone"
                                        dataKey="happiness"
                                        stackId="1"
                                        stroke="var(--color-chart-5)"
                                        fill="var(--color-chart-5)"
                                        fillOpacity={0.6}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="sadness"
                                        stackId="1"
                                        stroke="var(--color-chart-2)"
                                        fill="var(--color-chart-2)"
                                        fillOpacity={0.6}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="anxiety"
                                        stackId="1"
                                        stroke="var(--color-chart-3)"
                                        fill="var(--color-chart-3)"
                                        fillOpacity={0.6}
                                    />
                                </AreaChart>
                            </ChartContainer>
                        ) : (
                            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                                No data available
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Emotion Distribution */}
                <Card>
                    <CardHeader>
                        <CardTitle>Emotion Distribution</CardTitle>
                        <CardDescription>Overall emotional breakdown</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {pieChartData.length > 0 ? (
                            <ChartContainer config={chartConfig} className="mx-auto aspect-square max-h-[300px]">
                                <PieChart>
                                    <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                                    <Pie
                                        data={pieChartData}
                                        dataKey="value"
                                        nameKey="name"
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

            {/* Average Intensity Bar Chart */}
            <Card>
                <CardHeader>
                    <CardTitle>Average Emotion Intensity</CardTitle>
                    <CardDescription>Average intensity levels for each emotion</CardDescription>
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
                                    dataKey="emotion"
                                    type="category"
                                    tickLine={false}
                                    axisLine={false}
                                    tickMargin={5}
                                />
                                <ChartTooltip
                                    cursor={false}
                                    content={<ChartTooltipContent indicator="dot" />}
                                />
                                <Bar dataKey="average" radius={5}>
                                    {barChartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
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

            {/* Latest Assessments Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Latest Assessments</CardTitle>
                    <CardDescription>Most recent evaluation reports</CardDescription>
                </CardHeader>
                <CardContent>
                    {!reports || reports.length === 0 ? (
                        <p className="text-muted-foreground">No assessments yet.</p>
                    ) : (
                        <div className="space-y-4">
                            {reports.slice(0, 5).map((report) => {
                                const child = children?.find((c) => c._id === report.childId)
                                const childName = child
                                    ? `${child.firstName} ${child.lastName}`
                                    : "Unknown Child"

                                return (
                                    <div
                                        key={report._id}
                                        className="border rounded-lg p-4 hover:bg-accent cursor-pointer transition-colors"
                                        onClick={() => navigate(`/parent/assessments/${report._id}`)}
                                    >
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="font-semibold">{childName}</p>
                                                <p className="text-sm text-muted-foreground">
                                                    {format(new Date(report.createdAt), "MMM d, yyyy 'at' h:mm a")}
                                                </p>
                                                <p className="text-sm mt-2 line-clamp-2">
                                                    {report.text.substring(0, 100)}...
                                                </p>
                                            </div>
                                            <Button variant="link" size="sm">
                                                View →
                                            </Button>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Daily Recommendations */}
            {recommendations && recommendations.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Daily Recommendations</CardTitle>
                        <CardDescription>Personalized suggestions for today</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {recommendations.map((rec) => (
                                <div key={rec.childId} className="border-l-4 border-primary pl-4">
                                    <p className="font-semibold mb-1">{rec.childName}</p>
                                    <p className="text-sm text-muted-foreground">{rec.recommendation}</p>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}

function ChildSelector({
    selectedChild,
    onSelectChild,
    childrenList,
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
                    {childrenList.find((child) => child.value === selectedChild)?.label ||
                        "Select child..."}
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

