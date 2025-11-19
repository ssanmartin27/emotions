import * as React from "react"
import { cn } from "~/lib/utils"
import { Check } from "lucide-react"

export interface StepperStep {
    id: string
    label: string
    description?: string
    tests?: Array<{
        id: string
        label: string
        completed?: boolean
    }>
}

export interface StepperProps {
    steps: StepperStep[]
    currentStepId: string
    onStepClick?: (stepId: string) => void
    className?: string
    orientation?: "horizontal" | "vertical"
}

export function Stepper({ steps, currentStepId, onStepClick, className, orientation = "horizontal" }: StepperProps) {
    const currentStepIndex = steps.findIndex(step => step.id === currentStepId)

    if (orientation === "vertical") {
        return (
            <div className={cn("w-48 flex flex-col", className)}>
                <div className="flex flex-col gap-2">
                    {steps.map((step, index) => {
                        const isCurrent = step.id === currentStepId
                        const isCompleted = index < currentStepIndex
                        const isClickable = onStepClick !== undefined
                        const allTestsCompleted = step.tests?.every(test => test.completed) ?? false

                        return (
                            <div key={step.id} className="flex items-start gap-3">
                                {/* Step Circle and Connector */}
                                <div className="flex flex-col items-center">
                                    <button
                                        type="button"
                                        onClick={() => isClickable && onStepClick?.(step.id)}
                                        disabled={!isClickable}
                                        className={cn(
                                            "flex items-center justify-center w-8 h-8 rounded-full border-2 transition-all flex-shrink-0",
                                            isCurrent && "border-main bg-main text-main-foreground shadow-shadow",
                                            isCompleted && !isCurrent && "border-main bg-main text-main-foreground",
                                            !isCompleted && !isCurrent && "border-border bg-secondary-background text-foreground",
                                            isClickable && "cursor-pointer hover:scale-110",
                                            !isClickable && "cursor-default"
                                        )}
                                    >
                                        {isCompleted || allTestsCompleted ? (
                                            <Check className="w-4 h-4" />
                                        ) : (
                                            <span className="text-xs font-heading">{index + 1}</span>
                                        )}
                                    </button>
                                    {index < steps.length - 1 && (
                                        <div
                                            className={cn(
                                                "w-0.5 h-8 mt-1 transition-colors",
                                                isCompleted || allTestsCompleted
                                                    ? "bg-main"
                                                    : "bg-border"
                                            )}
                                        />
                                    )}
                                </div>

                                {/* Step Content - Compact */}
                                <div className="flex-1 min-w-0 pt-0.5">
                                    <button
                                        type="button"
                                        onClick={() => isClickable && onStepClick?.(step.id)}
                                        disabled={!isClickable}
                                        className={cn(
                                            "text-left w-full",
                                            isClickable && "cursor-pointer hover:opacity-80",
                                            !isClickable && "cursor-default"
                                        )}
                                    >
                                        <div
                                            className={cn(
                                                "font-heading text-xs mb-1 line-clamp-2",
                                                isCurrent && "text-main",
                                                isCompleted && !isCurrent && "text-foreground",
                                                !isCompleted && !isCurrent && "text-muted-foreground"
                                            )}
                                        >
                                            {step.label}
                                        </div>
                                        {step.tests && step.tests.length > 0 && (
                                            <div className="flex flex-col gap-1 mt-1">
                                                {step.tests.map((test) => (
                                                    <div
                                                        key={test.id}
                                                        className={cn(
                                                            "text-xs px-1.5 py-0.5 rounded border text-center",
                                                            test.completed
                                                                ? "bg-main/20 border-main text-main"
                                                                : "bg-secondary-background border-border text-muted-foreground"
                                                        )}
                                                    >
                                                        {test.completed ? "✓" : "○"}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </button>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        )
    }

    // Horizontal layout (original)
    return (
        <div className={cn("w-full", className)}>
            <div className="flex items-start gap-4 overflow-x-auto pb-4">
                {steps.map((step, index) => {
                    const isCurrent = step.id === currentStepId
                    const isCompleted = index < currentStepIndex
                    const isClickable = onStepClick !== undefined

                    // Determine if all tests in this phase are completed
                    const allTestsCompleted = step.tests?.every(test => test.completed) ?? false
                    const hasTests = step.tests && step.tests.length > 0

                    return (
                        <div key={step.id} className="flex items-start gap-4 flex-shrink-0">
                            {/* Step Circle and Connector */}
                            <div className="flex flex-col items-center">
                                <button
                                    type="button"
                                    onClick={() => isClickable && onStepClick?.(step.id)}
                                    disabled={!isClickable}
                                    className={cn(
                                        "flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all",
                                        isCurrent && "border-main bg-main text-main-foreground shadow-shadow",
                                        isCompleted && !isCurrent && "border-main bg-main text-main-foreground",
                                        !isCompleted && !isCurrent && "border-border bg-secondary-background text-foreground",
                                        isClickable && "cursor-pointer hover:scale-110",
                                        !isClickable && "cursor-default"
                                    )}
                                >
                                    {isCompleted || allTestsCompleted ? (
                                        <Check className="w-5 h-5" />
                                    ) : (
                                        <span className="text-sm font-heading">{index + 1}</span>
                                    )}
                                </button>
                                {index < steps.length - 1 && (
                                    <div
                                        className={cn(
                                            "w-0.5 h-12 mt-2 transition-colors",
                                            isCompleted || allTestsCompleted
                                                ? "bg-main"
                                                : "bg-border"
                                        )}
                                    />
                                )}
                            </div>

                            {/* Step Content */}
                            <div className="flex-1 min-w-0 pt-1">
                                <button
                                    type="button"
                                    onClick={() => isClickable && onStepClick?.(step.id)}
                                    disabled={!isClickable}
                                    className={cn(
                                        "text-left w-full",
                                        isClickable && "cursor-pointer hover:opacity-80",
                                        !isClickable && "cursor-default"
                                    )}
                                >
                                    <div
                                        className={cn(
                                            "font-heading text-sm mb-1",
                                            isCurrent && "text-main",
                                            isCompleted && !isCurrent && "text-foreground",
                                            !isCompleted && !isCurrent && "text-muted-foreground"
                                        )}
                                    >
                                        {step.label}
                                    </div>
                                    {step.description && (
                                        <div className="text-xs text-muted-foreground mb-2">
                                            {step.description}
                                        </div>
                                    )}
                                    {hasTests && (
                                        <div className="flex flex-wrap gap-2 mt-2">
                                            {step.tests!.map((test) => (
                                                <div
                                                    key={test.id}
                                                    className={cn(
                                                        "text-xs px-2 py-1 rounded-base border",
                                                        test.completed
                                                            ? "bg-main/20 border-main text-main"
                                                            : "bg-secondary-background border-border text-muted-foreground"
                                                    )}
                                                >
                                                    {test.completed && "✓ "}
                                                    {test.label}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </button>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

