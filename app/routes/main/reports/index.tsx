"use client"

import ReportsTable from "~/components/reports_table"

export default function ReportsIndex() {
    return (
        <div className="p-6">
            <div className="mb-4">
                <h1 className="text-2xl font-bold">All Reports</h1>
            </div>
            <ReportsTable />
        </div>
    )
}





