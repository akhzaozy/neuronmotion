import React from 'react'

function App() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#0d1117', color: '#f0f6fc', fontFamily: 'sans-serif' }}>
      <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🧠 NeuronMotion</h1>
      <p style={{ color: '#8b949e', fontSize: '1.1rem' }}>Sistem Skrining Gangguan Saraf Berbasis Computer Vision</p>
      <p style={{ marginTop: '2rem', padding: '0.75rem 1.5rem', background: '#21262d', borderRadius: '8px', color: '#3fb950' }}>
        ✅ Backend API aktif di <strong>http://localhost:4000</strong>
      </p>
      <p style={{ color: '#8b949e', marginTop: '1rem', fontSize: '0.9rem' }}>Frontend sedang dalam pengembangan...</p>
    </div>
  )
}

export default App
