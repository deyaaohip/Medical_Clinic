import type { NextConfig } from "next";

// The preview proxy reaches the dev server through a rotating sandbox hostname
// and the browser sends the public preview origin. Next.js gates dev assets and
// HMR by that origin, so it is allowed only in the sandbox preview.
const previewOrigin =
  process.env.BASE44_PREVIEW_MODE === "1" && process.env.BASE44_PUBLIC_HOST_SUFFIX
    ? [`3000-${process.env.BASE44_PUBLIC_HOST_SUFFIX}`]
    : undefined;

const nextConfig: NextConfig = {
  ...(previewOrigin ? { allowedDevOrigins: previewOrigin } : {}),
};

export default nextConfig;
