import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const testDirectory = dirname(fileURLToPath(import.meta.url));
const readProjectFile = (filePath: string) =>
  readFileSync(resolve(testDirectory, filePath), "utf8");
const packageStyles = readProjectFile("../src/styles.css");
const siteHeader = readProjectFile("../../../components/site-header.tsx");
const existingChat = readProjectFile("../../../components/chat-ia/chat-ia.tsx");
const globalStyles = readProjectFile("../../../app/globals.css");

describe("header height integration", () => {
  it("uses the host --header-height token for both chat headers and SiteHeader", () => {
    expect(siteHeader).toContain("h-(--header-height)");
    expect(existingChat).toContain("h-(--header-height) w-full shrink-0");
    expect(packageStyles).toContain(
      "--ai-chat-header-height: var(--header-height, calc(var(--spacing, 0.25rem) * 12))",
    );
    expect(globalStyles).toContain("--header-height: calc(var(--spacing) * 12)");
  });
});
