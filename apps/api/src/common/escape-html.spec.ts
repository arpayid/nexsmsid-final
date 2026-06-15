import { describe, expect, it } from "vitest";

import { escapeHtml } from "./escape-html";

describe("escapeHtml", () => {
  it("escapes HTML special characters", () => {
    expect(escapeHtml(`& < > " '`)).toBe("&amp; &lt; &gt; &quot; &#39;");
  });

  it("leaves safe plain text unchanged", () => {
    expect(escapeHtml("Hello, world!")).toBe("Hello, world!");
  });

  it("neutralizes script tag injection", () => {
    const malicious = '<script>alert("xss")</script>';
    expect(escapeHtml(malicious)).toBe("&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;");
    expect(escapeHtml(malicious)).not.toContain("<script");
  });
});
