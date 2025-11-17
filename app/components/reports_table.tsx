"use client"

import * as React from "react"
import { useQuery, useMutation } from "convex/react"
import { api } from "convex/_generated/api"
import { useNavigate } from "react-router"
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
import { toast } from "sonner"
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

type ReportData = {
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
}

function getEmotionSummary(emotionData: ReportData["emotionData"]): string {
    const emotions: string[] = []
    if (emotionData.anger && emotionData.anger > 0) emotions.push(`Anger: ${emotionData.anger}`)
    if (emotionData.sadness && emotionData.sadness > 0) emotions.push(`Sadness: ${emotionData.sadness}`)
    if (emotionData.anxiety && emotionData.anxiety > 0) emotions.push(`Anxiety: ${emotionData.anxiety}`)
    if (emotionData.fear && emotionData.fear > 0) emotions.push(`Fear: ${emotionData.fear}`)
    if (emotionData.happiness && emotionData.happiness > 0) emotions.push(`Happiness: ${emotionData.happiness}`)
    if (emotionData.guilt && emotionData.guilt > 0) emotions.push(`Guilt: ${emotionData.guilt}`)
    return emotions.length > 0 ? emotions.join(", ") : "None"
}

function getTestScore(testResults?: ReportData["testResults"]): number | null {
    if (!testResults || testResults.length === 0) return null
    const totalScore = testResults.reduce((sum, result) => sum + result.score, 0)
    const maxScore = testResults.length * 4
    return Math.round((totalScore / maxScore) * 100)
}

function createColumns(
    navigate: (path: string) => void,
    onDeleteClick: (reportId: Id<"reports">) => void
): ColumnDef<ReportData>[] {
    return [
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
            accessorKey: "text",
            header: "Summary",
            cell: ({ row }) => {
                const text = row.getValue("text") as string
                return (
                    <div className="max-w-md truncate" title={text}>
                        {text.substring(0, 100)}{text.length > 100 ? "..." : ""}
                    </div>
                )
            },
        },
        {
            accessorKey: "emotions",
            header: "Emotions",
            cell: ({ row }) => {
                const summary = getEmotionSummary(row.original.emotionData)
                return <div className="text-sm">{summary}</div>
            },
        },
        {
            accessorKey: "testScore",
            header: "Test Score",
            cell: ({ row }) => {
                const score = getTestScore(row.original.testResults)
                return (
                    <div>
                        {score !== null ? (
                            <span className={score < 50 ? "text-red-500" : score < 70 ? "text-yellow-500" : "text-green-500"}>
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
            id: "actions",
            header: "Actions",
            cell: ({ row }) => {
                const report = row.original

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
                                onClick={() => navigate(`/therapist/reports/${report._id}`)}
                            >
                                View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() => navigate(`/therapist/reports/${report._id}/edit`)}
                            >
                                Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={() => onDeleteClick(report._id)}
                            >
                                Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                )
            },
        },
    ]
}

interface ReportsTableProps {
    childId?: Id<"kids">
    therapistId?: Id<"users">
}

export default function ReportsTable({ childId, therapistId }: ReportsTableProps) {
    const navigate = useNavigate()
    const reports = useQuery(api.report.getAllReports, {
        childId,
        therapistId,
        limit: 100,
    })
    const deleteReportMutation = useMutation(api.report.deleteReport)

    const [sorting, setSorting] = React.useState<SortingState>([])
    const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
    const [deleteReportId, setDeleteReportId] = React.useState<Id<"reports"> | null>(null)

    const handleDelete = async (reportId: Id<"reports">) => {
        await deleteReportMutation({ reportId })
    }

    const handleDeleteClick = (reportId: Id<"reports">) => {
        setDeleteReportId(reportId)
    }

    const handleConfirmDelete = async () => {
        if (deleteReportId) {
            try {
                await handleDelete(deleteReportId)
                toast.success("Report deleted")
                setDeleteReportId(null)
            } catch (error) {
                toast.error("Failed to delete report")
                setDeleteReportId(null)
            }
        }
    }

    const columns = React.useMemo(
        () => createColumns(navigate, handleDeleteClick),
        [navigate]
    )

    const table = useReactTable({
        data: reports || [],
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

    if (!reports) {
        return (
            <div className="w-full font-base text-main-foreground">
                <p>Loading reports...</p>
            </div>
        )
    }

    return (
        <div className="w-full font-base text-main-foreground">
            <AlertDialog open={deleteReportId !== null} onOpenChange={(open) => !open && setDeleteReportId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete this report
                            and remove all associated data from the database.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setDeleteReportId(null)}>
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleConfirmDelete}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            <div className="flex items-center py-4">
                <Input
                    placeholder="Filter by summary..."
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
                                    No reports found.
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
        </div>
    )
}

