import { Router, Request, Response } from 'express'
import { supabase } from '../services/supabase'

const router = Router()

// GET /api/customers - List customers with pagination and search
router.get('/', async (req: Request, res: Response) => {
  try {
    const { search, page = 1, pageSize = 20 } = req.query
    
    let query = supabase
      .from('customers')
      .select('*', { count: 'exact' })
      .order('name', { ascending: true })

    // Apply search filter
    if (search && typeof search === 'string') {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,address.ilike.%${search}%`)
    }

    // Apply pagination
    const pageNum = parseInt(page as string) || 1
    const pageSizeNum = parseInt(pageSize as string) || 20
    const from = (pageNum - 1) * pageSizeNum
    const to = from + pageSizeNum - 1

    query = query.range(from, to)

    const { data: customers, error, count } = await query

    if (error) {
      console.error('Error fetching customers:', error)
      return res.status(500).json({ error: 'Failed to fetch customers' })
    }

    return res.json({
      customers: customers || [],
      total: count || 0,
      page: pageNum,
      pageSize: pageSizeNum
    })
  } catch (error) {
    console.error('Customers list error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
})

// GET /api/customers/:id - Get customer details
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    const { data: customer, error } = await supabase
      .from('customers')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching customer:', error)
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Customer not found' })
      }
      return res.status(500).json({ error: 'Failed to fetch customer' })
    }

    return res.json(customer)
  } catch (error) {
    console.error('Customer details error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
})

export { router as customersRouter }


