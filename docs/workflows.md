# İş Akışları ve Durum Geçişleri

**İlgili belgeler:** [requirements.md](./requirements.md) · [template-engine.md](./template-engine.md) · [data-model.md](./data-model.md)

Bu belgedeki hesaplar **öneridir**. Ekranda kesin hukuki karar gibi gösterilmez.

---

## 1. Ana iş akışı (tebligattan gönderim kaydına)

```mermaid
flowchart TD
  A[Tebligat PDF/görsel yükle] --> B{MIME, boyut, hash, virüs}
  B -->|red| Z1[Reddet ve audit]
  B -->|ok| C[Nesne depolama]
  C --> D{Metin PDF mi?}
  D -->|evet| E[Metin çıkar]
  D -->|hayır| F[OCR adapter]
  E --> G[Sayfa metni + güven kaydı]
  F --> G
  G --> H[Şema ile alan çıkarımı]
  H --> I[Prompt sanitizasyonu]
  I --> J[OCR doğrulama görevi]
  J --> K{Kullanıcı doğruladı mı?}
  K -->|hayır| J
  K -->|evet| L[Personel eşleştirme]
  L --> M{Aday sayısı}
  M -->|0| N[NOT_FOUND / NEVER_EMPLOYED]
  M -->|1 TCKN güvenli| O[Eşleşmeyi öner, kullanıcı onaylar]
  M -->|1'den çok| P[AMBIGUOUS — manuel seçim]
  P --> Q[Kullanıcı seçer]
  O --> R[İstihdam ve icra özeti]
  Q --> R
  N --> S[Dosya aç / manuel inceleme]
  R --> T[Sıra kural seti önerisi]
  T --> U{Sıra doğrulandı mı?}
  U -->|hayır| U1[Doğrulama görevi]
  U1 --> U
  U -->|evet| V[Şablon öneri motoru ≤3]
  S --> V
  V --> W[Kullanıcı şablon seçer]
  W --> X[Değişken çözümü + snapshot]
  X --> Y{Zorunlu alanlar ve doğrulamalar}
  Y -->|eksik| W
  Y -->|tam| AA[DOCX doldur]
  AA --> AB[PDF üret]
  AB --> AC[Önizleme]
  AC --> AD{Düzenleme politikası}
  AD -->|LOCKED / FIELDS_ONLY| AE[Onaya gönder]
  AD -->|FULL_EDIT| AF[Metin düzenle + ek onay]
  AF --> AE
  AE --> AG{Onay}
  AG -->|red| AC
  AG -->|onay| AH[Gönderim bilgisi kaydı]
  AH --> AI{Senaryo}
  AI -->|kesinti başlar| AJ[Plan + DEDUCTING]
  AI -->|sırada| AK[QUEUED]
  AI -->|işten çıkış| AL[EMPLOYEE_TERMINATED]
  AI -->|bulunamadı| AM[OPEN veya MANUAL_REVIEW]
```

Onaysız otomatik e-posta/KEP yok.

---

## 2. Senaryo haritası

```mermaid
flowchart TD
  Start[Doğrulanmış tebligat] --> Match{Personel}
  Match -->|belirsiz| Amb[Şablon önerme; manuel eşleşme]
  Match -->|yok| NF[EMPLOYEE_NOT_FOUND_RESPONSE]
  Match -->|hiç çalışmamış| NE[NEVER_EMPLOYED_RESPONSE]
  Match -->|işten ayrılmış| Term[TERMINATION_RESPONSE]
  Match -->|aktif| Q{Bu dosya hariç aktif icra}
  Q -->|0| S1[DEDUCTION_START + QUEUE_FIRST]
  Q -->|1| S2[QUEUE_SECOND + PREVIOUS_ONGOING]
  Q -->|2+| S3[QUEUE_THIRD_OR_LATER + QUEUE_GENERAL]
  S1 --> V[Sıra doğrulama]
  S2 --> V
  S3 --> V
  V --> User[Kullanıcı şablon seçer]
  Term --> User
  NF --> User
  NE --> User
```

---

## 3. İcra sırası ve kesinti akışı

```mermaid
flowchart TD
  New[Yeni doğrulanmış dosya] --> Pol[RuleSetVersion uygula]
  Pol --> Prop[Önerilen sıra + gerekçe + kural versiyonu]
  Prop --> Human{Yetkili doğruladı mı?}
  Human -->|değiştirdi| Rsn[Gerekçe zorunlu + audit]
  Rsn --> Pos[queuePosition kilit]
  Human -->|onay| Pos
  Pos --> Kind{Sıra}
  Kind -->|1 ve personel aktif| P1[Kesinti planı taslağı]
  P1 --> Letter1[Kesintiye başlama yazısı süreci]
  Letter1 --> Deduct[DEDUCTING]
  Kind -->|n > 1| Wait[QUEUED — kesinti yok]
  Wait --> LetterN[Sıra / sıraya alma yazısı]
  Deduct --> Month[Bordro dönemi açık]
  Month --> Exp[Beklenen kesinti hesapla]
  Exp --> Act{Gerçekleşen girildi mi?}
  Act -->|atlandı| Skip[skipReason + bildirim]
  Act -->|girildi| Apply[actualAmount Decimal]
  Apply --> Rem[Kalan borç güncelle]
  Skip --> Rem
  Rem --> Lock{Dönem kilit}
  Lock -->|yetkisiz değişiklik| Deny[PERIOD_LOCKED]
  Lock -->|yetkili düzeltme| Adj[adjustmentReason + audit]
  Rem --> Zero{Kalan <= 0?}
  Zero -->|hayır| Month
  Zero -->|evet| CloseAsk[Kapatma onayı iste]
  CloseAsk --> Closed[CLOSED + DEBT_COMPLETED yazısı isteğe bağlı]
  Closed --> Next{Sıradaki QUEUED var mı?}
  Next -->|evet| Task[NEXT_CASE_ACTIVATION görevi]
  Task --> Rec[DEDUCTION_START bildirimi öner]
  Rec --> Human2[Kullanıcı onaylar]
  Human2 --> Promote[Sıra yeniden öner / doğrula]
  Promote --> P1
  Deduct --> TermEvt[İşten ayrılma olayı]
  TermEvt --> TTask[TERMINATION_WHILE_DEDUCTING]
```

Sıra değişikliği her zaman audit. Doğrulanmamış sıra ile nihai yazı yok.

---

## 4. Kuyruk hesabı (v1 politika — hukuk onayı bekler)

Bu fonksiyon seed `RuleSetVersion` gövdesidir; İİK iddiası değildir.

**Girdi:** personelin aynı şirketteki dosyaları (varsayılan şirket kapsamı).

**Aday “aktif öncelik”:** durum `DEDUCTING` veya `DEDUCTION_TO_START`; `CLOSED` / `DEBT_COMPLETED` / `EMPLOYEE_TERMINATED` hariç.

**Öneri:**

```
proposedPosition = count(activePriorityCases) + 1
```

Sıralama anahtarı (belirsiz, U1 hukuk): `receivedDate ASC`, eşitlikte `createdAt ASC`. Nafaka/kamu istisnası **kapalı** bayrak.

**Çıktı:** `{ proposedPosition, activeCaseIds, ruleSetVersionId, explanation }`.

`explanation` örneği: “Doğrulanmış 1 aktif kesinti dosyası var; yeni dosya 2. sıra olarak önerildi (kural v3).”

Personel `TERMINATED` / `NOT_FOUND` / `NEVER_EMPLOYED` ise `calculatedQueuePosition = null`.

---

## 5. Üç durum makinesi

Ürün listesindeki tek “dosya durumu” UI aşamasına map edilir.

### 5.1 ServiceDocument

```mermaid
stateDiagram-v2
  [*] --> UPLOADED
  UPLOADED --> SCANNING
  SCANNING --> SCAN_FAILED
  SCANNING --> TEXT_EXTRACTING: metin PDF
  SCANNING --> OCR_PENDING: tarama/görsel
  SCAN_FAILED --> SCANNING: yeniden
  TEXT_EXTRACTING --> EXTRACTION_PENDING
  OCR_PENDING --> OCR_FAILED
  OCR_PENDING --> EXTRACTION_PENDING
  OCR_FAILED --> OCR_PENDING: yeniden
  EXTRACTION_PENDING --> VALIDATION_PENDING
  VALIDATION_PENDING --> VERIFIED
  VALIDATION_PENDING --> REJECTED
  REJECTED --> [*]
  VERIFIED --> [*]
```

### 5.2 EnforcementCase

```mermaid
stateDiagram-v2
  [*] --> OPEN
  OPEN --> AWAITING_MATCH
  AWAITING_MATCH --> AWAITING_QUEUE_VERIFICATION: eşleşti ve aktif
  AWAITING_MATCH --> EMPLOYEE_TERMINATED: çıkış
  AWAITING_MATCH --> MANUAL_REVIEW: bulunamadı/belirsiz süre
  AWAITING_QUEUE_VERIFICATION --> AWAITING_TEMPLATE
  AWAITING_TEMPLATE --> QUEUED: sıra > 1 ve yazı onaylandı
  AWAITING_TEMPLATE --> DEDUCTION_TO_START: sıra 1
  DEDUCTION_TO_START --> DEDUCTING: plan + dönem
  QUEUED --> DEDUCTION_TO_START: önceki kapandı ve doğrulandı
  DEDUCTING --> DEBT_COMPLETED
  DEDUCTING --> EMPLOYEE_TERMINATED
  DEDUCTING --> MANUAL_REVIEW
  DEBT_COMPLETED --> CLOSED
  EMPLOYEE_TERMINATED --> CLOSED: dosya kapanış politikası
  MANUAL_REVIEW --> AWAITING_QUEUE_VERIFICATION
  MANUAL_REVIEW --> AWAITING_TEMPLATE
  CLOSED --> [*]
```

Geçişler domain’de tablo; rastgele `PATCH status` yok.

### 5.3 ResponseDocument

```mermaid
stateDiagram-v2
  [*] --> DRAFT
  DRAFT --> AWAITING_APPROVAL
  AWAITING_APPROVAL --> APPROVED
  AWAITING_APPROVAL --> REJECTED
  REJECTED --> DRAFT
  APPROVED --> DISPATCH_RECORDED
  DRAFT --> SUPERSEDED: yeni versiyon/şablon
  APPROVED --> SUPERSEDED: yeniden üretim
```

Nihai indirme: `APPROVED` veya `DISPATCH_RECORDED`. Taslak indirme filigranlı ve ayrı izin.

---

## 6. Ürün durumu → dahili durum eşlemesi

| Ürün etiketi (TR) | Asıl kaynak |
| --- | --- |
| Yeni tebligat | Document `UPLOADED` |
| OCR bekliyor | Document `OCR_PENDING` / `TEXT_EXTRACTING` |
| Veri doğrulama bekliyor | Document `VALIDATION_PENDING` |
| Personel eşleştirme bekliyor | Case `AWAITING_MATCH` |
| Şablon seçimi bekliyor | Case `AWAITING_TEMPLATE` |
| Cevap yazısı hazırlanıyor | Response `DRAFT` |
| Onay bekliyor | Response `AWAITING_APPROVAL` |
| Gönderim bekliyor | Response `APPROVED` ve dispatch yok |
| Kesinti başlayacak | Case `DEDUCTION_TO_START` |
| Kesinti devam ediyor | Case `DEDUCTING` |
| Sırada bekliyor | Case `QUEUED` |
| Personel işten ayrılmış | Case `EMPLOYEE_TERMINATED` |
| Borç tamamlandı | Case `DEBT_COMPLETED` |
| Dosya kapandı | Case `CLOSED` |
| Manuel incelemede | Case `MANUAL_REVIEW` |

Dashboard ve liste “aşama” bu eşlemeden türetilir.

---

## 7. Geçiş korumaları

| Geçiş | Koruma |
| --- | --- |
| Document → VERIFIED | Zorunlu alanlar verified; düşük güven ya onaylı ya boş bırakılıp manuel |
| Match otomatik | Tek aday **ve** TCKN HMAC eşleşmesi **ve** OCR TCKN verified |
| Case → AWAITING_TEMPLATE | Personel çözüldü (veya NOT_FOUND yolu) |
| Nihai render | Document VERIFIED; ilgiliyse `queueVerified`; required variables |
| Case → DEDUCTING | Onaylı cevap (tenant politikası) + plan + sıra 1 |
| Case → CLOSED | Kullanıcı onayı; remainingDebt 0 veya gerekçeli istisna |
| QUEUED → DEDUCTION_TO_START | Önceki CLOSED; yeni sıra doğrulaması; görev kapanışı |
| Period lock | `payroll:lock`; unlock ayrı izin |
| Kilitli dönem satır düzeltme | unlock veya yetkili adjustment + reason |

---

## 8. Görev üretimi

| Tetik | TaskType | Süre |
| --- | --- | --- |
| Çıkarım bitti | `OCR_VALIDATION` | hemen |
| Doğrulandı, eşleşme yok/çok | `EMPLOYEE_MATCHING` | hemen |
| Eşleşme aktif personel | `QUEUE_VERIFICATION` | hemen |
| Sıra doğrulandı | `TEMPLATE_SELECTION` | hemen |
| Render + politika | `RESPONSE_APPROVAL` | hemen |
| Cevap onaylandı | `DISPATCH_RECORDING` | hemen |
| `responseDeadline` - N gün | `RESPONSE_DEADLINE` | SLA tarayıcı |
| Dönem kapanmadan kesinti yok | `MISSING_DEDUCTION` | SLA |
| `variance != 0` | `VARIANCE_REVIEW` | eşik tenant ayarı |
| remainingDebt ≤ eşik | `DEBT_NEAR_ZERO` | |
| remainingDebt = 0 | `DEBT_COMPLETED` | |
| Case CLOSED + next queued | `NEXT_CASE_ACTIVATION` | transaction içi |
| Employment endDate + DEDUCTING | `TERMINATION_WHILE_DEDUCTING` | |

Bildirim: in-app zorunlu; e-posta/SMS adapter tenant ayarı.

---

## 9. Kesinti matematiği

```
expected = method == RATE
  ? round(garnishmentBase * rate, 2, HALF_UP)
  : fixedAmount

variance = actual - expected
totalDeducted += actual
remaining = override ?? max(totalDebt - totalDeducted - payments, 0)
```

`number` yok. `garnishmentBase` yoksa net ücret **otomatik kullanılmaz**; kullanıcı veya import doldurur (U9).

Idempotent import: `importKey` unique. Aynı dosya tekrar: success=0, duplicate sayacı, yeni kesinti yok.

---

## 10. Dosya kapanınca sıradaki

Tek transaction:

1. Case A → `DEBT_COMPLETED` / `CLOSED`
2. Audit
3. Personelin `QUEUED` dosyalarını `position ASC` oku
4. B için `NEXT_CASE_ACTIVATION` (yoksa oluştur — idempotent)
5. Bildirim
6. Şablon önerisi hesaplanır ama **otomatik seçilmez, otomatik kesinti başlamaz**

---

## 11. UI notları (akışa bağlı)

- OCR: belge sol, alanlar sağ; seçilen alan `sourcePage` + excerpt highlight.
- Tarih: `DD.MM.YYYY` (İstanbul).
- Para: `tr-TR`.
- TCKN/IBAN maskeli; `sensitive:read` + açık göster tıklaması audit.
- Kritik süre, eksik veri, gecikme rozetleri listelerde zorunlu.
