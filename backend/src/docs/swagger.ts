import fs = require('node:fs');
import path = require('node:path');

type GiaTriBatKy = Record<string, any>;

const TEN_TEP_POSTMAN = 'doan4-dau-gia.postman_collection.json';

function docBoSuuTap(): GiaTriBatKy {
  const cacDuongDan = [
    path.resolve(__dirname, '../../docs', TEN_TEP_POSTMAN),
    path.resolve(process.cwd(), 'docs', TEN_TEP_POSTMAN),
    path.resolve(process.cwd(), 'backend/docs', TEN_TEP_POSTMAN),
  ];
  const duongDan = cacDuongDan.find((giaTri) => fs.existsSync(giaTri));
  if (!duongDan) throw new Error(`Không tìm thấy ${TEN_TEP_POSTMAN}`);
  return JSON.parse(fs.readFileSync(duongDan, 'utf8'));
}

function giaTriMau(ten: string, giaTri = ''): string {
  if (giaTri) return giaTri;
  if (/ngay|batDau|ketThuc/i.test(ten)) return new Date().toISOString();
  if (/Id$/i.test(ten)) return '1';
  if (/maNguoi|token/i.test(ten)) return '<JWT_TOKEN>';
  return `<${ten}>`;
}

function thayBien(noiDung: string, cacBien: Map<string, string>): string {
  return noiDung.replace(/\{\{([^}]+)}}/g, (_toanBo, ten) => giaTriMau(ten, cacBien.get(ten)));
}

function chuyenDuongDan(urlGoc: string): string {
  const boDiaChiGoc = urlGoc.replace(/^\{\{diaChiGoc}}/, '');
  const coTienTo = boDiaChiGoc.startsWith('/api') ? boDiaChiGoc : `/api${boDiaChiGoc}`;
  return coTienTo
    .split('?')[0]
    .replace(/\{\{([^}]+)}}/g, '{$1}')
    .replace(/:([A-Za-z0-9_]+)/g, '{$1}');
}

function taoThamSo(urlGoc: string, cacBien: Map<string, string>): GiaTriBatKy[] {
  const thamSo: GiaTriBatKy[] = [];
  const duongDan = chuyenDuongDan(urlGoc);
  for (const ketQua of duongDan.matchAll(/\{([^}]+)}/g)) {
    thamSo.push({
      name: ketQua[1],
      in: 'path',
      required: true,
      schema: { type: 'string' },
      example: giaTriMau(ketQua[1], cacBien.get(ketQua[1])),
    });
  }

  const viTriDauHoi = urlGoc.indexOf('?');
  if (viTriDauHoi >= 0) {
    const chuoiTruyVan = urlGoc.slice(viTriDauHoi + 1);
    for (const cap of chuoiTruyVan.split('&')) {
      const [ten, giaTri = ''] = cap.split('=');
      if (!ten) continue;
      thamSo.push({
        name: decodeURIComponent(ten),
        in: 'query',
        required: false,
        schema: { type: 'string' },
        example: thayBien(decodeURIComponent(giaTri), cacBien),
      });
    }
  }
  return thamSo;
}

function taoNoiDungYeuCau(body: GiaTriBatKy | undefined, cacBien: Map<string, string>) {
  if (!body) return undefined;
  if (body.mode === 'raw') {
    const raw = thayBien(body.raw || '{}', cacBien);
    let example: unknown = raw;
    try {
      example = JSON.parse(raw);
    } catch {}
    return {
      required: true,
      content: { 'application/json': { schema: { type: 'object' }, example } },
    };
  }
  if (body.mode === 'formdata') {
    const properties: GiaTriBatKy = {};
    const required: string[] = [];
    for (const truong of body.formdata || []) {
      properties[truong.key] =
        truong.type === 'file'
          ? { type: 'string', format: 'binary' }
          : { type: 'string', example: thayBien(truong.value || '', cacBien) };
      if (!truong.disabled) required.push(truong.key);
    }
    return {
      required: true,
      content: {
        'multipart/form-data': {
          schema: { type: 'object', properties, required },
        },
      },
    };
  }
  return undefined;
}

export function taoTaiLieuSwagger(): GiaTriBatKy {
  const boSuuTap = docBoSuuTap();
  const cacBien = new Map<string, string>(
    (boSuuTap.variable || []).map((bien: GiaTriBatKy) => [bien.key, String(bien.value || '')]),
  );
  const paths: GiaTriBatKy = {};
  const tags: GiaTriBatKy[] = [];

  function duyet(items: GiaTriBatKy[] = [], thuMuc: string[] = []) {
    for (const item of items) {
      if (!item.request) {
        const tenNhom = item.name || 'Khác';
        if (!tags.some((tag) => tag.name === tenNhom)) tags.push({ name: tenNhom });
        duyet(item.item, [...thuMuc, tenNhom]);
        continue;
      }

      const request = item.request;
      const urlGoc = typeof request.url === 'string' ? request.url : request.url?.raw || '';
      const duongDan = chuyenDuongDan(urlGoc);
      const phuongThuc = String(request.method || 'GET').toLowerCase();
      const daCo = paths[duongDan]?.[phuongThuc];
      const moTaBoSung = daCo ? `\n\nVí dụ khác: ${item.name}` : '';
      const operation: GiaTriBatKy = daCo || {
        tags: [thuMuc.at(-1) || 'Khác'],
        summary: item.name,
        description: request.description || '',
        parameters: taoThamSo(urlGoc, cacBien),
        responses: {
          200: { description: 'Thành công' },
          400: { description: 'Dữ liệu yêu cầu không hợp lệ' },
          401: { description: 'Chưa đăng nhập hoặc token không hợp lệ' },
          403: { description: 'Không có quyền thực hiện' },
          404: { description: 'Không tìm thấy dữ liệu' },
          500: { description: 'Lỗi máy chủ' },
        },
      };
      if (moTaBoSung) operation.description = `${operation.description || ''}${moTaBoSung}`.trim();
      if (!operation.requestBody) operation.requestBody = taoNoiDungYeuCau(request.body, cacBien);
      if (request.auth?.type === 'bearer') operation.security = [{ bearerAuth: [] }];
      paths[duongDan] ||= {};
      paths[duongDan][phuongThuc] = operation;
    }
  }

  duyet(boSuuTap.item);
  return {
    openapi: '3.0.3',
    info: {
      title: 'VietBid API',
      version: '1.0.0',
      description: boSuuTap.info?.description || 'API hệ thống đấu giá trực tuyến.',
    },
    servers: [{ url: 'http://localhost:5000', description: 'Máy chủ cục bộ' }],
    tags,
    paths,
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      },
    },
  };
}
