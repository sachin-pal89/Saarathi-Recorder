import React from 'react'
import { Button } from '../../components/ui/button'
import { useAuth } from '../../components/AuthProvider'

export const LoginPage: React.FC = () => {
  const { signIn } = useAuth()

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Saarathi Recorder
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Sign in to access your recordings
          </p>
        </div>
        <div className="mt-8 space-y-6">
          <Button
            onClick={signIn}
            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
          >
            Sign in with Google
          </Button>
        </div>
      </div>
    </div>
  )
}


