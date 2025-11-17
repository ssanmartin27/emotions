"use client"

import { useQuery } from "convex/react"
import { api } from "convex/_generated/api"
import type { Id } from "convex/_generated/dataModel"

export function ChildName({ childId }: { childId: Id<"kids"> }) {
    const child = useQuery(api.therapists.getChildById, { childId })

    if (!child) {
        return <span>Loading...</span>
    }

    return <span>{`${child.firstName} ${child.lastName}`}</span>
}




