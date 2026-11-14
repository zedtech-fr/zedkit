import { describe, expect, it } from "vitest";

import { buildWebPageJsonLd } from "#index.js";
import { JsonLd, type JsonLdProps } from "#react.js";

function scriptFrom(data: object) {
  const element = JsonLd({ data });
  return {
    type: element.type,
    scriptType: element.props.type,
    html: element.props.dangerouslySetInnerHTML?.__html,
  };
}

describe("JsonLd", () => {
  it("emits an application/ld+json script whose HTML is {}", () => {
    const script = scriptFrom({});
    expect(script.type).toBe("script");
    expect(script.scriptType).toBe("application/ld+json");
    expect(script.html).toBe("{}");
  });

  it("round-trips builder output through JSON.parse", () => {
    const data = buildWebPageJsonLd({
      title: "T",
      description: "D",
      url: "https://example.com/",
    });
    expect(JSON.parse(String(scriptFrom(data).html))).toEqual(data);
  });

  it("keeps insertion order and unicode in nested objects", () => {
    const data = { z: { city: "Kyōto 東京" }, a: [true, null] };
    expect(scriptFrom(data).html).toBe('{"z":{"city":"Kyōto 東京"},"a":[true,null]}');
  });

  it("escapes < so a </script> string cannot break out of the tag", () => {
    const html = String(scriptFrom({ html: "</script>" }).html);
    expect(html).toBe('{"html":"\\u003c/script>"}');
    expect(html.includes("</script>")).toBe(false);
    expect(JSON.parse(html)).toEqual({ html: "</script>" });
  });

  it("accepts a FAQPage-shaped plain object", () => {
    const data: JsonLdProps["data"] = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: [],
    };
    const script = scriptFrom(data);
    expect(script.type).toBe("script");
    expect(JSON.parse(String(script.html))["@type"]).toBe("FAQPage");
  });
});
