import { redirect } from "next/navigation";

export default function PaymentsRedirectPage() {
  redirect("/app/finance-vault");
}
