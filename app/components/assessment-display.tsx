"use client"

import { useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card"
import { assessmentPhases, getTest, type AssessmentAnswer } from "~/data/testQuestions"
import { Badge } from "~/components/ui/badge"
import { Separator } from "~/components/ui/separator"

interface AssessmentDisplayProps {
    assessmentData: AssessmentAnswer[]
}

export function AssessmentDisplay({ assessmentData }: AssessmentDisplayProps) {
    // Group answers by phase and test
    const groupedData = useMemo(() => {
        const groups = new Map<string, Map<string, AssessmentAnswer[]>>()
        
        assessmentData.forEach(answer => {
            if (!groups.has(answer.phaseId)) {
                groups.set(answer.phaseId, new Map())
            }
            const phaseMap = groups.get(answer.phaseId)!
            if (!phaseMap.has(answer.testId)) {
                phaseMap.set(answer.testId, [])
            }
            phaseMap.get(answer.testId)!.push(answer)
        })
        
        return groups
    }, [assessmentData])

    if (assessmentData.length === 0) {
        return null
    }

    return (
        <div className="space-y-6">
            {Array.from(groupedData.entries()).map(([phaseId, testsMap]) => {
                const phase = assessmentPhases.find(p => p.id === phaseId)
                if (!phase) return null

                return (
                    <Card key={phaseId}>
                        <CardHeader>
                            <CardTitle>{phase.name}</CardTitle>
                            {phase.description && (
                                <CardDescription>{phase.description}</CardDescription>
                            )}
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {Array.from(testsMap.entries()).map(([testId, answers]) => {
                                const test = getTest(phaseId, testId)
                                if (!test) return null

                                // Sort answers by question index
                                const sortedAnswers = [...answers].sort((a, b) => a.questionIndex - b.questionIndex)

                                // Group answers by section if they have sections
                                const answersBySection = new Map<string, AssessmentAnswer[]>()
                                sortedAnswers.forEach(answer => {
                                    const question = test.questions[answer.questionIndex]
                                    const section = question?.section || "General"
                                    if (!answersBySection.has(section)) {
                                        answersBySection.set(section, [])
                                    }
                                    answersBySection.get(section)!.push(answer)
                                })

                                return (
                                    <div key={testId} className="space-y-4">
                                        <div>
                                            <h4 className="text-lg font-semibold">{test.name}</h4>
                                            {test.description && (
                                                <p className="text-sm text-muted-foreground mt-1">{test.description}</p>
                                            )}
                                        </div>
                                        <Separator />
                                        <div className="space-y-6">
                                            {Array.from(answersBySection.entries()).map(([section, sectionAnswers]) => (
                                                <div key={section} className="space-y-3">
                                                    {section !== "General" && (
                                                        <h5 className="text-md font-semibold text-muted-foreground">{section}</h5>
                                                    )}
                                                    <div className="space-y-3 pl-4">
                                                        {sectionAnswers.map((answer, idx) => {
                                                            const question = test.questions[answer.questionIndex]
                                                            if (!question) return null

                                                            return (
                                                                <div key={`${answer.phaseId}-${answer.testId}-${answer.questionIndex}-${idx}`} className="border rounded-lg p-4 space-y-2">
                                                                    <div className="flex items-start justify-between gap-4">
                                                                        <div className="flex-1">
                                                                            <p className="font-semibold text-sm">
                                                                                {answer.questionIndex + 1}. {question.question}
                                                                            </p>
                                                                        </div>
                                                                        <Badge variant="outline" className="shrink-0">
                                                                            Puntuación: {answer.score}
                                                                        </Badge>
                                                                    </div>
                                                                    <div className="mt-2">
                                                                        <p className="text-sm text-muted-foreground">
                                                                            <span className="font-medium">Respuesta:</span> {answer.answer}
                                                                        </p>
                                                                    </div>
                                                                    {answer.textAreaValue && (
                                                                        <div className="mt-3 p-3 bg-muted/50 rounded-md">
                                                                            <p className="text-xs font-medium text-muted-foreground mb-1">
                                                                                {question.textAreaLabel || "Explicación"}:
                                                                            </p>
                                                                            <p className="text-sm whitespace-pre-wrap">{answer.textAreaValue}</p>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )
                                                        })}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )
                            })}
                        </CardContent>
                    </Card>
                )
            })}
        </div>
    )
}

