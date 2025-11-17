"use client"

import * as React from "react"
import { useQuery, useMutation } from "convex/react"
import { api } from "convex/_generated/api"
import type { Id } from "convex/_generated/dataModel"
import { format } from "date-fns"
import { useNavigate } from "react-router"
import { toast } from "sonner"
import {
    type ColumnDef,
    type ColumnFiltersState,
    type SortingState,
    type VisibilityState,
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
} from "@tanstack/react-table"
import { ArrowUpDown, ChevronDown, MoreHorizontal } from "lucide-react"

import { Button } from "~/components/ui/button"
import { Checkbox } from "~/components/ui/checkbox"
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu"
import { Input } from "~/components/ui/input"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "~/components/ui/table"

export type Session = {
    sessionId: Id<"sessions">
    child: string
    date: string
    time: string
    type: string
    status: "Confirmed" | "Pending" | "Canceled"
}

// 2. Redefined Columns for the Session Data
function createColumns(
    updateSession: (sessionId: Id<"sessions">, status: "confirmed" | "pending" | "canceled") => Promise<void>,
    deleteSession: (sessionId: Id<"sessions">) => Promise<void>,
    navigate: (path: string) => void
): ColumnDef<Session>[] {
    return [
    {
        id: "select",
        header: ({ table }) => (
            <Checkbox
                checked={
                    table.getIsAllPageRowsSelected() ||
                    (table.getIsSomePageRowsSelected() && "indeterminate")
                }
                onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
                aria-label="Select all"
            />
        ),
        cell: ({ row }) => (
            <Checkbox
                checked={row.getIsSelected()}
                onCheckedChange={(value) => row.toggleSelected(!!value)}
                aria-label="Select row"
            />
        ),
        enableSorting: false,
        enableHiding: false,
    },
    {
        accessorKey: "child",
        header: ({ column }) => {
            return (
                <Button
                    variant="noShadow"
                    size="sm"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                >
                    Child
                    <ArrowUpDown className="ml-2 size-4" />
                </Button>
            )
        },
        cell: ({ row }) => <div>{row.getValue("child")}</div>,
    },
    {
        accessorKey: "date",
        header: "Date",
    },
    {
        accessorKey: "time",
        header: "Time",
    },
    {
        accessorKey: "type",
        header: "Type",
    },
    {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
            const status = row.getValue("status") as Session["status"]
            let statusElement: React.ReactNode;

            if (status === "Confirmed") {
                statusElement = <span>✅ Confirmed</span>
            } else if (status === "Pending") {
                statusElement = <span>⏳ Pending</span>
            } else if (status === "Canceled") {
                statusElement = <span>❌ Canceled</span>
            }

            return <div>{statusElement}</div>
        },
    },
    {
        id: "actions",
        enableHiding: false,
        cell: ({ row }) => {
            const session = row.original

            // A helper function to render menu items based on status
            const renderActionsByStatus = () => {
                const sessionId = session.sessionId
                
                switch (session.status) {
                    case "Confirmed":
                        return (
                            <>
                                <DropdownMenuItem
                                    onClick={() => {
                                        // Navigate to calendar to view session details
                                        navigate(`/therapist/calendar`)
                                    }}
                                >
                                    View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={() => {
                                        // Navigate to calendar for rescheduling
                                        navigate(`/therapist/calendar`)
                                    }}
                                >
                                    Reschedule
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                    className="text-destructive focus:text-destructive"
                                    onClick={async () => {
                                        if (confirm("Are you sure you want to cancel this session?")) {
                                            try {
                                                await updateSession(sessionId, "canceled")
                                                toast.success("Session canceled successfully")
                                            } catch (error) {
                                                toast.error("Failed to cancel session")
                                            }
                                        }
                                    }}
                                >
                                    Cancel Session
                                </DropdownMenuItem>
                            </>
                        )
                    case "Pending":
                        return (
                            <>
                                <DropdownMenuItem
                                    onClick={async () => {
                                        try {
                                            await updateSession(sessionId, "confirmed")
                                            toast.success("Session confirmed successfully")
                                        } catch (error) {
                                            toast.error("Failed to confirm session")
                                        }
                                    }}
                                >
                                    Confirm Session
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={() => {
                                        // Navigate to calendar to view session details
                                        navigate(`/therapist/calendar`)
                                    }}
                                >
                                    View Details
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                    className="text-destructive focus:text-destructive"
                                    onClick={async () => {
                                        if (confirm("Are you sure you want to cancel this session?")) {
                                            try {
                                                await updateSession(sessionId, "canceled")
                                                toast.success("Session canceled successfully")
                                            } catch (error) {
                                                toast.error("Failed to cancel session")
                                            }
                                        }
                                    }}
                                >
                                    Cancel Session
                                </DropdownMenuItem>
                            </>
                        )
                    case "Canceled":
                        return (
                            <>
                                <DropdownMenuItem
                                    onClick={() => {
                                        // Navigate to calendar to view session details
                                        navigate(`/therapist/calendar`)
                                    }}
                                >
                                    View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={async () => {
                                        // Reschedule by restoring to pending status
                                        try {
                                            await updateSession(sessionId, "pending")
                                            toast.success("Session rescheduled. Please update the date and time.")
                                            navigate(`/therapist/calendar`)
                                        } catch (error) {
                                            toast.error("Failed to reschedule session")
                                        }
                                    }}
                                >
                                    Reschedule
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                    className="text-destructive focus:text-destructive"
                                    onClick={async () => {
                                        if (confirm("Are you sure you want to delete this canceled session?")) {
                                            try {
                                                await deleteSession(sessionId)
                                                toast.success("Session deleted successfully")
                                            } catch (error) {
                                                toast.error("Failed to delete session")
                                            }
                                        }
                                    }}
                                >
                                    Delete Session
                                </DropdownMenuItem>
                            </>
                        )
                    default:
                        return (
                            <DropdownMenuItem
                                onClick={() => {
                                    navigate(`/therapist/calendar`)
                                }}
                            >
                                View Details
                            </DropdownMenuItem>
                        )
                }
            }

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
                        {renderActionsByStatus()}
                    </DropdownMenuContent>
                </DropdownMenu>
            )
        },
    }
]
}

// 3. The Main Table Component
export default function UpcomingSessionsTable() {
    const navigate = useNavigate()
    const sessions = useQuery(api.sessions.getSessions, {})
    const children = useQuery(api.therapists.getAllChildren)
    const updateSessionMutation = useMutation(api.sessions.updateSession)
    const deleteSessionMutation = useMutation(api.sessions.deleteSession)

    const handleUpdateSession = React.useCallback(async (sessionId: Id<"sessions">, status: "confirmed" | "pending" | "canceled") => {
        await updateSessionMutation({ sessionId, status })
    }, [updateSessionMutation])

    const handleDeleteSession = React.useCallback(async (sessionId: Id<"sessions">) => {
        await deleteSessionMutation({ sessionId })
    }, [deleteSessionMutation])

    const columns = React.useMemo(
        () => createColumns(handleUpdateSession, handleDeleteSession, navigate),
        [handleUpdateSession, handleDeleteSession, navigate]
    )

    // Transform sessions to table format
    const upcomingSessionsData = React.useMemo(() => {
        if (!sessions || !children) return []

        const today = new Date()
        today.setHours(0, 0, 0, 0)

        return sessions
            .filter(session => {
                const sessionDate = new Date(session.scheduledDate)
                return sessionDate >= today && session.status !== "canceled"
            })
            .sort((a, b) => {
                const dateA = new Date(a.scheduledDate + " " + a.scheduledTime)
                const dateB = new Date(b.scheduledDate + " " + b.scheduledTime)
                return dateA.getTime() - dateB.getTime()
            })
            .slice(0, 10) // Get next 10 sessions
            .map(session => {
                const child = children.find(c => c._id === session.childId)
                const childName = child ? `${child.firstName} ${child.lastName}` : "Unknown Child"
                const date = new Date(session.scheduledDate)
                
                // Format time
                const [hours, minutes] = session.scheduledTime.split(":").map(Number)
                const timeDate = new Date()
                timeDate.setHours(hours, minutes)
                const timeStr = format(timeDate, "h:mm a")

                return {
                    sessionId: session._id,
                    child: childName,
                    date: format(date, "MMM d, yyyy"),
                    time: timeStr,
                    type: session.type,
                    status: session.status.charAt(0).toUpperCase() + session.status.slice(1) as "Confirmed" | "Pending" | "Canceled",
                }
            })
    }, [sessions, children])

    const [sorting, setSorting] = React.useState<SortingState>([])
    const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
    const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
    const [rowSelection, setRowSelection] = React.useState({})

    const table = useReactTable({
        data: upcomingSessionsData,
        columns: columns,
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        onColumnVisibilityChange: setColumnVisibility,
        onRowSelectionChange: setRowSelection,
        state: {
            sorting,
            columnFilters,
            columnVisibility,
            rowSelection,
        },
    })

    if (!sessions || !children) {
        return (
            <div className="w-full font-base text-main-foreground">
                <p>Loading sessions...</p>
            </div>
        )
    }

    return (
        <div className="w-full font-base text-main-foreground">
            <div className="flex items-center py-4">
                <Input
                    placeholder="Filter by child's name..."
                    value={(table.getColumn("child")?.getFilterValue() as string) ?? ""}
                    onChange={(event) =>
                        table.getColumn("child")?.setFilterValue(event.target.value)
                    }
                    className="max-w-sm"
                />
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="noShadow" className="ml-auto">
                            Columns <ChevronDown className="ml-2 size-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        {table
                            .getAllColumns()
                            .filter((column) => column.getCanHide())
                            .map((column) => {
                                return (
                                    <DropdownMenuCheckboxItem
                                        key={column.id}
                                        className="capitalize"
                                        checked={column.getIsVisible()}
                                        onCheckedChange={(value) =>
                                            column.toggleVisibility(!!value)
                                        }
                                    >
                                        {column.id}
                                    </DropdownMenuCheckboxItem>
                                )
                            })}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
            <div>
                <Table>
                    <TableHeader className="font-heading">
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow
                                className="bg-secondary-background text-foreground"
                                key={headerGroup.id}
                            >
                                {headerGroup.headers.map((header) => {
                                    return (
                                        <TableHead className="text-foreground" key={header.id}>
                                            {header.isPlaceholder
                                                ? null
                                                : flexRender(
                                                    header.column.columnDef.header,
                                                    header.getContext(),
                                                )}
                                        </TableHead>
                                    )
                                })}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {table.getRowModel().rows?.length ? (
                            table.getRowModel().rows.map((row) => (
                                <TableRow
                                    className="border-border bg-secondary-background text-foreground data-[state=selected]:bg-main data-[state=selected]:text-main-foreground"
                                    key={row.id}
                                    data-state={row.getIsSelected() && "selected"}
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
                <div className="text-foreground flex-1 text-sm">
                    {table.getFilteredSelectedRowModel().rows.length} of{" "}
                    {table.getFilteredRowModel().rows.length} row(s) selected.
                </div>
                <div className="space-x-2">
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
        </div>
    )
}