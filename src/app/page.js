'use client'

import React, { useState, useRef, useEffect } from "react"
import { generateWave } from '@/utils/generateWave'

const KokoroModelID = 'onnx-community/Kokoro-82M-v1.0-ONNX'


export default function TTS() {
  const [status, setStatus] = useState('loading')
  const [textInput, setTextInput] = useState('This is the default text for this text input to be replaced later. This is the default text for this text input to be replaced later. This is the default text for this text input to be replaced later.')
  const [audio, setAudio] = useState(null)
  const ttsModel = useRef(null)
  const [bufferAudio, setBufferAudio] = useState(null)

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
      arraysToGenerate.push(tempTextToSplit)
      console.log('arraysToGenerate')
      console.log(arraysToGenerate)
      console.log('tempTextToSplit')
      console.log(tempTextToSplit)
      tempTextToSplit = ''
    }
    return arraysToGenerate
  }

  async function generateAudio() {
  if (!ttsModel.current) {
    setStatus('Wait for model to load');
    return;
  }

  try {
    setStatus('Generating...');
    let fullRawAudio = null; // Raw PCM accumulator (assuming Float32Array)
    const sampleRate = 24000; // Or collect from first result

    const arraysToGenerate = splitString(textInput);
    for (let i = 0; i < arraysToGenerate.length; i++) {
      const result = await ttsModel.current.generate(arraysToGenerate[i], { voice: 'af_heart' });
      
      if (!fullRawAudio) {
        fullRawAudio = result.audio; // First chunk's raw (Float32Array)
      } else {
        // Append raw audio samples
        const combined = new Float32Array(fullRawAudio.length + result.audio.length);
        combined.set(fullRawAudio, 0);
        combined.set(result.audio, fullRawAudio.length);
        fullRawAudio = combined;
      }
      console.log(i)
    }

    // Generate one full WAV from combined raw
    const fullWavBuffer = generateWave(fullRawAudio, sampleRate);
    setBufferAudio(fullWavBuffer); // Or directly set audio here
    setStatus('Audio Generated');
  } catch (error) {
    console.error(`Error generating audio: ${error}`);
    setStatus(`Error: ${error.message}`);
  }
}

// Updated useEffect for audio src + cleanup
useEffect(() => {
  if (bufferAudio) {
    // Revoke old URL if exists
    if (audio) {
      URL.revokeObjectURL(audio);
    }
    
    const blob = new Blob([bufferAudio], { type: 'audio/wav' });
    const newUrl = URL.createObjectURL(blob);
    setAudio(newUrl);
  }
}, [bufferAudio]);

// Optional: Cleanup on unmount/component destroy
useEffect(() => {
  return () => {
    if (audio) URL.revokeObjectURL(audio);
  };
}, [audio]); // Or run on every audio change

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
        <audio controls src={audio}></audio>
        {/* <audio controls src={audioBuffer}></audio> */}
      </div>
      {/* {arrayOfAudio.map((audio, key) => (
        <div key={key}>
          Au
          dio Piece {key}
          <br></br>
          <audio controls src={audio.src}></audio>
        </div>
      ))} */}
      
    </div>
  )
}