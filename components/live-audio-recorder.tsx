"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Mic, MicOff, Square, AlertCircle, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface LiveAudioRecorderProps {
  onAnalysisResult: (result: any) => void
  onError: (error: string) => void
}

export function LiveAudioRecorder({ onAnalysisResult, onError }: LiveAudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [audioLevel, setAudioLevel] = useState(0)
  const [recordingTime, setRecordingTime] = useState(0)
  const [hasPermission, setHasPermission] = useState<boolean | null>(null)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const analyzerRef = useRef<AnalyserNode | null>(null)
  const animationFrameRef = useRef<number>()
  const timerRef = useRef<NodeJS.Timeout>()
  const chunksRef = useRef<Blob[]>([])

  // Request microphone permission
  const requestPermission = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      setHasPermission(true)

      // Set up audio level monitoring
      const audioContext = new AudioContext()
      const source = audioContext.createMediaStreamSource(stream)
      const analyzer = audioContext.createAnalyser()
      analyzer.fftSize = 256
      source.connect(analyzer)
      analyzerRef.current = analyzer

      streamRef.current = stream
      return stream
    } catch (err) {
      setHasPermission(false)
      onError("Microphone access denied. Please allow microphone access to use live recording.")
      return null
    }
  }, [onError])

  // Monitor audio levels
  const monitorAudioLevel = useCallback(() => {
    if (!analyzerRef.current) return

    const dataArray = new Uint8Array(analyzerRef.current.frequencyBinCount)
    analyzerRef.current.getByteFrequencyData(dataArray)

    const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length
    setAudioLevel(average / 255) // Normalize to 0-1

    animationFrameRef.current = requestAnimationFrame(monitorAudioLevel)
  }, [])

  // Start recording
  const startRecording = useCallback(async () => {
    let stream = streamRef.current

    if (!stream) {
      stream = await requestPermission()
      if (!stream) return
    }

    try {
      chunksRef.current = []
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: "audio/webm;codecs=opus",
      })

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: "audio/webm" })
        await analyzeAudio(audioBlob)
      }

      mediaRecorderRef.current = mediaRecorder
      mediaRecorder.start()
      setIsRecording(true)
      setRecordingTime(0)

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1)
      }, 1000)

      // Start audio level monitoring
      monitorAudioLevel()
    } catch (err) {
      onError("Failed to start recording. Please try again.")
    }
  }, [requestPermission, onError, monitorAudioLevel])

  // Stop recording
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)

      if (timerRef.current) {
        clearInterval(timerRef.current)
      }

      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }

      setAudioLevel(0)
    }
  }, [isRecording])

  // Analyze recorded audio
  const analyzeAudio = useCallback(
    async (audioBlob: Blob) => {
      setIsAnalyzing(true)

      try {
        const formData = new FormData()
        formData.append("audio", audioBlob, "recording.webm")

        const response = await fetch("https://speakeasy-production-9013.up.railway.app/api/analyze", {
          method: "POST",
          body: formData,
        })

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const contentType = response.headers.get("content-type")
        let data

        if (contentType && contentType.includes("application/json")) {
          data = await response.json()
        } else {
          data = await response.text()
        }

        onAnalysisResult(data)
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred"
        onError(`Failed to analyze recording: ${errorMessage}`)
      } finally {
        setIsAnalyzing(false)
      }
    },
    [onAnalysisResult, onError],
  )

  // Format recording time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
      }
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [])

  if (hasPermission === false) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <MicOff className="h-5 w-5 mr-2" />
            Microphone Access Required
          </CardTitle>
          <CardDescription>
            Live audio analysis requires microphone access to record and analyze your audio in real-time.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Please allow microphone access in your browser settings and refresh the page to use live recording.
            </AlertDescription>
          </Alert>
          <Button onClick={requestPermission} className="mt-4">
            Request Microphone Access
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Mic className="h-5 w-5 mr-2" />
          Live Audio Recording
        </CardTitle>
        <CardDescription>Record audio directly from your microphone and get instant analysis results.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Audio Level Visualizer */}
        <div className="flex items-center space-x-4">
          <div className="flex-1">
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className={cn(
                  "h-full transition-all duration-100 rounded-full",
                  audioLevel > 0.7 ? "bg-red-500" : audioLevel > 0.3 ? "bg-yellow-500" : "bg-green-500",
                )}
                style={{ width: `${audioLevel * 100}%` }}
              />
            </div>
          </div>
          {isRecording && <div className="text-sm font-mono text-muted-foreground">{formatTime(recordingTime)}</div>}
        </div>

        {/* Recording Controls */}
        <div className="flex items-center justify-center space-x-4">
          {!isRecording ? (
            <Button
              onClick={startRecording}
              disabled={isAnalyzing || hasPermission === null}
              size="lg"
              className="bg-red-600 hover:bg-red-700"
            >
              <Mic className="h-4 w-4 mr-2" />
              Start Recording
            </Button>
          ) : (
            <Button onClick={stopRecording} disabled={isAnalyzing} size="lg" variant="outline">
              <Square className="h-4 w-4 mr-2" />
              Stop & Analyze
            </Button>
          )}
        </div>

        {/* Recording Status */}
        {isRecording && (
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 text-red-600">
              <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse" />
              <span className="text-sm font-medium">Recording in progress...</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Speak clearly into your microphone</p>
          </div>
        )}

        {/* Analyzing Status */}
        {isAnalyzing && (
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              <span className="text-sm font-medium">Analyzing recording...</span>
            </div>
          </div>
        )}

        {hasPermission === null && (
          <div className="text-center">
            <Button onClick={requestPermission} variant="outline">
              Enable Microphone
            </Button>
            <p className="text-xs text-muted-foreground mt-2">Click to request microphone access</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
