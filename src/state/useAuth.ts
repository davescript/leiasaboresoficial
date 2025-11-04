import { useContext } from 'react'
import { AuthContext } from './AuthContext'

/**
 * Hook to access current authentication state from Cloudflare Workers JWT
 * Returns user session, profile info, and loading state
 */
export const useAuth = () => {
  const context = useContext(AuthContext)
  
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }

  return {
    session: context.session,
    userProfile: context.userProfile,
    loading: context.loading,
    isAuthenticated: !!context.session?.user,
  }
}
