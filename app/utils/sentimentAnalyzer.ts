/**
 * Sentiment and emotion analysis service for Spanish text
 * Uses pre-trained Spanish models for emotion classification
 * Analyzes transcription for emotion-specific phrases using zero-shot classification
 */

import { pipeline, Pipeline } from '@xenova/transformers'

export interface SentimentAnalysisResult {
    overallSentiment: 'positive' | 'negative' | 'neutral'
    sentimentScore: number // -1 to 1, where -1 is very negative, 1 is very positive
    emotionPhrases: Array<{
        text: string
        emotion: 'anger' | 'sadness' | 'anxiety' | 'fear' | 'happiness' | 'guilt'
        confidence: number
        startIndex: number
        endIndex: number
    }>
    keyPhrases: Array<{
        text: string
        sentiment: 'positive' | 'negative' | 'neutral'
        relevance: number
    }>
}

// Emotion labels in Spanish for zero-shot classification
const EMOTION_LABELS = [
    'enojo', 'ira', 'rabia', // anger
    'tristeza', 'depresión', 'melancolía', // sadness
    'ansiedad', 'nerviosismo', 'preocupación', // anxiety
    'miedo', 'temor', 'pánico', // fear
    'felicidad', 'alegría', 'contento', // happiness
    'culpa', 'remordimiento', 'arrepentimiento', // guilt
] as const

class SentimentAnalyzer {
    private sentimentModel: Pipeline | null = null
    private emotionModel: Pipeline | null = null
    private isLoading = false
    private loadPromise: Promise<void> | null = null
    private sentimentModelName = 'Xenova/roberta-base-bne' // Spanish RoBERTa for sentiment
    // Use a multilingual model for zero-shot emotion classification
    // Falls back to pattern matching if model is unavailable
    private emotionModelName = 'Xenova/distilbert-base-uncased' // Zero-shot classifier (works with Spanish via fallback)

    /**
     * Load the sentiment and emotion analysis models
     */
    async loadModel(): Promise<void> {
        if (this.sentimentModel && this.emotionModel) {
            return
        }

        if (this.isLoading && this.loadPromise) {
            return this.loadPromise
        }

        this.isLoading = true
        this.loadPromise = (async () => {
            try {
                console.log('Loading sentiment and emotion analysis models...')
                
                // Load sentiment analysis pipeline (Spanish RoBERTa)
                try {
                    this.sentimentModel = await pipeline(
                        'sentiment-analysis',
                        this.sentimentModelName,
                        {
                            quantized: true,
                        }
                    )
                    console.log('Sentiment analysis model loaded successfully')
                } catch (error) {
                    console.warn('Failed to load sentiment model, will use fallback:', error)
                }
                
                // Load zero-shot classification for emotion detection
                try {
                    this.emotionModel = await pipeline(
                        'zero-shot-classification',
                        this.emotionModelName,
                        {
                            quantized: true,
                        }
                    )
                    console.log('Emotion classification model loaded successfully')
                } catch (error) {
                    console.warn('Failed to load emotion model, will use fallback:', error)
                }
                
                this.isLoading = false
            } catch (error) {
                console.error('Error loading models:', error)
                this.isLoading = false
                // Don't throw - allow graceful degradation
            }
        })()

        return this.loadPromise
    }

    /**
     * Analyze sentiment of text
     */
    async analyzeSentiment(text: string): Promise<SentimentAnalysisResult> {
        try {
            await this.loadModel()

            // Normalize text
            const normalizedText = text.toLowerCase().trim()
            
            if (!normalizedText) {
                return this.getDefaultResult()
            }

            // Analyze overall sentiment
            const overallSentiment = await this.getOverallSentiment(normalizedText)
            
            // Extract emotion-specific phrases (now async)
            const emotionPhrases = await this.extractEmotionPhrases(normalizedText, text)
            
            // Extract key phrases
            const keyPhrases = this.extractKeyPhrases(normalizedText, overallSentiment.sentimentScore)

            return {
                overallSentiment: overallSentiment.sentiment,
                sentimentScore: overallSentiment.score,
                emotionPhrases,
                keyPhrases,
            }
        } catch (error) {
            console.error('Error analyzing sentiment:', error)
            return this.getDefaultResult()
        }
    }

    /**
     * Get overall sentiment using the model
     */
    private async getOverallSentiment(text: string): Promise<{
        sentiment: 'positive' | 'negative' | 'neutral'
        score: number
    }> {
        if (!this.sentimentModel) {
            // Fallback to rule-based analysis
            return this.ruleBasedSentiment(text)
        }

        try {
            const result = await this.sentimentModel(text)
            
            // Transformers.js returns array of results
            const prediction = Array.isArray(result) ? result[0] : result
            
            // Map model output to our format
            const label = prediction.label?.toLowerCase() || 'neutral'
            const score = prediction.score || 0.5
            
            let sentiment: 'positive' | 'negative' | 'neutral' = 'neutral'
            let sentimentScore = 0
            
            if (label.includes('positive') || label.includes('positivo')) {
                sentiment = 'positive'
                sentimentScore = score
            } else if (label.includes('negative') || label.includes('negativo')) {
                sentiment = 'negative'
                sentimentScore = -score
            } else {
                sentiment = 'neutral'
                sentimentScore = 0
            }
            
            return { sentiment, score: sentimentScore }
        } catch (error) {
            console.error('Model sentiment analysis error:', error)
            return this.ruleBasedSentiment(text)
        }
    }

    /**
     * Rule-based sentiment analysis (fallback)
     */
    private ruleBasedSentiment(text: string): {
        sentiment: 'positive' | 'negative' | 'neutral'
        score: number
    } {
        const positiveWords = ['feliz', 'contento', 'bien', 'genial', 'me gusta', 'me encanta', 'alegre']
        const negativeWords = ['triste', 'mal', 'enojo', 'miedo', 'preocupado', 'no me gusta', 'odio']
        
        let positiveCount = 0
        let negativeCount = 0
        
        positiveWords.forEach(word => {
            if (text.includes(word)) positiveCount++
        })
        
        negativeWords.forEach(word => {
            if (text.includes(word)) negativeCount++
        })
        
        if (positiveCount > negativeCount) {
            return { sentiment: 'positive', score: Math.min(1, positiveCount / 5) }
        } else if (negativeCount > positiveCount) {
            return { sentiment: 'negative', score: -Math.min(1, negativeCount / 5) }
        } else {
            return { sentiment: 'neutral', score: 0 }
        }
    }

    /**
     * Extract emotion-specific phrases from text using zero-shot classification
     */
    private async extractEmotionPhrases(
        normalizedText: string,
        originalText: string
    ): Promise<Array<{
        text: string
        emotion: 'anger' | 'sadness' | 'anxiety' | 'fear' | 'happiness' | 'guilt'
        confidence: number
        startIndex: number
        endIndex: number
    }>> {
        const phrases: Array<{
            text: string
            emotion: 'anger' | 'sadness' | 'anxiety' | 'fear' | 'happiness' | 'guilt'
            confidence: number
            startIndex: number
            endIndex: number
        }> = []

        // Split text into sentences for better emotion detection
        const sentences = originalText.split(/[.!?]+/).filter(s => s.trim().length > 5)
        
        // Emotion mapping from Spanish labels to our emotion types
        const emotionMapping: Record<string, 'anger' | 'sadness' | 'anxiety' | 'fear' | 'happiness' | 'guilt'> = {
            'enojo': 'anger',
            'ira': 'anger',
            'rabia': 'anger',
            'tristeza': 'sadness',
            'depresión': 'sadness',
            'melancolía': 'sadness',
            'ansiedad': 'anxiety',
            'nerviosismo': 'anxiety',
            'preocupación': 'anxiety',
            'miedo': 'fear',
            'temor': 'fear',
            'pánico': 'fear',
            'felicidad': 'happiness',
            'alegría': 'happiness',
            'contento': 'happiness',
            'culpa': 'guilt',
            'remordimiento': 'guilt',
            'arrepentimiento': 'guilt',
        }

        // Process each sentence with emotion classification
        for (const sentence of sentences) {
            const trimmed = sentence.trim()
            if (trimmed.length < 5) continue

            try {
                if (this.emotionModel) {
                    // Use zero-shot classification to detect emotions
                    const result = await this.emotionModel(trimmed, Array.from(EMOTION_LABELS))
                    
                    // Get top emotion prediction
                    if (result.labels && result.scores && result.labels.length > 0) {
                        const topLabel = result.labels[0]
                        const topScore = result.scores[0]
                        
                        // Map Spanish emotion label to our emotion type
                        const emotion = emotionMapping[topLabel.toLowerCase()]
                        
                        if (emotion && topScore > 0.3) { // Threshold for confidence
                            const startIndex = originalText.indexOf(trimmed)
                            const endIndex = startIndex + trimmed.length
                            
                            phrases.push({
                                text: trimmed,
                                emotion,
                                confidence: topScore,
                                startIndex: Math.max(0, startIndex),
                                endIndex: Math.min(originalText.length, endIndex),
                            })
                        }
                    }
                } else {
                    // Fallback: Use simple pattern matching for key emotion words
                    const emotionWords: Record<string, 'anger' | 'sadness' | 'anxiety' | 'fear' | 'happiness' | 'guilt'> = {
                        'enojo': 'anger', 'ira': 'anger', 'rabia': 'anger', 'molesto': 'anger',
                        'triste': 'sadness', 'tristeza': 'sadness', 'deprimido': 'sadness',
                        'ansiedad': 'anxiety', 'nervioso': 'anxiety', 'preocupado': 'anxiety',
                        'miedo': 'fear', 'temor': 'fear', 'asustado': 'fear',
                        'feliz': 'happiness', 'alegre': 'happiness', 'contento': 'happiness',
                        'culpa': 'guilt', 'culpable': 'guilt', 'arrepentido': 'guilt',
                    }
                    
                    const lowerSentence = trimmed.toLowerCase()
                    for (const [word, emotion] of Object.entries(emotionWords)) {
                        if (lowerSentence.includes(word)) {
                            const startIndex = originalText.indexOf(trimmed)
                            const endIndex = startIndex + trimmed.length
                            
                            phrases.push({
                                text: trimmed,
                                emotion,
                                confidence: 0.6, // Lower confidence for fallback
                                startIndex: Math.max(0, startIndex),
                                endIndex: Math.min(originalText.length, endIndex),
                            })
                            break // Only match first emotion per sentence
                        }
                    }
                }
            } catch (error) {
                console.warn('Error classifying emotion for sentence:', error)
                // Continue with next sentence
            }
        }

        // Remove duplicates and sort by confidence
        return phrases
            .filter((phrase, index, self) => 
                index === self.findIndex(p => 
                    Math.abs(p.startIndex - phrase.startIndex) < 10
                )
            )
            .sort((a, b) => b.confidence - a.confidence)
            .slice(0, 15) // Limit to top 15 phrases
    }

    /**
     * Extract key phrases from text
     */
    private extractKeyPhrases(
        text: string,
        sentimentScore: number
    ): Array<{
        text: string
        sentiment: 'positive' | 'negative' | 'neutral'
        relevance: number
    }> {
        // Simple phrase extraction (can be improved with NLP)
        const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0)
        
        return sentences
            .map(sentence => {
                const trimmed = sentence.trim()
                if (trimmed.length < 10) return null
                
                // Determine sentiment based on score
                let sentiment: 'positive' | 'negative' | 'neutral' = 'neutral'
                if (sentimentScore > 0.3) sentiment = 'positive'
                else if (sentimentScore < -0.3) sentiment = 'negative'
                
                // Calculate relevance (simple heuristic)
                const relevance = Math.min(1, trimmed.length / 100)
                
                return {
                    text: trimmed,
                    sentiment,
                    relevance,
                }
            })
            .filter((phrase): phrase is NonNullable<typeof phrase> => phrase !== null)
            .slice(0, 10) // Limit to top 10 phrases
    }

    /**
     * Get default result
     */
    private getDefaultResult(): SentimentAnalysisResult {
        return {
            overallSentiment: 'neutral',
            sentimentScore: 0,
            emotionPhrases: [],
            keyPhrases: [],
        }
    }
}

// Singleton instance
let analyzerInstance: SentimentAnalyzer | null = null

export function getSentimentAnalyzer(): SentimentAnalyzer {
    if (!analyzerInstance) {
        analyzerInstance = new SentimentAnalyzer()
    }
    return analyzerInstance
}

