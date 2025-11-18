/**
 * Transcription service using Whisper for Spanish audio
 * Uses Transformers.js for client-side transcription
 */

import { pipeline, Pipeline } from '@xenova/transformers'

export interface TranscriptionResult {
    text: string
    segments?: Array<{
        start: number
        end: number
        text: string
    }>
    language?: string
    confidence?: number
}

// Try to use Spanish-specific fine-tuned Whisper model
// Transformers.js requires ONNX format, so we try multiple options
// Source: https://huggingface.co/clu-ling/whisper-small-spanish
const SPANISH_MODEL_OPTIONS = [
    'Xenova/whisper-small-spanish', // Try Xenova version first (if exists)
    'clu-ling/whisper-small-spanish', // Direct HuggingFace path
] as const

class TranscriptionService {
    private transcriber: Pipeline | null = null
    private isLoading = false
    private loadPromise: Promise<void> | null = null

    /**
     * Check if the model files exist locally.
     */
    async isModelAvailable(): Promise<boolean> {
        try {
            const response = await fetch(`/models/whisper_model/${MODEL_NAME}/config.json`, { method: 'HEAD' })
            return response.ok
        } catch {
            // Model will be downloaded from HuggingFace if not local
            return true
        }
    }

    /**
     * Load the Whisper transcription pipeline.
     */
    async loadModel(): Promise<void> {
        if (this.transcriber) {
            return // Already loaded
        }

        if (this.isLoading && this.loadPromise) {
            return this.loadPromise // Return existing load promise
        }

        this.isLoading = true
        this.loadPromise = (async () => {
            try {
                console.log('Loading Whisper transcription model (Spanish-specific)...')
                
                // Yield before loading to allow other operations
                await this.yieldToBrowser()
                await this.yieldLonger()
                
                // Try to load Spanish-specific model first
                // Note: Transformers.js requires models to be in ONNX format
                // Try multiple model name formats
                let spanishModelLoaded = false
                let lastError: any = null
                
                for (const modelName of SPANISH_MODEL_OPTIONS) {
                    try {
                        console.log(`Attempting to load Spanish model: ${modelName}`)
                        this.transcriber = await pipeline(
                            'automatic-speech-recognition',
                            modelName,
                            {
                                quantized: true,
                            }
                        )
                        spanishModelLoaded = true
                        console.log(`✅ Whisper transcription model (Spanish-specific: ${modelName}) loaded successfully`)
                        break // Success, exit loop
                    } catch (spanishModelError: any) {
                        lastError = spanishModelError
                        console.warn(`⚠️ Model ${modelName} not available:`, spanishModelError?.message || spanishModelError)
                        // Continue to next option
                    }
                }
                
                if (!spanishModelLoaded) {
                    console.warn('⚠️ All Spanish-specific models failed. Last error:', lastError?.message || lastError)
                    console.warn('Falling back to multilingual model with forced Spanish language...')
                }
                
                // Fallback to multilingual model with forced Spanish
                if (!spanishModelLoaded) {
                    try {
                        this.transcriber = await pipeline(
                            'automatic-speech-recognition',
                            'Xenova/whisper-small', // Multilingual model
                            {
                                quantized: true,
                            }
                        )
                        console.log('✅ Whisper transcription model (multilingual) loaded - will force Spanish language')
                    } catch (fallbackError) {
                        console.error('❌ Failed to load both Spanish and multilingual models:', fallbackError)
                        throw fallbackError
                    }
                }
                
                // Yield after loading
                await this.yieldToBrowser()
                
                this.isLoading = false
            } catch (error) {
                console.error('Error loading Whisper transcription model:', error)
                this.isLoading = false
                throw error
            }
        })()

        return this.loadPromise
    }

    /**
     * Yield to browser to prevent blocking
     * Uses requestIdleCallback if available, otherwise setTimeout
     */
    private async yieldToBrowser(): Promise<void> {
        return new Promise(resolve => {
            if (typeof requestIdleCallback !== 'undefined') {
                requestIdleCallback(() => resolve(), { timeout: 1 })
            } else {
                setTimeout(resolve, 0)
            }
        })
    }

    /**
     * Yield for a longer period to allow other operations
     */
    private async yieldLonger(): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, 10))
    }

    /**
     * Transcribe audio data.
     * @param audioData Float32Array of audio samples.
     * @param sampleRate Sample rate of the audio data.
     * @param language Language code ('es' or 'spanish') - will be converted to 'spanish' for Transformers.js
     * @param onProgress Optional progress callback
     * @returns Transcription result.
     */
    async transcribe(
        audioData: Float32Array, 
        sampleRate: number,
        language: string = 'spanish',
        onProgress?: (progress: number) => void
    ): Promise<TranscriptionResult> {
        if (!this.transcriber) {
            await this.loadModel()
        }

        if (!this.transcriber) {
            throw new Error('Whisper transcription model not loaded.')
        }

        try {
            if (onProgress) onProgress(10)

            // Perform transcription with forced Spanish language
            // IMPORTANT: Transformers.js uses full language name 'spanish', not ISO code 'es'
            // Map 'es' to 'spanish' if needed
            const languageForModel = language === 'es' ? 'spanish' : language.toLowerCase()
            
            const transcriptionOptions: any = {
                chunk_length_s: 30, // Standard chunk size for better quality
                stride_length_s: 5, // Standard overlap
                return_timestamps: true,
                language: languageForModel, // CRITICAL: Force Spanish language (Transformers.js uses 'spanish', not 'es')
                task: 'transcribe', // Explicit transcription task
            }
            
            console.log(`Transcribing with language parameter: "${languageForModel}" (original: "${language}")`)
            
            if (onProgress) onProgress(20)
            
            // Process full audio - blocking is expected since user initiated
            // No timeouts, no length limits - process everything
            const output = await this.transcriber(audioData, transcriptionOptions) as any

            if (onProgress) onProgress(90)

            // Format output
            const text = output.text || ''
            const chunks = output.chunks || []

            // Verify the transcription is actually in Spanish (basic check)
            // If it looks like English, log a warning
            const spanishIndicators = ['el', 'la', 'de', 'que', 'y', 'a', 'en', 'un', 'es', 'se', 'no', 'te', 'lo', 'le', 'da', 'su', 'por', 'son', 'con', 'para', 'al', 'del', 'los', 'las', 'una', 'está', 'están', 'estoy', 'tengo', 'tiene', 'soy', 'tienes', 'tiene', 'hace', 'hacer', 'puede', 'puedo', 'quiero', 'quieres', 'me', 'mi', 'muy', 'bien', 'mal', 'más', 'menos', 'todo', 'todos', 'toda', 'todas']
            const textLower = text.toLowerCase().trim()
            const hasSpanishWords = spanishIndicators.some(word => {
                const wordWithSpaces = ' ' + word + ' '
                return textLower.includes(wordWithSpaces) || 
                       textLower.startsWith(word + ' ') || 
                       textLower.endsWith(' ' + word) ||
                       textLower === word
            })
            
            if (!hasSpanishWords && text.length > 10) {
                console.warn('⚠️ Transcription may not be in Spanish. Detected text:', text.substring(0, 100))
                console.warn('⚠️ The multilingual model may have auto-detected English instead of Spanish.')
                console.warn('⚠️ Note: The Spanish-specific model (clu-ling/whisper-small-spanish) is not available in ONNX format for Transformers.js.')
                console.warn('⚠️ Using multilingual model with language="spanish" parameter. If transcription is wrong, the audio might need to be clearer or the model may need different parameters.')
                // Don't throw, but log the issue
            } else if (hasSpanishWords) {
                console.log('✅ Transcription appears to be in Spanish')
            }

            if (onProgress) onProgress(100)

            return {
                text,
                segments: chunks.map((chunk: any) => ({
                    start: chunk.timestamp[0] || 0,
                    end: chunk.timestamp[1] || 0,
                    text: chunk.text || '',
                })),
                language: 'spanish',
                confidence: output.confidence || 0,
            }
        } catch (error) {
            console.error('Transcription error:', error)
            throw new Error(`Failed to transcribe audio: ${error}`)
        }
    }
}

// Singleton instance
let transcriptionServiceInstance: TranscriptionService | null = null

export function getTranscriptionService(): TranscriptionService {
    if (!transcriptionServiceInstance) {
        transcriptionServiceInstance = new TranscriptionService()
    }
    return transcriptionServiceInstance
}

/**
 * Transcribe audio using Whisper
 */
export async function transcribeAudio(
    audioData: Float32Array,
    sampleRate: number = 16000,
    language: string = 'es', // Spanish (will be converted to 'spanish' for Transformers.js)
    onProgress?: (progress: number) => void
): Promise<TranscriptionResult> {
    const service = getTranscriptionService()
    return await service.transcribe(audioData, sampleRate, language, onProgress)
}

