import { NextResponse } from "next/server";
import { AuthError, resolveAuthenticatedUser } from "@/auth";
import {
  ValidationError,
  createUploadTicket,
} from "@/media-assets";
import { authFromRequest } from "@/lib/request-auth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await resolveAuthenticatedUser(authFromRequest(request));
    const body = (await request.json()) as Record<string, unknown>;
    const ticket = createUploadTicket({
      filename: String(body.filename ?? ""),
      contentType: String(body.contentType ?? ""),
    });
    return NextResponse.json({ ticket }, { status: 201 });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: error.message } },
        { status: 401 },
      );
    }
    if (error instanceof ValidationError) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: error.message } },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Unexpected error" } },
      { status: 500 },
    );
  }
}
