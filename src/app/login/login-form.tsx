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
    <div className="w-full space-y-4">
      <div className="space-y-1 lg:hidden">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Sign In</h1>
        <p className="text-sm text-muted-foreground">Continue into the registry workspace.</p>
      </div>

      <div className="rounded-[32px] p-8 shadow-[0_12px_44px_rgba(0,0,0,0.06)] border bg-[#1C1C1E] border-white/[0.08]">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <Label htmlFor="username" className="text-xs font-medium text-muted-foreground">
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
              className="h-11 rounded-xl text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-xs font-medium text-muted-foreground">
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
                className="h-11 rounded-xl pr-12 text-sm"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
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
            <div className="flex items-center gap-2.5 rounded-xl border border-destructive/20 bg-destructive/10 p-3">
              <AlertCircleIcon className="size-[18px] shrink-0 text-destructive" />
              <p className="text-xs font-medium text-destructive">{error}</p>
            </div>
          ) : null}

          <Button
            type="submit"
            className="mt-2 h-11 w-full rounded-full font-medium shadow-xs"
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
