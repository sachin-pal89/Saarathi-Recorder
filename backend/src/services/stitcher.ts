import ffmpeg from 'fluent-ffmpeg'
import { Readable } from 'stream'
import { supabase, uploadToStorage } from './supabase'

interface Segment {
  id: string
  recording_id: string
  index: number
  file_path: string
  size_bytes: number
  mime: string
  created_at: string
}

interface StitchedFile {
  duration: number
  size: number
}

export const stitchSegments = async (
  segments: Segment[],
  outputPath: string
): Promise<StitchedFile> => {
  try {
    // For now, use simple concatenation instead of FFmpeg
    // This avoids complex FFmpeg setup issues
    return await concatenateSegments(segments, outputPath)
  } catch (error) {
    throw new Error(`Stitching failed: ${error}`)
  }
}

// Alternative simple concatenation for same codec segments
export const concatenateSegments = async (
  segments: Segment[],
  outputPath: string
): Promise<StitchedFile> => {
  try {
    // Download and concatenate segments
    let combinedBuffer = Buffer.alloc(0)
    let totalDuration = 0

    for (const segment of segments) {
      const { data: segmentData, error } = await supabase.storage
        .from('recordings')
        .download(segment.file_path)
      
      if (error) {
        throw new Error(`Failed to download segment ${segment.index}: ${error.message}`)
      }
      
      const buffer = Buffer.from(await segmentData.arrayBuffer())
      combinedBuffer = Buffer.concat([combinedBuffer, buffer])
      
      // Estimate duration (rough calculation)
      totalDuration += segment.size_bytes / (128 * 1024 / 8) // Assuming 128kbps
    }

    // Upload combined file (keep original WebM format)
    await uploadToStorage('recordings', outputPath, combinedBuffer, {
      contentType: 'audio/webm;codecs=opus'
    })

    return {
      duration: Math.round(totalDuration),
      size: combinedBuffer.length
    }
  } catch (error) {
    throw new Error(`Concatenation failed: ${error}`)
  }
}
