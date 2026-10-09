# Contract: <tên task>

Trạng thái: nháp | đã duyệt

## Mục tiêu
<1-3 câu: người dùng thấy gì khi xong>

## DB
- Env/DB: <…>
- Bảng: <…>
- Thay đổi: <thêm cột / bảng mới / index>
| Cột | Kiểu | Nullable | Default | Index |
|---|---|---|---|---|

## API
| Method | Path | File xử lý | Thay đổi |
|---|---|---|---|
| <GET> | <path đầy đủ> | <file> | <mới/sửa> |

Request:
```json
{}
```
Response (field thêm/đổi):
```json
{}
```
Lỗi / phân quyền: <…>

## FE
- Repo: <…>
- Route / màn hình: <…>
- Component: <file>
- Hành vi: <hiện gì, ở đâu, khi rỗng, validate>
- Text / i18n (mọi ngôn ngữ repo có):
| Key | vi | en | … |
|---|---|---|---|

## Kiểm tra
- BE: `<lệnh test>` trong <repo>
- FE: `<lint>`, `<test>`
- Preview pages: `--page <tên>=<path>` _(chỉ khi REPOS.md có mục "Preview ảnh FE")_

## Câu hỏi mở
- <không có>
