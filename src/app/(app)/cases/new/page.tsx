import { PageHeader } from "@/components/shared/bits";
import { NewCaseForm } from "@/components/cases/new-case-form";
import { getDataSource } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function NewCasePage() {
  const db = await getDataSource();
  const [courts, contacts] = await Promise.all([db.listCourts(), db.listContacts()]);
  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title="تشکیل پرونده جدید"
        subtitle="مشخصات پایه را ثبت کنید — طرفین، اسناد و مواعد بعداً قابل تکمیل است"
      />
      <NewCaseForm courts={courts} contacts={contacts} />
    </div>
  );
}
