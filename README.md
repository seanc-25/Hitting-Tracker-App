# Baseball Stats Tracker

A mobile-optimized web app for tracking and analyzing baseball at-bat performance. Built with Next.js, Clerk authentication, and Supabase.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Clerk account (for authentication)
- Supabase account (for data storage)

### Environment Setup

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd next-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Create environment file**
   ```bash
   cp .env.example .env.local
   ```

4. **Configure environment variables**
   Edit `.env.local` with your credentials:
   ```env
   # Clerk Authentication
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_[your-key-here]
   CLERK_SECRET_KEY=sk_test_[your-key-here]
   
   # Supabase (for data storage)
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```

### Development

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## 📱 Mobile Features

- **PWA Support**: Add to home screen for app-like experience
- **Mobile-First Design**: Optimized for mobile browsers
- **Touch-Friendly**: Large buttons and intuitive gestures
- **Offline-Ready**: Works without internet connection

## 🏗️ Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS
- **Authentication**: Clerk
- **Database**: Supabase
- **Deployment**: Vercel

## 📊 Features

- **At-Bat Logging**: Track pitch type, location, timing, contact quality
- **Performance Analytics**: Visual charts and statistics
- **Data Management**: Edit and delete at-bat records
- **Mobile Navigation**: Bottom navigation with floating action button

## 🔧 Configuration

### Clerk Setup
1. Create account at [clerk.com](https://clerk.com)
2. Create new application
3. Copy publishable and secret keys
4. Add to environment variables

### Supabase Setup
1. Create project at [supabase.com](https://supabase.com)
2. Run database migrations from `/supabase/migrations/`
3. Copy URL and anon key
4. Add to environment variables

## 📦 Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Make changes
4. Submit pull request

## 📄 License

MIT License - see LICENSE file for details