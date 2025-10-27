import { Hono } from "hono";
import { getDb } from "@utils/database.ts";
import { walk } from "@std/fs/walk";
import { parseArgs } from "@std/cli/parse-args";
import { toFileUrl } from "@std/path/to-file-url";
import { generateV4SignedUrl } from "@utils/gcs.ts";

// Parse command-line arguments for port and base URL
const flags = parseArgs(Deno.args, {
  string: ["port", "baseUrl"],
  default: {
    port: "8000",
    baseUrl: "/api",
  },
});

const PORT = parseInt(flags.port, 10);
const BASE_URL = flags.baseUrl;
const CONCEPTS_DIR = "src/concepts";

/**
 * Main server function to initialize DB, load concepts, and start the server.
 */
async function main() {
  const [db] = await getDb();
  const app = new Hono();

  app.get("/", (c) => c.text("Concept Server is running."));

  // Storage: Generate GCS V4 pre-signed upload URL
  app.post(`${BASE_URL}/storage/gcs/upload-url`, async (c) => {
    try {
      const body = await c.req.json().catch(() => ({}));
      const bucket = String(body.bucket ?? "").trim();
      const object = String(body.object ?? "").trim();
      const expiresInSeconds = Number(body.expiresInSeconds ?? 900);
      if (!bucket || !object) {
        return c.json({ error: "bucket and object are required" }, 400);
      }
      const url = await generateV4SignedUrl({
        method: "PUT",
        bucket,
        object,
        expiresInSeconds,
      });
      return c.json({ url });
    } catch (e) {
      console.error("/storage/gcs/upload-url error:", e);
      return c.json({ error: "Failed to generate signed URL" }, 500);
    }
  });

  // Storage: Generate GCS V4 pre-signed download URL (GET)
  app.post(`${BASE_URL}/storage/gcs/download-url`, async (c) => {
    try {
      const body = await c.req.json().catch(() => ({}));
      const bucket = String(body.bucket ?? "").trim();
      const object = String(body.object ?? "").trim();
      const expiresInSeconds = Number(body.expiresInSeconds ?? 300);
      if (!bucket || !object) {
        return c.json({ error: "bucket and object are required" }, 400);
      }
      // TODO: Verify the requester is allowed to access this object (user/friends) before issuing a URL
      const url = await generateV4SignedUrl({
        method: "GET",
        bucket,
        object,
        expiresInSeconds,
      });
      return c.json({ url, expiresInSeconds });
    } catch (e) {
      console.error("/storage/gcs/download-url error:", e);
      return c.json({ error: "Failed to generate signed URL" }, 500);
    }
  });

  // --- Dynamic Concept Loading and Routing ---
  console.log(`Scanning for concepts in ./${CONCEPTS_DIR}...`);

  for await (
    const entry of walk(CONCEPTS_DIR, {
      maxDepth: 1,
      includeDirs: true,
      includeFiles: false,
    })
  ) {
    if (entry.path === CONCEPTS_DIR) continue; // Skip the root directory

    const conceptName = entry.name;
    const conceptFilePath = `${entry.path}/${conceptName}Concept.ts`;

    try {
      const modulePath = toFileUrl(Deno.realPathSync(conceptFilePath)).href;
      const module = await import(modulePath);
      const ConceptClass = module.default;

      if (
        typeof ConceptClass !== "function" ||
        !ConceptClass.name.endsWith("Concept")
      ) {
        console.warn(
          `! No valid concept class found in ${conceptFilePath}. Skipping.`,
        );
        continue;
      }

      const instance = new ConceptClass(db);
      const conceptApiName = conceptName;
      console.log(
        `- Registering concept: ${conceptName} at ${BASE_URL}/${conceptApiName}`,
      );

      const methodNames = Object.getOwnPropertyNames(
        Object.getPrototypeOf(instance),
      )
        .filter((name) =>
          name !== "constructor" && typeof instance[name] === "function"
        );

      for (const methodName of methodNames) {
        const actionName = methodName;
        const route = `${BASE_URL}/${conceptApiName}/${actionName}`;

        app.post(route, async (c) => {
          try {
            const body = await c.req.json().catch(() => ({})); // Handle empty body
            const result = await instance[methodName](body);
            return c.json(result);
          } catch (e) {
            console.error(`Error in ${conceptName}.${methodName}:`, e);
            return c.json({ error: "An internal server error occurred." }, 500);
          }
        });
        console.log(`  - Endpoint: POST ${route}`);
      }
    } catch (e) {
      console.error(
        `! Error loading concept from ${conceptFilePath}:`,
        e,
      );
    }
  }

  console.log(`\nServer listening on http://localhost:${PORT}`);
  Deno.serve({ port: PORT }, app.fetch);
}

// Run the server
main();
