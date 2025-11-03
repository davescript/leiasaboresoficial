import { useContext } from 'react'
import { AuthContext } from './AuthContext'

export const useSupabaseAuth = () => {
  return useContext(AuthContext)
}