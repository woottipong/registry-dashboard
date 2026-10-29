# Registry Dashboard

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

People browsing and managing Docker container registries. Finding a repository and inspecting its tags, manifests, and image layers is the primary task.

## Product Purpose

A self-hosted dashboard for browsing and managing images across multiple Docker Registry V2 compatible registries, including Docker Hub.

## Positioning

Lightweight self-hosted registry operations dashboard operating strictly behind a secure BFF proxy with zero external database dependencies and atomic file persistence.

## Operating Context

Registry -> namespace -> repository -> tag/image inspection. Registry configuration and destructive operations are secondary tasks.

## Capabilities and Constraints

Preserve existing routes, provider capability checks, authentication, CSRF protections, and registry traffic through the existing server-side BFF proxy (`/api/v1/*`). Use Next.js 16 App Router, React 19, TypeScript strict mode, Tailwind CSS v4, and shadcn/ui. All server-side data persistence uses atomic POSIX file writes with automatic backup snapshot recovery (`AtomicJsonStore<T>`). All registry catalog discovery uses namespace-first querying and in-memory catalog caching with automatic 401 token refresh. The UI is English-only and dark-only. Maintain full keyboard navigation and mobile viewport accessibility.

## Brand Commitments

Existing product name and logo. Carbon Dark design system inspired by the Doorlog operations dashboard reference: high-contrast Carbon and Slate Black palette, two-column layout, top KPI stat strip, clear blue action accents, compact corners, and restrained component finish. Retain established functional workflows.

## Evidence on Hand

Local development data and existing product screens. The Doorlog reference defines surface treatment, KPI stat strip, dense inventory table, and right-hand inspector widgets. Do not invent registry health, statistics, or capabilities.

## Product Principles

- Make repository discovery and image inspection the primary path.
- Distinguish unknown and failed data from confirmed zero values.
- Make destructive consequences explicit with multi-step confirmation and rate limiting.
- Keep the same visual conventions and density across operational screens.
