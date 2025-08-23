export default function Template({ children }: { children: React.ReactNode }) {
  console.log('🔍 [DEPLOYMENT DEBUG] Template rendering')
  
  return (
    <div className="app-template">
      {children}
    </div>
  )
}
