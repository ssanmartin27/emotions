/**
 * Multimodal emotion predictor
 * Uses visual LSTM and audio LSTM models with late fusion
 * Uses EmoReact dataset with MediaPipe visual features
 */

import { getMultimodalFusion, type ModelEmotionPredictions, type ModalityPredictions } from './multimodalFusion'
import { mapDatasetToExisting, combinePredictions, type ExistingEmotionPredictions } from './emotionMapping'
import type { EmotionPredictions } from './emotionPredictor'

export interface TemporalEmotionSegment {
    startFrame: number
    endFrame: number
    startTime: number
    endTime: number
    duration: number
    dominantEmotion: string
}

export interface MultimodalEmotionResult {
    segments: TemporalEmotionSegment[]
    overall: EmotionPredictions
    modelPredictions: ModelEmotionPredictions
}

interface MediaPipeData {
    frame: number
    timestamp: number
    // MediaPipe features: blendshapes (52) + head pose (3) + pose landmarks (99) = 154 features
    blendshapes: number[] // 52 blendshape coefficients
    headPose: number[] // 3 values: [rx (roll), ry (pitch), rz (yaw)]
    poseLandmarks: number[] // 99 values: 33 landmarks × 3 coordinates (x, y, z)
}

class MultimodalEmotionPredictor {
    /**
     * Predict emotions from video MediaPipe features and audio sequences
     * Uses LSTM models that require sequences, so we process the entire video
     */
    async predictFromVideo(
        mediapipeData: MediaPipeData[],
        audioSequence?: number[][],
        fps: number = 30
    ): Promise<MultimodalEmotionResult> {
        console.log('predictFromVideo called with', mediapipeData.length, 'frames, fps:', fps)
        const fusion = getMultimodalFusion()
        console.log('Loading models...')
        await fusion.loadModels()
        console.log('Models loaded')

        const frameTime = 1 / fps
        const segments: TemporalEmotionSegment[] = []

        // Collect MediaPipe feature sequence
        const visualSequence: number[][] = []

        // Extract MediaPipe features from each frame
        // Model expects 89 features: blendshapes (52) + head_pose (3) + upper_body_pose (34)
        // Upper body landmarks: 17 landmarks (face + shoulders + arms + upper torso) × 2 coords (x,y) = 34
        // Upper body indices: 0-10 (face/shoulders) + 11,12 (elbows) + 13,14 (wrists) + 23,24 (hips/upper torso)
        const UPPER_BODY_INDICES = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 23, 24] // 17 landmarks
        
        for (const data of mediapipeData) {
            // Extract blendshapes (52)
            const blendshapes = data.blendshapes || []
            if (blendshapes.length !== 52) {
                continue // Skip if blendshapes are missing
            }
            
            // Extract head pose (3)
            const headPose = data.headPose || [0, 0, 0]
            if (headPose.length !== 3) {
                continue
            }
            
            // Extract and reduce pose landmarks to match training format
            const poseLandmarks = data.poseLandmarks || []
            if (poseLandmarks.length !== 99) {
                continue // Need full 3D pose to extract upper body
            }
            
            // Reshape pose landmarks: 99 values = 33 landmarks × 3 coords (x, y, z)
            const pose3D: number[][] = []
            for (let i = 0; i < 33; i++) {
                pose3D.push([
                    poseLandmarks[i * 3],
                    poseLandmarks[i * 3 + 1],
                    poseLandmarks[i * 3 + 2]
                ])
            }
            
            // Extract upper body landmarks (17 landmarks) and keep only x,y (drop z)
            const upperBody2D: number[] = []
            for (const idx of UPPER_BODY_INDICES) {
                upperBody2D.push(pose3D[idx][0]) // x
                upperBody2D.push(pose3D[idx][1]) // y
            }
            // Should be 34 features (17 landmarks × 2 coords)
            
            // Combine: blendshapes (52) + head_pose (3) + upper_body_pose (34) = 89 features
            const combined = [
                ...blendshapes,      // 52 features
                ...headPose,         // 3 features
                ...upperBody2D       // 34 features
            ]
            
            if (combined.length === 89) {
                visualSequence.push(combined)
            }
        }

        // Predict from sequences using LSTM models
        const modalityPreds: ModalityPredictions = {
            visual: null,
            audio: null,
        }

        // Predict from visual OpenFace sequence
        if (visualSequence.length > 0) {
            modalityPreds.visual = await fusion.predictFromVisual(visualSequence)
        }

        // Predict from audio sequence (if available)
        if (audioSequence && audioSequence.length > 0) {
            modalityPreds.audio = await fusion.predictFromAudio(audioSequence)
        }

        // Fuse predictions (visual + audio)
        // If only visual is available, use visual predictions directly
        let fusedPred: ModelEmotionPredictions | null = null
        if (modalityPreds.visual && modalityPreds.audio) {
            // Both available: use fusion
            fusedPred = await fusion.fusePredictions(modalityPreds)
        } else if (modalityPreds.visual) {
            // Only visual available: use visual predictions
            fusedPred = modalityPreds.visual
        } else if (modalityPreds.audio) {
            // Only audio available: use audio predictions
            fusedPred = modalityPreds.audio
        }

        // Create segments based on fused predictions
        // For now, create a single segment for the entire video
        // In production, you could segment based on temporal changes
        if (fusedPred) {
            // Determine dominant emotion (excluding valence)
            const emotionEntries = Object.entries(fusedPred).filter(([emotion]) => emotion !== 'valence')
            const dominantEmotion = emotionEntries.reduce((max, [emotion, value]) =>
                value > max[1] ? [emotion, value] : max,
                ['happiness', 0] as [string, number]
            )[0]

            // Create segment for entire video
            segments.push({
                startFrame: 0,
                endFrame: mediapipeData.length - 1,
                startTime: 0,
                endTime: mediapipeData.length * frameTime,
                duration: mediapipeData.length * frameTime,
                dominantEmotion,
            })
        }

        // Use fused predictions as overall predictions
        const overallPreds: ModelEmotionPredictions = fusedPred || {
            curiosity: 0,
            uncertainty: 0,
            excitement: 0,
            happiness: 0,
            surprise: 0,
            disgust: 0,
            fear: 0,
            frustration: 0,
            valence: 4.0,
        }

        // Map to existing emotion format
        const mappedPredictions = mapDatasetToExisting(overallPreds)

        return {
            segments,
            overall: mappedPredictions,
            modelPredictions: overallPreds,
        }
    }

    /**
     * Combine video predictions with audio predictions
     */
    combineWithAudio(
        videoResult: MultimodalEmotionResult,
        audioPredictions?: Partial<ExistingEmotionPredictions>
    ): EmotionPredictions {
        return combinePredictions(videoResult.modelPredictions, audioPredictions)
    }
}

// Singleton instance
let predictorInstance: MultimodalEmotionPredictor | null = null

export function getMultimodalEmotionPredictor(): MultimodalEmotionPredictor {
    if (!predictorInstance) {
        predictorInstance = new MultimodalEmotionPredictor()
    }
    return predictorInstance
}

