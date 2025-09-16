import { Router, Request, Response } from 'express'
import multer from 'multer'
import { supabase, uploadToStorage, getRecordingPath, getSegmentPath, getSignedUrl } from '../services/supabase.js'
import { stitchSegments } from '../services/stitcher.js'

const router = Router()

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB limit
  }
})

// POST /api/recordings - Create new recording session
router.post('/', async (req: Request, res: Response) => {
  try {
    const { customer_id, purpose, recorded_on, mime } = req.body
    // Use a default user ID when authentication is disabled
    const userId = (req as any).user?.id || '00000000-0000-0000-0000-000000000001'

    if (!customer_id || !purpose || !recorded_on || !mime) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    const { data: recording, error } = await supabase
      .from('recordings')
      .insert({
        user_id: userId,
        customer_id,
        purpose,
        recorded_on: new Date(recorded_on).toISOString(),
        duration_sec: 0,
        mime,
        file_path: null
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating recording:', error)
      return res.status(500).json({ error: 'Failed to create recording' })
    }

    return res.json({ recording_id: recording.id })
  } catch (error) {
    console.error('Create recording error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
})

// POST /api/recordings/:id/segments - Upload recording segment
router.post('/:id/segments', upload.single('segment'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { index } = req.body
    // Use a default user ID when authentication is disabled
    const userId = (req as any).user?.id || '00000000-0000-0000-0000-000000000001'

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' })
    }

    // Get recording details
    const { data: recording, error: recordingError } = await supabase
      .from('recordings')
      .select('*, customers(*)')
      .eq('id', id)
      .eq('user_id', userId)
      .single()

    if (recordingError || !recording) {
      return res.status(404).json({ error: 'Recording not found' })
    }

    // Generate file path
    const date = new Date(recording.recorded_on!).toISOString().split('T')[0]
    const filePath = getSegmentPath(userId, recording.customer_id!, date, id!, parseInt(index))

    // Upload to storage
    const uploadResult = await uploadToStorage('recordings', filePath, req.file.buffer, {
      contentType: req.file.mimetype
    })

    // Save segment metadata
    const { data: segment, error: segmentError } = await supabase
      .from('recording_segments')
      .insert({
        recording_id: id,
        index: parseInt(index),
        file_path: filePath,
        size_bytes: req.file.size,
        mime: req.file.mimetype
      })
      .select()
      .single()

    if (segmentError) {
      console.error('Error saving segment:', segmentError)
      return res.status(500).json({ error: 'Failed to save segment metadata' })
    }

    return res.json({
      segment_id: segment.id,
      file_path: filePath
    })
  } catch (error) {
    console.error('Upload segment error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
})

// POST /api/recordings/:id/finalize - Finalize recording and stitch segments
router.post('/:id/finalize', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    // Use a default user ID when authentication is disabled
    const userId = (req as any).user?.id || '00000000-0000-0000-0000-000000000001'

    // Get recording details
    const { data: recording, error: recordingError } = await supabase
      .from('recordings')
      .select('*, customers(*)')
      .eq('id', id)
      .eq('user_id', userId)
      .single()

    if (recordingError || !recording) {
      return res.status(404).json({ error: 'Recording not found' })
    }

    // Get all segments
    const { data: segments, error: segmentsError } = await supabase
      .from('recording_segments')
      .select('*')
      .eq('recording_id', id)
      .order('index', { ascending: true })

    if (segmentsError) {
      console.error('Error fetching segments:', segmentsError)
      return res.status(500).json({ error: 'Failed to fetch segments' })
    }

    if (!segments || segments.length === 0) {
      return res.status(400).json({ error: 'No segments found for recording' })
    }

    // Stitch segments into final recording
    const date = new Date(recording.recorded_on!).toISOString().split('T')[0]
    const finalPath = getRecordingPath(userId, recording.customer_id!, date!, id!)
    
    const stitchedFile = await stitchSegments(segments, finalPath)

    // Update recording with final file path, duration, and MIME type
    const { error: updateError } = await supabase
      .from('recordings')
      .update({
        file_path: finalPath,
        duration_sec: stitchedFile.duration,
        mime: 'audio/webm;codecs=opus'
      })
      .eq('id', id)

    if (updateError) {
      console.error('Error updating recording:', updateError)
      return res.status(500).json({ error: 'Failed to update recording' })
    }

    return res.json({ file_path: finalPath })
  } catch (error) {
    console.error('Finalize recording error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
})

// GET /api/recordings - List recordings with filters
router.get('/', async (req: Request, res: Response) => {
  try {
    const { customer_id, user_id, from, to } = req.query
    // Use default values when authentication is disabled
    const currentUserId = (req as any).user?.id || '00000000-0000-0000-0000-000000000001'
    const userRole = (req as any).user?.role || 'admin'

    let query = supabase
      .from('recordings')
      .select(`
        *,
        customers(id, name, email),
        users(id, name, email)
      `)
      .order('recorded_on', { ascending: false })

    // Apply user filter (users can only see their own, admins can see all)
    if (userRole !== 'admin') {
      query = query.eq('user_id', currentUserId)
    } else if (user_id) {
      query = query.eq('user_id', user_id as string)
    }

    // Apply other filters
    if (customer_id) {
      query = query.eq('customer_id', customer_id as string)
    }
    if (from) {
      query = query.gte('recorded_on', from as string)
    }
    if (to) {
      query = query.lte('recorded_on', to as string)
    }

    const { data: recordings, error } = await query

    if (error) {
      console.error('Error fetching recordings:', error)
      return res.status(500).json({ error: 'Failed to fetch recordings' })
    }

    // Generate signed URLs for recordings that have file_path
    const recordingsWithUrls = await Promise.all(
      (recordings || []).map(async (recording) => {
        if (recording.file_path) {
          try {
            const { signedUrl } = await getSignedUrl('recordings', recording.file_path, 3600)
            recording.file_path = signedUrl
          } catch (urlError) {
            console.error('Error generating signed URL for recording:', recording.id, urlError)
          }
        }
        return recording
      })
    )

    return res.json({ recordings: recordingsWithUrls })
  } catch (error) {
    console.error('Recordings list error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
})

// GET /api/recordings/:id - Get recording details
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    // Use default values when authentication is disabled
    const currentUserId = (req as any).user?.id || '00000000-0000-0000-0000-000000000001'
    const userRole = (req as any).user?.role || 'admin'

    let query = supabase
      .from('recordings')
      .select(`
        *,
        customers(id, name, email),
        users(id, name, email)
      `)
      .eq('id', id)

    // Apply user filter
    if (userRole !== 'admin') {
      query = query.eq('user_id', currentUserId)
    }

    const { data: recording, error } = await query.single()

    if (error) {
      console.error('Error fetching recording:', error)
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Recording not found' })
      }
      return res.status(500).json({ error: 'Failed to fetch recording' })
    }

    // Get signed URL for file if it exists
    if (recording.file_path) {
      try {
        const { signedUrl } = await getSignedUrl('recordings', recording.file_path, 3600)
        recording.file_path = signedUrl
      } catch (urlError) {
        console.error('Error generating signed URL:', urlError)
      }
    }

    return res.json(recording)
  } catch (error) {
    console.error('Recording details error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
})

// Test endpoint to debug signed URL issues
router.get('/debug/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const userId = (req as any).user?.id || '00000000-0000-0000-0000-000000000001'

    // Get recording details
    const { data: recording, error: recordingError } = await supabase
      .from('recordings')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single()

    if (recordingError || !recording) {
      return res.status(404).json({ error: 'Recording not found' })
    }


    // Check if file exists in storage
    if (recording.file_path) {
      try {
        const { data: fileData, error: fileError } = await supabase.storage
          .from('recordings')
          .download(recording.file_path)
        
        if (fileError) {
          return res.json({
            recording,
            fileExists: false,
            fileError: fileError.message
          })
        } else {
        }

        // Try to generate signed URL
        const { data: signedUrlData, error: urlError } = await supabase.storage
          .from('recordings')
          .createSignedUrl(recording.file_path, 3600)

        if (urlError) {
          return res.json({
            recording,
            fileExists: true,
            signedUrlError: urlError.message
          })
        }

        return res.json({
          recording,
          fileExists: true,
          signedUrl: signedUrlData.signedUrl
        })

      } catch (error) {
        return res.json({
          recording,
          fileExists: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    return res.json({
      recording,
      fileExists: false,
      error: 'No file path'
    })

  } catch (error) {
    console.error('Debug endpoint error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
})

export { router as recordingsRouter }
