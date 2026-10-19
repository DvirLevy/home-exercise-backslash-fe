import { z } from 'zod'

const envSchema = z.object({
  VITE_API_BASE_URL: z.url({ message: 'must be a valid URL, e.g. http://localhost:3000' }),
})

export function parseEnv(raw: Record<string, unknown>) {
  const result = envSchema.safeParse(raw)
  if (!result.success) {
    const problems = result.error.issues
      .map((issue) => `  - ${issue.path.join('.') || 'env'}: ${issue.message}`)
      .join('\n')
    throw new Error(`Invalid environment configuration (check .env):\n${problems}`)
  }
  return { apiBaseUrl: result.data.VITE_API_BASE_URL.replace(/\/+$/, '') }
}

export const env = parseEnv(import.meta.env)
