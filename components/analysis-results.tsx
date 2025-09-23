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

  /**
   * Dynamic scoring algorithm:
   * - Normalizes heterogeneous inputs (0–1, 1–5, 1–10 scales or text ratings like "good"/"excellent") to 0–100.
   * - Uses triangular mapping around optimal ranges for pace (WPM), pauses/min, and volume so extremes reduce score.
   * - Combines metrics with weights and skips missing metrics (weights re-normalize), then clamps result to 0–100.
   * - Incorporates penalties implicitly via lower sub-scores for filler words, extreme pace, and excessive pauses.
   */
  const calculateOverallScore = (analysisData: any) => {
    if (!isJsonResponse || !analysisData) return 50

    // Helpers
    const clip = (v: number, min = 0, max = 100) => Math.max(min, Math.min(max, v))
    const ratingMap: Record<string, number> = {
      excellent: 95,
      "very good": 88,
      good: 78,
      fair: 65,
      poor: 45,
      "very poor": 25,
      high: 85,
      medium: 65,
      low: 45,
      positive: 80,
      neutral: 60,
      negative: 40,
    }
    const normalizeNumberOrRating = (v: any): number | undefined => {
      if (v == null) return undefined
      if (typeof v === "string") {
        const key = v.toLowerCase().trim()
        return ratingMap[key] ?? undefined
      }
      if (typeof v === "number") {
        if (v >= 0 && v <= 1) return v * 100
        if (v > 1 && v <= 5) return (v / 5) * 100
        if (v > 5 && v <= 10) return (v / 10) * 100
        if (v > 10 && v <= 100) return clip(v)
        return clip(v)
      }
      return undefined
    }
    const fromKeys = (...keys: string[]) => {
      for (const k of keys) {
        if (analysisData && Object.prototype.hasOwnProperty.call(analysisData, k) && analysisData[k] != null) {
          return analysisData[k]
        }
        if (
          analysisData?.metrics &&
          Object.prototype.hasOwnProperty.call(analysisData.metrics, k) &&
          analysisData.metrics[k] != null
        ) {
          return analysisData.metrics[k]
        }
      }
      return undefined
    }
    const triangularScore = (value: number | undefined, target: number, tolerance: number) => {
      if (value == null || isNaN(value)) return undefined
      const delta = Math.abs(value - target)
      const ratio = clip(1 - delta / tolerance, 0, 1)
      return Math.round(ratio * 100)
    }

    // Derived metrics
    const wordCount = Number(fromKeys("wordCount", "words"))
    const durationSec = Number(fromKeys("duration", "durationSec", "seconds"))
    let wpm = Number(fromKeys("wordsPerMinute", "wpm", "paceWpm", "speech_rate", "rate"))
    if ((!wpm || isNaN(wpm)) && wordCount && durationSec && durationSec > 0) {
      wpm = (wordCount / durationSec) * 60
    }

    let fillerRate = Number(fromKeys("fillerWordRate", "fillerRate"))
    const fillerCount = Number(fromKeys("fillerWordCount", "fillerCount", "umUhCount"))
    if ((isNaN(fillerRate) || !isFinite(fillerRate)) && fillerCount && wordCount) {
      fillerRate = fillerCount / wordCount
    }
    const pausesPerMinute = Number(fromKeys("pausesPerMinute", "pauseRate", "pauses_pm"))

    const volume = fromKeys("volume", "loudness", "rms")
    const sentiment = fromKeys("sentiment", "polarity")

    // Normalized components (0–100 higher is better)
    const clarity = normalizeNumberOrRating(fromKeys("clarity"))
    const confidence = normalizeNumberOrRating(fromKeys("confidence"))
    const articulation = normalizeNumberOrRating(fromKeys("articulation"))
    const fluency = normalizeNumberOrRating(fromKeys("fluency"))
    const coherence = normalizeNumberOrRating(fromKeys("coherence"))
    const engagement = normalizeNumberOrRating(fromKeys("engagement"))
    const pronunciation = normalizeNumberOrRating(fromKeys("pronunciation"))
    const intonation = normalizeNumberOrRating(fromKeys("intonation"))

    const paceScore = wpm != null && isFinite(wpm) ? triangularScore(wpm, 150, 50) : undefined
    const pausesScore =
      pausesPerMinute != null && isFinite(pausesPerMinute) ? triangularScore(pausesPerMinute, 6, 5) : undefined
    const volumeScore = normalizeNumberOrRating(volume) ?? triangularScore(Number(volume), 60, 25)

    let fillerScore: number | undefined
    if (fillerRate != null && isFinite(fillerRate)) {
      // 0% fillers => 100; 5% => 0. Linear drop-off
      const pct = clip(fillerRate * 100)
      fillerScore = clip(100 - (pct / 5) * 100)
    }

    let sentimentScore: number | undefined
    if (typeof sentiment === "string") {
      sentimentScore = ratingMap[sentiment.toLowerCase()] ?? 60
    } else if (typeof sentiment === "number") {
      // Map -1..1 to 0..100
      const s = clip(((sentiment + 1) / 2) * 100)
      sentimentScore = s
    }

    // Weights
    const weights: Record<string, number> = {
      clarity: 0.12,
      confidence: 0.12,
      fluency: 0.1,
      articulation: 0.08,
      coherence: 0.08,
      engagement: 0.06,
      pronunciation: 0.08,
      intonation: 0.06,
      pace: 0.12,
      volume: 0.06,
      filler: 0.06,
      pauses: 0.06,
      sentiment: 0.1,
    }

    const acc = { sum: 0, w: 0, n: 0 }
    const add = (score: number | undefined, key: keyof typeof weights) => {
      if (score == null || isNaN(score)) return
      acc.sum += clip(score) * weights[key]
      acc.w += weights[key]
      acc.n += 1
    }

    add(clarity, "clarity")
    add(confidence, "confidence")
    add(fluency, "fluency")
    add(articulation, "articulation")
    add(coherence, "coherence")
    add(engagement, "engagement")
    add(pronunciation, "pronunciation")
    add(intonation, "intonation")
    add(paceScore, "pace")
    add(volumeScore, "volume")
    add(fillerScore, "filler")
    add(pausesScore, "pauses")
    add(sentimentScore, "sentiment")

    if (acc.w === 0) {
      const keys = Object.keys(analysisData)
      return keys.length > 3 ? 70 : keys.length > 1 ? 60 : 50
    }

    const overallWeighted = acc.sum / acc.w

    // When only 1–2 metrics are available, avoid extreme 0/100 by blending with a neutral baseline
    const baseline = 60
    const blendFactor = acc.n === 1 ? 0.6 : acc.n === 2 ? 0.3 : 0 // higher factor => closer to baseline
    const mixed = overallWeighted * (1 - blendFactor) + baseline * blendFactor

    return Math.round(clip(mixed, 0, 100))
  }

  const overallScore = calculateOverallScore(results)

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

    if (overallScore < 60) {
      suggestions.push({
        icon: Volume2,
        title: "Focus on Fundamentals",
        tip: "Start with basic speaking exercises. Practice reading aloud daily and record yourself to identify areas for improvement.",
        priority: "high",
      })
    } else if (overallScore < 80) {
      suggestions.push({
        icon: Volume2,
        title: "Vocal Clarity",
        tip: "Practice speaking at a moderate pace with clear articulation. Record yourself regularly to monitor progress.",
        priority: "high",
      })
    } else {
      suggestions.push({
        icon: TrendingUp,
        title: "Advanced Techniques",
        tip: "Experiment with advanced speaking techniques like storytelling, rhetorical questions, and strategic pauses.",
        priority: "medium",
      })
    }

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
                <span className="font-medium">{overallScore}%</span>
              </div>
              <Progress value={overallScore} className="h-2" />
              <p className="text-xs text-muted-foreground">
                {overallScore >= 80
                  ? "Excellent work! You're demonstrating strong communication skills."
                  : overallScore >= 60
                    ? "Good progress! Keep practicing to reach the next level."
                    : "Keep practicing! Regular recording sessions will help you improve significantly."}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
