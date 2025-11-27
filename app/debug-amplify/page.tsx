"use client";

import { useState } from "react";
import { Amplify } from "aws-amplify";
import { Button } from "@/components/ui/button";

export default function AmplifyDebugPage() {
  const [config, setConfig] = useState<string>("");

  const loadConfig = () => {
    try {
      const amplifyConfig = Amplify.getConfig();
      setConfig(JSON.stringify(amplifyConfig, null, 2));
    } catch (error) {
      setConfig(`Error: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-4">Amplify Configuration Debug</h1>
      <Button onClick={loadConfig} className="mb-4">
        Load Configuration
      </Button>
      <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg overflow-auto">
        {config || "Click button to load configuration..."}
      </pre>
    </div>
  );
}
