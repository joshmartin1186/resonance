/**
 * RunPod Serverless Start Script
 *
 * This creates an HTTP server that RunPod can call with job requests
 */

import http from 'http';
import { handler } from './runpod-handler.js';

const PORT = process.env.RUNPOD_POD_PORT || 8000;

console.log('[RunPod] Starting serverless worker...');
console.log('[RunPod] Environment check:', {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? '✓' : '✗',
  supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY ? '✓' : '✗',
  anthropicKey: process.env.ANTHROPIC_API_KEY ? '✓' : '✗',
  nodeEnv: process.env.NODE_ENV
});

const server = http.createServer(async (req, res) => {
  // Only handle POST requests
  if (req.method !== 'POST') {
    res.writeHead(405, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Method not allowed' }));
    return;
  }

  // Read request body
  let body = '';
  req.on('data', chunk => {
    body += chunk.toString();
  });

  req.on('end', async () => {
    try {
      const input = JSON.parse(body);
      console.log('[RunPod] Received job request:', input);

      // Call the handler
      const output = await handler(input.input || input);

      // Return response
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(output));

      console.log('[RunPod] Job completed successfully');
    } catch (error) {
      console.error('[RunPod] Error processing job:', error);

      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }));
    }
  });
});

server.listen(PORT, () => {
  console.log(`[RunPod] ✓ Worker listening on port ${PORT}`);
  console.log('[RunPod] Ready to process jobs');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('[RunPod] Shutting down...');
  server.close(() => {
    console.log('[RunPod] Server closed');
    process.exit(0);
  });
});
