"use client"

import { useMutation } from "convex/react"
import { api } from "convex/_generated/api"
import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card"
import { Button } from "~/components/ui/button"
import { Loader2, Database, CheckCircle2, AlertCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert"

export default function SeedPage() {
    const seedDatabase = useMutation(api.seed.seedDatabase)
    const [loading, setLoading] = useState(false)
    const [result, setResult] = useState<{
        success: boolean
        message: string
        counts?: {
            parents: number
            therapists: number
            children: number
            sessions: number
            reports: number
            emotionObservations: number
        }
    } | null>(null)
    const [error, setError] = useState<string | null>(null)

    const handleSeed = async () => {
        setLoading(true)
        setResult(null)
        setError(null)
        
        try {
            const response = await seedDatabase({})
            setResult(response)
        } catch (err) {
            setError(err instanceof Error ? err.message : "An error occurred while seeding the database")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="container mx-auto p-6 max-w-2xl">
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <Database className="h-5 w-5" />
                        <CardTitle>Seed Database</CardTitle>
                    </div>
                    <CardDescription>
                        Populate your database with simulated data for development and testing.
                        This will create sample parents, therapists, children, sessions, reports, and emotion observations.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {error && (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Error</AlertTitle>
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    {result && result.success && (
                        <Alert>
                            <CheckCircle2 className="h-4 w-4" />
                            <AlertTitle>Success</AlertTitle>
                            <AlertDescription>
                                {result.message}
                                {result.counts && (
                                    <div className="mt-2 space-y-1 text-sm">
                                        <p>• {result.counts.parents} parent users</p>
                                        <p>• {result.counts.therapists} therapist users</p>
                                        <p>• {result.counts.children} children</p>
                                        <p>• {result.counts.sessions} sessions</p>
                                        <p>• {result.counts.reports} reports</p>
                                        <p>• {result.counts.emotionObservations} emotion observations</p>
                                    </div>
                                )}
                            </AlertDescription>
                        </Alert>
                    )}

                    <Button
                        onClick={handleSeed}
                        disabled={loading}
                        className="w-full"
                        size="lg"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Seeding database...
                            </>
                        ) : (
                            <>
                                <Database className="mr-2 h-4 w-4" />
                                Seed Database
                            </>
                        )}
                    </Button>

                    <div className="text-sm text-muted-foreground space-y-2 pt-4 border-t">
                        <p className="font-semibold">What will be created:</p>
                        <ul className="list-disc list-inside space-y-1 ml-2">
                            <li>3 parent users (Maria Garcia, John Smith, Sarah Johnson)</li>
                            <li>2 therapist users (Dr. Emily Rodriguez, Dr. Michael Chen)</li>
                            <li>5 children linked to parents</li>
                            <li>5 therapy sessions with various statuses</li>
                            <li>8 reports with emotion data and test results</li>
                            <li>12 emotion observations linked to reports</li>
                        </ul>
                        <p className="mt-4 text-xs">
                            <strong>Note:</strong> Running this multiple times will create duplicate data.
                            Consider clearing your database first if you want a fresh start.
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}




