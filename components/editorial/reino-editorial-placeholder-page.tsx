import { Construction } from "lucide-react";

interface ReinoEditorialPlaceholderPageProps {
  title: string;
  description: string;
  moduleName: string;
}

export function ReinoEditorialPlaceholderPage({
  title,
  description,
  moduleName,
}: ReinoEditorialPlaceholderPageProps) {
  return (
    <div
      className="min-h-full p-8"
      style={{ backgroundColor: "var(--re-bg)" }}
    >
      {/* Page header */}
      <div className="mb-8">
        <h1
          className="text-xl font-bold tracking-tight"
          style={{ color: "var(--re-text)" }}
        >
          {title}
        </h1>
        <p
          className="text-sm mt-1 leading-relaxed"
          style={{ color: "var(--re-text-muted)" }}
        >
          {description}
        </p>
      </div>

      {/* Coming soon card */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{
          backgroundColor: "var(--re-surface)",
          border: "1px solid var(--re-border)",
          boxShadow: "var(--re-shadow-md)",
        }}
      >
        {/* Top accent bar */}
        <div
          className="h-1 w-full"
          style={{
            background: "linear-gradient(90deg, var(--re-blue) 0%, var(--re-cyan) 50%, var(--re-gold-bright) 100%)",
          }}
        />

        <div className="flex flex-col items-center justify-center py-20 px-8 text-center">
          {/* Icon */}
          <div
            className="flex items-center justify-center w-16 h-16 rounded-2xl mb-6"
            style={{
              background: "var(--re-blue-pale)",
              border: "1px solid var(--re-border-blue)",
            }}
          >
            <Construction
              className="w-8 h-8"
              style={{ color: "var(--re-blue)" }}
            />
          </div>

          {/* Badge */}
          <span
            className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold mb-4"
            style={{
              backgroundColor: "var(--re-gold-pale)",
              color: "var(--re-gold)",
              border: "1px solid var(--re-border-gold)",
            }}
          >
            Proximo modulo
          </span>

          <h2
            className="text-lg font-bold mb-2"
            style={{ color: "var(--re-text)" }}
          >
            {moduleName} esta en desarrollo
          </h2>
          <p
            className="text-sm max-w-md leading-relaxed"
            style={{ color: "var(--re-text-muted)" }}
          >
            La estructura de navegacion ya esta preparada. El contenido y la logica de negocio
            se integraran aqui en una fase posterior de la migracion company-first dentro de
            Hebeling OS.
          </p>

          {/* Decorative dots */}
          <div className="flex items-center gap-2 mt-8">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-2 h-2 rounded-full"
                style={{
                  backgroundColor:
                    i === 0
                      ? "var(--re-blue)"
                      : i === 1
                      ? "var(--re-cyan)"
                      : "var(--re-gold-bright)",
                  opacity: i === 0 ? 1 : 0.4,
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
