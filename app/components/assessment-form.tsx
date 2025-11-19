"use client"

import { useState, useMemo, useCallback, useEffect } from "react"
import { 
    assessmentPhases, 
    getTest, 
    type AssessmentPhase, 
    type AssessmentTest,
    calculateASQAllSections,
    type ASQZone
} from "~/data/testQuestions"
import { Stepper, type StepperStep } from "~/components/ui/stepper"
import { Button } from "~/components/ui/button"
import { Label } from "~/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card"
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
} from "~/components/ui/sheet"
import { ScrollArea } from "~/components/ui/scroll-area"
import { Textarea } from "~/components/ui/textarea"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { toast } from "sonner"

export interface AssessmentAnswer {
    phaseId: string
    testId: string
    questionIndex: number
    answer: string
    score: number
    textAreaValue?: string
}

export interface AssessmentFormProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onComplete?: (answers: AssessmentAnswer[]) => void
}

export function AssessmentForm({ open, onOpenChange, onComplete }: AssessmentFormProps) {
    const [currentPhaseId, setCurrentPhaseId] = useState<string>(assessmentPhases[0]?.id || "")
    const [currentTestId, setCurrentTestId] = useState<string>(
        assessmentPhases[0]?.tests[0]?.id || ""
    )
    const [answers, setAnswers] = useState<Record<string, string>>({})
    const [textAreaAnswers, setTextAreaAnswers] = useState<Record<string, string>>({})
    const [skippedTests, setSkippedTests] = useState<Set<string>>(new Set())
    const [asqResults, setAsqResults] = useState<Array<{ section: string; score: number; zone: ASQZone; interpretation: string }> | null>(null)

    // Initialize current test when phase changes
    useEffect(() => {
        const phase = assessmentPhases.find(p => p.id === currentPhaseId)
        if (phase && phase.tests.length > 0) {
            // If current test is not in current phase, switch to first test
            const testExists = phase.tests.some(t => t.id === currentTestId)
            if (!testExists) {
                setCurrentTestId(phase.tests[0].id)
            }
        }
    }, [currentPhaseId, currentTestId])

    // Reset ASQ results when test changes
    useEffect(() => {
        setAsqResults(null)
    }, [currentTestId])

    const currentPhase = assessmentPhases.find(p => p.id === currentPhaseId)
    const currentTest = currentPhase ? getTest(currentPhaseId, currentTestId) : undefined

    // Check if a test is completed (all questions answered)
    const isTestCompleted = useCallback((phaseId: string, testId: string): boolean => {
        const test = getTest(phaseId, testId)
        if (!test) return false

        return test.questions.every((question, index) => {
            const key = `${phaseId}-${testId}-${index}`
            const answer = answers[key]
            if (!answer || answer === "") return false
            
            // If question has text area and the enabled answer is selected, text area must be filled
            if (question.hasTextArea && question.textAreaEnabledOn && answer === question.textAreaEnabledOn) {
                return textAreaAnswers[key] !== undefined && textAreaAnswers[key] !== ""
            }
            
            return true
        })
    }, [answers, textAreaAnswers])

    // Get all phases and tests for stepper
    const stepperSteps: StepperStep[] = useMemo(() => {
        return assessmentPhases.map(phase => ({
            id: phase.id,
            label: phase.name,
            description: phase.description,
            tests: phase.tests.map(test => {
                const isCompleted = isTestCompleted(phase.id, test.id)
                return {
                    id: test.id,
                    label: test.name,
                    completed: isCompleted,
                }
            }),
        }))
    }, [isTestCompleted])

    // Check if a phase is completed (all tests completed)
    const isPhaseCompleted = useCallback((phaseId: string): boolean => {
        const phase = assessmentPhases.find(p => p.id === phaseId)
        if (!phase) return false

        return phase.tests.every(test => {
            const testKey = `${phaseId}-${test.id}`
            return skippedTests.has(testKey) || isTestCompleted(phaseId, test.id)
        })
    }, [isTestCompleted, skippedTests])

    // Handle answer change
    const handleAnswerChange = useCallback((questionIndex: number, answer: string) => {
        if (!currentPhase || !currentTest) return

        const key = `${currentPhaseId}-${currentTestId}-${questionIndex}`
        setAnswers(prev => ({ ...prev, [key]: answer }))
        
        // Clear text area if the answer doesn't match the enabled condition
        const question = currentTest.questions[questionIndex]
        if (question?.hasTextArea && question.textAreaEnabledOn && answer !== question.textAreaEnabledOn) {
            setTextAreaAnswers(prev => {
                const newAnswers = { ...prev }
                delete newAnswers[key]
                return newAnswers
            })
        }
    }, [currentPhase, currentTest, currentPhaseId, currentTestId])

    // Handle text area change
    const handleTextAreaChange = useCallback((questionIndex: number, value: string) => {
        if (!currentPhase || !currentTest) return

        const key = `${currentPhaseId}-${currentTestId}-${questionIndex}`
        setTextAreaAnswers(prev => ({ ...prev, [key]: value }))
    }, [currentPhase, currentTest, currentPhaseId, currentTestId])

    // Get answer for a question
    const getAnswer = useCallback((questionIndex: number): string => {
        const key = `${currentPhaseId}-${currentTestId}-${questionIndex}`
        return answers[key] || ""
    }, [currentPhaseId, currentTestId, answers])

    // Get text area answer for a question
    const getTextAreaAnswer = useCallback((questionIndex: number): string => {
        const key = `${currentPhaseId}-${currentTestId}-${questionIndex}`
        return textAreaAnswers[key] || ""
    }, [currentPhaseId, currentTestId, textAreaAnswers])

    // Navigate to next test/phase
    const handleNext = useCallback(() => {
        if (!currentPhase) return

        const currentTestIndex = currentPhase.tests.findIndex(t => t.id === currentTestId)
        
        // Move to next test in current phase
        if (currentTestIndex < currentPhase.tests.length - 1) {
            setCurrentTestId(currentPhase.tests[currentTestIndex + 1].id)
            return
        }

        // Move to first test of next phase
        const currentPhaseIndex = assessmentPhases.findIndex(p => p.id === currentPhaseId)
        if (currentPhaseIndex < assessmentPhases.length - 1) {
            const nextPhase = assessmentPhases[currentPhaseIndex + 1]
            setCurrentPhaseId(nextPhase.id)
            setCurrentTestId(nextPhase.tests[0]?.id || "")
        }
    }, [currentPhase, currentPhaseId, currentTestId])

    // Navigate to previous test/phase
    const handlePrevious = useCallback(() => {
        if (!currentPhase) return

        const currentTestIndex = currentPhase.tests.findIndex(t => t.id === currentTestId)
        
        // Move to previous test in current phase
        if (currentTestIndex > 0) {
            setCurrentTestId(currentPhase.tests[currentTestIndex - 1].id)
            return
        }

        // Move to last test of previous phase
        const currentPhaseIndex = assessmentPhases.findIndex(p => p.id === currentPhaseId)
        if (currentPhaseIndex > 0) {
            const prevPhase = assessmentPhases[currentPhaseIndex - 1]
            setCurrentPhaseId(prevPhase.id)
            setCurrentTestId(prevPhase.tests[prevPhase.tests.length - 1]?.id || "")
        }
    }, [currentPhase, currentPhaseId, currentTestId])

    // Jump to a specific phase
    const handlePhaseClick = useCallback((phaseId: string) => {
        const phase = assessmentPhases.find(p => p.id === phaseId)
        if (phase) {
            setCurrentPhaseId(phaseId)
            setCurrentTestId(phase.tests[0]?.id || "")
        }
    }, [])

    // Check if we can go next
    const canGoNext = useMemo(() => {
        const currentPhaseIndex = assessmentPhases.findIndex(p => p.id === currentPhaseId)
        const currentTestIndex = currentPhase?.tests.findIndex(t => t.id === currentTestId) ?? -1
        
        // Can go next if not at the last test of the last phase
        if (currentPhaseIndex === assessmentPhases.length - 1) {
            return currentTestIndex < (currentPhase?.tests.length ?? 0) - 1
        }
        return true
    }, [currentPhaseId, currentTestId, currentPhase])

    // Check if we can go previous
    const canGoPrevious = useMemo(() => {
        const currentPhaseIndex = assessmentPhases.findIndex(p => p.id === currentPhaseId)
        const currentTestIndex = currentPhase?.tests.findIndex(t => t.id === currentTestId) ?? -1
        
        // Can go previous if not at the first test of the first phase
        if (currentPhaseIndex === 0) {
            return currentTestIndex > 0
        }
        return true
    }, [currentPhaseId, currentTestId, currentPhase])

    // Convert answers to AssessmentAnswer format
    const getAssessmentAnswers = useCallback((): AssessmentAnswer[] => {
        const result: AssessmentAnswer[] = []
        
        assessmentPhases.forEach(phase => {
            phase.tests.forEach(test => {
                const testKey = `${phase.id}-${test.id}`
                // Skip if test was skipped
                if (skippedTests.has(testKey)) return

                test.questions.forEach((question, index) => {
                    const key = `${phase.id}-${test.id}-${index}`
                    const answer = answers[key]
                    if (answer) {
                        const optionIndex = question.options.indexOf(answer)
                        const score = optionIndex >= 0 ? question.weights[optionIndex] : 0
                        const textAreaValue = textAreaAnswers[key]
                        result.push({
                            phaseId: phase.id,
                            testId: test.id,
                            questionIndex: index,
                            answer,
                            score,
                            textAreaValue: textAreaValue || undefined,
                        })
                    }
                })
            })
        })

        return result
    }, [answers, textAreaAnswers, skippedTests])

    // Handle ASQ test submission
    const handleSubmitASQ = useCallback(() => {
        if (currentTestId !== "asq") return
        
        const results = calculateASQAllSections(currentPhaseId, currentTestId, answers)
        setAsqResults(results)
        
        // Also save the answers
        const assessmentAnswers = getAssessmentAnswers()
        onComplete?.(assessmentAnswers)
        
        toast.success("Test ASQ guardado y calculado", {
            description: "Los resultados se muestran a continuación",
        })
    }, [currentPhaseId, currentTestId, answers, getAssessmentAnswers, onComplete])

    // Handle form completion
    const handleComplete = useCallback(() => {
        const assessmentAnswers = getAssessmentAnswers()
        onComplete?.(assessmentAnswers)
        onOpenChange(false)
    }, [getAssessmentAnswers, onComplete, onOpenChange])

    // Get progress summary
    const progressSummary = useMemo(() => {
        let totalTests = 0
        let completedTests = 0

        assessmentPhases.forEach(phase => {
            phase.tests.forEach(test => {
                totalTests++
                if (isTestCompleted(phase.id, test.id)) {
                    completedTests++
                }
            })
        })

        return { completed: completedTests, total: totalTests }
    }, [isTestCompleted])

    if (!currentPhase || !currentTest) {
        return null
    }

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent 
                side="bottom" 
                className="!w-full !max-w-full !h-screen !max-h-screen !top-0 !bottom-0 !left-0 !right-0 !inset-x-0 p-0 flex flex-col border-t-2 border-border rounded-none"
            >
                <SheetHeader className="px-6 py-3 border-b-2 border-border flex-shrink-0">
                    <SheetTitle className="text-base">Evaluación de Desarrollo y Comportamiento</SheetTitle>
                    <SheetDescription className="text-xs">
                        Complete las pruebas de evaluación. Todas las pruebas son opcionales y pueden ser omitidas.
                    </SheetDescription>
                </SheetHeader>

                <div className="flex-1 overflow-hidden flex flex-row min-h-0">
                    {/* Main Content Area */}
                    <ScrollArea className="flex-1">
                        <div className="px-6 py-4">
                            {/* Current Test */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>{currentTest.name}</CardTitle>
                                    {currentTest.description && (
                                        <CardDescription>{currentTest.description}</CardDescription>
                                    )}
                                    <div className="text-sm text-muted-foreground mt-2">
                                        Fase: {currentPhase.name} • Test {currentPhase.tests.findIndex(t => t.id === currentTestId) + 1} de {currentPhase.tests.length}
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    {(() => {
                                        // Group questions by section
                                        const sections = new Map<string, Array<{ question: typeof currentTest.questions[0], index: number }>>()
                                        
                                        currentTest.questions.forEach((question, index) => {
                                            const section = question.section || "General"
                                            if (!sections.has(section)) {
                                                sections.set(section, [])
                                            }
                                            sections.get(section)!.push({ question, index })
                                        })
                                        
                                        return Array.from(sections.entries()).map(([sectionName, questions]) => (
                                            <div key={sectionName} className="space-y-4">
                                                {sectionName !== "General" && (
                                                    <div className="border-b-2 border-border pb-2">
                                                        <h3 className="text-lg font-heading text-foreground">{sectionName}</h3>
                                                    </div>
                                                )}
                                                {questions.map(({ question, index }) => (
                                                    <div key={index} className="space-y-3">
                                                        <Label className="text-base">
                                                            {index + 1}. {question.question}
                                                        </Label>
                                                        <div className="space-y-2">
                                                            {question.options.map((option) => {
                                                                const answerKey = `${currentPhaseId}-${currentTestId}-${index}`
                                                                const isSelected = answers[answerKey] === option
                                                                return (
                                                                    <label
                                                                        key={option}
                                                                        className={`
                                                                            flex items-center space-x-2 cursor-pointer p-3 rounded-base border-2 transition-all
                                                                            ${isSelected 
                                                                                ? "bg-main/20 border-main" 
                                                                                : "bg-secondary-background border-border hover:bg-accent"
                                                                            }
                                                                        `}
                                                                    >
                                                                        <input
                                                                            type="radio"
                                                                            name={`question-${currentPhaseId}-${currentTestId}-${index}`}
                                                                            value={option}
                                                                            checked={isSelected}
                                                                            onChange={(e) => handleAnswerChange(index, e.target.value)}
                                                                            className="cursor-pointer"
                                                                        />
                                                                        <span className="flex-1">{option}</span>
                                                                    </label>
                                                                )
                                                            })}
                                                        </div>
                                                        {question.hasTextArea && (
                                                            <div className="mt-3 space-y-2">
                                                                <Label className="text-sm text-muted-foreground">
                                                                    {question.textAreaLabel || "Explique:"}
                                                                </Label>
                                                                <Textarea
                                                                    value={getTextAreaAnswer(index)}
                                                                    onChange={(e) => handleTextAreaChange(index, e.target.value)}
                                                                    disabled={!question.textAreaEnabledOn || getAnswer(index) !== question.textAreaEnabledOn}
                                                                    placeholder={
                                                                        question.textAreaEnabledOn && getAnswer(index) === question.textAreaEnabledOn
                                                                            ? "Escriba su explicación aquí..."
                                                                            : `Seleccione '${question.textAreaEnabledOn}' para habilitar`
                                                                    }
                                                                    className="min-h-[100px]"
                                                                />
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        ))
                                    })()}
                                </CardContent>
                            </Card>

                            {/* ASQ Results */}
                            {currentTestId === "asq" && asqResults && asqResults.length > 0 && (
                                <Card className="mt-4">
                                    <CardHeader>
                                        <CardTitle>Resultados del ASQ</CardTitle>
                                        <CardDescription>
                                            Puntuaciones e interpretación por sección
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        {asqResults.map((result) => (
                                            <div
                                                key={result.section}
                                                className={`
                                                    p-4 rounded-base border-2
                                                    ${result.zone === "BLACK" 
                                                        ? "bg-red-500/20 border-red-500" 
                                                        : result.zone === "GREY"
                                                        ? "bg-yellow-500/20 border-yellow-500"
                                                        : "bg-green-500/20 border-green-500"
                                                    }
                                                `}
                                            >
                                                <div className="flex items-center justify-between mb-2">
                                                    <h4 className="font-heading text-base">{result.section}</h4>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm font-medium">
                                                            Puntaje: {result.score}
                                                        </span>
                                                        <span
                                                            className={`
                                                                px-2 py-1 rounded text-xs font-heading uppercase
                                                                ${result.zone === "BLACK"
                                                                    ? "bg-red-500 text-white"
                                                                    : result.zone === "GREY"
                                                                    ? "bg-yellow-500 text-white"
                                                                    : "bg-green-500 text-white"
                                                                }
                                                            `}
                                                        >
                                                            {result.zone === "BLACK" ? "Negra" : result.zone === "GREY" ? "Gris" : "Blanca"}
                                                        </span>
                                                    </div>
                                                </div>
                                                <p className="text-sm text-muted-foreground">
                                                    {result.interpretation}
                                                </p>
                                            </div>
                                        ))}
                                    </CardContent>
                                </Card>
                            )}

                            {/* Progress Summary */}
                            <div className="text-sm text-muted-foreground text-center mt-4 pb-2">
                                Progreso: {progressSummary.completed} de {progressSummary.total} pruebas completadas
                            </div>
                        </div>
                    </ScrollArea>

                    {/* Vertical Stepper on Right */}
                    <div className="w-64 border-l-2 border-border p-4 bg-secondary-background flex-shrink-0 overflow-y-auto">
                        <div className="sticky top-0">
                            <div className="text-xs font-heading text-muted-foreground mb-3 uppercase">Fases</div>
                            <Stepper
                                steps={stepperSteps}
                                currentStepId={currentPhaseId}
                                onStepClick={handlePhaseClick}
                                orientation="vertical"
                            />
                        </div>
                    </div>
                </div>

                <SheetFooter className="flex flex-col sm:flex-row gap-2 px-6 pb-6 pt-4 border-t-2 border-border flex-shrink-0">
                    <div className="flex gap-2 flex-1">
                        <Button
                            type="button"
                            variant="neutral"
                            onClick={handlePrevious}
                            disabled={!canGoPrevious}
                        >
                            <ChevronLeft className="w-4 h-4" />
                            Anterior
                        </Button>
                    </div>
                    <div className="flex gap-2">
                        {currentTestId === "asq" && (
                            <Button
                                type="button"
                                variant="default"
                                onClick={handleSubmitASQ}
                            >
                                Guardar y Calcular Resultados
                            </Button>
                        )}
                        <Button
                            type="button"
                            variant="neutral"
                            onClick={() => onOpenChange(false)}
                        >
                            Cancelar
                        </Button>
                        {canGoNext ? (
                            <Button
                                type="button"
                                onClick={handleNext}
                            >
                                Siguiente
                                <ChevronRight className="w-4 h-4" />
                            </Button>
                        ) : (
                            <Button
                                type="button"
                                onClick={handleComplete}
                            >
                                Completar Evaluación
                            </Button>
                        )}
                    </div>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    )
}

