# Troubleshooting Guide

## Problem 1: Admin Login Tidak Berfungsi

### Gejala
- Password tidak diterima meski sudah benar
- Tidak bisa masuk ke dashboard admin

### Solusi

#### Step 1: Verifikasi Password
Password admin saat ini adalah: `didbraga01`

Edit file `app/api/admin/auth/route.ts` jika ingin mengubah:
```typescript
const ADMIN_PASSWORD = 'didbraga01'
```

#### Step 2: Verifikasi Cookie Settings
Pastikan browser menerima cookies:
- **Development**: Cookie seharusnya bekerja dengan `secure: false`
- **Production**: Cookie perlu HTTPS (akan set `secure: true`)

Check di browser DevTools:
1. Buka DevTools (F12)
2. Pergi ke Application → Cookies
3. Setelah login, check apakah `admin_session` ada dan bernilai `authenticated`

#### Step 3: Clear Cache & Cookies
```bash
# Di browser:
1. Buka Developer Tools (F12)
2. Application → Storage → Clear Site Data
3. Refresh halaman (Ctrl+R)
```

#### Step 4: Test Cookie dengan Debug Endpoint
```bash
curl -X GET http://localhost:3000/api/debug/info
```

Response akan menunjukkan apakah cookies dikenali.

---

## Problem 2: Nomor Gagal (Tabel Tidak Ada)

### Gejala
- Saat input nomor target, error "Gagal membuat tracking nomor target"
- Database tidak terhubung

### Solusi

#### Step 1: Verifikasi Database URL
Check `.env` file sudah ada `DATABASE_URL`:
```bash
echo $DATABASE_URL
```

Harus format PostgreSQL:
```
postgresql://user:password@host:port/database
```

#### Step 2: Create Tracking Table

**Opsi A: Menggunakan Neon Console (Recommended)**

1. Login ke Neon: https://console.neon.tech
2. Pilih project "still-pine-91344734"
3. Buka SQL Editor
4. Copy-paste isi dari file `setup-database.sql`
5. Jalankan query

**Opsi B: Menggunakan Command Line**

```bash
# Install psql (PostgreSQL client) jika belum ada
# macOS:
brew install postgresql

# Linux (Ubuntu/Debian):
sudo apt-get install postgresql-client

# Windows: Download dari https://www.postgresql.org/download/windows/
```

Kemudian jalankan:
```bash
psql "$DATABASE_URL" -f setup-database.sql
```

**Opsi C: Manual Query**

Copy dari `setup-database.sql` dan jalankan di Neon SQL Editor.

#### Step 3: Verify Table Created

```bash
psql "$DATABASE_URL" -c "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'tracking';"
```

Output seharusnya:
```
    column_name     |           data_type
--------------------+---------------------------
 id                 | text
 nomor_target       | text
 ip                 | text
 user_agent         | text
 latitude           | numeric
 longitude          | numeric
 city               | text
 province           | text
 country            | text
 status_link        | text
 status_lokasi      | text
 password_hash      | text
 password_plain     | text
 created_at         | timestamp with time zone
 expired_at         | timestamp with time zone
```

#### Step 4: Test Insert

```bash
psql "$DATABASE_URL" << EOF
INSERT INTO tracking (id, nomor_target)
VALUES ('test123', '08123456789')
RETURNING id, nomor_target;
EOF
```

Seharusnya berhasil dan return ID + nomor target.

---

## Problem 3: Database Connection Error

### Error Message
```
Resource temporarily unavailable
ECONNREFUSED
```

### Solusi

#### Check Connection String
```bash
# Verify DATABASE_URL format
echo $DATABASE_URL

# Harus output format:
# postgresql://user:password@host:port/database?sslmode=require
```

#### Verify Neon Project Active
1. Go to https://console.neon.tech
2. Check project status (harus "Active", bukan "Suspended")
3. Check connection pooling status

#### Test Connection
```bash
# Install neon CLI (optional)
npm install -g @neondatabase/cli

# Test connection
neon connection-string still-pine-91344734
```

---

## Database Schema Reference

Tabel `tracking` memiliki fields:

| Column | Type | Description |
|--------|------|-------------|
| id | TEXT | Primary key (unique ID) |
| nomor_target | TEXT | Nomor target/phone |
| ip | TEXT | IP address pengunjung |
| user_agent | TEXT | Browser user agent |
| latitude | NUMERIC | GPS latitude |
| longitude | NUMERIC | GPS longitude |
| city | TEXT | City name |
| province | TEXT | Province name |
| country | TEXT | Country name |
| status_link | TEXT | active/opened/expired |
| status_lokasi | TEXT | pending/gagal/Lokasi Didapatkan |
| password_hash | TEXT | Hashed password (bcrypt) |
| password_plain | TEXT | Plain password (temporary) |
| created_at | TIMESTAMP | Created time |
| expired_at | TIMESTAMP | Expiry time (30 days default) |

---

## Environment Variables

### Required
- `DATABASE_URL` - PostgreSQL connection string dari Neon

### Set di `.env` atau `.env.local`:
```bash
DATABASE_URL="postgresql://neondb_owner:PASSWORD@HOST/neondb?sslmode=require"
```

---

## Admin Password

Change admin password di `app/api/admin/auth/route.ts`:

```typescript
const ADMIN_PASSWORD = 'your-new-password-here'
```

Restart server setelah change.

---

## Still Having Issues?

1. **Check server logs**: `npm run dev` dan lihat console errors
2. **Check browser DevTools**: Network tab → lihat response dari API
3. **Database test**: `psql "$DATABASE_URL" -c "SELECT count(*) FROM tracking;"`
4. **Clear build cache**: `rm -rf .next && npm run build`
