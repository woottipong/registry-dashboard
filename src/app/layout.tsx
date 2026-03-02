import type { Metadata } from "next"
import { Inter, JetBrains_Mono } from "next/font/google"
import { AppShell } from "@/components/layout/app-shell"
import { Providers } from "@/components/providers"
import "./globals.css"

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
})

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
})

export const metadata: Metadata = {
  title: {
    default: "Registry Dashboard",
    template: "%s | Registry Dashboard",
  },
  description:
    "A modern, self-hosted web dashboard for browsing and managing Docker container images across multiple registries.",
  keywords: ["docker", "registry", "container", "images", "dashboard", "self-hosted", "devops"],
  authors: [{ name: "Registry Dashboard" }],
  robots: { index: false, follow: false },
  openGraph: {
    title: "Registry Dashboard",
    description: "Browse and manage Docker container images across multiple registries.",
    type: "website",
    locale: "en_US",
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: "/apple-touch-icon.png",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased`}>
        <Providers>
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  )
}
