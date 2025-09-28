'use client'

import React, { useState, useRef, useEffect } from "react"
import { generateWave } from '@/utils/generateWave'

const KokoroModelID = 'onnx-community/Kokoro-82M-v1.0-ONNX'


export default function TTS() {
  const [status, setStatus] = useState('loading')
  const [textInput, setTextInput] = useState('This is the default text for this text input to be replaced later. This is the default text for this text input to be replaced later. This is the default text for this text input to be replaced later.')
  const [audio, setAudio] = useState(null)
  const audioRef = useRef(null)
  const currentTime = useRef(0)
  const [timeOfLastUpdate, setTimeOfLastUpdate] = useState(null)
  const ttsModel = useRef(null)
  const [bufferAudio, setBufferAudio] = useState(null)
  let newAudioUrls = []

  // const [arrayOfAudio, setArrayOfAudio] = useState([])
  // const audioCache = useRef(null)


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

  function splitString(textToSplit) {
    let arraysToGenerate = []
    let tempTextToSplit = textToSplit
    while (tempTextToSplit.length > 0) {
      // let chunk = ''
      let i = 0
      while(i < tempTextToSplit.length) {
        if (tempTextToSplit[i] == '.') {
          arraysToGenerate.push(tempTextToSplit.slice(0, i + 1))
          tempTextToSplit = tempTextToSplit.slice(i + 1)
          console.log('arraysToGenerate')
          console.log(arraysToGenerate)
          console.log('tempTextToSplit')
          console.log(tempTextToSplit)
          i = 0
        }
        i++
      }
      if (tempTextToSplit.length > 0) {
        arraysToGenerate.push(tempTextToSplit)
      }
      console.log('arraysToGenerate')
      console.log(arraysToGenerate)
      console.log('tempTextToSplit')
      console.log(tempTextToSplit)
      tempTextToSplit = ''
    }
    return arraysToGenerate
  }

  async function transferToAudio(buffer) {
    const blob = new Blob([buffer], { type: 'audio/wav' })
    const newAudioUrl = URL.createObjectURL(blob)
    return newAudioUrl
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
      let fullRawAudio = null
      let arraysToGenerate = splitString(textInput)
      console.log(arraysToGenerate.length)
      if (audio) {
          URL.revokeObjectURL(audio)
        }
      for (let i = 0; i < arraysToGenerate.length; i++) {
        // if (newAudioUrls.length > 1) {
        //   newAudioUrls.splice(0, newAudioUrls.length - 1)
        // }
        const result = await ttsModel.current.generate(arraysToGenerate[i], { voice: 'af_heart' })
        // const wavBuffer = generateWave(result.audio, result.sampleRate || 24000)
        fullRawAudio = combineBuffer(fullRawAudio, result)
        // setAudio(newAudioUrl)
        // setBufferAudio(prev => {
        //   if (!prev) return wavBuffer

        //   const prevArray = new Uint8Array(prev)
        //   const newArray = new Uint8Array(wavBuffer)
        //   const combined = new Uint8Array(prevArray.length + newArray.length)

        //   combined.set(prevArray, 0)
        //   combined.set(newArray, prevArray.length)

        //   return combined.buffer
        // })

        if (audio) {
          URL.revokeObjectURL(audio)
          console.log('revoked audio')
        }
        const bufferWav = generateWave(fullRawAudio, 24000)
        const blob = new Blob([bufferWav], { type: 'audio/wav' })
        
        currentTime.current = audioRef.current?.currentTime || 0
        console.log(`currentTime: ${currentTime.current}`)
        if (newAudioUrls.length > 0) {
          newAudioUrls.forEach(url => URL.revokeObjectURL(url))
        }
        newAudioUrls = []
        newAudioUrls.push(URL.createObjectURL(blob))
        console.log(`newAudioUrls.length ${newAudioUrls.length}`)
        setAudio(newAudioUrls[newAudioUrls.length - 1])

        // setAudio(() => {
        //   const toReturn = newAudioUrl
        //   if (newAudioUrl) {
        //     URL.revokeObjectURL(newAudioUrl)
        //     console.log('revokes new')
        //   }
        //   return toReturn
        // })
        
        // const newAudioUrl = URL.createObjectURL(blob)
        // setAudio(newAudioUrl)
        console.log(i)
        
        

        // if (audio) {
        //   URL.revokeObjectURL(audio)
        // }
        
        // const audio = new Audio(newAudioUrl)
        // setArrayOfAudio(prev => [
        //   ...prev,
        //   audio
        // ])
      }

      // if (audio) {
      //   URL.revokeObjectURL(audio)
      // }
      // // console.log('before generate wav')
      // const bufferWav = generateWave(fullRawAudio, 24000)
      // // console.log('after generate wav')
      // const blob = new Blob([bufferWav], { type: 'audio/wav' })
      // const newAudioUrl = URL.createObjectURL(blob)
      // // const newAudioUrl = transferToAudio(bufferWav)
      // currentTime.current = audioRef.current?.currentTime || 0
      // console.log(`currentTime: ${currentTime}`)
      // setAudio(newAudioUrl)

      setStatus('Audio Generated')
    } catch (error) {
      console.error(`error generating audio: ${error}`)
    }
  }
  
  useEffect(() => {
    if (!audio || !audioRef.current) return
    const audioElement = audioRef.current
    
    
      function loadAndPlay() {
        console.log('audioRef.current')
        console.log(currentTime.current)
        console.log('audioElement.currentTime')
        console.log(audioElement.duration)
        console.log('difference')
        console.log(audioElement.duration - currentTime.current)
        // disabling this for now, but it does seem to work?
        // if (audioE lement.duration - currentTime.current < 10) {
          audioElement.currentTime = currentTime.current
          audioElement.play().catch(e => console.warn(e))
          setTimeOfLastUpdate(currentTime.current)
        // }
      }
      if (audioElement.readyState >= 2) {
        loadAndPlay
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
        {/* <audio controls src={audioBuffer}></audio> */}
      </div>
      {/* {arrayOfAudio.map((audio, key) => (
        <div key={key}>
          Audio Piece {key}
          <br></br>
          <audio controls src={audio.src}></audio>
        </div>
      ))} */}
      
    </div>
  )
}