export type ReadStatus = 'unread' | 'reading' | 'done'

export type Tag = {
  id: number
  name: string
}

export type Collection = {
  id: number
  name: string
}

export type LinkItem = {
  id: number
  urlHash: string
  ciphertext: string
  shared: boolean
  createdAt: string
  legacy?: {
    url: string
    title: string
    description: string
    domain: string
    faviconUrl: string
    readStatus: ReadStatus
    metadataStatus: 'pending' | 'ready' | 'unavailable'
    tags: Array<{ name: string }>
    collections: Array<{ name: string }>
  }
}

export type PopularLink = {
  id: number
  url: string
  title: string
  likeCount: number
  likedByMe: boolean
  isOwner: boolean
  createdAt: string
}

export type User = {
  id: number
  email: string
  createdAt: string
  encryptionSalt: string
  encryptionCheck: string
}

type RequestOptions = Omit<RequestInit, 'body'> & {
  token?: string
  body?: unknown
}

export class ApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

const baseURL = import.meta.env.VITE_API_URL ?? ''

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers = new Headers(options.headers)
  if (options.body !== undefined) {
    headers.set('Content-Type', 'application/json')
  }
  if (options.token) {
    headers.set('Authorization', `Bearer ${options.token}`)
  }
  let response: Response
  try {
    response = await fetch(`${baseURL}${path}`, {
      ...options,
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
    })
  } catch {
    throw new ApiError('Server belum bisa dihubungi. Pastikan API Tumpuk berjalan, lalu coba lagi.', 0)
  }
  if (response.status === 204) {
    return undefined as T
  }
  let payload: unknown
  try {
    payload = await response.json()
  } catch {
    throw new ApiError(`Server mengembalikan respons ${response.status} yang tidak dapat dibaca.`, response.status)
  }
  if (!response.ok) {
    const message = payload && typeof payload === 'object' && 'error' in payload && typeof payload.error === 'string'
      ? payload.error
      : 'Permintaan belum berhasil. Coba lagi.'
    throw new ApiError(message, response.status)
  }
  return payload as T
}
