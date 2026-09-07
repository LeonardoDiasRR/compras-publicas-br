import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { PluginError } from "./modelo.js";

export const PACKAGE_NAME = "mcp-compras-publicas-br";
export const REGISTRY_URL = `https://registry.npmjs.org/${PACKAGE_NAME}`;
// ponytail: npm dist-tags.latest instead of PyPI releases scan — no yanked concept on npm

type PayloadFetcher = () => Promise<unknown>;

export function installedVersion(): string {
  let dir = dirname(fileURLToPath(import.meta.url));
  for (;;) {
    const manifestPath = join(dir, "package.json");
    if (existsSync(manifestPath)) {
      let manifest: unknown;
      try {
        manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
      } catch {
        manifest = undefined;
      }
      if (
        typeof manifest === "object" &&
        manifest !== null &&
        (manifest as { name?: unknown }).name === PACKAGE_NAME
      ) {
        const version = (manifest as { version?: unknown }).version;
        if (typeof version === "string") return version;
      }
    }
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  throw new PluginError(`Installed package "${PACKAGE_NAME}" was not found`);
}

export function versionedCommand(version: string): string[] {
  return ["npx", "-y", `${PACKAGE_NAME}@${version}`];
}

async function fetchPayload(): Promise<unknown> {
  let response: Response;
  try {
    response = await fetch(REGISTRY_URL, { signal: AbortSignal.timeout(10_000) });
  } catch (error) {
    throw new PluginError("Could not fetch package releases from npm registry", {
      cause: error,
    });
  }
  if (!response.ok) {
    throw new PluginError("Could not fetch package releases from npm registry");
  }
  try {
    return await response.json();
  } catch (error) {
    throw new PluginError("Could not fetch package releases from npm registry", {
      cause: error,
    });
  }
}

export async function latestStableVersion(
  fetcher: PayloadFetcher = fetchPayload,
): Promise<string> {
  let payload: unknown;
  try {
    payload = await fetcher();
  } catch (error) {
    if (error instanceof PluginError) throw error;
    throw new PluginError("Could not fetch package releases", { cause: error });
  }

  if (typeof payload !== "object" || payload === null || Array.isArray(payload)) {
    throw new PluginError("npm registry response is not an object");
  }
  const distTags = (payload as { "dist-tags"?: unknown })["dist-tags"];
  if (typeof distTags !== "object" || distTags === null) {
    throw new PluginError("npm registry response has no valid dist-tags mapping");
  }
  const latest = (distTags as { latest?: unknown }).latest;
  if (typeof latest !== "string") {
    throw new PluginError("npm registry response has no valid dist-tags mapping");
  }
  if (latest.includes("-")) {
    throw new PluginError("No stable package release was found");
  }
  return latest;
}
