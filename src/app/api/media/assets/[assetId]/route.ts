import {
  MAX_UPLOAD_BYTES,
  NotFoundError,
  UploadAuthError,
  ValidationError,
  getStoredAsset,
  storeUploadedAsset,
} from "@/media-assets";
import { errorResponse, getRequestId } from "@/lib/api-response";

export const dynamic = "force-dynamic";

export async function PUT(
  request: Request,
  { params }: { params: { assetId: string } },
) {
  const requestId = getRequestId(request);
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token") ?? "";
    const contentLengthRaw = request.headers.get("content-length");
    const contentLength =
      contentLengthRaw !== null ? Number.parseInt(contentLengthRaw, 10) : NaN;
    if (Number.isFinite(contentLength) && contentLength > MAX_UPLOAD_BYTES) {
      throw new ValidationError(
        `Upload payload exceeds ${MAX_UPLOAD_BYTES} byte limit`,
      );
    }
    const contentType =
      request.headers.get("content-type")?.trim() || "application/octet-stream";
    if (!request.body) {
      throw new ValidationError("Upload payload cannot be empty");
    }
    const reader = request.body.getReader();
    const chunks: Uint8Array[] = [];
    let totalBytes = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (!value || !value.length) continue;
      totalBytes += value.length;
      if (totalBytes > MAX_UPLOAD_BYTES) {
        throw new ValidationError(
          `Upload payload exceeds ${MAX_UPLOAD_BYTES} byte limit`,
        );
      }
      chunks.push(value);
    }
    const bytes = new Uint8Array(totalBytes);
    let offset = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.length;
    }
    storeUploadedAsset({
      assetId: params.assetId,
      token,
      bytes,
      contentType,
    });
    return new Response(null, {
      status: 204,
      headers: { "x-request-id": requestId },
    });
  } catch (error) {
    if (error instanceof ValidationError) {
      return errorResponse({
        code: "VALIDATION_ERROR",
        message: error.message,
        status: 400,
        requestId,
      });
    }
    if (error instanceof UploadAuthError) {
      return errorResponse({
        code: "UNAUTHORIZED_UPLOAD",
        message: error.message,
        status: 403,
        requestId,
      });
    }
    if (error instanceof NotFoundError) {
      return errorResponse({
        code: "NOT_FOUND",
        message: error.message,
        status: 404,
        requestId,
      });
    }
    return errorResponse({
      code: "INTERNAL_ERROR",
      message: "Unexpected error",
      status: 500,
      requestId,
    });
  }
}

export async function GET(
  request: Request,
  { params }: { params: { assetId: string } },
) {
  const requestId = getRequestId(request);
  const asset = getStoredAsset(params.assetId);
  if (!asset) {
    return errorResponse({
      code: "NOT_FOUND",
      message: "Asset not found",
      status: 404,
      requestId,
    });
  }
  const bodyBytes = Uint8Array.from(asset.bytes);
  return new Response(bodyBytes, {
    status: 200,
    headers: {
      "content-type": asset.contentType,
      "cache-control": "public, max-age=31536000, immutable",
      "x-request-id": requestId,
    },
  });
}
