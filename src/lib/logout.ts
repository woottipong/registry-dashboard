interface LogoutOptions {
  fetchImpl?: typeof fetch
  onLoggedOut: () => void
  onFailedRefresh: () => void
}

export async function logout({
  fetchImpl = fetch,
  onLoggedOut,
  onFailedRefresh,
}: LogoutOptions): Promise<void> {
  try {
    const response = await fetchImpl("/api/auth/logout", {
      method: "POST",
      headers: { "X-Requested-With": "XMLHttpRequest" },
      cache: "no-store",
    })

    if (!response.ok) {
      throw new Error(`Logout failed with status ${response.status}`)
    }

    onLoggedOut()
  } catch (error) {
    console.error("Logout failed:", error)
    onFailedRefresh()
  }
}
