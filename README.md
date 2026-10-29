# E-commerce Monolithic MVP — Prompt 2

RESTful API dùng Node.js, Express, Prisma và PostgreSQL.
Các chức năng chạy chung một ứng dụng và dùng chung database.

## Database

Gồm 7 bảng: Role, User, MemberShip, Product, Order,
OrderDetail và Shipment.

OrderDetail có khóa chính ghép (oid, pid).
Username có ràng buộc duy nhất.

## Cấu hình

Tạo file .env trên máy, gồm các biến:

- PORT: cổng API, mặc định 3001.
- DATABASE_URL: kết nối PostgreSQL khi chạy Node trên máy.
- DOCKER_DATABASE_URL: kết nối trong Docker, hostname postgres.
- POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_DB.
- POSTGRES_PORT: cổng PostgreSQL trên máy.
- JWT_SECRET: khóa bí mật ngẫu nhiên dùng ký JWT.

Thông tin kết nối phải khớp với database đang sử dụng.
File .env được Git bỏ qua.

## Khởi động

```bash
docker compose up -d --build --wait
docker compose ps
curl -i http://localhost:3001/health
```

API tự chạy migration và seed trước khi khởi động.
Seed bổ sung CUSTOMER (1), ADMIN (2), BASIC (1) nếu chưa có;
không tạo tài khoản admin và không thay mật khẩu hiện có.

Với database mới, đăng ký tài khoản qua API.
Để cấp quyền admin trong môi trường bài tập, người quản trị
cập nhật roleid thành 2 cho đúng tài khoản trong database.

## API

| Method | Endpoint | Quyền |
|---|---|---|
| POST | /api/auth/register | Công khai |
| POST | /api/auth/login | Công khai |
| GET | /api/auth/profile | Đăng nhập |
| GET | /api/auth/admin | Admin |
| GET | /api/products | Công khai |
| POST | /api/products | Admin |
| PUT | /api/products/:id | Admin |
| DELETE | /api/products/:id | Admin |
| GET | /api/memberships/me | Đăng nhập |
| POST | /api/orders | Đăng nhập |
| POST | /api/orders/:oid/items | Chủ đơn |
| GET | /api/orders/my-orders | Đăng nhập |
| POST | /api/shipments | Admin |
| PUT | /api/shipments/:id/status | Admin |
| GET | /api/shipments/order/:oid | Chủ đơn |
| GET | /health | Công khai |

Dùng Authorization: Bearer <token> với API cần đăng nhập.
JWT dùng HS256, hết hạn sau 1 giờ.
Middleware lấy quyền hiện tại từ database.

## Quy tắc chính

- Mật khẩu đăng ký tối thiểu 8 ký tự, tối đa 72 UTF-8 bytes.
- Giá sản phẩm phải dương, tối đa 99999999.99.
- Tồn kho là số nguyên không âm; số lượng mua là số nguyên dương.
- Thêm trùng sản phẩm trong cùng đơn trả 409.
- Thiếu kho trả 409.
- Thêm chi tiết đơn và giảm kho nằm trong cùng transaction.
- Giảm kho có điều kiện để tránh âm kho khi đặt đồng thời.
- Shipment chấp nhận PENDING, SHIPPING, DELIVERED.
- API xem Shipment trả shipment có ID nhỏ nhất của đơn.
- Health truy vấn SELECT 1: thành công trả 200, lỗi trả 503.

## Kiểm tra đã thực hiện

Đăng ký, đăng nhập, JWT, phân quyền, membership, đặt hàng,
giảm kho, xem và cập nhật shipment, validation, lỗi JSON,
URL không tồn tại và hai đơn mua đồng thời khi chỉ còn một sản phẩm.

## Xem log và dừng

```bash
docker compose logs --tail=100 api
docker compose down
```

docker compose down giữ dữ liệu trong volume.
