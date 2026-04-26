import { redirect } from "next/navigation"
import Image from "next/image"
import { getSession } from "@/lib/session"
import { LoginForm } from "./login-form"

export default async function LoginPage() {
  // Check if user is already logged in
  const session = await getSession()

  if (session.user) {
    redirect("/")
  }

  return (
    <main className="min-h-screen bg-background px-4 py-10 selection:bg-primary/20 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-6xl items-center justify-center">
        <div className="grid w-full max-w-5xl gap-10 lg:grid-cols-[minmax(0,1fr)_380px]">
          <section className="hidden flex-col justify-center lg:flex">
            <div className="space-y-8">
              <div className="flex items-center gap-3">
                <div className="relative inline-flex size-11 shrink-0 overflow-hidden rounded-2xl border border-border/70 bg-card">
                  <Image src="/logo.svg" alt="Registry Dashboard" fill className="object-cover" />
                </div>
                <p className="text-sm font-medium tracking-tight text-foreground/76">Registry Dashboard</p>
              </div>

              <div className="max-w-xl space-y-4">
                <h1 className="text-[2.6rem] font-semibold tracking-tight text-foreground">
                  Sign in to access your registry workspace.
                </h1>
                <p className="max-w-md text-sm leading-6 text-muted-foreground">
                  Authenticate with the configured operator account to continue.
                </p>
              </div>
            </div>
          </section>

          <section className="flex items-center">
            <div className="w-full">
              <LoginForm />
            </div>
          </section>
        </div>
      </div>
    </main>
  )
}
