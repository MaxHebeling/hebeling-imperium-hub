import { redirect } from "next/navigation";

/** /app/companies/reino-editorial → redirect to overview */
export default function ReinoEditorialIndexPage() {
  redirect("/app/companies/reino-editorial/overview");
}
