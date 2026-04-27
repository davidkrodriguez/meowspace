# Meowspace API Contract

This document defines the shared HTTP contract for all `/api/*` endpoints.

## Request ID

- Every response includes an `x-request-id` header.
- If the caller sends `x-request-id`, the API echoes it back.
- If the caller does not send one, the API generates a UUID and returns it.

Use this ID to correlate client errors with server logs.

## Response Shapes

### Success envelope

Success responses include route-specific fields and always include `requestId`.

```json
{
  "requestId": "b5b93f7d-d4d5-4bbf-82d7-87f9d93ce36e",
  "...routeData": "..."
}
```

Examples:
- `GET /api/pets` -> `{ "pets": [...], "requestId": "..." }`
- `POST /api/posts` -> `{ "post": {...}, "requestId": "..." }`
- `GET /api/feed` -> `{ "items": [...], "nextCursor": null, "requestId": "..." }`

### Error envelope

All JSON errors use this shape:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid media type",
    "details": {}
  },
  "requestId": "b5b93f7d-d4d5-4bbf-82d7-87f9d93ce36e"
}
```

`details` is optional and only present when extra context is helpful.

## Error Codes

Common codes:

- `UNAUTHORIZED` -> missing/invalid auth (`401`)
- `PET_NOT_OWNED` -> auth user cannot mutate this pet (`403`)
- `UNAUTHORIZED_UPLOAD` -> invalid upload token (`403`)
- `VALIDATION_ERROR` -> bad payload or invalid field values (`400`)
- `INVALID_CURSOR` -> feed cursor is not valid JSON (`400`)
- `NOT_FOUND` -> requested resource does not exist (`404`)
- `INTERNAL_ERROR` -> unexpected failure (`500`)

## Notes by endpoint family

- `/api/media/assets/:assetId`:
  - `PUT` success is `204 No Content` and still includes `x-request-id` header.
  - `GET` serves binary bytes and includes `x-request-id` header.
- `/api/onboarding/hydration`:
  - Returns suggestions with top-level `requestId`.
