import { describe, expect, it, vi } from "vitest"
import { logout } from "@/lib/logout"

describe("logout", () => {
  it("redirects to login after a successful logout response", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ success: true, data: null, error: null }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    )
    const onLoggedOut = vi.fn()
    const onFailedRefresh = vi.fn()

    await logout({ fetchImpl, onLoggedOut, onFailedRefresh })

    expect(fetchImpl).toHaveBeenCalledWith("/api/auth/logout", {
      method: "POST",
      headers: { "X-Requested-With": "XMLHttpRequest" },
      cache: "no-store",
    })
    expect(onLoggedOut).toHaveBeenCalled()
    expect(onFailedRefresh).not.toHaveBeenCalled()
  })

  it("refreshes the current route when logout fails", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ success: false, data: null, error: { message: "Nope" } }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }),
    )
    const onLoggedOut = vi.fn()
    const onFailedRefresh = vi.fn()

    await logout({ fetchImpl, onLoggedOut, onFailedRefresh })

    expect(onLoggedOut).not.toHaveBeenCalled()
    expect(onFailedRefresh).toHaveBeenCalled()
  })
})
