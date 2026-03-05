# Docker Registry HTTP API v2 Specification

## Overview

The **Docker Registry HTTP API v2** is the protocol that facilitates distribution of container images between docker engines and registry instances. This specification covers version 2 of the API, designed to improve performance, reduce bandwidth usage, and enhance security compared to the V1 API.

## Key Features

- **Namespace-oriented URI Layout** - Rich access control and authentication
- **PUSH/PULL operations** - V2 image manifest format support
- **Resumable layer uploads** - Handles network interruptions
- **Content addressability** - SHA256-based digest verification
- **HTTP caching and compression** - Performance optimizations

## URI Structure

All endpoints are prefixed with the API version and repository name:

```
/v2/<name>/
```

**Repository Name Rules:**
- Components separated by forward slashes (`/`)
- Each component: `[a-z0-9]+(?:[._-][a-z0-9]+)*`
- Total length < 256 characters
- Example: `library/ubuntu`, `myorg/myapp`

## Authentication & Authorization

### Token Authentication Flow

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

## Content Digests

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

## Core Endpoints

### API Version Check
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

### Repository Catalog
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

### Repository Tags
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

## References

- [Official Specification](https://distribution.github.io/distribution/spec/api/)
- [Manifest Format v2.2](https://distribution.github.io/distribution/spec/manifest-v2-2/)
- [Image Specification](https://github.com/docker/docker/blob/master/image/spec/v1.1.md)
- [Docker Registry Source](https://github.com/docker/distribution)

---

*This document summarizes the Docker Registry HTTP API v2 specification for practical implementation and reference.*
