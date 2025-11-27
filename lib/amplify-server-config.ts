import { Amplify } from "aws-amplify";
import outputs from "@/amplify_outputs.json";

// Configure Amplify for server-side rendering
export function configureServerAmplify() {
  Amplify.configure(outputs, {
    ssr: true,
  });
}

// Initialize on import
configureServerAmplify();

export default outputs;
