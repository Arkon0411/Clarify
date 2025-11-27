/**
 * Client-Side Example: Using Agora Token
 * 
 * This example shows how to fetch and use tokens in a React/Next.js component
 */

'use client';

import { useEffect, useState } from 'react';

interface TokenResponse {
  token: string;
  appId: string;
  channelName: string;
  uid: number;
  role: string;
  expirationTimeInSeconds: number;
  expiresAt: string;
}

export default function VideoCallWithToken() {
  const [token, setToken] = useState<string | null>(null);
  const [tokenData, setTokenData] = useState<TokenResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Channel and user configuration
  const channelName = '10000';
  const userId = 10000;
  const appId = process.env.NEXT_PUBLIC_AGORA_APPID || '';

  /**
   * Fetch token from your API
   */
  const fetchToken = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/token?channel=${channelName}&uid=${userId}&role=publisher`
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch token');
      }

      const data: TokenResponse = await response.json();
      setToken(data.token);
      setTokenData(data);

      console.log('Token fetched successfully:', {
        channel: data.channelName,
        uid: data.uid,
        expiresAt: data.expiresAt,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('Token fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Refresh token before expiration
   */
  const refreshToken = async () => {
    await fetchToken();
  };

  /**
   * Join channel with token
   */
  const joinChannel = async () => {
    if (!token || typeof window === 'undefined' || !window.AgoraRTC) {
      console.error('Token or Agora SDK not available');
      return;
    }

    try {
      const client = window.AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
      
      await client.join(appId, channelName, token, userId);
      console.log('Successfully joined channel');
      
      // Continue with your video call logic...
    } catch (err) {
      console.error('Join channel error:', err);
      setError('Failed to join channel');
    }
  };

  // Fetch token on component mount
  useEffect(() => {
    fetchToken();
  }, []);

  // Auto-refresh token before expiration
  useEffect(() => {
    if (!tokenData) return;

    const expirationTime = new Date(tokenData.expiresAt).getTime();
    const currentTime = Date.now();
    const timeUntilExpiration = expirationTime - currentTime;
    
    // Refresh 5 minutes before expiration
    const refreshTime = Math.max(0, timeUntilExpiration - 5 * 60 * 1000);

    const timer = setTimeout(() => {
      console.log('Token expiring soon, refreshing...');
      refreshToken();
    }, refreshTime);

    return () => clearTimeout(timer);
  }, [tokenData]);

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Agora Video Call with Token</h1>

      {/* Token Status */}
      <div className="mb-4 p-4 bg-gray-100 rounded">
        <h2 className="font-semibold mb-2">Token Status</h2>
        {loading && <p>Loading token...</p>}
        {error && <p className="text-red-600">Error: {error}</p>}
        {tokenData && (
          <div className="text-sm">
            <p>Channel: {tokenData.channelName}</p>
            <p>UID: {tokenData.uid}</p>
            <p>Role: {tokenData.role}</p>
            <p>Expires: {new Date(tokenData.expiresAt).toLocaleString()}</p>
            <p className="text-xs text-gray-600 mt-2">
              Token: {token?.substring(0, 50)}...
            </p>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={fetchToken}
          disabled={loading}
          className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
        >
          {loading ? 'Loading...' : 'Fetch Token'}
        </button>

        <button
          onClick={refreshToken}
          disabled={loading || !token}
          className="px-4 py-2 bg-green-500 text-white rounded disabled:opacity-50"
        >
          Refresh Token
        </button>

        <button
          onClick={joinChannel}
          disabled={!token}
          className="px-4 py-2 bg-purple-500 text-white rounded disabled:opacity-50"
        >
          Join Channel
        </button>
      </div>
    </div>
  );
}

/**
 * Alternative: Custom Hook for Token Management
 */
export function useAgoraToken(channelName: string, userId: number) {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchToken = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/token?channel=${channelName}&uid=${userId}&role=publisher`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch token');
      }

      const data: TokenResponse = await response.json();
      setToken(data.token);
      return data.token;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchToken();
  }, [channelName, userId]);

  return { token, loading, error, fetchToken };
}

/**
 * Usage of the custom hook:
 * 
 * function MyComponent() {
 *   const { token, loading, error, fetchToken } = useAgoraToken('10000', 10000);
 * 
 *   if (loading) return <div>Loading token...</div>;
 *   if (error) return <div>Error: {error}</div>;
 *   if (!token) return <div>No token available</div>;
 * 
 *   // Use token to join channel...
 * }
 */

