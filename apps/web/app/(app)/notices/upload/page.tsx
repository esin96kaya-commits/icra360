import { listCompanies } from "@icra360/domain";
import { LegalNote } from "@/components/legal-note";
import { NoticeUploadForm } from "@/components/notice-upload-form";
import { requirePageContext } from "@/lib/context";

export default async function NoticeUploadPage() {
  const ctx = await requirePageContext();
  const companies = await listCompanies(ctx);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Tebligat yükle</h1>
        <p className="mt-1 text-sm leading-6 text-navy/70">
          Cevabı tüzel kişilik verir. Belgeyi şirkete bağlayın; çıkarım sizin doğrulamanızdan sonra işlenir.
        </p>
      </div>
      <NoticeUploadForm companies={companies.map((company) => ({ id: company.id, legalName: company.legalName }))} />
      <LegalNote>UETS ve KEP bu sürümde yok. Otomatik e-posta gönderilmez.</LegalNote>
    </div>
  );
}
