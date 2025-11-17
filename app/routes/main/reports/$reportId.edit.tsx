"use client"

import * as React from "react"
import { useState, useCallback, useMemo, type FormEvent } from "react"
import { useQuery, useMutation } from "convex/react"
import { api } from "convex/_generated/api"
import { useParams, useNavigate } from "react-router"
import type { Id } from "convex/_generated/dataModel"

import { toast } from "sonner"
import { Button } from "~/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card"
import { Label } from "~/components/ui/label"
import { Input } from "~/components/ui/input"
import { Textarea } from "~/components/ui/textarea"
import { cn } from "~/lib/utils"
import { testQuestions, type TestQuestion } from "~/data/testQuestions"
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "~/components/ui/accordion"
import { CheckCircle2, Circle } from "lucide-react"

type EmotionKey = "anger" | "sadness" | "anxiety" | "fear" | "happiness" | "guilt"

export default function EditReportPage() {
    const { reportId } = useParams()
    const navigate = useNavigate()
    
    const report = useQuery(api.report.getReportById, { 
        reportId: reportId as Id<"reports">
    })
    const updateReport = useMutation(api.report.updateReport)

    const [textContent, setTextContent] = useState("")
    const [emotionData, setEmotionData] = useState<Record<EmotionKey, number>>({
        anger: 0,
        sadness: 0,
        anxiety: 0,
        fear: 0,
        happiness: 0,
        guilt: 0,
    })
    const [testAnswers, setTestAnswers] = useState<Record<number, string>>({})
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Initialize form data when report loads
    React.useEffect(() => {
        if (report) {
            setTextContent(report.text || "")
            setEmotionData({
                anger: report.emotionData?.anger || 0,
                sadness: report.emotionData?.sadness || 0,
                anxiety: report.emotionData?.anxiety || 0,
                fear: report.emotionData?.fear || 0,
                happiness: report.emotionData?.happiness || 0,
                guilt: report.emotionData?.guilt || 0,
            })
            // Initialize test answers if test results exist
            if (report.testResults && report.testResults.length > 0) {
                const answers: Record<number, string> = {}
                report.testResults.forEach((result, index) => {
                    const question = testQuestions.find(q => q.question === result.question)
                    if (question) {
                        answers[testQuestions.indexOf(question)] = result.answer
                    }
                })
                setTestAnswers(answers)
            }
        }
    }, [report])

    const handleEmotionChange = useCallback((emotion: EmotionKey, value: number) => {
        setEmotionData(prev => ({ ...prev, [emotion]: value }))
    }, [])

    const handleTestAnswer = (questionIndex: number, answer: string) => {
        setTestAnswers(prev => ({ ...prev, [questionIndex]: answer }))
    }

    const testResults = useMemo(() => {
        if (Object.keys(testAnswers).length === 0) return undefined

        return testQuestions.map((question, index) => {
            const answer = testAnswers[index] || ""
            const optionIndex = question.options.indexOf(answer)
            const score = optionIndex >= 0 ? question.weights[optionIndex] : 0

            return {
                question: question.question,
                answer,
                score,
            }
        })
    }, [testAnswers])

    async function handleSubmit(event: FormEvent) {
        event.preventDefault()

        if (!textContent.trim()) {
            toast.error("Please enter report text")
            return
        }

        if (!reportId) {
            toast.error("Report ID is missing")
            return
        }

        setIsSubmitting(true)

        try {
            await updateReport({
                reportId: reportId as Id<"reports">,
                text: textContent,
                emotionData: {
                    anger: emotionData.anger || undefined,
                    sadness: emotionData.sadness || undefined,
                    anxiety: emotionData.anxiety || undefined,
                    fear: emotionData.fear || undefined,
                    happiness: emotionData.happiness || undefined,
                    guilt: emotionData.guilt || undefined,
                },
                testResults,
            })

            toast.success("Report updated successfully")
            navigate(`/therapist/reports/${reportId}`)
        } catch (error) {
            toast.error("Failed to update report")
            console.error(error)
        } finally {
            setIsSubmitting(false)
        }
    }

    if (!report) {
        return (
            <div className="p-6">
                <p>Loading report...</p>
            </div>
        )
    }

    const emotionConfigs = {
        anger: { 
            label: "Anger", 
            emoji: "😠", 
            bgColor: "bg-chart-1/20",
            textColor: "text-foreground",
            activeColor: "bg-chart-1",
            borderColor: "border-chart-1",
        },
        sadness: { 
            label: "Sadness", 
            emoji: "😢", 
            bgColor: "bg-chart-2/20",
            textColor: "text-foreground",
            activeColor: "bg-chart-2",
            borderColor: "border-chart-2",
        },
        anxiety: { 
            label: "Anxiety", 
            emoji: "😰", 
            bgColor: "bg-chart-3/20",
            textColor: "text-foreground",
            activeColor: "bg-chart-3",
            borderColor: "border-chart-3",
        },
        fear: { 
            label: "Fear", 
            emoji: "😨", 
            bgColor: "bg-chart-4/20",
            textColor: "text-foreground",
            activeColor: "bg-chart-4",
            borderColor: "border-chart-4",
        },
        happiness: { 
            label: "Happiness", 
            emoji: "😊", 
            bgColor: "bg-chart-5/20",
            textColor: "text-foreground",
            activeColor: "bg-chart-5",
            borderColor: "border-chart-5",
        },
        guilt: { 
            label: "Guilt", 
            emoji: "😔", 
            bgColor: "bg-chart-6/20",
            textColor: "text-foreground",
            activeColor: "bg-chart-6",
            borderColor: "border-chart-6",
        },
    }

    return (
        <div className="container mx-auto p-6 max-w-6xl">
            <div className="mb-6">
                <h1 className="text-3xl font-bold mb-2">Edit Report</h1>
                <p className="text-muted-foreground">Update the report details and emotional assessment</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Report Text */}
                <Card>
                    <CardHeader>
                        <CardTitle>Report Content</CardTitle>
                        <CardDescription>Enter the main report text</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            <Label htmlFor="text">Report Text</Label>
                            <Textarea
                                id="text"
                                value={textContent}
                                onChange={(e) => setTextContent(e.target.value)}
                                placeholder="Enter report details..."
                                className="min-h-[200px]"
                                required
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Emotion Data */}
                <Card>
                    <CardHeader>
                        <CardTitle>Emotional Assessment</CardTitle>
                        <CardDescription>Rate the emotional states observed (0-5 scale)</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {(Object.keys(emotionConfigs) as EmotionKey[]).map((emotionKey) => {
                                const config = emotionConfigs[emotionKey]
                                const currentValue = emotionData[emotionKey]
                                return (
                                    <Card key={emotionKey} className={cn(config.bgColor, "flex flex-col")}>
                                        <div className="flex items-center gap-3 mb-4">
                                            <span className="text-3xl">{config.emoji}</span>
                                            <div className="flex-1">
                                                <Label className={cn("text-base font-heading", config.textColor)}>
                                                    {config.label}
                                                </Label>
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    {currentValue === 0 ? "Not present" : `Intensity: ${currentValue}/5`}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex flex-wrap gap-2 justify-center">
                                            {[0, 1, 2, 3, 4, 5].map((value) => {
                                                const isSelected = value <= currentValue
                                                return (
                                                    <button
                                                        key={value}
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.preventDefault()
                                                            e.stopPropagation()
                                                            handleEmotionChange(emotionKey, value)
                                                        }}
                                                        className={cn(
                                                            "w-10 h-10 rounded-base font-heading text-sm border-2 shadow-shadow",
                                                            isSelected 
                                                                ? `${config.activeColor} text-main-foreground border-border` 
                                                                : "bg-secondary-background text-foreground border-border hover:bg-accent"
                                                        )}
                                                        aria-label={`Set ${config.label} to ${value}`}
                                                    >
                                                        {value}
                                                    </button>
                                                )
                                            })}
                                        </div>
                                    </Card>
                                )
                            })}
                        </div>
                    </CardContent>
                </Card>

                {/* Test Questions */}
                <Card>
                    <CardHeader>
                        <CardTitle>Assessment Questions</CardTitle>
                        <CardDescription>
                            {report.testResults && report.testResults.length > 0
                                ? "Test was completed. You can update the answers below."
                                : "Test was not completed. Answer the assessment questions below."}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Accordion
                            type="single"
                            collapsible
                            defaultValue={
                                report.testResults && report.testResults.length > 0 ? "test-questions" : undefined
                            }
                        >
                            <AccordionItem value="test-questions">
                                <AccordionTrigger>
                                    {report.testResults && report.testResults.length > 0
                                        ? "Test Results (Click to expand/edit)"
                                        : "Answer Assessment Questions (Click to expand)"}
                                </AccordionTrigger>
                                <AccordionContent>
                                    <div className="space-y-4 pt-2">
                                        {testQuestions.map((question, index) => {
                                            const selectedAnswer = testAnswers[index]
                                            const isAnswered = !!selectedAnswer
                                            return (
                                                <div key={index} className="space-y-2">
                                                    <div className="flex items-center gap-2">
                                                        <Label className="text-base font-semibold">
                                                            {question.question}
                                                        </Label>
                                                        {isAnswered && (
                                                            <CheckCircle2 className="size-4 text-primary" />
                                                        )}
                                                    </div>
                                                    <div className="flex flex-col gap-2">
                                                        {question.options.map((option) => {
                                                            const isSelected = selectedAnswer === option
                                                            return (
                                                                <label
                                                                    key={option}
                                                                    className={cn(
                                                                        "flex items-center gap-3 p-3 rounded-base border-2 cursor-pointer transition-all",
                                                                        isSelected
                                                                            ? "border-primary bg-primary/10 shadow-sm"
                                                                            : "border-border hover:bg-accent hover:border-primary/50"
                                                                    )}
                                                                >
                                                                    <input
                                                                        type="radio"
                                                                        name={`question-${index}`}
                                                                        value={option}
                                                                        checked={isSelected}
                                                                        onChange={() => handleTestAnswer(index, option)}
                                                                        className="sr-only"
                                                                    />
                                                                    {isSelected ? (
                                                                        <CheckCircle2 className="size-5 text-primary flex-shrink-0" />
                                                                    ) : (
                                                                        <Circle className="size-5 text-muted-foreground flex-shrink-0" />
                                                                    )}
                                                                    <span className={cn(
                                                                        "flex-1",
                                                                        isSelected && "font-medium text-primary"
                                                                    )}>
                                                                        {option}
                                                                    </span>
                                                                </label>
                                                            )
                                                        })}
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        </Accordion>
                    </CardContent>
                </Card>

                {/* Actions */}
                <div className="flex justify-end gap-4">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => navigate(`/therapist/reports/${reportId}`)}
                    >
                        Cancel
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? "Updating..." : "Update Report"}
                    </Button>
                </div>
            </form>
        </div>
    )
}

