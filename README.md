# İcra360

İşverenler için personel icra tebligatı, cevap yazısı ve maaş kesintisi takip sistemi.

**Personel icra süreçleri tek yerde.**

Çok şirketli (multi-tenant) işveren uygulaması. Faz 1: kimlik, RBAC, şirket/işyeri/personel. **Hukuki tavsiye vermez.** Cevap yazısı, OCR ve kesinti sonraki fazlardadır.

Arayüz Türkçe ve ürün adı **İcra360**. Kod, paket ve altyapı tanımlayıcıları `icra360` / `@icra360` / `Icra360`.

## Gereksinimler

- Node.js 20.11+
- pnpm 9
- Docker Desktop (Postgres, Redis, MinIO)

Bu makinede Compose eklentisi yoksa `docker-compose` kullanın (`docker compose` değil).

## Kurulum

```bash
cp .env.example .env
# AUTH_SECRET, NATIONAL_ID_HMAC_PEPPER ve ENCRYPTION_KEY değerlerini yerelde üretin:
#   openssl rand -base64 32
pnpm install
docker-compose up -d postgres redis minio minio-init
pnpm db:generate
pnpm --filter @icra360/db migrate:dev
# veya mevcut migration'lar için:
pnpm db:migrate
pnpm db:seed
pnpm dev
```

Uygulama: [http://localhost:3000](http://localhost:3000)

### Demo hesaplar (kurgusal)

Parola varsayılan: `SEED_PASSWORD` (.env). Örnek: `Demo.Sifre.123!`

| E-posta | Rol | Tenant |
| --- | --- | --- |
| admin-a@example.com | Sistem yöneticisi | Demo A |
| ik-a@example.com | İK (yalnızca tekstil şirketi) | Demo A |
| bordro-a@example.com | Bordro | Demo A |
| denetci-a@example.com | Denetçi | Demo A |
| admin-b@example.com | Sistem yöneticisi | Demo B |

Seed personelleri gerçek kişilere ait değildir. TCKN değerleri algoritmik sahte numaralardır.

## Komutlar

| Komut | Açıklama |
| --- | --- |
| `pnpm dev` | Web + worker |
| `pnpm lint` | Paket lint / `tsc` / `next lint` |
| `pnpm typecheck` | TypeScript |
| `pnpm test` | Vitest (birim + ortam varsa izolasyon) |
| `pnpm db:migrate` | `prisma migrate deploy` |
| `pnpm db:seed` | Demo veri |
| `docker-compose up -d` | Altyapı |
| `docker-compose --profile full up --build` | Web/worker konteyner denemesi |

## Mimari (Faz 1)

- `apps/web` — Next.js App Router, Auth.js, Türkçe UI (İcra360)
- `apps/worker` — BullMQ (şimdilik sağlık kuyruğu)
- `packages/db` — Prisma, RLS, seed
- `packages/domain` — iş kuralları ve yetki
- `packages/auth` — parola doğrulama, giriş audit
- `packages/crypto` — TCKN şifreleme / HMAC / maskeleme
- `packages/contracts` — Zod ve izin katalogu
- `packages/audit` — redakte audit yazımı

Tenant kimliği istek gövdesinden alınmaz; oturumdandır. Uygulama sorguları `tenantId` + `SET LOCAL app.tenant_id` kullanır. PostgreSQL RLS ikinci hattır (`icra360_app` rolü, `FORCE ROW LEVEL SECURITY`).

## Güvenlik

- `.env` ve üretim sırları **repoya girmez**.
- TCKN AES-256-GCM ile saklanır; arama HMAC ile yapılır.
- `sensitive:read` yoksa TCKN ve net ücret API/UI’da maskelenir. Açık gösterme audit’lenir.
- Cloud OCR / LLM varsayılan kapalıdır.
- Bu yazılım hukuk danışmanı değildir.

## Yedekleme (taslak)

1. Postgres: `pg_dump` günlük; üretimde WAL/PITR.
2. MinIO/S3: bucket versioning.
3. Şifreleme anahtarları yedekten ayrı saklanır; kayıp anahtar veri kaybıdır.
4. Geri yükleme staging’de tatbikat edilmelidir.

```bash
docker-compose exec postgres pg_dump -U icra360 icra360 > backup.sql
```

## Marka

Görsel kimlik, logo seti ve renkler: [docs/brand.md](docs/brand.md)

## Sonraki fazlar

Tebligat/OCR, icra sırası, DOCX cevap yazısı, kesinti/bordro, rapor ve KVKK sertleştirmesi. Ayrıntı: `docs/implementation-plan.md`.
