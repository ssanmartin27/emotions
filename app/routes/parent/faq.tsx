"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card"
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "~/components/ui/accordion"
import { Mail, Phone } from "lucide-react"

const faqItems = [
    {
        question: "How often are assessments conducted?",
        answer:
            "Assessments are typically conducted on a regular schedule determined by your child's therapist. You can view all assessments in the Assessments section.",
    },
    {
        question: "What do the emotion scores mean?",
        answer:
            "Emotion scores range from 0 to 5, where 0 indicates no presence of that emotion and 5 indicates very high intensity. These scores help track your child's emotional well-being over time.",
    },
    {
        question: "How can I download assessment reports?",
        answer:
            "You can download any assessment report as a PDF by clicking the 'Download PDF' button in the assessment details view. The PDF includes all assessment information, charts, and recommendations.",
    },
    {
        question: "What should I do if I notice concerning patterns?",
        answer:
            "If you notice concerning patterns in your child's emotional assessments, please contact your child's therapist directly. You can find contact information in the Support section below.",
    },
    {
        question: "How are daily recommendations generated?",
        answer:
            "Daily recommendations are generated based on recent assessments, emotion trends, and therapist notes. They provide personalized, actionable suggestions to support your child's emotional well-being.",
    },
    {
        question: "Can I see progress over time?",
        answer:
            "Yes! The Progress section provides detailed charts showing your child's emotional trends over time. You can view individual child progress or compare all your children.",
    },
]

export default function FAQPage() {
    return (
        <div className="flex flex-col gap-6 p-6 max-w-4xl mx-auto">
            <div>
                <h1 className="text-3xl font-bold">Frequently Asked Questions</h1>
                <p className="text-muted-foreground mt-2">
                    Find answers to common questions about the platform
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Common Questions</CardTitle>
                    <CardDescription>Browse frequently asked questions</CardDescription>
                </CardHeader>
                <CardContent>
                    <Accordion type="single" collapsible className="w-full">
                        {faqItems.map((item, index) => (
                            <AccordionItem key={index} value={`item-${index}`}>
                                <AccordionTrigger>{item.question}</AccordionTrigger>
                                <AccordionContent>{item.answer}</AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Contact Support</CardTitle>
                    <CardDescription>Get in touch with our support team</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10">
                            <Mail className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <p className="font-semibold">Email</p>
                            <p className="text-sm text-muted-foreground">support@emokids.com</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10">
                            <Phone className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <p className="font-semibold">Phone</p>
                            <p className="text-sm text-muted-foreground">+1 (555) 123-4567</p>
                        </div>
                    </div>
                    <div className="pt-4 border-t">
                        <p className="text-sm text-muted-foreground">
                            <strong>Office Hours:</strong> Monday - Friday, 9:00 AM - 5:00 PM EST
                        </p>
                        <p className="text-sm text-muted-foreground mt-2">
                            For urgent matters related to your child's well-being, please contact
                            your child's therapist directly.
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}




