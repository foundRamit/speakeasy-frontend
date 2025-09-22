"use client"

import { useState, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, AlertCircle, Mic } from "lucide-react"
import { LiveAudioRecorder } from "@/components/live-audio-recorder"
import { AnalysisResults } from "@/components/analysis-results"

interface AnalysisResponse {
  success: boolean
  data?: any
  error?: string
}

export default function AudioAnalyzer() {
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [results, setResults] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const handleLiveAnalysisResult = useCallback((result: any) => {
    setResults(result)
    setError(null)
  }, [])

  const handleLiveAnalysisError = useCallback((errorMessage: string) => {
    setError(errorMessage)
    setResults(null)
  }, [])

  const handleReset = () => {
    setResults(null)
    setError(null)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Loading Overlay */}
      {isAnalyzing && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <Card className="w-80">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center space-y-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <div className="text-center">
                  <p className="text-lg font-medium text-primary-foreground">{"Analyzing your speech…"}</p>
                  <p className="text-sm text-muted-foreground mt-1">{"This may take a few moments"}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <header className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Mic className="h-8 w-8 text-primary mr-3" />
            <h1 className="text-3xl font-bold text-foreground">SpeakEasy</h1>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Record your speech live and get instant analysis with personalized suggestions to improve your communication
            skills.
          </p>
        </header>

        <div className="space-y-6">
          <LiveAudioRecorder onAnalysisResult={handleLiveAnalysisResult} onError={handleLiveAnalysisError} />

          {/* Error Display */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Results Section */}
          {results && <AnalysisResults results={results} onUploadAnother={handleReset} />}
        </div>
      </div>
    </div>
  )
}
