import { cookies } from "next/headers";
import { FinancePlannerModule } from "./planner-module";

const FINANCE_COOKIE_NAME = "finance_module_unlocked";

export default async function FinanceVaultPage() {
  const cookieStore = await cookies();
  const isUnlocked = cookieStore.get(FINANCE_COOKIE_NAME)?.value === "1";

  return <FinancePlannerModule isUnlocked={isUnlocked} />;
}
