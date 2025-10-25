/** augment server to mount /logs/stream SSE router */
import { createLogStreamRouter } from './routes/log-stream';
// @ts-ignore - app declared above in closure; we re-export a function to register
export function registerLogStream(app:any){
  app.use(createLogStreamRouter());
}
