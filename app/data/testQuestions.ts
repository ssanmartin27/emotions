export interface TestQuestion {
    question: string;
    options: string[];
    weights: number[]; // Scoring weights for each option (0-4 typically)
}

export const testQuestions: TestQuestion[] = [
    {
        question: "How often do you feel sad or down?",
        options: ["Never", "Rarely", "Sometimes", "Often", "Always"],
        weights: [0, 1, 2, 3, 4],
    },
    {
        question: "Do you have trouble sleeping?",
        options: ["Never", "Rarely", "Sometimes", "Often", "Always"],
        weights: [0, 1, 2, 3, 4],
    },
    {
        question: "How often do you feel anxious or worried?",
        options: ["Never", "Rarely", "Sometimes", "Often", "Always"],
        weights: [0, 1, 2, 3, 4],
    },
    {
        question: "Do you feel angry or irritable?",
        options: ["Never", "Rarely", "Sometimes", "Often", "Always"],
        weights: [0, 1, 2, 3, 4],
    },
    {
        question: "How often do you feel happy or content?",
        options: ["Always", "Often", "Sometimes", "Rarely", "Never"],
        weights: [0, 1, 2, 3, 4], // Reversed for positive emotion
    },
    {
        question: "Do you have trouble concentrating?",
        options: ["Never", "Rarely", "Sometimes", "Often", "Always"],
        weights: [0, 1, 2, 3, 4],
    },
    {
        question: "How often do you feel afraid or scared?",
        options: ["Never", "Rarely", "Sometimes", "Often", "Always"],
        weights: [0, 1, 2, 3, 4],
    },
    {
        question: "Do you feel guilty about things?",
        options: ["Never", "Rarely", "Sometimes", "Often", "Always"],
        weights: [0, 1, 2, 3, 4],
    },
    {
        question: "How is your appetite?",
        options: ["Very good", "Good", "Okay", "Poor", "Very poor"],
        weights: [0, 1, 2, 3, 4],
    },
    {
        question: "Do you feel tired or have low energy?",
        options: ["Never", "Rarely", "Sometimes", "Often", "Always"],
        weights: [0, 1, 2, 3, 4],
    },
    {
        question: "How often do you enjoy activities you used to like?",
        options: ["Always", "Often", "Sometimes", "Rarely", "Never"],
        weights: [0, 1, 2, 3, 4], // Reversed
    },
    {
        question: "Do you feel hopeless about the future?",
        options: ["Never", "Rarely", "Sometimes", "Often", "Always"],
        weights: [0, 1, 2, 3, 4],
    },
    {
        question: "How often do you feel nervous or on edge?",
        options: ["Never", "Rarely", "Sometimes", "Often", "Always"],
        weights: [0, 1, 2, 3, 4],
    },
    {
        question: "Do you have physical symptoms when anxious (sweating, shaking, etc.)?",
        options: ["Never", "Rarely", "Sometimes", "Often", "Always"],
        weights: [0, 1, 2, 3, 4],
    },
    {
        question: "How often do you feel like crying?",
        options: ["Never", "Rarely", "Sometimes", "Often", "Always"],
        weights: [0, 1, 2, 3, 4],
    },
    {
        question: "Do you avoid social situations?",
        options: ["Never", "Rarely", "Sometimes", "Often", "Always"],
        weights: [0, 1, 2, 3, 4],
    },
    {
        question: "How well do you handle stress?",
        options: ["Very well", "Well", "Okay", "Poorly", "Very poorly"],
        weights: [0, 1, 2, 3, 4],
    },
    {
        question: "Do you have thoughts of self-harm?",
        options: ["Never", "Rarely", "Sometimes", "Often", "Always"],
        weights: [0, 1, 2, 3, 4],
    },
    {
        question: "How is your relationship with family members?",
        options: ["Excellent", "Good", "Okay", "Poor", "Very poor"],
        weights: [0, 1, 2, 3, 4],
    },
    {
        question: "Overall, how would you rate your emotional well-being?",
        options: ["Excellent", "Good", "Fair", "Poor", "Very poor"],
        weights: [0, 1, 2, 3, 4],
    },
];

export function calculateTestScore(answers: Array<{ question: string; answer: string; score: number }>): number {
    const totalScore = answers.reduce((sum, answer) => sum + answer.score, 0);
    const maxScore = testQuestions.length * 4; // Maximum possible score
    return Math.round((totalScore / maxScore) * 100); // Return as percentage
}




