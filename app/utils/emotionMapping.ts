/**
 * Emotion mapping utility
 * Maps between EmoReact dataset emotion labels and existing emotion labels for manual selection
 */

// EmoReact dataset emotions (9 emotions)
export type EmoReactEmotion = 'curiosity' | 'uncertainty' | 'excitement' | 'happiness' | 'surprise' | 'disgust' | 'fear' | 'frustration' | 'valence'

// Existing emotions (for manual selection UI)
export type ExistingEmotion = 'anger' | 'sadness' | 'anxiety' | 'fear' | 'happiness' | 'guilt'

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

export interface ExistingEmotionPredictions {
    anger: number
    sadness: number
    anxiety: number
    fear: number
    happiness: number
    guilt: number
}

/**
 * Map EmoReact emotion predictions to existing emotion format
 * This allows model predictions to be combined with manual selections
 */
export function mapDatasetToExisting(
    datasetPreds: ModelEmotionPredictions
): ExistingEmotionPredictions {
    return {
        // Map EmoReact emotions to existing emotions
        anger: datasetPreds.frustration, // Frustration can map to anger
        sadness: 0, // No direct mapping, could use low valence
        anxiety: 0, // Not in EmoReact, will come from audio processing
        fear: datasetPreds.fear,
        happiness: datasetPreds.happiness,
        guilt: 0, // Not in EmoReact, will come from audio processing
    }
}

/**
 * Get dominant emotion from EmoReact predictions (excluding valence)
 */
export function getDominantDatasetEmotion(predictions: ModelEmotionPredictions): EmoReactEmotion {
    // Exclude valence from dominant emotion calculation
    const { valence, ...emotions } = predictions
    const entries = Object.entries(emotions) as Array<[EmoReactEmotion, number]>
    const maxEntry = entries.reduce((max, [emotion, value]) => 
        value > max[1] ? [emotion, value] : max,
        ['happiness', 0] as [EmoReactEmotion, number]
    )
    return maxEntry[0]
}

/**
 * Get dominant emotion from existing predictions
 */
export function getDominantExistingEmotion(predictions: ExistingEmotionPredictions): ExistingEmotion {
    const entries = Object.entries(predictions) as Array<[ExistingEmotion, number]>
    const maxEntry = entries.reduce((max, [emotion, value]) => 
        value > max[1] ? [emotion, value] : max,
        ['happiness', 0] as [ExistingEmotion, number]
    )
    return maxEntry[0]
}

/**
 * Combine dataset predictions with audio predictions (which may include anxiety/guilt)
 */
export function combinePredictions(
    datasetPreds: ModelEmotionPredictions,
    audioPreds?: Partial<ExistingEmotionPredictions>
): ExistingEmotionPredictions {
    const mapped = mapDatasetToExisting(datasetPreds)
    
    // Add anxiety and guilt from audio if available
    if (audioPreds) {
        if (audioPreds.anxiety !== undefined) {
            mapped.anxiety = audioPreds.anxiety
        }
        if (audioPreds.guilt !== undefined) {
            mapped.guilt = audioPreds.guilt
        }
    }
    
    return mapped
}
