import { Router } from 'express';
import fs = require('node:fs/promises');
import path = require('node:path');

export function boDinhTuyenCapNhat(thuMuc: string) {
  const router = Router();

  router.get('/mobile-updates', async (req, res, next) => {
    res.set({
      'expo-protocol-version': '1',
      'expo-sfv-version': '0',
      'Cache-Control': 'no-store',
    });
    if (req.get('expo-protocol-version') !== '1') {
      return res.sendStatus(406);
    }

    const runtime = req.get('expo-runtime-version');

    if (
      req.get('expo-platform') !== 'android' ||
      !/^vietbid-android-[a-f0-9]{32}$/.test(runtime || '')
    ) {
      return res.sendStatus(400);
    }
    try {
      const record = JSON.parse(
        await fs.readFile(path.join(thuMuc, 'runtimes', `${runtime}.json`), 'utf8'),
      );
      const manifest = JSON.parse(record.body);

      if (
        manifest.runtimeVersion !== runtime ||
        typeof record.signature !== 'string' ||
        !/^[A-Za-z0-9+/]+=*$/.test(record.signature)
      ) {
        return res.sendStatus(503);
      }
      if (req.get('expo-current-update-id') === manifest.id) {
        return res.status(204).end();
      }
      if (!req.accepts(['application/expo+json', 'application/json'])) {
        return res.sendStatus(406);
      }
      res.set('expo-signature', `sig="${record.signature}", keyid="vietbid"`);

      return res.type('application/expo+json').send(record.body);
    } catch (error) {
      if (error.code === 'ENOENT') {
        return res.status(204).end();
      }

      return next(error);
    }
  });
  router.get('/mobile-updates/assets/:hash', (req, res) => {
    if (!/^[a-f0-9]{64}$/.test(req.params.hash)) {
      return res.sendStatus(404);
    }
    res.sendFile(
      req.params.hash,
      {
        root: path.join(thuMuc, 'assets'),
        headers: {
          'Cache-Control': 'public, max-age=31536000, immutable',
          'Content-Type': 'application/octet-stream',
        },
      },
      (error) => {
        if (error && !res.headersSent) {
          res.sendStatus(404);
        }
      },
    );
  });

  return router;
}
