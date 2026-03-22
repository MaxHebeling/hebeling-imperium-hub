import { notFound } from "next/navigation";
import { IdrOfficeNav } from "@/components/idr/idr-office-nav";
import { getIdrStaffOfficeBySlug, isIdrStaffOfficeSlug } from "@/lib/idr/workspaces";
import { requireIdrStaffOfficeSession } from "@/lib/idr/server-access";

export default async function IdrStaffOfficeLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ officeSlug: string }>;
}) {
  const { officeSlug } = await params;

  if (!isIdrStaffOfficeSlug(officeSlug)) {
    notFound();
  }

  const session = await requireIdrStaffOfficeSession(officeSlug);
  const office = getIdrStaffOfficeBySlug(officeSlug, "es");

  if (!office) {
    notFound();
  }

  return (
    <>
      <IdrOfficeNav
        officeSlug={office.slug}
        officeCode={office.code}
        officeTitle={office.title}
        userEmail={session.email}
        userName={session.fullName}
      />
      <main className="mx-auto max-w-6xl px-4 py-6 pb-10">{children}</main>
    </>
  );
}
