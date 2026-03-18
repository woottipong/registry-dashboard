"use client"

import Image from "next/image"
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
    <div className="w-full max-w-md space-y-6">
      <div className="text-center">
        <div className="relative mb-5 inline-flex size-16 items-center justify-center overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-xl">
          <Image src="/logo.svg" alt="Registry Dashboard" fill className="object-cover" />
        </div>
        <h1 className="text-[28px] font-semibold text-white mb-2 tracking-tight">
          Registry Dashboard
        </h1>
        <p className="text-slate-400 text-sm tracking-wide">
          Sign in to manage your container registries
        </p>
      </div>

      <div className="relative rounded-[24px] border border-slate-800/60 bg-slate-950/45 p-8 shadow-[0_8px_30px_rgb(0,0,0,0.2)] backdrop-blur-2xl">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="username" className="text-slate-400 font-medium text-[13px] ml-1">
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
              className="bg-slate-950/40 border-slate-800 text-white placeholder:text-slate-500 focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 h-11 rounded-[14px] transition-all duration-200 text-sm px-4 shadow-inner"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-slate-400 font-medium text-[13px] ml-1">
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
                className="bg-slate-950/40 border-slate-800 text-white placeholder:text-slate-500 focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 h-11 rounded-[14px] pr-12 transition-all duration-200 text-sm px-4 shadow-inner"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                disabled={isLoading}
              >
                {showPassword ? (
                  <EyeOffIcon className="w-[18px] h-[18px]" aria-hidden="true" />
                ) : (
                  <EyeIcon className="w-[18px] h-[18px]" aria-hidden="true" />
                )}
              </button>
            </div>
          </div>

          {error ? (
            <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 rounded-[14px] p-3">
              <AlertCircleIcon className="w-[18px] h-[18px] text-red-400 flex-shrink-0" />
              <p className="text-red-400 text-sm font-medium">{error}</p>
            </div>
          ) : null}

          <Button
            type="submit"
            className="mt-2 h-11 w-full rounded-[14px] bg-indigo-600 font-medium text-white shadow-lg shadow-indigo-600/20 transition-all duration-300 hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2Icon className="w-[18px] h-[18px] mr-2 motion-safe:animate-spin" />
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
