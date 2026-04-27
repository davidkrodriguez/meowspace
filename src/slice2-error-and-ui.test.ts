import { describe, expect, it, vi } from "vitest";
import HomePage from "./app/page";
import RootLayout, { metadata } from "./app/layout";
import { domainErrorResponse } from "./lib/http-error";
import { AuthorizationError, ValidationError as PostValidationError } from "./api/posts";

describe("slice 2 error mapper and app shell", () => {
  it("maps authorization and validation errors to 4xx responses", async () => {
    const authz = domainErrorResponse(new AuthorizationError("PET_NOT_OWNED"), "req_authz");
    expect(authz.status).toBe(403);
    await expect(authz.json()).resolves.toEqual({
      error: { code: "PET_NOT_OWNED", message: "Forbidden" },
      requestId: "req_authz",
    });

    const validation = domainErrorResponse(
      new PostValidationError("Invalid media type"),
      "req_validation",
    );
    expect(validation.status).toBe(400);
    await expect(validation.json()).resolves.toEqual({
      error: { code: "VALIDATION_ERROR", message: "Invalid media type" },
      requestId: "req_validation",
    });
  });

  it("maps unknown errors to 500 responses", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const response = domainErrorResponse(new Error("boom"), "req_unknown");
    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      error: { code: "INTERNAL_ERROR", message: "Unexpected error" },
      requestId: "req_unknown",
    });
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it("exports app metadata and renders simple app shell elements", () => {
    expect(metadata.title).toBe("meowspace");
    const page = HomePage();
    expect(page.props.children[0].props.children).toBe("meowspace");

    const wrapped = RootLayout({ children: "ok" });
    expect(wrapped.props.children.props.children).toBe("ok");
  });
});
