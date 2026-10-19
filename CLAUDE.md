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
smit-task new   <task> [dự-án] [--card]     # tạo thư mục task + thẻ Orca; --card: dùng thẻ Orca đang mở thay vì tạo thẻ mới
smit-task add   <task> <repo...>            # tạo worktree nhánh <user>/<task>, gắn vào thẻ, chạy cài đặt, thêm dòng bảng TASK.md
smit-task close <task> [--force]            # xoá worktree + thẻ (trừ thẻ dùng --card) + thư mục; từ chối nếu còn thay đổi chưa commit/push
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
Giao bằng lời hoặc `/task-build "<yêu cầu>"` — cùng một luồng dưới đây (skill chỉ là lối vào, không có bước riêng).
Task hiện tại = tên thư mục đang đứng (`basename $PWD`); dự án = nội dung `.project`.
Đang đứng ở `smit-tasks/` (chưa có task):
- Có `ORCA_WORKSPACE_ID=folder:<id>` (Claude chạy trong 1 thẻ Orca) → thẻ đó là thẻ task, để worktree hiện ở tab *Attached worktrees* của nó. Task nào có `.orca-folder-id` = `<id>` thì làm tiếp task đó; chưa có → đặt tên kebab-case, chạy `smit-task new <task> [dự-án] --card`. Làm tiếp với `smit-tasks/<task>/`, không tạo thẻ mới.
- Không có → đặt tên kebab-case, chạy `smit-task new <task> [dự-án]`, làm tiếp với `smit-tasks/<task>/` và báo người dùng mở thẻ đó trong Orca.

1. **Ghi yêu cầu** nguyên văn vào `TASK.md` → "Yêu cầu".
2. **Định tuyến**: đọc `../projects/<dự-án>/REPOS.md` (bản đồ có trỏ tới tài liệu khác thì đọc theo), rồi `repos/<repo>.md` của repo ứng viên, rồi `grep` có mục tiêu trong repo gốc (đường dẫn ở `repos.txt`) để **tìm được file cụ thể** sẽ sửa. Không quét mọi repo, không đoán từ tên repo.
3. **Ghi vào `TASK.md` → "Định tuyến"**: repo nào sửa + lý do + file dự kiến, repo nào KHÔNG sửa + lý do.
4. **Contract**: chép `../templates/contract.md` → `contract.md` trong thư mục task, điền mọi mục (DB / API / FE / Kiểm tra), xoá mục không cần. Chưa biết → ghi vào "Câu hỏi mở", không bịa.
5. **Hỏi người dùng duyệt 1 lần** (AskUserQuestion): danh sách repo + `contract.md` + câu hỏi mở. Duyệt / Sửa (sửa rồi hỏi lại) / Huỷ (trạng thái `huỷ`, không tạo gì). Đây là điểm dừng duy nhất trước khi code, trừ khi gặp mục "Không biết sửa ở đâu" dưới đây.
6. `smit-task add <task> <repo...>`. Repo báo "chưa cài đặt"/"cài đặt lỗi" → cài theo mục "Cài đặt" trong `REPOS.md`.
7. **Giao agent code** (Agent tool), theo "Thứ tự deploy" trong `REPOS.md`: `task-db` trước, rồi `task-be` ∥ `task-fe` (song song, chạy nền). Mỗi agent 1 repo, prompt chỉ gồm `contract: <đường dẫn tuyệt đối>`, `cwd: <worktree>`, `map: <REPOS.md>`, "DO NOT COMMIT OR PUSH".
   Agent trả `BLOCKED`/`NEEDS_CONTEXT` → dừng, đưa câu hỏi của agent cho người dùng; không tự thử lại.
   Task nhỏ 1 repo, sửa vài dòng → được tự code thay vì giao agent, nhưng vẫn qua bước 8–9.
8. **Kiểm tra**: `task-verify` với contract + mọi worktree + đường dẫn repo gốc + `map`. `Mismatches > 0` hoặc test lỗi → báo người dùng, không commit.
9. **Code review trước commit**: mỗi worktree `Skill(ak:code-review, "--pending")` (mọi lệnh git là `git -C <worktree>`), bỏ bước so contract (task-verify đã làm), chỉ diff chưa commit. Sửa lỗi Critical/Important + chất lượng (dùng lại helper sẵn có, bỏ code thừa, theo pattern xung quanh, thêm test cho logic mới). **Không đổi mục nào của contract** (method, path, field, cột, key i18n) — cần đổi thì để lại, báo người dùng. Có sửa → chạy lại `task-verify`.
10. **Cập nhật bảng "Worktree đang xử lý"** sau mỗi bước của mỗi repo (`đang code` → `verify pass`/`verify lỗi: …` → `đã commit <sha>`) và thêm 1 dòng "Nhật ký".
11. Xong: commit **local** từng repo (chỉ file agent báo + file bước 9 sửa), báo kết quả + thứ tự deploy (+ lệnh migration người dùng tự chạy). Không push.
12. **Ship** chỉ khi người dùng bảo ("ship", "mở PR"): `/task-ship` — rebase, test lại, `task-review` soát lỗi độc lập (có lỗi bất kỳ mức nào → dừng hỏi người dùng từng lỗi: AI tự sửa / bỏ qua, rồi test + review lại; còn lỗi chưa xử lý thì không push repo nào), smoke/ảnh, `bin/task-risk` chấm rủi ro, push nhánh + **PR** (thường, không Draft) mỗi repo, link chéo. Không bao giờ merge.

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
- Không chạy migration lên DB thật, không in nội dung `.env`. Push / tạo PR **chỉ qua `/task-ship`** khi người dùng bảo, PR thường (không Draft); không merge, không bật auto-merge.
- `smit-task close` (và `orca worktree rm`) xoá luôn nhánh local → chỉ đóng khi mọi repo đã push hoặc người dùng đồng ý `--force`.
- Không dùng `orca worktree create --no-parent` cho task nhiều repo. Không tạo thêm nhóm `tasks` trong Orca; thấy trùng thì báo người dùng.
- Dev server của repo nào chạy ở thẻ worktree con của repo đó trong Orca, không chạy ở thẻ task.
- `TASK.md` là trí nhớ của task: mất mạch (session mới, sau compact) → đọc lại trước khi làm tiếp.
