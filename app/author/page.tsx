import { redirect } from "next/navigation";

/** /author → redirect to the projects list */
export default function AuthorRootPage() {
  redirect("/author/projects");
}
