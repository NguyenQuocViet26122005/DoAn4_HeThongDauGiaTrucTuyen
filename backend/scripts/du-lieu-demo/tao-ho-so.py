"""Tạo hồ sơ thực hành gắn với đúng sản phẩm, không giả mạo giấy tờ cá nhân."""
import hashlib
import json
import sys
import uuid
from pathlib import Path
from xml.sax.saxutils import escape

from PIL import Image, ImageDraw, ImageFont
from reportlab.lib import colors
from reportlab.lib.styles import ParagraphStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer

root = Path(__file__).resolve().parents[2]
source = json.loads(Path(sys.argv[1]).read_text(encoding='utf-8'))
products = {int(p['id']): p for t in source['bang'] if t['ten'] == 'san_pham' for p in t['dong']}
manifest_file = root / 'demo-assets/bo-moi.json'
manifest = json.loads(manifest_file.read_text(encoding='utf-8'))
font = Path('C:/Windows/Fonts/arial.ttf')
pdfmetrics.registerFont(TTFont('VietBid', str(font)))
style = ParagraphStyle('NoiDung', fontName='VietBid', fontSize=11, leading=18, spaceAfter=14)
heading = ParagraphStyle('TieuDe', parent=style, fontSize=20, leading=27, textColor=colors.HexColor('#725521'))

def position(key, group, owner, extension):
    name = str(uuid.UUID(hashlib.sha256(('vietbid-v2-' + key).encode()).hexdigest()[:32])) + '.' + extension
    rel = f'{group}/{owner}/{name}'
    target = root / 'uploads' / rel
    target.parent.mkdir(parents=True, exist_ok=True)
    manifest['tep'][key] = '/api/uploads/files/' + rel
    return target

def pdf(key, owner, title, lines, group='inspection'):
    target = position(key, group, owner, 'pdf')
    doc = SimpleDocTemplate(str(target), pagesize=(595, 842), rightMargin=48, leftMargin=48, topMargin=48, bottomMargin=48)
    story = [Paragraph('VIETBID', heading), Paragraph(escape(title), heading), Spacer(1, 16)]
    story += [Paragraph(escape(line), style) for line in lines]
    story += [Spacer(1, 24), Paragraph('HỒ SƠ THỰC HÀNH ĐỒ ÁN. Không phải chứng thư kiểm định thật hoặc giấy tờ của cá nhân bên ngoài.', style)]
    doc.build(story)

selected = [95, 96, 107, 105, 116, 97, 99, 112, 118, 119]
for product in selected + [104, 108]:
    p = products[product]
    pdf(f'tiep-nhan-{product}', 1001, 'Biên bản tiếp nhận sản phẩm', [
        f'Mã hồ sơ: VB-KD-{product}', f'Sản phẩm: {p["tieu_de"]}',
        f'Mã sản phẩm MySQL: {product}. Mã kiện: VB-IN-{product}.',
        'Tình trạng: kiện hàng được kiểm tra niêm phong, đối chiếu phụ kiện và lập hồ sơ tiếp nhận.',
        'Mốc gửi, nhận và xử lý được lưu trong hồ sơ kiểm định của hệ thống.',
    ])
    if product in selected:
        pdf(f'kiem-dinh-{product}', 1001, 'Báo cáo kiểm định sản phẩm', [
            f'Mã hồ sơ: VB-KD-{product}', f'Sản phẩm: {p["tieu_de"]}',
            'Chuyên gia mẫu: Nguyễn An Khang. Đơn vị: Trung tâm thẩm định mẫu VietBid.',
            'Kết quả thực hành: ĐẠT. Đã đối chiếu đặc điểm sản phẩm, tình trạng, phụ kiện và hồ sơ nguồn gốc.',
            'Việc phê duyệt mở phiên chỉ diễn ra sau khi trung tâm nhận hàng và hoàn tất kiểm định.',
        ])

for case, product, buyer, seller in [(7001, 107, 1208, 1102), (7002, 105, 1203, 1102)]:
    for role, owner in [('mua', buyer), ('ban', seller)]:
        pdf(f'tranh-chap-{case}-{role}', owner, 'Hồ sơ đối chiếu tranh chấp', [
            f'Mã tranh chấp: {case}. Sản phẩm: {products[product]["tieu_de"]}',
            'Bên cung cấp: ' + ('người mua' if role == 'mua' else 'người bán'),
            'Nội dung: đối chiếu tình trạng bề mặt tại lúc nhận hàng với biên bản kiểm định và đóng gói.',
            'Đề nghị Admin xem hồ sơ hai bên và quyết định theo quy tắc hoàn toàn bộ hoặc giải ngân toàn bộ.',
        ], 'evidence')

for owner, name in [(1101, 'Nguyễn Minh Hoàng'), (1102, 'Lê Thu Hà'), (1103, 'Trần Quốc Vinh'), (1104, 'Phạm Ngọc Mai'), (1105, 'Vũ Quang Minh')]:
    im = Image.new('RGB', (1200, 650), '#f7f4ed')
    draw = ImageDraw.Draw(im)
    title_font = ImageFont.truetype(str(font), 40)
    body_font = ImageFont.truetype(str(font), 30)
    draw.text((55, 55), 'VIETBID - HỒ SƠ THỰC HÀNH', font=title_font, fill='#725521')
    for i, line in enumerate([name, f'Mã hồ sơ: VB-HOSO-{owner}', 'Loại giấy tờ: KHÁC', 'Dữ liệu tổng hợp dùng trong đồ án.', 'Không phải CCCD hoặc giấy tờ của người thật.']):
        draw.text((55, 160 + 70 * i), line, font=body_font, fill='#202622')
    im.save(position(f'xac-minh-{owner}', 'verification', owner, 'png'))

manifest_file.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print('Da tao 26 PDF va 5 anh ho so thuc hanh, lien ket theo ma san pham/tai khoan.')
