import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { ChevronRight, Search, Users } from 'lucide-react'
import type { RootState } from '../../store'
import type { AppDispatch } from '../../store'
import { fetchCustomers } from '../../features/customers/store/customersSlice'
import { Button } from '../../components/ui/button'
export const CustomersPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>()
  const { customers, loading, error, pagination } = useSelector((state: RootState) => state.customers) as RootState['customers']

  useEffect(() => {
    dispatch(fetchCustomers())
  }, [dispatch])

  const handleSearch = (searchTerm: string) => {
    dispatch(fetchCustomers({ search: searchTerm }))
  }

  const formatAddress = (address: string) => {
    return address.length > 50 ? `${address.substring(0, 50)}...` : address
  }

  const getStatusBadge = (status: string) => {
    const statusColors = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-red-100 text-red-800',
      pending: 'bg-yellow-100 text-yellow-800'
    }
    return statusColors[status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-primary mr-3" />
              <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Welcome, Demo User
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center space-x-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search customers..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
                onChange={(e) => handleSearch(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Customers List */}
        <div className="bg-white rounded-lg shadow">
          {customers.length === 0 ? (
            <div className="text-center py-12">
              <Users className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No customers found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {error ? 'Failed to load customers' : 'No customers match your search criteria'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {customers.map((customer) => (
                <Link
                  key={customer.id}
                  to={`/customers/${customer.id}`}
                  className="block hover:bg-gray-50 transition-colors"
                >
                  <div className="px-6 py-4 flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3">
                        <h3 className="text-lg font-medium text-gray-900 truncate">
                          {customer.name}
                        </h3>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(customer.lending_status)}`}>
                          {customer.lending_status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 truncate">{customer.email}</p>
                      <p className="text-sm text-gray-500 truncate">{formatAddress(customer.address)}</p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-gray-400" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Pagination */}
        {pagination.total > pagination.pageSize && (
          <div className="mt-6 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing {((pagination.page - 1) * pagination.pageSize) + 1} to{' '}
              {Math.min(pagination.page * pagination.pageSize, pagination.total)} of{' '}
              {pagination.total} results
            </div>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                disabled={pagination.page === 1}
                onClick={() => dispatch(fetchCustomers({ page: pagination.page - 1 }))}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                disabled={pagination.page * pagination.pageSize >= pagination.total}
                onClick={() => dispatch(fetchCustomers({ page: pagination.page + 1 }))}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
