import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      // Seul le déclenchement de la connexion Google passe par le frontend
      // (redirection relative depuis LoginPage). Le callback Google
      // (/login/oauth2/code/google) pointe directement vers le backend
      // (URI absolue enregistrée dans Google Cloud Console), jamais via ce proxy.
      // Préfixe volontairement restreint à /oauth2/authorization pour ne pas
      // intercepter la route frontend /oauth2/redirect.
      '/oauth2/authorization': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
})
