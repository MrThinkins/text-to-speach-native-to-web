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
  const newAudioUrls = useRef([])
  const fullRawAudio = useRef(null)
  const timeArrays = useRef([])
  const lastUsedRawAudio = useRef(null)
  const [checkerActivator, setCheckerActivator] = useState(0)
  const wasPlaying = useRef(false)
  const startWithPlaying = useRef(false)
  const [voice, setVoice] = useState('af_heart')

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
    setStatus('generating')
    try {
      fullRawAudio.current = null
      let arraysToGenerate = splitString(textInput)
      console.log(arraysToGenerate.length)
      if (audio) {
          URL.revokeObjectURL(audio)
        }
      for (let i = 0; i < arraysToGenerate.length; i++) {

        const result = await ttsModel.current.generate(arraysToGenerate[i], { voice: voice })
        fullRawAudio.current = combineBuffer(fullRawAudio.current, result)

        const duration = fullRawAudio.current.length / 24000
        timeArrays.current.push(duration)
        console.log(timeArrays)

        
        
        // if (i % 3 == 0 || i == arraysToGenerate.length) {
          updateAudioUrls()
        // }
        if (i == 5) {
          updateAudio()
        }
        console.log('i: ' + i)
                
      }

      updateAudio()
      setStatus('Loaded')
    } catch (error) {
      console.error(`error generating audio: ${error}`)
    }
  }

  function updateAudioUrls() {
    const bufferWav = generateWave(fullRawAudio.current, 24000)
    const blob = new Blob([bufferWav], { type: 'audio/wav' })

    if (newAudioUrls.current.length > 1) {
      newAudioUrls.current.splice(0, newAudioUrls.current.length - 1).forEach(url => URL.revokeObjectURL(url))
    }
    // console.log(`newAudioUrls.length: ${newAudioUrls.current.length}`)
    newAudioUrls.current.push(URL.createObjectURL(blob))
    
    // console.log(`newAudioUrls.length ${newAudioUrls.current.length}`)
  }
  
  function updateAudio() {
    if (fullRawAudio.current == lastUsedRawAudio.current) {
      console.log('did not update audio')
      return
    }
    lastUsedRawAudio.current = fullRawAudio.current
    // console.log('updating audio')
    if (audio) {
      URL.revokeObjectURL(audio)
      // console.log('revoked audio')
    }
    if (startWithPlaying.current) {
      wasPlaying.current = true
      startWithPlaying.current = false
    } else if (audioRef.current && !audioRef.current.paused) {
      wasPlaying.current = true
    } else {
      wasPlaying.current = false
    }
    // console.log(`currentTime: ${currentTime.current}`)
    // updateAudioUrls()
    
    // setBufferAudio(newAudioUrls[newAudioUrls.length - 1])
    setAudio(newAudioUrls.current[newAudioUrls.current.length - 1])
    currentTime.current = audioRef.current?.currentTime || 0
    timeOfLastUpdate.current = Date.now() / 1000
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
      // console.log('looped')
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
    // console.log('loop 2')
    if (!audio || !audioRef.current) {
      // console.log('oops')
      if (fullRawAudio.current == null) {
        // console.log(fullRawAudio.current)
        console.log('double oops')
        return
      }
      return
    }

    if (lastUsedRawAudio.current != fullRawAudio.current) {      
      // console.log('passed 1')
        currentTime2.current = audioRef.current?.currentTime || 0

      const timeCheck = Date.now() / 1000
      // console.log(currentTime2.current)
      // console.log('closeToTimeArray')
      // console.log(closeToTimeArray())
      if (timeCheck - timeOfLastUpdate.current >= 5) {
        // console.log(audioRef.current.paused)
        if (audioRef.current?.paused) {
          console.log('audio paused, updating')
          updateAudio()
        } else if (closeToTimeArray()) {
          // console.log('passed 2')
          updateAudio()
        }
      }
      
    }
  }, [checkerActivator])

  useEffect(() => {
    console.log('updatePlay and spot')
    const audioElement = audioRef.current

    function loadAndPlay() {
      audioElement.currentTime = currentTime.current
      if (wasPlaying.current) {
        console.log('audio not paused, now unpaused')
        audioElement.play().catch(e => console.warn(e))
      }
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

  function generateAndPlay() {
    startWithPlaying.current = true
    currentTime.current = 0
    generateAudio()
  }

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
      <select value={voice} onChange={(e) => {setVoice(e.target.value)}}>
        <option value="af_heart">Heart - American Female</option>
        <option value="af_alloy">Alloy - American Female</option>
        <option value="af_aoede">Aoede - American Female</option>
        <option value="af_bella">Bella - American Female</option>
        <option value="af_jessica">Jessica - American Female</option>
        <option value="af_kore">Kore - American Female</option>
        <option value="af_nicole">Nicole - American Female</option>
        <option value="af_nova">Nova - American Female</option>
        <option value="af_river">River - American Female</option>
        <option value="af_sarah">Sarah - American Female</option>
        <option value="af_sky">Sky - American Female</option>
        <option value="am_adam">Adam - American Male</option>
        <option value="am_echo">Echo - American Male</option>
        <option value="am_eric">Eric - American Male</option>
        <option value="am_fenrir">Fenrir - American Male</option>
        <option value="am_liam">Liam - American Male</option>
        <option value="am_michael">Michael - American Male</option>
        <option value="am_onyx">Onyx - American Male</option>
        <option value="am_puck">Puck - American Male</option>
        <option value="am_santa">Santa - American Male</option>
      </select>
      <br></br>
      <div>
        {status == "loading" ? (
          <div>
            waiting
          </div>
        ) : status == 'generating' ? (
          <div>
            generating
          </div>
        ) : (
          <div>
            <button onClick={generateAudio}>Generate audio</button>
            <button onClick={generateAndPlay}>Generate and Play Audio</button>
          </div>
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