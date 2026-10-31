import { toast } from "sonner"

export async function copyToClipboard(value: string, successMessage?: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(value)
    if (successMessage) toast.success(successMessage)
    return true
  } catch {
    toast.error("Couldn't copy to clipboard. Check clipboard permissions and try again.")
    return false
  }
}
