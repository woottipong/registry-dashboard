"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AlertCircleIcon, EyeIcon, EyeOffIcon, Loader2Icon, HexagonIcon } from "lucide-react"

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
        headers: { "Content-Type": "application/json" },
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
    <div className="w-full max-w-md space-y-8">
      {/* Header */}
      <div className="text-center relative z-20">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl mb-6 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/10 to-transparent"></div>
          <HexagonIcon className="w-7 h-7 text-indigo-400 relative z-10 group-hover:scale-110 transition-transform duration-500" strokeWidth={1.5} />
        </div>
        <h1 className="text-[28px] font-semibold text-white mb-2 tracking-tight">
          Registry Dashboard
        </h1>
        <p className="text-slate-400 text-sm tracking-wide">
          Secure access to your container environment
        </p>
      </div>

      {/* Login Form */}
      <div className="relative z-20 bg-slate-900/40 backdrop-blur-3xl border border-slate-800/60 rounded-[24px] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.2)]">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2.5">
            <Label htmlFor="username" className="text-slate-400 font-medium text-[13px] ml-1">
              Username
            </Label>
            <Input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              required
              disabled={isLoading}
              className="bg-slate-950/40 border-slate-800 text-white placeholder:text-slate-500 focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 h-11 rounded-[14px] transition-all duration-200 text-sm px-4 shadow-inner"
            />
          </div>

          <div className="space-y-2.5">
            <Label htmlFor="password" className="text-slate-400 font-medium text-[13px] ml-1">
              Password
            </Label>
            <div className="relative group">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
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
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                disabled={isLoading}
              >
                {showPassword ? (
                  <EyeOffIcon className="w-[18px] h-[18px]" />
                ) : (
                  <EyeIcon className="w-[18px] h-[18px]" />
                )}
              </button>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 rounded-[14px] p-3">
              <AlertCircleIcon className="w-[18px] h-[18px] text-red-400 flex-shrink-0" />
              <p className="text-red-400 text-sm font-medium">{error}</p>
            </div>
          )}

          <Button
            type="submit"
            className="w-full h-11 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-[14px] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed mt-4 shadow-lg shadow-indigo-600/20"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2Icon className="w-[18px] h-[18px] mr-2 animate-spin" />
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
