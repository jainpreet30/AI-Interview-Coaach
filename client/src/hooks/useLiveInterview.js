import { useEffect, useRef, useState, useCallback } from 'react';
import io from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export function useLiveInterviewSocket(token) {
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!token) return;

    socketRef.current = io(SOCKET_URL, {
      auth: {
        token
      },
      transports: ['websocket']
    });

    socketRef.current.on('connect', () => {
      console.log('Socket connected');
      setConnected(true);
    });

    socketRef.current.on('disconnect', () => {
      console.log('Socket disconnected');
      setConnected(false);
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, [token]);

  return { socket: socketRef.current, connected };
}

export function useAudioRecorder() {
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const recordingIntervalRef = useRef(null);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      // Track recording time
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (error) {
      console.error('Failed to start recording:', error);
      setIsRecording(false);
      throw new Error('Microphone access is required to record your answer.');
    }
  }, []);

  const stopRecording = useCallback(async () => {
    return new Promise((resolve) => {
      if (!mediaRecorderRef.current) {
        resolve(null);
        return;
      }

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const arrayBuffer = await audioBlob.arrayBuffer();

        // Stop all tracks
        mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());

        clearInterval(recordingIntervalRef.current);
        recordingIntervalRef.current = null;
        setIsRecording(false);

        resolve({
          audioBuffer: new Uint8Array(arrayBuffer),
          durationSeconds: recordingTime,
          blob: audioBlob
        });
      };

      mediaRecorderRef.current.stop();
    });
  }, [recordingTime]);

  return {
    startRecording,
    stopRecording,
    isRecording,
    recordingTime
  };
}

export function useAudioPlayback() {
  const audioContextRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const speakText = useCallback((text) => {
    if (!text || !('speechSynthesis' in window)) return false;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.onstart = () => setIsPlaying(true);
    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = () => setIsPlaying(false);
    window.speechSynthesis.speak(utterance);
    return true;
  }, []);

  const playAudio = useCallback(async (audioData) => {
    try {
      // Handle base64 audio
      let audioBuffer;
      if (typeof audioData === 'string') {
        const binaryString = atob(audioData);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        audioBuffer = bytes;
      } else {
        audioBuffer = new Uint8Array(audioData);
      }

      // Create audio context if needed
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }

      const audioCtx = audioContextRef.current;
      const decodedAudio = await audioCtx.decodeAudioData(audioBuffer.buffer);

      const source = audioCtx.createBufferSource();
      source.buffer = decodedAudio;
      source.connect(audioCtx.destination);

      setIsPlaying(true);
      source.start(0);

      source.onended = () => {
        setIsPlaying(false);
      };
    } catch (error) {
      console.error('Error playing audio:', error);
    }
  }, []);

  return {
    playAudio,
    speakText,
    isPlaying
  };
}

export function useBrowserSpeechRecognition() {
  const recognitionRef = useRef(null);
  const transcriptRef = useRef('');
  const resolveStopRef = useRef(null);
  const startedAtRef = useRef(null);
  const [isListening, setIsListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState(null);
  const [isSupported] = useState(() => (
    typeof window !== 'undefined' && Boolean(window.SpeechRecognition || window.webkitSpeechRecognition)
  ));

  useEffect(() => {
    if (!isSupported) return undefined;

    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new Recognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
      let interim = '';
      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const result = event.results[index];
        if (result.isFinal) {
          transcriptRef.current += `${result[0].transcript} `;
        } else {
          interim += result[0].transcript;
        }
      }
      setInterimTranscript(interim.trim());
    };

    recognition.onerror = (event) => {
      setError(event.error === 'not-allowed'
        ? 'Microphone access is required for browser transcription.'
        : 'Browser transcription could not start.');
      setIsListening(false);
      resolveStopRef.current?.({
        text: transcriptRef.current.trim(),
        durationSeconds: startedAtRef.current
          ? Math.max(1, Math.round((Date.now() - startedAtRef.current) / 1000))
          : 0
      });
      resolveStopRef.current = null;
    };

    recognition.onend = () => {
      setIsListening(false);
      setInterimTranscript('');
      resolveStopRef.current?.({
        text: transcriptRef.current.trim(),
        durationSeconds: startedAtRef.current
          ? Math.max(1, Math.round((Date.now() - startedAtRef.current) / 1000))
          : 0
      });
      resolveStopRef.current = null;
    };

    recognitionRef.current = recognition;
    return () => {
      recognition.abort();
      recognitionRef.current = null;
    };
  }, [isSupported]);

  const startListening = useCallback(() => {
    if (!recognitionRef.current) {
      throw new Error('Browser transcription is not supported in this browser.');
    }

    setError(null);
    transcriptRef.current = '';
    setInterimTranscript('');
    startedAtRef.current = Date.now();
    recognitionRef.current.start();
    setIsListening(true);
  }, []);

  const stopListening = useCallback(() => new Promise((resolve) => {
    if (!recognitionRef.current || !isListening) {
      resolve({ text: transcriptRef.current.trim(), durationSeconds: 0 });
      return;
    }

    resolveStopRef.current = resolve;
    recognitionRef.current.stop();
  }), [isListening]);

  return {
    startListening,
    stopListening,
    isListening,
    interimTranscript,
    isSupported,
    error
  };
}

export function useSpeechMetrics(text, durationSeconds) {
  const [metrics, setMetrics] = useState(null);

  useEffect(() => {
    if (!text) {
      setMetrics(null);
      return;
    }

    // Calculate metrics client-side
    const wordCount = text.trim().split(/\s+/).length;
    const wpm = durationSeconds > 0 ? Math.round((wordCount / durationSeconds) * 60) : 0;

    // Detect filler words
    const fillerWords = [
      'um', 'uh', 'like', 'you know', 'actually', 'basically', 'obviously',
      'literally', 'essentially', 'I mean', 'at the end of the day', 'sort of',
      'kind of', 'so', 'well', 'anyway', 'hmm', 'err', 'erm'
    ];

    let fillerCount = 0;
    const found = [];
    const lowerText = text.toLowerCase();

    fillerWords.forEach(filler => {
      const regex = new RegExp(`\\b${filler}\\b`, 'gi');
      const matches = lowerText.match(regex);
      if (matches) {
        fillerCount += matches.length;
        found.push(...matches.map(m => m.toLowerCase()));
      }
    });

    // Calculate confidence score
    let confidenceScore = 100;
    confidenceScore -= Math.min((fillerCount / wordCount) * 100 * 5, 20);
    if (wpm < 100) confidenceScore -= 15;
    if (wpm > 180) confidenceScore -= 10;
    if (wordCount < 20) confidenceScore -= 20;
    confidenceScore = Math.max(0, Math.min(100, confidenceScore));

    setMetrics({
      wordCount,
      wpm,
      fillerWordCount: fillerCount,
      fillerWordsFound: [...new Set(found)],
      confidenceScore: Math.round(confidenceScore),
      durationSeconds
    });
  }, [text, durationSeconds]);

  return metrics;
}
