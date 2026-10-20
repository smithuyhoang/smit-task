# smit-task — giao việc nhiều repo cho Claude, dùng cho mọi dự án

Bạn tạo task, giao việc bằng lời. Agent tự xác định cần sửa repo nào (BE, FE, migration…), viết bản thoả thuận API giữa BE và FE (`contract.md`) để bạn duyệt **một lần**, rồi tự tạo worktree, giao agent code từng repo, kiểm tra, review và commit local. Bạn bảo "ship" thì nó mở **PR**.

> **1 task = 1 thư mục `smit-tasks/<task>/` = 1 thẻ trong Orca = 1 session Claude**

*Worktree: bản sao của repo để làm trên nhánh riêng, không đụng thư mục gốc.*

## Bắt đầu nhanh
**Một lần trên mỗi máy**
1. Cài đủ mục [1. Cần có](#1-cần-có), bật *Nest workspaces* trong Orca.
2. Clone repo này và tạo lệnh `smit-task` ([2. Cài đặt](#2-cài-đặt-một-lần)). Đặt ở đâu cũng được, không cần ngang hàng với các repo dự án.
3. `smit-task init <dự-án> <thư-mục-chứa-repo>` để lập bản đồ `REPOS.md` ([3. Khai báo dự án](#3-khai-báo-dự-án-một-lần-cho-mỗi-dự-án)). Bản đồ không lên git, **mỗi người tự chạy**. Thiếu bước này `/task-build` không biết sửa repo nào.

**Mỗi lần giao việc**

4. Trong Orca tạo 1 thẻ trỏ vào **đúng thư mục `smit-tasks`** (thư mục khác sẽ không có skill `/task-build`).
5. Mở terminal **của thẻ đó** → gõ `claude`. Mở Claude ngoài Orca thì agent không biết thẻ nào, sẽ tạo thẻ mới.
6. `/task-build "<yêu cầu>"` → duyệt `contract.md` → agent tạo worktree và gắn vào thẻ; tab *Attached worktrees* của thẻ hiện danh sách worktree agent đang xử lý. Muốn mở PR: `/task-ship`.

Chi tiết từng bước ở các mục dưới.

## 1. Cần có
| Thứ cần có | Kiểm tra |
|---|---|
| macOS, Orca ≥ 1.4.203 (đang mở) | `orca status` |
| Claude Code | `claude --version` |
| git, python3 | `git --version && python3 --version` |
| GitHub CLI đã đăng nhập, jq (cho `/task-ship`) | `gh auth status && jq --version` |
| AgentKit (skill `ak:code-review`, dùng ở bước code review) | gõ `/ak:code-review` trong Claude Code |
| Các repo của dự án đã clone về máy | — |

**Orca → Settings:** chọn *Workspace directory* (nơi đặt worktree), bật *Nest workspaces*, *Branch prefix* = Git username.

## 2. Cài đặt (một lần)
```bash
git clone https://github.com/smithuyhoang/smit-task.git ~/smit-tasks        # đặt ở đâu cũng được
chmod +x ~/smit-tasks/bin/*
mkdir -p ~/.local/bin && ln -sf ~/smit-tasks/bin/smit-task ~/.local/bin/smit-task
```
Chưa có `~/.local/bin` trong PATH thì thêm `export PATH="$HOME/.local/bin:$PATH"` vào `~/.zshrc` rồi mở terminal mới.
Orca không nằm ở `/Applications/Orca.app` thì thêm `export ORCA_APP="/đường/dẫn/Orca.app"`.

## 3. Khai báo dự án (một lần cho mỗi dự án)
```bash
smit-task init <tên-dự-án> <thư-mục-chứa-các-repo | đường-dẫn-repo | tên-repo-trong-Orca ...>
# ví dụ: smit-task init shop ~/code/shop-api ~/code/shop-web ~/code/shop-db
# hoặc:  smit-task init shop ~/code/shop        (tự tìm mọi repo git bên trong)
```
Lệnh này:
1. Tìm các repo, hỏi bạn xác nhận, thêm repo nào chưa có vào Orca.
2. Cấp quyền cho Claude trên máy bạn: đọc repo gốc, sửa trong thư mục worktree, **không** sửa repo gốc, không đọc `.env`.
3. Mở Claude để **tự viết bản đồ dự án**. Mỗi repo được một agent con đọc riêng và ghi chú vào `projects/<dự-án>/repos/<repo>.md`. Sau đó Claude ghép thành `projects/<dự-án>/REPOS.md`: repo nào lo việc gì, tính năng nào nằm ở repo nào, cách cài và test, kèm mục **"Chưa rõ / có thể thiếu repo"**.

👉 **Đọc lại `REPOS.md` và sửa chỗ sai**, nhất là mục "Chưa rõ". Bản đồ đúng thì agent chọn repo đúng.

Thêm repo mới vào dự án: chạy lại `smit-task init <dự-án> <repo-mới>`. Claude chỉ đọc repo mới, phần bản đồ đã duyệt giữ nguyên.

`projects/` chỉ nằm trên máy bạn (không lên git): mỗi người tự `init` dự án của mình. Nhiều người cùng một dự án → đưa ghi chú quan trọng vào `CLAUDE.md` của repo dự án, lần lập bản đồ sau ở máy khác sẽ đọc lại.

## 4. Dùng hằng ngày
| Bước | Bạn làm |
|---|---|
| 1 | `smit-task new <tên-task> [dự-án]` (chỉ có 1 dự án thì bỏ qua tên dự án) |
| 2 | Orca → nhóm **tasks** → bấm thẻ `<tên-task>` → mở terminal → gõ `claude` |
| 3 | Giao việc bằng lời hoặc `/task-build "<yêu cầu>"`, ví dụ `/task-build "Thêm bộ lọc theo ngày cho danh sách đơn hàng"` |
| 4 | Agent đề xuất repo cần sửa + `contract.md`, bạn **duyệt** |
| 5 | Agent tạo worktree, giao agent `task-db`/`task-be`/`task-fe` code, `task-verify` đối chiếu contract, code review, commit local. Theo dõi ở `TASK.md` hoặc tab *Attached worktrees* trên thẻ |
| 6 | Xem diff trong Orca. Muốn mở PR: gõ `/task-ship` → rebase, test lại, agent `task-review` soát lỗi độc lập và `task-security` soát bảo mật (FE chỉ soát khi diff chạm vùng nhạy cảm) (có lỗi → dừng hỏi bạn từng lỗi: AI tự sửa hoặc bỏ qua; hết lỗi mới tạo PR), chấm rủi ro (`bin/task-risk`), push + **PR** mỗi repo (Claude Code hỏi bạn trước mỗi lệnh push/PR). PR đã mở mà cần sửa tiếp: commit thêm rồi gõ lại `/task-ship`, nó cập nhật PR cũ. Không bao giờ merge |
| 7 | Mọi PR đã merge → `smit-task close <tên-task>` |

**Cách khác (bước 4–6 của [Bắt đầu nhanh](#bắt-đầu-nhanh)):** thay bước 1–2 bằng: tự tạo 1 thẻ Orca trên thư mục `smit-tasks`, mở terminal của thẻ đó, gõ `claude`. Khi bạn `/task-build`, agent gắn task vào chính thẻ này (`smit-task new <task> --card`) thay vì tạo thẻ mới, nên worktree hiện ở tab *Attached worktrees* của thẻ. Thẻ đã gắn task thì lần sau mở lại, agent làm tiếp task đó. `smit-task close` giữ lại thẻ bạn tự tạo, chỉ gỡ worktree.

## 5. Phím tắt tạo task (không bắt buộc)
Mở ứng dụng **Shortcuts** → **+** → ô "Search for apps and actions" gõ `Run Shell Script` rồi kéo vào giữa.
Shell: `bash`. Nội dung: `~/smit-tasks/bin/smit-task-dialog` (thay bằng đường dẫn thật). Giữ nguyên Input và Pass Input.
Bấm **ⓘ** → **Add Keyboard Shortcut** → chọn phím (ví dụ ⌃⌥T). Không thấy Run Shell Script thì vào **Shortcuts → Settings → Advanced → Allow Running Scripts**.
Phím tắt dùng khi chỉ có 1 dự án. Có nhiều dự án thì dùng lệnh ở bước 4.

## 6. Quy tắc
- ⚠️ `smit-task close` **xóa luôn nhánh local**. Lệnh từ chối nếu còn thay đổi chưa commit hoặc chưa push. `--force` sẽ mất code.
- Chỉ dùng một session Claude ở thẻ task. Không mở Claude riêng trong từng worktree.
- Dev server của repo nào chạy ở thẻ worktree con của repo đó.
- Chỉ có một nhóm `tasks` trong Orca.

## 7. Tuỳ biến cho dự án
- **Luật rủi ro riêng:** `projects/<dự-án>/risk-rules.sh` (được `bin/task-risk` nạp; thêm lý do vào mảng `HIGH`/`MEDIUM`).
- **Ảnh/smoke FE:** thêm mục "Preview ảnh FE" vào `REPOS.md` (lệnh `shot`/`smoke`) thì `task-verify` và `/task-ship` dùng; không có thì bỏ qua.
- **Cài đặt worktree:** repo có `orca.yaml` (`scripts.setup`) thì lệnh đó tự chạy. Cần thêm bước (link `.env`, …) thì viết `projects/<dự-án>/setup-worktree.sh` (tham số: repo, đường dẫn gốc, worktree).
- Dự án đã có tài liệu định tuyến sẵn thì `REPOS.md` chỉ cần trỏ tới tài liệu đó.

## 8. Gặp lỗi
| Thông báo | Cách xử lý |
|---|---|
| `Orca runtime not reachable` | Mở ứng dụng Orca |
| `repo '…' is not registered in Orca` | `smit-task init <dự-án> <đường-dẫn-repo>` |
| `pick a project` | Thêm tên dự án: `smit-task new <task> <dự-án>` |
| `more than one Orca group named 'tasks'` | Xóa nhóm trùng trong Orca |
| `orca rpc … failed` | Orca vừa cập nhật làm hỏng API ẩn. Báo người bảo trì |
| `chưa cài đặt` / `cài đặt lỗi` trong `TASK.md` | Agent tự cài theo `REPOS.md`, hoặc bạn cài tay trong worktree |
| `command not found: smit-task` | Xem lại PATH ở mục 2 |
