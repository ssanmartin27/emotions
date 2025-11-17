"use client"

import * as React from "react"
import { useQuery } from "convex/react"
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
import { ArrowUpDown } from "lucide-react"

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
import { MoreHorizontal } from "lucide-react"
import { format } from "date-fns"

// Data structure for the Children List
export type ChildData = {
    _id: Id<"kids">
    firstName: string
    lastName: string
    age: number
    lastEvaluationDate?: number
    emotionalStatus: "Stable" | "Sad" | "Happy" | "Anxious"
}

// Helper function to calculate emotional status from recent reports
function calculateEmotionalStatus(reports: any[]): "Stable" | "Sad" | "Happy" | "Anxious" {
    if (reports.length === 0) return "Stable"
    
    // Get the most recent report
    const latestReport = reports[0]
    const emotions = latestReport.emotionData || {}
    
    // Calculate dominant emotion
    const sadness = emotions.sadness || 0
    const anxiety = emotions.anxiety || 0
    const happiness = emotions.happiness || 0
    const anger = emotions.anger || 0
    const fear = emotions.fear || 0
    
    // Determine status based on highest emotion
    const maxEmotion = Math.max(sadness, anxiety, happiness, anger, fear)
    
    if (happiness >= maxEmotion && happiness > 2.5) return "Happy"
    if (sadness >= maxEmotion && sadness > 2.5) return "Sad"
    if (anxiety >= maxEmotion && anxiety > 2.5) return "Anxious"
    
    return "Stable"
}

// Column definitions for the Children List
function createColumns(navigate: (path: string) => void): ColumnDef<ChildData>[] {
    return [
        {
            accessorKey: "name",
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
                const child = row.original
                return <div className="font-medium">{`${child.firstName} ${child.lastName}`}</div>
            },
        },
        {
            accessorKey: "age",
            header: ({ column }) => (
                <Button
                    variant="noShadow"
                    size="sm"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                >
                    Age
                    <ArrowUpDown className="ml-2 size-4" />
                </Button>
            ),
            cell: ({ row }) => <div>{row.getValue("age")}</div>,
        },
        {
            accessorKey: "lastEvaluation",
            header: ({ column }) => (
                <Button
                    variant="noShadow"
                    size="sm"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                >
                    Last Evaluation
                    <ArrowUpDown className="ml-2 size-4" />
                </Button>
            ),
            cell: ({ row }) => {
                const date = row.original.lastEvaluationDate
                return (
                    <div>
                        {date ? format(new Date(date), "MMM d, yyyy") : "Never"}
                    </div>
                )
            },
        },
        {
            accessorKey: "emotionalStatus",
            header: "Emotional Status",
            cell: ({ row }) => {
                const status = row.getValue("emotionalStatus") as ChildData["emotionalStatus"]
                const statusMap = {
                    Stable: { icon: "🙂", text: "Stable" },
                    Sad: { icon: "😢", text: "Sad" },
                    Happy: { icon: "😊", text: "Happy" },
                    Anxious: { icon: "😰", text: "Anxious" },
                }
                const { icon, text } = statusMap[status]
                return (
                    <div className="flex items-center">
                        <span className="mr-2">{icon}</span> {text}
                    </div>
                )
            },
        },
        {
            id: "actions",
            header: "Actions",
            cell: ({ row }) => {
                const child = row.original
                const childId = child._id
                
                return (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="noShadow" className="size-8 p-0 hover:bg-main hover:text-main-foreground">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="size-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem
                                onClick={() => navigate(`/therapist/children/${childId}`)}
                            >
                                View Profile
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() => navigate(`/therapist/create-report?childId=${childId}`)}
                            >
                                Start Evaluation
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                onClick={() => navigate(`/therapist/children/${childId}/reports`)}
                            >
                                View Reports
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                )
            },
        },
    ]
}

// The main table component
export default function ChildrenTable() {
    const navigate = useNavigate()
    const children = useQuery(api.therapists.getAllChildren)
    const allReports = useQuery(api.report.getAllReports, { limit: 1000 })
    const [sorting, setSorting] = React.useState<SortingState>([])
    const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])

    // Transform children data and calculate emotional status
    const childrenData = React.useMemo(() => {
        if (!children) return []
        
        // Group reports by childId for efficient lookup
        const reportsByChild = new Map<string, any[]>()
        if (allReports) {
            allReports.forEach((report) => {
                const childId = report.childId
                if (!reportsByChild.has(childId)) {
                    reportsByChild.set(childId, [])
                }
                reportsByChild.get(childId)!.push(report)
            })
        }
        
        return children.map((child) => {
            // Get reports for this child and sort by most recent first
            const childReports = (reportsByChild.get(child._id) || [])
                .sort((a, b) => b.createdAt - a.createdAt)
            
            // Calculate emotional status from reports
            const emotionalStatus = calculateEmotionalStatus(childReports)
            
            return {
                _id: child._id,
                firstName: child.firstName,
                lastName: child.lastName,
                age: child.age,
                lastEvaluationDate: child.lastEvaluationDate,
                emotionalStatus,
            }
        })
    }, [children, allReports])

    const columns = React.useMemo(() => createColumns(navigate), [navigate])

    const table = useReactTable({
        data: childrenData,
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

    if (!children) {
        return (
            <div className="w-full font-base text-main-foreground">
                <p>Loading children...</p>
            </div>
        )
    }

    return (
        <div className="w-full font-base text-main-foreground">
            <div className="flex items-center py-4">
                <Input
                    placeholder="Filter by child's name..."
                    value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
                    onChange={(event) =>
                        table.getColumn("name")?.setFilterValue(event.target.value)
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
                                    No results.
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
