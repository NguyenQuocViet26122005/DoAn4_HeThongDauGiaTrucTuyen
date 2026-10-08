"""Hồ sơ thực hành có mã sản phẩm và tài khoản; không tạo giấy tờ tùy thân thật."""
import hashlib
import json
import uuid
import sys
from pathlib import Path
from xml.sax.saxutils import escape
from PIL import Image, ImageDraw, ImageFont
from reportlab.lib.styles import ParagraphStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer

root = Path(__file__).resolve().parents[2]
sys.stdout.reconfigure(encoding='utf-8')
file = root / 'demo-assets/du-lieu-chuan-vietbid.json'
manifest = json.loads(file.read_text(encoding='utf-8'))
audit = json.loads((root.parent / 'co-so-du-lieu/ban-sao-rieng/ra-soat-50-san-pham.json').read_text(encoding='utf-8'))
products = {int(p['id']): p for p in audit['sanPham']}
font = 'C:/Windows/Fonts/arial.ttf'
pdfmetrics.registerFont(TTFont('VietBid', font))
style = ParagraphStyle('NoiDung', fontName='VietBid', fontSize=11, leading=18, spaceAfter=12)
heading = ParagraphStyle('TieuDe', parent=style, fontSize=19, leading=25, textColor='#725521')

def location(key, group, owner, ext):
    name = str(uuid.UUID(hashlib.sha256(('vietbid-chuan-50-v1-' + key).encode()).hexdigest()[:32])) + '.' + ext
    url = f'/api/uploads/files/{group}/{owner}/{name}'
    manifest['tep'][key] = url
    target = root / 'uploads' / url.removeprefix('/api/uploads/files/')
    target.parent.mkdir(parents=True, exist_ok=True)
    return target

def document(key, owner, title, lines, group='inspection'):
    doc = SimpleDocTemplate(str(location(key, group, owner, 'pdf')), pagesize=(595, 842), rightMargin=48, leftMargin=48, topMargin=48, bottomMargin=48)
    story = [Paragraph('VIETBID', heading), Paragraph(escape(title), heading), Spacer(1, 16)]
    story += [Paragraph(escape(line), style) for line in lines]
    story += [Spacer(1, 24), Paragraph('HỒ SƠ THỰC HÀNH ĐỒ ÁN. Ảnh là tư liệu có nguồn; số đo, giá và kết quả trong bộ dữ liệu phục vụ thực hành, không phải chứng thư kiểm định thật.', style)]
    doc.build(story)

selected = [98, 108, 123, 124, 125, 126, 127, 129, 130, 131, 133, 135, 136, 137, 138, 139, 140, 143, 144]
for product in selected:
    p = products[product]
    # Tiêu đề đồng bộ lấy từ manifest đã chuẩn hóa, không dùng tiêu đề cũ sai ảnh.
    title = next((a['tieu_de_san_pham'] for a in manifest['anh'] if a['san_pham_id'] == product and 'tieu_de_san_pham' in a), p['tieu_de'])
    for kind, label in [('tiep-nhan', 'Biên bản tiếp nhận'), ('kiem-dinh', 'Báo cáo kiểm định')]:
        document(f'{kind}-{product}', 1001, label, [f'Mã hồ sơ: VB-KD-{product}. Mã sản phẩm: {product}.', f'Sản phẩm: {title}', 'Mã kiện: VB-IN-' + str(product) + '.', 'Tiếp nhận, kiểm định và kết quả được lưu theo từng mốc thời gian trong hệ thống.', 'Chuyên gia hồ sơ thực hành: Nguyễn An Khang. Trung tâm: VietBid.', 'Kết luận chỉ có hiệu lực trong dữ liệu thực hành sau khi Admin ghi nhận kết quả và xét duyệt sản phẩm.'])

for owner, side in [(1217, 'người mua'), (1114, 'người bán')]:
    document(f'tranh-chap-131-{side}', owner, 'Đối chiếu phụ kiện khi giao nhận', ['Mã sản phẩm: 131. Đồng hồ Vacheron Constantin dress watch.', 'Bên cung cấp: ' + side + '.', 'Tình huống: phụ kiện giao nhận thiếu so với hồ sơ đơn hàng.', 'Admin đối chiếu biên bản, phản hồi hai bên và quyết định hoàn toàn bộ tiền theo nghiệp vụ.'], 'evidence')

for user in audit['nguoiDung']:
    owner = int(user['id'])
    if owner not in list(range(1101, 1121)) + [1219, 1223, 1230]:
        continue
    for kind in ['mat-truoc', 'selfie']:
        im = Image.new('RGB', (1200, 650), '#f7f4ed')
        d = ImageDraw.Draw(im)
        d.text((55, 55), 'VIETBID – HỒ SƠ THỰC HÀNH', font=ImageFont.truetype(font, 40), fill='#725521')
        lines = [user['ho_ten'], f'Mã tài khoản: {owner}. Loại hồ sơ: KHÁC.', 'Phần hồ sơ: ' + ('ảnh tài liệu' if kind == 'mat-truoc' else 'ảnh đối chiếu'), 'Dữ liệu tổng hợp phục vụ đồ án.', 'Không phải CCCD hoặc giấy tờ của người thật.']
        for i, line in enumerate(lines):
            d.text((55, 155 + i * 70), line, font=ImageFont.truetype(font, 30), fill='#202622')
        im.save(location(f'xac-minh-{owner}-{kind}', 'verification', owner, 'png'))

file.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print('Đã tạo 40 hồ sơ PDF và 46 ảnh đối chiếu tài khoản.')
