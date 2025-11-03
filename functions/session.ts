export class SessionDurableObject {
  state: DurableObjectState
  env: Record<string, any>
  constructor(state: DurableObjectState, env: Record<string, any>) {
    this.state = state
    this.env = env
  }
  async fetch(request: Request) {
    const url = new URL(request.url)
    const userId = url.searchParams.get('user')
    const jti = url.searchParams.get('jti')
    if (request.method === 'PUT' && userId && jti) {
      await this.state.storage.put(`sess:${userId}`, jti)
      return new Response('ok')
    }
    if (request.method === 'GET' && userId) {
      const val = await this.state.storage.get<string>(`sess:${userId}`)
      return new Response(val || '')
    }
    return new Response('bad_request', { status: 400 })
  }
}