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
    <main className="min-h-screen bg-background px-4 py-8 selection:bg-primary/20 sm:px-6 lg:px-8 flex items-center justify-center">
      <div className="w-full max-w-5xl">
        <div className="grid gap-6 lg:grid-cols-[1.1fr_420px] items-stretch">
          <section className="relative hidden flex-col justify-between overflow-hidden rounded-[32px] bg-linear-to-b from-black to-[#111113] p-10 text-white shadow-xl lg:flex border border-white/10">
            <div className="relative z-10 space-y-6">
              <div className="flex items-center gap-3">
                <div className="relative inline-flex size-10 shrink-0 overflow-hidden rounded-xl bg-white/10 p-2 backdrop-blur-sm">
                  <Image src="/logo.svg" alt="Registry Dashboard" fill className="object-contain p-1.5 invert" />
                </div>
                <span className="text-xs font-medium text-white/70">
                  Registry Dashboard
                </span>
              </div>

              <div className="max-w-md space-y-3 pt-6">
                <h1 className="text-4xl font-semibold tracking-tight text-white leading-[1.15]">
                  Manage container images with absolute precision.
                </h1>
                <p className="text-sm leading-relaxed text-white/65">
                  Unified catalog browsing, multi-arch manifest inspections, and granular image lifecycle control behind a secure proxy.
                </p>
              </div>
            </div>

            <div className="relative z-10 pt-12">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1.5 text-xs text-white/80 backdrop-blur-md">
                <span className="size-2 rounded-full bg-[#30D158] animate-pulse" />
                <span>Operator workspace • Docker Registry V2 & Hub</span>
              </div>
            </div>

            {/* Subtle Apple-style glow circle */}
            <div
              className="pointer-events-none absolute -bottom-24 -right-24 size-80 rounded-full bg-[#0071E3]/20 blur-3xl"
              aria-hidden="true"
            />
          </section>

          <section className="flex items-center justify-center">
            <div className="w-full max-w-md">
              <LoginForm />
            </div>
          </section>
        </div>
      </div>
    </main>
  )
}
