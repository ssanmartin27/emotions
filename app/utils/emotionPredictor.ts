/**
 * Emotion prediction utility using TensorFlow.js
 * Loads trained model and predicts emotions from AU time-series data
 */

import * as tf from '@tensorflow/tfjs'

export interface EmotionPredictions {
    anger: number
    sadness: number
    anxiety: number
    fear: number
    happiness: number
    guilt: number
}

export interface AUs {
    AU01: number
    AU02: number
    AU04: number
    AU05: number
    AU06: number
    AU07: number
    AU12: number
    AU14: number
    AU15: number
    AU17: number
    AU20: number
    AU25: number
}

const EMOTIONS = ['anger', 'sadness', 'anxiety', 'fear', 'happiness', 'guilt'] as const
const MODEL_PATH = '/models/emotion_model/model.json'

class EmotionPredictor {
    private model: tf.LayersModel | null = null
    private scaler: {
        mean: number[]
        scale: number[]
    } | null = null
    private isLoading = false
    private loadPromise: Promise<void> | null = null

    /**
     * Check if the model file exists
     */
    async isModelAvailable(): Promise<boolean> {
        try {
            const response = await fetch(MODEL_PATH, { method: 'HEAD' })
            return response.ok
        } catch {
            return false
        }
    }

    /**
     * Load the TensorFlow.js model
     */
    async loadModel(): Promise<void> {
        if (this.model) {
            return // Already loaded
        }

        if (this.isLoading && this.loadPromise) {
            return this.loadPromise // Return existing load promise
        }

        this.isLoading = true
        this.loadPromise = (async () => {
            try {
                // Check if model exists first
                const modelExists = await this.isModelAvailable()
                if (!modelExists) {
                    throw new Error('Model file not found')
                }

                // Load model
                this.model = await tf.loadLayersModel(MODEL_PATH)
                console.log('Emotion model loaded successfully')

                // Load scaler (mean and scale for normalization)
                // In a real implementation, you'd load this from a JSON file
                // For now, we'll use default values or calculate from training data
                // This should match the scaler used during training
                this.scaler = {
                    mean: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], // Should be loaded from file
                    scale: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], // Should be loaded from file
                }

                this.isLoading = false
            } catch (error) {
                console.error('Error loading emotion model:', error)
                this.isLoading = false
                throw error
            }
        })()

        return this.loadPromise
    }

    /**
     * Normalize AU values using the scaler
     */
    private normalizeAUs(aus: AUs): number[] {
        const auArray = [
            aus.AU01,
            aus.AU02,
            aus.AU04,
            aus.AU05,
            aus.AU06,
            aus.AU07,
            aus.AU12,
            aus.AU14,
            aus.AU15,
            aus.AU17,
            aus.AU20,
            aus.AU25,
        ]

        if (this.scaler) {
            return auArray.map((val, idx) => {
                const mean = this.scaler!.mean[idx] || 0
                const scale = this.scaler!.scale[idx] || 1
                return (val - mean) / scale
            })
        }

        return auArray
    }

    /**
     * Predict emotions from a single frame's AUs
     */
    async predictFrame(aus: AUs): Promise<EmotionPredictions> {
        if (!this.model) {
            await this.loadModel()
        }

        if (!this.model) {
            throw new Error('Model not loaded')
        }

        // Normalize AUs
        const normalizedAUs = this.normalizeAUs(aus)

        // Convert to tensor
        const input = tf.tensor2d([normalizedAUs])

        // Predict
        const prediction = this.model.predict(input) as tf.Tensor

        // Get predictions as array
        const predictions = await prediction.data()
        prediction.dispose()
        input.dispose()

        // Map to emotion object
        const result: EmotionPredictions = {
            anger: predictions[0],
            sadness: predictions[1],
            anxiety: predictions[2],
            fear: predictions[3],
            happiness: predictions[4],
            guilt: predictions[5],
        }

        return result
    }

    /**
     * Predict emotions from time-series AU data
     * Aggregates predictions across frames
     */
    async predictTimeSeries(ausArray: AUs[]): Promise<EmotionPredictions> {
        if (ausArray.length === 0) {
            return {
                anger: 0,
                sadness: 0,
                anxiety: 0,
                fear: 0,
                happiness: 0,
                guilt: 0,
            }
        }

        if (!this.model) {
            await this.loadModel()
        }

        if (!this.model) {
            throw new Error('Model not loaded')
        }

        // Normalize all AUs
        const normalizedAUs = ausArray.map((aus) => this.normalizeAUs(aus))

        // Convert to tensor (batch_size, features)
        const input = tf.tensor2d(normalizedAUs)

        // Predict for all frames
        const predictions = this.model.predict(input) as tf.Tensor

        // Get predictions as array
        const predArray = await predictions.data()
        predictions.dispose()
        input.dispose()

        // Aggregate predictions (mean across frames)
        const numFrames = ausArray.length
        const aggregated: EmotionPredictions = {
            anger: 0,
            sadness: 0,
            anxiety: 0,
            fear: 0,
            happiness: 0,
            guilt: 0,
        }

        for (let i = 0; i < numFrames; i++) {
            const offset = i * 6
            aggregated.anger += predArray[offset + 0]
            aggregated.sadness += predArray[offset + 1]
            aggregated.anxiety += predArray[offset + 2]
            aggregated.fear += predArray[offset + 3]
            aggregated.happiness += predArray[offset + 4]
            aggregated.guilt += predArray[offset + 5]
        }

        // Average
        aggregated.anger /= numFrames
        aggregated.sadness /= numFrames
        aggregated.anxiety /= numFrames
        aggregated.fear /= numFrames
        aggregated.happiness /= numFrames
        aggregated.guilt /= numFrames

        // Scale to 0-5 range (matching the UI)
        return {
            anger: Math.min(5, Math.max(0, aggregated.anger * 5)),
            sadness: Math.min(5, Math.max(0, aggregated.sadness * 5)),
            anxiety: Math.min(5, Math.max(0, aggregated.anxiety * 5)),
            fear: Math.min(5, Math.max(0, aggregated.fear * 5)),
            happiness: Math.min(5, Math.max(0, aggregated.happiness * 5)),
            guilt: Math.min(5, Math.max(0, aggregated.guilt * 5)),
        }
    }
}

// Singleton instance
let predictorInstance: EmotionPredictor | null = null

export function getEmotionPredictor(): EmotionPredictor {
    if (!predictorInstance) {
        predictorInstance = new EmotionPredictor()
    }
    return predictorInstance
}




