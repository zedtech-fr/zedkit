import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          alignItems: "center",
          background: "#0a0a0a",
          color: "#fafafa",
          display: "flex",
          flexDirection: "column",
          fontFamily: "ui-sans-serif, system-ui, sans-serif",
          height: "100%",
          justifyContent: "center",
          width: "100%",
        }}
      >
        <div style={{ fontSize: 96, fontWeight: 600, letterSpacing: "-0.04em" }}>zedkit</div>
        <div style={{ fontSize: 32, marginTop: 16, opacity: 0.75 }}>Open-source TypeScript packages</div>
      </div>
    ),
    { ...size },
  );
}
