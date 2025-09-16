import { Router, Request, Response } from 'express'
import { supabase } from '../services/supabase.js'
import { requireAdmin } from '../middleware/auth.js'

const router = Router()

// Apply admin middleware to all routes
router.use(requireAdmin)

// GET /api/admin/recordings - List all recordings (admin only)
router.get('/recordings', async (req: Request, res: Response) => {
  try {
    const { user, customer, from, to } = req.query

    let query = supabase
      .from('recordings')
      .select(`
        *,
        customers(id, name, email),
        users(id, name, email)
      `)
      .order('recorded_on', { ascending: false })

    // Apply filters
    if (user) {
      query = query.eq('user_id', user as string)
    }
    if (customer) {
      query = query.eq('customer_id', customer as string)
    }
    if (from) {
      query = query.gte('recorded_on', from as string)
    }
    if (to) {
      query = query.lte('recorded_on', to as string)
    }

    const { data: recordings, error } = await query

    if (error) {
      console.error('Error fetching admin recordings:', error)
      return res.status(500).json({ error: 'Failed to fetch recordings' })
    }

    // Generate signed URLs for files
    const recordingsWithUrls = await Promise.all(
      (recordings || []).map(async (recording) => {
        if (recording.file_path) {
          try {
            const { data: signedUrl } = await supabase.storage
              .from('recordings')
              .createSignedUrl(recording.file_path, 3600)
            recording.file_path = signedUrl?.signedUrl || recording.file_path
          } catch (urlError) {
            console.error('Error generating signed URL:', urlError)
          }
        }
        return recording
      })
    )

    return res.json({ recordings: recordingsWithUrls })
  } catch (error) {
    console.error('Admin recordings error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
})

// GET /api/admin/users - List all users (admin only)
router.get('/users', async (req: Request, res: Response) => {
  try {
    const { data: users, error } = await supabase
      .from('users')
      .select('id, email, name, role, created_at')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching users:', error)
      return res.status(500).json({ error: 'Failed to fetch users' })
    }

    return res.json({ users: users || [] })
  } catch (error) {
    console.error('Admin users error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
})

// GET /api/admin/customers - List all customers (admin only)
router.get('/customers', async (req: Request, res: Response) => {
  try {
    const { data: customers, error } = await supabase
      .from('customers')
      .select('*')
      .order('name', { ascending: true })

    if (error) {
      console.error('Error fetching customers:', error)
      return res.status(500).json({ error: 'Failed to fetch customers' })
    }

    return res.json({ customers: customers || [] })
  } catch (error) {
    console.error('Admin customers error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
})

// GET /api/admin/stats - Get dashboard statistics (admin only)
router.get('/stats', async (req: Request, res: Response) => {
  try {
    // Get total recordings count
    const { count: totalRecordings } = await supabase
      .from('recordings')
      .select('*', { count: 'exact', head: true })

    // Get total users count
    const { count: totalUsers } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })

    // Get total customers count
    const { count: totalCustomers } = await supabase
      .from('customers')
      .select('*', { count: 'exact', head: true })

    // Get recordings from last 30 days
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    
    const { count: recentRecordings } = await supabase
      .from('recordings')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', thirtyDaysAgo.toISOString())

    // Get total storage used (approximate)
    const { data: segments } = await supabase
      .from('recording_segments')
      .select('size_bytes')

    const totalStorageBytes = segments?.reduce((sum, segment) => sum + (segment.size_bytes || 0), 0) || 0

    return res.json({
      totalRecordings: totalRecordings || 0,
      totalUsers: totalUsers || 0,
      totalCustomers: totalCustomers || 0,
      recentRecordings: recentRecordings || 0,
      totalStorageBytes
    })
  } catch (error) {
    console.error('Admin stats error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
})

export { router as adminRouter }


