import {
  NotFoundError,
  UploadAuthError,
  ValidationError,
  getStoredAsset,
  storeUploadedAsset,
} from "@/media-assets";

export const dynamic = "force-dynamic";

export async function PUT(
  request: Request,
  { params }: { params: { assetId: string } },
) {
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
    return new Response(null, { status: 204 });
  } catch (error) {
    if (error instanceof ValidationError) {
      return Response.json(
        { error: { code: "VALIDATION_ERROR", message: error.message } },
        { status: 400 },
      );
    }
    if (error instanceof UploadAuthError) {
      return Response.json(
        { error: { code: "UNAUTHORIZED_UPLOAD", message: error.message } },
        { status: 403 },
      );
    }
    if (error instanceof NotFoundError) {
      return Response.json(
        { error: { code: "NOT_FOUND", message: error.message } },
        { status: 404 },
      );
    }
    return Response.json(
      { error: { code: "INTERNAL_ERROR", message: "Unexpected error" } },
      { status: 500 },
    );
  }
}

export async function GET(
  _request: Request,
  { params }: { params: { assetId: string } },
) {
  const asset = getStoredAsset(params.assetId);
  if (!asset) {
    return Response.json(
      { error: { code: "NOT_FOUND", message: "Asset not found" } },
      { status: 404 },
    );
  }
  const bodyBytes = Uint8Array.from(asset.bytes);
  return new Response(bodyBytes, {
    status: 200,
    headers: {
      "content-type": asset.contentType,
      "cache-control": "public, max-age=31536000, immutable",
    },
  });
}
