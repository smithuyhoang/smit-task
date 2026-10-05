# smit-task — giao việc nhiều repo cho Claude, dùng cho mọi dự án

Bạn tạo task, giao việc bằng lời. Agent tự xác định cần sửa repo nào (BE, FE, migration…), hỏi bạn xác nhận **một lần**, rồi tự tạo worktree, code, test và commit local từng repo.

> **1 task = 1 thư mục `smit-tasks/<task>/` = 1 thẻ trong Orca = 1 session Claude**

*Worktree: bản sao của repo để làm trên nhánh riêng, không đụng thư mục gốc.*

## 1. Cần có
| Thứ cần có | Kiểm tra |
|---|---|
| macOS, Orca ≥ 1.4.203 (đang mở) | `orca status` |
| Claude Code | `claude --version` |
| git, python3 | `git --version && python3 --version` |
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
3. Mở Claude để **tự viết bản đồ dự án** `projects/<dự-án>/REPOS.md`: repo nào lo việc gì, tính năng nào nằm ở repo nào, cách cài và test.

👉 **Đọc lại `REPOS.md` và sửa chỗ sai.** Bản đồ đúng thì agent chọn repo đúng.

Thêm repo mới vào dự án: chạy lại `smit-task init <dự-án> <repo-mới>`.

## 4. Dùng hằng ngày
| Bước | Bạn làm |
|---|---|
| 1 | `smit-task new <tên-task> [dự-án]` (chỉ có 1 dự án thì bỏ qua tên dự án) |
| 2 | Orca → nhóm **tasks** → bấm thẻ `<tên-task>` → mở terminal → gõ `claude` |
| 3 | Giao việc bằng lời, ví dụ "Thêm bộ lọc theo ngày cho danh sách đơn hàng" |
| 4 | Agent đề xuất repo cần sửa, bạn **xác nhận** |
| 5 | Agent tạo worktree, code, test, commit local. Theo dõi ở `TASK.md` hoặc tab *Attached worktrees* trên thẻ |
| 6 | Xem diff trong Orca, rồi **bạn** push và tạo PR (agent không push) |
| 7 | Mọi PR đã merge → `smit-task close <tên-task>` |

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
