# CLAUDE.md — smit-tasks (task nhiều repo, mọi dự án)

1 task = 1 thư mục `smit-tasks/<task>/` = 1 thẻ Orca (nhóm `tasks`) = 1 session Claude chạy trong thư mục đó.
Task có thể sửa 1 hay 15 repo (BE, FE, migration…): mỗi repo là 1 worktree, symlink vào `smit-tasks/<task>/<repo>`.

## Bố cục
```
smit-tasks/
├── projects/<dự-án>/
│   ├── repos.txt              danh sách repo của dự án: "<tên Orca>\t<đường dẫn gốc>"
│   ├── REPOS.md               BẢN ĐỒ: repo nào lo gì, tính năng → repo, cách cài/test
│   ├── repos/<repo>.md        ghi chú chi tiết từng repo (thay cho CLAUDE.md nếu repo chưa có)
│   └── setup-worktree.sh      (tuỳ chọn) chạy thêm sau khi tạo worktree (vd: link .env)
├── <task>/
│   ├── TASK.md                trí nhớ của task: yêu cầu, định tuyến, bảng worktree, nhật ký
│   ├── .project               tên dự án của task
│   └── <repo> → worktree      symlink
└── bin/smit-task              init | new | add | close
```

## Công cụ: `smit-task`
```bash
smit-task init  <dự-án> <repo|thư-mục...>   # đăng ký repo của 1 dự án + mở Claude lập bản đồ REPOS.md
smit-task new   <task> [dự-án]              # tạo thư mục task + thẻ Orca
smit-task add   <task> <repo...>            # tạo worktree nhánh <user>/<task>, gắn vào thẻ, chạy cài đặt, thêm dòng bảng TASK.md
smit-task close <task> [--force]            # xoá worktree + thẻ + thư mục; từ chối nếu còn thay đổi chưa commit/push
```
Tên repo = tên trong `orca repo list` (cột đầu của `repos.txt`).

## Lập bản đồ dự án
Khi được yêu cầu "lập bản đồ dự án <p>" (kèm danh sách "repo mới cần lập"; không có danh sách = mọi repo chưa có `repos/<repo>.md`):

1. **Mỗi repo một agent con** (Agent tool, chạy song song, mỗi lượt tối đa ~8). Giao cho agent con: tên repo, đường dẫn gốc (từ `repos.txt`), mẫu `templates/repo-note.md`, file đích `projects/<p>/repos/<repo>.md`. Agent con:
   - Chỉ đọc repo đó: `CLAUDE.md`/`AGENTS.md` nếu có, README, manifest (`package.json`, `go.mod`, `pyproject.toml`…), cây thư mục 2 cấp, `orca.yaml`, file route / controller / service / API client. Không đọc `node_modules`, `dist`, `build`, lockfile, bản build minified.
   - Điền mẫu: loại repo, việc nó lo, **việc → file** (FE: route/màn hình; BE: prefix API/action/job), **gọi sang repo khác** (đường dẫn API FE gọi, service BE gọi, schema DB), cách cài/test/lint/dev, quy ước, điểm dễ sai. Có bằng chứng thì ghi đường dẫn file. Không đoán từ tên repo; chưa chắc → ghi vào "Chưa rõ".
   - Trả về tóm tắt ≤ 15 dòng: loại, việc lo, prefix API/route chính, gọi sang đâu.
   Agent chính **không đọc lại code** của từng repo; chỉ dùng tóm tắt + file ghi chú.
2. **Ghép `projects/<p>/REPOS.md`**: bảng repo, **tính năng → repo** (nối đường dẫn API FE gọi với BE khai báo prefix đó), quan hệ giữa repo, cài/test, thứ tự deploy, điểm dễ sai. Chỉ thêm/sửa phần của repo mới; phần đã có giữ nguyên.
3. **Mục "Chưa rõ / có thể thiếu repo"**: FE gọi API mà không BE nào đã khai báo xử lý; repo được nhắc tới (import, URL, tên service) nhưng không có trong `repos.txt`; tính năng không xác định được repo. Đây là tín hiệu dự án còn thiếu repo.
4. Repo cần thêm bước cài đặt ngoài `orca.yaml` (vd: link `.env`, submodule) → viết `projects/<p>/setup-worktree.sh` (`$1`=repo `$2`=đường dẫn gốc `$3`=worktree), `chmod +x`.
5. Báo người dùng: đã lập repo nào, mục "Chưa rõ / có thể thiếu repo", nhờ họ duyệt/sửa `REPOS.md`.
   Repo chưa có `CLAUDE.md` riêng → đề xuất (không tự làm) đưa `repos/<repo>.md` vào repo đó qua một task.

## Khi được giao việc
Task hiện tại = tên thư mục đang đứng (`basename $PWD`); dự án = nội dung `.project`.
Đang đứng ở `smit-tasks/` (chưa có task) → đặt tên kebab-case, chạy `smit-task new <task> [dự-án]`, làm tiếp với `smit-tasks/<task>/` và báo người dùng mở thẻ đó trong Orca.

1. **Ghi yêu cầu** nguyên văn vào `TASK.md` → "Yêu cầu".
2. **Định tuyến**: đọc `../projects/<dự-án>/REPOS.md` (bản đồ có trỏ tới tài liệu khác thì đọc theo), rồi `repos/<repo>.md` của repo ứng viên, rồi `grep` có mục tiêu trong repo gốc (đường dẫn ở `repos.txt`) để **tìm được file cụ thể** sẽ sửa. Không quét mọi repo, không đoán từ tên repo.
3. **Ghi vào `TASK.md` → "Định tuyến"**: repo nào sửa + lý do + file dự kiến, repo nào KHÔNG sửa + lý do.
4. **Hỏi người dùng xác nhận 1 lần** (AskUserQuestion). Đây là điểm dừng duy nhất trước khi code, trừ khi yêu cầu mơ hồ hoặc gặp mục "Không biết sửa ở đâu" dưới đây.
5. `smit-task add <task> <repo...>`. Repo báo "chưa cài đặt"/"cài đặt lỗi" → cài theo cột "Cài đặt" trong `REPOS.md`.
6. **Làm từng repo** qua `smit-tasks/<task>/<repo>/`: đọc `CLAUDE.md` của repo đó trước (không có thì đọc `../projects/<dự-án>/repos/<repo>.md`), code, viết/chạy test, lint. Thứ tự theo "Thứ tự deploy" trong `REPOS.md` (thường DB → BE → FE). BE và FE phải khớp nhau (tên API, field, kiểu dữ liệu).
7. **Cập nhật bảng "Worktree đang xử lý"** sau mỗi bước của mỗi repo (`đang code` → `test pass`/`test lỗi: …` → `đã commit <sha>`) và thêm 1 dòng "Nhật ký".
8. Xong: commit **local** từng repo, báo kết quả + thứ tự deploy. Không push.

Cần thêm repo giữa chừng → **hỏi người dùng trước**, rồi `smit-task add <task> <repo>` (sửa được ngay, không cần khởi động lại), ghi lý do vào "Định tuyến".
`REPOS.md` sai so với code → tin code, sửa `REPOS.md` và báo người dùng.

## Không biết sửa ở đâu → DỪNG, báo cáo, hỏi lại
Không được sửa "cho có", không được sửa repo/file không liên quan, không được tự tạo cơ chế mới (service, endpoint, bảng) để lách việc thiếu chỗ sửa.

Dừng ngay (trước khi tạo worktree, hoặc giữa chừng nếu phát hiện muộn) khi gặp bất kỳ trường hợp nào:
- Bản đồ không có tính năng/màn hình/API nào khớp yêu cầu, hoặc khớp nhiều repo mà không phân định được.
- Tìm được repo nhưng `grep` không ra file xử lý cụ thể.
- Code dẫn tới một repo **không có trong `repos.txt`** (FE gọi API mà không BE nào khai báo xử lý, import package nội bộ, gọi service khác…).
- Việc cần sửa nằm ngoài mọi repo đã khai báo (hạ tầng, config server, DB thật…).
- `smit-task add` báo repo chưa khai báo / chưa có trong Orca.

Khi dừng:
1. Ghi vào `TASK.md` → "Định tuyến" mục **"Chưa xác định được"**: đã tra gì (bản đồ, file, lệnh `grep`), tìm thấy gì, thiếu gì; trạng thái chung = `chờ người dùng: thiếu thông tin định tuyến`.
2. Báo người dùng bằng AskUserQuestion, nêu rõ: **đã tìm ở đâu**, **vì sao không chắc**, **repo nghi là còn thiếu** (tên/đường dẫn API/service dẫn tới nó). Lựa chọn gợi ý:
   - Thêm repo còn thiếu: `smit-task init <dự-án> <đường-dẫn-repo>` rồi tiếp tục.
   - Người dùng chỉ rõ repo/file cần sửa.
   - Thu hẹp / làm rõ yêu cầu.
3. Chỉ làm tiếp khi người dùng đã trả lời. Thông tin mới (repo, file, tên gọi nghiệp vụ) → bổ sung vào `REPOS.md` / `repos/<repo>.md` để lần sau không hỏi lại.

## Luật
- Git chạy theo từng repo: `git -C smit-tasks/<task>/<repo> ...`. Mỗi repo 1 commit (conventional commits, tiếng Anh), 1 PR.
- Chỉ sửa trong worktree có trong bảng của task này. Không sửa repo gốc (chỉ để tra cứu), không đụng worktree của task khác.
- Không chạy migration lên DB thật, không in nội dung `.env`, không push / tạo PR.
- `smit-task close` (và `orca worktree rm`) xoá luôn nhánh local → chỉ đóng khi mọi repo đã push hoặc người dùng đồng ý `--force`.
- Không dùng `orca worktree create --no-parent` cho task nhiều repo. Không tạo thêm nhóm `tasks` trong Orca; thấy trùng thì báo người dùng.
- Dev server của repo nào chạy ở thẻ worktree con của repo đó trong Orca, không chạy ở thẻ task.
- `TASK.md` là trí nhớ của task: mất mạch (session mới, sau compact) → đọc lại trước khi làm tiếp.
