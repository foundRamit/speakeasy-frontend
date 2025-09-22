"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import { FileAudio, Download, RotateCcw, Lightbulb, TrendingUp, Target, Volume2 } from "lucide-react"

interface AnalysisResultsProps {
  results: any
  onUploadAnother: () => void
}

export function AnalysisResults({ results, onUploadAnother }: AnalysisResultsProps) {
  const isJsonResponse = typeof results === "object" && results !== null

  const handleDownload = () => {
    const dataStr = JSON.stringify(results, null, 2)
    const dataBlob = new Blob([dataStr], { type: "application/json" })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement("a")
    link.href = url
    link.download = `speakeasy-analysis-${new Date().toISOString().split("T")[0]}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const generateSuggestions = (analysisData: any) => {
    const suggestions = []

    // Generic suggestions that apply to most speech analysis
    suggestions.push({
      icon: Volume2,
      title: "Vocal Clarity",
      tip: "Practice speaking at a moderate pace with clear articulation. Record yourself regularly to monitor progress.",
      priority: "high",
    })

    suggestions.push({
      icon: Target,
      title: "Confidence Building",
      tip: "Maintain steady breathing and pause strategically. Practice your content beforehand to reduce filler words.",
      priority: "medium",
    })

    suggestions.push({
      icon: TrendingUp,
      title: "Engagement",
      tip: "Vary your tone and pace to keep listeners engaged. Use emphasis on key points and natural pauses.",
      priority: "medium",
    })

    // Add specific suggestions based on analysis results if available
    if (isJsonResponse && analysisData) {
      if (analysisData.pace || analysisData.speed) {
        suggestions.push({
          icon: Lightbulb,
          title: "Speaking Pace",
          tip: "Your speaking pace affects comprehension. Aim for 150-160 words per minute for optimal clarity.",
          priority: "high",
        })
      }

      if (analysisData.confidence || analysisData.clarity) {
        suggestions.push({
          icon: Target,
          title: "Voice Projection",
          tip: "Practice diaphragmatic breathing to improve voice strength and reduce vocal strain.",
          priority: "medium",
        })
      }
    }

    return suggestions.slice(0, 4) // Limit to 4 suggestions
  }

  const suggestions = generateSuggestions(results)

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <FileAudio className="h-5 w-5 text-green-600" />
              <CardTitle>Analysis Results</CardTitle>
            </div>
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              Complete
            </Badge>
          </div>
          <CardDescription>Your speech analysis has been completed successfully.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Results Display */}
          <div className="space-y-4">
            {isJsonResponse ? (
              <div className="space-y-4">
                {/* Display key-value pairs if it's a structured object */}
                {Object.entries(results).map(([key, value]) => (
                  <div key={key} className="space-y-2">
                    <h4 className="font-medium text-sm uppercase tracking-wide text-muted-foreground">
                      {key.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase())}
                    </h4>
                    <div className="bg-muted p-3 rounded-md">
                      <pre className="text-sm whitespace-pre-wrap font-mono">
                        {typeof value === "object" ? JSON.stringify(value, null, 2) : String(value)}
                      </pre>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                <h4 className="font-medium text-sm uppercase tracking-wide text-muted-foreground">Response</h4>
                <div className="bg-muted p-4 rounded-md">
                  <pre className="text-sm whitespace-pre-wrap font-mono">{String(results)}</pre>
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button onClick={onUploadAnother} variant="outline" className="flex-1 bg-transparent">
              <RotateCcw className="h-4 w-4 mr-2" />
              Record Again
            </Button>
            {isJsonResponse && (
              <Button onClick={handleDownload} className="flex-1">
                <Download className="h-4 w-4 mr-2" />
                Download Results
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Lightbulb className="h-5 w-5 text-amber-600" />
            <CardTitle>Personalized Improvement Tips</CardTitle>
          </div>
          <CardDescription>
            Based on your analysis, here are some suggestions to enhance your speaking skills.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {suggestions.map((suggestion, index) => {
              const IconComponent = suggestion.icon
              return (
                <div key={index} className="flex space-x-3 p-4 rounded-lg border bg-card">
                  <div
                    className={`flex-shrink-0 p-2 rounded-full ${
                      suggestion.priority === "high" ? "bg-red-100 text-red-600" : "bg-blue-100 text-blue-600"
                    }`}
                  >
                    <IconComponent className="h-4 w-4" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <h4 className="font-medium text-sm">{suggestion.title}</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">{suggestion.tip}</p>
                    {suggestion.priority === "high" && (
                      <Badge variant="secondary" className="text-xs bg-red-50 text-red-700">
                        High Priority
                      </Badge>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          <Separator className="my-6" />

          <div className="space-y-4">
            <h4 className="font-medium flex items-center">
              <TrendingUp className="h-4 w-4 mr-2 text-green-600" />
              Your Speaking Journey
            </h4>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span>Overall Communication Score</span>
                <span className="font-medium">75%</span>
              </div>
              <Progress value={75} className="h-2" />
              <p className="text-xs text-muted-foreground">
                Keep practicing! Regular recording sessions will help you track improvement over time.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
