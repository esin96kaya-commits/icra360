# API Tasarımı

**İlgili belgeler:** [architecture.md](./architecture.md) · [data-model.md](./data-model.md) · [security.md](./security.md)

v1 HTTP API, `apps/web` Route Handler’larıdır. Dış genel API yoktur. Bütün istekler oturum çerezi ile kimliklendirilir.

---

## 1. Ortak kurallar

| Kural | Değer |
| --- | --- |
| Base | `/api/v1` |
| Auth | Auth.js session cookie |
| Tenant | Oturumdaki `tenantId`; gövde/query ile override yok |
| Gövde | JSON; dosya yükleme `multipart/form-data` |
| Doğrulama | `packages/contracts` Zod |
| Tarih girdileri | ISO-8601; tarih-only `YYYY-MM-DD` |
| Para girdileri | string decimal `"1234.56"` (float yok) |
| Listeler | `page`, `pageSize` (max 100), `sort`, filtreler |
| Liste çıktısı | `{ items, page, pageSize, total }` |
| Hata | `{ code, message }` — `message` kullanıcıya güvenli Türkçe; teknik ayrıntı yok |
| Idempotency | Mutating import ve job tetiklerinde `Idempotency-Key` |
| Rate limit | IP+user; login ve export daha sıkı |
| CSRF | SameSite + origin kontrolü; mutating isteklerde Auth.js |

Yetkisiz: `401`. Yasak: `403` (aynı genel mesaj: “Bu işlem için yetkiniz yok”). Bulunamadı ve başkasının kaydı: `404` (IDOR sızıntısı olmasın). Çakışma: `409` (`version`). Doğrulama: `422` + alan hataları (hassas değer yok).

---

## 2. Hata kodları

`AUTH_REQUIRED`, `FORBIDDEN`, `NOT_FOUND`, `VALIDATION_FAILED`, `CONFLICT`, `UNSUPPORTED_MEDIA`, `MALWARE_REJECTED`, `DUPLICATE_FILE`, `OCR_UNVERIFIED`, `QUEUE_UNVERIFIED`, `MISSING_VARIABLE`, `TEMPLATE_NOT_ACTIVE`, `PERIOD_LOCKED`, `CROSS_TENANT`, `RATE_LIMITED`, `UNTRUSTED_CONTENT`.

---

## 3. Endpoint listesi

İzin kolonları [requirements.md](./requirements.md) matrisindeki kodlardır.

### 3.1 Kimlik

| Metod | Yol | İzin | Açıklama |
| --- | --- | --- | --- |
| POST | `/api/v1/auth/login` | public | E-posta/parola; rate limit; başarısız audit |
| POST | `/api/v1/auth/logout` | session | Oturum sil |
| GET | `/api/v1/auth/me` | session | Kullanıcı, roller, izinler, maskeleme bayrağı |
| POST | `/api/v1/auth/password/change` | session | Parola değiştir |
| POST | `/api/v1/auth/mfa/setup` | session | TOTP gizli anahtar (Faz 6) |
| POST | `/api/v1/auth/mfa/enable` | session | TOTP doğrula |

### 3.2 Organizasyon

| Metod | Yol | İzin |
| --- | --- | --- |
| GET | `/api/v1/tenant` | `tenant:settings:read` |
| PATCH | `/api/v1/tenant` | `tenant:settings:write` |
| GET | `/api/v1/companies` | `company:read` |
| POST | `/api/v1/companies` | `company:write` |
| GET | `/api/v1/companies/:id` | `company:read` |
| PATCH | `/api/v1/companies/:id` | `company:write` |
| GET | `/api/v1/workplaces` | `workplace:read` |
| POST | `/api/v1/workplaces` | `workplace:write` |
| PATCH | `/api/v1/workplaces/:id` | `workplace:write` |

### 3.3 Kullanıcı ve RBAC

| Metod | Yol | İzin |
| --- | --- | --- |
| GET | `/api/v1/users` | `user:read` |
| POST | `/api/v1/users` | `user:write` |
| PATCH | `/api/v1/users/:id` | `user:write` |
| POST | `/api/v1/users/:id/disable` | `user:write` |
| GET | `/api/v1/roles` | `role:read` |
| POST | `/api/v1/roles` | `role:write` |
| PUT | `/api/v1/roles/:id/permissions` | `role:write` |
| PUT | `/api/v1/users/:id/roles` | `user:write` |
| GET | `/api/v1/permissions` | `role:read` |

### 3.4 Personel

| Metod | Yol | İzin |
| --- | --- | --- |
| GET | `/api/v1/employees` | `employee:read` |
| POST | `/api/v1/employees` | `employee:write` |
| GET | `/api/v1/employees/:id` | `employee:read` |
| PATCH | `/api/v1/employees/:id` | `employee:write` |
| GET | `/api/v1/employees/:id/enforcement-summary` | `case:read` |
| POST | `/api/v1/employees/import` | `employee:import` |
| GET | `/api/v1/imports/:id` | ilgili write/import |

Özet DTO: istihdam durumu, giriş/çıkış, çıkış kodu, işyeri, unvan, net ücret (maskeli olabilir), aktif/bekleyen/kapanmış icra sayıları, önerilen sıra.

### 3.5 Tebligat, OCR, eşleştirme

| Metod | Yol | İzin | Not |
| --- | --- | --- | --- |
| POST | `/api/v1/notices` | `notice:upload` | multipart; job tetikler |
| GET | `/api/v1/notices` | `notice:read` | |
| GET | `/api/v1/notices/:id` | `notice:read` | |
| GET | `/api/v1/notices/:id/file` | `notice:read` | kısa süreli signed URL; audit |
| GET | `/api/v1/notices/:id/pages/:n/image` | `notice:read` | signed URL |
| GET | `/api/v1/notices/:id/extraction` | `ocr:verify` veya `notice:read` | |
| PATCH | `/api/v1/notices/:id/fields/:fieldId` | `ocr:verify` | değer + verified |
| POST | `/api/v1/notices/:id/verify` | `ocr:verify` | tüm zorunlu alanlar |
| GET | `/api/v1/notices/:id/match-candidates` | `employee:read` | |
| POST | `/api/v1/notices/:id/match` | `case:create` | tek aday veya manuel seçim |
| POST | `/api/v1/notices/:id/mark-not-found` | `case:create` | NEVER_EMPLOYED / NOT_FOUND |

### 3.6 İcra dosyası ve sıra

| Metod | Yol | İzin |
| --- | --- | --- |
| GET | `/api/v1/cases` | `case:read` |
| POST | `/api/v1/cases` | `case:create` |
| GET | `/api/v1/cases/:id` | `case:read` |
| PATCH | `/api/v1/cases/:id` | `case:write` |
| GET | `/api/v1/cases/:id/history` | `case:read` |
| GET | `/api/v1/cases/:id/queue-proposal` | `case:queue:propose` |
| POST | `/api/v1/cases/:id/queue/verify` | `case:queue:verify` |
| POST | `/api/v1/cases/:id/queue/change` | `case:queue:verify` |
| POST | `/api/v1/cases/:id/manual-review` | `case:write` |
| POST | `/api/v1/cases/:id/close` | `case:write` + onay politikası |
| POST | `/api/v1/cases/:id/remaining-debt/override` | `deduction:write` |

`queue/change` gövdesi: `{ position, reason, version }`. `reason` zorunlu.

### 3.7 Şablon

| Metod | Yol | İzin |
| --- | --- | --- |
| GET | `/api/v1/template-categories` | `template:read` |
| POST | `/api/v1/template-categories` | `template:upload` |
| GET | `/api/v1/templates` | `template:read` |
| POST | `/api/v1/templates` | `template:upload` |
| GET | `/api/v1/templates/:id` | `template:read` |
| POST | `/api/v1/templates/:id/versions` | `template:upload` |
| GET | `/api/v1/templates/:id/versions` | `template:read` |
| POST | `/api/v1/templates/:id/versions/:vid/preview` | `template:read` |
| POST | `/api/v1/templates/:id/versions/:vid/submit` | `template:upload` |
| POST | `/api/v1/templates/:id/versions/:vid/activate` | `template:activate` |
| POST | `/api/v1/templates/:id/deactivate` | `template:activate` |
| GET | `/api/v1/templates/:id/file` | `template:read` | signed URL |

### 3.8 Şablon önerisi ve cevap yazısı

| Metod | Yol | İzin |
| --- | --- | --- |
| GET | `/api/v1/cases/:id/template-recommendations` | `response:create` |
| GET | `/api/v1/cases/:id/templates` | `template:read` |
| POST | `/api/v1/cases/:id/responses` | `response:create` |
| GET | `/api/v1/cases/:id/responses` | `response:create` veya `read` |
| GET | `/api/v1/responses/:id` | ilgili |
| PATCH | `/api/v1/responses/:id` | `response:edit` |
| POST | `/api/v1/responses/:id/render` | `response:create` |
| GET | `/api/v1/responses/:id/preview` | `response:create` |
| POST | `/api/v1/responses/:id/submit-approval` | `response:create` |
| POST | `/api/v1/responses/:id/approve` | `response:approve` |
| POST | `/api/v1/responses/:id/reject` | `response:approve` |
| GET | `/api/v1/responses/:id/docx` | `response:download` |
| GET | `/api/v1/responses/:id/pdf` | `response:download` |
| POST | `/api/v1/responses/:id/dispatch` | `dispatch:write` |
| GET | `/api/v1/approvals` | `response:approve` |

`POST .../responses` gövdesi: `{ templateVersionId, selectionReason? }`. Tenant ayarı `requireReasonIfNotRecommended` ise öneri dışı seçimde `selectionReason` zorunlu.

Nihai render reddi: `OCR_UNVERIFIED`, `QUEUE_UNVERIFIED`, `MISSING_VARIABLE`.

### 3.9 Kesinti, bordro, ödeme

| Metod | Yol | İzin |
| --- | --- | --- |
| GET | `/api/v1/cases/:id/deduction-plan` | `deduction:plan:write` veya `case:read` |
| PUT | `/api/v1/cases/:id/deduction-plan` | `deduction:plan:write` |
| GET | `/api/v1/payroll-periods` | `deduction:write` veya `report:read` |
| POST | `/api/v1/payroll-periods` | `payroll:lock` oluşturma ayrı izin olabilir |
| POST | `/api/v1/payroll-periods/:id/lock` | `payroll:lock` |
| POST | `/api/v1/payroll-periods/:id/unlock` | `payroll:unlock` |
| POST | `/api/v1/payroll-periods/:id/salaries/import` | `employee:import` / payroll import |
| GET | `/api/v1/cases/:id/deductions` | `deduction:write` veya read |
| POST | `/api/v1/cases/:id/deductions` | `deduction:write` |
| PATCH | `/api/v1/deductions/:id` | `deduction:write` |
| POST | `/api/v1/deductions/import` | `deduction:write` |
| GET | `/api/v1/cases/:id/payments` | `payment:write` veya read |
| POST | `/api/v1/cases/:id/payments` | `payment:write` |
| GET | `/api/v1/deductions/export` | `report:export` |

Kilitli dönemde PATCH: yalnızca `payroll:unlock` sonrası veya ayrı `adjustment` + gerekçe (yetkili düzeltme). Yetkisiz: `PERIOD_LOCKED`.

### 3.10 Görev, bildirim, rapor, audit

| Metod | Yol | İzin |
| --- | --- | --- |
| GET | `/api/v1/tasks` | `task:read` |
| PATCH | `/api/v1/tasks/:id` | `task:write` |
| GET | `/api/v1/notifications` | `notification:read` |
| POST | `/api/v1/notifications/:id/read` | `notification:read` |
| GET | `/api/v1/reports/:slug` | `report:read` |
| POST | `/api/v1/reports/:slug/export` | `report:export` |
| GET | `/api/v1/audit` | `audit:read` |
| GET | `/api/v1/rulesets` | `ruleset:read` |
| POST | `/api/v1/rulesets/:id/versions` | `ruleset:write` |
| GET | `/api/v1/retention-policies` | `retention:write` veya admin read |
| PUT | `/api/v1/retention-policies` | `retention:write` |

Rapor `slug` değerleri: `active-cases`, `queued-cases`, `employee-summary`, `workplace-summary`, `enforcement-office`, `expected-deductions`, `actual-deductions`, `deduction-variance`, `remaining-debt`, `upcoming-deadlines`, `overdue`, `terminated-open`, `closed-cases`, `template-usage`, `pending-dispatch`, `audit`.

### 3.11 Platform (ayrı router, ayrı host önerilir)

| Metod | Yol | İzin |
| --- | --- | --- |
| GET/POST | `/api/v1/platform/tenants` | platform |
| POST | `/api/v1/platform/tenants/:id/suspend` | platform |
| POST | `/api/v1/platform/break-glass` | platform + MFA + gerekçe |

Break-glass her zaman audit.

---

## 4. Örnek sözleşmeler

### 4.1 Extraction DTO (LLM/adapter çıktısı ile aynı şekil)

Adapter bu şema dışı alanı **sessizce düşürür**; ek anahtar kabul edilmez.

```ts
import { z } from "zod";

export const extractedDocumentSchema = z.object({
  documentType: z.string(),
  enforcementOffice: z.string(),
  caseNumber: z.string(),
  serviceDate: z.string().nullable(),
  receivedDate: z.string().nullable(),
  debtor: z.object({
    fullName: z.string(),
    nationalId: z.string(),
  }),
  creditor: z.object({
    nameOrTitle: z.string(),
    representative: z.string(),
  }),
  amounts: z.object({
    principal: z.string().nullable(),
    interest: z.string().nullable(),
    expenses: z.string().nullable(),
    total: z.string().nullable(),
    currency: z.literal("TRY").or(z.string()),
  }),
  requestedDeduction: z.object({
    rate: z.string().nullable(),
    amount: z.string().nullable(),
  }),
  paymentAccount: z.object({
    bankName: z.string(),
    iban: z.string(),
  }),
  requestedAction: z.string(),
  responseDeadlineText: z.string(),
  referencedLegalProvisions: z.array(z.string()),
  warnings: z.array(z.string()),
  fields: z.array(
    z.object({
      name: z.string(),
      value: z.string(),
      confidence: z.number().min(0).max(1),
      sourcePage: z.number().int().positive(),
      sourceExcerpt: z.string().max(500),
    }),
  ),
}).strict();
```

TCKN ve IBAN bu DTO’da kısa ömürlüdür; loglanmaz; doğrulama sonrası HMAC/şifre ile saklanır.

### 4.2 Template recommendation

```ts
export const templateRecommendationContextSchema = z.object({
  employmentStatus: z.enum([
    "ACTIVE",
    "TERMINATED",
    "NEVER_EMPLOYED",
    "NOT_FOUND",
    "AMBIGUOUS",
  ]),
  activeEnforcementCaseCount: z.number().int().nonnegative(),
  calculatedQueuePosition: z.number().int().positive().nullable(),
  deductionStatus: z.enum(["NONE", "WAITING", "ACTIVE", "COMPLETED"]),
  extractedDataVerified: z.boolean(),
  queuePositionVerified: z.boolean(),
});

export const templateRecommendationSchema = z.object({
  templateId: z.string().uuid(),
  templateVersionId: z.string().uuid(),
  templateCode: z.string(),
  reason: z.string(),
  warnings: z.array(z.string()),
  priority: z.number().int(),
});
```

### 4.3 Deduction write

```ts
export const deductionCreateSchema = z.object({
  periodId: z.string().uuid(),
  expectedAmount: z.string().regex(/^\d+(\.\d{1,4})?$/),
  actualAmount: z.string().regex(/^\d+(\.\d{1,4})?$/).nullable(),
  skipReason: z.string().max(500).nullable(),
  version: z.number().int(),
});
```

---

## 5. Dosya erişimi

Tarayıcı object storage’a doğrudan gitmez.

1. Yetki kontrolü
2. Audit (`document.view` / `document.download`)
3. 60–300 sn signed GET
4. Content-Disposition: `attachment` indirmede; önizlemede PDF için kısıtlı inline

---

## 6. Job durumu

Uzun işlemler `{ jobId, status }` döner. `GET /api/v1/jobs/:id` yalnızca aynı tenant ve tetikleyen/yetkili kullanıcı. Payload’da PII yok.

---

## 7. Versiyonlama

Kırıcı değişiklik: `/api/v2`. v1 web BFF iç kullanım; harici tüketici yokken bile sözleşmeler `packages/contracts` içinde semver’lenir.
