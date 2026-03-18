import { redirect } from "next/navigation"
import { getSession } from "@/lib/session"
import { LoginForm } from "./login-form"

export default async function LoginPage() {
  // Check if user is already logged in
  const session = await getSession()

  if (session.user) {
    redirect("/")
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#07111f] p-4 selection:bg-indigo-500/20">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(96,165,250,0.16),transparent_30%),linear-gradient(180deg,#0b1220_0%,#07111f_100%)]" />
      <div className="relative z-10 w-full max-w-md">
        <LoginForm />
      </div>
    </div>
  )
}
