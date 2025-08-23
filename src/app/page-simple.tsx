export default function SimplePage() {
  console.log('🔍 [DEPLOYMENT DEBUG] SimplePage rendering')
  console.log('🔍 [DEPLOYMENT DEBUG] SimplePage environment:', {
    NODE_ENV: process.env.NODE_ENV,
    VERCEL_ENV: process.env.VERCEL_ENV,
    timestamp: new Date().toISOString()
  })
  
  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-blue-500 mb-4">🏠 Simple Home Page</h1>
        <p className="text-gray-400 mb-4">This is a minimal test page</p>
        <p className="text-sm text-gray-500">
          Environment: {process.env.NODE_ENV || 'unknown'}<br/>
          Vercel: {process.env.VERCEL_ENV || 'unknown'}<br/>
          Time: {new Date().toISOString()}
        </p>
      </div>
    </div>
  )
}
