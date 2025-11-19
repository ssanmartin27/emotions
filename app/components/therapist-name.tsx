"use client"

import { useQuery } from "convex/react"
import { api } from "convex/_generated/api"
import type { Id } from "convex/_generated/dataModel"

export function TherapistName({ therapistId }: { therapistId: Id<"users"> }) {
    const therapist = useQuery(api.therapists.getTherapistById, { therapistId })
    
    if (!therapist) {
        return <span>Unknown</span>
    }
    
    return <span>{therapist.firstName} {therapist.lastName}</span>
}





