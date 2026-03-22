const LEAD_HUNTER_BACKGROUND = "/lead-hunter-cinematic-luxury-v1.jpg";

export default function LeadHunterWorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-full overflow-hidden bg-[#07111F] text-[#E7ECF5]">
      <div className="pointer-events-none absolute inset-0">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-[0.18]"
          style={{
            backgroundImage: `url('${LEAD_HUNTER_BACKGROUND}')`,
            transform: "scale(1.03)",
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(7,17,31,0.88) 0%, rgba(7,17,31,0.68) 22%, rgba(7,17,31,0.74) 48%, rgba(7,17,31,0.9) 100%)",
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.42]"
          style={{
            background:
              "radial-gradient(circle at 18% 14%, rgba(201,111,45,0.24), transparent 24%), radial-gradient(circle at 82% 18%, rgba(225,162,74,0.18), transparent 20%), radial-gradient(circle at 50% 42%, rgba(159,178,204,0.08), transparent 30%)",
          }}
        />
      </div>

      <div className="relative">{children}</div>
    </div>
  );
}
