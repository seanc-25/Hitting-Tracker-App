export default function DashboardPage() {
  console.log('🔍 [DEPLOYMENT DEBUG] DashboardPage rendering')
  console.log('🔍 [DEPLOYMENT DEBUG] DashboardPage environment:', {
    NODE_ENV: process.env.NODE_ENV,
    VERCEL_ENV: process.env.VERCEL_ENV,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'SET' : 'MISSING'
  })
  
  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-blue-500 mb-4">🏠 Dashboard Test Page</h1>
        <p className="text-gray-400 mb-4">This is a simplified dashboard for testing deployment</p>
        <p className="text-sm text-gray-500">
          Environment: {process.env.NODE_ENV || 'unknown'}<br/>
          Vercel: {process.env.VERCEL_ENV || 'unknown'}<br/>
          Supabase URL: {process.env.NEXT_PUBLIC_SUPABASE_URL ? 'SET' : 'MISSING'}<br/>
          Time: {new Date().toISOString()}
        </p>
      </div>
    </div>
  )
}
