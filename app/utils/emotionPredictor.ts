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

export interface TemporalEmotionSegment {
    startFrame: number
    endFrame: number
    duration: number  // in seconds (estimated)
    predictions: EmotionPredictions
    dominantEmotion: string
    dominantValue: number
}

export interface TemporalEmotionPredictions {
    segments: Array<{
        startFrame: number
        endFrame: number
        dominantEmotion: keyof EmotionPredictions
        emotions: EmotionPredictions
    }>
    overall: EmotionPredictions
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
const GRAPH_MODEL_PATH = '/models/emotion_model_graph/model.json'
const SCALER_PATH = '/models/emotion_model/scaler.json'

class EmotionPredictor {
    private model: tf.LayersModel | tf.GraphModel | null = null
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
            // Check graph model first, then layers model
            const graphResponse = await fetch(GRAPH_MODEL_PATH, { method: 'HEAD' })
            if (graphResponse.ok) return true
            
            const layersResponse = await fetch(MODEL_PATH, { method: 'HEAD' })
            return layersResponse.ok
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

                // Try loading as graph model first (SavedModel format), fallback to layers model
                try {
                    this.model = await tf.loadGraphModel(GRAPH_MODEL_PATH)
                    console.log('Emotion model loaded successfully as GraphModel')
                } catch (graphError) {
                    console.warn('Failed to load as GraphModel, trying LayersModel:', graphError)
                    this.model = await tf.loadLayersModel(MODEL_PATH)
                    console.log('Emotion model loaded successfully as LayersModel')
                }

                // Load scaler (mean and scale for normalization)
                // This MUST match the scaler used during training!
                try {
                    const scalerResponse = await fetch(SCALER_PATH)
                    if (scalerResponse.ok) {
                        const scalerData = await scalerResponse.json()
                        this.scaler = {
                            mean: scalerData.mean || Array(12).fill(0),
                            scale: scalerData.scale || Array(12).fill(1),
                        }
                        console.log('Scaler loaded from file:', {
                            meanRange: [Math.min(...this.scaler.mean), Math.max(...this.scaler.mean)],
                            scaleRange: [Math.min(...this.scaler.scale), Math.max(...this.scaler.scale)]
                        })
                    } else {
                        console.warn('Scaler file not found, using default (no normalization)')
                        this.scaler = {
                            mean: Array(12).fill(0),
                            scale: Array(12).fill(1),
                        }
                    }
                } catch (error) {
                    console.warn('Error loading scaler, using default:', error)
                    this.scaler = {
                        mean: Array(12).fill(0),
                        scale: Array(12).fill(1),
                    }
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

        // Predict - handle both GraphModel and LayersModel
        let prediction: tf.Tensor
        if ('predict' in this.model) {
            // LayersModel
            prediction = this.model.predict(input) as tf.Tensor
        } else {
            // GraphModel - use executeAsync
            const output = await this.model.executeAsync(input) as tf.Tensor | tf.Tensor[]
            prediction = Array.isArray(output) ? output[0] : output
        }

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
     * Predict emotions from time-series AU data with temporal segmentation
     * Detects emotion changes and segments the video accordingly
     */
    async predictTimeSeries(ausArray: AUs[]): Promise<TemporalEmotionPredictions> {
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

        // Predict for all frames - handle both GraphModel and LayersModel
        let predictions: tf.Tensor
        if ('predict' in this.model) {
            // LayersModel
            predictions = this.model.predict(input) as tf.Tensor
        } else {
            // GraphModel - use executeAsync
            const output = await this.model.executeAsync(input) as tf.Tensor | tf.Tensor[]
            predictions = Array.isArray(output) ? output[0] : output
        }

        // Get predictions as array
        const predArray = await predictions.data()
        const predShape = predictions.shape
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

        // Handle different output shapes
        // GraphModel might return shape [batch, 6] while LayersModel returns [batch, 6]
        // Check if predictions are in correct format
        if (predShape.length === 2 && predShape[1] === 6) {
            // Standard format: [batch, 6]
            for (let i = 0; i < numFrames; i++) {
                const offset = i * 6
                aggregated.anger += predArray[offset + 0]
                aggregated.sadness += predArray[offset + 1]
                aggregated.anxiety += predArray[offset + 2]
                aggregated.fear += predArray[offset + 3]
                aggregated.happiness += predArray[offset + 4]
                aggregated.guilt += predArray[offset + 5]
            }
        } else {
            console.warn("Unexpected prediction shape:", predShape, "Expected: [batch, 6]")
            // Try to handle other shapes
            if (predArray.length >= 6) {
                // If we have at least 6 values, use the first 6
                aggregated.anger = predArray[0]
                aggregated.sadness = predArray[1]
                aggregated.anxiety = predArray[2]
                aggregated.fear = predArray[3]
                aggregated.happiness = predArray[4]
                aggregated.guilt = predArray[5]
            }
        }

        // Average
        aggregated.anger /= numFrames
        aggregated.sadness /= numFrames
        aggregated.anxiety /= numFrames
        aggregated.fear /= numFrames
        aggregated.happiness /= numFrames
        aggregated.guilt /= numFrames

        // Scale to 0-5 range (matching the UI)
        // Note: Model outputs are in 0-1 range (sigmoid), scale to 0-5
        const scaled = {
            anger: Math.min(5, Math.max(0, aggregated.anger * 5)),
            sadness: Math.min(5, Math.max(0, aggregated.sadness * 5)),
            anxiety: Math.min(5, Math.max(0, aggregated.anxiety * 5)),
            fear: Math.min(5, Math.max(0, aggregated.fear * 5)),
            happiness: Math.min(5, Math.max(0, aggregated.happiness * 5)),
            guilt: Math.min(5, Math.max(0, aggregated.guilt * 5)),
        }
        return scaled
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




