# Docker Image Manifest v2.2 Specification Summary

## Overview

The **Docker Image Manifest Version 2, Schema 2** defines the format for container image manifests used by the Docker Registry HTTP API v2. This specification introduces content-addressable images and multi-architecture support through manifest lists.

## Media Types

| Media Type | Description |
|------------|-------------|
| `application/vnd.docker.distribution.manifest.v2+json` | Image manifest (schemaVersion = 2) |
| `application/vnd.docker.distribution.manifest.list.v2+json` | Manifest list (fat manifest) |
| `application/vnd.docker.container.image.v1+json` | Container configuration JSON |
| `application/vnd.docker.image.rootfs.diff.tar.gzip` | Layer (gzipped tar) |
| `application/vnd.docker.image.rootfs.foreign.diff.tar.gzip` | Foreign layer (never pushed) |
| `application/vnd.docker.plugin.v1+json` | Plugin configuration JSON |

## Manifest List (Fat Manifest)

Manifest lists enable **multi-architecture images** by referencing platform-specific image manifests. They allow a single image reference to work across different CPU architectures and operating systems.

### Structure
```json
{
  "schemaVersion": 2,
  "mediaType": "application/vnd.docker.distribution.manifest.list.v2+json",
  "manifests": [
    {
      "mediaType": "application/vnd.docker.distribution.manifest.v2+json",
      "digest": "sha256:...",
      "size": 7143,
      "platform": {
        "architecture": "amd64",
        "os": "linux"
      }
    }
  ]
}
```

### Fields

#### Root Level
- `schemaVersion`: Always `2`
- `mediaType`: `"application/vnd.docker.distribution.manifest.list.v2+json"`
- `manifests`: Array of platform-specific manifest references

#### Manifest Entry
- `mediaType`: `"application/vnd.docker.distribution.manifest.v2+json"`
- `digest`: SHA256 digest of the referenced manifest
- `size`: Size in bytes of the manifest
- `platform`: Platform specification object

#### Platform Object
- `architecture`: CPU architecture (`amd64`, `arm64`, `ppc64le`, etc.)
- `os`: Operating system (`linux`, `windows`, `darwin`)
- `os.version` (optional): OS version string
- `os.features` (optional): Array of required OS features
- `variant` (optional): CPU variant (`v6`, `v7`, `v8`)
- `features` (optional): Array of required CPU features (`sse4`, `aes`)

## Image Manifest

Image manifests provide the configuration and layer references for a single container image. They replace the deprecated Schema 1 format with content-addressable design.

### Structure
```json
{
  "schemaVersion": 2,
  "mediaType": "application/vnd.docker.distribution.manifest.v2+json",
  "config": {
    "mediaType": "application/vnd.docker.container.image.v1+json",
    "digest": "sha256:...",
    "size": 7023
  },
  "layers": [
    {
      "mediaType": "application/vnd.docker.image.rootfs.diff.tar.gzip",
      "digest": "sha256:...",
      "size": 32654
    }
  ]
}
```

### Fields

#### Root Level
- `schemaVersion`: Always `2`
- `mediaType`: `"application/vnd.docker.distribution.manifest.v2+json"`
- `config`: Reference to container configuration blob
- `layers`: Array of layer references (ordered base → top)

#### Config Reference
- `mediaType`: `"application/vnd.docker.container.image.v1+json"`
- `digest`: SHA256 digest of config blob
- `size`: Size in bytes

#### Layer Reference
- `mediaType`: Usually `"application/vnd.docker.image.rootfs.diff.tar.gzip"`
- `digest`: SHA256 digest of layer blob
- `size`: Size in bytes
- `urls` (optional): Alternative download URLs

## Key Differences from Schema 1

### Layer Ordering
- **Schema 1**: Layers ordered top → base (reverse chronological)
- **Schema 2**: Layers ordered base → top (chronological)

### Content Addressability
- **Schema 1**: Image ID based on metadata
- **Schema 2**: Image ID derived from config digest

### Self-Contained
- **Schema 1**: External metadata dependencies
- **Schema 2**: All information contained within manifest

## Validation Requirements

### Client Validation Steps
1. Verify `schemaVersion` = 2
2. Check `mediaType` matches expected type
3. Validate all referenced digests exist
4. Verify config and layer sizes match actual content
5. Ensure layers are in correct order (base → top)

### Content Verification
- SHA256 digest verification for all referenced content
- Size validation to prevent content truncation attacks
- Media type validation for format compliance

## Backward Compatibility

### Schema 2 Compatibility
- **NOT backward compatible** with V1 clients
- V1 clients cannot understand Schema 2 manifests
- Requires explicit content negotiation

### Migration Strategy
- Use manifest lists for multi-platform images
- Maintain V1 manifests alongside V2 where needed
- Gradual migration based on client capabilities

## Implementation Notes

### Content Negotiation
Clients should use `Accept` headers to specify supported manifest types:
```
Accept: application/vnd.docker.distribution.manifest.v2+json
```

### Digest Calculation
- SHA256 algorithm required for all digests
- Digest calculated over manifest/layer content
- Canonical JSON formatting for manifest digests

### Platform Selection
When pulling multi-platform images:
1. Check manifest list for available platforms
2. Select best matching platform for current system
3. Pull corresponding image manifest

## References

- [Official Manifest v2.2 Specification](https://distribution.github.io/distribution/spec/manifest-v2-2/)
- [Registry API v2](https://distribution.github.io/distribution/spec/api/)
- [Go Architecture Documentation](https://golang.org/doc/install/source)

---

## Quick Reference

### Manifest List Example
```json
{
  "schemaVersion": 2,
  "mediaType": "application/vnd.docker.distribution.manifest.list.v2+json",
  "manifests": [
    {"digest": "sha256:...", "size": 7143, "platform": {"architecture": "amd64", "os": "linux"}},
    {"digest": "sha256:...", "size": 7682, "platform": {"architecture": "arm64", "os": "linux"}}
  ]
}
```

### Image Manifest Example
```json
{
  "schemaVersion": 2,
  "mediaType": "application/vnd.docker.distribution.manifest.v2+json",
  "config": {"digest": "sha256:...", "size": 7023},
  "layers": [
    {"digest": "sha256:...", "size": 32654},
    {"digest": "sha256:...", "size": 16724}
  ]
}
```

### Platform Architectures
- `amd64` - x86-64
- `arm64` - ARM 64-bit
- `arm` - ARM 32-bit
- `ppc64le` - PowerPC 64-bit little-endian
- `s390x` - IBM System z
- `386` - x86 32-bit

*This summary covers the essential aspects of Docker Image Manifest v2.2 specification for practical implementation.*
