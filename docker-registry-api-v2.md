# Docker Registry HTTP API v2 & Manifest v2.2 Specification

## Overview

This document provides comprehensive specifications for:
- **Docker Registry HTTP API v2** - The protocol for container image distribution
- **Docker Image Manifest v2.2** - The format for container image manifests

## Docker Registry HTTP API v2

### Key Features

- **Namespace-oriented URI Layout** - Rich access control and authentication
- **PUSH/PULL operations** - V2 image manifest format support
- **Resumable layer uploads** - Handles network interruptions
- **Content addressability** - SHA256-based digest verification
- **HTTP caching and compression** - Performance optimizations

### URI Structure

All endpoints are prefixed with the API version and repository name:

```
/v2/<name>/
```

**Repository Name Rules:**
- Components separated by forward slashes (`/`)
- Each component: `[a-z0-9]+(?:[._-][a-z0-9]+)*`
- Total length < 256 characters
- Example: `library/ubuntu`, `myorg/myapp`

### Authentication & Authorization

#### Token Authentication Flow

1. **Challenge Response:**
   ```http
   WWW-Authenticate: Bearer realm="https://auth.docker.io/token",service="registry.docker.io",scope="repository:repo:pull,push"
   ```

2. **Token Request:**
   ```http
   GET /token?service=registry.docker.io&scope=repository:repo:pull,push
   ```

3. **API Access:**
   ```http
   Authorization: Bearer <token>
   ```

### Content Digests

**Format:** `algorithm:hex`
- **Algorithm:** SHA256 (recommended)
- **Examples:**
  - `sha256:6c3c624b58dbbcd3c0dd82b4c53f04194d1247c6eebdaab7c610cf7d66709b3b`
  - `sha512:...`

**Verification Headers:**
```
Docker-Content-Digest: sha256:...
Content-Length: 1234
```

### Core Endpoints

#### API Version Check
```http
GET /v2/
```
- **200 OK** → V2 API supported
- **401 Unauthorized** → Authentication required
- **404 Not Found** → V2 API not supported

**Required Header:**
```
Docker-Distribution-API-Version: registry/2.0
```

#### Repository Catalog
```http
GET /v2/_catalog?n=<limit>&last=<last>
```
**Response:**
```json
{
  "repositories": [
    "library/ubuntu",
    "library/nginx",
    "myorg/myapp"
  ]
}
```

#### Repository Tags
```http
GET /v2/<name>/tags/list?n=<limit>&last=<last>
```
**Response:**
```json
{
  "name": "library/ubuntu",
  "tags": ["latest", "20.04", "18.04"]
}
```

## Manifest Operations

### Pull Manifest
```http
GET /v2/<name>/manifests/<reference>
Accept: application/vnd.docker.distribution.manifest.v2+json
```

**Reference Types:**
- Tag: `latest`, `v1.0`
- Digest: `sha256:...`

**Response Headers:**
```
Content-Type: application/vnd.docker.distribution.manifest.v2+json
Docker-Content-Digest: sha256:...
Content-Length: 1234
```

### Check Manifest Existence
```http
HEAD /v2/<name>/manifests/<reference>
```

### Push Manifest
```http
PUT /v2/<name>/manifests/<reference>
Content-Type: application/vnd.docker.distribution.manifest.v2+json
```

**Request Body:** Complete manifest JSON

### Delete Manifest
```http
DELETE /v2/<name>/manifests/<reference>
```
⚠️ **Not supported by Docker Hub**

## Blob Operations

### Pull Blob
```http
GET /v2/<name>/blobs/<digest>
```

**Features:**
- **HTTP Caching** support (ETags, Last-Modified)
- **Range Requests** for resumable downloads
- **Redirects** (307/302) for CDN support

### Check Blob Existence
```http
HEAD /v2/<name>/blobs/<digest>
```

### Push Blob (3-Step Process)

#### 1. Initiate Upload
```http
POST /v2/<name>/blobs/uploads/
```
**Response:**
```http
202 Accepted
Location: /v2/<name>/blobs/uploads/<uuid>
Docker-Upload-UUID: <uuid>
Range: bytes=0-0
```

#### 2. Upload Data
**Option A - Monolithic Upload:**
```http
PUT /v2/<name>/blobs/uploads/<uuid>?digest=<digest>
Content-Type: application/octet-stream
```

**Option B - Chunked Upload:**
```http
PATCH /v2/<name>/blobs/uploads/<uuid>
Content-Range: bytes=0-1023
Content-Type: application/octet-stream
```

#### 3. Complete Upload
```http
PUT /v2/<name>/blobs/uploads/<uuid>?digest=<digest>
Content-Length: 0
```

**Success Response:**
```http
201 Created
Location: /v2/<name>/blobs/<digest>
Docker-Content-Digest: <digest>
```

### Cancel Upload
```http
DELETE /v2/<name>/blobs/uploads/<uuid>
```

### Cross-Repository Blob Mount
```http
POST /v2/<name>/blobs/uploads/?mount=<digest>&from=<source-repo>
```

### Delete Blob
```http
DELETE /v2/<name>/blobs/<digest>
```
⚠️ **Not supported by most registries**

## Error Handling

### Error Response Format
```json
{
  "errors": [
    {
      "code": "ERROR_CODE",
      "message": "Human readable message",
      "detail": {
        "additional": "context"
      }
    }
  ]
}
```

### Common Error Codes

| Code | Description |
|------|-------------|
| `BLOB_UNKNOWN` | Referenced blob doesn't exist |
| `BLOB_UPLOAD_INVALID` | Upload session invalid |
| `DIGEST_INVALID` | Provided digest doesn't match content |
| `MANIFEST_BLOB_UNKNOWN` | Manifest references unknown blob |
| `MANIFEST_INVALID` | Manifest format/structure invalid |
| `MANIFEST_UNKNOWN` | Referenced manifest doesn't exist |
| `MANIFEST_UNVERIFIED` | Manifest signature verification failed |
| `NAME_INVALID` | Repository name invalid |
| `NAME_UNKNOWN` | Repository doesn't exist |
| `SIZE_INVALID` | Content size doesn't match expected |
| `TAG_INVALID` | Tag format invalid |
| `UNAUTHORIZED` | Authentication required |
| `UNSUPPORTED` | Operation not supported |
| `TOOMANYREQUESTS` | Rate limit exceeded |

## Pull Workflow

1. **Check API Version:** `GET /v2/`
2. **Get Manifest:** `GET /v2/<name>/manifests/<tag>`
3. **Verify Signature:** Client-side verification
4. **Download Layers:** `GET /v2/<name>/blobs/<digest>` (parallel)
5. **Verify Digests:** Ensure content integrity

## Push Workflow

1. **Check Layer Existence:** `HEAD /v2/<name>/blobs/<digest>`
2. **Upload Missing Layers:**
   - `POST /v2/<name>/blobs/uploads/` (initiate)
   - `PATCH/PUT ...` (upload data)
   - `PUT ?digest=...` (complete)
3. **Upload Manifest:** `PUT /v2/<name>/manifests/<tag>`

## Advanced Features

### Resumable Uploads
- **Range Header:** Tracks upload progress
- **Content-Range:** Specifies chunk boundaries
- **Status Checks:** `GET /v2/.../blobs/uploads/<uuid>`

### Layer Deduplication
- Check existing layers before upload
- Cross-repository blob mounting
- Prevents duplicate uploads

### Content Verification
- **Client-side digest calculation**
- **Server verification** of uploaded content
- **Manifest signature validation**

## Implementation Notes

### HTTP Semantics
- **Caching:** All endpoints support aggressive HTTP caching
- **Compression:** gzip/deflate support recommended
- **Range Requests:** Required for blob downloads
- **Redirects:** Handle 307/302 responses

### Security Considerations
- **Digest Verification:** Always verify downloaded content
- **Manifest Signing:** Validate signatures before trust
- **TLS:** All communications should use HTTPS
- **Authentication:** Use token-based auth when required

### Performance Optimizations
- **Parallel Downloads:** Multiple blob downloads simultaneously
- **Caching:** Leverage HTTP caching headers
- **Resumable Transfers:** Handle network interruptions gracefully
- **Layer Deduplication:** Avoid redundant uploads

## Registry Variations

### Docker Hub
- ✅ Full V2 API support
- ❌ Manifest/Blob deletion
- ⚠️ Rate limiting (anonymous users)

### Docker Registry (Open Source)
- ✅ Full V2 API support
- ✅ Configurable deletion support
- ✅ Custom authentication backends

### Cloud Registries (ECR, GCR, ACR)
- ✅ Full V2 API compatibility
- ✅ Integrated authentication
- ✅ Advanced security features

## Migration from V1

**Key Improvements:**
- **Self-contained manifests** - No external dependencies
- **Content addressability** - SHA256-based verification
- **Resumable uploads** - Network interruption handling
- **Better caching** - HTTP semantics utilization
- **Simplified architecture** - Reduced backend complexity

---

# Docker Image Manifest v2.2 Format

The Docker Registry API v2 uses the **Image Manifest Version 2, Schema 2** format for container images. This specification defines two primary manifest types: **Image Manifests** and **Manifest Lists** (fat manifests).

## Media Types

The following media types are used by the manifest formats:

- `application/vnd.docker.distribution.manifest.v2+json`: Image manifest format (schemaVersion = 2)
- `application/vnd.docker.distribution.manifest.list.v2+json`: Manifest list, aka "fat manifest"
- `application/vnd.docker.container.image.v1+json`: Container config JSON
- `application/vnd.docker.image.rootfs.diff.tar.gzip`: Layer, as a gzipped tar
- `application/vnd.docker.image.rootfs.foreign.diff.tar.gzip`: Foreign layer (never pushed)
- `application/vnd.docker.plugin.v1+json`: Plugin config JSON

## Manifest List (Fat Manifest)

Manifest lists enable **multi-architecture images** by referencing platform-specific image manifests. Clients distinguish manifest lists from image manifests via the `Content-Type` header.

### Manifest List Structure

```json
{
  "schemaVersion": 2,
  "mediaType": "application/vnd.docker.distribution.manifest.list.v2+json",
  "manifests": [
    {
      "mediaType": "application/vnd.docker.distribution.manifest.v2+json",
      "digest": "sha256:e692418e4cbaf90ca69d05a66403747baa33ee08806650b51fab815ad7fc331f",
      "size": 7143,
      "platform": {
        "architecture": "ppc64le",
        "os": "linux"
      }
    },
    {
      "mediaType": "application/vnd.docker.distribution.manifest.v2+json",
      "digest": "sha256:5b0bcabd1ed22e9fb1310cf6c2dec7cdef19f0ad69efa1f392e94a4333501270",
      "size": 7682,
      "platform": {
        "architecture": "amd64",
        "os": "linux",
        "features": ["sse4"]
      }
    }
  ]
}
```

### Manifest List Fields

| Field | Type | Description |
|-------|------|-------------|
| `schemaVersion` | int | Manifest schema version (always 2) |
| `mediaType` | string | `application/vnd.docker.distribution.manifest.list.v2+json` |
| `manifests` | array | List of platform-specific manifests |

### Platform Object Fields

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `architecture` | string | CPU architecture | `amd64`, `ppc64le`, `arm64` |
| `os` | string | Operating system | `linux`, `windows`, `darwin` |
| `os.version` | string | OS version | `10.0.10586` |
| `os.features` | array | Required OS features | `["win32k"]` |
| `variant` | string | CPU variant | `v6`, `v7`, `v8` |
| `features` | array | Required CPU features | `["sse4", "aes"]` |

## Image Manifest

Image manifests provide configuration and layer references for container images. They replace the deprecated Schema 1 format.

### Image Manifest Structure

```json
{
  "schemaVersion": 2,
  "mediaType": "application/vnd.docker.distribution.manifest.v2+json",
  "config": {
    "mediaType": "application/vnd.docker.container.image.v1+json",
    "digest": "sha256:b5b2b2c507a0944348e0303114d8d93aaaa081732b86451d9bce1f432a537bc7",
    "size": 7023
  },
  "layers": [
    {
      "mediaType": "application/vnd.docker.image.rootfs.diff.tar.gzip",
      "digest": "sha256:e692418e4cbaf90ca69d05a66403747baa33ee08806650b51fab815ad7fc331f",
      "size": 32654
    },
    {
      "mediaType": "application/vnd.docker.image.rootfs.diff.tar.gzip",
      "digest": "sha256:3c3a4604a545cdc127456d94e421cd355bca5b528f4a9c1905b15da2eb4a4c6b",
      "size": 16724
    },
    {
      "mediaType": "application/vnd.docker.image.rootfs.diff.tar.gzip",
      "digest": "sha256:ec4b8955958665577945c89419d1af06b5f7636b4ac3da7f12184802ad867736",
      "size": 73109
    }
  ]
}
```

### Image Manifest Fields

| Field | Type | Description |
|-------|------|-------------|
| `schemaVersion` | int | Manifest schema version (always 2) |
| `mediaType` | string | `application/vnd.docker.distribution.manifest.v2+json` |
| `config` | object | Container configuration reference |
| `layers` | array | Layer references (base → top, opposite of Schema 1) |

### Config Object

References the container configuration blob:

| Field | Type | Description |
|-------|------|-------------|
| `mediaType` | string | `application/vnd.docker.container.image.v1+json` |
| `digest` | string | SHA256 digest of config blob |
| `size` | int | Size in bytes |

### Layer Objects

References filesystem layer blobs (ordered from base to top):

| Field | Type | Description |
|-------|------|-------------|
| `mediaType` | string | Usually `application/vnd.docker.image.rootfs.diff.tar.gzip` |
| `digest` | string | SHA256 digest of layer blob |
| `size` | int | Size in bytes |
| `urls` | array | Optional: Alternative download URLs |

**Note:** Layers are ordered **base to top** (opposite of Schema 1)

## Manifest Validation

**Client Validation Steps:**
1. Verify manifest `schemaVersion` = 2
2. Check `mediaType` matches expected type
3. Validate all referenced digests exist
4. Verify config and layer sizes match actual content
5. Ensure layers are in correct order (base → top)

## Content Addressability

Schema 2 enables **content-addressable images** where:
- Image ID is derived from config digest
- No external metadata dependencies
- Deterministic image identification
- Improved security and caching

## Backward Compatibility

Schema 2 manifests are **not backward compatible** with V1 clients. Use manifest lists for multi-platform support when clients support both formats.

## References

- [Official Registry API v2](https://distribution.github.io/distribution/spec/api/)
- [Image Manifest v2.2 Specification](https://distribution.github.io/distribution/spec/manifest-v2-2/)
- [Image Specification v1.1](https://github.com/docker/docker/blob/master/image/spec/v1.1.md)
- [Docker Registry Source](https://github.com/docker/distribution)

---

*This document provides complete specifications for Docker Registry HTTP API v2 and Image Manifest v2.2 formats.*
