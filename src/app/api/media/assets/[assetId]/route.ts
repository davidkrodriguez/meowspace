import {
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
    const contentType =
      request.headers.get("content-type")?.trim() || "application/octet-stream";
    const bytes = new Uint8Array(await request.arrayBuffer());
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
