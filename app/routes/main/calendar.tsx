"use client"

import React, { Suspense } from "react"
import { useQuery } from "convex/react"
import { api } from "convex/_generated/api"
import { Calendar } from "~/components/calendar"
import { CalendarSkeleton } from "~/components/calendar-skeleton"
import type { IEvent, IUser } from "~/components/interfaces"
import type { TEventColor } from "~/components/types"

function CalendarData() {
    const sessions = useQuery(api.sessions.getSessions, {})
    const children = useQuery(api.therapists.getAllChildren)

    // Transform sessions to IEvent format
    const events: IEvent[] = React.useMemo(() => {
        if (!sessions || !children) return []

        return sessions.map((session, index) => {
            const child = children.find(c => c._id === session.childId)
            const childName = child ? `${child.firstName} ${child.lastName}` : "Unknown Child"

            // Parse date and time
            const dateStr = session.scheduledDate
            const timeStr = session.scheduledTime
            const [hours, minutes] = timeStr.split(":").map(Number)
            const startDate = new Date(dateStr)
            startDate.setHours(hours, minutes, 0, 0)
            const endDate = new Date(startDate)
            endDate.setMinutes(endDate.getMinutes() + session.duration)

            // Determine color based on status
            let color: TEventColor = "blue"
            if (session.status === "confirmed") color = "green"
            else if (session.status === "pending") color = "yellow"
            else if (session.status === "canceled") color = "red"

            return {
                id: index,
                startDate: startDate.toISOString(),
                endDate: endDate.toISOString(),
                title: `${childName} - ${session.type}`,
                color,
                description: session.notes || `${session.type} session with ${childName}`,
                user: {
                    id: session.childId,
                    name: childName,
                    picturePath: null,
                },
            }
        })
    }, [sessions, children])

    // Create users from children
    const users: IUser[] = React.useMemo(() => {
        if (!children) return []
        return children.map(child => ({
            id: child._id,
            name: `${child.firstName} ${child.lastName}`,
            picturePath: null,
        }))
    }, [children])

    return <Calendar events={events} users={users} />
}

export default function CalendarPage() {
    return (
        <div className="h-[calc(100vh-8rem)] overflow-hidden">
            <Suspense fallback={<CalendarSkeleton />}>
                <CalendarData />
            </Suspense>
        </div>
    )
}
