'use client'

import React, { useState, useRef, useEffect } from "react"

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

  function generateWave(samples, sampleRate) {
    const buffer = new ArrayBuffer(44 + samples.length * 2)
    const view = new DataView(buffer)

    const writeString = (offset, string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i))
      }
    }

    const floatTo16BitPCM = (output, offset, input) => {
      for (let i = 0; i < input.length; i++, offset += 2) {
        let s = Math.max(-1, Math.min(1, input[i]))
        s = s < 0 ? Math.round(s * 0x8000) : Math.round(s * 0x7fff)
        output.setInt16(offset, s, true)
      }
    }

    writeString(0, 'RIFF')
    view.setUint32(4, 36 + samples.length * 2, true)
    writeString(8, 'WAVE')
    writeString(12, 'fmt ')
    view.setUint32(16, 16, true)
    view.setUint16(20, 1, true)
    view.setUint16(22, 1, true)
    view.setUint32(24, sampleRate, true)
    view.setUint32(28, sampleRate * 2, true)
    view.setUint16(32, 2, true)
    view.setUint16(34, 16, true)
    writeString(36, 'data')
    view.setUint32(40, samples.length * 2, true)
    floatTo16BitPCM(view, 44, samples)

    return buffer
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