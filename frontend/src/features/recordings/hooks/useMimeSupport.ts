import { useCallback } from 'react'

export const useMimeSupport = () => {
  const getSupportedMimeType = useCallback((): string => {
    // Check for WebM/Opus support (Chrome, Firefox)
    if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
      return 'audio/webm;codecs=opus'
    }
    
    // Check for WebM without codec specification
    if (MediaRecorder.isTypeSupported('audio/webm')) {
      return 'audio/webm'
    }
    
    // Check for MP4/AAC support (Safari, iOS)
    if (MediaRecorder.isTypeSupported('audio/mp4;codecs=aac')) {
      return 'audio/mp4;codecs=aac'
    }
    
    // Check for MP4 without codec specification
    if (MediaRecorder.isTypeSupported('audio/mp4')) {
      return 'audio/mp4'
    }
    
    // Fallback to basic audio/webm
    return 'audio/webm'
  }, [])

  const isMimeSupported = useCallback((mimeType: string): boolean => {
    return MediaRecorder.isTypeSupported(mimeType)
  }, [])

  const getBrowserInfo = useCallback(() => {
    const userAgent = navigator.userAgent
    const isChrome = /Chrome/.test(userAgent) && /Google Inc/.test(navigator.vendor)
    const isFirefox = /Firefox/.test(userAgent)
    const isSafari = /Safari/.test(userAgent) && /Apple Computer/.test(navigator.vendor)
    const isEdge = /Edg/.test(userAgent)
    
    return {
      isChrome,
      isFirefox,
      isSafari,
      isEdge,
      userAgent
    }
  }, [])

  return {
    getSupportedMimeType,
    isMimeSupported,
    getBrowserInfo
  }
}


