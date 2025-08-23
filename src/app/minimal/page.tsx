export default function MinimalPage() {
  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#000', 
      color: '#fff',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{ textAlign: 'center' }}>
        <h1 style={{ fontSize: '2rem', color: '#10B981', marginBottom: '1rem' }}>
          ✅ Minimal Page Working!
        </h1>
        <p style={{ color: '#9CA3AF', marginBottom: '1rem' }}>
          This is a completely minimal page with no imports or complex logic.
        </p>
        <div style={{ 
          backgroundColor: '#1F2937', 
          padding: '20px', 
          borderRadius: '8px',
          marginTop: '20px'
        }}>
          <h2 style={{ color: '#F59E0B', marginBottom: '1rem' }}>Debug Info</h2>
          <p><strong>Page:</strong> /minimal</p>
          <p><strong>Time:</strong> {new Date().toISOString()}</p>
          <p><strong>Status:</strong> <span style={{ color: '#10B981' }}>Rendering Successfully</span></p>
        </div>
      </div>
    </div>
  )
}
