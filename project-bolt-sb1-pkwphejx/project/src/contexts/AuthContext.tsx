import React, { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import bcrypt from 'bcryptjs'

interface User {
  id: string
  email: string
  created_at: string
  updated_at: string
}

interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  register: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  logout: () => void
  loading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if user is logged in from localStorage
    const savedUser = localStorage.getItem('pharmacy_user')
    if (savedUser) {
      setUser(JSON.parse(savedUser))
    }
    setLoading(false)
  }, [])

  const login = async (email: string, password: string) => {
    try {
      // Find user by email
      const { data: users, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .limit(1)

      if (error) {
        return { success: false, error: 'Database error occurred' }
      }

      if (!users || users.length === 0) {
        return { success: false, error: 'Invalid email or password' }
      }

      const userData = users[0]

      // Compare password with hashed password
      const isValidPassword = await bcrypt.compare(password, userData.hashed_password)
      
      if (!isValidPassword) {
        return { success: false, error: 'Invalid email or password' }
      }

      // Update last login time
      await supabase
        .from('users')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', userData.id)

      const userInfo = {
        id: userData.id,
        email: userData.email,
        created_at: userData.created_at,
        updated_at: userData.updated_at
      }

      setUser(userInfo)
      localStorage.setItem('pharmacy_user', JSON.stringify(userInfo))

      return { success: true }
    } catch (error) {
      console.error('Login error:', error)
      return { success: false, error: 'An unexpected error occurred' }
    }
  }

  const register = async (email: string, password: string) => {
    try {
      // Check if user already exists
      const { data: existingUsers, error: checkError } = await supabase
        .from('users')
        .select('email')
        .eq('email', email)
        .limit(1)

      if (checkError) {
        return { success: false, error: 'Database error occurred' }
      }

      if (existingUsers && existingUsers.length > 0) {
        return { success: false, error: 'An account with this email already exists' }
      }

      // Hash password
      const saltRounds = 10
      const hashedPassword = await bcrypt.hash(password, saltRounds)

      // Create new user
      const { data, error } = await supabase
        .from('users')
        .insert([
          {
            email,
            hashed_password: hashedPassword,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ])
        .select()

      if (error) {
        return { success: false, error: 'Failed to create account' }
      }

      if (!data || data.length === 0) {
        return { success: false, error: 'Failed to create account' }
      }

      const newUser = data[0]
      const userInfo = {
        id: newUser.id,
        email: newUser.email,
        created_at: newUser.created_at,
        updated_at: newUser.updated_at
      }


      return { success: true }
    } catch (error) {
      console.error('Registration error:', error)
      return { success: false, error: 'An unexpected error occurred' }
    }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('pharmacy_user')
  }

  const value = {
    user,
    login,
    register,
    logout,
    loading
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}