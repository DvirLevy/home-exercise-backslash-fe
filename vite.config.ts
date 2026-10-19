import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

/** `[\\/]` matches both path separators. */
const pkg = (names: string) => new RegExp(`node_modules[\\\\/](?:${names})[\\\\/]`)

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: { alias: { '@': path.resolve(import.meta.dirname, 'src') } },
  build: {
    rolldownOptions: {
      output: {
        // Vendor code changes far less often than app code: keeping it in stable, separately named
        // chunks lets browsers keep it cached across deploys. The groups are deliberately narrow so
        // a library only needed by the lazy graph page (React Flow, d3, dagre) never lands in a chunk
        // the first screen has to download.
        codeSplitting: {
          groups: [
            { name: 'react', test: pkg('react|react-dom|scheduler'), priority: 40 },
            { name: 'router', test: pkg('react-router'), priority: 30 },
            {
              name: 'data',
              test: pkg('@tanstack[\\\\/]query-core|@tanstack[\\\\/]react-query|axios'),
              priority: 20,
            },
            { name: 'zod', test: pkg('zod'), priority: 20 },
            {
              name: 'graph-vendor',
              test: pkg(
                '@xyflow[\\\\/]react|@xyflow[\\\\/]system|d3-[a-z-]+|@dagrejs[\\\\/]dagre|@dagrejs[\\\\/]graphlib|classcat|zustand',
              ),
              priority: 20,
            },
          ],
        },
      },
    },
  },
})
