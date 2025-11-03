import { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useSupabaseAuth } from '../state/useSupabaseAuth'

export const ProtectedRoute = ({ children, roles }: { children: ReactNode, roles?: string[] }) => {
  const { userProfile, loading } = useSupabaseAuth()
  if (loading) return null
  if (!userProfile) return <Navigate to="/conta" replace />
  if (roles && !roles.includes(userProfile.role ?? 'user')) return <Navigate to="/" replace />
  return <>{children}</>
}