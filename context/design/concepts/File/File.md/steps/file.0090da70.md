---
timestamp: 'Tue Oct 28 2025 01:02:46 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251028_010246.22afb07e.md]]'
content_id: 0090da70ca3bd56c36af2e23c56b7c33c7d0b3e5dd6b30d0109ee666da24d043
---

# file: deno.json

```json
{
    "imports": {
        "@concepts/": "./src/concepts/",
        "@utils/": "./src/utils/",
        "hono": "jsr:@hono/hono@^4",
        "@std/fs/walk": "jsr:@std/fs@^1/walk",
        "@std/cli/parse-args": "jsr:@std/cli@^1/parse-args",
            "@std/path/to-file-url": "jsr:@std/path@^1/to-file-url",
            "@std/assert": "jsr:@std/assert@^1",
            "mongodb": "npm:mongodb@^6"
    },
    "tasks": {
        "concepts": "deno run --allow-net --allow-read --allow-sys --allow-env src/concept_server.ts --port 8000 --baseUrl /api"
    }
}
```
