'use client'

import React, { useState, useRef, useEffect } from "react"
import { generateWave } from '@/utils/generateWave'

const KokoroModelID = 'onnx-community/Kokoro-82M-v1.0-ONNX'


export default function TTS() {
  const [status, setStatus] = useState('loading')
  const [textInput, setTextInput] = useState('This is the default text for this text input to be replaced later.')
  const [audioUrl, setAudioUrl] = useState(null)
  const ttsModel = useRef(null)

  const [arrayOfAudio, setArrayOfAudio] = useState([])
  const audioCache = useRef(null)


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

  function playAudio(index) {
    arrayOfAudio[index].play()
  }

  async function generateAudio() {
    if (!ttsModel.current) {
      setStatus('Wait for model to load')
      return
    }
    
    try {
      const result = await ttsModel.current.generate(textInput, { voice: 'af_heart' })
      const wavBuffer = generateWave(result.audio, result.sampleRate || 24000)
      const blob = new Blob([wavBuffer], { type: 'audio/wav' })
      const newAudioUrl = URL.createObjectURL(blob)
      setAudioUrl(newAudioUrl)
      
      const audio = new Audio(newAudioUrl)
      setArrayOfAudio(prev => [
        ...prev,
        audio
      ])
      // audio.play()


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
      <textarea
        value={textInput}
        onChange={(e) => setTextInput(e.target.value)}
      >
      </textarea>
      <br></br>
      {arrayOfAudio.map((arrayOfAudio, key) => (
        <div key={key}>
          Audio Piece {key}
          <button onClick={() => playAudio(key)}>
            Play
          </button>
        </div>
      ))}
      <button onClick={generateAudio}>Generate audio</button>
    </div>
  )
}