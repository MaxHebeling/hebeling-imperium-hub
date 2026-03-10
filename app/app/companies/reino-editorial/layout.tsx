import { ReinoEditorialNav } from "@/components/companies/reino-editorial-nav";

export default function ReinoEditorialLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-full min-h-0 flex-1">
      <ReinoEditorialNav />
      <div className="flex-1 overflow-auto">{children}</div>
    </div>
  );
}
