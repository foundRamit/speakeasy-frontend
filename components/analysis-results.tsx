"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { FileAudio, Download, RotateCcw } from "lucide-react"

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
    link.download = `audio-analysis-${new Date().toISOString().split("T")[0]}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  return (
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
        <CardDescription>Your audio analysis has been completed successfully.</CardDescription>
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
            Upload Another File
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
  )
}
