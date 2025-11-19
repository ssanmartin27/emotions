"use client"

import { useState, useCallback, useMemo } from "react"
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
} from "~/components/ui/sheet"
import { ScrollArea } from "~/components/ui/scroll-area"
import { Button } from "~/components/ui/button"
import { Label } from "~/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card"
import { Badge } from "~/components/ui/badge"
import { toast } from "sonner"

export interface CDIAnswer {
    questionIndex: number
    answer: "A" | "B" | "C" | null
    score: number
}

export interface CDIFormProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onComplete?: (answers: CDIAnswer[], totalScore: number, hasDepression: boolean) => void
}

const CDI_QUESTIONS = [
    {
        question: "Estoy triste de vez en cuando.",
        options: [
            { label: "Estoy triste de vez en cuando.", value: "A", score: 0 },
            { label: "Estoy triste muchas veces.", value: "B", score: 1 },
            { label: "Estoy triste siempre.", value: "C", score: 2 },
        ]
    },
    {
        question: "Nunca me saldrá nada bien.",
        options: [
            { label: "Nunca me saldrá nada bien.", value: "A", score: 0 },
            { label: "No estoy seguro de si las cosas me saldrán bien.", value: "B", score: 1 },
            { label: "Las cosas me saldrán bien.", value: "C", score: 2 },
        ]
    },
    {
        question: "Hago bien la mayoría de las cosas.",
        options: [
            { label: "Hago bien la mayoría de las cosas.", value: "A", score: 0 },
            { label: "Hago mal muchas cosas.", value: "B", score: 1 },
            { label: "Todo lo hago mal.", value: "C", score: 2 },
        ]
    },
    {
        question: "Me divierten muchas cosas.",
        options: [
            { label: "Me divierten muchas cosas.", value: "A", score: 0 },
            { label: "Me divierten algunas cosas.", value: "B", score: 1 },
            { label: "Nada me divierte.", value: "C", score: 2 },
        ]
    },
    {
        question: "Soy malo siempre.",
        options: [
            { label: "Soy malo algunas veces.", value: "A", score: 0 },
            { label: "Soy malo muchas veces.", value: "B", score: 1 },
            { label: "Soy malo siempre.", value: "C", score: 2 },
        ]
    },
    {
        question: "A veces pienso que me pueden ocurrir cosas malas.",
        options: [
            { label: "A veces pienso que me pueden ocurrir cosas malas.", value: "A", score: 0 },
            { label: "Me preocupa que me ocurran cosas malas.", value: "B", score: 1 },
            { label: "Estoy seguro de que me van a ocurrir cosas terribles.", value: "C", score: 2 },
        ]
    },
    {
        question: "Me odio.",
        options: [
            { label: "Me gusta como soy.", value: "A", score: 0 },
            { label: "No me gusta como soy.", value: "B", score: 1 },
            { label: "Me odio.", value: "C", score: 2 },
        ]
    },
    {
        question: "Todas las cosas malas son culpa mía.",
        options: [
            { label: "Generalmente no tengo la culpa de que ocurran cosas malas.", value: "A", score: 0 },
            { label: "Muchas cosas malas son culpa mía.", value: "B", score: 1 },
            { label: "Todas las cosas malas son culpa mía.", value: "C", score: 2 },
        ]
    },
    {
        question: "No pienso en matarme.",
        options: [
            { label: "No pienso en matarme.", value: "A", score: 0 },
            { label: "Pienso en matarme pero no lo haría.", value: "B", score: 1 },
            { label: "Quiero matarme.", value: "C", score: 2 },
        ]
    },
    {
        question: "Tengo ganas de llorar todos los días.",
        options: [
            { label: "Tengo ganas de llorar de cuando en cuando.", value: "A", score: 0 },
            { label: "Tengo ganas de llorar muchos días.", value: "B", score: 1 },
            { label: "Tengo ganas de llorar todos los días.", value: "C", score: 2 },
        ]
    },
    {
        question: "Las cosas me preocupan siempre.",
        options: [
            { label: "Las cosas me preocupan de cuando en cuando.", value: "A", score: 0 },
            { label: "Las cosas me preocupan muchas veces.", value: "B", score: 1 },
            { label: "Las cosas me preocupan siempre.", value: "C", score: 2 },
        ]
    },
    {
        question: "Me gusta estar con la gente.",
        options: [
            { label: "Me gusta estar con la gente.", value: "A", score: 0 },
            { label: "Muy a menudo no me gusta estar con la gente.", value: "B", score: 1 },
            { label: "No quiero en absoluto estar con la gente.", value: "C", score: 2 },
        ]
    },
    {
        question: "No puedo decidirme.",
        options: [
            { label: "Me decido fácilmente.", value: "A", score: 0 },
            { label: "Me cuesta decidirme.", value: "B", score: 1 },
            { label: "No puedo decidirme.", value: "C", score: 2 },
        ]
    },
    {
        question: "Tengo buen aspecto.",
        options: [
            { label: "Tengo buen aspecto.", value: "A", score: 0 },
            { label: "Hay algunas cosas de mi aspecto que no me gustan.", value: "B", score: 1 },
            { label: "Soy feo.", value: "C", score: 2 },
        ]
    },
    {
        question: "Siempre me cuesta ponerme a hacer los deberes.",
        options: [
            { label: "No me cuesta ponerme a hacer los deberes.", value: "A", score: 0 },
            { label: "Muchas veces me cuesta ponerme a hacer los deberes.", value: "B", score: 1 },
            { label: "Siempre me cuesta ponerme a hacer los deberes.", value: "C", score: 2 },
        ]
    },
    {
        question: "Todas las noches me cuesta dormirme.",
        options: [
            { label: "Duermo muy bien.", value: "A", score: 0 },
            { label: "Muchas noches me cuesta dormirme.", value: "B", score: 1 },
            { label: "Todas las noches me cuesta dormirme.", value: "C", score: 2 },
        ]
    },
    {
        question: "Estoy cansado de cuando en cuando.",
        options: [
            { label: "Estoy cansado de cuando en cuando.", value: "A", score: 0 },
            { label: "Estoy cansado muchos días.", value: "B", score: 1 },
            { label: "Estoy cansado siempre.", value: "C", score: 2 },
        ]
    },
    {
        question: "La mayoría de los días no tengo ganas de comer.",
        options: [
            { label: "Como muy bien.", value: "A", score: 0 },
            { label: "Muchos días no tengo ganas de comer.", value: "B", score: 1 },
            { label: "La mayoría de los días no tengo ganas de comer.", value: "C", score: 2 },
        ]
    },
    {
        question: "No me preocupa el dolor ni la enfermedad.",
        options: [
            { label: "No me preocupa el dolor ni la enfermedad.", value: "A", score: 0 },
            { label: "Muchas veces me preocupa el dolor y la enfermedad.", value: "B", score: 1 },
            { label: "Siempre me preocupa el dolor y la enfermedad.", value: "C", score: 2 },
        ]
    },
    {
        question: "Nunca me siento solo.",
        options: [
            { label: "Nunca me siento solo.", value: "A", score: 0 },
            { label: "Me siento solo muchas veces.", value: "B", score: 1 },
            { label: "Me siento solo siempre.", value: "C", score: 2 },
        ]
    },
    {
        question: "Nunca me divierto en el colegio.",
        options: [
            { label: "Me divierto en el colegio muchas veces.", value: "A", score: 0 },
            { label: "Me divierto en el colegio sólo de vez en cuando.", value: "B", score: 1 },
            { label: "Nunca me divierto en el colegio.", value: "C", score: 2 },
        ]
    },
    {
        question: "Tengo muchos amigos.",
        options: [
            { label: "Tengo muchos amigos.", value: "A", score: 0 },
            { label: "Tengo muchos amigos pero me gustaría tener más.", value: "B", score: 1 },
            { label: "No tengo amigos.", value: "C", score: 2 },
        ]
    },
    {
        question: "Mi trabajo en el colegio es bueno.",
        options: [
            { label: "Mi trabajo en el colegio es bueno.", value: "A", score: 0 },
            { label: "Mi trabajo en el colegio no es tan bueno como antes.", value: "B", score: 1 },
            { label: "Llevo muy mal las asignaturas que antes llevaba bien.", value: "C", score: 2 },
        ]
    },
    {
        question: "Nunca podré ser tan bueno como otros niños.",
        options: [
            { label: "Soy tan bueno como otros niños.", value: "A", score: 0 },
            { label: "Si quiero puedo ser tan bueno como otros niños.", value: "B", score: 1 },
            { label: "Nunca podré ser tan bueno como otros niños.", value: "C", score: 2 },
        ]
    },
    {
        question: "Nadie me quiere.",
        options: [
            { label: "Estoy seguro de que alguien me quiere.", value: "A", score: 0 },
            { label: "No estoy seguro de que alguien me quiera.", value: "B", score: 1 },
            { label: "Nadie me quiere.", value: "C", score: 2 },
        ]
    },
    {
        question: "Generalmente hago lo que me dicen.",
        options: [
            { label: "Generalmente hago lo que me dicen.", value: "A", score: 0 },
            { label: "Muchas veces no hago lo que me dicen.", value: "B", score: 1 },
            { label: "Nunca hago lo que me dicen.", value: "C", score: 2 },
        ]
    },
    {
        question: "Me llevo bien con la gente.",
        options: [
            { label: "Me llevo bien con la gente.", value: "A", score: 0 },
            { label: "Me peleo muchas veces.", value: "B", score: 1 },
            { label: "Me peleo siempre.", value: "C", score: 2 },
        ]
    },
]

const CUTOFF_SCORE = 19

export function CDIForm({ open, onOpenChange, onComplete }: CDIFormProps) {
    const [answers, setAnswers] = useState<Map<number, "A" | "B" | "C">>(new Map())

    const handleAnswerChange = useCallback((questionIndex: number, value: "A" | "B" | "C") => {
        setAnswers(prev => {
            const newMap = new Map(prev)
            newMap.set(questionIndex, value)
            return newMap
        })
    }, [])

    const totalScore = useMemo(() => {
        let score = 0
        answers.forEach((answer, questionIndex) => {
            const question = CDI_QUESTIONS[questionIndex]
            const option = question.options.find(opt => opt.value === answer)
            if (option) {
                score += option.score
            }
        })
        return score
    }, [answers])

    const hasDepression = useMemo(() => {
        return totalScore >= CUTOFF_SCORE
    }, [totalScore])

    const answeredCount = answers.size
    const totalQuestions = CDI_QUESTIONS.length
    const isComplete = answeredCount === totalQuestions

    const handleSubmit = useCallback(() => {
        if (!isComplete) {
            toast.error("Por favor responda todas las preguntas")
            return
        }

        const cdiAnswers: CDIAnswer[] = CDI_QUESTIONS.map((_, index) => {
            const answer = answers.get(index) || null
            const question = CDI_QUESTIONS[index]
            const option = answer ? question.options.find(opt => opt.value === answer) : null
            return {
                questionIndex: index,
                answer: answer,
                score: option?.score || 0,
            }
        })

        onComplete?.(cdiAnswers, totalScore, hasDepression)
        toast.success("Cuestionario CDI completado")
        onOpenChange(false)
    }, [answers, isComplete, totalScore, hasDepression, onComplete, onOpenChange])

    const handleClose = useCallback(() => {
        onOpenChange(false)
    }, [onOpenChange])

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="bottom" className="h-[95vh] flex flex-col p-0">
                <SheetHeader className="px-6 pt-6 pb-4 border-b">
                    <SheetTitle>CDI - Cuestionario de Depresión Infantil</SheetTitle>
                    <SheetDescription>
                        Este es un cuestionario que tiene oraciones que están en grupos de tres.
                        Escoge en cada grupo una oración, la que mejor diga cómo te has portado o cómo te has sentido en las ÚLTIMAS DOS SEMANAS.
                        No hay respuesta correcta ni falsa. Contesta con sinceridad.
                    </SheetDescription>
                </SheetHeader>
                <ScrollArea className="flex-1 px-6 py-4">
                    <div className="space-y-6 pb-4">
                        {CDI_QUESTIONS.map((question, index) => {
                            const selectedAnswer = answers.get(index)
                            return (
                                <Card key={index}>
                                    <CardContent className="pt-6">
                                        <Label className="text-base font-semibold mb-4 block">
                                            {index + 1}. {question.question}
                                        </Label>
                                        <div className="space-y-2">
                                            {question.options.map((option) => {
                                                const isSelected = selectedAnswer === option.value
                                                return (
                                                    <label
                                                        key={option.value}
                                                        className={`
                                                            flex items-start space-x-3 cursor-pointer p-3 rounded-base border-2 transition-all
                                                            ${isSelected 
                                                                ? "bg-main/20 border-main" 
                                                                : "bg-secondary-background border-border hover:bg-accent"
                                                            }
                                                        `}
                                                    >
                                                        <input
                                                            type="radio"
                                                            name={`cdi-question-${index}`}
                                                            value={option.value}
                                                            checked={isSelected}
                                                            onChange={() => handleAnswerChange(index, option.value)}
                                                            className="mt-1 cursor-pointer"
                                                        />
                                                        <span className="flex-1 text-sm">{option.label}</span>
                                                    </label>
                                                )
                                            })}
                                        </div>
                                    </CardContent>
                                </Card>
                            )
                        })}
                    </div>
                </ScrollArea>
                <SheetFooter className="px-6 py-4 border-t bg-background">
                    <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-4">
                            <span className="text-sm text-muted-foreground">
                                Progreso: {answeredCount}/{totalQuestions}
                            </span>
                            {totalScore > 0 && (
                                <Badge variant="outline">
                                    Puntuación: {totalScore}/54
                                </Badge>
                            )}
                            {isComplete && (
                                <Badge variant={hasDepression ? "destructive" : "default"}>
                                    {hasDepression ? "Depresión presente (≥19)" : "Sin depresión (<19)"}
                                </Badge>
                            )}
                        </div>
                        <div className="flex gap-2">
                            <Button variant="neutral" onClick={handleClose}>
                                Cancelar
                            </Button>
                            <Button onClick={handleSubmit} disabled={!isComplete}>
                                Guardar y Cerrar
                            </Button>
                        </div>
                    </div>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    )
}

