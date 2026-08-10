/**
 * Camera Health Event Manager
 *
 * Menerjemahkan perubahan status Camera Health menjadi event
 * yang siap digunakan oleh Voice Alert, Dashboard, WebSocket.
 *
 * Hanya menghasilkan event ketika status berubah
 * (tidak mengulang event yang sama).
 */

export function createCameraHealthEvent({
  cameraHealth,
  healthSummary,
  decisionSummary,
  previousDecision,
}) {
  if (!decisionSummary || !previousDecision) return null

  const currentReason = decisionSummary.reason
  const prevReason = previousDecision.reason

  // No change → no event
  if (currentReason === prevReason) return null

  // Healthy → Healthy → no event (handled above)
  // Restored to healthy
  if (currentReason === 'Camera Healthy') {
    return {
      id: `camera-${Date.now()}`,
      timestamp: Date.now(),
      type: 'camera_health',
      severity: 'Info',
      title: 'Camera Restored',
      message: 'Camera health has been restored.',
      reason: currentReason,
      healthScore: healthSummary?.health_score ?? null,
      allowInference: decisionSummary.allow_inference,
    }
  }

  // Map reason to severity & title
  const criticalReasons = ['Camera Offline', 'Camera Covered', 'Poor Camera Health']
  const warningReasons = ['Dirty Lens', 'Camera Shift', 'Low Light', 'Very Dark', 'Too Bright']

  let severity = 'Info'
  if (criticalReasons.includes(currentReason)) {
    severity = 'Critical'
  } else if (warningReasons.includes(currentReason)) {
    severity = 'Warning'
  }

  return {
    id: `camera-${Date.now()}`,
    timestamp: Date.now(),
    type: 'camera_health',
    severity,
    title: currentReason,
    message: `Camera health issue detected: ${currentReason}.`,
    reason: currentReason,
    healthScore: healthSummary?.health_score ?? null,
    allowInference: decisionSummary.allow_inference,
  }
}
