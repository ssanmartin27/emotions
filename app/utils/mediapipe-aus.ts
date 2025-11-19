/**
 * Utility functions to calculate FACS Action Units (AUs) from MediaPipe face landmarks
 * Based on MediaPipe Face Mesh 468 landmarks
 */

export interface FaceLandmarks {
    x: number;
    y: number;
    z: number;
}

export interface AUs {
    AU01: number; // Inner brow raiser
    AU02: number; // Outer brow raiser
    AU04: number; // Brow lowerer
    AU05: number; // Upper lid raiser
    AU06: number; // Cheek raiser
    AU07: number; // Lid tightener
    AU12: number; // Lip corner puller
    AU14: number; // Dimpler
    AU15: number; // Lip corner depressor
    AU17: number; // Chin raiser
    AU20: number; // Lip stretcher
    AU25: number; // Lips part
}

/**
 * MediaPipe Face Mesh landmark indices
 * Reference: https://github.com/tensorflow/tfjs-models/blob/master/face-landmarks-detection/src/mediapipe-facemesh/keypoints.ts
 */
const LANDMARKS = {
    // Eyebrows
    LEFT_EYEBROW_INNER: 107,
    LEFT_EYEBROW_OUTER: 33,
    RIGHT_EYEBROW_INNER: 336,
    RIGHT_EYEBROW_OUTER: 263,
    LEFT_EYEBROW_MID: 70,
    RIGHT_EYEBROW_MID: 300,
    
    // Eyes
    LEFT_EYE_TOP: 159,
    LEFT_EYE_BOTTOM: 145,
    LEFT_EYE_LEFT: 33,
    LEFT_EYE_RIGHT: 133,
    RIGHT_EYE_TOP: 386,
    RIGHT_EYE_BOTTOM: 374,
    RIGHT_EYE_LEFT: 362,
    RIGHT_EYE_RIGHT: 263,
    
    // Nose
    NOSE_TIP: 4,
    NOSE_BOTTOM: 2,
    
    // Mouth
    MOUTH_LEFT: 61,
    MOUTH_RIGHT: 291,
    MOUTH_TOP: 13,
    MOUTH_BOTTOM: 14,
    UPPER_LIP_TOP: 13,
    UPPER_LIP_BOTTOM: 14,
    LOWER_LIP_TOP: 14,
    LOWER_LIP_BOTTOM: 18,
    LIP_LEFT_CORNER: 61,
    LIP_RIGHT_CORNER: 291,
    
    // Cheeks
    LEFT_CHEEK: 116,
    RIGHT_CHEEK: 345,
    
    // Chin
    CHIN: 18,
    CHIN_BOTTOM: 175,
} as const;

/**
 * Calculate Euclidean distance between two 3D points
 */
function distance(p1: FaceLandmarks, p2: FaceLandmarks): number {
    const dx = p1.x - p2.x;
    const dy = p1.y - p2.y;
    const dz = p1.z - p2.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

/**
 * Calculate angle between three points
 */
function angle(p1: FaceLandmarks, p2: FaceLandmarks, p3: FaceLandmarks): number {
    const v1 = { x: p1.x - p2.x, y: p1.y - p2.y, z: p1.z - p2.z };
    const v2 = { x: p3.x - p2.x, y: p3.y - p2.y, z: p3.z - p2.z };
    const dot = v1.x * v2.x + v1.y * v2.y + v1.z * v2.z;
    const mag1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y + v1.z * v1.z);
    const mag2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y + v2.z * v2.z);
    return Math.acos(Math.max(-1, Math.min(1, dot / (mag1 * mag2))));
}

/**
 * Normalize AU value to 0-5 range (matching dataset format)
 */
function normalizeAU(value: number, min: number, max: number): number {
    if (max === min) return 0;
    const normalized = ((value - min) / (max - min)) * 5;
    return Math.max(0, Math.min(5, normalized));
}

/**
 * Calculate all FACS Action Units from MediaPipe face landmarks
 */
export function calculateAUs(landmarks: FaceLandmarks[]): AUs {
    if (landmarks.length < 468) {
        // Return zeros if not enough landmarks
        return {
            AU01: 0, AU02: 0, AU04: 0, AU05: 0, AU06: 0, AU07: 0,
            AU12: 0, AU14: 0, AU15: 0, AU17: 0, AU20: 0, AU25: 0,
        };
    }

    // Get reference points
    const leftEyebrowInner = landmarks[LANDMARKS.LEFT_EYEBROW_INNER];
    const leftEyebrowOuter = landmarks[LANDMARKS.LEFT_EYEBROW_OUTER];
    const rightEyebrowInner = landmarks[LANDMARKS.RIGHT_EYEBROW_INNER];
    const rightEyebrowOuter = landmarks[LANDMARKS.RIGHT_EYEBROW_OUTER];
    const leftEyebrowMid = landmarks[LANDMARKS.LEFT_EYEBROW_MID];
    const rightEyebrowMid = landmarks[LANDMARKS.RIGHT_EYEBROW_MID];
    
    const leftEyeTop = landmarks[LANDMARKS.LEFT_EYE_TOP];
    const leftEyeBottom = landmarks[LANDMARKS.LEFT_EYE_BOTTOM];
    const rightEyeTop = landmarks[LANDMARKS.RIGHT_EYE_TOP];
    const rightEyeBottom = landmarks[LANDMARKS.RIGHT_EYE_BOTTOM];
    
    const noseTip = landmarks[LANDMARKS.NOSE_TIP];
    const noseBottom = landmarks[LANDMARKS.NOSE_BOTTOM];
    
    const mouthLeft = landmarks[LANDMARKS.MOUTH_LEFT];
    const mouthRight = landmarks[LANDMARKS.MOUTH_RIGHT];
    const mouthTop = landmarks[LANDMARKS.MOUTH_TOP];
    const mouthBottom = landmarks[LANDMARKS.MOUTH_BOTTOM];
    const upperLipTop = landmarks[LANDMARKS.UPPER_LIP_TOP];
    const lowerLipBottom = landmarks[LANDMARKS.LOWER_LIP_BOTTOM];
    
    const leftCheek = landmarks[LANDMARKS.LEFT_CHEEK];
    const rightCheek = landmarks[LANDMARKS.RIGHT_CHEEK];
    const chin = landmarks[LANDMARKS.CHIN];
    const chinBottom = landmarks[LANDMARKS.CHIN_BOTTOM];

    // Reference distances (using face width as normalization)
    const faceWidth = distance(landmarks[0], landmarks[16]); // Left to right face edge
    const faceHeight = distance(landmarks[10], landmarks[152]); // Top to bottom face edge
    const refDistance = (faceWidth + faceHeight) / 2;

    // AU01: Inner brow raiser - vertical distance between inner eyebrows and eyes
    const leftInnerBrowHeight = Math.abs(leftEyebrowInner.y - leftEyeTop.y);
    const rightInnerBrowHeight = Math.abs(rightEyebrowInner.y - rightEyeTop.y);
    const avgInnerBrowHeight = (leftInnerBrowHeight + rightInnerBrowHeight) / 2;
    const AU01 = normalizeAU(avgInnerBrowHeight / refDistance, 0.01, 0.1);

    // AU02: Outer brow raiser - vertical distance between outer eyebrows and eyes
    const leftOuterBrowHeight = Math.abs(leftEyebrowOuter.y - leftEyeTop.y);
    const rightOuterBrowHeight = Math.abs(rightEyebrowOuter.y - rightEyeTop.y);
    const avgOuterBrowHeight = (leftOuterBrowHeight + rightOuterBrowHeight) / 2;
    const AU02 = normalizeAU(avgOuterBrowHeight / refDistance, 0.01, 0.1);

    // AU04: Brow lowerer - distance between eyebrows (frowning)
    const browDistance = distance(leftEyebrowMid, rightEyebrowMid);
    const eyeDistance = distance(leftEyeTop, rightEyeTop);
    const browLowererRatio = browDistance / eyeDistance;
    const AU04 = normalizeAU(browLowererRatio, 0.8, 1.2);

    // AU05: Upper lid raiser - eye opening height
    const leftEyeOpen = Math.abs(leftEyeTop.y - leftEyeBottom.y);
    const rightEyeOpen = Math.abs(rightEyeTop.y - rightEyeBottom.y);
    const avgEyeOpen = (leftEyeOpen + rightEyeOpen) / 2;
    const AU05 = normalizeAU(avgEyeOpen / refDistance, 0.02, 0.08);

    // AU06: Cheek raiser - distance from cheek to eye (smile indicator)
    const leftCheekToEye = distance(leftCheek, leftEyeBottom);
    const rightCheekToEye = distance(rightCheek, rightEyeBottom);
    const avgCheekToEye = (leftCheekToEye + rightCheekToEye) / 2;
    const AU06 = normalizeAU(avgCheekToEye / refDistance, 0.15, 0.25);

    // AU07: Lid tightener - eye width (squinting)
    const leftEyeWidth = Math.abs(leftEyeTop.x - leftEyeBottom.x);
    const rightEyeWidth = Math.abs(rightEyeTop.x - rightEyeBottom.x);
    const avgEyeWidth = (leftEyeWidth + rightEyeWidth) / 2;
    const AU07 = normalizeAU(avgEyeWidth / refDistance, 0.01, 0.05);

    // AU12: Lip corner puller - mouth width (smile)
    const mouthWidth = distance(mouthLeft, mouthRight);
    const AU12 = normalizeAU(mouthWidth / refDistance, 0.08, 0.15);

    // AU14: Dimpler - mouth corner movement
    const mouthCornerAngle = angle(mouthLeft, mouthTop, mouthRight);
    const AU14 = normalizeAU(mouthCornerAngle, 1.0, 2.0);

    // AU15: Lip corner depressor - vertical distance from mouth corners to bottom
    const leftCornerDepression = Math.abs(mouthLeft.y - mouthBottom.y);
    const rightCornerDepression = Math.abs(mouthRight.y - mouthBottom.y);
    const avgCornerDepression = (leftCornerDepression + rightCornerDepression) / 2;
    const AU15 = normalizeAU(avgCornerDepression / refDistance, 0.05, 0.12);

    // AU17: Chin raiser - chin to mouth distance
    const chinToMouth = distance(chin, mouthBottom);
    const AU17 = normalizeAU(chinToMouth / refDistance, 0.05, 0.12);

    // AU20: Lip stretcher - horizontal mouth stretch
    const lipStretch = Math.abs(mouthLeft.x - mouthRight.x) / faceWidth;
    const AU20 = normalizeAU(lipStretch, 0.1, 0.2);

    // AU25: Lips part - vertical mouth opening
    const lipsPart = Math.abs(mouthTop.y - mouthBottom.y);
    const AU25 = normalizeAU(lipsPart / refDistance, 0.01, 0.05);

    return {
        AU01,
        AU02,
        AU04,
        AU05,
        AU06,
        AU07,
        AU12,
        AU14,
        AU15,
        AU17,
        AU20,
        AU25,
    };
}

/**
 * Convert AUs to dataset format (with _r suffix)
 */
export function ausToDatasetFormat(aus: AUs): Record<string, number> {
    return {
        AU01_r: aus.AU01,
        AU02_r: aus.AU02,
        AU04_r: aus.AU04,
        AU05_r: aus.AU05,
        AU06_r: aus.AU06,
        AU07_r: aus.AU07,
        AU12_r: aus.AU12,
        AU14_r: aus.AU14,
        AU15_r: aus.AU15,
        AU17_r: aus.AU17,
        AU20_r: aus.AU20,
        AU25_r: aus.AU25,
    };
}





