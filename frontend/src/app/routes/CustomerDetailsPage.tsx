import React, { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { ArrowLeft, Clock, Calendar, Mic } from 'lucide-react'
import type { RootState } from '../../store'
import type { AppDispatch } from '../../store'
import { fetchCustomer } from '../../features/customers/store/customersSlice'
import { fetchRecordings } from '../../features/recordings/store/recordingsSlice'
import { Button } from '../../components/ui/button'
import { AudioPlayer } from '../../components/AudioPlayer'
import { RecorderDialog } from '../../features/recordings/components/RecorderDialog'

export const CustomerDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const dispatch = useDispatch<AppDispatch>()
  
  const { currentCustomer, loading: customerLoading } = useSelector((state: RootState) => state.customers)
  const { recordings, loading: recordingsLoading } = useSelector((state: RootState) => state.recordings)
  const [showRecorder, setShowRecorder] = React.useState(false)

  useEffect(() => {
    if (id) {
      dispatch(fetchCustomer(id))
      dispatch(fetchRecordings({ customer_id: id }))
    }
  }, [dispatch, id])

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusBadge = (status: string) => {
    const statusColors = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-red-100 text-red-800',
      pending: 'bg-yellow-100 text-yellow-800'
    }
    return statusColors[status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'
  }

  if (customerLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!currentCustomer) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Customer not found</h2>
          <Button onClick={() => navigate('/')}>Back to Customers</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4">
            <div className="flex items-center mb-4">
              <Button
                variant="ghost"
                onClick={() => navigate('/')}
                className="p-2 -ml-2"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </div>
            <div className="text-center sm:text-left">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{currentCustomer.name}</h1>
              <p className="text-sm sm:text-base text-gray-600 mt-1">{currentCustomer.email}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Customer Details Card */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Customer Details</h2>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-500 block">Name</label>
                  <p className="text-gray-900 font-medium">{currentCustomer.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 block">Email</label>
                  <p className="text-gray-900">{currentCustomer.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 block">Address</label>
                  <p className="text-gray-900">{currentCustomer.address}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 block">Lending Status</label>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(currentCustomer.lending_status)}`}>
                    {currentCustomer.lending_status}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Recordings Card */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm">
              <div className="px-4 sm:px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Recordings</h2>
                <Button 
                  onClick={() => setShowRecorder(true)}
                  size="sm"
                  className="flex items-center space-x-1"
                >
                  <Mic className="h-4 w-4" />
                  <span>New Recording</span>
                </Button>
              </div>

          {recordingsLoading ? (
            <div className="p-6 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            </div>
          ) : recordings.length === 0 ? (
            <div className="p-6 text-center">
              <Mic className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No recordings yet</h3>
              <p className="mt-1 text-sm text-gray-500">
                Start your first recording for this customer
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {recordings.map((recording) => (
                <div key={recording.id} className="p-4">
                  <div className="space-y-3">
                    {/* Recording Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="text-sm font-medium text-gray-900 truncate">
                            {recording.purpose}
                          </h3>
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 flex-shrink-0">
                            {recording.mime}
                          </span>
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1 flex-shrink-0" />
                            <span className="truncate">{formatDate(recording.recorded_on)}</span>
                          </div>
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 mr-1 flex-shrink-0" />
                            <span>{formatDuration(recording.duration_sec)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Audio Player */}
                    <div className="mt-3">
                      {recording.file_path ? (
                        <AudioPlayer 
                          src={recording.file_path} 
                          mimeType={recording.mime}
                          className="w-full"
                        />
                      ) : (
                        <div className="flex items-center justify-center py-4">
                          <span className="text-sm text-gray-500">Processing...</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
            </div>
          </div>
        </div>
      </div>

      {/* Recorder Dialog */}
      {showRecorder && currentCustomer && (
        <RecorderDialog
          customer={currentCustomer}
          onClose={() => setShowRecorder(false)}
        />
      )}
    </div>
  )
}
