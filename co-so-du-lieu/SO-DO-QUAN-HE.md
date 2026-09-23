# Sơ đồ quan hệ — 19 bảng

Mỗi hình chỉ vẽ quan hệ có bảng con thuộc nhóm. Bảng tham chiếu xuất hiện ở nhiều hình nhưng chỉ có một bảng vật lý. SQL giữ đủ 46 khóa ngoại. Các cột hiển thị được rút gọn, chi tiết ở SQL và trình xem HTML.

## Tài khoản

```mermaid
erDiagram
    nguoi_dung {
        bigint id PK
    }
    xac_minh_nguoi_ban {
        bigint id PK
    }
    dia_chi_nguoi_dung {
        bigint id PK
    }
    nguoi_dung ||--o{ xac_minh_nguoi_ban : "nguoi_dung_id"
    nguoi_dung ||--o{ xac_minh_nguoi_ban : "nguoi_duyet_id"
    nguoi_dung ||--o{ dia_chi_nguoi_dung : "nguoi_dung_id"
```

## Danh mục và sản phẩm

```mermaid
erDiagram
    danh_muc {
        bigint id PK
    }
    nguoi_dung {
        bigint id PK
    }
    san_pham {
        bigint id PK
    }
    danh_muc ||--o{ danh_muc : "danh_muc_cha_id"
    nguoi_dung ||--o{ san_pham : "nguoi_ban_id"
    danh_muc ||--o{ san_pham : "danh_muc_id"
    nguoi_dung ||--o{ san_pham : "nguoi_duyet_id"
```

## Đấu giá

```mermaid
erDiagram
    nguoi_dung {
        bigint id PK
    }
    san_pham {
        bigint id PK
    }
    phien_dau_gia {
        bigint id PK
    }
    tham_gia_phien {
        bigint id PK
    }
    luot_tra_gia {
        bigint id PK
    }
    san_pham ||--o{ phien_dau_gia : "san_pham_id"
    nguoi_dung ||--o{ phien_dau_gia : "nguoi_dan_dau_id"
    phien_dau_gia ||--o{ tham_gia_phien : "phien_dau_gia_id"
    nguoi_dung ||--o{ tham_gia_phien : "nguoi_dung_id"
    phien_dau_gia ||--o{ luot_tra_gia : "phien_dau_gia_id"
    nguoi_dung ||--o{ luot_tra_gia : "nguoi_tra_gia_id"
```

## Đơn hàng và thanh toán

```mermaid
erDiagram
    nguoi_dung {
        bigint id PK
    }
    phien_dau_gia {
        bigint id PK
    }
    luot_tra_gia {
        bigint id PK
    }
    don_hang {
        bigint id PK
    }
    thanh_toan {
        bigint id PK
    }
    de_nghi_mua_tiep_theo {
        bigint id PK
    }
    phien_dau_gia ||--o{ don_hang : "phien_dau_gia_id"
    nguoi_dung ||--o{ don_hang : "nguoi_mua_id"
    nguoi_dung ||--o{ don_hang : "nguoi_ban_id"
    don_hang ||--o{ thanh_toan : "don_hang_id"
    phien_dau_gia ||--o{ de_nghi_mua_tiep_theo : "phien_dau_gia_id"
    don_hang ||--o{ de_nghi_mua_tiep_theo : "don_hang_goc_id"
    nguoi_dung ||--o{ de_nghi_mua_tiep_theo : "nguoi_tra_gia_id"
    don_hang ||--o{ de_nghi_mua_tiep_theo : "don_hang_moi_id"
    luot_tra_gia ||--o{ de_nghi_mua_tiep_theo : "luot_tra_gia_nguon_id"
    nguoi_dung ||--o{ de_nghi_mua_tiep_theo : "nguoi_yeu_cau_id"
```

## Tranh chấp, tệp và đánh giá

```mermaid
erDiagram
    nguoi_dung {
        bigint id PK
    }
    don_hang {
        bigint id PK
    }
    san_pham {
        bigint id PK
    }
    tranh_chap {
        bigint id PK
    }
    tep_dinh_kem {
        bigint id PK
    }
    danh_gia {
        bigint id PK
    }
    don_hang ||--o{ tranh_chap : "don_hang_id"
    nguoi_dung ||--o{ tranh_chap : "nguoi_mo_id"
    nguoi_dung ||--o{ tranh_chap : "nguoi_xu_ly_id"
    san_pham ||--o{ tep_dinh_kem : "san_pham_id"
    tranh_chap ||--o{ tep_dinh_kem : "tranh_chap_id"
    nguoi_dung ||--o{ tep_dinh_kem : "nguoi_tai_len_id"
    don_hang ||--o{ danh_gia : "don_hang_id"
    nguoi_dung ||--o{ danh_gia : "nguoi_danh_gia_id"
    nguoi_dung ||--o{ danh_gia : "nguoi_duoc_danh_gia_id"
```

## Yêu cầu và vi phạm

```mermaid
erDiagram
    nguoi_dung {
        bigint id PK
    }
    san_pham {
        bigint id PK
    }
    phien_dau_gia {
        bigint id PK
    }
    yeu_cau_xu_ly {
        bigint id PK
    }
    don_hang {
        bigint id PK
    }
    vi_pham {
        bigint id PK
    }
    phien_dau_gia ||--o{ yeu_cau_xu_ly : "phien_dau_gia_id"
    san_pham ||--o{ yeu_cau_xu_ly : "san_pham_id"
    nguoi_dung ||--o{ yeu_cau_xu_ly : "nguoi_yeu_cau_id"
    nguoi_dung ||--o{ yeu_cau_xu_ly : "nguoi_duyet_id"
    nguoi_dung ||--o{ vi_pham : "nguoi_dung_id"
    phien_dau_gia ||--o{ vi_pham : "phien_dau_gia_id"
    don_hang ||--o{ vi_pham : "don_hang_id"
    nguoi_dung ||--o{ vi_pham : "nguoi_tao_id"
    nguoi_dung ||--o{ vi_pham : "nguoi_xu_ly_id"
```

## Thông báo, cấu hình và nhật ký

```mermaid
erDiagram
    nguoi_dung {
        bigint id PK
    }
    phien_dau_gia {
        bigint id PK
    }
    luot_tra_gia {
        bigint id PK
    }
    thong_bao {
        bigint id PK
    }
    cau_hinh_he_thong {
        bigint id PK
    }
    nhat_ky_hoat_dong {
        bigint id PK
    }
    nguoi_dung ||--o{ thong_bao : "nguoi_dung_id"
    nguoi_dung ||--o{ cau_hinh_he_thong : "nguoi_cap_nhat_id"
    nguoi_dung ||--o{ nhat_ky_hoat_dong : "nguoi_thuc_hien_id"
    phien_dau_gia ||--o{ nhat_ky_hoat_dong : "phien_dau_gia_id"
    luot_tra_gia ||--o{ nhat_ky_hoat_dong : "luot_tra_gia_id"
```

