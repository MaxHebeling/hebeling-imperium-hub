import { getAdminClient } from "@/lib/leads/helpers";

// ---------------------------------------------------------------------------
// Birthday Automation Service — Reino Editorial
// ---------------------------------------------------------------------------

export interface BirthdayUser {
  id: string;
  email: string;
  full_name: string;
  date_of_birth: string; // YYYY-MM-DD
  phone?: string;
  preferred_locale?: "es" | "en";
  birthday_email_enabled?: boolean;
  birthday_phone_enabled?: boolean;
  birthday_notification_enabled?: boolean;
}

/** Messages by locale */
const BIRTHDAY_MESSAGES = {
  es: {
    subject: "Feliz cumpleanos - Reino Editorial",
    title: "Feliz cumpleanos!",
    body: `Hoy queremos felicitarte y agradecerte por permitirnos acompanarte en el proceso de tu libro.

Te deseamos un dia lleno de alegria, bendicion y grandes momentos.`,
    closing: "Con aprecio,",
    sender: "Reino Editorial",
    notificationTitle: "Reino Editorial te desea un feliz cumpleanos",
    notificationMsg:
      "Hoy es un dia especial para ti. Todo el equipo de Reino Editorial te desea lo mejor en tu dia.",
  },
  en: {
    subject: "Happy Birthday - Reino Editorial",
    title: "Happy Birthday!",
    body: `Today we want to celebrate you and thank you for allowing us to accompany you in the journey of your book.

We wish you a day full of joy, blessing, and beautiful moments.`,
    closing: "With appreciation,",
    sender: "Reino Editorial",
    notificationTitle: "Reino Editorial wishes you a happy birthday",
    notificationMsg:
      "Today is a special day for you. The entire Reino Editorial team wishes you the very best.",
  },
} as const;

// ---------------------------------------------------------------------------
// 1. Find users whose birthday is today
// ---------------------------------------------------------------------------

export async function findTodayBirthdays(): Promise<BirthdayUser[]> {
  const supabase = getAdminClient();

  // Get today's month and day (UTC)
  const now = new Date();
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  const day = String(now.getUTCDate()).padStart(2, "0");
  const mmdd = `-${month}-${day}`;

  // Fetch all users from auth — we need to check user_metadata.date_of_birth
  const { data: usersData, error } = await supabase.auth.admin.listUsers({
    perPage: 1000,
  });

  if (error) {
    console.error("[birthday] Error listing users:", error.message);
    return [];
  }

  const birthdayUsers: BirthdayUser[] = [];

  for (const user of usersData.users) {
    const meta = user.user_metadata;
    if (!meta?.date_of_birth) continue;

    const dob = String(meta.date_of_birth);
    // Check if month-day matches
    if (dob.includes(mmdd)) {
      birthdayUsers.push({
        id: user.id,
        email: user.email ?? "",
        full_name: meta.full_name ?? meta.name ?? "Cliente",
        date_of_birth: dob,
        phone: meta.phone ?? undefined,
        preferred_locale: meta.preferred_locale ?? "es",
        birthday_email_enabled: meta.birthday_email_enabled !== false,
        birthday_phone_enabled: meta.birthday_phone_enabled === true,
        birthday_notification_enabled:
          meta.birthday_notification_enabled !== false,
      });
    }
  }

  return birthdayUsers;
}

// ---------------------------------------------------------------------------
// 2. Check if we already sent a birthday greeting this year
// ---------------------------------------------------------------------------

export async function alreadySentThisYear(
  userId: string
): Promise<boolean> {
  const supabase = getAdminClient();
  const year = new Date().getUTCFullYear();

  const { data } = await supabase
    .from("editorial_notifications")
    .select("id")
    .eq("recipient_id", userId)
    .eq("type", "birthday")
    .gte("created_at", `${year}-01-01T00:00:00Z`)
    .limit(1);

  return (data?.length ?? 0) > 0;
}

// ---------------------------------------------------------------------------
// 3. Send birthday greeting via all enabled channels
// ---------------------------------------------------------------------------

export async function sendBirthdayGreeting(
  user: BirthdayUser
): Promise<{ email: boolean; notification: boolean; phone: boolean }> {
  const locale = user.preferred_locale ?? "es";
  const msgs = BIRTHDAY_MESSAGES[locale];
  const result = { email: false, notification: false, phone: false };

  // --- In-app notification ---
  if (user.birthday_notification_enabled !== false) {
    try {
      const supabase = getAdminClient();
      await supabase.from("editorial_notifications").insert({
        project_id: null,
        recipient_id: user.id,
        recipient_type: "client",
        type: "birthday",
        title: msgs.notificationTitle,
        message: msgs.notificationMsg,
        is_read: false,
        metadata: { birthday_year: new Date().getUTCFullYear() },
      });
      result.notification = true;
    } catch (err) {
      console.error("[birthday] notification error:", err);
    }
  }

  // --- Email ---
  if (user.birthday_email_enabled !== false && user.email) {
    try {
      const emailHtml = buildBirthdayEmailHtml(user.full_name, locale);
      // Try Resend if RESEND_API_KEY is set
      const resendKey = process.env.RESEND_API_KEY;
      if (resendKey) {
        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${resendKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "Reino Editorial <info@editorialreino.com>",
            to: [user.email],
            subject: msgs.subject,
            html: emailHtml,
          }),
        });
        result.email = res.ok;
        if (!res.ok) {
          const body = await res.text();
          console.error("[birthday] email send error:", body);
        }
      }
    } catch (err) {
      console.error("[birthday] email error:", err);
    }
  }

  // --- Phone (SMS/WhatsApp) — base architecture, future integration ---
  if (user.birthday_phone_enabled && user.phone) {
    // Placeholder for Twilio / WhatsApp Business API integration
    console.log(
      `[birthday] Phone greeting prepared for ${user.phone} — integration pending`
    );
    result.phone = false; // Not yet implemented
  }

  return result;
}

// ---------------------------------------------------------------------------
// 4. Run full daily birthday check
// ---------------------------------------------------------------------------

export async function runDailyBirthdayCheck(): Promise<{
  checked: number;
  sent: number;
  skipped: number;
  errors: number;
}> {
  const stats = { checked: 0, sent: 0, skipped: 0, errors: 0 };

  try {
    const birthdayUsers = await findTodayBirthdays();
    stats.checked = birthdayUsers.length;

    for (const user of birthdayUsers) {
      try {
        const alreadySent = await alreadySentThisYear(user.id);
        if (alreadySent) {
          stats.skipped++;
          continue;
        }

        const result = await sendBirthdayGreeting(user);
        if (result.email || result.notification || result.phone) {
          stats.sent++;
        } else {
          stats.errors++;
        }
      } catch (err) {
        console.error(
          `[birthday] Error processing user ${user.id}:`,
          err
        );
        stats.errors++;
      }
    }
  } catch (err) {
    console.error("[birthday] Fatal error in daily check:", err);
  }

  console.log(
    `[birthday] Daily check complete: ${stats.checked} checked, ${stats.sent} sent, ${stats.skipped} skipped, ${stats.errors} errors`
  );
  return stats;
}

// ---------------------------------------------------------------------------
// 5. Birthday email HTML template
// ---------------------------------------------------------------------------

function buildBirthdayEmailHtml(
  clientName: string,
  locale: "es" | "en"
): string {
  const msgs = BIRTHDAY_MESSAGES[locale];
  const greeting =
    locale === "es"
      ? `Querido/a ${clientName},`
      : `Dear ${clientName},`;

  return `<!DOCTYPE html>
<html lang="${locale}">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f6f9;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f9;padding:40px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);">
        <!-- Header -->
        <tr><td style="background:linear-gradient(135deg,#1a3a6b 0%,#2a5a9b 100%);padding:40px 40px 30px;text-align:center;">
          <h1 style="color:#ffffff;font-size:28px;margin:0 0 8px;font-weight:700;">${msgs.title}</h1>
          <p style="color:rgba(255,255,255,0.8);font-size:14px;margin:0;">Reino Editorial</p>
        </td></tr>
        <!-- Body -->
        <tr><td style="padding:36px 40px 20px;">
          <p style="color:#1a3a6b;font-size:16px;margin:0 0 20px;font-weight:500;">${greeting}</p>
          <p style="color:#444;font-size:15px;line-height:1.7;margin:0 0 24px;white-space:pre-line;">${msgs.body}</p>
          <p style="color:#666;font-size:14px;margin:0 0 4px;font-style:italic;">${msgs.closing}</p>
          <p style="color:#1a3a6b;font-size:15px;margin:0;font-weight:600;">${msgs.sender}</p>
        </td></tr>
        <!-- Footer -->
        <tr><td style="padding:20px 40px 30px;border-top:1px solid #eef1f5;">
          <p style="color:#999;font-size:11px;text-align:center;margin:0;">info@editorialreino.com | editorialreino.com</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
