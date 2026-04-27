import { NextResponse } from "next/server";
import { AuthError } from "../auth";
import {
  NotFoundError as PetNotFoundError,
  ValidationError as PetsValidationError,
} from "../api/pets";
import {
  AuthorizationError,
  ValidationError as PostsValidationError,
} from "../api/posts";
import {
  NotFoundError as FollowNotFoundError,
  ValidationError as FollowsValidationError,
} from "../api/follows";

export function domainErrorResponse(error: unknown): NextResponse {
  if (error instanceof AuthError) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: error.message } },
      { status: 401 },
    );
  }
  if (error instanceof AuthorizationError) {
    return NextResponse.json(
      { error: { code: error.message, message: "Forbidden" } },
      { status: 403 },
    );
  }
  if (
    error instanceof PetsValidationError ||
    error instanceof PostsValidationError ||
    error instanceof FollowsValidationError
  ) {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: error.message } },
      { status: 400 },
    );
  }
  if (error instanceof PetNotFoundError || error instanceof FollowNotFoundError) {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: error.message } },
      { status: 404 },
    );
  }
  console.error(error);
  return NextResponse.json(
    { error: { code: "INTERNAL_ERROR", message: "Unexpected error" } },
    { status: 500 },
  );
}
