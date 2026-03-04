import { defineConfig } from 'astro/config'
import { loadEnv } from 'vite'
import vercel from '@astrojs/vercel'
import sitemap from '@astrojs/sitemap'
import mdx from '@astrojs/mdx'
import react from '@astrojs/react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const monorepoRoot = path.resolve(__dirname, '../../')

// Load all env vars from the monorepo root .env into process.env so that
// SSR backend code accessing process.env (e.g. Google/Neon creds) can find them.
const env = loadEnv('', monorepoRoot, '')
Object.assign(process.env, env)

export default defineConfig({
  site: 'https://ruckussystems.dev',
  output: 'server',
  adapter: vercel(),
  integrations: [
    mdx(),
    react(),
    sitemap({
      filter: (page) =>
        !page.includes('/api/') &&
        !page.includes('/cancel') &&
        !page.includes('/reschedule'),
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
    envDir: monorepoRoot,
    ssr: {
      noExternal: ['@workspace/backend', '@workspace/database']
    }
  }
})
