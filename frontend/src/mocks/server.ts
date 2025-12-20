import type { Plugin } from 'vite'
import {
  mockUser,
  mockExercises,
  mockPrograms,
  mockSessionSummaries,
  mockSessionDetails,
  mockUserPreferences,
} from './data'

interface MockRequest {
  url: string
  method: string
  body?: unknown
}

interface MockResponse {
  status: number
  body: unknown
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

async function handleMockRequest(req: MockRequest): Promise<MockResponse> {
  const { url, method } = req

  // Simulate network delay
  await delay(100 + Math.random() * 200)

  // Auth endpoints
  if (url === '/api/auth/login' && method === 'POST') {
    return { status: 200, body: mockUser }
  }

  if (url === '/api/auth/register' && method === 'POST') {
    return { status: 200, body: mockUser }
  }

  // Exercises
  if (url === '/api/exercises' && method === 'GET') {
    return { status: 200, body: mockExercises }
  }

  // Programs
  if (url === '/api/programs' && method === 'GET') {
    return { status: 200, body: mockPrograms }
  }

  // Sessions list - match /api/sessions or /api/sessions?params but not /api/sessions/{id}
  const sessionsListMatch = /^\/api\/sessions(?:\?.*)?$/.test(url)
  if (sessionsListMatch && method === 'GET') {
    const urlObj = new URL(url, 'http://localhost')
    const status = urlObj.searchParams.get('status')
    const startedFrom = urlObj.searchParams.get('startedFrom')

    let sessions = [...mockSessionSummaries]

    if (status === 'Completed') {
      sessions = sessions.filter((s) => s.completedAt)
    } else if (status === 'InProgress') {
      sessions = sessions.filter((s) => !s.completedAt)
    }

    if (startedFrom) {
      const fromDate = new Date(startedFrom)
      sessions = sessions.filter((s) => new Date(s.startedAt) >= fromDate)
    }

    return {
      status: 200,
      body: {
        items: sessions,
        page: 1,
        pageSize: 100,
        totalCount: sessions.length,
      },
    }
  }

  // Session detail
  const sessionDetailMatch = url.match(/^\/api\/sessions\/([^/]+)$/)
  if (sessionDetailMatch && method === 'GET') {
    const sessionId = sessionDetailMatch[1]
    const session = mockSessionDetails[sessionId]
    if (session) {
      return { status: 200, body: session }
    }
    return { status: 404, body: { error: 'Session not found' } }
  }

  // Profile
  if (url === '/api/profile' && method === 'GET') {
    return { status: 200, body: mockUserPreferences }
  }

  // Default: 404
  return { status: 404, body: { error: 'Not found' } }
}

export function mockApiPlugin(): Plugin {
  return {
    name: 'mock-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith('/api/')) {
          return next()
        }

        try {
          let body: unknown = undefined
          if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
            const chunks: Buffer[] = []
            for await (const chunk of req) {
              chunks.push(chunk as Buffer)
            }
            const rawBody = Buffer.concat(chunks).toString()
            if (rawBody) {
              try {
                body = JSON.parse(rawBody)
              } catch {
                body = rawBody
              }
            }
          }

          const mockReq: MockRequest = {
            url: req.url,
            method: req.method || 'GET',
            body,
          }

          const mockRes = await handleMockRequest(mockReq)

          res.statusCode = mockRes.status
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify(mockRes.body))
        } catch (error) {
          console.error('Mock API error:', error)
          res.statusCode = 500
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: 'Internal mock server error' }))
        }
      })
    },
  }
}
