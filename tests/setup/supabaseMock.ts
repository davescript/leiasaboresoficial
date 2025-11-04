// Mock setup for Cloudflare Workers testing
// Authentication is handled via JWT tokens from /api/auth endpoints
// Database operations are mocked to simulate D1 responses

import { vi, beforeEach } from 'vitest'

// Store for query mocks by table name
const queryMocks: Map<string, any> = new Map()
const authMocks: Map<string, any> = new Map()
let mockFetch: any = null

// Initialize and return the mock fetch function
function initializeFetch() {
  if (!mockFetch) {
    mockFetch = vi.fn()
    global.fetch = mockFetch
  }
  return mockFetch
}

/**
 * Mock database queries - simulates D1 responses
 */
export const setSupabaseQuery = (table: string, response: { data: any; error: any }) => {
  queryMocks.set(table, response)
  const fetch = initializeFetch()
  fetch.mockResolvedValueOnce(
    new Response(JSON.stringify(response), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  )
}

/**
 * Mock authentication user - returns user object from getCurrentUser
 */
export const setSupabaseAuthUser = (user: any) => {
  authMocks.set('user', user)
  const fetch = initializeFetch()
  fetch.mockResolvedValueOnce(
    new Response(JSON.stringify({ user }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  )
}

/**
 * Mock sign in response
 */
export const setSupabaseAuthSignIn = (response: any) => {
  authMocks.set('signIn', response)
  const fetch = initializeFetch()
  fetch.mockResolvedValueOnce(
    new Response(JSON.stringify(response), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  )
}

/**
 * Mock sign up response
 */
export const setSupabaseAuthSignUp = (response: any) => {
  authMocks.set('signUp', response)
  const fetch = initializeFetch()
  fetch.mockResolvedValueOnce(
    new Response(JSON.stringify(response), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  )
}

/**
 * Helper to mock successful auth responses
 */
export const mockAuthSuccess = (user: any = { id: 'test-user-id', email: 'test@example.com' }) => {
  const fetch = initializeFetch()
  fetch.mockResolvedValueOnce(
    new Response(JSON.stringify({ user }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  )
}

/**
 * Helper to mock auth errors
 */
export const mockAuthError = (message: string = 'Unauthorized', status: number = 401) => {
  const fetch = initializeFetch()
  fetch.mockResolvedValueOnce(
    new Response(JSON.stringify({ error: message }), {
      status,
      headers: { 'Content-Type': 'application/json' }
    })
  )
}

/**
 * Helper to mock API responses
 */
export const mockApiResponse = (data: any, status: number = 200) => {
  const fetch = initializeFetch()
  fetch.mockResolvedValueOnce(
    new Response(JSON.stringify(data), {
      status,
      headers: { 'Content-Type': 'application/json' }
    })
  )
}

/**
 * Reset all mocks
 */
export const resetSupabaseMock = () => {
  queryMocks.clear()
  authMocks.clear()
  mockFetch = vi.fn()
  global.fetch = mockFetch
}

/**
 * Helper to retrieve query mock
 */
export const getSupabaseQuery = (table: string) => {
  return queryMocks.get(table)
}
