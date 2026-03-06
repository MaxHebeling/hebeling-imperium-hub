import { redirect } from "next/navigation";

// Root page redirects to login
// In production, the middleware handles hostname-based routing
export default function RootPage() {
  redirect("/login");
}
