# CLAUDE.md — smit-tasks (task nhiều repo, mọi dự án)

1 task = 1 thư mục `smit-tasks/<task>/` = 1 thẻ Orca (nhóm `tasks`) = 1 session Claude chạy trong thư mục đó.
Task có thể sửa 1 hay 15 repo (BE, FE, migration…): mỗi repo là 1 worktree, symlink vào `smit-tasks/<task>/<repo>`.

## Bố cục
```
smit-tasks/
├── projects/<dự-án>/
│   ├── repos.txt              danh sách repo của dự án: "<tên Orca>\t<đường dẫn gốc>"
│   ├── REPOS.md               BẢN ĐỒ: repo nào lo gì, tính năng → repo, cách cài/test
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
Khi được yêu cầu "lập bản đồ dự án <p>":
1. Đọc `projects/<p>/repos.txt`. Với từng repo, đọc lướt: `CLAUDE.md`/`AGENTS.md`, README, file manifest (`package.json`, `go.mod`, `pyproject.toml`, `pom.xml`…), cây thư mục 2 cấp, `orca.yaml`, file route/controller/API client chính. Không đọc `node_modules`, `dist`, `build`, lockfile.
2. Điền `projects/<p>/REPOS.md` theo đúng mẫu: loại repo, việc nó lo, **tính năng → repo** (dò từ route FE, prefix API BE, nơi FE gọi API), quan hệ giữa repo, cách cài/test/lint/dev từng repo, thứ tự deploy, điểm dễ sai. Có bằng chứng thì ghi đường dẫn file. Không đoán từ tên repo; chưa chắc thì ghi "chưa rõ".
3. Repo cần thêm bước cài đặt ngoài `orca.yaml` (vd: link `.env`, submodule) → viết `projects/<p>/setup-worktree.sh` (`$1`=repo `$2`=đường dẫn gốc `$3`=worktree), `chmod +x`.
4. Tóm tắt cho người dùng, nêu chỗ chưa chắc, nhờ họ duyệt/sửa `REPOS.md`.

## Khi được giao việc
Task hiện tại = tên thư mục đang đứng (`basename $PWD`); dự án = nội dung `.project`.
Đang đứng ở `smit-tasks/` (chưa có task) → đặt tên kebab-case, chạy `smit-task new <task> [dự-án]`, làm tiếp với `smit-tasks/<task>/` và báo người dùng mở thẻ đó trong Orca.

1. **Ghi yêu cầu** nguyên văn vào `TASK.md` → "Yêu cầu".
2. **Định tuyến**: đọc `../projects/<dự-án>/REPOS.md` (bản đồ có trỏ tới tài liệu khác thì đọc theo), rồi `grep` có mục tiêu trong repo gốc (đường dẫn ở `repos.txt`) để chắc chắn. Không quét mọi repo, không đoán từ tên repo.
3. **Ghi vào `TASK.md` → "Định tuyến"**: repo nào sửa + lý do, repo nào KHÔNG sửa + lý do.
4. **Hỏi người dùng xác nhận 1 lần** (AskUserQuestion). Đây là điểm dừng duy nhất trước khi code, trừ khi yêu cầu mơ hồ.
5. `smit-task add <task> <repo...>`. Repo báo "chưa cài đặt"/"cài đặt lỗi" → cài theo cột "Cài đặt" trong `REPOS.md`.
6. **Làm từng repo** qua `smit-tasks/<task>/<repo>/`: đọc `CLAUDE.md` của repo đó trước, code, viết/chạy test, lint. Thứ tự theo "Thứ tự deploy" trong `REPOS.md` (thường DB → BE → FE). BE và FE phải khớp nhau (tên API, field, kiểu dữ liệu).
7. **Cập nhật bảng "Worktree đang xử lý"** sau mỗi bước của mỗi repo (`đang code` → `test pass`/`test lỗi: …` → `đã commit <sha>`) và thêm 1 dòng "Nhật ký".
8. Xong: commit **local** từng repo, báo kết quả + thứ tự deploy. Không push.

Cần thêm repo giữa chừng → `smit-task add <task> <repo>` (sửa được ngay, không cần khởi động lại), ghi lý do vào "Định tuyến".
`REPOS.md` sai so với code → tin code, sửa `REPOS.md` và báo người dùng.

## Luật
- Git chạy theo từng repo: `git -C smit-tasks/<task>/<repo> ...`. Mỗi repo 1 commit (conventional commits, tiếng Anh), 1 PR.
- Chỉ sửa trong worktree có trong bảng của task này. Không sửa repo gốc (chỉ để tra cứu), không đụng worktree của task khác.
- Không chạy migration lên DB thật, không in nội dung `.env`, không push / tạo PR.
- `smit-task close` (và `orca worktree rm`) xoá luôn nhánh local → chỉ đóng khi mọi repo đã push hoặc người dùng đồng ý `--force`.
- Không dùng `orca worktree create --no-parent` cho task nhiều repo. Không tạo thêm nhóm `tasks` trong Orca; thấy trùng thì báo người dùng.
- Dev server của repo nào chạy ở thẻ worktree con của repo đó trong Orca, không chạy ở thẻ task.
- `TASK.md` là trí nhớ của task: mất mạch (session mới, sau compact) → đọc lại trước khi làm tiếp.
