/**
 * Multimodal emotion fusion utility
 * Combines predictions from visual LSTM and audio LSTM models using late fusion
 * Uses EmoReact dataset with 9 emotion labels
 */

import * as tf from '@tensorflow/tfjs'

export interface ModelEmotionPredictions {
    curiosity: number
    uncertainty: number
    excitement: number
    happiness: number
    surprise: number
    disgust: number
    fear: number
    frustration: number
    valence: number
}

export interface ModalityPredictions {
    visual: ModelEmotionPredictions | null
    audio: ModelEmotionPredictions | null
}

const EMOTION_LABELS = ['curiosity', 'uncertainty', 'excitement', 'happiness', 'surprise', 'disgust', 'fear', 'frustration', 'valence'] as const

class MultimodalFusion {
    private visualModel: tf.LayersModel | tf.GraphModel | null = null
    private audioModel: tf.LayersModel | tf.GraphModel | null = null
    private fusionModel: tf.LayersModel | tf.GraphModel | null = null
    private isLoading = false
    private loadPromise: Promise<void> | null = null

    // LSTM models from EmoReact dataset
    private visualModelPath = '/models/visual_emotion_model/tfjs_model/model.json'
    private audioModelPath = '/models/audio_emotion_model/tfjs_model/model.json'
    // Fusion model combines visual + audio (EmoReact)
    private fusionModelPath = '/models/fusion_model/tfjs_model/model.json'

    async isModelAvailable(modelPath: string): Promise<boolean> {
        try {
            // Use GET instead of HEAD to avoid CORS/preflight issues
            // Some servers don't support HEAD requests properly
            console.log(`Checking if model is available at: ${modelPath}`)
            const controller = new AbortController()
            const timeoutId = setTimeout(() => controller.abort(), 3000) // 3 second timeout
            
            const response = await fetch(modelPath, { 
                method: 'GET',
                signal: controller.signal,
                cache: 'no-cache'
            }).catch((err) => {
                console.log(`Fetch error for ${modelPath}:`, err)
                return null
            })
            
            clearTimeout(timeoutId)
            
            if (response && response.ok) {
                console.log(`✓ Model available at ${modelPath}`)
                return true
            }
            console.log(`✗ Model not available at ${modelPath} (status: ${response?.status || 'no response'})`)
            return false
        } catch (error) {
            console.log(`Model not available at ${modelPath}:`, error)
            return false
        }
    }

    async loadModels(): Promise<void> {
        // Check if at least one model is already loaded
        if (this.visualModel || this.audioModel || this.fusionModel) {
            return // Already loaded
        }

        if (this.isLoading && this.loadPromise) {
            return this.loadPromise
        }

        this.isLoading = true
        this.loadPromise = (async () => {
            try {
                console.log('Loading multimodal fusion models (EmoReact)...')

                // Load visual LSTM model
                console.log('Attempting to load visual model...')
                const visualAvailable = await this.isModelAvailable(this.visualModelPath)
                if (visualAvailable) {
                    try {
                        console.log('Loading visual model from:', this.visualModelPath)
                        // Try loading with error handling for weight issues
                        this.visualModel = await tf.loadLayersModel(this.visualModelPath, {
                            // Add strict: false to allow missing weights (not ideal, but may work)
                            // Actually, TensorFlow.js doesn't support this option for loadLayersModel
                        })
                        console.log('✓ Visual LSTM model loaded successfully')
                    } catch (error: any) {
                        console.error('Failed to load visual model:', error)
                        console.error('Error details:', error.message)
                        // Check if it's a weight loading error
                        if (error.message && error.message.includes('weight data has no target variable')) {
                            console.error('⚠️ Model weights file is incomplete or corrupted.')
                            console.error('This usually means the model needs to be retrained and reconverted.')
                            console.error('The BatchNormalization layer weights are missing from the weights file.')
                        }
                    }
                } else {
                    console.warn('Visual LSTM model not available at:', this.visualModelPath)
                    // Try to load anyway - sometimes the availability check is too strict
                    try {
                        console.log('Attempting to load visual model anyway (availability check may be too strict)...')
                        this.visualModel = await tf.loadLayersModel(this.visualModelPath)
                        console.log('✓ Visual LSTM model loaded (despite availability check failing)')
                    } catch (loadError: any) {
                        console.warn('Visual model load failed:', loadError)
                        if (loadError.message && loadError.message.includes('weight data has no target variable')) {
                            console.error('⚠️ Model weights file is incomplete or corrupted.')
                            console.error('This usually means the model needs to be retrained and reconverted.')
                        }
                    }
                }

                // Load audio LSTM model
                const audioAvailable = await this.isModelAvailable(this.audioModelPath)
                if (audioAvailable) {
                    try {
                        this.audioModel = await tf.loadLayersModel(this.audioModelPath)
                        console.log('✓ Audio LSTM model loaded')
                    } catch (error) {
                        console.warn('Failed to load audio model:', error)
                    }
                } else {
                    console.warn('Audio LSTM model not available')
                }

                // Load fusion model (visual + audio) - optional
                const fusionAvailable = await this.isModelAvailable(this.fusionModelPath)
                if (fusionAvailable) {
                    try {
                        this.fusionModel = await tf.loadLayersModel(this.fusionModelPath)
                        console.log('✓ Fusion model loaded')
                    } catch (error) {
                        console.warn('Failed to load fusion model:', error)
                    }
                } else {
                    console.warn('Fusion model not available (will use averaging if both visual and audio are available)')
                }

                // Don't throw error if at least visual model is available
                if (!this.visualModel && !this.audioModel) {
                    throw new Error('Neither visual nor audio models are available')
                }

                this.isLoading = false
            } catch (error) {
                console.error('Error loading multimodal models:', error)
                this.isLoading = false
                // Only throw if no models are available at all
                if (!this.visualModel && !this.audioModel) {
                    throw error
                }
            }
        })()

        return this.loadPromise
    }

    /**
     * Predict emotions from MediaPipe visual feature sequence (using visual LSTM model)
     * Input: Sequence of MediaPipe feature arrays
     * Each frame: [blendshapes (52), head_pose (3), pose_landmarks (99)] = 154 features
     */
    async predictFromVisual(mediapipeSequence: number[][]): Promise<ModelEmotionPredictions | null> {
        console.log('predictFromVisual called, visualModel:', this.visualModel ? 'loaded' : 'not loaded')
        if (!this.visualModel) {
            console.log('Visual model not loaded, calling loadModels()...')
            await this.loadModels()
        }

        if (!this.visualModel) {
            console.error('Visual model still not available after loadModels()')
            return null
        }
        
        console.log('Using visual model for prediction, sequence length:', mediapipeSequence.length)

        try {
            // Convert sequence to tensor: (1, sequence_length, feature_dim)
            const sequenceLength = mediapipeSequence.length
            if (sequenceLength === 0) {
                return null
            }

            const featureDim = mediapipeSequence[0].length
            const input = tf.tensor3d([mediapipeSequence], [1, sequenceLength, featureDim])

            let prediction: tf.Tensor
            if (this.visualModel && 'predict' in this.visualModel) {
                prediction = (this.visualModel as tf.LayersModel).predict(input) as tf.Tensor
            } else if (this.visualModel && 'executeAsync' in this.visualModel) {
                const output = await (this.visualModel as tf.GraphModel).executeAsync(input) as tf.Tensor | tf.Tensor[]
                prediction = Array.isArray(output) ? output[0] : output
            } else {
                throw new Error('Visual model is not a valid TensorFlow.js model')
            }

            const predArray = await prediction.data()
            prediction.dispose()
            input.dispose()

            // Convert to emotion predictions object (9 emotions)
            // Valence is in sigmoid range (0-1), convert to 1-7 scale
            const predictions: ModelEmotionPredictions = {
                curiosity: predArray[0],
                uncertainty: predArray[1],
                excitement: predArray[2],
                happiness: predArray[3],
                surprise: predArray[4],
                disgust: predArray[5],
                fear: predArray[6],
                frustration: predArray[7],
                valence: predArray[8] * 6.0 + 1.0, // Convert from 0-1 to 1-7
            }

            return predictions
        } catch (error) {
            console.error('Error predicting from visual:', error)
            return null
        }
    }


    /**
     * Predict emotions from audio feature sequence (using audio LSTM model)
     * Input: Sequence of audio feature arrays (wav2vec2 embeddings or handcrafted features)
     */
    async predictFromAudio(audioSequence: number[][]): Promise<ModelEmotionPredictions | null> {
        if (!this.audioModel) {
            await this.loadModels()
        }

        if (!this.audioModel) {
            return null
        }

        try {
            // Convert sequence to tensor: (1, sequence_length, feature_dim)
            const sequenceLength = audioSequence.length
            if (sequenceLength === 0) {
                return null
            }

            const featureDim = audioSequence[0].length
            const input = tf.tensor3d([audioSequence], [1, sequenceLength, featureDim])

            let prediction: tf.Tensor
            if (this.audioModel && 'predict' in this.audioModel) {
                prediction = (this.audioModel as tf.LayersModel).predict(input) as tf.Tensor
            } else if (this.audioModel && 'executeAsync' in this.audioModel) {
                const output = await (this.audioModel as tf.GraphModel).executeAsync(input) as tf.Tensor | tf.Tensor[]
                prediction = Array.isArray(output) ? output[0] : output
            } else {
                throw new Error('Audio model is not a valid TensorFlow.js model')
            }

            const predArray = await prediction.data()
            prediction.dispose()
            input.dispose()

            // Convert to emotion predictions object (9 emotions)
            // Valence is in sigmoid range (0-1), convert to 1-7 scale
            const predictions: ModelEmotionPredictions = {
                curiosity: predArray[0],
                uncertainty: predArray[1],
                excitement: predArray[2],
                happiness: predArray[3],
                surprise: predArray[4],
                disgust: predArray[5],
                fear: predArray[6],
                frustration: predArray[7],
                valence: predArray[8] * 6.0 + 1.0, // Convert from 0-1 to 1-7
            }

            return predictions
        } catch (error) {
            console.error('Error predicting from audio:', error)
            return null
        }
    }

    /**
     * Fuse predictions from visual and audio modalities using fusion model
     */
    async fusePredictions(modalityPreds: ModalityPredictions): Promise<ModelEmotionPredictions | null> {
        if (!this.fusionModel) {
            await this.loadModels()
        }

        if (!this.fusionModel) {
            // Fallback: simple averaging if fusion model not available
            return this.averagePredictions(modalityPreds)
        }

        try {
            // Collect available predictions (visual + audio for fusion model)
            const predictions: number[][] = []
            
            if (modalityPreds.visual) {
                predictions.push([
                    modalityPreds.visual.curiosity,
                    modalityPreds.visual.uncertainty,
                    modalityPreds.visual.excitement,
                    modalityPreds.visual.happiness,
                    modalityPreds.visual.surprise,
                    modalityPreds.visual.disgust,
                    modalityPreds.visual.fear,
                    modalityPreds.visual.frustration,
                    modalityPreds.visual.valence,
                ])
            } else {
                // Use default if missing (all zeros except valence at 4.0)
                predictions.push([0, 0, 0, 0, 0, 0, 0, 0, 4.0])
            }

            if (modalityPreds.audio) {
                predictions.push([
                    modalityPreds.audio.curiosity,
                    modalityPreds.audio.uncertainty,
                    modalityPreds.audio.excitement,
                    modalityPreds.audio.happiness,
                    modalityPreds.audio.surprise,
                    modalityPreds.audio.disgust,
                    modalityPreds.audio.fear,
                    modalityPreds.audio.frustration,
                    modalityPreds.audio.valence,
                ])
            } else {
                predictions.push([0, 0, 0, 0, 0, 0, 0, 0, 4.0])
            }

            // Concatenate predictions (18 features: 9 emotions × 2 modalities)
            const fusedInput = predictions.flat()

            // Run through fusion model
            const input = tf.tensor2d([fusedInput])

            let prediction: tf.Tensor
            if (this.fusionModel && 'predict' in this.fusionModel) {
                prediction = (this.fusionModel as tf.LayersModel).predict(input) as tf.Tensor
            } else if (this.fusionModel && 'executeAsync' in this.fusionModel) {
                const output = await (this.fusionModel as tf.GraphModel).executeAsync(input) as tf.Tensor | tf.Tensor[]
                prediction = Array.isArray(output) ? output[0] : output
            } else {
                throw new Error('Fusion model is not a valid TensorFlow.js model')
            }

            const predArray = await prediction.data()
            prediction.dispose()
            input.dispose()

            // Convert to emotion predictions object (9 emotions)
            // Valence is in sigmoid range (0-1), convert to 1-7 scale
            const fusedPredictions: ModelEmotionPredictions = {
                curiosity: predArray[0],
                uncertainty: predArray[1],
                excitement: predArray[2],
                happiness: predArray[3],
                surprise: predArray[4],
                disgust: predArray[5],
                fear: predArray[6],
                frustration: predArray[7],
                valence: predArray[8] * 6.0 + 1.0, // Convert from 0-1 to 1-7
            }

            return fusedPredictions
        } catch (error) {
            console.error('Error fusing predictions:', error)
            // Fallback to averaging
            return this.averagePredictions(modalityPreds)
        }
    }

    /**
     * Simple averaging fallback when fusion model is not available
     */
    private averagePredictions(modalityPreds: ModalityPredictions): ModelEmotionPredictions {
        const predictions: ModelEmotionPredictions = {
            curiosity: 0,
            uncertainty: 0,
            excitement: 0,
            happiness: 0,
            surprise: 0,
            disgust: 0,
            fear: 0,
            frustration: 0,
            valence: 4.0, // Default to middle of 1-7 scale
        }

        let count = 0

        if (modalityPreds.visual) {
            predictions.curiosity += modalityPreds.visual.curiosity
            predictions.uncertainty += modalityPreds.visual.uncertainty
            predictions.excitement += modalityPreds.visual.excitement
            predictions.happiness += modalityPreds.visual.happiness
            predictions.surprise += modalityPreds.visual.surprise
            predictions.disgust += modalityPreds.visual.disgust
            predictions.fear += modalityPreds.visual.fear
            predictions.frustration += modalityPreds.visual.frustration
            predictions.valence += modalityPreds.visual.valence
            count++
        }

        if (modalityPreds.audio) {
            predictions.curiosity += modalityPreds.audio.curiosity
            predictions.uncertainty += modalityPreds.audio.uncertainty
            predictions.excitement += modalityPreds.audio.excitement
            predictions.happiness += modalityPreds.audio.happiness
            predictions.surprise += modalityPreds.audio.surprise
            predictions.disgust += modalityPreds.audio.disgust
            predictions.fear += modalityPreds.audio.fear
            predictions.frustration += modalityPreds.audio.frustration
            predictions.valence += modalityPreds.audio.valence
            count++
        }

        if (count > 0) {
            predictions.curiosity /= count
            predictions.uncertainty /= count
            predictions.excitement /= count
            predictions.happiness /= count
            predictions.surprise /= count
            predictions.disgust /= count
            predictions.fear /= count
            predictions.frustration /= count
            predictions.valence /= count
        } else {
            // Default values if no predictions available
            predictions.valence = 4.0
        }

        return predictions
    }
}

// Singleton instance
let fusionInstance: MultimodalFusion | null = null

export function getMultimodalFusion(): MultimodalFusion {
    if (!fusionInstance) {
        fusionInstance = new MultimodalFusion()
    }
    return fusionInstance
}

