import { Elysia } from 'elysia';
import { rootHandler } from './routes/root';
import { healthHandler } from './routes/health';
import { ogHandler } from './routes/og';
import { cloudPath, anotherCloudPath } from './assets';

const app = new Elysia()
  .get('/', rootHandler)
  .get('/health', healthHandler)
  .get('/og', ogHandler)
  .get('/assets/cloud.png', () => new Response(Bun.file(cloudPath)))
  .get('/assets/another-cloud.png', () => new Response(Bun.file(anotherCloudPath)))
  .listen(3000);

console.log(`Listening on ${app.server!.url}`);
