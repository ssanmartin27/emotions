"use client"

import * as React from "react"
import { useQuery } from "convex/react"
import { api } from "convex/_generated/api"
import { useNavigate } from "react-router"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card"
import { Button } from "~/components/ui/button"
import { format } from "date-fns"
import { FileText, TrendingUp, Users, AlertCircle } from "lucide-react"

export default function ParentHome() {
    const profile = useQuery(api.parents.getParentProfile)
    const children = useQuery(api.parents.getParentChildren)
    // Fetch all reports for accurate statistics
    const allReports = useQuery(api.parents.getParentReports)
    // Fetch only 5 reports for the recent activity list
    const recentReportsList = useQuery(api.parents.getParentReports, { limit: 5 })
    const recommendations = useQuery(api.parents.getDailyRecommendations)
    const navigate = useNavigate()

    const totalAssessments = allReports?.length || 0
    const recentAssessments = allReports?.filter(
        (r) => r.createdAt > Date.now() - 7 * 24 * 60 * 60 * 1000
    ).length || 0

    // Calculate children needing attention (high negative emotions in recent reports)
    const childrenNeedingAttention = React.useMemo(() => {
        if (!allReports || allReports.length === 0) return 0
        const recentReports = allReports.filter(
            (r) => r.createdAt > Date.now() - 14 * 24 * 60 * 60 * 1000
        )
        const childrenWithIssues = new Set<string>()
        recentReports.forEach((report) => {
            const emotions = report.emotionData || {}
            const negativeAvg =
                ((emotions.anger || 0) +
                    (emotions.sadness || 0) +
                    (emotions.anxiety || 0) +
                    (emotions.fear || 0) +
                    (emotions.guilt || 0)) /
                5
            if (negativeAvg > 3 || (emotions.happiness || 0) < 1.5) {
                childrenWithIssues.add(report.childId)
            }
        })
        return childrenWithIssues.size
    }, [allReports])

    const parentName = profile ? `${profile.firstName} ${profile.lastName}` : "Parent"

    return (
        <div className="flex flex-col gap-6 p-6">
            {/* Welcome Message */}
            <div className="mb-4">
                <h1 className="text-3xl font-bold">Welcome back, {parentName}!</h1>
                <p className="text-muted-foreground mt-2">
                    Here's an overview of your children's emotional well-being
                </p>
            </div>

            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="bg-secondary-background text-foreground">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Children</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{children?.length || 0}</div>
                    </CardContent>
                </Card>

                <Card className="bg-secondary-background text-foreground">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Assessments</CardTitle>
                        <FileText className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalAssessments}</div>
                    </CardContent>
                </Card>

                <Card className="bg-secondary-background text-foreground">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Recent Assessments</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{recentAssessments}</div>
                        <p className="text-xs text-muted-foreground">Last 7 days</p>
                    </CardContent>
                </Card>

                <Card className="bg-secondary-background text-foreground">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Need Attention</CardTitle>
                        <AlertCircle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{childrenNeedingAttention}</div>
                        <p className="text-xs text-muted-foreground">Children</p>
                    </CardContent>
                </Card>
            </div>

            {/* Children Overview */}
            <Card>
                <CardHeader>
                    <CardTitle>Your Children</CardTitle>
                    <CardDescription>Overview of each child's status</CardDescription>
                </CardHeader>
                <CardContent>
                    {!children || children.length === 0 ? (
                        <p className="text-muted-foreground">No children registered yet.</p>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {children.map((child) => {
                                const childReports = allReports?.filter(
                                    (r) => r.childId === child._id
                                ) || []
                                // Sort by createdAt descending to get the latest report
                                const sortedChildReports = [...childReports].sort((a, b) => b.createdAt - a.createdAt)
                                const latestReport = sortedChildReports[0]
                                const emotions = latestReport?.emotionData || {}
                                const emotionalStatus =
                                    (emotions.happiness || 0) > 3
                                        ? "Positive"
                                        : (emotions.sadness || 0) > 2.5 ||
                                          (emotions.anxiety || 0) > 2.5
                                        ? "Needs Attention"
                                        : "Stable"

                                return (
                                    <Card
                                        key={child._id}
                                        className="cursor-pointer hover:bg-accent transition-colors"
                                        onClick={() => navigate(`/parent/progress?childId=${child._id}`)}
                                    >
                                        <CardHeader>
                                            <CardTitle className="text-lg">
                                                {child.firstName} {child.lastName}
                                            </CardTitle>
                                            <CardDescription>
                                                Age {child.age} • {child.course}
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="space-y-2">
                                                <div>
                                                    <p className="text-sm text-muted-foreground">
                                                        Last Assessment
                                                    </p>
                                                    <p className="text-sm font-medium">
                                                        {child.lastEvaluationDate
                                                            ? format(
                                                                  new Date(child.lastEvaluationDate),
                                                                  "MMM d, yyyy"
                                                              )
                                                            : "Never"}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-sm text-muted-foreground">
                                                        Emotional Status
                                                    </p>
                                                    <p className="text-sm font-medium">
                                                        {emotionalStatus}
                                                    </p>
                                                </div>
                                                <div className="flex gap-2 mt-4">
                                                    <Button
                                                        variant="neutral"
                                                        size="sm"
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            navigate(
                                                                `/parent/assessments?childId=${child._id}`
                                                            )
                                                        }}
                                                    >
                                                        View Reports
                                                    </Button>
                                                    <Button
                                                        variant="neutral"
                                                        size="sm"
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            navigate(
                                                                `/parent/progress?childId=${child._id}`
                                                            )
                                                        }}
                                                    >
                                                        View Progress
                                                    </Button>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                )
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Daily Recommendation */}
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

            {/* Recent Activity */}
            <Card>
                <CardHeader>
                    <CardTitle>Recent Assessments</CardTitle>
                    <CardDescription>Latest evaluation reports</CardDescription>
                </CardHeader>
                <CardContent>
                    {!recentReportsList || recentReportsList.length === 0 ? (
                        <p className="text-muted-foreground">No assessments yet.</p>
                    ) : (
                        <div className="space-y-4">
                            {recentReportsList.map((report) => {
                                const child = children?.find((c) => c._id === report.childId)
                                const childName = child
                                    ? `${child.firstName} ${child.lastName}`
                                    : "Unknown Child"

                                return (
                                    <div
                                        key={report._id}
                                        className="border rounded-lg p-4 hover:bg-accent cursor-pointer transition-colors"
                                        onClick={() =>
                                            navigate(`/parent/assessments/${report._id}`)
                                        }
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
        </div>
    )
}



