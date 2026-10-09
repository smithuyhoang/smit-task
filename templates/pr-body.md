## Ý định
<2–3 câu từ contract Goal hoặc commit messages>

## Rủi ro: <🟢 Thấp | 🟡 Trung bình | 🔴 Cao>
<một dòng `- ` cho mỗi reason từ task-risk; level low → "Không khớp luật rủi ro nào">

Diff: <changed_lines> dòng · Rebase lên `<base>` lúc <YYYY-MM-DD HH:mm>

## Review đối kháng
| Mức | File | Lỗi | Kịch bản |
|---|---|---|---|
| <severity> | `<file>:<line>` | <summary> | <scenario> |

<không có finding → "Reviewer độc lập không tìm thấy lỗi.">

## Test
- Test: `<command>` → <pass/fail count | repo không có test>
- Smoke: <ok | N lỗi (liệt kê) | không chạy: <lý do> | không áp dụng>

## Bằng chứng
<mỗi trang: `![<name>](<png url>)` + `[video <name>](<webm url>)`; không có → lý do>

## PR liên quan
Task: `<task>`
Thứ tự merge: <theo "Thứ tự deploy" trong REPOS.md, link từng PR>

---
Draft do `/task-ship` mở. Người duyệt: xem Rủi ro + Bằng chứng → bấm **Ready for review** hoặc comment yêu cầu sửa.
