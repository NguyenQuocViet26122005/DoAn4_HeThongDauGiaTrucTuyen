import fs = require('node:fs/promises');
import path = require('node:path');
import { createHash } from 'node:crypto';
import sharp = require('sharp');
import { cauHinh } from '../config/moi-truong';

export async function tinhDauVan(buffer: Buffer) {
  const sha256 = createHash('sha256').update(buffer).digest('hex');

  try {
    const raw = await sharp(buffer, { limitInputPixels: 24000000 })
      .rotate()
      .resize(9, 8, { fit: 'fill' })
      .greyscale()
      .raw()
      .toBuffer();
    let hash = 0n;

    for (let y = 0; y < 8; y++) {
      for (let x = 0; x < 8; x++) {
        hash = (hash << 1n) | (raw[y * 9 + x] > raw[y * 9 + x + 1] ? 1n : 0n);
      }
    }

    return {
      sha256,
      dhash: hash.toString(16).padStart(16, '0'),
      bien_do: Math.max(...raw) - Math.min(...raw),
    };
  } catch {
    return {
      sha256,
      dhash: null,
      bien_do: 0,
    };
  }
}

export function anhGiongNhau(
  a: Awaited<ReturnType<typeof tinhDauVan>>,
  b: Awaited<ReturnType<typeof tinhDauVan>>,
) {
  if (a.sha256 === b.sha256) {
    return true;
  }
  if (!a.dhash || !b.dhash || a.bien_do < 30 || b.bien_do < 30) {
    return false;
  }

  return (
    (BigInt(`0x${a.dhash}`) ^ BigInt(`0x${b.dhash}`)).toString(2).replace(/0/g, '').length <= 3
  );
}

export async function luuDauVan(tep: string, buffer: Buffer) {
  const dauVan = await tinhDauVan(buffer);
  const stat = await fs.stat(tep);

  await fs.writeFile(
    `${tep}.fingerprint.json`,
    JSON.stringify({
      ...dauVan,
      size: stat.size,
      mtime: stat.mtimeMs,
    }),
  );

  return dauVan;
}

export async function docDauVan(url: string) {
  const khop =
    /^\/api\/uploads\/files\/product\/([1-9]\d*)\/([0-9a-f-]{36}\.(?:jpg|png|webp))$/.exec(url);

  if (!khop) {
    return null;
  }

  const tep = path.join(cauHinh.uploadRoot, 'product', khop[1], khop[2]);

  try {
    const stat = await fs.stat(tep);

    try {
      const cache = JSON.parse(await fs.readFile(`${tep}.fingerprint.json`, 'utf8'));

      if (cache.size === stat.size && cache.mtime === stat.mtimeMs) {
        return cache as Awaited<ReturnType<typeof tinhDauVan>>;
      }
    } catch {
      /* Ảnh cũ được tính khi rà soát, không cần nạp lại dữ liệu. */
    }

    return await luuDauVan(tep, await fs.readFile(tep));
  } catch {
    return null;
  }
}
