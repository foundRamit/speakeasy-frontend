"use client"

import type React from "react"

import { useCallback, useState } from "react"
import { Card } from "@/components/ui/card"
import { Upload, FileAudio } from "lucide-react"
import { cn } from "@/lib/utils"

interface AudioUploadZoneProps {
  onFileSelect: (file: File) => void
  selectedFile: File | null
}

export function AudioUploadZone({ onFileSelect, selectedFile }: AudioUploadZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false)

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragOver(false)

      const files = Array.from(e.dataTransfer.files)
      const audioFile = files.find((file) => file.type.startsWith("audio/"))

      if (audioFile) {
        onFileSelect(audioFile)
      }
    },
    [onFileSelect],
  )

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) {
        onFileSelect(file)
      }
    },
    [onFileSelect],
  )

  return (
    <Card
      className={cn(
        "border-2 border-dashed transition-colors cursor-pointer hover:border-primary/50",
        isDragOver ? "border-primary bg-primary/5" : "border-border",
        selectedFile && "border-green-500 bg-green-50/50",
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => document.getElementById("audio-upload")?.click()}
    >
      <div className="p-8 text-center">
        <input id="audio-upload" type="file" accept="audio/*" onChange={handleFileInput} className="hidden" />

        <div className="flex flex-col items-center space-y-4">
          {selectedFile ? (
            <FileAudio className="h-12 w-12 text-green-600" />
          ) : (
            <Upload className="h-12 w-12 text-muted-foreground" />
          )}

          <div className="space-y-2">
            <p className="text-lg font-medium">{selectedFile ? "File Selected" : "Drop your audio file here"}</p>
            <p className="text-sm text-muted-foreground">
              {selectedFile ? "Click to select a different file" : "or click to browse your files"}
            </p>
            <p className="text-xs text-muted-foreground">Supports MP3, WAV, M4A, FLAC, and other audio formats</p>
          </div>
        </div>
      </div>
    </Card>
  )
}
