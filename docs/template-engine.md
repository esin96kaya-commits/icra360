# Şablon Motoru ve Öneri Kuralları

**İlgili belgeler:** [requirements.md](./requirements.md) · [workflows.md](./workflows.md) · [data-model.md](./data-model.md)

Sistem cevap metnini yazmaz. Onaylı DOCX şablonunu doldurur.

---

## 1. İlkeler

1. Şablon türleri kodda enum olarak kilitlenmez; kategori ve senaryo kayıttır.
2. Aktif şablon dosyası immutable’dır. Değişiklik = yeni `ResponseTemplateVersion`.
3. Eski cevap yazıları eski `templateVersionId` + `sha256` ile bağlı kalır.
4. Yapay zekâ şablon seçmez.
5. En fazla **üç** öneri; her birinde gerekçe ve uyarı.
6. Kullanıcı öneri dışını seçebilir; tenant ayarı gerekçe zorlayabilir.
7. Doğrulanmamış OCR, doğrulanmamış sıra veya eksik zorunlu değişken ile **nihai** DOCX/PDF üretilmez.
8. `referencedLegalProvisions` şablona otomatik map edilmez (hukuk riski).

---

## 2. DOCX sözdizimi

Çift süslü parantez. Koşullar Handlebars/Angular benzeri:

```
{{company.name}}

{{#if employee.isActive}}
Personelin iş sözleşmesi devam etmektedir.
{{/if}}

{{#if employee.hasTermination}}
Personelin iş sözleşmesi {{employee.employmentEndDate}} tarihinde sona ermiştir.
{{/if}}

{{#if employee.hasPreviousEnforcementCase}}
Personel hakkında devam eden başka bir icra kesintisi bulunmaktadır.
{{/if}}
```

Motor (öneri: docxtemplater + koşullu parser) şunları korumalıdır: paragraf stilleri, tablolar, sayfa düzeni, üst/alt bilgi, logolar, imza boşlukları.

POC kabulü: antetli örnekte logo + tablo + header/footer + `{{#if}}` kayıpsız. Aksi halde alternatif motor ([architecture.md](./architecture.md) T7).

Desteklenmeyen: şablon içinden HTTP, kod çalıştırma, harici entity. Anlaşılamayan etiket yüklemede hata.

---

## 3. Yükleme doğrulama boru hattı

1. Magic-byte: gerçek DOCX (ZIP+word XML), uzantı yetmez.
2. Zararlı tarama.
3. Makro / OLE / embedded executable reddi.
4. Değişken çıkarımı (paragraf, tablo, header, footer, text box).
5. Tanımsız değişken listesi (sözlükte yok).
6. Açılmamış / kapanmamış `if` tespiti.
7. Zorunlu değişkenlerin şablonda bulunması (şablon kaydındaki `requiredVariables`).
8. Örnek (sentetik) veriyle önizleme PDF/DOCX.
9. Onay olmadan `ACTIVE` olamaz.
10. Aktif dosya storage’da write-once; replace yok.

Tanımsız değişken: yükleme reddi veya “yalnızca uyarı” tenant politikası. **Öneri: reddet.** Aksi halde üretimde boş alan.

---

## 4. Düzenleme politikaları

| Politika | Anlam | Onay |
| --- | --- | --- |
| `LOCKED` | Sabit metin değişmez; yalnızca değişken değerleri | Normal onay (içerik değişmediyse bile gönderim öncesi) |
| `FIELDS_ONLY` | Şablonda işaretli manuel alanlar | Normal onay |
| `FULL_EDIT_WITH_APPROVAL` | Serbest metin | Ek onay zorunlu; diff audit |

LOCKED ihlali API’de `FORBIDDEN`. İstemci editörü salt okunur gösterir.

---

## 5. Değişken sözlüğü

Bütün tanımlayıcılar İngilizce. Format: TR tarih `DD.MM.YYYY`, para `1.234,56 ₺` (locale katmanı). Ham ISO değer snapshot’ta ayrıca durur.

### 5.1 Şirket

| Değişken | Kaynak önceliği | Zorunlu varsayılan | Not |
| --- | --- | --- | --- |
| `company.name` | MASTER_DATA | evet | legalName |
| `company.taxNumber` | MASTER_DATA | evet | |
| `company.address` | MASTER_DATA | hayır | |
| `company.phone` | MASTER_DATA | hayır | |
| `company.email` | MASTER_DATA | hayır | |

### 5.2 İşyeri

| Değişken | Kaynak | Zorunlu varsayılan |
| --- | --- | --- |
| `workplace.name` | MASTER_DATA | hayır |
| `workplace.address` | MASTER_DATA | hayır |
| `workplace.registrationNumber` | MASTER_DATA | hayır |

### 5.3 Personel

| Değişken | Kaynak | Zorunlu varsayılan | Not |
| --- | --- | --- | --- |
| `employee.fullName` | MASTER / USER_VERIFIED | senaryoya göre | |
| `employee.nationalId` | MASTER + `sensitive:read` | şablon belirler | Yazıda tam TCKN hukuk onayı |
| `employee.maskedNationalId` | türetilmiş | hayır | |
| `employee.employeeNumber` | MASTER | hayır | |
| `employee.jobTitle` | Employment | hayır | |
| `employee.employmentStartDate` | Employment | işten çıkış senaryosunda evet | |
| `employee.employmentEndDate` | Employment | işten çıkışta evet | |
| `employee.terminationCode` | Employment | hayır | |
| `employee.netSalary` | Employment/Salary + sensitive | hayır | Maskeli varsayılan |
| `employee.isActive` | boolean türetilmiş | — | koşul |
| `employee.hasTermination` | boolean | — | koşul |
| `employee.hasPreviousEnforcementCase` | boolean | — | koşul |

### 5.4 İcra dosyası

| Değişken | Kaynak | Zorunlu varsayılan |
| --- | --- | --- |
| `case.enforcementOffice` | USER_VERIFIED / VERIFIED_CASE | evet |
| `case.fileNumber` | aynı | evet |
| `case.serviceDate` | aynı | hayır |
| `case.receivedDate` | USER / MASTER | hayır |
| `case.responseDeadline` | USER / kural | hayır |
| `case.creditorName` | USER_VERIFIED | hayır |
| `case.creditorRepresentative` | USER_VERIFIED | hayır |
| `case.principalDebt` | USER_VERIFIED | hayır |
| `case.interest` | USER_VERIFIED | hayır |
| `case.expenses` | USER_VERIFIED | hayır |
| `case.totalDebt` | USER_VERIFIED | hayır |
| `case.currency` | USER_VERIFIED | evet (varsayılan TRY) |
| `case.requestedDeductionRate` | USER_VERIFIED | hayır |
| `case.requestedDeductionAmount` | USER_VERIFIED | hayır |
| `case.paymentBank` | USER_VERIFIED | hayır |
| `case.paymentIban` | USER_VERIFIED + sensitive | hayır |
| `case.queuePosition` | doğrulanmış sıra | sıra yazılarında evet |
| `case.activePreviousCaseCount` | türetilmiş | hayır |
| `case.deductionStartPeriod` | plan | kesinti başlama yazısında evet |

OCR_UNVERIFIED bu tabloya **girmez**.

### 5.5 Önceki dosya

Aktif kesintideki (veya doğrulanmış bir önceki sıradaki) dosya. Birden fazla ise şablon `previousCases` listesi ileride; v1 tek `previousCase` = sıra 1 veya kullanıcı seçimi.

| Değişken | Kaynak |
| --- | --- |
| `previousCase.enforcementOffice` | VERIFIED_CASE |
| `previousCase.fileNumber` | VERIFIED_CASE |
| `previousCase.creditorName` | VERIFIED_CASE |
| `previousCase.remainingDebt` | hesap / override |
| `previousCase.deductionStartDate` | VERIFIED_CASE |

### 5.6 Cevap

| Değişken | Kaynak |
| --- | --- |
| `response.date` | üretim anı, İstanbul takvim günü |
| `response.referenceNumber` | tenant sayaç (format U14) |
| `response.subject` | şablon varsayılan veya FIELDS_ONLY |
| `response.signatoryName` | şirket varsayılan / manuel |
| `response.signatoryTitle` | aynı |

### 5.7 Veri kaynağı önceliği (çözülmüş)

1. `USER_VERIFIED`
2. `MASTER_DATA` (personel, şirket, işyeri)
3. `VERIFIED_CASE`
4. `OCR_VERIFIED` (doğrulama ekranında onaylanmış; pratikte 1 ile birleşir)
5. `MANUAL_AT_GENERATION` (yetkili form; 1 olarak işaretlenir)

`OCR_UNVERIFIED` resmi yazıda yok.

Her üretimde `variableSnapshot` + `sourceSnapshot` JSON saklanır.

---

## 6. Öneri bağlamı

```ts
type TemplateRecommendationContext = {
  employmentStatus:
    | "ACTIVE"
    | "TERMINATED"
    | "NEVER_EMPLOYED"
    | "NOT_FOUND"
    | "AMBIGUOUS";
  activeEnforcementCaseCount: number;
  calculatedQueuePosition: number | null;
  deductionStatus: "NONE" | "WAITING" | "ACTIVE" | "COMPLETED";
  extractedDataVerified: boolean;
  queuePositionVerified: boolean;
};
```

`activeEnforcementCaseCount`: bu yeni dosya **hariç**, kesintisi devam eden veya doğrulanmış aktif haciz dosyaları. Tanım hukuk onayı ister (U8).

`calculatedQueuePosition`: kural seti önerisi; `null` belirsizlikte.

---

## 7. Öneri kuralları tablosu

Motor, aktif şablon versiyonlarının `recommendationMatcher` alanını bağlama göre filtreler, `priority` artan sırada en fazla üç sonuç döner. Aşağıdaki tablo **seed matcher** önerisidir; kod if-else’i değil.

| # | Koşul | Önerilen kod | Gerekçe (TR, UI) | Uyarılar | Öncelik |
| --- | --- | --- | --- | --- | --- |
| R1 | `AMBIGUOUS` | — | Öneri yok | Manuel personel seçimi zorunlu | — |
| R2 | `extractedDataVerified = false` | `MANUAL_INCOMPLETE_INFO_RESPONSE` (opsiyonel, düşük) | Veri doğrulanmadı | Nihai belge üretilemez | 90 |
| R3 | `NOT_FOUND` | `EMPLOYEE_NOT_FOUND_RESPONSE` | Personel kayıtta yok | TCKN/ad tekrar kontrol | 10 |
| R4 | `NEVER_EMPLOYED` | `NEVER_EMPLOYED_RESPONSE` | İşyerinde çalışmamış | Şirket/işyeri doğru mu | 10 |
| R5 | `TERMINATED` | `TERMINATION_RESPONSE` | İşten ayrılmış | Çıkış tarihi şablona girecek; sıra hesabı uygulanmaz | 10 |
| R6 | `ACTIVE` ve `activeEnforcementCaseCount = 0` | `DEDUCTION_START_RESPONSE` | Başka aktif icra yok | Sıra 1 önerisi doğrulanmalı | 10 |
| R7 | R6 ile birlikte | `QUEUE_FIRST_RESPONSE` | Birinci sıra kesinti | Çift öneri; kullanıcı seçer | 20 |
| R8 | `ACTIVE` ve `activeEnforcementCaseCount = 1` ve `calculatedQueuePosition = 2` | `QUEUE_SECOND_RESPONSE` | Bir öncelikli aktif dosya | Önceki dosya bilgisi zorunlu; sıra doğrula | 10 |
| R9 | R8 ile birlikte | `PREVIOUS_CASE_ONGOING_RESPONSE` | Önceki icra devam ediyor |  | 20 |
| R10 | `ACTIVE` ve `activeEnforcementCaseCount >= 2` | `QUEUE_THIRD_OR_LATER_RESPONSE` | Birden fazla öncelikli dosya | Hesaplanan sıra kullanıcı doğrulamalı | 10 |
| R11 | R10 ile birlikte | `QUEUE_GENERAL_RESPONSE` | Genel sıraya alma |  | 20 |
| R12 | `queuePositionVerified = false` (ACTIVE yolları) | öneriler durur, belge kilitli | — | Sıra doğrulanmadan nihai yazı yok | — |
| R13 | İstihdam aktif, kesinti bu ay yapılamıyor (ayrı görev) | `NO_DEDUCTION_THIS_MONTH_RESPONSE` | Kesinti yapılamayan ay | Neden kodu | olay tetikli |
| R14 | Ücretsiz izin | `UNPAID_LEAVE_RESPONSE` | Ücretsiz izin | İstihdam kaydı | olay tetikli |
| R15 | Kesinti varken `TERMINATED` | `TERMINATION_WHILE_DEDUCTING_RESPONSE` | İş ilişkisi kesinti sırasında bitti | Açık dosyalar listelenmeli | olay tetikli |
| R16 | `remainingDebt = 0` kapanış süreci | `DEBT_COMPLETED_RESPONSE` | Borç tamamlandı | Müdürlük teyidi hukuk | olay tetikli |
| R17 | `requestedAction` maaş bilgisi (doğrulanmış alan) | `SALARY_INFO_REQUEST_RESPONSE` | Bilgi talebi | Hassas alan yetkisi | 30 |
| R18 | `STILL_EMPLOYED_RESPONSE` | Aktif ve bilgi amaçlı | R6 ile çakışırsa öncelik düşük | 40 |

R1 ve R12 belge üretimini keser. R2 nihai üretimi keser; taslak render “filigranlı önizleme” olarak izin verilebilir (üretimde `DRAFT_WATERMARK`, indirme `response:download` ile bile PDF’de “ONAYSIZ TASLAK”).

**Farklı şablon seçimi:** her zaman mümkün (aktif + kapsam içi). `requireReasonIfNotRecommended` true ise `selectionReason` min 10 karakter.

---

## 8. Matcher JSON örneği

```json
{
  "employmentStatus": ["ACTIVE"],
  "activeEnforcementCaseCount": { "eq": 1 },
  "calculatedQueuePosition": { "eq": 2 },
  "extractedDataVerified": true
}
```

Yürütücü `eval` kullanmaz. Operatörler: `eq`, `gte`, `lte`, `in`, `exists`. Bilinmeyen operatör = matcher geçersiz, şablon öneriye girmez, platform log (PII’siz).

---

## 9. Şablon seçim ekranı veri paketi

Tek `GET /cases/:id/template-workspace` (veya mevcut GET’lerin kompozisyonu):

- Tebligat önizleme URL (signed)
- OCR alanları + güven bandı
- Personel durum kartı
- Mevcut icra listesi (aktif kesinti, bekleyen)
- Hesaplanan sıra + kural versiyonu + gerekçe metni
- Sıra doğrulama formu
- Önerilen ≤3
- Tüm uygun aktif şablonlar
- Eksik/doğrulanmamış alan listesi
- Seçili şablon önizleme
- Değişken tablosu: ad, değer (maskeli), kaynak, güven

---

## 10. Üretim ve versiyonlama

```
select template
  → lock case version
  → assert OCR verified
  → assert queue verified (ilgili senaryolar)
  → resolve variables + sources
  → assert required variables
  → render DOCX
  → convert PDF
  → hash both
  → insert ResponseDocumentVersion
  → audit
```

Yeniden üretim: `versionNumber++`, eski storage key silinmez (saklama politikasına kadar).

DOCX ve PDF içeriği aynı değişken setinden gelir; PDF ayrı şablon değildir. Kabul testi 13: seçilmiş alanlar her iki dosyada da birebir (format farkı: sayfa kırılımı hariç metin).

---

## 11. Prompt injection (şablon tarafı)

Değişken değerleri XML kaçışlı yazılır. OCR’dan gelen `}}` veya `{{#if` metin olarak kaçar, etiket olarak parse edilmez. Şablon yazarı değişkenleri yalnızca sözlükten seçer.

---

## 12. Hukuki sınır (tekrar)

Öneri tablosu İİK yorumu değildir. UI metni:

> “Bu öneri, yöneticinin tanımladığı kural setine göre üretilmiştir. Hukuki sıralama veya kesinti yükümlülüğü kararı değildir. Yetkili kullanıcı doğrulamadan cevap yazısı oluşturulamaz.”
