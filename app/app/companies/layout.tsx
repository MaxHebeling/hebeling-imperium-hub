import { redirect } from "next/navigation";

/** /app/companies → redirect to the companies landing page */
export default function CompaniesIndexPage() {
  redirect("/app/companies");
}
