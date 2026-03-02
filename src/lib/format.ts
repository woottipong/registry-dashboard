const BYTE_UNITS = ["B", "KB", "MB", "GB", "TB"] as const

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) {
    throw new Error("formatBytes expects a non-negative finite number")
  }

  if (bytes === 0) {
    return "0 B"
  }

  const unitIndex = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    BYTE_UNITS.length - 1,
  )

  const value = bytes / 1024 ** unitIndex
  const roundedValue = value >= 100 ? value.toFixed(0) : value.toFixed(1)

  return `${roundedValue} ${BYTE_UNITS[unitIndex]}`
}

export function formatDate(input: string | number | Date): string {
  const date = new Date(input)

  if (Number.isNaN(date.getTime())) {
    throw new Error("formatDate expects a valid date input")
  }

  const now = Date.now()
  const diffMs = now - date.getTime()

  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" })

  const minute = 60 * 1000
  const hour = 60 * minute
  const day = 24 * hour

  let relative: string

  if (Math.abs(diffMs) < minute) {
    relative = rtf.format(Math.round(-diffMs / 1000), "second")
  } else if (Math.abs(diffMs) < hour) {
    relative = rtf.format(Math.round(-diffMs / minute), "minute")
  } else if (Math.abs(diffMs) < day) {
    relative = rtf.format(Math.round(-diffMs / hour), "hour")
  } else {
    relative = rtf.format(Math.round(-diffMs / day), "day")
  }

  const absolute = new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date)

  return `${relative} (${absolute})`
}

export function truncateDigest(digest: string, keep = 4): string {
  const [algorithm, hash] = digest.split(":")

  if (!algorithm || !hash) {
    return digest
  }

  if (hash.length <= keep) {
    return `${algorithm}:${hash}`
  }

  return `${algorithm}:${hash.slice(0, keep)}...`
}

interface PullCommandParams {
  registry?: string
  repository: string
  tag?: string
  digest?: string
}

export function generatePullCommand({
  registry,
  repository,
  tag,
  digest,
}: PullCommandParams): string {
  if (!repository) {
    throw new Error("generatePullCommand expects a repository")
  }

  const imagePath = registry ? `${registry}/${repository}` : repository

  if (digest) {
    return `docker pull ${imagePath}@${digest}`
  }

  return `docker pull ${imagePath}:${tag ?? "latest"}`
}
