import { NextResponse } from "next/server";
import { getFeed } from "@/api/feed";
import { domainErrorResponse } from "@/lib/http-error";
import { authFromRequest } from "@/lib/request-auth";
import type { Cursor } from "@/types";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limitRaw = searchParams.get("limit");
    const parsedLimit =
      limitRaw !== null && limitRaw !== ""
        ? Number.parseInt(limitRaw, 10)
        : undefined;
    const limit =
      parsedLimit !== undefined && Number.isFinite(parsedLimit)
        ? parsedLimit
        : undefined;

    let cursor: Cursor | undefined;
    const cursorRaw = searchParams.get("cursor");
    if (cursorRaw) {
      try {
        cursor = JSON.parse(cursorRaw) as Cursor;
      } catch {
        return NextResponse.json(
          {
            error: {
              code: "INVALID_CURSOR",
              message: "cursor must be JSON with createdAt and id",
            },
          },
          { status: 400 },
        );
      }
    }

    const page = await getFeed(authFromRequest(request), { limit, cursor });
    return NextResponse.json(page);
  } catch (e) {
    return domainErrorResponse(e);
  }
}
