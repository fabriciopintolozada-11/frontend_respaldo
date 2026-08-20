<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Taller Frontend

SPA de gestión de taller para E1: recepción, consulta pública, asignación y consola del mecánico.

## Run Locally

**Prerequisites:**  Node.js


1. Instala dependencias: `npm install`.
2. Copia `.env.example` a `.env.local`.
3. Para integración con NestJS, configura `VITE_API_TOKEN` con un JWT válido y ejecuta `npm run dev`.
4. Para trabajar sin backend, configura `VITE_DATA_SOURCE=mock` y ejecuta `npm run dev:full`.

La API integrada usa `http://localhost:3000/api/v1`; el portal público no requiere token.
