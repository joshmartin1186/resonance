import { supabase } from './supabase.js';
import { statSync, readFileSync, copyFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import * as tus from 'tus-js-client';
/**
 * Bulletproof multi-layered upload system with automatic fallbacks
 */
export async function uploadVideoWithFallbacks(outputPath, videoFileName, projectId) {
    const stats = statSync(outputPath);
    const fileSizeMB = stats.size / 1024 / 1024;
    console.log(`[Upload] Starting upload for ${fileSizeMB.toFixed(2)}MB file`);
    console.log(`[Upload] File: ${videoFileName}`);
    let lastError = null;
    // METHOD 1: TUS Resumable Upload (PRIMARY - for all files)
    try {
        console.log('[Upload] Attempting PRIMARY: TUS Resumable Upload');
        const url = await uploadViaTUS(outputPath, videoFileName, stats, projectId);
        await verifyUpload(url, stats.size);
        console.log('[Upload] ✅ TUS upload successful');
        return { url, method: 'TUS', attempts: 1 };
    }
    catch (error) {
        console.error(`[Upload] ❌ TUS upload failed: ${error.message}`);
        lastError = error;
    }
    // METHOD 2: Supabase Standard Upload (FALLBACK 1 - for smaller files)
    if (fileSizeMB < 50) {
        try {
            console.log('[Upload] Attempting FALLBACK 1: Supabase Standard Upload');
            const url = await uploadViaStandard(outputPath, videoFileName, stats);
            await verifyUpload(url, stats.size);
            console.log('[Upload] ✅ Standard upload successful');
            // Log fallback usage
            await logFallbackUsage(projectId, 'standard', lastError?.message);
            return { url, method: 'Standard', attempts: 2 };
        }
        catch (error) {
            console.error(`[Upload] ❌ Standard upload failed: ${error.message}`);
            lastError = error;
        }
    }
    // ALL METHODS FAILED - Save for recovery
    console.error('[Upload] ❌ ALL UPLOAD METHODS FAILED');
    const savedPath = await saveForRecovery(outputPath, projectId, videoFileName, lastError);
    throw new Error(`All upload methods failed. Video saved to: ${savedPath}. ` +
        `Last error: ${lastError?.message || 'Unknown'}`);
}
/**
 * METHOD 1: Enhanced TUS Resumable Upload with retry logic
 */
async function uploadViaTUS(outputPath, videoFileName, stats, projectId) {
    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const projectRef = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];
    if (!projectRef) {
        throw new Error('Could not extract project ref from SUPABASE_URL');
    }
    const videoBuffer = readFileSync(outputPath);
    const fileSizeMB = stats.size / 1024 / 1024;
    // Optimized storage endpoint
    const tusEndpoint = `https://${projectRef}.supabase.co/storage/v1/upload/resumable`;
    // Optimal chunk size based on file size
    const chunkSize = fileSizeMB > 100
        ? 10 * 1024 * 1024 // 10MB for large files
        : 5 * 1024 * 1024; // 5MB for smaller files
    console.log(`[TUS] Endpoint: ${tusEndpoint}`);
    console.log(`[TUS] Chunk size: ${(chunkSize / 1024 / 1024).toFixed(1)}MB`);
    // Retry wrapper for initial upload setup (handles SSL errors during connection)
    let uploadAttempt = 0;
    const maxSetupAttempts = 3;
    while (uploadAttempt < maxSetupAttempts) {
        try {
            await new Promise((resolve, reject) => {
                let uploadTimeout;
                let lastProgressTime = Date.now();
                let lastProgressBytes = 0;
                const upload = new tus.Upload(videoBuffer, {
                    endpoint: tusEndpoint,
                    // Exponential backoff with jitter
                    retryDelays: [
                        0,
                        1000 + Math.random() * 500, // 1-1.5s
                        3000 + Math.random() * 1000, // 3-4s
                        7000 + Math.random() * 2000, // 7-9s
                        15000 + Math.random() * 5000, // 15-20s
                        30000 + Math.random() * 10000, // 30-40s
                        60000 + Math.random() * 20000, // 60-80s
                    ],
                    chunkSize: chunkSize,
                    headers: {
                        'Authorization': `Bearer ${serviceKey}`,
                        'x-upsert': 'true',
                        'Connection': 'keep-alive' // Prevent connection drops
                    },
                    uploadDataDuringCreation: true,
                    removeFingerprintOnSuccess: true,
                    metadata: {
                        bucketName: 'video-outputs',
                        objectName: videoFileName,
                        contentType: 'video/mp4',
                        cacheControl: '3600',
                        fileSizeBytes: stats.size.toString()
                    },
                    // Enhanced retry logic
                    onShouldRetry: (err, retryAttempt, options) => {
                        const status = err.originalResponse ? err.originalResponse.getStatus() : 0;
                        const errorMsg = err.message?.toLowerCase() || '';
                        // Network/SSL errors - always retry
                        const isNetworkError = errorMsg.includes('ssl') ||
                            errorMsg.includes('tls') ||
                            errorMsg.includes('bad record mac') ||
                            errorMsg.includes('econnreset') ||
                            errorMsg.includes('etimedout') ||
                            errorMsg.includes('enotfound') ||
                            errorMsg.includes('enetunreach') ||
                            errorMsg.includes('socket hang up') ||
                            status === 0 || // No response
                            status === 408 || // Request timeout
                            status === 429 || // Too many requests
                            status === 502 || // Bad gateway
                            status === 503 || // Service unavailable
                            status === 504; // Gateway timeout
                        if (isNetworkError) {
                            console.log(`[TUS] Retry ${retryAttempt + 1}/7: ${err.message}`);
                            return retryAttempt < 7;
                        }
                        // Auth errors - don't retry
                        if (status === 401 || status === 403) {
                            console.error('[TUS] Authentication error - will not retry');
                            return false;
                        }
                        // Client errors - don't retry
                        if (status >= 400 && status < 500 && status !== 408 && status !== 429) {
                            console.error(`[TUS] Client error ${status} - will not retry`);
                            return false;
                        }
                        // Default: retry server errors
                        return retryAttempt < 7;
                    },
                    onError: (error) => {
                        console.error(`[TUS] Upload error:`, error.message);
                        clearTimeout(uploadTimeout);
                        // Only reject if retries are exhausted
                        const retryAttempt = upload._retryAttempt || 0;
                        if (retryAttempt >= 7) {
                            reject(error);
                        }
                    },
                    onProgress: (bytesUploaded, bytesTotal) => {
                        const percentage = ((bytesUploaded / bytesTotal) * 100).toFixed(1);
                        const uploadedMB = (bytesUploaded / 1024 / 1024).toFixed(1);
                        const totalMB = (bytesTotal / 1024 / 1024).toFixed(1);
                        // Calculate upload speed
                        const now = Date.now();
                        const timeDiff = (now - lastProgressTime) / 1000; // seconds
                        const bytesDiff = bytesUploaded - lastProgressBytes;
                        const speedMBps = timeDiff > 0 ? (bytesDiff / 1024 / 1024 / timeDiff).toFixed(2) : '0.00';
                        console.log(`[TUS] Progress: ${percentage}% (${uploadedMB}/${totalMB}MB) @ ${speedMBps}MB/s`);
                        lastProgressTime = now;
                        lastProgressBytes = bytesUploaded;
                        // Reset timeout on progress
                        clearTimeout(uploadTimeout);
                        uploadTimeout = setTimeout(() => {
                            console.error('[TUS] Upload stalled - aborting...');
                            upload.abort();
                            reject(new Error('Upload stalled for 5 minutes'));
                        }, 5 * 60 * 1000); // 5 minute stall timeout
                    },
                    onSuccess: () => {
                        console.log('[TUS] Upload completed successfully');
                        clearTimeout(uploadTimeout);
                        resolve();
                    }
                });
                // Initial timeout (10 minutes total)
                uploadTimeout = setTimeout(() => {
                    console.error('[TUS] Upload timeout after 10 minutes');
                    upload.abort();
                    reject(new Error('Upload timeout after 10 minutes'));
                }, 10 * 60 * 1000);
                // Check for previous uploads and resume if possible
                upload
                    .findPreviousUploads()
                    .then((previousUploads) => {
                    if (previousUploads.length > 0) {
                        console.log('[TUS] Found previous incomplete upload, resuming...');
                        upload.resumeFromPreviousUpload(previousUploads[0]);
                    }
                    upload.start();
                })
                    .catch((err) => {
                    console.error('[TUS] Error checking previous uploads:', err.message);
                    // Start fresh upload if resume check fails
                    upload.start();
                });
            });
            // Upload succeeded - get public URL
            const { data: urlData } = supabase.storage
                .from('video-outputs')
                .getPublicUrl(videoFileName);
            return urlData.publicUrl;
        }
        catch (uploadError) {
            uploadAttempt++;
            // Check if retryable SSL/connection error during setup
            const isRetryable = uploadError.message?.includes('SSL') ||
                uploadError.message?.includes('bad record mac') ||
                uploadError.message?.includes('ECONNRESET') ||
                uploadError.message?.includes('ETIMEDOUT') ||
                uploadError.message?.includes('ENOTFOUND');
            if (isRetryable && uploadAttempt < maxSetupAttempts) {
                const retryDelay = Math.min(5000 * uploadAttempt, 15000); // 5s, 10s, 15s
                console.error(`[TUS] Setup attempt ${uploadAttempt} failed: ${uploadError.message}`);
                console.log(`[TUS] Retrying setup in ${retryDelay / 1000}s...`);
                await new Promise((resolve) => setTimeout(resolve, retryDelay));
            }
            else {
                // Non-retryable or max attempts reached
                throw uploadError;
            }
        }
    }
    throw new Error('TUS upload failed after all setup attempts');
}
/**
 * METHOD 2: Supabase Standard Upload (for files < 50MB)
 */
async function uploadViaStandard(outputPath, videoFileName, stats) {
    const videoBuffer = readFileSync(outputPath);
    const maxRetries = 5;
    let lastError = null;
    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            const { data, error } = await supabase.storage
                .from('video-outputs')
                .upload(videoFileName, videoBuffer, {
                contentType: 'video/mp4',
                cacheControl: '3600',
                upsert: true
            });
            if (error)
                throw error;
            console.log('[Standard] Upload successful');
            const { data: urlData } = supabase.storage
                .from('video-outputs')
                .getPublicUrl(videoFileName);
            return urlData.publicUrl;
        }
        catch (error) {
            lastError = error;
            // Check if retryable
            const isRetryable = error.message?.includes('network') ||
                error.message?.includes('timeout') ||
                error.message?.includes('SSL') ||
                error.statusCode >= 500;
            if (isRetryable && attempt < maxRetries - 1) {
                const delay = Math.min(2000 * Math.pow(2, attempt), 30000) + Math.random() * 1000;
                console.log(`[Standard] Retry ${attempt + 1}/${maxRetries} in ${(delay / 1000).toFixed(1)}s`);
                await new Promise((resolve) => setTimeout(resolve, delay));
            }
            else if (!isRetryable) {
                throw error;
            }
        }
    }
    throw lastError || new Error('Standard upload failed');
}
/**
 * Verify upload completed successfully
 */
async function verifyUpload(videoUrl, expectedSize, maxRetries = 3) {
    console.log('[Verify] Checking uploaded file...');
    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 10000); // 10s timeout
            const response = await fetch(videoUrl, {
                method: 'HEAD',
                signal: controller.signal
            });
            clearTimeout(timeout);
            if (!response.ok) {
                throw new Error(`File not accessible: ${response.status}`);
            }
            const contentLength = response.headers.get('content-length');
            if (contentLength) {
                const uploadedSize = parseInt(contentLength);
                const sizeDiff = Math.abs(uploadedSize - expectedSize);
                const variance = sizeDiff / expectedSize;
                // Allow 2% variance for encoding differences
                if (variance > 0.02) {
                    throw new Error(`Size mismatch: expected ${expectedSize} bytes, got ${uploadedSize} bytes (${(variance * 100).toFixed(1)}% diff)`);
                }
            }
            console.log('[Verify] ✅ Upload verified successfully');
            return;
        }
        catch (error) {
            console.warn(`[Verify] Attempt ${attempt + 1}/${maxRetries} failed: ${error.message}`);
            if (attempt < maxRetries - 1) {
                await new Promise((resolve) => setTimeout(resolve, 2000 * (attempt + 1)));
            }
        }
    }
    throw new Error('Upload verification failed after all retries');
}
/**
 * Save video for manual recovery if all uploads fail
 */
async function saveForRecovery(outputPath, projectId, videoFileName, error) {
    const debugDir = '/tmp/resonance-debug-videos';
    if (!existsSync(debugDir)) {
        mkdirSync(debugDir, { recursive: true });
    }
    const timestamp = Date.now();
    const recoveryPath = join(debugDir, `${projectId}-${timestamp}.mp4`);
    copyFileSync(outputPath, recoveryPath);
    console.log(`💾 [Recovery] Video saved to: ${recoveryPath}`);
    console.log(`💾 [Recovery] File size: ${(statSync(recoveryPath).size / 1024 / 1024).toFixed(2)}MB`);
    // Log to database for manual intervention
    try {
        await supabase.from('upload_failures').insert({
            project_id: projectId,
            video_filename: videoFileName,
            local_path: recoveryPath,
            file_size: statSync(recoveryPath).size,
            error_message: error?.message || 'Unknown error',
            created_at: new Date().toISOString()
        });
    }
    catch (dbError) {
        console.error('[Recovery] Failed to log to database:', dbError);
    }
    return recoveryPath;
}
/**
 * Log fallback usage for monitoring
 */
async function logFallbackUsage(projectId, method, primaryError) {
    try {
        await supabase.from('upload_fallbacks').insert({
            project_id: projectId,
            successful_method: method,
            primary_error: primaryError,
            created_at: new Date().toISOString()
        });
    }
    catch (error) {
        console.error('[Fallback Log] Failed to log:', error);
    }
}
//# sourceMappingURL=upload-manager.js.map