import { nowIso } from "./store";

interface PendingUpload {
  assetId: string;
  token: string;
  contentType: string;
  filename: string;
  expiresAt: string;
}

interface StoredAsset {
  assetId: string;
  contentType: string;
  filename: string;
  bytes: number[];
  createdAt: string;
}

declare global {
  // eslint-disable-next-line no-var
  var __MEOWSPACE_PENDING_UPLOADS__: Map<string, PendingUpload> | undefined;
  // eslint-disable-next-line no-var
  var __MEOWSPACE_STORED_ASSETS__: Map<string, StoredAsset> | undefined;
}

function randomId(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

function getPendingUploads(): Map<string, PendingUpload> {
  if (!globalThis.__MEOWSPACE_PENDING_UPLOADS__) {
    globalThis.__MEOWSPACE_PENDING_UPLOADS__ = new Map<string, PendingUpload>();
  }
  return globalThis.__MEOWSPACE_PENDING_UPLOADS__;
}

function getStoredAssets(): Map<string, StoredAsset> {
  if (!globalThis.__MEOWSPACE_STORED_ASSETS__) {
    globalThis.__MEOWSPACE_STORED_ASSETS__ = new Map<string, StoredAsset>();
  }
  return globalThis.__MEOWSPACE_STORED_ASSETS__;
}

export class ValidationError extends Error {}
export class NotFoundError extends Error {}
export class UploadAuthError extends Error {}

export interface UploadTicket {
  assetId: string;
  uploadUrl: string;
  publicUrl: string;
  expiresAt: string;
}

export function createUploadTicket(input: {
  filename: string;
  contentType: string;
}): UploadTicket {
  const filename = input.filename.trim();
  const contentType = input.contentType.trim().toLowerCase();
  if (!filename) {
    throw new ValidationError("filename is required");
  }
  if (!contentType) {
    throw new ValidationError("contentType is required");
  }
  if (!contentType.startsWith("image/") && !contentType.startsWith("video/")) {
    throw new ValidationError("Only image/* and video/* uploads are supported");
  }

  const assetId = randomId("asset");
  const token = randomId("token");
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
  getPendingUploads().set(assetId, {
    assetId,
    token,
    contentType,
    filename,
    expiresAt,
  });
  return {
    assetId,
    uploadUrl: `/api/media/assets/${assetId}?token=${token}`,
    publicUrl: `/api/media/assets/${assetId}`,
    expiresAt,
  };
}

export function storeUploadedAsset(input: {
  assetId: string;
  token: string;
  bytes: Uint8Array;
  contentType: string;
}): void {
  const pending = getPendingUploads().get(input.assetId);
  if (!pending) {
    throw new NotFoundError("Upload ticket not found");
  }
  if (pending.token !== input.token) {
    throw new UploadAuthError("Invalid upload token");
  }
  if (new Date(pending.expiresAt).getTime() < Date.now()) {
    getPendingUploads().delete(input.assetId);
    throw new UploadAuthError("Upload ticket expired");
  }
  if (!input.bytes.length) {
    throw new ValidationError("Upload payload cannot be empty");
  }

  getStoredAssets().set(input.assetId, {
    assetId: input.assetId,
    contentType: input.contentType || pending.contentType,
    filename: pending.filename,
    bytes: Array.from(input.bytes),
    createdAt: nowIso(),
  });
  getPendingUploads().delete(input.assetId);
}

export function getStoredAsset(assetId: string): StoredAsset | undefined {
  return getStoredAssets().get(assetId);
}
