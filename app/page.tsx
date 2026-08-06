import { redirect } from "next/navigation";

export default function Home() {
  // Leitet sofort permanent zu /menu weiter
  redirect("/menu");
  
  // Dieser Teil wird nie gerendert
  return null;
}