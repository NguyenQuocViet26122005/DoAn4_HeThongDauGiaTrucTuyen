"""Cập nhật giao diện và số mục/hình; giữ nội dung nguồn trước phần 3.3."""
import json
import re
import sys
from pathlib import Path
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml import OxmlElement
from docx.oxml.ns import qn

sys.stdout.reconfigure(encoding='utf-8')
root = Path.cwd()
source = root / '11023276-NguyenQuocViet-DoAn4-Tuan7-Hoan-Thien.docx'
target = root / '11023276-NguyenQuocViet-DoAn4-Tuan7-Chot.docx'
doc = Document(source)
original = list(doc.paragraphs)
screens = json.loads((root / 'bao-cao/tuan-7/.kiem-tra/thu-tu-giao-dien.json').read_text(encoding='utf-8'))
assert len(screens) == 48
assert all(s['doPhongTo'] == 1 and s['tiLeDiemAnh'] == 1 and s['rong'] == 1920 and s['cao'] == 1080 for s in screens)
blocks = {i + 1: (original[644 + i * 4].text, original[647 + i * 4].text) for i in range(48)}

def disable_number(p):
    props = p._p.get_or_add_pPr()
    for node in list(props.findall(qn('w:numPr'))):
        props.remove(node)
    num = OxmlElement('w:numPr')
    val = OxmlElement('w:numId'); val.set(qn('w:val'), '0'); num.append(val); props.append(num)

def set_heading(p, text, level):
    p.text = text.strip()
    p.style = f'Heading {level}'
    disable_number(p)
    p.paragraph_format.keep_with_next = True
    p.paragraph_format.space_before = Pt(12)
    p.paragraph_format.space_after = Pt(6)
    p.paragraph_format.first_line_indent = Inches(0)
    p.paragraph_format.line_spacing = 1.15
    if level == 1:
        p.paragraph_format.page_break_before = True
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    else:
        p.alignment = WD_ALIGN_PARAGRAPH.LEFT
    for run in p.runs:
        run.font.name = 'Times New Roman'; run.font.size = Pt(14); run.font.bold = True
        run.font.italic = level == 3; run.font.color.rgb = RGBColor(0, 0, 0)

for i, p in enumerate(original):
    if i < 182:
        if p.style.name in ['MucLon', 'Tiêu đề']:
            props = p._p.get_or_add_pPr(); outline = OxmlElement('w:outlineLvl'); outline.set(qn('w:val'), '9'); props.append(outline)
        continue
    if i >= 642:
        break
    if p.style.name == 'Heading 1':
        chapter = {182: 1, 255: 2, 338: 3}[i]
        set_heading(p, f'CHƯƠNG {chapter}: {p.text}', 1)
    elif p.style.name in ['Mục lớn', 'Tiểu mục', 'MucNho']:
        text = p.text.strip()
        if i in {339, 348, 349, 564, 596, 597}:
            text = {339: '3.1 Phát biểu bài toán', 348: '3.2 Đặc tả yêu cầu phần mềm', 349: '3.2.1 Các yêu cầu chức năng', 564: '3.2.2 Biểu đồ lớp thực thể', 596: '3.2.3 Biểu đồ tuần tự', 597: '3.2.4 Thiết kế cơ sở dữ liệu'}[i]
        level = 3 if re.match(r'^\d+\.\d+\.\d+', text) else 2
        set_heading(p, text, level)

# Hai nhãn tuần tự cũ chưa có ảnh; không tính chúng như hình đã tồn tại.
for p in original[590:596]:
    assert not p._p.xpath('.//w:drawing | .//w:pict')
    p._p.getparent().remove(p._p)
doc.add_comment(original[596].runs, 'Dành số Hình 3-21 đến Hình 3-27 cho 7 ảnh sẽ thêm tại mục 3.2.3. Hiện có 20 hình Use Case/lớp trước mục này và 1 sơ đồ CSDL sau mục này. Sơ đồ CSDL là Hình 3-28; phần giao diện bắt đầu Hình 3-29.', author='VietBid', initials='VB')

captions = [p for p in doc.paragraphs if p.style.name == 'HinhVe' and p._p in [x._p for x in original[:642]]]
assert len(captions) == 21
for i, p in enumerate(captions, 1):
    name = re.sub(r'^\s*Hình\s*(?:\d+-\d+\s*:\s*)?', '', p.text).strip()
    if i == 21:
        number, name = 28, 'Sơ đồ quan hệ cơ sở dữ liệu'
    else:
        number = i
    p.text = f'Hình 3-{number}: {name}'
    disable_number(p)
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    for run in p.runs:
        run.font.name = 'Times New Roman'; run.font.size = Pt(14); run.font.italic = True

for index, text in {403: 'Bảng 3-7: Mô tả Use Case quản lý giao dịch mua', 423: 'Bảng 3-9: Mô tả Use Case tham gia đấu giá', 426: 'Bảng 3-10: Luồng sự kiện Use Case tham gia đấu giá'}.items():
    original[index].text = text

def add_before(anchor, text='', style='Nội dung'):
    p = anchor.insert_paragraph_before(text, style)
    return p

chapter4 = original[836]
for p in original[642:836]:
    p._p.getparent().remove(p._p)
h = add_before(chapter4)
set_heading(h, '3.3 Thiết kế giao diện', 2)
intro = add_before(chapter4, 'Giao diện VietBid sử dụng màu đen–vàng, nội dung tiếng Việt và bố cục ưu tiên máy tính. Các ảnh được chụp trực tiếp ở mức thu phóng 100%, khung trình duyệt 1920 × 1080, với dữ liệu từ API và MySQL. Thứ tự trình bày đi từ trang dùng chung, người dùng và người mua, người bán đến quản trị viên; mỗi trang sử dụng tài khoản có quyền tương ứng.')
intro.paragraph_format.keep_with_next = True
for i, screen in enumerate(screens, 1):
    old_id = int(screen['ten'].split('-')[0]); title, desc = blocks[old_id]
    if i in {1, 8, 22, 32}:
        group = {1: 'Các trang dùng chung', 8: 'Khu vực người dùng và người mua', 22: 'Khu vực người bán đã xác minh', 32: 'Khu vực quản trị viên'}[i]
        p = add_before(chapter4, group)
        p.paragraph_format.keep_with_next = True
        for run in p.runs:
            run.bold = True
    p = add_before(chapter4)
    set_heading(p, f'3.3.{i} {title}', 3)
    p = add_before(chapter4, style='Normal')
    p.paragraph_format.first_line_indent = Inches(0)
    p.paragraph_format.keep_with_next = True
    p.paragraph_format.space_after = Pt(6)
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.add_run().add_picture(str(root / 'bao-cao/tuan-7/anh-giao-dien' / (screen['ten'] + '.png')), width=Inches(6.2))
    p = add_before(chapter4, f'Hình 3-{28+i}: {title}', 'HinhVe')
    disable_number(p)
    p.paragraph_format.keep_with_next = True
    p.paragraph_format.space_after = Pt(6)
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    for run in p.runs:
        run.font.name = 'Times New Roman'; run.font.size = Pt(14); run.font.italic = True
    p = add_before(chapter4, desc)
    p.paragraph_format.space_after = Pt(10)
    p.paragraph_format.keep_together = True

for index, text, level in [
    (836, 'CHƯƠNG 4: TRIỂN KHAI WEBSITE', 1),
    (837, '4.1 Triển khai các chức năng của hệ thống', 2),
    (838, '4.1.1 Phía Frontend', 3), (841, '4.1.2 Phía Backend', 3), (844, '4.1.3 Phía cơ sở dữ liệu', 3),
    (847, '4.2 Kiểm thử và triển khai ứng dụng', 2), (848, '4.2.1 Kiểm thử', 3),
    (851, '4.2.2 Đóng gói ứng dụng', 3), (853, '4.2.3 Triển khai ứng dụng', 3),
    (855, 'KẾT LUẬN', 1), (869, 'TÀI LIỆU THAM KHẢO', 1),
]:
    set_heading(original[index], text, level)
original[846].text = 'Bộ dữ liệu hiện có 1 Admin và 50 tài khoản người mua/người bán, trong đó 20 người bán đã xác minh; 50 sản phẩm thuộc 10 danh mục, 56 ảnh, 18 phiên, 57 lượt trả giá, 30 khoản cọc và 13 đơn hàng. Các chuỗi giao dịch liên kết từ kiểm định, đấu giá, cọc và thanh toán đến giao nhận, giải ngân, Second Chance, tranh chấp hoặc đánh giá. Các hồ sơ trước đấu giá thể hiện những bước chờ gửi, vận chuyển đến trung tâm, tiếp nhận, kiểm định, cần bổ sung và trả hàng.'
original[849].text = 'Ngày 08/10/2026, hệ thống đạt 18/18 kiểm thử backend cơ bản, 13/13 kiểm thử logic frontend và 59/59 kiểm thử tích hợp trên cơ sở dữ liệu riêng; không có ca thất bại hoặc bỏ qua. Bộ HTTP đối chiếu 107 API, gồm 91 API nền và 16 API kiểm định/cọc. Bộ nền gửi 219 yêu cầu và kiểm tra 45 phản hồi lỗi. Kiểm thử nhiều kết nối xác nhận ưu tiên người đặt trước, cạnh tranh trả giá/Mua ngay, chốt một đơn, thanh toán một lần và bảo mật mức tối đa qua Socket.IO. Kiểm tra định dạng, kiểu dữ liệu, lint và build đều đạt.'
original[850].text = 'Sau khi lưu dữ liệu vào MySQL, 31 nhóm đối soát đều đạt, gồm khóa ngoại, quyền tham gia, trình tự thời gian, thuộc tính sản phẩm, tiền cọc, thanh toán, tiền đang giữ, vận chuyển, Second Chance, tranh chấp và đánh giá. Đã kiểm tra 160 đường dẫn tệp. Bộ dữ liệu được sao lưu trước khi cập nhật, chạy thử trong transaction rồi hoàn tác trước khi áp dụng chính thức. Các ảnh giao diện trong mục 3.3 được chụp bằng phiên đăng nhập đúng vai trò và khung trình duyệt ở mức thu phóng 100%.'
add_before(original[851], 'Kiểm tra trực tiếp trên web sử dụng phiên đăng nhập riêng cho Admin, người bán và hai người mua. Các luồng đạt gồm theo dõi/bỏ theo dõi, cọc, hai mức tối đa bằng nhau và cập nhật giá giữa hai cửa sổ; thanh toán phần còn lại, gửi hàng, nhận hàng, hoàn tất, giải ngân và đánh giá; bằng chứng riêng tư và hai quyết định tranh chấp; Second Chance theo giá công khai, Admin gửi hàng từ trung tâm, báo cáo sản phẩm, duyệt hủy và đăng lại. Truy cập khu vực Admin hoặc đơn của người khác bị chặn đúng quyền. Cả 12 khu vực quản trị tải được. Năm trang đại diện không tràn ngang ở chiều rộng thực tế 424 px, thu phóng 100%; chưa kiểm tra toàn bộ thiết bị hoặc tải lớn.')
add_before(original[851], 'Dữ liệu và tệp kiểm thử được dọn sau khi hoàn tác; CSDL chính giữ nguyên 50 sản phẩm, 51 tài khoản, 18 phiên và 13 đơn. Kết quả kiểm thử xác nhận các kịch bản đã thực hiện, không đại diện cho mọi tổ hợp đầu vào hoặc nghiệm thu dịch vụ thanh toán, vận chuyển và xác minh danh tính thực tế.')
original[868]._p.getparent().remove(original[868]._p)

def field(p, code):
    p.clear()
    begin = OxmlElement('w:fldChar'); begin.set(qn('w:fldCharType'), 'begin')
    instruction = OxmlElement('w:instrText'); instruction.set(qn('xml:space'), 'preserve'); instruction.text = code
    separate = OxmlElement('w:fldChar'); separate.set(qn('w:fldCharType'), 'separate')
    end = OxmlElement('w:fldChar'); end.set(qn('w:fldCharType'), 'end')
    for item in [begin, instruction, separate, end]:
        r = OxmlElement('w:r'); r.append(item); p._p.append(r)

# Thay vùng kết quả cũ bằng trường mục lục được Word cập nhật theo phân trang thật.
for p in original[73:122]:
    p._p.getparent().remove(p._p)
toc = original[122].insert_paragraph_before()
field(toc, ' TOC \\o "1-3" \\h \\z ')
toc.paragraph_format.page_break_before = False
original[122].paragraph_format.page_break_before = True
for p in original[126:179]:
    p._p.getparent().remove(p._p)
tables = original[180].insert_paragraph_before()
field(tables, ' TOC \\h \\z \\t "Bang,1" ')
original[180].paragraph_format.page_break_before = True
field(original[181], ' TOC \\h \\z \\t "HinhVe,1" ')
for style_name in ['Heading 1', 'Heading 2', 'Heading 3']:
    doc.styles[style_name].font.color.rgb = RGBColor(0, 0, 0)
settings = doc.settings.element
update = OxmlElement('w:updateFields'); update.set(qn('w:val'), 'true'); settings.append(update)
assert sum(p.style.name == 'Heading 3' and p.text.startswith('3.3.') for p in doc.paragraphs) == 48
doc.save(target)
print('Đã sửa toàn bộ 3.3, phân cấp mục lục và đánh số Hình 3-29 đến 3-76.')
print(target)
