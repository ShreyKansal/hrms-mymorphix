import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // Vite's default CSS minifier (lightningcss) rejects some selectors Atlaskit's
    // Emotion-based CSS-in-JS emits (e.g. `::-ms-input-placeholder:disabled`) as invalid per
    // the strict modern CSS spec, even though every real browser accepts them fine. This Vite
    // build (rolldown-vite) doesn't ship esbuild as the alternate minifier, so the pragmatic
    // fix is to skip CSS minification rather than add a dependency just to work around one
    // selector — the app is small enough that unminified CSS isn't a meaningful cost.
    cssMinify: false,
  },
})
