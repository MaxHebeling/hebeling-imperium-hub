import { IdrPortalNav } from "@/components/idr/idr-portal-nav";
import { requireIdrCommunitySession } from "@/lib/idr/server-access";

export default async function IdrCommunityLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireIdrCommunitySession();

  return (
    <>
      <IdrPortalNav userEmail={session.email} userName={session.fullName} />
      <main className="mx-auto max-w-6xl px-4 py-6 pb-24 md:pb-8">{children}</main>
    </>
  );
}
