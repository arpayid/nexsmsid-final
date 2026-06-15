import { describe, expect, it } from "vitest";

import { serializeJsonLd } from "./safe-json-ld";

describe("serializeJsonLd", () => {
  it("escapes less-than to prevent script breakout", () => {
    const payload = {
      name: "</script><script>alert(1)</script>",
    };

    const serialized = serializeJsonLd(payload);

    expect(serialized).not.toContain("</script>");
    expect(serialized).not.toContain("<");
    expect(serialized).toContain("\\u003c");
  });
});
