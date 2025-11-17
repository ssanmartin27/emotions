"use client"

import * as React from "react"
import { useQuery } from "convex/react"
import { api } from "convex/_generated/api"
import { useNavigate, useSearchParams } from "react-router"
import type { Id } from "convex/_generated/dataModel"
import {
    type ColumnDef,
    type ColumnFiltersState,
    type SortingState,
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
} from "@tanstack/react-table"
import { ArrowUpDown, MoreHorizontal } from "lucide-react"
import { format } from "date-fns"

import { Button } from "~/components/ui/button"
import { Input } from "~/components/ui/input"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "~/components/ui/table"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "~/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card"
import { TherapistName } from "~/components/therapist-name"

type AssessmentData = {
    _id: Id<"reports">
    childId: Id<"kids">
    createdAt: number
    text: string
    emotionData: {
        anger?: number
        sadness?: number
        anxiety?: number
        fear?: number
        happiness?: number
        guilt?: number
    }
    testResults?: Array<{
        question: string
        answer: string
        score: number
    }>
    therapistId: Id<"users">
}

function getEmotionSummary(emotionData: AssessmentData["emotionData"]): string {
    const emotions: string[] = []
    if (emotionData.anger && emotionData.anger > 0)
        emotions.push(`Anger: ${emotionData.anger}`)
    if (emotionData.sadness && emotionData.sadness > 0)
        emotions.push(`Sadness: ${emotionData.sadness}`)
    if (emotionData.anxiety && emotionData.anxiety > 0)
        emotions.push(`Anxiety: ${emotionData.anxiety}`)
    if (emotionData.fear && emotionData.fear > 0) emotions.push(`Fear: ${emotionData.fear}`)
    if (emotionData.happiness && emotionData.happiness > 0)
        emotions.push(`Happiness: ${emotionData.happiness}`)
    if (emotionData.guilt && emotionData.guilt > 0) emotions.push(`Guilt: ${emotionData.guilt}`)
    return emotions.length > 0 ? emotions.slice(0, 2).join(", ") + (emotions.length > 2 ? "..." : "") : "None"
}

function getTestScore(testResults?: AssessmentData["testResults"]): number | null {
    if (!testResults || testResults.length === 0) return null
    const totalScore = testResults.reduce((sum, result) => sum + result.score, 0)
    const maxScore = testResults.length * 4
    return Math.round((totalScore / maxScore) * 100)
}

function createColumns(
    navigate: (path: string) => void,
    children: Array<{ _id: Id<"kids">; firstName: string; lastName: string }>
): ColumnDef<AssessmentData>[] {
    return [
        {
            accessorKey: "childName",
            header: ({ column }) => (
                <Button
                    variant="noShadow"
                    size="sm"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                >
                    Child
                    <ArrowUpDown className="ml-2 size-4" />
                </Button>
            ),
            cell: ({ row }) => {
                const child = children.find((c) => c._id === row.original.childId)
                return (
                    <div className="font-medium">
                        {child ? `${child.firstName} ${child.lastName}` : "Unknown"}
                    </div>
                )
            },
        },
        {
            accessorKey: "date",
            header: ({ column }) => (
                <Button
                    variant="noShadow"
                    size="sm"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                >
                    Date
                    <ArrowUpDown className="ml-2 size-4" />
                </Button>
            ),
            cell: ({ row }) => {
                const date = row.original.createdAt
                return <div>{format(new Date(date), "MMM d, yyyy")}</div>
            },
        },
        {
            accessorKey: "emotions",
            header: "Emotional State",
            cell: ({ row }) => {
                const summary = getEmotionSummary(row.original.emotionData)
                return <div className="text-sm max-w-xs truncate">{summary}</div>
            },
        },
        {
            accessorKey: "testScore",
            header: ({ column }) => (
                <Button
                    variant="noShadow"
                    size="sm"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                >
                    Test Score
                    <ArrowUpDown className="ml-2 size-4" />
                </Button>
            ),
            cell: ({ row }) => {
                const score = getTestScore(row.original.testResults)
                return (
                    <div>
                        {score !== null ? (
                            <span
                                className={
                                    score < 50
                                        ? "text-red-500"
                                        : score < 70
                                        ? "text-yellow-500"
                                        : "text-green-500"
                                }
                            >
                                {score}%
                            </span>
                        ) : (
                            <span className="text-muted-foreground">N/A</span>
                        )}
                    </div>
                )
            },
        },
        {
            accessorKey: "evaluator",
            header: "Evaluator",
            cell: ({ row }) => {
                return (
                    <div className="text-sm">
                        <TherapistName therapistId={row.original.therapistId} />
                    </div>
                )
            },
        },
        {
            id: "actions",
            header: "Actions",
            cell: ({ row }) => {
                const assessment = row.original

                return (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="noShadow" className="size-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="size-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem
                                onClick={() => navigate(`/parent/assessments/${assessment._id}`)}
                            >
                                View Details
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                onClick={() => {
                                    // PDF download will be handled in detail view
                                    navigate(`/parent/assessments/${assessment._id}`)
                                }}
                            >
                                Download PDF
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                )
            },
        },
    ]
}

export default function AssessmentsPage() {
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const childIdFilter = searchParams.get("childId")

    const children = useQuery(api.parents.getParentChildren)
    const reports = useQuery(api.parents.getParentReports, {
        childId: childIdFilter ? (childIdFilter as Id<"kids">) : undefined,
        limit: 100,
    })

    // Get therapist names - we'll use a component to fetch them individually

    const [sorting, setSorting] = React.useState<SortingState>([])
    const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
    const [selectedChildFilter, setSelectedChildFilter] = React.useState<string>(
        childIdFilter || "all"
    )

    const filteredReports = React.useMemo(() => {
        if (!reports) return []
        if (selectedChildFilter === "all") return reports
        return reports.filter((r) => r.childId === selectedChildFilter)
    }, [reports, selectedChildFilter])

    const columns = React.useMemo(
        () => createColumns(navigate, children || []),
        [navigate, children]
    )

    const table = useReactTable({
        data: filteredReports,
        columns,
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        state: {
            sorting,
            columnFilters,
        },
    })

    if (!children || !reports) {
        return (
            <div className="p-6">
                <p>Loading assessments...</p>
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-6 p-6">
            <Card>
                <CardHeader>
                    <CardTitle>Assessments</CardTitle>
                    <CardDescription>View and download all assessment reports</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center gap-4 py-4">
                        <Select
                            value={selectedChildFilter}
                            onValueChange={(value) => {
                                setSelectedChildFilter(value)
                                if (value === "all") {
                                    navigate("/parent/assessments")
                                } else {
                                    navigate(`/parent/assessments?childId=${value}`)
                                }
                            }}
                        >
                            <SelectTrigger className="w-[200px]">
                                <SelectValue placeholder="Filter by child" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Children</SelectItem>
                                {children.map((child) => (
                                    <SelectItem key={child._id} value={child._id}>
                                        {child.firstName} {child.lastName}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Input
                            placeholder="Search assessments..."
                            value={(table.getColumn("text")?.getFilterValue() as string) ?? ""}
                            onChange={(event) =>
                                table.getColumn("text")?.setFilterValue(event.target.value)
                            }
                            className="max-w-sm"
                        />
                    </div>

                    <div>
                        <Table>
                            <TableHeader className="font-heading">
                                {table.getHeaderGroups().map((headerGroup) => (
                                    <TableRow
                                        className="border-border bg-secondary-background text-foreground"
                                        key={headerGroup.id}
                                    >
                                        {headerGroup.headers.map((header) => (
                                            <TableHead className="text-foreground" key={header.id}>
                                                {header.isPlaceholder
                                                    ? null
                                                    : flexRender(
                                                          header.column.columnDef.header,
                                                          header.getContext(),
                                                      )}
                                            </TableHead>
                                        ))}
                                    </TableRow>
                                ))}
                            </TableHeader>
                            <TableBody>
                                {table.getRowModel().rows?.length ? (
                                    table.getRowModel().rows.map((row) => (
                                        <TableRow
                                            className="border-border bg-secondary-background text-foreground"
                                            key={row.id}
                                        >
                                            {row.getVisibleCells().map((cell) => (
                                                <TableCell className="px-4 py-2" key={cell.id}>
                                                    {flexRender(
                                                        cell.column.columnDef.cell,
                                                        cell.getContext(),
                                                    )}
                                                </TableCell>
                                            ))}
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell
                                            colSpan={columns.length}
                                            className="h-24 text-center"
                                        >
                                            No assessments found.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    <div className="flex items-center justify-end space-x-2 py-4">
                        <Button
                            variant="noShadow"
                            size="sm"
                            onClick={() => table.previousPage()}
                            disabled={!table.getCanPreviousPage()}
                        >
                            Previous
                        </Button>
                        <Button
                            variant="noShadow"
                            size="sm"
                            onClick={() => table.nextPage()}
                            disabled={!table.getCanNextPage()}
                        >
                            Next
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

