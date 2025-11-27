"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { confirmSignUp, resendSignUpCode } from "aws-amplify/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function VerifyEmailForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";
  
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsLoading(true);

    try {
      await confirmSignUp({
        username: email,
        confirmationCode: code,
      });

      setSuccess("Email verified successfully! Redirecting to login...");
      setTimeout(() => {
        router.push("/auth/login");
      }, 2000);
    } catch (err: unknown) {
      console.error("Verification error:", err);
      const error = err as { name?: string; message?: string };
      if (error.name === "CodeMismatchException") {
        setError("Invalid verification code. Please try again.");
      } else if (error.name === "ExpiredCodeException") {
        setError("Verification code has expired. Please request a new one.");
      } else {
        setError(error.message || "Failed to verify email. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    setError("");
    setSuccess("");
    setIsLoading(true);

    try {
      await resendSignUpCode({ username: email });
      setSuccess("Verification code sent! Please check your email.");
    } catch (err: unknown) {
      console.error("Resend code error:", err);
      const error = err as { message?: string };
      setError(error.message || "Failed to resend code. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold">Verify your email</CardTitle>
        <CardDescription>
          We&apos;ve sent a verification code to <strong>{email}</strong>
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {success && (
            <Alert>
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}
          <div className="space-y-2">
            <Label htmlFor="code">Verification Code</Label>
            <Input
              id="code"
              type="text"
              placeholder="Enter 6-digit code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
              disabled={isLoading}
              maxLength={6}
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Verifying..." : "Verify Email"}
          </Button>
          <div className="text-sm text-center text-muted-foreground">
            Didn&apos;t receive the code?{" "}
            <button
              type="button"
              onClick={handleResendCode}
              className="text-primary hover:underline"
              disabled={isLoading}
            >
              Resend
            </button>
          </div>
        </CardFooter>
      </form>
    </Card>
  );
}
