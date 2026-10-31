# Registry Dashboard

Self-hosted web dashboard for browsing and managing Docker container images across Docker Registry V2 compatible registries and Docker Hub.

## Language

**Registry**:
A remote or local container registry service endpoint providing Docker Registry V2 and provider-specific APIs.
_Avoid_: Server, host, Docker daemon

**Namespace**:
A logical grouping of repositories within a registry (e.g., user, team, or `library`). The sentinel `_root` denotes the empty root namespace.
_Avoid_: Folder, project, directory

**Repository**:
A named collection of container image tags sharing an identity path within a namespace.
_Avoid_: Image name, package, container

**Tag**:
A named reference pointing to a specific container image manifest digest.
_Avoid_: Version, release, label

**Digest**:
An immutable content-addressable cryptographic hash (typically SHA-256) of an image manifest or blob.
_Avoid_: Checksum, signature, image ID

**Manifest**:
A JSON document defining a container image's layer blobs, architecture, OS, and configuration.
_Avoid_: Image descriptor, recipe

**BFF (Backend for Frontend)**:
The Next.js server-side route layer (`/api/v1/*`) that handles registry authentication, CSRF, rate-limiting, and error shaping before proxying upstream.
_Avoid_: Gateway, direct client

