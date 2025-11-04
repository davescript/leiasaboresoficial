import { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../state/useAuth'

export const ProtectedRoute = ({ children, roles }: { children: ReactNode, roles?: string[] }) => {
  const { userProfile, loading } = useAuth()
  if (loading) return null
  if (!userProfile) return <Navigate to="/conta" replace />
  if (roles && !roles.includes(userProfile.role ?? 'user')) return <Navigate to="/" replace />
  return <>{children}</>
}
