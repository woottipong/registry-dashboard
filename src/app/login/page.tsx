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
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background p-4 selection:bg-primary/20">
      <div className="relative z-10 w-full max-w-md">
        <LoginForm />
      </div>
    </div>
  )
}
