import { createContext, useEffect, useState, ReactNode } from 'react'

export type Profile = { id: string; role: string | null; full_name: string | null }

type Ctx = {
  session: any | null
  userProfile: Profile | null
  loading: boolean
}

export const AuthContext = createContext<Ctx>({ session: null, userProfile: null, loading: true })

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<any | null>(null)
  const [userProfile, setUserProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r=>r.json())
      .then(j=>{ setSession(j?.user ? { user: j.user } : null); setLoading(false) })
      .catch(()=> setLoading(false))
  }, [])

  useEffect(() => {
    const loadProfile = async () => {
      if (!session?.user) { setUserProfile(null); return }
      // If you have a profile endpoint, fetch it here. Placeholder maps JWT payload to profile.
      setUserProfile({ id: session.user.id, role: null, full_name: null })
    }
    loadProfile()
  }, [session])

  return (
    <AuthContext.Provider value={{ session, userProfile, loading }}>
      {children}
    </AuthContext.Provider>
  )
}