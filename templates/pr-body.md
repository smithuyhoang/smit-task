## Ý định
<2–3 câu từ contract Goal hoặc commit messages>

## Rủi ro: <🟢 Thấp | 🟡 Trung bình | 🔴 Cao>
<một dòng `- ` cho mỗi reason từ task-risk; level low → "Không khớp luật rủi ro nào">

Diff: <changed_lines> dòng · Rebase lên `<base>` lúc <YYYY-MM-DD HH:mm>

## Review đối kháng
| Nguồn | Mức | File | Lỗi | Kịch bản | Xử lý |
|---|---|---|---|---|---|
| <review \| security \| review+security> | <severity> | `<file>:<line>` | <summary> | <scenario> | <Đã sửa `<sha>` \| Sếp duyệt bỏ qua> |

<không có finding → "Reviewer độc lập không tìm thấy lỗi.">
Số vòng review: <n> · Security: <đã chạy \| bỏ qua (diff không chạm vùng nhạy cảm)>

## Test
- Test: `<command>` → <pass/fail count | repo không có test>
- Lint / type / build: <mỗi cái: `<command>` → ok | không có>
- Smoke: <ok | N lỗi (liệt kê) | không chạy: <lý do> | không áp dụng>

## Triển khai
<có file `migrations/` → liệt kê + chỗ tra lệnh migration theo REPOS.md (người dùng tự chạy) | "Không có migration">

## Bằng chứng
<mỗi trang: `![<name>](<png url>)` + `[video <name>](<webm url>)`; không có → lý do>

## PR liên quan
Task: `<task>`
Thứ tự merge: <theo "Thứ tự deploy" trong REPOS.md, link từng PR>

---
PR do `/task-ship` mở. Người duyệt: xem Rủi ro + Bằng chứng → approve rồi merge, hoặc comment yêu cầu sửa.
