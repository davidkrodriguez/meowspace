import { AuthError } from "../auth";
import { errorResponse } from "./api-response";
import {
  AuthorizationError as PetsAuthorizationError,
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

export function domainErrorResponse(error: unknown, requestId: string) {
  if (error instanceof AuthError) {
    return errorResponse({
      code: "UNAUTHORIZED",
      message: error.message,
      status: 401,
      requestId,
    });
  }
  if (error instanceof AuthorizationError || error instanceof PetsAuthorizationError) {
    return errorResponse({
      code: error.message,
      message: "Forbidden",
      status: 403,
      requestId,
    });
  }
  if (
    error instanceof PetsValidationError ||
    error instanceof PostsValidationError ||
    error instanceof FollowsValidationError
  ) {
    return errorResponse({
      code: "VALIDATION_ERROR",
      message: error.message,
      status: 400,
      requestId,
    });
  }
  if (error instanceof PetNotFoundError || error instanceof FollowNotFoundError) {
    return errorResponse({
      code: "NOT_FOUND",
      message: error.message,
      status: 404,
      requestId,
    });
  }
  console.error(error);
  return errorResponse({
    code: "INTERNAL_ERROR",
    message: "Unexpected error",
    status: 500,
    requestId,
  });
}
