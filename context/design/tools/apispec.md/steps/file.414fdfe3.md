---
timestamp: 'Thu Nov 06 2025 08:32:35 GMT-0500 (Eastern Standard Time)'
parent: '[[../20251106_083235.0e8e1422.md]]'
content_id: 414fdfe3e86a3d5e63cb750dbf729dc32f527deab7d3428e4c313f06d955c7d4
---

# file: src/concepts/File/FileConcept.ts

```typescript
import { Collection, Db } from "mongodb";
import { Empty as _Empty, ID } from "@utils/types.ts";
import { freshID } from "@utils/database.ts";
import { generateV4SignedUrl } from "@utils/gcs.ts";

const PREFIX = "File" + ".";

// Types for this concept
export type User = ID;
export type FileId = ID;

interface FileDocument {
  _id: FileId;
  owner: User;
  bucket: string;
  object: string; // GCS object path
  contentType?: string;
  size?: number;
  createdAt: Date;
}

type SignUrlFn = typeof generateV4SignedUrl;

export default class FileConcept {
  private files: Collection<FileDocument>;
  private readonly signUrl: SignUrlFn;

  constructor(private readonly db: Db, deps?: { signUrl?: SignUrlFn }) {
    this.files = this.db.collection(PREFIX + "files");
    this.signUrl = deps?.signUrl ?? generateV4SignedUrl;
  }

  private requireBucket(): string {
    const bucket = Deno.env.get("GCS_BUCKET");
    if (!bucket) throw new Error("GCS_BUCKET env var is required");
    return bucket;
  }

  private safeName(name: string): string {
    // Sanitize filename for object key:
    // - Remove path separators
    // - Replace whitespace with '-'
    // - Replace non [A-Za-z0-9._-] with '-'
    // - Collapse multiple '-'
    // - Trim leading/trailing '-'
    // - Fallback to 'file' if empty
    let s = name.replace(/[\\/]+/g, "-");
    s = s.replace(/\s+/g, "-");
    s = s.replace(/[^A-Za-z0-9._-]+/g, "-");
    s = s.replace(/-+/g, "-");
    s = s.replace(/^-+/, "").replace(/-+$/, "");
    if (!s) s = "file";
    return s;
  }

  // action: requestUploadUrl (user: User, filename: string, contentType?: string): { uploadUrl: string, bucket: string, object: string }
  async requestUploadUrl(
    input: {
      user: User;
      filename: string;
      contentType?: string;
      expiresInSeconds?: number;
    },
  ): Promise<
    { uploadUrl: string; bucket: string; object: string } | { error: string }
  > {
    const { user, filename, contentType: _contentType, expiresInSeconds } =
      input;
    if (!user) return { error: "User ID must be provided." };
    if (!filename) return { error: "filename is required" };
    let bucket: string;
    try {
      bucket = this.requireBucket();
    } catch (_) {
      return { error: "GCS_BUCKET env var is required" };
    }
    const base = `${user}/${Date.now()}-${this.safeName(filename)}`;
    const object = base;
    try {
      const uploadUrl = await this.signUrl({
        method: "PUT",
        bucket,
        object,
        expiresInSeconds: expiresInSeconds ?? 900,
      });
      return { uploadUrl, bucket, object };
    } catch (e) {
      console.error("Failed to generate upload URL:", e);
      return { error: "Failed to generate upload URL" };
    }
  }

  // action: confirmUpload (user: User, object: string, contentType?: string, size?: number): { file: FileId, url: string }
  async confirmUpload(
    input: { user: User; object: string; contentType?: string; size?: number },
  ): Promise<{ file: FileId; url: string } | { error: string }> {
    const { user, object, contentType, size } = input;
    if (!user) return { error: "User ID must be provided." };
    if (!object) return { error: "object is required" };
    let bucket: string;
    try {
      bucket = this.requireBucket();
    } catch (_) {
      return { error: "GCS_BUCKET env var is required" };
    }

    const fileId = freshID();
    const doc: FileDocument = {
      _id: fileId,
      owner: user,
      bucket,
      object,
      contentType,
      size,
      createdAt: new Date(),
    };
    try {
      await this.files.insertOne(doc);
      const url = `https://storage.googleapis.com/${bucket}/${object}`;
      return { file: fileId, url };
    } catch (e) {
      console.error("Failed to record file metadata:", e);
      return { error: "Failed to confirm upload" };
    }
  }

  // action: getViewUrl (user: User, object: string, expiresInSeconds?: number): { url: string }
  // Note: In a real app, verify access (owner or friend) before issuing the URL.
  async getViewUrl(
    input: { user: User; object: string; expiresInSeconds?: number },
  ): Promise<{ url: string } | { error: string }> {
    const { user, object, expiresInSeconds } = input;
    if (!user) return { error: "User ID must be provided." };
    if (!object) return { error: "object is required" };
    let bucket: string;
    try {
      bucket = this.requireBucket();
    } catch (_) {
      return { error: "GCS_BUCKET env var is required" };
    }
    try {
      const url = await this.signUrl({
        method: "GET",
        bucket,
        object,
        expiresInSeconds: expiresInSeconds ?? 300,
      });
      return { url };
    } catch (e) {
      console.error("Failed to generate view URL:", e);
      return { error: "Failed to generate view URL" };
    }
  }

  // Queries
  async _getFileById(
    input: { file: FileId },
  ): Promise<{ file?: FileDocument }> {
    const { file } = input;
    const found = await this.files.findOne({ _id: file });
    return { file: found ?? undefined };
  }

  /** Adapter for syncs: return file document array directly for Frames.query
   * signature: ({ file }) => FileDocument[]
   */
  async _getFileByIdForSync(input: { file: FileId }): Promise<FileDocument[]> {
    const r = await this._getFileById({ file: input.file });
    return r.file ? [r.file] : [];
  }

  async _getFilesByOwner(
    input: { user: User },
  ): Promise<{ files: FileDocument[] }> {
    const { user } = input;
    const files = await this.files.find({ owner: user }).sort({ createdAt: -1 })
      .toArray();
    return { files };
  }
}

```
