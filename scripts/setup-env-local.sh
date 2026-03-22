#!/usr/bin/env bash
# setup-env-local.sh
# Genera un .env.local limpio conservando los valores existentes de Supabase.
# Uso:
#   bash scripts/setup-env-local.sh
#   OPENAI_API_KEY=xxx RESEND_API_KEY=xxx bash scripts/setup-env-local.sh

set -euo pipefail

ENV_FILE=".env.local"

# ── Leer valores existentes de Supabase (si hay) ──
SUPABASE_URL=""
SUPABASE_ANON=""
SUPABASE_SERVICE=""

if [ -f "$ENV_FILE" ]; then
  echo "Leyendo valores existentes de $ENV_FILE..."
  while IFS='=' read -r key value; do
    # Ignorar comentarios y lineas vacias
    [[ -z "$key" || "$key" =~ ^# ]] && continue
    # Limpiar espacios
    key=$(echo "$key" | xargs)
    case "$key" in
      NEXT_PUBLIC_SUPABASE_URL)    SUPABASE_URL="$value" ;;
      NEXT_PUBLIC_SUPABASE_ANON_KEY) SUPABASE_ANON="$value" ;;
      SUPABASE_SERVICE_ROLE_KEY)   SUPABASE_SERVICE="$value" ;;
    esac
  done < "$ENV_FILE"
  echo "Valores de Supabase recuperados."
else
  echo "No se encontro $ENV_FILE existente. Se creara uno nuevo."
fi

# ── Leer API keys de variables de entorno (si existen) ──
OPENAI_KEY="${OPENAI_API_KEY:-}"
RESEND_KEY="${RESEND_API_KEY:-}"

# ── Escribir archivo limpio ──
cat > "$ENV_FILE" << EOF
NEXT_PUBLIC_SUPABASE_URL=${SUPABASE_URL}
NEXT_PUBLIC_SUPABASE_ANON_KEY=${SUPABASE_ANON}
SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE}
OPENAI_API_KEY=${OPENAI_KEY}
RESEND_API_KEY=${RESEND_KEY}
RESEND_FROM_EMAIL="Reino Editorial <info@editorialreino.com>"
EOF

echo ""
echo "=== .env.local generado correctamente ==="
echo ""

# ── Verificar ──
TOTAL=$(grep -c '=' "$ENV_FILE")
echo "Variables encontradas: $TOTAL"
echo ""

while IFS='=' read -r key value; do
  [[ -z "$key" || "$key" =~ ^# ]] && continue
  key=$(echo "$key" | xargs)
  if [ -z "$value" ]; then
    echo "$key=EMPTY"
  else
    echo "$key=SET"
  fi
done < "$ENV_FILE"

echo ""
if [ -z "$OPENAI_KEY" ] || [ -z "$RESEND_KEY" ]; then
  echo "Nota: Algunas API keys quedaron vacias. Para rellenarlas ejecuta:"
  echo "  OPENAI_API_KEY=xxx RESEND_API_KEY=xxx bash scripts/setup-env-local.sh"
else
  echo "Todas las variables tienen valor. .env.local listo para usar."
fi
