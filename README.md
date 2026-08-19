<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/51bde03c-d177-43e1-8110-d28cafe86353

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Copy `.env.example` to `.env.local` and set the required API keys.
3. Start the mock backend and frontend together:
   `npm run dev:full`

The JSON Server mock exposes products at `http://localhost:3001/products`.
