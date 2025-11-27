"use client";

import { Amplify } from "aws-amplify";
import { useEffect } from "react";
import outputs from "@/amplify_outputs.json";

// Configure Amplify immediately on module load
if (typeof window !== "undefined") {
  Amplify.configure(outputs, {
    ssr: true,
  });
}

export default function ConfigureAmplifyClientSide() {
  useEffect(() => {
    // Ensure configuration on client side
    Amplify.configure(outputs, {
      ssr: true,
    });
  }, []);

  return null;
}
