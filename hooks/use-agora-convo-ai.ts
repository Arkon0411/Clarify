"use client"

import { useState, useCallback } from "react"

interface ConvoAIConfig {
  channel: string
  agentRtcUid: string | number
  remoteRtcUids: (string | number)[]
  appId: string
}

export function useAgoraConvoAI() {
  const [agentId, setAgentId] = useState<string | null>(null)
  const [isStarting, setIsStarting] = useState(false)
  const [isStopping, setIsStopping] = useState(false)

  const start = useCallback(async (config: ConvoAIConfig) => {
    if (isStarting || agentId) {
      console.warn("AI agent already starting or started")
      return agentId
    }

    setIsStarting(true)

    try {
      const response = await fetch("/api/agora/convo-ai/start", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          channel: config.channel,
          agentRtcUid: config.agentRtcUid,
          remoteRtcUids: config.remoteRtcUids.map(String),
          appId: config.appId,
        }),
      })

      const responseText = await response.text()

      if (!response.ok) {
        let errorData
        try {
          errorData = JSON.parse(responseText)
        } catch {
          errorData = { error: responseText || "Unknown error" }
        }
        
        // Handle 409 Conflict gracefully - agent might already be running
        if (response.status === 409) {
          console.warn("AI agent already running (409 Conflict) - this is expected if agent was already started")
          // Try to extract agent ID from error response if available
          const existingAgentId = errorData.agent_id || errorData.agentId || errorData.id
          if (existingAgentId) {
            console.log(`Using existing agent ID: ${existingAgentId}`)
            setAgentId(existingAgentId)
            return existingAgentId
          }
          // If no agent ID in response, return current agentId if we have one
          if (agentId) {
            console.log(`Agent already started with ID: ${agentId}`)
            return agentId
          }
          // Otherwise, treat as non-fatal warning
          console.warn("409 Conflict but no agent ID available - continuing without agent")
          return null
        }
        
        throw new Error(errorData.error || errorData.message || `Failed to start AI agent: ${response.statusText}`)
      }

      let data
      try {
        data = JSON.parse(responseText)
      } catch {
        throw new Error(`Invalid JSON response: ${responseText}`)
      }

      const newAgentId = data.agent_id || data.agentId || data.id

      if (!newAgentId) {
        throw new Error("No agent ID returned from API. Response: " + JSON.stringify(data))
      }

      setAgentId(newAgentId)
      return newAgentId
    } catch (error) {
      console.error("Failed to start AI agent:", error)
      throw error
    } finally {
      setIsStarting(false)
    }
  }, [agentId, isStarting])

  const stop = useCallback(async () => {
    if (!agentId || isStopping) {
      return
    }

    setIsStopping(true)

    try {
      const response = await fetch(`/api/agora/convo-ai/agents/${agentId}/leave`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }))
        throw new Error(errorData.error || `Failed to stop AI agent: ${response.statusText}`)
      }

      setAgentId(null)
    } catch (error) {
      console.error("Failed to stop AI agent:", error)
      throw error
    } finally {
      setIsStopping(false)
    }
  }, [agentId, isStopping])

  return {
    agentId,
    isStarting,
    isStopping,
    start,
    stop,
  }
}

