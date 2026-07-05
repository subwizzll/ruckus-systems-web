import { defineConfig } from 'astro/config'
import vercel from '@astrojs/vercel'
import sitemap from '@astrojs/sitemap'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import { fileURLToPath } from 'url'
import Module from 'node:module'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const monorepoRoot = path.resolve(__dirname, '../../')
const tsconfigPackageDir = path.resolve(monorepoRoot, 'packages/typescript-config')

const resolveFilename = Module._resolveFilename
Module._resolveFilename = function (request, parent, isMain, options) {
  if (request.startsWith('@ruckus/typescript-config/') && request.endsWith('.json')) {
    return resolveFilename.call(
      this,
      path.join(tsconfigPackageDir, path.basename(request)),
      parent,
      isMain,
      options,
    )
  }
  return resolveFilename.call(this, request, parent, isMain, options)
}

export default defineConfig({
  site: 'https://jared.ruckussystems.dev',
  server: {
    port: 4322,
  },
  output: 'static',
  adapter: vercel({
    webAnalytics: { enabled: true },
  }),
  integrations: [sitemap()],
  vite: {
    plugins: [tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
  },
})
