# Uygulama Planı

**Durum:** Faz 1 uygulandı (İcra360 markası dahil). Faz 2 onayı bekler.

**İlgili belgeler:** [requirements.md](./requirements.md) · [architecture.md](./architecture.md) · [data-model.md](./data-model.md)

---

## 1. Onay kapısı

Aşağıdakiler onaylanmadan Faz 1 koduna geçilmemelidir:

1. Bu `docs/` setinin “yeterli taslak” kabulü
2. [requirements.md](./requirements.md) varsayımlar A1–A15
3. Belirsizliklerden en az: U1, U3, U5, U8, U9, U11, U15, U16
4. Hukuk listesinden en az: sıra tanımı, KVKK hukuki sebep, cevap yazısında tam TCKN, otomatik madde basmama
5. Teknik: T2 (BFF+worker), T4 (RLS), T7 (DOCX motoru POC takvimi), T9/T10 (OCR/çıkarım varsayılan lokal)

Onay “bütün fazları şimdi kodla” anlamına gelmez. Onay = **Faz 1 iskeleti** + kalan belirsizliklerin bilinçli ertelemesi.

---

## 2. Kapsam itirazı

23 modül, 24 ekran, OCR, DOCX/PDF, bordro, KVKK ve E2E tek seferde üretilmemelidir. Fazlar **ardışık yayınlanabilir dilimlerdir**. Faz 4 olmadan ürün “cevap yazısı sistemi” değildir; Faz 1 olmadan hiçbir şey güvenli değildir.

Gerçekçi alt sınır (küçük ekip): Faz 1 birkaç hafta; Faz 2–4 asıl ürün; Faz 5 bordro; Faz 6 sertleştirme. Takvim kişi-gün atamadan verilmez.

---

## 3. Faz 1 — Temel platform

**Amaç:** Çok şirketli, yetkili, test edilebilir iskelet. İcra yok.

### İş

- Monorepo (pnpm, Turborepo)
- Docker Compose: Postgres, Redis, MinIO, web, worker (boş processor)
- Prisma + RLS taslağı + migration
- Auth.js oturum, davet ile kullanıcı
- Tenant, Company, Workplace
- RBAC seed + özelleştirilebilir rol
- Employee + Employment CRUD (maskeleme)
- Türkçe kabuk: login, dashboard iskeleti, personel listesi
- `.env.example`, README (kurulum, migrate, test, güvenlik uyarısı)
- Audit: giriş

### Kabul kriterleri

1. `pnpm test`, `pnpm lint`, `docker compose up` belgelendiği gibi çalışır.
2. TypeScript `strict`, `any` yok (istisna: yok).
3. Tenant A personeli Tenant B API’sinden 404.
4. Şirket kapsamı A15 varsayılanında Company B verisi 404.
5. `sensitive:read` yokken TCKN ham dönmez.
6. Rol izni kaldınca 403.
7. Seed kurgusal kişiler.
8. Integration: RLS + yetki.
9. README: yedekleme taslağı, sırların repoya girmemesi.

**Çıkışta yok:** OCR, şablon, kesinti.

---

## 4. Faz 2 — Tebligat, OCR, eşleştirme

**Amaç:** Güvenli yükleme ve doğrulanmış veri. Cevap yazısı yok.

### İş

- Yükleme sihirbazı, MIME, hash, duplicate, malware port
- Signed URL önizleme (PDF/görsel)
- Text PDF + OCR adapter (Tesseract)
- JSON Schema çıkarım (`local_rules`)
- Sayfa güveni, düşük güven işareti
- OCR ekranı: sol belge, sağ alan, kaynak vurgusu
- Eşleştirme: TCKN HMAC, aday listesi, AMBIGUOUS
- Prompt sanitizasyonu, HTML’siz render
- Cloud OCR/LLM client **kodlanır ama flag kapalı**

### Kabul

1. İzin verilmeyen tür reddi.
2. Duplicate hash uyarısı.
3. Taranmış örnekte sayfa metni kaydı.
4. Düşük güven UI (senaryo 24).
5. Çok adayda otomatik eşleşme yok (6).
6. TCKN eşleşmesi doğru sahte checksum ile.
7. Doğrulanmamış alan `verified=false` kalır.
8. Logda TCKN yok.
9. Görüntüleme/indirme audit.
10. Zararlı tarama fail-closed veya onaylı U15.

---

## 5. Faz 3 — İcra dosyası, sıra, görev

**Amaç:** Dosya yaşam döngüsü ve önerilen sıra. Şablon yok.

### İş

- EnforcementCase alanları, üç durum makinesi eşlemesi
- CasePriority + RuleSetVersion snapshot
- Sıra önerisi + doğrulama + gerekçeli değişiklik + audit
- Görev ve in-app bildirim
- SLA tarayıcı iskeleti (cevap süresi)
- Manuel inceleme
- UI: icra listesi, detay, sıra ekranı, görevler

### Kabul

1. Rastgele status PATCH yok.
2. Doğrulanmamış sıra bayrağı false.
3. Sıra değişimi reasonsiz 422.
4. Kural versiyonu case üzerinde saklanır.
5. UI “hukuki karar değildir” metni görünür.
6. Aktif/bekleyen/kapanmış özet personel kartında.
7. İki tenant izolasyonu case ID ile.
8. Unit: kuyruk önerisi 0/1/2 aktif dosya (senaryo 2–4’ün sıra kısmı).

---

## 6. Faz 4 — Şablon ve cevap yazısı

**Amaç:** Ürünün kalbi. LLM metin yok.

### İş

- DOCX yükleme, değişken çıkarımı, unknown/unclosed if
- Versiyon, hash, onay olmadan aktif değil
- Öneri motoru JSON matcher ≤3
- Seçim ekranı (önizleme + gerekçe)
- Değişken çözümü + source snapshot
- LOCKED / FIELDS_ONLY / FULL_EDIT_WITH_APPROVAL
- docxtemplater POC → Gotenberg PDF
- Onay kuyruğu, dispatch kaydı
- Filigranlı taslak vs onaylı indirme

### Kabul (senaryo 1–16, 22)

1. İşten çıkış önerisi.
2. Aktif, icrasız → kesintiye başlama.
3. Bir aktif → 2. sıra.
4. İki aktif → 3. / sıraya alma.
5. Bulunamadı şablonu.
6. AMBIGUOUS öneri yok.
7. Öneri dışı seçim.
8. Ayar açıksa gerekçe zorunlu.
9. Eksik zorunlu değişken → belge yok.
10. OCR unverified → nihai yok.
11. Sıra unverified → nihai yok.
12. DOCX biçim POC testi (golden file).
13. DOCX ve PDF aynı değişken değerleri.
14. LOCKED metin API ile değişmez.
15. Yeni şablon versiyonu eski response’u değiştirmez.
16. Re-render üzerine yazmaz.
22. Seçim ve onay audit.

DOCX motoru POC başarısızsa Faz 4 durur; alternatif T7.

---

## 7. Faz 5 — Kesinti ve bordro

### İş

- DeductionPlan, PayrollPeriod, lock/unlock
- Beklenen/gerçekleşen, skip, variance
- Kalan borç + override
- Ödeme + dekont
- Kapanışta `NEXT_CASE_ACTIVATION`
- XLSX/CSV import/export, importKey
- Muhasebe export port (XLSX)

### Kabul (17–19, 23)

1. Decimal; JS `number` para yok.
2. Aylık actual remaining’i düşürür.
3. Kapanışta sıradaki görev (idempotent).
4. Kilitli dönem yetkisiz değişmez.
5. Yetkili düzeltme gerekçe + audit.
6. Tekrar import mükerrer yok.
7. Hatalı satır raporu.
8. Negatif remaining yazılmaz.

---

## 8. Faz 6 — Rapor, sertleştirme, E2E

### İş

- Raporlar + XLSX/PDF export
- Audit ekranı
- Saklama job iskeleti
- Rate limit, CSP, backup runbook
- Playwright kritik akışlar
- Performans: liste sayfalama, N+1 yok
- Üretim README: restore, secret, provider açma
- MFA kancası tamamı (U16)

### Kabul (20, 21, 24 zaten önceki fazlarda; E2E birleştirir)

1. Tüm rapor slug’ları filtre+sayfa.
2. Export audit.
3. Playwright: yükleme→doğrula→eşleş→sıra→şablon→onay (sentetik).
4. Güvenlik test S1–S12.
5. Log grep TCKN/IBAN.
6. Load: 10k case listesi p95 hedefi belgelenir (sayı onaylanır).
7. Cloud OCR hâlâ default off.

---

## 9. Test piramidi

| Katman | Nerede | Ne |
| --- | --- | --- |
| Unit | `packages/domain`, `rules`, `crypto` | sıra, öneri, remaining, matcher, maske |
| Integration | `packages/db`, API | RLS, unique importKey, status guard |
| Component | `apps/web` | OCR form, maskeleme |
| E2E | Playwright | Faz 6 kritik yol |
| Golden | `packages/documents` | DOCX XML snapshot |

CI: lint, typecheck, unit, integration (compose), E2E main’de nightly veya PR etiketli.

---

## 10. README’nin içereceği başlıklar (kodla birlikte)

Kurulum, env, migrate, seed, test, worker, backup/restore, güvenlik (PII, provider kapalı), hukuki red (`hukuki tavsiye değildir`).

---

## 11. Açık teknik kararlar (onay formu)

| ID | Öneri | Onay? |
| --- | --- | --- |
| T1 | pnpm + Turborepo | |
| T2 | Next BFF + ayrı worker | |
| T3 | Worker OCR/PDF | |
| T4 | Prisma gate + RLS | |
| T5 | Tenant ⊃ Company ⊃ Workplace | |
| T6 | Auth.js DB session | |
| T7 | docxtemplater; POC kapısı | |
| T8 | Gotenberg PDF | |
| T9 | Tesseract default | |
| T10 | local_rules default; LLM opt-in | |
| T11 | JSON matcher + TS queue policy + version snapshot | |
| T12 | Decimal 19,4; gösterim 2; HALF_UP | |
| T14 | AES-GCM TCKN/IBAN; maaş Decimal | |
| T15 | ClamAV fail-closed prod | |
| A4 | v1 tek tenant per kullanıcı | |
| A5 | UETS/KEP v1 dışı | |
| A6 | Otomatik gönderim yok | |
| A15 | Varsayılan şirket izolasyonu | |
| Hukuk 16 | Kanun maddesi şablona otomatik basılmaz | |

---

## 12. Sonraki adım

1. Bu belgelerdeki sorulara cevap verin.
2. “Faz 1’e geç” diye açık onay verin.
3. Onay cümlesi olmadan repository’ye uygulama iskeleti eklenmeyecektir.
