"use client";

import { Amplify } from "aws-amplify";
import { useEffect, useState } from "react";

// Fallback configuration for development before amplify push
const defaultConfig = {
  version: "1.1",
  auth: {
    user_pool_id: process.env.NEXT_PUBLIC_USER_POOL_ID || "",
    user_pool_client_id: process.env.NEXT_PUBLIC_USER_POOL_CLIENT_ID || "",
    identity_pool_id: process.env.NEXT_PUBLIC_IDENTITY_POOL_ID || "",
    aws_region: process.env.NEXT_PUBLIC_AWS_REGION || "us-east-1",
  },
};

export default function ConfigureAmplifyClientSide() {
  useEffect(() => {
    const configureAmplify = async () => {
      try {
        // Try to dynamically import amplify outputs
        const outputs = await import("@/amplify_outputs.json");
        Amplify.configure(outputs.default || outputs, { ssr: true });
      } catch {
        // Use fallback configuration
        Amplify.configure(defaultConfig, { ssr: true });
      }
    };

    configureAmplify();
  }, []);

  return null;
}
