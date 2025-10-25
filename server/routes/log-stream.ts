import type { NextFunction, Request, Response } from 'express';
import { Router } from 'express';

export function createLogStreamRouter() {
  const router = Router();

  router.get('/logs/stream', (req: Request, res: Response) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    const write = (type: string, msg: any) => {
      const data = typeof msg === 'string' ? msg : JSON.stringify(msg);
      res.write(`event: ${type}\n`);
      res.write(`data: ${data}\n\n`);
    };

    write('open', { ts: Date.now() });

    const origLog = console.log;
    const origErr = console.error;

    console.log = (...args: any[]) => {
      try { write('log', args.join(' ')); } catch {}
      origLog.apply(console, args as any);
    };

    console.error = (...args: any[]) => {
      try { write('error', args.join(' ')); } catch {}
      origErr.apply(console, args as any);
    };

    req.on('close', () => {
      console.log = origLog;
      console.error = origErr;
      try { res.end(); } catch {}
    });
  });

  return router;
}
