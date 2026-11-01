# 🪷 Hướng Dẫn Cài Đặt & Sử Dụng Chùa Linh Ứng Online (TikTok Live RPC)

Dự án: **`zane-tv/tiktok-live-temple-rpc`**  
Mục đích: Phát trực tiếp Chùa Online tương tác chuẩn dọc 9:16 (`1080×1920`) trên **TikTok Live** / **OBS Studio**, tích hợp **JSON-RPC 2.0** và giọng đọc AI **ZeroTTS** tiếng Việt.

---

## ⚡ Cách Setup Nhanh (1 Click trên Windows)

Bạn có thể chạy tự động bằng 1 trong 2 cách:
1. **Cách 1 (Khuyên dùng)**: Nhấp đúp chuột vào file [setup.bat](file:///d:/trapc/tiktok-live-template-rpc/setup.bat)
2. **Cách 2**: Mở PowerShell tại thư mục này và gõ:
   ```powershell
   .\setup.ps1
   ```

Script sẽ tự động:
- Khởi tạo git và clone toàn bộ mã nguồn cùng tài nguyên (ảnh Đức Phật, 8 frame Phật tử vái lạy, âm thanh mõ, chuông) từ `https://github.com/zane-tv/tiktok-live-temple-rpc.git`.
- Cài đặt thư viện Bun / Node (`express`, `ws`, `tiktok-live-connector`, `cors`).
- Tạo môi trường ảo `.venv` và cài đặt ZeroTTS tiếng Việt (`zerotts`, `pillow`).
- Tự động vá đường dẫn Python trên Windows (`.venv\Scripts\python.exe`) vào [server.js](file:///d:/trapc/tiktok-live-template-rpc/server.js).

---

## 🛠 Hướng Dẫn Cài Đặt Thủ Công Từng Bước (Theo README gốc)

### 1. Yêu cầu hệ thống
- **Bun.js** (`>= 1.1`) tải tại: https://bun.sh (hoặc **Node.js** `>= 18` nếu chưa cài Bun)
- **Python** (`3.10+`) hoặc công cụ **uv** (tùy chọn - dùng cho giọng đọc AI ZeroTTS)
- **Git** đã cài trên Windows

### 2. Kéo mã nguồn
```powershell
git clone https://github.com/zane-tv/tiktok-live-temple-rpc.git .
```
*(Nếu thư mục đã có file, chạy `git init`, `git remote add origin https://github.com/zane-tv/tiktok-live-temple-rpc.git`, `git fetch`, `git checkout -f -B main origin/main`)*

### 3. Cài đặt thư viện Web/Server
Nếu dùng **Bun**:
```bash
bun install
```
Nếu dùng **Node.js / npm**:
```bash
npm install
```

### 4. Cài đặt Giọng đọc AI ZeroTTS (Tùy chọn)
Nếu dùng **uv**:
```bash
uv venv .venv
uv pip install zerotts pillow
```
Nếu dùng **Python chuẩn trên Windows**:
```powershell
python -m venv .venv
.\.venv\Scripts\pip install zerotts pillow
```

### 5. Khởi chạy Server
Nếu dùng **Bun**:
```bash
bun start
# Hoặc chế độ tự động reload khi sửa file:
bun run dev
```
Nếu dùng **Node.js**:
```bash
node server.js
```
Hoặc chỉ cần nhấp đúp file [start.bat](file:///d:/trapc/tiktok-live-template-rpc/start.bat).

---

## 🌐 Các Đường Dẫn Truy Cập Sau Khi Chạy Server

Server mặc định lắng nghe tại cổng `3000`:
- **Chánh Điện Live 9:16 + Bảng điều khiển nhanh**: [http://localhost:3000](http://localhost:3000)
- **Chế độ OBS Browser Source Sạch**: [http://localhost:3000/?obs=1](http://localhost:3000/?obs=1)  
  *(Trong OBS Studio, thêm nguồn Browser Source, đặt URL là `http://localhost:3000/?obs=1`, kích thước Width: `1080`, Height: `1920`)*
- **Bảng Quản Trị JSON-RPC & Giả Lập Live**: [http://localhost:3000/admin](http://localhost:3000/admin)

---

## 🎮 Bảng Quy Tắc Tương Tác Tự Động Trên TikTok Live

| Sự kiện TikTok Live | Từ khóa / Thao tác | Nghi thức Chánh Điện | Điểm Công Đức |
| :--- | :--- | :--- | :---: |
| **Thả tim (Like)** | Người xem gõ tim | Gõ mõ gỗ tụng kinh + Đạo tràng 40 Phật tử cúi lạy | `+1` / tim |
| **Follow / Share** | Bấm Theo dõi / Chia sẻ | Thỉnh Đại Hồng Chung ngân vang + Sóng âm vàng tỏa rộng | `+10` |
| **Bình luận Thắp hương** | `thắp hương`, `dâng hương`, `bái phật`, `lạy phật` | Phật tử áo lam bước lên trước Lư Hương, quỳ đảnh lễ 3 lạy + Đọc tên thí chủ | `+15` |
| **Bình luận Cầu nguyện** | `cầu ...`, `nguyện ...`, `nam mô`, `a di đà phật`, `bình an` | Thả Đèn Hoa Đăng bay lên trời + Giọng đọc AI đọc lời khấn | `+10` |
| **Bình luận Xin xăm** | `xin xăm`, `gieo quẻ`, `rút quẻ`, `quẻ` | Lắc ống xăm vật lý + Mở tờ Giải Quẻ đồng bộ khớp giọng đọc | `+10` |
| **Quà Nhỏ (1–4 xu)** | Hoa hồng, Heart Me... | Dâng Đài Sen Vàng + Thắp 3 nén hương | `+20` / xu |
| **Quà Vừa (5–99 xu)** | Đèn lưu ly, Mâm ngũ quả... | Dâng Đèn Lưu Ly / Ngũ Quả + Thỉnh Đại Hồng Chung | `+30` / xu |
| **Quà Lớn (≥ 100 xu)** | Món quà từ 100 xu trở lên | **Đại Lễ Kim Long Chầu Phật**: Mưa hoa sen vàng, hào quang vạn trượng, chuông ngân liên hồi | `+50` / xu |

---

## 🔌 Tích Hợp JSON-RPC 2.0 (TikFinity / Streamer.bot / curl)

Endpoint: `POST http://localhost:3000/rpc`

Ví dụ gọi thắp hương:
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "temple.burnIncense",
  "params": {
    "user": "Thí Chủ Diệu Âm",
    "count": 3,
    "wish": "Cầu gia đạo bình an, tai qua nạn khỏi"
  }
}
```

Ví dụ kết nối tài khoản TikTok Live đang phát:
```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "live.connect",
  "params": {
    "username": "@username_cua_ban"
  }
}
```
*(Bạn cũng có thể kết nối trực tiếp trên giao diện Admin tại [http://localhost:3000/admin](http://localhost:3000/admin))*.
