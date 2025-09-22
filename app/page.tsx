"use client"

import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, Upload, FileAudio, CheckCircle, AlertCircle, Mic } from "lucide-react"
import { AudioUploadZone } from "@/components/audio-upload-zone"
import { LiveAudioRecorder } from "@/components/live-audio-recorder"
import { AnalysisResults } from "@/components/analysis-results"

interface AnalysisResponse {
  success: boolean
  data?: any
  error?: string
}

export default function AudioAnalyzer() {
  const [file, setFile] = useState<File | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [results, setResults] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("upload")

  const handleFileSelect = useCallback((selectedFile: File) => {
    setFile(selectedFile)
    setResults(null)
    setError(null)
  }, [])

  const handleAnalyze = async () => {
    if (!file) return

    setIsAnalyzing(true)
    setError(null)
    setResults(null)

    try {
      const formData = new FormData()
      formData.append("audio", file)

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

      setResults(data)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred"
      setError(`Failed to analyze audio: ${errorMessage}`)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleLiveAnalysisResult = useCallback((result: any) => {
    setResults(result)
    setError(null)
  }, [])

  const handleLiveAnalysisError = useCallback((errorMessage: string) => {
    setError(errorMessage)
    setResults(null)
  }, [])

  const handleReset = () => {
    setFile(null)
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
                  <p className="text-lg font-medium text-primary-foreground">{"Analyzing your audio…"}</p>
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
            <FileAudio className="h-8 w-8 text-primary mr-3" />
            <h1 className="text-3xl font-bold text-foreground">Audio Analysis Tool</h1>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Upload audio files or record live audio for detailed analysis. Get comprehensive insights from your audio
            content.
          </p>
        </header>

        <div className="space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="upload" className="flex items-center space-x-2">
                <Upload className="h-4 w-4" />
                <span>Upload File</span>
              </TabsTrigger>
              <TabsTrigger value="live" className="flex items-center space-x-2">
                <Mic className="h-4 w-4" />
                <span>Live Recording</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="upload" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Upload className="h-5 w-5 mr-2" />
                    Upload Audio File
                  </CardTitle>
                  <CardDescription>
                    Select an audio file to analyze. Supports various audio formats for comprehensive insights.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <AudioUploadZone onFileSelect={handleFileSelect} selectedFile={file} />

                  {file && (
                    <div className="mt-4 flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="text-sm font-medium">{file.name}</span>
                        <span className="text-xs text-muted-foreground">
                          ({(file.size / 1024 / 1024).toFixed(2)} MB)
                        </span>
                      </div>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm" onClick={handleReset}>
                          Remove
                        </Button>
                        <Button onClick={handleAnalyze} disabled={isAnalyzing}>
                          {isAnalyzing ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Analyzing...
                            </>
                          ) : (
                            "Analyze Audio"
                          )}
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="live" className="space-y-4">
              <LiveAudioRecorder onAnalysisResult={handleLiveAnalysisResult} onError={handleLiveAnalysisError} />
            </TabsContent>
          </Tabs>

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
