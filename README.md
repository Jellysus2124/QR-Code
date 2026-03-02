# QR Tracking System (Next.js + Supabase)

He thong theo doi qua tang cho hoc sinh bang QR, gom 3 vai tro:
- `admin`: tao lo QR, import contributor, gan QR cho contributor
- `admin`: tao lo QR, import contributor, gan QR cho contributor, export QR ra PDF A4
- `scanner`: quet QR khi phat qua
- `contributor`: xem thong bao qua da duoc trao

## 1) Cai dat local

```bash
npm install
cp .env.example .env.local
npm run dev
```

## 2) Cau hinh Supabase

1. Tao project Supabase (free tier).
2. Chay SQL trong file `supabase/schema.sql`.
3. Lay keys trong Supabase:
   - Project URL -> `NEXT_PUBLIC_SUPABASE_URL`
   - anon key -> `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - service_role key -> `SUPABASE_SERVICE_ROLE_KEY`
4. Them `STAFF_ALLOWLIST` (email admin/scanner, cach nhau boi dau phay), vi du:
   - `STAFF_ALLOWLIST=admin@example.com,scanner1@example.com`
5. Trong Supabase Auth > URL Configuration:
   - Site URL: `http://localhost:3000`
   - Redirect URL: `http://localhost:3000/auth/callback`

## 3) Tao tai khoan admin/scanner

1. Dam bao email staff nam trong `STAFF_ALLOWLIST`, sau do dang nhap o `/login`.
2. Sau khi dang nhap lan dau, cap nhat role trong SQL Editor:

```sql
update public.profiles
set role = 'admin'
where email = 'your-admin-email@example.com';

update public.profiles
set role = 'scanner'
where email = 'your-scanner-email@example.com';
```

## 4) Quy trinh su dung

1. Admin import contributor tu Google Form CSV (cot `email,full_name,donation_quantity`).
2. Admin tao lo QR (100-200 ma tuy nhu cau).
3. Admin gan danh sach QR cho contributor theo email.
4. Admin chon QR va export file PDF A4 de in.
5. Scanner mo trang `/scanner`, nhap truong/lop va quet lien tiep.
6. Moi QR hop le se tao thong bao in-app trong tai khoan contributor.

## 5) Deploy free

- Frontend: Vercel (free)
- Database/Auth: Supabase (free)

Khi deploy, them bien moi truong giong `.env.local` va cap nhat redirect URL trong Supabase thanh domain Vercel.
