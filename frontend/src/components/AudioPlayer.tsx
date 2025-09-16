import React, { useRef, useState, useEffect } from 'react'
import { Play, Pause, Volume2, VolumeX } from 'lucide-react'

interface AudioPlayerProps {
  src: string
  mimeType: string
  className?: string
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({ src, mimeType, className = '' }) => {
  const audioRef = useRef<HTMLAudioElement>(null)
  const blobUrlRef = useRef<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isMuted, setIsMuted] = useState(false)
  const [volume, setVolume] = useState(1)

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return


    // Reset loading state when src changes
    setIsLoading(true)
    setHasError(false)

    // Set a timeout to stop loading if it takes too long
    const loadingTimeout = setTimeout(() => {
      if (isLoading) {
        setIsLoading(false)
      }
    }, 10000) // 10 second timeout

    const handleLoadStart = () => {
      setIsLoading(true)
      setHasError(false)
    }

    const handleLoadedMetadata = () => {
      setIsLoading(false)
      setDuration(audio.duration)
    }

    const handleCanPlay = () => {
      setIsLoading(false)
      if (audio.duration && !isNaN(audio.duration)) {
        setDuration(audio.duration)
      }
    }

    const handleCanPlayThrough = () => {
      setIsLoading(false)
    }

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime)
    }

    const handlePlay = () => {
      setIsPlaying(true)
    }

    const handlePause = () => {
      setIsPlaying(false)
    }

    const handleEnded = () => {
      setIsPlaying(false)
      setCurrentTime(0)
    }

    const handleError = (e: Event) => {
      console.error('AudioPlayer: Audio error:', e, 'Error details:', audio.error)
      setIsLoading(false)
      setHasError(true)
    }

    const handleLoadedData = () => {
      setIsLoading(false)
    }

    // Add all event listeners
    audio.addEventListener('loadstart', handleLoadStart)
    audio.addEventListener('loadedmetadata', handleLoadedMetadata)
    audio.addEventListener('loadeddata', handleLoadedData)
    audio.addEventListener('canplay', handleCanPlay)
    audio.addEventListener('canplaythrough', handleCanPlayThrough)
    audio.addEventListener('timeupdate', handleTimeUpdate)
    audio.addEventListener('play', handlePlay)
    audio.addEventListener('pause', handlePause)
    audio.addEventListener('ended', handleEnded)
    audio.addEventListener('error', handleError)

    // Set audio properties
    audio.crossOrigin = 'anonymous'
    audio.preload = 'auto' // Changed from 'metadata' to 'auto' to force loading
    
    // Simple approach - just set the src and load
    audio.src = src
    audio.load()

    return () => {
      clearTimeout(loadingTimeout)
      // Clean up blob URL if exists
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current)
        blobUrlRef.current = null
      }
      audio.removeEventListener('loadstart', handleLoadStart)
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata)
      audio.removeEventListener('loadeddata', handleLoadedData)
      audio.removeEventListener('canplay', handleCanPlay)
      audio.removeEventListener('canplaythrough', handleCanPlayThrough)
      audio.removeEventListener('timeupdate', handleTimeUpdate)
      audio.removeEventListener('play', handlePlay)
      audio.removeEventListener('pause', handlePause)
      audio.removeEventListener('ended', handleEnded)
      audio.removeEventListener('error', handleError)
    }
  }, [src, mimeType])

  const togglePlay = () => {
    const audio = audioRef.current
    if (!audio) return

    if (isPlaying) {
      audio.pause()
    } else {
      // Always try to play, even if still loading
      audio.play().catch((error) => {
        console.error('AudioPlayer: Play failed:', error)
        // If play fails, try loading first
        audio.load()
        setTimeout(() => {
          audio.play().catch(console.error)
        }, 500)
      })
    }
  }

  const toggleMute = () => {
    const audio = audioRef.current
    if (!audio) return

    if (isMuted) {
      audio.volume = volume
      setIsMuted(false)
    } else {
      audio.volume = 0
      setIsMuted(true)
    }
  }

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value)
    const audio = audioRef.current
    if (!audio) return

    setVolume(newVolume)
    audio.volume = newVolume
    setIsMuted(newVolume === 0)
  }

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current
    if (!audio) return

    const newTime = parseFloat(e.target.value)
    audio.currentTime = newTime
    setCurrentTime(newTime)
  }

  const formatTime = (time: number) => {
    if (isNaN(time) || !isFinite(time)) return '0:00'
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  if (hasError) {
    return (
      <div className={`flex items-center space-x-2 text-red-500 ${className}`}>
        <span className="text-sm">Failed to load audio</span>
        <button 
          onClick={() => {
          }}
          className="text-xs bg-red-100 px-2 py-1 rounded"
        >
          Debug
        </button>
      </div>
    )
  }

  return (
    <div className={`flex items-center space-x-2 bg-gray-50 rounded-lg p-2 ${className}`}>
      <audio ref={audioRef} preload="metadata" crossOrigin="anonymous">
        <source src={src} type={mimeType} />
        Your browser does not support the audio element.
      </audio>

      {/* Play/Pause Button */}
      <button
        onClick={togglePlay}
        disabled={isLoading}
        className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-200 hover:bg-gray-300 disabled:opacity-50 touch-manipulation"
      >
        {isLoading ? (
          <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
        ) : isPlaying ? (
          <Pause className="w-4 h-4 text-gray-700" />
        ) : (
          <Play className="w-4 h-4 text-gray-700 ml-0.5" />
        )}
      </button>

      {/* Debug button for stuck loading */}
      {isLoading && (
        <button
          onClick={() => {
            const audio = audioRef.current
            if (audio) {
              audio.load()
              setTimeout(() => {
                audio.play().catch(console.error)
              }, 100)
            }
          }}
          className="text-xs bg-blue-100 px-2 py-1 rounded text-blue-800"
        >
          Debug & Load
        </button>
      )}

      {/* Time Display */}
      <div className="text-xs text-gray-600 min-w-[70px]">
        {isLoading ? (
          'Loading...'
        ) : (
          `${formatTime(currentTime)} / ${duration && isFinite(duration) ? formatTime(duration) : '--:--'}`
        )}
      </div>

      {/* Progress Bar */}
      <div className="flex-1">
        <input
          type="range"
          min="0"
          max={duration || 0}
          value={currentTime}
          onChange={handleSeek}
          disabled={isLoading}
          className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer disabled:opacity-50 touch-manipulation"
        />
      </div>

      {/* Volume Control */}
      <div className="flex items-center space-x-1">
        <button
          onClick={toggleMute}
          className="flex items-center justify-center w-8 h-8 text-gray-600 hover:text-gray-800 touch-manipulation"
        >
          {isMuted ? (
            <VolumeX className="w-4 h-4" />
          ) : (
            <Volume2 className="w-4 h-4" />
          )}
        </button>
        <input
          type="range"
          min="0"
          max="1"
          step="0.1"
          value={isMuted ? 0 : volume}
          onChange={handleVolumeChange}
          className="w-12 h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer touch-manipulation"
        />
      </div>
    </div>
  )
}
