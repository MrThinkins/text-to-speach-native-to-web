'use client'

import React, { useState, useRef, useEffect } from "react"
import { generateWave } from '@/utils/generateWave'
import { splitString } from '@/utils/splitStrings'

const KokoroModelID = 'onnx-community/Kokoro-82M-v1.0-ONNX'


export default function TTS() {
  const [status, setStatus] = useState('loading')
  const [textInput, setTextInput] = useState('This is the default text for this text input to be replaced later. This is the default text for this text input to be replaced later. This is the default text for this text input to be replaced later.')
  const [audio, setAudio] = useState(null)
  const audioRef = useRef(null)
  const currentTime = useRef(0)
  const currentTime2 = useRef(0)
  const timeOfLastUpdate = useRef(null)
  // const [timeOfLastUpdate, setTimeOfLastUpdate] = useState(null)
  const ttsModel = useRef(null)
  // const [bufferAudio, setBufferAudio] = useState(null)
  let newAudioUrls = []
  const fullRawAudio = useRef(null)
  const timeArrays = useRef([])
  const lastUsedRawAudio = useRef(null)
  const [checkerActivator, setCheckerActivator] = useState(0)

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

  function combineBuffer(oldBuffer, newBuffer) {
    if (!oldBuffer) {
      console.log('new fullRawAudio')
      return newBuffer.audio
    }
    const combined = new Float32Array(oldBuffer.length + newBuffer.audio.length)
    combined.set(oldBuffer, 0)
    combined.set(newBuffer.audio, oldBuffer.length)
    return combined
  }

  async function generateAudio() {
    if (!ttsModel.current) {
      setStatus('Wait for model to load')
      return
    }
    
    try {
      fullRawAudio.current = null
      let arraysToGenerate = splitString(textInput)
      console.log(arraysToGenerate.length)
      if (audio) {
          URL.revokeObjectURL(audio)
        }
      for (let i = 0; i < arraysToGenerate.length; i++) {

        const result = await ttsModel.current.generate(arraysToGenerate[i], { voice: 'af_heart' })
        fullRawAudio.current = combineBuffer(fullRawAudio.current, result)

        const duration = fullRawAudio.current.length / 24000
        timeArrays.current.push(duration)
        console.log(timeArrays)
  
        if (i == 7) {
          updateAudio()
        }
        console.log('i: ' + i)
                
      }

      setStatus('Audio Generated')
    } catch (error) {
      console.error(`error generating audio: ${error}`)
    }
  }

  function updateAudio() {
    if (fullRawAudio.current == lastUsedRawAudio.current) {
      return
    }
    lastUsedRawAudio.current = fullRawAudio.current
    console.log('updating audio')
    if (audio) {
      URL.revokeObjectURL(audio)
      console.log('revoked audio')
    }
    const bufferWav = generateWave(fullRawAudio.current, 24000)
    const blob = new Blob([bufferWav], { type: 'audio/wav' })
    
    
    console.log(`currentTime: ${currentTime.current}`)
    if (newAudioUrls.length > 0) {
      newAudioUrls.forEach(url => URL.revokeObjectURL(url))
    }
    newAudioUrls = []
    newAudioUrls.push(URL.createObjectURL(blob))
    currentTime.current = audioRef.current?.currentTime || 0
    timeOfLastUpdate.current = currentTime.current
    console.log(`newAudioUrls.length ${newAudioUrls.length}`)
    // setBufferAudio(newAudioUrls[newAudioUrls.length - 1])
    setAudio(newAudioUrls[newAudioUrls.length - 1])
    console.log('audioUpdated')
  }
  
  // useEffect to activate other useEffects
  useEffect(() => {
    const interval = setInterval(() => {
      setCheckerActivator(prev => {
        if (prev == 0) {
          return 1
        } else {
          return prev + 1
        }
      })
      
      console.log('looped')
    }, 150) 
    return () => clearInterval(interval)
  }, [])
  
  function closeToTimeArray() {
    const tol = 0.2
    for (const number of timeArrays.current) {
      if (number - currentTime2.current > 0.05 && number - currentTime2.current <= tol) {
        return true
      }
    }
    return false
  }

  useEffect(() => {
    console.log('loop 2')
    if (!audio || !audioRef.current) {
      console.log('oops')
      if (fullRawAudio.current == null) {
        console.log(fullRawAudio.current)
        console.log('double oops')
        return
      }
      return
    }
    console.log(`should have happened: ${lastUsedRawAudio.current != fullRawAudio.current}`)

    if (lastUsedRawAudio.current != fullRawAudio.current) {      
      // console.log('currentTime.current')
      // console.log(currentTime.current)
      // console.log('audioElement.duration')
      // console.log(audioElement.duration)
      // console.log('difference')
      // console.log(audioElement.duration - currentTime.current)
      
      currentTime2.current = audioRef.current?.currentTime || 0
      console.log(currentTime.current)
      console.log('closeToTimeArray')
      console.log(closeToTimeArray())
      if (closeToTimeArray() && currentTime2.current - timeOfLastUpdate.current >= 10) {
        updateAudio()
      }
      // }
    }
  }, [checkerActivator])

  useEffect(() => {
    const audioElement = audioRef.current

    function loadAndPlay() {
      // disabling this for now, but it does seem to work?
      // if (audioElement.duration - currentTime.current < 20) {
        // console.log('inside')
        
        audioElement.currentTime = currentTime.current
        audioElement.play().catch(e => console.warn(e))
        // setTimeOfLastUpdate(currentTime.current)
      
      // }
    }
    if (audioElement.readyState >= 2) {
      loadAndPlay()
      
    } else {
      audioElement.addEventListener('loadedmetadata', loadAndPlay, { once: true })
    }
    return () => audioElement.removeEventListener('loadedmetadata', loadAndPlay)
  }, [audio])
  
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
      <div>
        {status == "loading" ? (
          <div>
            waiting
          </div>
        ) : (
          <button onClick={generateAudio}>Generate audio</button>
        )}
        <div>

        </div>
        
        Generated Audio
        <br></br>
        <audio ref={audioRef} controls src={audio}></audio>
      </div>
      
    </div>
  )
}