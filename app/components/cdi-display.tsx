"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card"
import { Badge } from "~/components/ui/badge"
import { Separator } from "~/components/ui/separator"

interface CDIData {
    answers: Array<{
        questionIndex: number
        answer: "A" | "B" | "C" | null
        score: number
    }>
    totalScore: number
    hasDepression: boolean
}

interface CDIDisplayProps {
    cdiData: CDIData
}

const CDI_QUESTIONS = [
    "Estoy triste de vez en cuando.",
    "Nunca me saldrá nada bien.",
    "Hago bien la mayoría de las cosas.",
    "Me divierten muchas cosas.",
    "Soy malo siempre.",
    "A veces pienso que me pueden ocurrir cosas malas.",
    "Me odio.",
    "Todas las cosas malas son culpa mía.",
    "No pienso en matarme.",
    "Tengo ganas de llorar todos los días.",
    "Las cosas me preocupan siempre.",
    "Me gusta estar con la gente.",
    "No puedo decidirme.",
    "Tengo buen aspecto.",
    "Siempre me cuesta ponerme a hacer los deberes.",
    "Todas las noches me cuesta dormirme.",
    "Estoy cansado de cuando en cuando.",
    "La mayoría de los días no tengo ganas de comer.",
    "No me preocupa el dolor ni la enfermedad.",
    "Nunca me siento solo.",
    "Nunca me divierto en el colegio.",
    "Tengo muchos amigos.",
    "Mi trabajo en el colegio es bueno.",
    "Nunca podré ser tan bueno como otros niños.",
    "Nadie me quiere.",
    "Generalmente hago lo que me dicen.",
    "Me llevo bien con la gente.",
]

export function CDIDisplay({ cdiData }: CDIDisplayProps) {
    const { answers, totalScore, hasDepression } = cdiData

    return (
        <Card>
            <CardHeader>
                <CardTitle>CDI - Cuestionario de Depresión Infantil</CardTitle>
                <CardDescription>
                    Resultados del cuestionario de depresión infantil
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Summary */}
                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                    <div>
                        <p className="text-sm font-medium">Puntuación Total</p>
                        <p className="text-2xl font-bold">{totalScore}/54</p>
                    </div>
                    <Badge variant={hasDepression ? "destructive" : "default"} className="text-lg px-4 py-2">
                        {hasDepression ? "Depresión presente (≥19)" : "Sin depresión (<19)"}
                    </Badge>
                </div>

                <Separator />

                {/* Interpretation */}
                <div className="p-4 bg-blue-500/10 border-2 border-blue-500 rounded-base">
                    <p className="text-sm">
                        <strong>Interpretación:</strong> El punto de corte es de 19 puntos. 
                        {hasDepression 
                            ? " La puntuación obtenida indica presencia de depresión. Se recomienda evaluación adicional por un especialista." 
                            : " La puntuación obtenida indica ausencia de depresión según los criterios del CDI."}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                        Confiabilidad del CDI: 0.71 - 0.94 (71% - 94% de las puntuaciones son verdaderas)
                    </p>
                </div>

                <Separator />

                {/* Answers */}
                <div>
                    <h4 className="text-lg font-semibold mb-4">Respuestas Detalladas</h4>
                    <div className="space-y-3">
                        {answers.map((answer, idx) => {
                            const question = CDI_QUESTIONS[answer.questionIndex]
                            if (!question) return null

                            return (
                                <div key={idx} className="border rounded-lg p-4">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1">
                                            <p className="font-semibold text-sm">
                                                {answer.questionIndex + 1}. {question}
                                            </p>
                                            <p className="text-sm text-muted-foreground mt-1">
                                                Respuesta: <span className="font-medium">{answer.answer || "No respondida"}</span>
                                            </p>
                                        </div>
                                        <Badge variant="outline" className="shrink-0">
                                            Puntuación: {answer.score}
                                        </Badge>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

