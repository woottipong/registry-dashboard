"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AlertCircleIcon, EyeIcon, EyeOffIcon, Loader2Icon } from "lucide-react"

export function LoginForm() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Requested-With": "XMLHttpRequest" },
        body: JSON.stringify({ username: username.trim(), password }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        router.push("/")
        router.refresh()
      } else {
        setError(data.error?.message ?? "Login failed")
      }
    } catch {
      setError("Network error. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full max-w-sm space-y-5">
      <div className="space-y-2 lg:hidden">
        <h1 className="text-[1.9rem] font-semibold tracking-tight text-foreground">Sign In</h1>
        <p className="text-sm text-muted-foreground">Continue into the registry workspace.</p>
      </div>

      <div className="rounded-[24px] border border-border/70 bg-card p-6 shadow-[0_16px_36px_rgba(15,23,42,0.04)]">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="username" className="ml-1 text-[13px] font-medium text-muted-foreground">
              Username
            </Label>
            <Input
              id="username"
              type="text"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              required
              disabled={isLoading}
              className="h-11 rounded-xl border-border/70 bg-background text-sm shadow-none transition-all duration-200"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="ml-1 text-[13px] font-medium text-muted-foreground">
              Password
            </Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                disabled={isLoading}
                className="h-11 rounded-xl border-border/70 bg-background pr-12 text-sm shadow-none transition-all duration-200"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                disabled={isLoading}
              >
                {showPassword ? (
                  <EyeOffIcon className="size-[18px]" aria-hidden="true" />
                ) : (
                  <EyeIcon className="size-[18px]" aria-hidden="true" />
                )}
              </button>
            </div>
          </div>

          {error ? (
            <div className="flex items-center gap-3 rounded-xl border border-destructive/20 bg-destructive/10 p-3">
              <AlertCircleIcon className="size-[18px] shrink-0 text-destructive" />
              <p className="text-sm font-medium text-destructive">{error}</p>
            </div>
          ) : null}

          <Button
            type="submit"
            className="mt-2 h-11 w-full rounded-xl"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2Icon className="mr-2 size-[18px] motion-safe:animate-spin" />
                Signing In...
              </>
            ) : (
              "Sign In"
            )}
          </Button>
        </form>
      </div>
    </div>
  )
}
