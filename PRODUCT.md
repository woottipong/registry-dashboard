# Registry Dashboard

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

People browsing and managing Docker container registries. The user confirmed that finding a repository and inspecting its tags and images is the primary task.

## Product Purpose

A self-hosted dashboard for browsing and managing images across multiple Docker Registry V2 compatible registries, including Docker Hub.

## Operating Context

Registry → namespace → repository → tag/image inspection. Registry configuration and destructive operations are secondary tasks.

## Capabilities and Constraints

Preserve existing routes, provider capability checks, authentication, CSRF protections, and registry traffic through the existing server-side API. Use the existing Next.js, Tailwind and shadcn stack. User requests English-only UI and a dark-only theme. Maintain keyboard and mobile access.

## Brand Commitments

Existing product name and logo. The user approved a supplied navy dashboard reference for its palette, layered surfaces and restrained component finish. Keep a navy dark-only system, clear blue actions and compact corners; retain the established functional workflows.

## Evidence on Hand

Local development data and existing product screens. The latest supplied HealthFlow screenshot is a visual reference for color and surface treatment; its patient Kanban layout is outside this product's workflow. Do not invent registry health, statistics, or capabilities.

## Product Principles

- Make repository discovery and image inspection the primary path.
- Distinguish unknown and failed data from confirmed zero values.
- Make destructive consequences explicit.
- Keep the same visual conventions across operational screens.
