import { formatDate } from "@/lib/format"

interface FormattedDateProps {
  date: string | number | Date
  className?: string
  fallback?: string
}

export function FormattedDate({ date, className, fallback = "—" }: FormattedDateProps) {
  let formatted = fallback
  if (date) {
    try {
      formatted = formatDate(date)
    } catch {
      // Ignored
    }
  }

  // suppressHydrationWarning is the Next.js recommended way to handle dates that change between server and client
  return (
    <span className={className} suppressHydrationWarning>
      {formatted}
    </span>
  )
}
