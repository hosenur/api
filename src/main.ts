import { Elysia } from 'elysia';
import { staticPlugin } from '@elysiajs/static';
import { rootHandler } from './routes/root';
import { healthHandler } from './routes/health';
import { ogHandler } from './routes/og';

const app = new Elysia()
  .use(staticPlugin({
    assets: 'src/assets',
    prefix: '/assets'
  }))
  .get('/', rootHandler)
  .get('/health', healthHandler)
  .get('/og', ogHandler)
  .listen(8080);

console.log(`Listening on ${app.server!.url}`);
