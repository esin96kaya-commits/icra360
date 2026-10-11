export type CaseStatus = "VERIFYING" | "RESPONSE" | "DEDUCTING" | "QUEUED" | "TERMINATED_OPEN";

export type WorkCase = {
  id: string;
  employeeName: string;
  employeeNumber: string;
  maskedNationalId: string;
  company: string;
  workplace: string;
  office: string;
  fileNo: string;
  noticeType: string;
  status: CaseStatus;
  queue: number;
  remaining: string;
  deducted: string;
  dueDate: string;
  creditor: string;
};

export type TemplateSuggestion = {
  code: string;
  title: string;
  reason: string;
};

export const CASE_STATUS_LABEL: Record<CaseStatus, string> = {
  VERIFYING: "Doğrulama bekliyor",
  RESPONSE: "Cevap yazısı bekliyor",
  DEDUCTING: "Kesinti sürüyor",
  QUEUED: "Sırada",
  TERMINATED_OPEN: "İşten ayrıldı — açık",
};

export const CASE_STATUS_TONE: Record<CaseStatus, "warning" | "danger" | "success" | "neutral"> = {
  VERIFYING: "warning",
  RESPONSE: "danger",
  DEDUCTING: "success",
  QUEUED: "neutral",
  TERMINATED_OPEN: "warning",
};

/** Fictional UI fixtures aligned with seed personel. Not legal advice. */
export const WORK_CASES: WorkCase[] = [
  {
    id: "elif-ornek",
    employeeName: "Elif Örnek",
    employeeNumber: "A-1001",
    maskedNationalId: "492*****50",
    company: "Demo A Tekstil Anonim Şirketi",
    workplace: "Merkez Fabrika",
    office: "İstanbul Anadolu 12. İcra Dairesi",
    fileNo: "2024/18432",
    noticeType: "Maaş haczi tebligatı",
    status: "VERIFYING",
    queue: 1,
    remaining: "18640.00",
    deducted: "0.00",
    dueDate: "2026-09-19",
    creditor: "Örnek Finans A.Ş.",
  },
  {
    id: "selin-taslak",
    employeeName: "Selin Taslak",
    employeeNumber: "L-2001",
    maskedNationalId: "598*****86",
    company: "Demo A Lojistik Limited Şirketi",
    workplace: "Ambar",
    office: "Ankara 5. İcra Dairesi",
    fileNo: "2025/2201",
    noticeType: "Haciz ihbarnamesi",
    status: "RESPONSE",
    queue: 2,
    remaining: "41200.00",
    deducted: "0.00",
    dueDate: "2026-09-22",
    creditor: "Kurgusal Faktoring A.Ş.",
  },
  {
    id: "mert-deneme",
    employeeName: "Mert Deneme",
    employeeNumber: "A-1002",
    maskedNationalId: "542*****50",
    company: "Demo A Tekstil Anonim Şirketi",
    workplace: "Merkez Fabrika",
    office: "İstanbul Anadolu 8. İcra Dairesi",
    fileNo: "2023/9901",
    noticeType: "Maaş haczi tebligatı",
    status: "TERMINATED_OPEN",
    queue: 1,
    remaining: "8450.00",
    deducted: "21550.00",
    dueDate: "2026-09-18",
    creditor: "Demo Alacaklı Ltd. Şti.",
  },
];

export const HOME_TASKS = [
  {
    id: "t1",
    href: "/tracking/elif-ornek",
    title: "Elif Örnek — tebligat doğrulama",
    detail: "Cevap süresi 2 gün içinde doluyor. Alanlar sizin onayınız olmadan dosyaya işlenmez.",
    tone: "danger" as const,
    cta: "Dosyayı aç",
  },
  {
    id: "t2",
    href: "/replies/compose",
    title: "Selin Taslak — şablon seçimi",
    detail: "Sıra önerisi 2. Sistem yazı yazmaz; onaylı şablonu siz seçersiniz.",
    tone: "warning" as const,
    cta: "Şablonlara git",
  },
  {
    id: "t3",
    href: "/tracking/mert-deneme",
    title: "Mert Deneme — işten ayrılmış açık dosya",
    detail: "Kesinti durdu, kalan borç açık. İşten çıkış cevap yazısı bekleniyor.",
    tone: "warning" as const,
    cta: "Takibe git",
  },
];

export function templateSuggestionsFor(workCase: WorkCase): TemplateSuggestion[] {
  if (workCase.status === "TERMINATED_OPEN") {
    return [
      {
        code: "TERMINATION_RESPONSE",
        title: "İşten çıkış cevap yazısı",
        reason: "Personelin istihdamı sona ermiş. Öneri kural setine göredir, hukuki karar değildir.",
      },
    ];
  }
  if (workCase.queue === 1) {
    return [
      {
        code: "DEDUCTION_START_RESPONSE",
        title: "Kesintiye başlama cevap yazısı",
        reason: "Bu dosya hariç aktif icra yok. Sıra 1 önerilir; yetkili doğrular.",
      },
    ];
  }
  return [
    {
      code: "QUEUE_SECOND_RESPONSE",
      title: "İkinci sıra cevap yazısı",
      reason: "Personelde başka açık dosya var. Kesinti başlamaz, sıra bekler.",
    },
    {
      code: "QUEUE_GENERAL_RESPONSE",
      title: "Genel sıraya alma yazısı",
      reason: "Belirsizlikte genel sıra şablonu yedek öneridir.",
    },
  ];
}

export const REPORTS = [
  { slug: "aktif", title: "Aktif dosyalar", summary: "Kesintisi süren ve açık icra kayıtları." },
  { slug: "sirada", title: "Sırada bekleyen", summary: "Kesinti başlamamış kuyruk dosyaları." },
  { slug: "sureler", title: "Yaklaşan süreler", summary: "Cevap veya işlem tarihi yaklaşan işler." },
  { slug: "aylik", title: "Aylık kesinti", summary: "Beklenen, gerçekleşen ve fark." },
  { slug: "kalan", title: "Kalan borç", summary: "Dosya bazında kalan tutar özeti." },
  { slug: "gecikme", title: "Gecikmiş işlem", summary: "Süresi geçmiş doğrulama veya yazı." },
  { slug: "ayrilma", title: "İşten ayrılan açık icra", summary: "İstihdamı bitmiş, borcu kapanmamış." },
  { slug: "gonderim", title: "Gönderilmeyi bekleyen", summary: "Onaylı yazısı olup gönderim kaydı olmayan." },
] as const;

export function getWorkCase(id: string): WorkCase | undefined {
  return WORK_CASES.find((item) => item.id === id);
}

export function firstName(fullName: string): string {
  return fullName.split(" ")[0] ?? fullName;
}

export const SUMMARY_METRICS = [
  { key: "notices", label: "Gelen Tebligat", color: "#142B4A" },
  { key: "replies", label: "Yazılan Cevap Yazısı", color: "#16A6A1" },
  { key: "active", label: "Aktif icra", color: "#238A65" },
  { key: "queued", label: "Sırada", color: "#E8A23A" },
  { key: "exit", label: "Çıkış Yazısı", color: "#5B7C99" },
] as const;

export type SummaryMetricKey = (typeof SUMMARY_METRICS)[number]["key"];
export type SummaryCounts = Record<SummaryMetricKey, number>;

export const EMPTY_SUMMARY: SummaryCounts = {
  notices: 0,
  replies: 0,
  active: 0,
  queued: 0,
  exit: 0,
};

/** Fictional workplace-level counts. Keys are `legalName||workplaceName`. */
export const YEARLY_BY_WORKPLACE: Record<string, SummaryCounts> = {
  "Demo A Tekstil Anonim Şirketi||Merkez Fabrika": { notices: 31, replies: 27, active: 8, queued: 4, exit: 4 },
  "Demo A Lojistik Limited Şirketi||Ambar": { notices: 17, replies: 14, active: 4, queued: 3, exit: 1 },
};

export const MONTHLY_BY_WORKPLACE: Record<string, SummaryCounts> = {
  "Demo A Tekstil Anonim Şirketi||Merkez Fabrika": { notices: 4, replies: 3, active: 2, queued: 1, exit: 1 },
  "Demo A Lojistik Limited Şirketi||Ambar": { notices: 2, replies: 1, active: 1, queued: 1, exit: 0 },
};

export function workplaceScopeKey(companyLegalName: string, workplaceName: string): string {
  return `${companyLegalName}||${workplaceName}`;
}

export function addSummary(left: SummaryCounts, right: SummaryCounts): SummaryCounts {
  return {
    notices: left.notices + right.notices,
    replies: left.replies + right.replies,
    active: left.active + right.active,
    queued: left.queued + right.queued,
    exit: left.exit + right.exit,
  };
}

export function summaryForWorkplaces(
  table: Record<string, SummaryCounts>,
  scopes: Array<{ companyLegalName: string; workplaceName: string }>,
): SummaryCounts {
  return scopes.reduce((total, scope) => {
    const row = table[workplaceScopeKey(scope.companyLegalName, scope.workplaceName)] ?? EMPTY_SUMMARY;
    return addSummary(total, row);
  }, EMPTY_SUMMARY);
}

export const YEARLY_SUMMARY = summaryForWorkplaces(
  YEARLY_BY_WORKPLACE,
  Object.keys(YEARLY_BY_WORKPLACE).map((key) => {
    const [companyLegalName, workplaceName] = key.split("||") as [string, string];
    return { companyLegalName, workplaceName };
  }),
);

export const MONTHLY_SUMMARY = summaryForWorkplaces(
  MONTHLY_BY_WORKPLACE,
  Object.keys(MONTHLY_BY_WORKPLACE).map((key) => {
    const [companyLegalName, workplaceName] = key.split("||") as [string, string];
    return { companyLegalName, workplaceName };
  }),
);

export function companyShortLabel(legalName: string): string {
  const stripped = legalName
    .replace(/\s+(Anonim|Limited)\s+Şirketi$/u, "")
    .replace(/^Demo\s+[A-Z]\s+/u, "")
    .trim();
  return stripped || legalName;
}

