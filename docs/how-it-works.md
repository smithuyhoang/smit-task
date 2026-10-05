# smit-task hoạt động thế nào

Tài liệu giải thích ý tưởng và luồng hoạt động, dùng để trình bày cho người khác. Cách cài đặt và lệnh chi tiết: xem `README.md`.

---

## 1. Một câu giới thiệu
> `smit-task` giúp giao một việc cần sửa nhiều repo cho Claude. Mình chỉ tạo task và nói yêu cầu. Claude tự biết phải sửa BE nào, FE nào, rồi tự tạo chỗ làm, code, test và commit cho từng repo.

## 2. Vấn đề nó giải quyết
Một tính năng thường đụng nhiều repo: migration DB, backend, frontend. Trước đây mỗi repo phải mở một chỗ, chạy một Claude riêng. Các Claude không biết nhau làm gì, BE và FE dễ lệch nhau. Muốn biết task đang sửa những repo nào thì phải tự nhớ.

## 3. Ý tưởng cốt lõi: một task là một khối
> **Một task = một thư mục = một thẻ trong Orca = một session Claude.**

Dù task sửa 2 hay 10 repo, vẫn chỉ có một Claude điều phối. Nó nhìn thấy toàn bộ, nên BE và FE khớp nhau.

## 4. Ba thứ làm nên công cụ

### a. Bản đồ dự án (`REPOS.md`): giúp Claude biết sửa ở đâu
Giống tấm bản đồ: repo nào là BE, FE hay DB, tính năng nào nằm ở repo nào, cài và test thế nào. Bản đồ này Claude **tự viết** bằng cách đọc lướt các repo. Người dùng chỉ đọc lại và sửa chỗ sai. Bản đồ đúng thì Claude chọn repo đúng.

### b. Worktree: chỗ làm việc riêng cho từng repo
Worktree là một bản sao của repo trên nhánh riêng, sửa thoải mái mà không đụng code gốc. Mỗi repo của task có một worktree. Tất cả dùng chung tên nhánh `<tên-git>/<tên-task>`, nhìn là biết thuộc task nào.

### c. Thư mục task và `TASK.md`: trí nhớ và bảng theo dõi
Mỗi task có một thư mục. Trong đó có file `TASK.md` ghi:
- yêu cầu,
- lý do chọn repo (repo nào sửa, repo nào không),
- **bảng các worktree đang xử lý** kèm trạng thái,
- nhật ký.

Thư mục còn có lối tắt tới từng worktree. Trên Orca, các worktree hiện ngay dưới thẻ task, mở thẻ là thấy đủ repo, diff và PR.

```
smit-tasks/
├── projects/<dự-án>/REPOS.md     bản đồ dự án
└── <task>/
    ├── TASK.md                   trí nhớ + bảng worktree
    ├── <repo-be> → worktree      lối tắt
    └── <repo-fe> → worktree
```

## 5. Bốn lệnh, theo vòng đời

| Lệnh | Khi nào | Làm gì |
|---|---|---|
| `init` | **Một lần** cho mỗi dự án | Tìm các repo, thêm vào Orca, cấp quyền cho Claude, rồi mở Claude để viết bản đồ |
| `new` | Mỗi task mới | Tạo thư mục task và thẻ trên Orca |
| `add` | Claude tự gọi | Tạo worktree cho repo cần sửa, gắn vào thẻ, tự cài đặt, thêm dòng vào bảng |
| `close` | Khi PR đã merge | Xóa worktree, thẻ và thư mục. **Từ chối** nếu còn code chưa push |

> Khai báo dự án một lần bằng `init`. Mỗi việc thì `new`. Phần giữa Claude lo. Xong thì `close`.

## 6. Một task chạy ra sao (ví dụ)
Gõ `smit-task new them-bo-loc`, mở thẻ trong Orca, gõ `claude`, rồi nói: *"Thêm bộ lọc theo ngày cho danh sách đơn hàng"*.

1. Claude chép yêu cầu vào `TASK.md`.
2. Tra bản đồ, kết luận: sửa BE `shop-api` để thêm tham số lọc, sửa FE `shop-web` để thêm ô chọn ngày. **Không** cần migration vì không đổi bảng.
3. **Hỏi người dùng xác nhận một lần.** Đây là chỗ duy nhất phải trả lời.
4. Tự tạo 2 worktree, tự cài dependency.
5. Code BE trước, viết test. Rồi code FE khớp với API vừa làm, chạy test và lint.
6. Cập nhật bảng sau mỗi bước, cuối cùng commit local từng repo và báo thứ tự deploy.

Người dùng xem diff, tự push và tạo PR. Merge xong thì `close`.

## 7. Hàng rào an toàn
Claude làm tự động nhưng có giới hạn:
- **Không sửa được repo gốc**, chỉ sửa trong worktree. Cái này cài cứng bằng quyền, không chỉ dặn bằng lời.
- **Không đọc `.env`** (file chứa mật khẩu).
- **Không push, không tạo PR.** Bước đưa code lên luôn do người làm.
- **Không chạy migration** lên DB thật.
- `close` **không cho xóa** khi còn code chưa push, vì xóa worktree là mất luôn nhánh.

## 8. Dùng cho mọi dự án
Công cụ không gắn với dự án nào. Ai có dự án gì thì `init` dự án đó:
- BE và FE ở chung một thư mục cha: đưa thư mục cha vào.
- BE và FE ở hai nơi khác nhau: đưa cả hai đường dẫn vào.
- Monorepo (một repo chứa cả BE lẫn FE): đưa repo đó vào.

Một người có nhiều dự án thì mỗi dự án một bản đồ riêng, khi tạo task thì chọn dự án. Điều cần nhớ: khai báo **đủ mọi repo** mà task có thể đụng tới, vì Claude chỉ chọn được trong số repo đã khai báo.

## 9. Câu hỏi hay gặp

**Claude chọn sai repo thì sao?**
Nó luôn hỏi xác nhận trước khi tạo worktree. Sai thì sửa lại. Sai nhiều lần thì sửa bản đồ `REPOS.md`.

**Giữa chừng cần thêm repo?**
Claude tự `add` thêm và sửa được ngay, không phải khởi động lại.

**Tắt máy rồi làm tiếp được không?**
Được. Mở lại thẻ, chạy `claude -c`. Claude đọc `TASK.md` để nhớ lại đang làm tới đâu.

**Cần cài gì?**
Orca, Claude Code, git, python3. Clone repo `smit-task` về, tạo link lệnh vào PATH, theo `README.md` khoảng 5 phút.

**Có phím tắt không?**
Có. Gắn vào Shortcuts của macOS, bấm phím, gõ tên task là tạo xong.

## 10. Giới hạn
- Chỉ chạy trên **macOS + Orca**.
- Tạo và xóa thẻ dựa vào API ẩn của Orca. Orca cập nhật lớn có thể làm hỏng bước này, phải sửa script.
- Chất lượng phụ thuộc bản đồ dự án. Bản đồ sơ sài thì Claude định tuyến kém.
- Claude vẫn có thể code sai. Vẫn phải review diff trước khi push.

---

## Bản 30 giây
> Mình tạo một task và nói yêu cầu bằng lời. Claude tra bản đồ dự án để biết phải sửa BE nào, FE nào, hỏi mình xác nhận một lần, rồi tự tạo chỗ làm riêng cho từng repo, code, test và commit. Mọi thứ hiện trên một thẻ Orca và một file theo dõi. Claude không push và không đụng code gốc. Mình review rồi tự đẩy lên.
