import { useEffect } from 'react'
import { useLocation } from 'wouter'
import { supabase } from '@/lib/supabase'

export default function AuthCallback() {
  const [, setLocation] = useLocation()

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const { data, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Auth callback error:', error)
          setLocation('/')
          return
        }

        if (data.session) {
          // User is authenticated, redirect to main app
          setLocation('/')
        } else {
          // No session, redirect to landing
          setLocation('/')
        }
      } catch (error) {
        console.error('Auth callback error:', error)
        setLocation('/')
      }
    }

    handleAuthCallback()
  }, [setLocation])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-cyan-50 to-green-50 dark:from-slate-900 dark:via-blue-900 dark:to-green-900">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-lg text-gray-600 dark:text-gray-400">Completing sign in...</p>
      </div>
    </div>
  )
}