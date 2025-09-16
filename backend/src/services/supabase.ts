import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Storage helper functions
export const uploadToStorage = async (
  bucket: string,
  path: string,
  file: Buffer,
  options?: { contentType?: string; cacheControl?: string }
) => {
  const uploadOptions: any = {
    cacheControl: options?.cacheControl || '3600',
    upsert: true
  }
  
  if (options?.contentType) {
    uploadOptions.contentType = options.contentType
  }

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, uploadOptions)
  
  if (error) throw error
  return data
}

export const getSignedUrl = async (
  bucket: string,
  path: string,
  expiresIn: number = 3600
) => {
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, expiresIn)
  
  if (error) throw error
  return data
}

export const deleteFromStorage = async (bucket: string, path: string) => {
  const { data, error } = await supabase.storage
    .from(bucket)
    .remove([path])
  
  if (error) throw error
  return data
}

// Database helper functions
export const getRecordingPath = (userId: string, customerId: string, date: string, recordingId: string) => {
  return `${userId}/${customerId}/${date}/${recordingId}/recording.webm`
}

export const getSegmentPath = (userId: string, customerId: string, date: string | undefined, recordingId: string, segmentIndex: number) => {
  return `${userId}/${customerId}/${date}/${recordingId}/segment_${segmentIndex}.webm`
}
