# Gereksinim Analizi

**Ürün:** İcra360 — Personel İcra Takip ve Cevap Yazısı Sistemi  
**Slogan:** Personel icra süreçleri tek yerde.  
**Kapsam:** Türkiye’deki işverenler, insan kaynakları ve bordro birimleri  
**Belge durumu:** Taslak — uygulama kodu yazılmadan önce onay bekler  
**Dil kuralı:** Arayüz Türkçe, kod ve tanımlayıcılar İngilizce

Bu belge, sözlü/yazılı ürün tanımını analiz eder; çelişkileri, hukuki doğrulama noktalarını, yetki matrisini ve kabul sınırlarını kaydeder. Mimari, veri modeli, API, şablon motoru, iş akışları, güvenlik ve faz planı ayrı belgelerdedir.

---

## 1. Problemin yeniden ifadesi

İşveren, icra müdürlüğünden personeline ilişkin tebligat aldığında şu işi bugün çoğu yerde e-posta, klasör ve Word kopyala-yapıştır ile yürütüyor:

1. Tebligatı okumak
2. Kişiyi bordro/İK kaydıyla eşleştirmek
3. İşten ayrılmış mı, aktif mi bakmak
4. Aynı personelin başka icra dosyası var mı bakmak
5. Yeni dosyanın kesintiye girip girmeyeceğini veya kaçıncı sırada bekleyeceğini tahmin etmek
6. Daha önce kullanılan bir cevap yazısı şablonunu doldurmak
7. Yazıyı göndermek
8. Aylık kesintiyi, ödemeyi ve kalan borcu takip etmek
9. Bir dosya bitince sıradakine geçmek

Ürün bu süreci **çok şirketli (multi-tenant)**, denetlenebilir ve şablon-temelli hale getirecek.

**Kritik ürün kararı:** Sistem hukuk metni üretmez. Cevap yazısının cümleleri yönetici tarafından yüklenen onaylı DOCX şablonlarından gelir. Sistem veri çıkarır, durum belirler, sıra **önerir**, şablon **önerir**, değişken doldurur. Nihai şablon seçimi, sıra doğrulaması, belge onayı ve gönderim kararı yetkili kullanıcıdadır. Onaysız gönderim yoktur.

Bu karar doğrudur. LLM ile sıfırdan icra cevabı yazmak hem halüsinasyon hem de işveren sorumluluğu riski taşır.

---

## 2. Varsayımlar

Aşağıdakiler ürün tanımından çıkarılmış, henüz teyit edilmemiş varsayımlardır. Onaylanmazlarsa şema ve API değişir.

| ID | Varsayım | Etki |
| --- | --- | --- |
| A1 | **Tenant** = müşteri organizasyonu (SaaS müşterisi). **Company** = o organizasyon içindeki tüzel kişilik / işveren. Bir tenant’ta birden fazla şirket olabilir. | Veri modeli, yetki, raporlar |
| A2 | İcra tebligatına cevap veren taraf **tüzel kişilik (Company)** tir, holding veya tenant değil. | Cevap yazısı değişkenleri, imza yetkisi |
| A3 | Platform süper yöneticisi tenant dışındadır; “Sistem yöneticisi” rolü tenant içi yöneticiden ayrıdır. | Auth, RBAC |
| A4 | Kullanıcı varsayılan olarak **tek tenant** üyesidir. Çok tenant’lı kullanıcı (muhasebe müşaviri) Faz 6’ya bırakılabilir. | Oturum, tenant seçici |
| A5 | Gelen tebligat kanalı v1’de **manuel yükleme**dir (PDF/görsel). UETS/e-tebligat ve KEP entegrasyonu v1 kapsamı dışıdır. | Modül 5, gönderim |
| A6 | Sistem yazıyı e-posta/KEP ile **otomatik göndermez**; gönderim bilgisi kullanıcı tarafından kaydedilir. Adapter arayüzü şimdiden durur. | Dispatch, bildirim |
| A7 | Kuyruk (icra sırası) hesabı **yasal hüküm değil, yönetilebilir kural seti önerisidir**. | RuleSet, UI metinleri |
| A8 | Personel kimliği tenant içinde tek kayıttır; işe giriş/çıkış **Employment** ile tutulur. | Eşleştirme |
| A9 | Üçüncü taraf OCR/LLM **varsayılan kapalı**; yerel/metin çıkarımı varsayılan yoldur. | Provider, KVKK |
| A10 | Demo ve seed verisi gerçek kişilere ait değildir. | Seed, test |
| A11 | Para birimi varsayılan TRY, ölçek 2 ondalık (kuruş). Ara faiz hesabı v1’de yok; belgeden gelen tutarlar saklanır. | Decimal |
| A12 | Tarih/saat UTC saklanır, arayüz `Europe/Istanbul` (sabit UTC+3) gösterir. | Tarih katmanı |
| A13 | Şablon kategorileri ve senaryo kodları **veritabanında** tutulur; kod içine enum olarak gömülmez. Seed ile başlangıç seti yüklenir. | Template engine |
| A14 | Şirket içi işyeri izolasyonu varsayılan **kapalıdır** (aynı şirketin İK’sı tüm işyerlerini görür). İsteğe bağlı kapsam (workplace scope) yetki ile açılır. | RBAC |
| A15 | Aynı tenant içindeki şirketler birbirinin personelini **varsayılan görmez**; holding görünürlüğü ayrı izinle açılır. | Tenant ≠ şirket izolasyonu |

---

## 3. Kapsam

### 3.1 Kapsamda (hedef ürün)

- Çok tenant’lı web uygulaması
- Şirket, işyeri, kullanıcı, rol, izin
- Personel ve çalışma kayıtları
- Tebligat yükleme, MIME/boyut/hash, tekrar yükleme kontrolü
- Metin PDF çıkarımı + taranmış belge OCR (adapter)
- JSON Schema’ya bağlı alan çıkarımı
- OCR doğrulama, personel eşleştirme
- İcra dosyası, sıra önerisi, durum makinesi
- DOCX şablon, versiyon, öneri, seçim, doldurma, önizleme, onay
- DOCX + PDF çıktı, üzerine yazmama
- Kesinti planı, bordro dönemi, gerçekleşen kesinti, ödeme/dekont, kalan borç
- Dosya kapanınca sıradaki dosya için görev
- Görev, bildirim (in-app; e-posta/SMS adapter)
- Raporlar, audit, saklama politikası iskeleti
- XLSX/CSV içe-dışa aktarma
- Provider/adapter: OCR, çıkarım, depolama, virüs tarama, e-posta, SMS, PDF, muhasebe dışa aktarma

### 3.2 Bilinçli olarak v1 dışı bırakılanlar (öneri)

Bunlar ürün metninde geçse de ilk üretim sürümünü şişirir. Onayınızla kapsamına alınabilir.

| Konu | Gerekçe |
| --- | --- |
| UETS / e-Tebligat alımı | Ayrı entegrasyon, kurumsal kimlik, yasal geçerlilik |
| KEP ile otomatik gönderim | Maliyet, yasal delil, imza |
| Islak imza / e-imza / paraf akışı | Belge onayı ile karışmamalı |
| Faiz yeniden hesabı, icra masrafı tahakkuku | Hukuki hesap motoru; ürün bunu iddia etmemeli |
| Avukat portalı, icra müdürlüğü entegrasyonu | Kurumsal API yok/kısıtlı |
| Çalışan self-servis | İşveren uygulaması |
| Çok dilli arayüz | v1 yalnızca Türkçe |
| Çok tenant’lı tek kullanıcı (SMMM) | Oturum modeli karmaşıklaşır |
| Gerçek zamanlı işbirliği (aynı belgeyi iki kişi düzenleme) | Optimistic lock yeterli |
| Tam otomatik kesinti muhasebe fişi | Adapter arayüzü + manuel dışa aktarma yeterli |

---

## 4. Çelişkili, belirsiz veya riskli gereksinimler

Kod yazmadan önce bunların karara bağlanması gerekir. Tahminle uygulamaya geçilmemelidir.

### 4.1 Çelişkiler

| ID | Çelişki | Önerilen çözüm |
| --- | --- | --- |
| C1 | Tek bir “dosya durumu” listesi hem tebligat işleme (OCR bekliyor) hem icra yaşam döngüsünü (kesinti devam ediyor) hem belge sürecini (onay bekliyor) karıştırıyor. | **Üç ayrı durum makinesi:** `ServiceDocument`, `EnforcementCase`, `ResponseDocument`. UI’da türetilmiş “iş akışı aşaması” gösterilir. Ayrıntı: [workflows.md](./workflows.md) |
| C2 | Veri kaynağı önceliğinde 4. sıra “OCR ile çıkarılan veri”, aynı anda “doğrulanmamış OCR resmî yazıda kullanılmaz”. | OCR değeri ancak doğrulama ekranında onaylandıktan sonra “kullanıcı doğrulamalı değer”e yükselir. Doğrulanmamış alan snapshot’a ve şablona girmez. |
| C3 | Veri kaynağı 5. sıra “belge oluştururken girilen manuel değer”, 1. sıra “yetkili kullanıcının doğruladığı değer”. Üretim anındaki giriş hangisi? | Belge üretim formundaki yetkili giriş 1. sıradır ve snapshot’a `USER_VERIFIED` yazılır. |
| C4 | “Tenant kullanıcısı başka tenant’ı göremez” ile ayrı `Company` modeli. Aynı tenant’ta şirketler arası görünürlük belirsiz. | Varsayılan: şirket kapsamı zorunlu. Holding izni ayrı. A15. |
| C5 | Şablon türleri koda gömülmeyecek, fakat öneri kuralları senaryo isimleriyle tarif edilmiş. | Şablon kaydında `recommendationMatcher` JSON; motor yalnızca bu eşleşmeyi çalıştırır. Senaryo adları seed verisidir. |
| C6 | Sıra “hesaplanır” ve şablona yazılır; aynı anda “hukuki karar iddia edilmez”. | UI ve PDF’e giden etiketler “önerilen sıra (doğrulandı)” olur. Doğrulanmamış sırayla nihai belge üretilmez. |
| C7 | Sistem yönetici şablon yükler; roller listesinde ayrı “platform admin” yok. | `PLATFORM_SUPER_ADMIN` + tenant `TENANT_ADMIN`. |
| C8 | “Cevap gönderilmeyecek” ile e-posta/SMS adapter ve “gönderim bekliyor” durumu. | Gönderim = kullanıcının harici kanaldan gönderdiğini **kaydetmesi**. Otomatik iletim ayrı, kapalı özellik bayrağı. |
| C9 | KVKK silme/anonimleştirme ile audit ve icra belgesi saklama yükümlülüğü çatışır. | Saklama politikası: yasal saklama süresi bitmeden silinmez; süre dolunca anonimleştirme. Hukuk onayı şart. |
| C10 | Hassas alanlarda uygulama şifrelemesi ile bordro aggregate raporları. | TCKN ve IBAN şifreli + HMAC ile arama. Maaş/tutar `Decimal` olarak kalır; erişim `sensitive:read` ile. Tam kolon şifrelemesi raporları kırar. |
| C11 | LLM yapılandırılmış çıkarım istenir; kişisel veri üçüncü tarafa varsayılan gitmez. | Çıkarım adapter’ı: varsayılan `local_rules` (regex/heuristic). `llm` ve `cloud_ocr` ayrı config ve sözleşme onayı ister. |
| C12 | “En fazla üç şablon öner” ile “tüm uygun aktif şablonlar da listelensin”. | Öneri kutusu ≤3; tam liste ayrı. Kullanıcı önerilmeyeni seçebilir. |

### 4.2 Belirsizlikler (karar bekleyen)

| ID | Soru | Neden kritik |
| --- | --- | --- |
| U1 | Bir kullanıcı birden fazla tenant’ta çalışabilir mi? | Oturum, tenant switcher, audit |
| U2 | İşyeri bazlı yetki zorunlu mu? | RBAC kapsamı |
| U3 | Personel kaydı şirket bazlı mı, tenant bazlı kişi + employment mı? | Eşleştirme, mükerrer TCKN |
| U4 | Gelen tebligat hangi şirkete bağlanır? Yükleme anında mı, OCR sonrası mı? | Tenant içinde yanlış şirket |
| U5 | Cevap süresi belgeden mi okunur, yoksa kural setiyle mi hesaplanır? | Görev/SLA |
| U6 | Kesinti tavanı (ör. ücretin 1/4’ü, nafaka istisnası) sistemde uyarılacak mı, yoksa hiç hesaplanmayacak mı? | Hukuki iddia riski |
| U7 | Nafaka, kamu alacağı, rehinli alacak ayrı dosya türü mü? | Sıra kuralları |
| U8 | Aynı anda bir personelde birden fazla “aktif kesinti” yasal olarak mümkün mü, yoksa her zaman tek aktif mi? | Kuyruk modeli |
| U9 | Net ücret mi, kesintiye esas tutar mı belgedeki oranla çarpılır? Kim girer? | Para hesabı |
| U10 | Kalan borç = tebligattaki toplam − kesintiler mi? İcra müdürlüğünün bildirdiği bakiye mi esas? | Dosya kapanışı |
| U11 | Şablonlar platform havuzunda mı, her tenant kendi şablonunu mu yükler, yoksa ikisi birden mi? | İzolasyon, lisans |
| U12 | LOCKED şablonda önizleme sırasında tarih/sayı formatı kim belirler? | Locale, şablon vs sistem |
| U13 | Belge imza bloğu taranmış imza görseli mi, yoksa boş alan mı? | Şablon standardı |
| U14 | Referans numarası (`response.referenceNumber`) formatı nedir? | Benzersizlik |
| U15 | Virüs tarama yokken yükleme reddedilir mi (fail-closed) yoksa uyarı mı (fail-open)? | Güvenlik vs DX |
| U16 | MFA ilk sürümde zorunlu mu, yoksa yalnızca mimari hazırlık mı? | Auth kapsamı |
| U17 | Denetçi rolü maskeli TCKN/IBAN mı görür, yoksa `sensitive:read` ayrı mı verilir? | KVKK, iç denetim |
| U18 | Toplu personel aktarımında TCKN güncellemesi mevcut kaydı mı eşler? | Idempotency anahtarı |
| U19 | Rapor PDF’i kim oluşturur — sunucu mu, tarayıcı mı? | Worker yükü |
| U20 | “Manuel incelemede” durumu diğer kuyruklardan çıkarır mı, yoksa paralel mi? | Görev sistemi |

---

## 5. Hukuk uzmanı tarafından doğrulanması gereken noktalar

Sistem hukuk danışmanı değildir. Aşağıdaki konular **yazılım kararı değil**, hukuk/İK/bordro uzmanı kararıdır. Doğrulanmadan kural seti üretime alınmamalıdır.

1. **Ücret haczinde sıra:** İİK ve ilgili mevzuatta birden fazla haciz tesisi sırası; tebliğ tarihi mi, evrak kayıt tarihi mi, müdürlük talimatı mı esas?
2. **Öncelikli alacaklar:** Nafaka, kamu alacağı, rehin, işçilik alacağı gibi ayrımlar kuyruğu değiştirir mi?
3. **Kesinti tavanı:** Ücretin haczi kabil kısmı; nafakada istisna; birden fazla dosyada tavanın paylaşımı.
4. **İşten ayrılma sonrası yükümlülük:** İşveren yalnızca “işten çıktı” mı bildirir, yoksa son bordro, kıdem, SGK çıkış gibi ek bilgi zorunlu mu? Şablon metni hukukun onayladığı metin olmalıdır.
5. **Hiç çalışmamış kişi:** Yanlış tebligatta işverenin cevap yükümlülüğü ve süre.
6. **Cevap süresi:** Tebligat Kanunu / İİK süreleri; işverene ulaşma tarihi ile tebliğ tarihi farkı; sürenin iş günü/takvim günü oluşu.
7. **Kesintiye başlama dönemi:** Tebligatın geldiği ayın bordrosu mu, bir sonraki dönem mi?
8. **Dosya kapanışı:** Kalan borç sıfırlandı diye işveren dosyayı kapatabilir mi, yoksa aciz belgesi / müdürlük yazısı mı gerekir?
9. **Sıradaki dosyaya geçişte yeni bildirim:** İlk dosya bitince ikinci müdürlüğe kendiliğinden mi yazılır, talimat mı beklenir?
10. **KVKK hukuki sebep:** Çalışan borcu ve haciz verisi özel nitelikli veri değildir; ancak işleme şartı (hukuki yükümlülük, meşru menfaat) net yazılmalı. Çalışan onayı varsayılan dayanak **olmamalı** (güç dengesizliği).
11. **Saklama süreleri:** Ticari defter, tebligat, bordro, icra yazışması için yasal süreler; KVKK silme talebi ile çatışma.
12. **Yurt dışı işleme:** Cloud OCR/LLM kullanılıyorsa aktarım hukuki dayanağı, açık rıza, standart sözleşme maddeleri.
13. **Maskeleme vs tam TCKN:** Cevap yazısında TCKN’nin tam yazılması gerekip gerekmediği (şablonda `nationalId` vs `maskedNationalId`).
14. **İmza yetkisi:** Kim imzalar; vekâlet; kaşe.
15. **Sistem çıktısının delil değeri:** “Sistem hesapladı” ifadesinin dilekçede kullanılmaması; doğrulanmış kullanıcı kararı olarak sunulması.
16. **Kanun/madde referanslarının OCR’dan alınıp şablona basılması:** Yanlış madde işveren aleyhine delil olabilir. **Öneri:** OCR’dan çıkan mevzuat referansı yalnızca uyarı olarak gösterilir; şablona otomatik basılmaz. Şablondaki madde metni hukukun onayladığı sabit metindir.

Bu maddeler kapanmadan kural motoru “doğru sıra” üretiyormuş gibi pazarlanmamalıdır.

---

## 6. Aktörler ve roller

### 6.1 Platform aktörü

| Rol kodu | Ad | Kapsam |
| --- | --- | --- |
| `PLATFORM_SUPER_ADMIN` | Platform süper yöneticisi | Tenant oluşturma, platform şablon havuzu, global kural seti, sistem sağlığı. Müşteri personel/icra verisine günlük iş için girmez; break-glass ayrı audit’lenir. |

### 6.2 Tenant rolleri (özelleştirilebilir)

Başlangıç seed rolleri. İzinler kopyalanıp yeni rol üretilebilir.

| Rol kodu | Ad | Tipik kullanıcı |
| --- | --- | --- |
| `TENANT_ADMIN` | Sistem yöneticisi (tenant) | Kullanıcı, rol, şirket, işyeri, entegrasyon, saklama politikası |
| `COMPANY_ADMIN` | Şirket yöneticisi | Kendi şirketinin tüm operasyonu |
| `HR_SPECIALIST` | İK uzmanı | Personel, tebligat, eşleştirme, şablon seçimi |
| `PAYROLL_SPECIALIST` | Bordro uzmanı | Kesinti, bordro dönemi, ödeme, dışa aktarma |
| `LEGAL_COUNSEL` | Hukuk müşaviri | Şablon, kural seti yorumu, manuel inceleme, onay |
| `APPROVER` | Onay yetkilisi | Cevap yazısı ve sıra doğrulama onayı |
| `AUDITOR` | Salt okunur denetçi | Rapor ve audit; varsayılan maskeli PII |

Bir kullanıcıya birden fazla rol bağlanabilir. Yetki **birleşimi (union)** uygulanır. Reddetme kuralı (deny) v1’de yok; ihtiyaç halinde eklenir.

---

## 7. RBAC yetki matrisi

İzin kodları İngilizce, `kaynak:eylem` biçimindedir. Matris: `F` = tam, `R` = salt okunur, `S` = maskeli/özet, `-` = yok. `sensitive:read` ayrıca TCKN, IBAN, net ücret çözer.

| İzin | TENANT_ADMIN | COMPANY_ADMIN | HR | PAYROLL | LEGAL | APPROVER | AUDITOR |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `tenant:settings:read` | F | R | - | - | R | - | R |
| `tenant:settings:write` | F | - | - | - | - | - | - |
| `company:read` | F | F | R | R | R | R | R |
| `company:write` | F | F | - | - | - | - | - |
| `workplace:read` | F | F | R | R | R | R | R |
| `workplace:write` | F | F | - | - | - | - | - |
| `user:read` | F | R | - | - | - | - | R |
| `user:write` | F | - | - | - | - | - | - |
| `role:read` | F | R | - | - | - | - | R |
| `role:write` | F | - | - | - | - | - | - |
| `employee:read` | F | F | F | F | F | R | S |
| `employee:write` | F | F | F | R | - | - | - |
| `employee:import` | F | F | F | F | - | - | - |
| `notice:upload` | F | F | F | - | F | - | - |
| `notice:read` | F | F | F | R | F | R | R |
| `ocr:verify` | F | F | F | - | F | - | - |
| `case:create` | F | F | F | - | F | - | - |
| `case:read` | F | F | F | F | F | R | R |
| `case:write` | F | F | F | R | F | - | - |
| `case:queue:propose` | F | F | F | R | F | - | - |
| `case:queue:verify` | F | F | - | - | F | F | - |
| `template:read` | F | F | F | R | F | R | R |
| `template:upload` | F | - | - | - | F | - | - |
| `template:activate` | F | - | - | - | F | F | - |
| `response:create` | F | F | F | - | F | - | - |
| `response:edit` | F | F | F | - | F | - | - |
| `response:approve` | F | F | - | - | F | F | - |
| `response:download` | F | F | F | R | F | F | R |
| `dispatch:write` | F | F | F | - | F | F | - |
| `deduction:plan:write` | F | F | R | F | R | - | - |
| `deduction:write` | F | F | - | F | - | - | - |
| `payroll:lock` | F | F | - | F | - | F | - |
| `payroll:unlock` | F | - | - | - | - | F | - |
| `payment:write` | F | F | - | F | - | - | - |
| `report:read` | F | F | F | F | F | R | F |
| `report:export` | F | F | F | F | F | - | F |
| `sensitive:read` | F | F | İsteğe bağlı | F | İsteğe bağlı | - | - |
| `audit:read` | F | R | - | - | R | - | F |
| `retention:write` | F | - | - | - | F | - | - |
| `ruleset:read` | F | R | R | R | F | R | R |
| `ruleset:write` | F | - | - | - | F | - | - |
| `task:read` | F | F | F | F | F | F | R |
| `task:write` | F | F | F | F | F | F | - |
| `notification:read` | F | F | F | F | F | F | R |

**Zorunlu teknik izinler (her istekte ayrıca):**

- Tenant eşleşmesi (yatay izolasyon)
- Şirket kapsamı (A15)
- Nesne düzeyi: kullanıcı URL’de başka kaydın UUID’sini tarayamaz (IDOR)
- `sensitive:read` yoksa TCKN, IBAN, net ücret maskeli
- İndirme her zaman audit

Platform süper yöneticisi bu matrisin dışında, ayrı izin seti (`platform:tenant:write`, `platform:break-glass`, …) kullanır.

---

## 8. Fonksiyonel gereksinimler (modül özeti)

Ayrıntılı akışlar [workflows.md](./workflows.md) içindedir.

| Modül | Özet kabul kuralı |
| --- | --- |
| Tenant/şirket/işyeri | Kayıtlar tenantId taşır; şirket silme soft-delete; aktif icra varken hard delete yok |
| Kullanıcı/RBAC | Rol özelleştirilebilir; izin değişikliği audit |
| Personel | TCKN HMAC ile tekil; employment geçmişi |
| Tebligat | MIME + magic-byte + boyut + hash + virüs arayüzü + idempotent hash |
| OCR | Sayfa metni, güven, adapter; prompt injection sanitizasyonu |
| Çıkarım | Yalnızca şema; ekstra alan yok sayılır |
| OCR doğrulama | Düşük güven işaretli; doğrulanmadan belge yok |
| Eşleştirme | TCKN önce; belirsizse otomatik yok |
| İcra dosyası | Aşağıdaki alanlar; durum geçişleri tanımlı |
| Sıra | Kural seti versiyonu snapshot; kullanıcı doğrular; değişiklik gerekçeli |
| Şablon | DOCX, versiyon, hash, onay olmadan aktif değil |
| Öneri | Deterministik, ≤3, gerekçeli |
| Belge | Snapshot, DOCX/PDF hash, versiyon, üzerine yazmama |
| Onay | LOCKED / FIELDS_ONLY / FULL_EDIT_WITH_APPROVAL |
| Gönderim | Kayıt; otomatik gönderim kapalı |
| Kesinti | Decimal; plan vs gerçekleşen; kilitli dönem |
| Ödeme | Dekont attachment; IBAN maskeli |
| Kalan borç | Otomatik + gerekçeli düzeltme |
| Görev/bildirim | Aşağıdaki tetikleyiciler |
| Rapor | Filtre, sayfa, XLSX/PDF |
| Audit | Hassas değer açık yazılmaz |
| Saklama | Politika kaydı; iş job’ları Faz 6 |

### 8.1 İcra dosyası zorunlu iş alanları

Tenant, şirket, işyeri, personel (eşleşince), icra müdürlüğü, dosya numarası, tebligat türü, tebligat tarihi, teslim alınma, cevap son tarihi, alacaklı, vekil, borç kalemleri, para birimi, istenen kesinti oran/tutar, ödeme hesabı, sıra no, sıra doğrulama, önceki dosya bağları, durum, kesinti başlangıç/bitiş, toplam kesilen, kalan borç, notlar, belgeler, cevap yazıları, gönderimler.

### 8.2 Tebligattan çıkarılacak alanlar

İcra müdürlüğü, esas/dosya no, tebligat türü, tebligat tarihi, işyerine ulaşma, cevap süresi metni, borçlu ad-soyad, TCKN, alacaklı, vekil, toplam borç, asıl alacak, faiz, masraf, para birimi, kesinti oranı, kesinti tutarı, banka, IBAN, açıklama, istenen işlem, belgedeki tarihler, belgede **açıkça geçen** kanun/madde (yalnızca doğrulama UI; şablona otomatik basılmaz — bkz. hukuk maddesi 16).

### 8.3 Bildirim tetikleyicileri

Cevap süresi yaklaşan/geçen; OCR doğrulama; eşleştirme; sıra doğrulama; şablon seçimi; belge onayı; gönderim; bu ay kesintisi girilmeyen; beklenen-gerçekleşen fark; borcu kapanmak üzere; borç tamamlandı; sıradaki icra; kesinti sürerken işten ayrılma.

### 8.4 Rapor listesi

Aktif dosyalar; sırada bekleyen; personel özeti; işyeri özeti; müdürlük; aylık beklenen/gerçekleşen/fark; kalan borç; yaklaşan süreler; gecikmiş işlem; işten ayrılan açık icra; kapanan; şablon kullanım; gönderilmeyi bekleyen; audit. Filtre, sayfalama, XLSX/PDF.

---

## 9. Şablon senaryoları (seed, kod sabiti değil)

Yönetici sonradan kategori ve senaryo ekler. İlk seed önerisi:

| Kod | Ad |
| --- | --- |
| `TERMINATION_RESPONSE` | İşten çıkış cevap yazısı |
| `NEVER_EMPLOYED_RESPONSE` | İşyerinde hiç çalışmadığına ilişkin cevap |
| `STILL_EMPLOYED_RESPONSE` | Halen çalıştığına ilişkin cevap |
| `DEDUCTION_START_RESPONSE` | Kesintiye başlama cevap yazısı |
| `QUEUE_FIRST_RESPONSE` | Birinci sıra kesinti yazısı |
| `QUEUE_SECOND_RESPONSE` | İkinci sıra cevap yazısı |
| `QUEUE_THIRD_OR_LATER_RESPONSE` | Üçüncü veya sonraki sıra cevap yazısı |
| `QUEUE_GENERAL_RESPONSE` | Genel sıraya alma cevap yazısı |
| `PREVIOUS_CASE_ONGOING_RESPONSE` | Önceki icra dosyasının devam ettiğine ilişkin cevap |
| `NO_DEDUCTION_THIS_MONTH_RESPONSE` | Kesinti yapılamayan ay yazısı |
| `UNPAID_LEAVE_RESPONSE` | Ücretsiz izin yazısı |
| `TERMINATION_WHILE_DEDUCTING_RESPONSE` | Kesinti devam ederken iş ilişkisinin sona ermesi |
| `DEBT_COMPLETED_RESPONSE` | Borcun tamamlandığına ilişkin yazı |
| `SALARY_INFO_REQUEST_RESPONSE` | Maaş/çalışma bilgisi talebine cevap |
| `MANUAL_INCOMPLETE_INFO_RESPONSE` | Eksik bilgi nedeniyle manuel cevap yazısı |
| `EMPLOYEE_NOT_FOUND_RESPONSE` | Personel kayıtlarında bulunamadı |

Öneri kuralları: [template-engine.md](./template-engine.md).

---

## 10. Kalite özellikleri

| Özellik | Hedef |
| --- | --- |
| Doğruluk | Para Decimal; sıra ve belge onaysız üretilmez |
| İzolasyon | Tenant (zorunlu) + şirket (varsayılan) hem servis hem DB |
| Denetlenebilirlik | Listelenen olaylar audit’te; PII yok |
| Kullanılabilirlik | Masaüstü öncelikli; belge solda / alanlar sağda; TR tarih ve para |
| Erişilebilirlik | Klavye, kontrast, etiketli formlar (WCAG 2.2 AA hedef) |
| Dayanıklılık | Worker job’ları idempotent; tekrar içe aktarma mükerrer kesinti üretmez |
| Gözlemlenebilirlik | Yapısal log (PII’siz), job metrikleri |
| Taşınabilirlik | Tek satıcıya kilitli OCR/e-posta/SMS/depolama yok |

---

## 11. Test ve kabul senaryoları (ürün düzeyi)

Aşağıdaki 24 senaryo faz planındaki otomatik testlere birebir yansır.

1. İşten ayrılan personel → işten çıkış yazısı önerilir.
2. Aktif, başka icrası yok → kesintiye başlama önerilir.
3. Bir aktif icra → ikinci sıra önerilir.
4. İki aktif icra → üçüncü sıra veya sıraya alma önerilir.
5. Personel yok → bulunamadı şablonu önerilir.
6. Birden fazla aday → otomatik eşleşme yok.
7. Kullanıcı önerilmeyen şablonu seçebilir.
8. Ayar açıksa farklı seçimde gerekçe zorunlu.
9. Eksik zorunlu değişken varken belge yok.
10. Doğrulanmamış OCR ile nihai belge yok.
11. Doğrulanmamış sıra ile nihai belge yok.
12. DOCX biçimi değişken sonrası korunur.
13. DOCX ve PDF aynı değerleri içerir.
14. LOCKED şablonun sabit metni değişmez.
15. Yeni şablon versiyonu eski belgeleri etkilemez.
16. Yeniden üretim eski dosyanın üzerine yazmaz.
17. Aylık kesinti kalan borcu doğru azaltır.
18. Dosya kapanınca sıradaki için görev oluşur.
19. Kilitli dönem yetkisiz değişmez.
20. Tenant A, tenant B verisine erişemez.
21. Hassas veri logda açık görünmez.
22. Şablon seçimi ve belge onayı audit’te.
23. Tekrar toplu aktarım mükerrer kesinti üretmez.
24. Düşük güvenli OCR alanları işaretlenir.

---

## 12. Bilinçli itirazlar (ürün kararına meydan okuma)

1. **Tek üründe OCR + hukuk şablonu + bordro**, üç ayrı risk sınıfıdır. Bordro kilidi ve icra cevabı aynı sprint’te olmamalı; faz sırası doğrudur ve korunmalıdır.
2. **Sıra motorunu “akıllı” göstermek** işvereni yanlış yönlendirir. Arayüz kopyası sürekli “öneri / doğrulama gerekli” demelidir. Pazarlama cümlesi de aynı sınırı taşımalıdır.
3. **Cloud OCR varsayılan kapalı** kararı, taranmış tebligatlarda doğruluğu düşürür. Bu bilinçli bir KVKK tercihidir; kullanıcıya “yerel OCR düşük güven üretebilir” uyarısı gösterilmelidir.
4. **Next.js API Routes üzerinde LibreOffice/OCR** uzun süren native süreçler için uygun değildir. Ayrı worker şarttır. Bu, “yalnızca Next.js” okumasından sapmadır; gerekçe [architecture.md](./architecture.md) içindedir.
5. **Tüm 23 modül + 24 ekran + 6 faz** tek geliştirici için takvim değil, ürün haritasıdır. Faz 1 bile kendi başına yayınlanabilir bir çekirdektir.
6. **Kanun maddesi çıkarımı** ürün tanımında var; tavsiyem resmi yazıya otomatik girmemesidir. Aksi halde OCR hatası hukuki metin gibi görünür.

---

## 13. Belge haritası

| Belge | İçerik |
| --- | --- |
| [architecture.md](./architecture.md) | Mimari, monorepo, teknik kararlar |
| [data-model.md](./data-model.md) | ER, Prisma taslağı, kısıtlar |
| [api-design.md](./api-design.md) | Endpoint listesi, hata modeli |
| [template-engine.md](./template-engine.md) | Değişken sözlüğü, öneri tablosu, DOCX/PDF |
| [workflows.md](./workflows.md) | Akış diyagramları, durum geçişleri |
| [security.md](./security.md) | Tehdit modeli, KVKK, audit |
| [implementation-plan.md](./implementation-plan.md) | Fazlar, kabul kriterleri, açık kararlar |
