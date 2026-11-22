'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Paperclip, Mic, MicOff, FileText, X } from 'lucide-react'
import { toast } from 'sonner'

interface VoiceMessageInputProps {
  value: string
  onChange: (val: string) => void
  placeholder?: string
  selectedFile?: File | null
  onFileSelect?: (file: File | null) => void
  disabled?: boolean
  className?: string
  acceptTypes?: string
}

export function VoiceMessageInput({
  value,
  onChange,
  placeholder = 'Type a message or click mic to speak...',
  selectedFile,
  onFileSelect,
  disabled = false,
  className = '',
  acceptTypes = '.pdf,.doc,.docx,.txt,.png,.jpg,.jpeg',
}: VoiceMessageInputProps) {
  const [isListening, setIsListening] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const recognitionRef = useRef<any>(null)

  // Initialize SpeechRecognition if available in browser
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition()
        recognition.continuous = true
        recognition.interimResults = true
        recognition.lang = 'en-US'

        recognition.onresult = (event: any) => {
          let currentTranscript = ''
          for (let i = event.resultIndex; i < event.results.length; i++) {
            currentTranscript += event.results[i][0].transcript
          }
          if (currentTranscript.trim()) {
            onChange(currentTranscript)
          }
        }

        recognition.onerror = (event: any) => {
          console.warn('Speech recognition error:', event.error)
          if (event.error !== 'no-speech') {
            toast.error(`Voice recognition error: ${event.error}`)
          }
          setIsListening(false)
        }

        recognition.onend = () => {
          setIsListening(false)
        }

        recognitionRef.current = recognition
      }
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop()
        } catch {
          // ignore
        }
      }
    }
  }, [onChange])

  const toggleListening = () => {
    if (!recognitionRef.current) {
      toast.info('Speech recognition is not supported in this browser. You can type directly.')
      return
    }

    if (isListening) {
      try {
        recognitionRef.current.stop()
      } catch (err) {
        console.error(err)
      }
      setIsListening(false)
      toast.info('Voice dictation stopped')
    } else {
      try {
        recognitionRef.current.start()
        setIsListening(true)
        toast.success('Listening... speak now into your microphone')
      } catch (err) {
        console.error('Could not start speech recognition', err)
        setIsListening(false)
      }
    }
  }

  const handlePaperclipClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      onFileSelect?.(file)
      toast.success(`Attached file: ${file.name}`)
    }
  }

  const removeFile = (e: React.MouseEvent) => {
    e.stopPropagation()
    onFileSelect?.(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept={acceptTypes}
      />

      {/* Pill shaped WhatsApp-style bar */}
      <div className={`flex items-center gap-2 bg-white rounded-full border px-4 py-2 shadow-xs transition-all ${
        isListening
          ? 'border-emerald-500 ring-2 ring-emerald-200'
          : 'border-slate-300 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100'
      }`}>
        {/* Paperclip Pin button */}
        <button
          type="button"
          onClick={handlePaperclipClick}
          disabled={disabled}
          title="Attach document / file"
          className="text-slate-500 hover:text-slate-800 p-1.5 rounded-full hover:bg-slate-100 transition-colors shrink-0 disabled:opacity-50"
        >
          <Paperclip className="w-5 h-5 -rotate-45" />
        </button>

        {/* Text input */}
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={isListening ? 'Listening... speak now' : placeholder}
          disabled={disabled}
          className="flex-1 bg-transparent border-none outline-none text-sm text-slate-800 placeholder:text-slate-400 focus:ring-0 min-w-0"
        />

        {/* Active listening indicator */}
        {isListening && (
          <span className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium shrink-0 animate-pulse">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            Recording...
          </span>
        )}

        {/* Microphone button */}
        <button
          type="button"
          onClick={toggleListening}
          disabled={disabled}
          title={isListening ? 'Stop voice dictation' : 'Click to speak via microphone'}
          className={`p-2 rounded-full transition-all shrink-0 ${
            isListening
              ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20 animate-pulse'
              : 'text-slate-500 hover:text-blue-600 hover:bg-blue-50'
          }`}
        >
          {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </button>
      </div>

      {/* Selected file preview pill if attached */}
      {selectedFile && (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-200 text-blue-800 text-xs rounded-lg w-fit">
          <FileText className="w-4 h-4 text-blue-600 shrink-0" />
          <span className="font-medium truncate max-w-[240px]">{selectedFile.name}</span>
          <span className="text-slate-500">({(selectedFile.size / 1024).toFixed(0)} KB)</span>
          <button
            type="button"
            onClick={removeFile}
            className="hover:text-rose-600 ml-1 p-0.5 rounded-full hover:bg-blue-100 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  )
}
