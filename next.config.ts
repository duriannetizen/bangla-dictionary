import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['sharp', 'onnxruntime-node'],
  outputFileTracingIncludes: {
    // This tells Vercel to forcefully bundle the missing C++ files with your API route
    '/api/**/*': ['./node_modules/onnxruntime-node/bin/**/*'],
  },
};

export default nextConfig;