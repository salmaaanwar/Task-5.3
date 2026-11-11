import axios from 'axios'

export const api = axios.create({
  baseURL: 'http://localhost:4000/api',
  withCredentials: true
})

const safeMethods = new Set(['get', 'head', 'options'])
const preAuthPaths = new Set(['/api/auth/login', '/api/auth/register'])
let pendingTokenRequest

function getCsrfToken() {
  // Share concurrent fetches so first-time writes use the same cookie/token.
  // Do not cache across writes: another tab may have changed the login session.
  if (!pendingTokenRequest) {
    pendingTokenRequest = api.get('/csrf-token')
      .then(({ data }) => {
        if (typeof data.csrfToken !== 'string' || !data.csrfToken) {
          throw new Error('The server did not return a CSRF token')
        }
        return data.csrfToken
      })
      .finally(() => { pendingTokenRequest = undefined })
  }
  return pendingTokenRequest
}

api.interceptors.request.use(async config => {
  const method = (config.method || 'get').toLowerCase()
  const path = new URL(api.getUri(config)).pathname.replace(/\/$/, '').toLowerCase()
  if (safeMethods.has(method) || (method === 'post' && preAuthPaths.has(path))) {
    return config
  }

  config.headers['x-csrf-token'] = await getCsrfToken()
  return config
})
