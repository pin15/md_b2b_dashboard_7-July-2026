import { redirect } from "next/navigation";

// The app entry: send everyone to the dashboard; middleware enforces auth + AAL2
// + employer membership and bounces to /login or /mfa as needed.
export default function Home() {
  redirect("/dashboard");
}
