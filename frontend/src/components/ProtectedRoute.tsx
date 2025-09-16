import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from './AuthProvider'

interface ProtectedRouteProps {
  children: React.ReactNode
  requireAdmin?: boolean
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requireAdmin = false 
}) => {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  // Check admin role if required
  if (requireAdmin) {
    const userRole = user.user_metadata?.role || 'user'
    if (userRole !== 'admin') {
      return <Navigate to="/" replace />
    }
  }

  return <>{children}</>
}


