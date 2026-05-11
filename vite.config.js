import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/cheatsheet/', // ← mude para o nome exato do seu repositório no GitHub
})
