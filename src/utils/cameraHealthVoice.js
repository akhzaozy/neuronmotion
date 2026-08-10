/**
 * Camera Health Voice Alert
 *
 * Memainkan suara peringatan dalam Bahasa Indonesia
 * berdasarkan Camera Health Event.
 */

const VOICE_MAP = {
  'Camera Offline': 'Peringatan. Kamera sedang offline. Pemantauan AI dihentikan.',
  'Camera Covered': 'Peringatan. Lensa kamera tertutup. Mohon segera periksa kamera.',
  'Poor Camera Health': 'Peringatan. Kondisi kamera tidak baik. Pemantauan AI dihentikan.',
  'Dirty Lens': 'Peringatan. Lensa kamera kotor. Mohon segera dibersihkan.',
  'Camera Shift': 'Peringatan. Posisi kamera berubah. Mohon lakukan kalibrasi ulang.',
  'Low Light': 'Peringatan. Pencahayaan kurang. Akurasi deteksi dapat menurun.',
  'Very Dark': 'Peringatan. Area terlalu gelap. Akurasi deteksi dapat menurun.',
  'Too Bright': 'Peringatan. Cahaya terlalu terang. Akurasi deteksi dapat menurun.',
  'Camera Restored': 'Kamera kembali normal. Pemantauan AI dilanjutkan.',
}

export function playCameraHealthVoice(event, cooldownRef) {
  if (!event || !event.title) return

  const { title } = event

  if (title === 'Camera Restored') {
    speak(VOICE_MAP[title])
    return
  }

  const now = Date.now()
  const lastPlayed = cooldownRef.current[title] || 0
  if (now - lastPlayed < 10000) {
    console.log(`[VOICE] Skip "${title}" (cooldown ${10 - ((now - lastPlayed) / 1000).toFixed(1)}s)`)
    return
  }

  cooldownRef.current[title] = now

  const message = VOICE_MAP[title]
  if (!message) {
    console.warn('[VOICE] No message for:', title)
    return
  }

  speak(message)
}

function speak(text) {
  if (!('speechSynthesis' in window)) {
    console.warn('[VOICE] Speech synthesis not supported')
    return
  }

  window.speechSynthesis.cancel()

  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = 'id-ID'
  utterance.rate = 0.95
  utterance.pitch = 1.0
  utterance.volume = 1.0

  const voices = window.speechSynthesis.getVoices()
  const idVoice = voices.find(
    (v) => v.lang === 'id-ID' || v.lang.startsWith('id')
  )
  if (idVoice) {
    utterance.voice = idVoice
  }

  console.log('[VOICE] Playing:', text)
  window.speechSynthesis.speak(utterance)
}
