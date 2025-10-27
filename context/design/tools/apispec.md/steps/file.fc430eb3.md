---
timestamp: 'Sun Oct 26 2025 23:48:17 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251026_234817.9721d9f3.md]]'
content_id: fc430eb3607696ac6665d3e7320d07c22940bc7b1c08d6e98b0b7b7f2b70cf67
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

export default class FileConcept {
  private files: Collection<FileDocument>;

  constructor(private readonly db: Db) {
    this.files = this.db.collection(PREFIX + "files");
  }

  private requireBucket(): string {
    const bucket = Deno.env.get("GCS_BUCKET");
    if (!bucket) throw new Error("GCS_BUCKET env var is required");
    return bucket;
  }

  private safeName(name: string): string {
    // Basic sanitization: remove path traversal and spaces
    return name.replace(/\\/g, "").replace(/\/+/, "/").replace(/\s+/g, "-");
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
    const bucket = this.requireBucket();
    const base = `${user}/${Date.now()}-${this.safeName(filename)}`;
    const object = base;
    try {
      const uploadUrl = await generateV4SignedUrl({
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
    const bucket = this.requireBucket();

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
    const bucket = this.requireBucket();
    try {
      const url = await generateV4SignedUrl({
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
