'use client'

import React, { useState, useRef, useEffect } from "react"
import { generateWave } from '@/utils/generateWave'

const KokoroModelID = 'onnx-community/Kokoro-82M-v1.0-ONNX'


export default function TTS() {
  const [status, setStatus] = useState('loading')
  const [audioUrl, setAudioUrl] = useState(null)
  const ttsModel = useRef(null)

  const audioCache = useRef(null)
  console.log('Model loaded and ready:', !!ttsModel.current)
  async function loadTTSModel() {

    try {
      const { KokoroTTS } = await import("kokoro-js")
      const device = typeof navigator !== "undefined" && "gpu" in navigator
        ? "webgpu"
        : "wasm"

        const tempTTSModel = await KokoroTTS.from_pretrained(KokoroModelID, {
        device,
        dType: device === "webgpu" ? "fp32" : "q8"
      })

      ttsModel.current = tempTTSModel
      setStatus('loaded')
      // generateAudio()
    } catch (error) {
      setStatus(`Error: ${error.message}`)
    }
  }

  async function playAudio() {
    const audioContext = new (window.AudioContext || window.webk)
  }

  

  async function generateAudio() {
    if (!ttsModel.current) {
      setStatus('Wait for model to load')
      return
    }
    
    try {
      const result = await ttsModel.current.generate('Hello, this is some test text that is going to be replaced later. Hello, this is some test text that is going to be replaced later.', { voice: 'af_heart' })
      const wavBuffer = generateWave(result.audio, result.sampleRate || 24000)
      const blob = new Blob([wavBuffer], { type: 'audio/wav' })
      const newAudioUrl = URL.createObjectURL(blob)
      setAudioUrl(newAudioUrl)

      const audio = new Audio(newAudioUrl)
      audio.play()


      setStatus('Audio Generated')
    } catch (error) {
      console.error(`error generating audio: ${error}`)
    }
  }

  useEffect(() => {
    loadTTSModel()
  }, [])

  return (
    <div>
      <div id="statusShower">
        {status}
      </div>
      <button onClick={generateAudio}>Generate and play audio</button>
    </div>
  )
}