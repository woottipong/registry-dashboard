import Link from "next/link"
import { Button } from "@/components/ui/button"
import { AlertCircleIcon, HomeIcon } from "lucide-react"

export default function NotFound() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-panel border-0 bg-card p-8 text-center space-y-6 shadow-panel">
        <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-secondary/80">
          <AlertCircleIcon className="size-7 text-muted-foreground" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Page not found</h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            The page you&apos;re looking for doesn&apos;t exist or may have been moved.
          </p>
        </div>
        <div className="pt-2">
          <Button asChild className="w-full rounded-control shadow-xs">
            <Link href="/">
              <HomeIcon className="mr-2 size-4" />
              Return to overview
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
