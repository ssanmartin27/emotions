"use client"

import { useQuery } from "convex/react"
import { api } from "convex/_generated/api"
import { useParams, useNavigate } from "react-router"
import ReportsTable from "~/components/reports_table"

export default function ChildReportsView() {
    const { childId } = useParams()
    const navigate = useNavigate()
    
    const child = useQuery(api.therapists.getChildById, { 
        childId: childId as any 
    })

    if (!child) {
        return (
            <div className="p-6">
                <p>Loading...</p>
            </div>
        )
    }

    return (
        <div className="p-6">
            <div className="mb-4">
                <h1 className="text-2xl font-bold">
                    Reports for {child.firstName} {child.lastName}
                </h1>
            </div>
            <ReportsTable childId={childId as any} />
        </div>
    )
}





