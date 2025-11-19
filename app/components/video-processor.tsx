"use client"

import { useEffect, useRef, useState, useCallback, useMemo } from "react"
import { FilesetResolver, FaceLandmarker, PoseLandmarker } from "@mediapipe/tasks-vision"
// Removed AU calculation - using blendshapes directly
import { Button } from "~/components/ui/button"
import { Progress } from "~/components/ui/progress"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card"
import { Upload, X, Play, Pause } from "lucide-react"
import { toast } from "sonner"

export interface LandmarkData {
    frame: number
    timestamp: number
    faceBlendshapes: number[] // 52 blendshape coefficients
    headPose: number[] // 3 values: [rx (roll), ry (pitch), rz (yaw)]
    poseLandmarks: number[] // 99 values: 33 landmarks × 3 coordinates (x, y, z)
}

interface VideoProcessorProps {
    onLandmarksExtracted: (landmarks: LandmarkData[]) => void
    onError?: (error: Error) => void
    onAudioExtracted?: (audioFile: File) => void // Callback for extracted audio
    onFileRemoved?: () => void // Callback when file is removed
    initialFile?: File | null // Optional initial video file
}

export function VideoProcessor({ onLandmarksExtracted, onError, onAudioExtracted, onFileRemoved, initialFile }: VideoProcessorProps) {
    const videoRef = useRef<HTMLVideoElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const faceLandmarkerRef = useRef<FaceLandmarker | null>(null)
    const poseLandmarkerRef = useRef<PoseLandmarker | null>(null)
    const animationFrameRef = useRef<number | null>(null)
    
    // Track the current video file (either from initialFile prop or user upload)
    const [videoFile, setVideoFile] = useState<File | null>(null)
    
    // Determine the current video file to use - useMemo to ensure it updates when initialFile changes
    const currentVideoFile = useMemo(() => {
        const result = videoFile || (initialFile && initialFile.type.startsWith("video/") ? initialFile : null)
        console.log("VideoProcessor currentVideoFile:", {
            hasVideoFile: !!videoFile,
            hasInitialFile: !!initialFile,
            initialFileType: initialFile?.type,
            result: result?.name
        })
        return result
    }, [videoFile, initialFile])
    
    const [isProcessing, setIsProcessing] = useState(false)
    const [progress, setProgress] = useState(0)
    const [isPlaying, setIsPlaying] = useState(false)
    const [landmarks, setLandmarks] = useState<LandmarkData[]>([])
    const [currentFrame, setCurrentFrame] = useState(0)
    const [totalFrames, setTotalFrames] = useState(0)
    const [isInitialized, setIsInitialized] = useState(false)
    const lastTimestampRef = useRef<number>(0)
    const processedLandmarksRef = useRef<LandmarkData[]>([])
    const poseTimestampRef = useRef<number>(0)
    const [currentPoseData, setCurrentPoseData] = useState<{
        landmarksCount: number
        visibility: number
        detected: boolean
    } | null>(null)

    // Initialize MediaPipe Face Landmarker and Pose Landmarker
    useEffect(() => {
        let isMounted = true

        const initializeLandmarkers = async () => {
            try {
                const vision = await FilesetResolver.forVisionTasks(
                    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
                )

                // Initialize Face Landmarker with blendshapes and transformation matrix
                const faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
                    baseOptions: {
                        modelAssetPath: "/models/face_landmarker.task",
                        delegate: "GPU",
                    },
                    outputFaceBlendshapes: true,
                    outputFacialTransformationMatrixes: true,
                    runningMode: "VIDEO" as const,
                    numFaces: 1,
                    minFaceDetectionConfidence: 0.5,
                    minFacePresenceConfidence: 0.5,
                    minTrackingConfidence: 0.5,
                })

                // Initialize Pose Landmarker
                // Try GPU first, fallback to CPU if needed
                let poseLandmarker: PoseLandmarker
                try {
                    poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
                        baseOptions: {
                            modelAssetPath: "/models/pose_landmarker.task",
                            delegate: "GPU",
                        },
                    runningMode: "VIDEO" as const,
                    numPoses: 1,
                    minPoseDetectionConfidence: 0.1, // Very low threshold for better detection
                    minPosePresenceConfidence: 0.1, // Very low threshold for better detection
                    minTrackingConfidence: 0.1, // Very low threshold for better detection
                    })
                    console.log("Pose Landmarker initialized with GPU")
                } catch (gpuError) {
                    console.warn("GPU initialization failed, trying CPU:", gpuError)
                    poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
                        baseOptions: {
                            modelAssetPath: "/models/pose_landmarker.task",
                            delegate: "CPU",
                        },
                        runningMode: "VIDEO" as const,
                        numPoses: 1,
                        minPoseDetectionConfidence: 0.1,
                        minPosePresenceConfidence: 0.1,
                        minTrackingConfidence: 0.1,
                    })
                    console.log("Pose Landmarker initialized with CPU")
                }

                if (isMounted) {
                    faceLandmarkerRef.current = faceLandmarker
                    poseLandmarkerRef.current = poseLandmarker
                    setIsInitialized(true)
                }
            } catch (error) {
                console.error("Error initializing Landmarkers:", error)
                if (onError) {
                    onError(error as Error)
                }
            }
        }

        initializeLandmarkers()

        return () => {
            isMounted = false
            if (faceLandmarkerRef.current) {
                faceLandmarkerRef.current.close()
            }
            if (poseLandmarkerRef.current) {
                poseLandmarkerRef.current.close()
            }
        }
    }, [onError])

    // Reset state when initialFile changes (but don't overwrite user-uploaded file)
    useEffect(() => {
        if (initialFile && initialFile.type.startsWith("video/")) {
            // Reset processing state when initialFile changes
            if (!videoFile || videoFile !== initialFile) {
                setLandmarks([])
                setProgress(0)
                setCurrentFrame(0)
                setIsPlaying(false)
                // Clear video element
                if (videoRef.current) {
                    videoRef.current.pause()
                    videoRef.current.src = ""
                }
            }
        }
    }, [initialFile, videoFile])

    // Handle video file selection
    const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (file && file.type.startsWith("video/")) {
            setVideoFile(file)
            setLandmarks([])
            setProgress(0)
            setCurrentFrame(0)
        }
    }, [])

    // Draw pose landmarks on canvas
    const drawPoseLandmarks = useCallback((ctx: CanvasRenderingContext2D, poseLandmarks: any[], canvasWidth: number, canvasHeight: number) => {
        if (!poseLandmarks || poseLandmarks.length === 0) return

        // Pose connections (MediaPipe Pose has 33 landmarks)
        // Standard MediaPipe Pose skeleton connections - full body skeleton
        const poseConnections = [
            // Face outline
            [0, 1], [1, 2], [2, 3], [3, 7],
            // Torso (shoulders and core)
            [11, 12], // Left shoulder to right shoulder
            [11, 23], // Left shoulder to left hip
            [12, 24], // Right shoulder to right hip
            [23, 24], // Left hip to right hip
            // Left arm
            [11, 13], // Left shoulder to left elbow
            [13, 15], // Left elbow to left wrist
            [15, 17], [15, 19], [15, 21], [17, 19], // Left hand connections
            // Right arm
            [12, 14], // Right shoulder to right elbow
            [14, 16], // Right elbow to right wrist
            [16, 18], [16, 20], [16, 22], [18, 20], // Right hand connections
            // Left leg
            [23, 25], // Left hip to left knee
            [25, 27], // Left knee to left ankle
            [27, 29], [29, 31], [27, 31], // Left foot connections
            // Right leg
            [24, 26], // Right hip to right knee
            [26, 28], // Right knee to right ankle
            [28, 30], [30, 32], [28, 32], // Right foot connections
        ]

        // Draw pose connections (skeleton) - make them more visible
        ctx.strokeStyle = "#00FFFF"
        ctx.lineWidth = 4
        ctx.globalAlpha = 0.9

        poseConnections.forEach(([startIdx, endIdx]) => {
            if (startIdx < poseLandmarks.length && endIdx < poseLandmarks.length && poseLandmarks[startIdx] && poseLandmarks[endIdx]) {
                const start = poseLandmarks[startIdx]
                const end = poseLandmarks[endIdx]
                // Lower visibility threshold to show more connections
                if (start.visibility && end.visibility && start.visibility > 0.3 && end.visibility > 0.3) {
                    ctx.beginPath()
                    ctx.moveTo(start.x * canvasWidth, start.y * canvasHeight)
                    ctx.lineTo(end.x * canvasWidth, end.y * canvasHeight)
                    ctx.stroke()
                }
            }
        })

        ctx.globalAlpha = 1.0

        // Draw pose landmark points - make them more visible
        // Draw all landmarks, but use different colors based on visibility
        poseLandmarks.forEach((landmark, idx) => {
            if (landmark && landmark.x !== undefined && landmark.y !== undefined && landmark.visibility) {
                // Lower visibility threshold to show more points
                if (landmark.visibility > 0.3) {
                    // Use brighter color for high visibility, dimmer for lower
                    const alpha = Math.min(1, landmark.visibility * 1.5)
                    ctx.fillStyle = `rgba(0, 255, 255, ${alpha})`
                    ctx.beginPath()
                    ctx.arc(landmark.x * canvasWidth, landmark.y * canvasHeight, 5, 0, 2 * Math.PI)
                    ctx.fill()
                    // Add a white outline for better visibility
                    ctx.strokeStyle = "#FFFFFF"
                    ctx.lineWidth = 1
                    ctx.stroke()
                }
            }
        })
    }, [])

    // Draw landmarks on canvas with proper face mesh
    const drawLandmarks = useCallback((ctx: CanvasRenderingContext2D, faceLandmarks: any[], canvasWidth: number, canvasHeight: number) => {
        if (!faceLandmarks || faceLandmarks.length === 0) return

        // Face mesh tesselation connections (key connections for face mesh visualization)
        // These are the main connections that create the face mesh
        const faceMeshConnections = [
            // Face outline
            [10, 338], [338, 297], [297, 332], [332, 284], [284, 251], [251, 389], [389, 356], [356, 454], [454, 323], [323, 361], [361, 288], [288, 397], [397, 365], [365, 379], [379, 378], [378, 400], [400, 377], [377, 152], [152, 148], [148, 176], [176, 149], [149, 150], [150, 136], [136, 172], [172, 58], [58, 132], [132, 93], [93, 234], [234, 127], [127, 162], [162, 21], [21, 54], [54, 103], [103, 67], [67, 109], [109, 10],
            // Left eyebrow
            [107, 66], [66, 105], [105, 63], [63, 70], [70, 156], [156, 143], [143, 35], [35, 31], [31, 228], [228, 229], [229, 230], [230, 231], [231, 232], [232, 233], [233, 244], [244, 245], [245, 122], [122, 6], [6, 141], [141, 36], [36, 107],
            // Right eyebrow
            [336, 296], [296, 334], [334, 293], [293, 300], [300, 276], [276, 283], [283, 282], [282, 295], [295, 285], [285, 336],
            // Left eye
            [33, 7], [7, 163], [163, 144], [144, 145], [145, 153], [153, 154], [154, 155], [155, 133], [133, 173], [173, 157], [157, 158], [158, 159], [159, 160], [160, 161], [161, 246], [246, 33],
            // Right eye
            [263, 249], [249, 390], [390, 373], [373, 374], [374, 380], [380, 381], [381, 382], [382, 362], [362, 398], [398, 384], [384, 385], [385, 386], [386, 387], [387, 388], [388, 466], [466, 263],
            // Nose
            [1, 2], [2, 98], [98, 327], [327, 326], [326, 2], [2, 97], [97, 326], [326, 2], [2, 3], [3, 51], [51, 48], [48, 115], [115, 131], [131, 134], [134, 102], [102, 49], [49, 220], [220, 305], [305, 289], [289, 305], [305, 290], [290, 305], [305, 4], [4, 5], [5, 195], [195, 197], [197, 196], [196, 3],
            // Mouth
            [61, 146], [146, 91], [91, 181], [181, 84], [84, 17], [17, 314], [314, 405], [405, 320], [320, 307], [307, 375], [375, 321], [321, 308], [308, 324], [324, 318], [318, 13], [13, 82], [82, 81], [81, 80], [80, 78], [78, 95], [95, 88], [88, 178], [178, 87], [87, 14], [14, 317], [317, 402], [402, 318], [318, 324], [324, 308], [308, 307], [307, 375], [375, 321], [321, 308], [308, 324], [324, 318], [318, 13], [13, 82], [82, 81], [81, 80], [80, 78], [78, 95], [95, 88], [88, 178], [178, 87], [87, 14], [14, 317], [317, 402], [402, 318], [318, 324], [324, 308], [308, 307], [307, 375], [375, 321], [321, 308], [308, 324], [324, 318], [318, 13], [13, 82], [82, 81], [81, 80], [80, 78], [78, 95], [95, 88], [88, 178], [178, 87], [87, 14], [14, 317], [317, 402], [402, 318], [318, 324], [324, 308], [308, 307], [307, 375], [375, 321], [321, 308], [308, 324], [324, 318], [318, 13], [13, 82], [82, 81], [81, 80], [80, 78], [78, 95], [95, 88], [88, 178], [178, 87], [87, 14], [14, 317], [317, 402], [402, 61],
        ]

        // Draw face mesh connections - make them more visible
        ctx.strokeStyle = "#00FF00"
        ctx.lineWidth = 2
        ctx.globalAlpha = 0.8
        
        faceMeshConnections.forEach(([startIdx, endIdx]) => {
            if (startIdx < faceLandmarks.length && endIdx < faceLandmarks.length && faceLandmarks[startIdx] && faceLandmarks[endIdx]) {
                const start = faceLandmarks[startIdx]
                const end = faceLandmarks[endIdx]
                ctx.beginPath()
                ctx.moveTo(start.x * canvasWidth, start.y * canvasHeight)
                ctx.lineTo(end.x * canvasWidth, end.y * canvasHeight)
                ctx.stroke()
            }
        })
        
        ctx.globalAlpha = 1.0

        // Draw all landmark points - make them more visible
        ctx.fillStyle = "#FF0000"
        faceLandmarks.forEach((landmark, idx) => {
            if (landmark && landmark.x !== undefined && landmark.y !== undefined) {
                ctx.beginPath()
                ctx.arc(landmark.x * canvasWidth, landmark.y * canvasHeight, 3, 0, 2 * Math.PI)
                ctx.fill()
            }
        })
    }, [])

    // Process video frame
    const processFrame = useCallback(async () => {
        if (!videoRef.current || !canvasRef.current || !faceLandmarkerRef.current || !poseLandmarkerRef.current || !isInitialized) {
            return
        }

        const video = videoRef.current
        const canvas = canvasRef.current
        const ctx = canvas.getContext("2d")
        if (!ctx) return

        // Set canvas size to match video
        canvas.width = video.videoWidth || 640
        canvas.height = video.videoHeight || 480

        // Draw current video frame
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

        const frameNumber = Math.floor(video.currentTime * 30) // Assume 30 FPS
        const timestamp = video.currentTime

        try {
            // Detect face landmarks - timestamps must be strictly monotonically increasing
            // Use a counter that always increases, not video.currentTime which can reset
            const baseTimestamp = Math.floor(video.currentTime * 1000)
            // Ensure timestamp is always greater than the last one
            const timestampMs = Math.max(lastTimestampRef.current + 1, baseTimestamp)
            lastTimestampRef.current = timestampMs
            
            const results = faceLandmarkerRef.current.detectForVideo(video, timestampMs)

            // Detect pose landmarks
            // Use canvas ImageData instead of video element for better compatibility
            const poseTimestampMs = Math.max(poseTimestampRef.current + 1, Math.floor(video.currentTime * 1000))
            poseTimestampRef.current = poseTimestampMs
            
            // Ensure video is ready
            // if (video.readyState < 2) {
            //     console.warn(`Frame ${frameNumber}: Video not ready (readyState: ${video.readyState})`) // Disabled for performance
            // }
            
            let poseResults
            try {
                // Try using canvas first (more reliable)
                poseResults = poseLandmarkerRef.current.detectForVideo(canvas, poseTimestampMs)
            } catch (canvasError) {
                // console.warn(`Frame ${frameNumber}: Canvas detection failed, trying video element:`, canvasError) // Disabled for performance
                try {
                    poseResults = poseLandmarkerRef.current.detectForVideo(video, poseTimestampMs)
                } catch (videoError) {
                    // console.error(`Frame ${frameNumber}: Both canvas and video detection failed:`, videoError) // Disabled for performance
                    poseResults = { landmarks: null, worldLandmarks: null }
                }
            }

            // Debug logging disabled for performance - enable only when debugging
            // if (frameNumber < 5 || frameNumber % 30 === 0) {
            //     console.log(`Frame ${frameNumber}: Pose detection results:`, {...})
            // }

            let poseLandmarksArray: number[] = []
            // Check for pose landmarks - MediaPipe uses 'landmarks' not 'poseLandmarks'
            const hasPoses = poseResults.landmarks && poseResults.landmarks.length > 0
            
            if (hasPoses) {
                const poseLandmarks = poseResults.landmarks[0]
                // console.log(`Frame ${frameNumber}: Detected ${poseLandmarks.length} pose landmarks`) // Disabled for performance

                // Draw pose landmarks on canvas
                drawPoseLandmarks(ctx, poseLandmarks, canvas.width, canvas.height)

                // Calculate average visibility
                const avgVisibility = poseLandmarks.reduce((sum, lm) => sum + (lm.visibility || 0), 0) / poseLandmarks.length

                // Update pose data state for display
                setCurrentPoseData({
                    landmarksCount: poseLandmarks.length,
                    visibility: avgVisibility,
                    detected: true,
                })

                // Store pose landmarks (only x, y, z - 99 values: 33 × 3)
                poseLandmarksArray = poseLandmarks.flatMap((lm) => [
                    lm.x,
                    lm.y,
                    lm.z || 0
                ])
            } else {
                // Debug logging disabled for performance
                // if (frameNumber < 5 || frameNumber % 30 === 0) {
                //     console.warn(`Frame ${frameNumber}: No pose detected`, {...})
                // }
                setCurrentPoseData({
                    landmarksCount: 0,
                    visibility: 0,
                    detected: false,
                })
            }

            // Process face features
            let faceBlendshapes: number[] = new Array(52).fill(0)
            let headPose: number[] = [0, 0, 0] // [rx, ry, rz]

            if (results.faceLandmarks && results.faceLandmarks.length > 0) {
                const faceLandmarks = results.faceLandmarks[0]
                // Draw face landmarks on canvas
                drawLandmarks(ctx, faceLandmarks, canvas.width, canvas.height)

                // Extract blendshapes
                if (results.faceBlendshapes && results.faceBlendshapes.length > 0) {
                    const blendshapes = results.faceBlendshapes[0]
                    // Ensure blendshapes is an array
                    if (Array.isArray(blendshapes) && blendshapes.length > 0) {
                        if (blendshapes.length >= 52) {
                            faceBlendshapes = blendshapes.slice(0, 52).map(bs => bs?.score ?? 0)
                        } else {
                            // Pad to 52 if needed
                            faceBlendshapes = blendshapes.map(bs => bs?.score ?? 0)
                            while (faceBlendshapes.length < 52) {
                                faceBlendshapes.push(0)
                            }
                        }
                    }
                }

                // Extract head pose from transformation matrix
                if (results.facialTransformationMatrixes && results.facialTransformationMatrixes.length > 0) {
                    const matrix = results.facialTransformationMatrixes[0]
                    // Extract rotation angles from 4x4 transformation matrix
                    // Matrix format: 4x4 array
                    if (matrix && matrix.length === 4 && matrix[0].length === 4) {
                        // Extract rotation matrix (3x3 upper-left)
                        const R = [
                            [matrix[0][0], matrix[0][1], matrix[0][2]],
                            [matrix[1][0], matrix[1][1], matrix[1][2]],
                            [matrix[2][0], matrix[2][1], matrix[2][2]]
                        ]
                        
                        // Convert rotation matrix to Euler angles (ZYX order)
                        // MediaPipe uses: roll (rx), pitch (ry), yaw (rz)
                        const sy = Math.sqrt(R[0][0] * R[0][0] + R[1][0] * R[1][0])
                        const singular = sy < 1e-6
                        
                        let rx, ry, rz
                        if (!singular) {
                            rx = Math.atan2(R[2][1], R[2][2])
                            ry = Math.atan2(-R[2][0], sy)
                            rz = Math.atan2(R[1][0], R[0][0])
                        } else {
                            rx = Math.atan2(-R[1][2], R[1][1])
                            ry = Math.atan2(-R[2][0], sy)
                            rz = 0
                        }
                        
                        headPose = [rx, ry, rz] // [roll, pitch, yaw]
                    }
                }
            }

            // Create landmark data (even if features are missing)
            const landmarkData: LandmarkData = {
                frame: frameNumber,
                timestamp,
                faceBlendshapes,
                headPose,
                poseLandmarks: poseLandmarksArray,
            }

            setLandmarks((prev) => {
                const updated = [...prev]
                // Update or add frame data
                const existingIndex = updated.findIndex((l) => l.frame === frameNumber)
                if (existingIndex >= 0) {
                    updated[existingIndex] = landmarkData
                } else {
                    updated.push(landmarkData)
                }
                const sorted = updated.sort((a, b) => a.frame - b.frame)
                // Update ref for completion handler
                processedLandmarksRef.current = sorted
                return sorted
            })

            setCurrentFrame(frameNumber)
        } catch (error) {
            console.error("Error processing frame:", error)
            if (onError) {
                onError(error as Error)
            }
        }
    }, [isInitialized, drawLandmarks, drawPoseLandmarks, onError])

    // Process entire video
    const processVideo = useCallback(async () => {
        if (!videoRef.current || !currentVideoFile || !isInitialized) return

        setIsProcessing(true)
        setProgress(0)
        setLandmarks([])

        const video = videoRef.current
        
        // Ensure video is paused and reset to beginning
        video.pause()
        setIsPlaying(false)
        video.currentTime = 0
        
        // Wait for video to be ready and seek to beginning
        await new Promise<void>((resolve) => {
            const handleSeeked = () => {
                video.removeEventListener("seeked", handleSeeked)
                resolve()
            }
            video.addEventListener("seeked", handleSeeked)
            // Force seek to 0 if already at 0
            if (video.currentTime === 0) {
                video.currentTime = 0.001
                video.currentTime = 0
            }
        })
        
        const fps = 30
        const frameDuration = 1 / fps
        const totalFrames = Math.floor(video.duration * fps)
        
        // Reset timestamp counters for new video processing
        lastTimestampRef.current = 0
        poseTimestampRef.current = 0

        let currentFrame = 0
        processedLandmarksRef.current = [] // Reset for new processing

        const processNextFrame = async () => {
            if (currentFrame >= totalFrames || video.currentTime >= video.duration) {
                setIsProcessing(false)
                // Show a frame with landmarks (use middle frame for better visibility)
                if (videoRef.current && canvasRef.current && processedLandmarksRef.current.length > 0) {
                    const video = videoRef.current
                    const canvas = canvasRef.current
                    const ctx = canvas.getContext("2d")
                    if (ctx && faceLandmarkerRef.current) {
                        // Show middle frame with landmarks
                        const middleFrame = processedLandmarksRef.current[Math.floor(processedLandmarksRef.current.length / 2)]
                        video.currentTime = middleFrame.timestamp
                        await new Promise<void>((resolve) => {
                            const handleSeeked = () => {
                                video.removeEventListener("seeked", handleSeeked)
                                resolve()
                            }
                            video.addEventListener("seeked", handleSeeked)
                        })
                        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
                        // Redetect to draw landmarks
                        try {
                            const timestampMs = Math.max(lastTimestampRef.current + 1, Math.floor(video.currentTime * 1000))
                            lastTimestampRef.current = timestampMs
                            const poseTimestampMs = Math.max(poseTimestampRef.current + 1, timestampMs)
                            poseTimestampRef.current = poseTimestampMs
                            
                            const faceResults = faceLandmarkerRef.current.detectForVideo(video, timestampMs)
                            const poseResults = poseLandmarkerRef.current.detectForVideo(video, poseTimestampMs)
                            
                            if (faceResults.faceLandmarks && faceResults.faceLandmarks.length > 0) {
                                drawLandmarks(ctx, faceResults.faceLandmarks[0], canvas.width, canvas.height)
                            }
                            if (poseResults.landmarks && poseResults.landmarks.length > 0) {
                                drawPoseLandmarks(ctx, poseResults.landmarks[0], canvas.width, canvas.height)
                            }
                        } catch (e) {
                            // Error drawing landmarks
                        }
                    }
                }
                video.currentTime = 0
                
                // Trigger audio extraction after video processing completes
                if (onAudioExtracted && currentVideoFile) {
                    onAudioExtracted(currentVideoFile)
                }
                
                return
            }

            // Seek to the frame time
            video.currentTime = currentFrame * frameDuration
            
            // Wait for seek to complete
            await new Promise<void>((resolve) => {
                const handleSeeked = () => {
                    video.removeEventListener("seeked", handleSeeked)
                    resolve()
                }
                video.addEventListener("seeked", handleSeeked)
            })

            // Process the frame (this already draws landmarks on canvas)
            await processFrame()
            
            currentFrame++
            setProgress((currentFrame / totalFrames) * 100)
            setCurrentFrame(currentFrame)

            // Process next frame with a small delay to avoid blocking
            setTimeout(processNextFrame, 10)
        }

        // Start processing
        processNextFrame()
    }, [currentVideoFile, processFrame, isInitialized, onAudioExtracted])

    // Draw video frame to canvas (for playback, no processing)
    const drawVideoFrame = useCallback(() => {
        if (!videoRef.current || !canvasRef.current) {
            return
        }

        const video = videoRef.current
        const canvas = canvasRef.current
        const ctx = canvas.getContext("2d")
        if (!ctx) return

        // Set canvas size to match video (only if changed)
        if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
            canvas.width = video.videoWidth || 640
            canvas.height = video.videoHeight || 480
        }

        // Draw current video frame
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    }, [])

    // Handle play/pause (just play/pause, no processing)
    const togglePlayPause = useCallback(async () => {
        if (!videoRef.current || !currentVideoFile) {
            toast.error("Video not loaded")
            return
        }

        const video = videoRef.current

        if (isPlaying) {
            video.pause()
            setIsPlaying(false)
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current)
                animationFrameRef.current = null
            }
            // Remove timeupdate listener
            const handler = (video as any)._playbackTimeUpdateHandler
            if (handler) {
                video.removeEventListener("timeupdate", handler)
                delete (video as any)._playbackTimeUpdateHandler
            }
        } else {
            try {
                // Ensure video is ready
                if (video.readyState < 2) {
                    await new Promise((resolve, reject) => {
                        const timeout = setTimeout(() => {
                            video.removeEventListener("canplay", handleCanPlay)
                            video.removeEventListener("error", handleError)
                            reject(new Error("Timeout waiting for video to load"))
                        }, 10000)
                        
                        const handleCanPlay = () => {
                            clearTimeout(timeout)
                            video.removeEventListener("canplay", handleCanPlay)
                            video.removeEventListener("error", handleError)
                            resolve(undefined)
                        }
                        
                        const handleError = () => {
                            clearTimeout(timeout)
                            video.removeEventListener("canplay", handleCanPlay)
                            video.removeEventListener("error", handleError)
                            reject(new Error("Video failed to load"))
                        }
                        
                        video.addEventListener("canplay", handleCanPlay)
                        video.addEventListener("error", handleError)
                        video.load()
                    })
                }
                
                // Play the video
                await video.play()
                setIsPlaying(true)
                
                // Draw initial frame
                drawVideoFrame()
                
                // Use timeupdate event to update canvas during playback
                const handleTimeUpdate = () => {
                    drawVideoFrame()
                }
                
                video.addEventListener("timeupdate", handleTimeUpdate)
                
                // Store handler for cleanup
                ;(video as any)._playbackTimeUpdateHandler = handleTimeUpdate
            } catch (error) {
                console.error("Error playing video:", error)
                toast.error(`Failed to play video: ${error instanceof Error ? error.message : 'Unknown error'}`)
                setIsPlaying(false)
            }
        }
    }, [isPlaying, currentVideoFile, drawVideoFrame])

    // Load and display video when file is selected
    useEffect(() => {
        if (currentVideoFile && videoRef.current && canvasRef.current) {
            const video = videoRef.current
            const canvas = canvasRef.current
            const ctx = canvas.getContext("2d")
            
            // Clean up previous URL if exists
            if (video.src) {
                const oldUrl = video.src
                video.src = ""
                URL.revokeObjectURL(oldUrl)
            }
            
            const url = URL.createObjectURL(currentVideoFile)
            video.src = url
            video.load()
            
            console.log("VideoProcessor: Loading video", {
                fileName: currentVideoFile.name,
                fileType: currentVideoFile.type,
                hasVideoRef: !!videoRef.current,
                hasCanvasRef: !!canvasRef.current
            })
            
            const handleLoadedMetadata = () => {
                if (video && canvas && ctx) {
                    canvas.width = video.videoWidth || 640
                    canvas.height = video.videoHeight || 480
                    
                    // Draw first frame
                    video.currentTime = 0.1 // Small offset to ensure frame is loaded
                    const handleSeeked = () => {
                        if (ctx && video) {
                            ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
                        }
                        video.removeEventListener("seeked", handleSeeked)
                    }
                    video.addEventListener("seeked", handleSeeked)
                    
                    const fps = 30
                    const duration = video.duration
                    setTotalFrames(Math.floor(duration * fps))
                }
            }
            
            const handleCanPlay = () => {
                // Video is ready to play
                video.removeEventListener("canplay", handleCanPlay)
            }
            
            video.addEventListener("loadedmetadata", handleLoadedMetadata)
            video.addEventListener("canplay", handleCanPlay)
            
            return () => {
                video.removeEventListener("loadedmetadata", handleLoadedMetadata)
                video.removeEventListener("canplay", handleCanPlay)
                URL.revokeObjectURL(url)
            }
        }
    }, [currentVideoFile])

    // Cleanup
    useEffect(() => {
        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current)
                animationFrameRef.current = null
            }
        }
    }, [])

    // Stop animation when video ends or is paused
    useEffect(() => {
        const video = videoRef.current
        if (!video) return

        const handleEnded = () => {
            setIsPlaying(false)
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current)
                animationFrameRef.current = null
            }
            // Remove timeupdate listener
            const handler = (video as any)._playbackTimeUpdateHandler
            if (handler) {
                video.removeEventListener("timeupdate", handler)
                delete (video as any)._playbackTimeUpdateHandler
            }
        }

        const handlePause = () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current)
                animationFrameRef.current = null
            }
            // Remove timeupdate listener
            const handler = (video as any)._playbackTimeUpdateHandler
            if (handler) {
                video.removeEventListener("timeupdate", handler)
                delete (video as any)._playbackTimeUpdateHandler
            }
        }

        video.addEventListener("ended", handleEnded)
        video.addEventListener("pause", handlePause)

        return () => {
            video.removeEventListener("ended", handleEnded)
            video.removeEventListener("pause", handlePause)
            // Clean up timeupdate listener if exists
            const handler = (video as any)._playbackTimeUpdateHandler
            if (handler) {
                video.removeEventListener("timeupdate", handler)
                delete (video as any)._playbackTimeUpdateHandler
            }
        }
    }, [])

    // Notify parent when landmarks are ready
    useEffect(() => {
        if (landmarks.length > 0 && !isProcessing) {
            onLandmarksExtracted(landmarks)
            // Audio extraction is now handled in processVideo after processing completes
        }
    }, [landmarks, isProcessing, onLandmarksExtracted])

    return (
        <Card>
            <CardHeader>
                <CardTitle>Video Processing</CardTitle>
                <CardDescription>
                    Upload a video to extract facial landmarks and pose data
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {!isInitialized && (
                    <div className="text-sm text-muted-foreground">
                        Initializing MediaPipe Face Landmarker...
                    </div>
                )}
                {!currentVideoFile ? (
                    <div className="border-2 border-dashed rounded-lg p-8 text-center">
                        <input
                            type="file"
                            accept="video/*"
                            onChange={handleFileSelect}
                            className="hidden"
                            id="video-upload"
                        />
                        <label
                            htmlFor="video-upload"
                            className="cursor-pointer flex flex-col items-center gap-2"
                        >
                            <Upload className="w-12 h-12 text-muted-foreground" />
                            <span className="text-sm font-medium">Click to upload video</span>
                            <span className="text-xs text-muted-foreground">
                                Supports MP4, WebM, and other video formats
                            </span>
                        </label>
                    </div>
                ) : currentVideoFile && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-medium">{currentVideoFile.name}</span>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => {
                                        setVideoFile(null)
                                        setLandmarks([])
                                        setProgress(0)
                                        setCurrentFrame(0)
                                        setIsPlaying(false)
                                        if (videoRef.current) {
                                            videoRef.current.pause()
                                            videoRef.current.src = ""
                                        }
                                        // Clean up animation frame
                                        if (animationFrameRef.current) {
                                            cancelAnimationFrame(animationFrameRef.current)
                                            animationFrameRef.current = null
                                        }
                                        // Clean up timeupdate listener
                                        const handler = (videoRef.current as any)?._playbackTimeUpdateHandler
                                        if (handler && videoRef.current) {
                                            videoRef.current.removeEventListener("timeupdate", handler)
                                            delete (videoRef.current as any)._playbackTimeUpdateHandler
                                        }
                                        // Notify parent to clear all related data
                                        if (onFileRemoved) {
                                            onFileRemoved()
                                        }
                                    }}
                                >
                                    <X className="w-4 h-4" />
                                </Button>
                            </div>
                            <div className="flex items-center gap-2">
                               <Button
                                   type="button"
                                   onClick={togglePlayPause}
                                   disabled={isProcessing || !isInitialized || !currentVideoFile}
                                   size="sm"
                               >
                                   {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                               </Button>
                               <Button
                                   type="button"
                                   onClick={processVideo}
                                   disabled={isProcessing || !isInitialized || !currentVideoFile}
                                   size="sm"
                               >
                                   {isProcessing ? "Processing..." : "Process Video"}
                               </Button>
                            </div>
                        </div>

                        {isProcessing && (
                            <div className="space-y-2">
                                <Progress value={progress} />
                                <p className="text-xs text-muted-foreground text-center">
                                    Processing frame {currentFrame} of {totalFrames} ({Math.round(progress)}%)
                                </p>
                                
                                {/* Show pose data during processing */}
                                {currentPoseData && (
                                    <div className="grid grid-cols-3 gap-2 p-3 bg-muted/50 rounded-lg text-xs">
                                        <div>
                                            <div className="text-muted-foreground mb-0.5">Pose</div>
                                            <div className="font-semibold">
                                                {currentPoseData.detected ? (
                                                    <span className="text-green-600">✓</span>
                                                ) : (
                                                    <span className="text-gray-400">✗</span>
                                                )}
                                            </div>
                                        </div>
                                        {currentPoseData.detected && (
                                            <>
                                                <div>
                                                    <div className="text-muted-foreground mb-0.5">Points</div>
                                                    <div className="font-semibold">{currentPoseData.landmarksCount}</div>
                                                </div>
                                                <div>
                                                    <div className="text-muted-foreground mb-0.5">Visibility</div>
                                                    <div className="font-semibold">{(currentPoseData.visibility * 100).toFixed(0)}%</div>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="relative">
                            <video
                                ref={videoRef}
                                className="w-full rounded-lg"
                                style={{ display: "none" }}
                                playsInline
                                preload="auto"
                                muted
                                crossOrigin="anonymous"
                            />
                            <canvas
                                ref={canvasRef}
                                className="w-full rounded-lg border"
                                style={{ maxHeight: "500px", objectFit: "contain" }}
                            />
                        </div>

                        {landmarks.length > 0 && (
                            <div className="space-y-2">
                                <div className="text-sm text-muted-foreground">
                                    Extracted {landmarks.length} frames with landmarks
                                </div>
                                
                                {/* Pose Data Display */}
                                {currentPoseData && (
                                    <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                                        <div>
                                            <div className="text-xs font-medium text-muted-foreground mb-1">
                                                Pose Detection
                                            </div>
                                            <div className="text-sm font-semibold">
                                                {currentPoseData.detected ? (
                                                    <span className="text-green-600">✓ Detected</span>
                                                ) : (
                                                    <span className="text-gray-500">Not Detected</span>
                                                )}
                                            </div>
                                        </div>
                                        {currentPoseData.detected && (
                                            <>
                                                <div>
                                                    <div className="text-xs font-medium text-muted-foreground mb-1">
                                                        Landmarks
                                                    </div>
                                                    <div className="text-sm font-semibold">
                                                        {currentPoseData.landmarksCount} points
                                                    </div>
                                                </div>
                                                <div>
                                                    <div className="text-xs font-medium text-muted-foreground mb-1">
                                                        Visibility
                                                    </div>
                                                    <div className="text-sm font-semibold">
                                                        {(currentPoseData.visibility * 100).toFixed(1)}%
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
