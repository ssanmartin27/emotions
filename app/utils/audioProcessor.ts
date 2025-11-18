/**
 * Audio processing utilities
 * - Extract audio track from video files
 * - Convert audio to required format (WAV, 16kHz mono)
 * - Preprocess audio for wav2vec2 input
 * - Handle audio-only file uploads
 */

export interface AudioProcessingResult {
    audioData: Float32Array;
    sampleRate: number;
    duration: number;
    format: string;
}

/**
 * Extract audio track from video file
 * Uses MediaRecorder API to extract audio from video
 */
export async function extractAudioFromVideo(videoFile: File): Promise<AudioProcessingResult> {
    return new Promise(async (resolve, reject) => {
        try {
            const sampleRate = 16000; // Wav2Vec2 requires 16kHz
            
            // Create video element to get duration
            const video = document.createElement('video');
            video.preload = 'metadata';
            video.muted = false; // Need audio for extraction
            
            const objectUrl = URL.createObjectURL(videoFile);
            video.src = objectUrl;
            
            // Wait for metadata to load
            await new Promise<void>((resolve, reject) => {
                const timeout = setTimeout(() => reject(new Error('Timeout loading video metadata')), 10000);
                video.onloadedmetadata = () => {
                    clearTimeout(timeout);
                    resolve();
                };
                video.onerror = () => {
                    clearTimeout(timeout);
                    reject(new Error('Failed to load video'));
                };
                video.load();
            });
            
            const duration = video.duration;
            
            // Decode the video file directly as audio
            // This works for video files that contain audio tracks
            const arrayBuffer = await videoFile.arrayBuffer();
            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            
            // Try to decode the video file as audio (works for some formats)
            try {
                const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
                
                // Resample to 16kHz if needed
                const targetSampleRate = 16000;
                let processedBuffer = audioBuffer;
                
                if (audioBuffer.sampleRate !== targetSampleRate) {
                    processedBuffer = await resampleAudioBuffer(audioBuffer, targetSampleRate);
                }
                
                // Convert to mono
                const monoBuffer = convertToMono(processedBuffer);
                const audioData = monoBuffer.getChannelData(0);
                
                URL.revokeObjectURL(objectUrl);
                
                resolve({
                    audioData,
                    sampleRate: targetSampleRate,
                    duration: monoBuffer.duration,
                    format: 'wav'
                });
                return;
            } catch (decodeError) {
                // If decoding fails, fall through to fallback
                console.warn('Direct audio decode failed, trying fallback:', decodeError);
            }
            
            // Fallback: Process as audio file
            URL.revokeObjectURL(objectUrl);
            const result = await processAudioFile(videoFile);
            resolve(result);
        } catch (error) {
            // Final fallback: Try to process as audio file directly
            try {
                console.warn('Audio extraction failed, trying fallback:', error);
                URL.revokeObjectURL(objectUrl);
                const result = await processAudioFile(videoFile);
                resolve(result);
            } catch (fallbackError) {
                URL.revokeObjectURL(objectUrl);
                reject(new Error(`Failed to extract audio from video: ${error}. Fallback also failed: ${fallbackError}`));
            }
        }
    });
}

/**
 * Process audio-only file
 */
export async function processAudioFile(audioFile: File): Promise<AudioProcessingResult> {
    return new Promise((resolve, reject) => {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const fileReader = new FileReader();
        
        fileReader.onload = async (e) => {
            try {
                const arrayBuffer = e.target?.result as ArrayBuffer;
                const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
                
                // Resample to 16kHz if needed
                const targetSampleRate = 16000;
                let processedBuffer = audioBuffer;
                
                if (audioBuffer.sampleRate !== targetSampleRate) {
                    processedBuffer = await resampleAudioBuffer(
                        audioBuffer,
                        targetSampleRate
                    );
                }
                
                // Convert to mono
                const monoBuffer = convertToMono(processedBuffer);
                
                // Get audio data - monoBuffer is already an AudioBuffer
                const audioData = monoBuffer.getChannelData(0);
                
                resolve({
                    audioData,
                    sampleRate: targetSampleRate,
                    duration: monoBuffer.duration,
                    format: getFileExtension(audioFile.name)
                });
            } catch (error) {
                reject(new Error(`Failed to process audio file: ${error}`));
            }
        };
        
        fileReader.onerror = () => {
            reject(new Error('Failed to read audio file'));
        };
        
        fileReader.readAsArrayBuffer(audioFile);
    });
}

/**
 * Resample audio buffer to target sample rate
 */
async function resampleAudioBuffer(
    audioBuffer: AudioBuffer,
    targetSampleRate: number
): Promise<AudioBuffer> {
    if (audioBuffer.sampleRate === targetSampleRate) {
        return audioBuffer;
    }
    
    const offlineContext = new OfflineAudioContext(
        audioBuffer.numberOfChannels,
        Math.ceil(audioBuffer.length * targetSampleRate / audioBuffer.sampleRate),
        targetSampleRate
    );
    
    const bufferSource = offlineContext.createBufferSource();
    bufferSource.buffer = audioBuffer;
    bufferSource.connect(offlineContext.destination);
    bufferSource.start();
    
    return await offlineContext.startRendering();
}

/**
 * Convert multi-channel audio to mono
 */
function convertToMono(audioBuffer: AudioBuffer): AudioBuffer {
    if (audioBuffer.numberOfChannels === 1) {
        return audioBuffer;
    }
    
    const numberOfChannels = 1;
    const length = audioBuffer.length;
    const sampleRate = audioBuffer.sampleRate;
    
    // Sum all channels
    const channels: Float32Array[] = [];
    for (let i = 0; i < audioBuffer.numberOfChannels; i++) {
        channels.push(audioBuffer.getChannelData(i));
    }
    
    // Create mono channel by averaging
    const monoData = new Float32Array(length);
    for (let i = 0; i < length; i++) {
        let sum = 0;
        for (const channel of channels) {
            sum += channel[i];
        }
        monoData[i] = sum / channels.length;
    }
    
    // Create new buffer with mono data
    const offlineContext = new OfflineAudioContext(
        numberOfChannels,
        length,
        sampleRate
    );
    
    const monoBuffer = offlineContext.createBuffer(numberOfChannels, length, sampleRate);
    monoBuffer.copyToChannel(monoData, 0);
    
    return monoBuffer;
}

/**
 * Get file extension
 */
function getFileExtension(filename: string): string {
    const parts = filename.split('.');
    return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
}

/**
 * Normalize audio data to [-1, 1] range
 */
export function normalizeAudio(audioData: Float32Array): Float32Array {
    // Use a loop instead of spread operator to avoid stack overflow with large arrays
    let max = 0;
    for (let i = 0; i < audioData.length; i++) {
        const abs = Math.abs(audioData[i]);
        if (abs > max) {
            max = abs;
        }
    }
    if (max === 0) return audioData;
    
    const normalized = new Float32Array(audioData.length);
    for (let i = 0; i < audioData.length; i++) {
        normalized[i] = audioData[i] / max;
    }
    return normalized;
}

/**
 * Pad or truncate audio to target length
 */
export function padOrTruncateAudio(
    audioData: Float32Array,
    targetLength: number
): Float32Array {
    if (audioData.length === targetLength) {
        return audioData;
    }
    
    const result = new Float32Array(targetLength);
    
    if (audioData.length < targetLength) {
        // Pad with zeros
        result.set(audioData);
    } else {
        // Truncate
        result.set(audioData.subarray(0, targetLength));
    }
    
    return result;
}

