import { ReinoEditorialNav } from "@/components/editorial/reino-editorial-nav";

export default function ReinoEditorialLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="editorial-theme flex flex-col min-h-0 flex-1">
      <ReinoEditorialNav />
      <div className="flex-1 min-h-0 overflow-auto">{children}</div>
    </div>
  );
}
