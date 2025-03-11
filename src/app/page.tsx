import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Link from 'next/link'

export default async function Home() {
  const session = await getServerSession(authOptions);
  
  // Si l'utilisateur est connecté, rediriger vers la page des colocations
  if (session?.user) {
    redirect("/colocations");
  }
  
  // Sinon, rediriger vers la page de connexion
  redirect("/login");
}
