# नेपाल खबर - Nepal News Portal 🗞️

A fully automated, AI-powered Nepali news aggregation portal that fetches global news and translates it to Nepali.

## 🌟 Features

### ✅ Completed (Frontend)
- 📱 **Fully Responsive** - Mobile-first design optimized for Nepali users
- 🇳🇵 **Nepali Language Support** - Complete Devanagari Unicode rendering
- 🎨 **Modern UI/UX** - Clean, intuitive interface with Nepal's national colors
- 🔥 **Breaking News Ticker** - Live updates rotating every 5 seconds
- 📊 **Category Navigation** - Politics, Economy, Sports, Tech, Health, Entertainment, World
- 🔍 **Search Functionality** - Find news easily
- 💬 **Comments System** - Reader engagement with moderation
- ❤️ **Reactions** - Like, Love, Wow emoji reactions
- 🏷️ **Tags System** - Article tagging for better discovery
- 📈 **Trending News Sidebar** - Most viewed articles
- 🌤️ **Weather Widget** - Kathmandu weather display
- 📱 **Social Sharing** - Facebook, Twitter, WhatsApp, Email
- ⚡ **Fast Loading** - Optimized performance with Next.js 14
- 🎯 **SEO Optimized** - Meta tags and structured data

### 🔄 To Be Implemented (Backend)
- 🤖 **News Fetcher Engine** - Auto-fetch from RSS feeds
- 🌐 **AI Translation** - Gemini/GPT API integration
- 🗄️ **Database Integration** - Supabase PostgreSQL
- 👨‍💼 **Admin Panel Backend** - API integration
- ⏰ **Scheduler** - Automated fetching every 30 mins
- 📊 **Analytics** - View tracking and metrics

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ installed
- npm or yarn package manager

### Installation

1. **Clone or extract the project**
```bash
cd nepali-news-portal
```

2. **Install dependencies**
```bash
npm install
```

3. **Run development server**
```bash
npm run dev
```

4. **Open in browser**
```
http://localhost:3000
```

## 📁 Project Structure

```
nepali-news-portal/
├── app/
│   ├── components/          # React components
│   │   ├── Header.tsx       # Navigation and search
│   │   ├── Footer.tsx       # Footer with links
│   │   ├── NewsCard.tsx     # Article card component
│   │   ├── TrendingNews.tsx # Sidebar trending
│   │   ├── BreakingNews.tsx # Live news ticker
│   │   └── CategorySection.tsx # Homepage sections
│   ├── news/[id]/          # Article detail pages
│   │   └── page.tsx        # Individual article view
│   ├── lib/
│   │   └── mockData.ts     # Sample Nepali news data
│   ├── layout.tsx          # Root layout
│   ├── page.tsx            # Homepage
│   └── globals.css         # Global styles
├── public/                 # Static assets
├── package.json           # Dependencies
├── tailwind.config.js     # Tailwind configuration
├── tsconfig.json          # TypeScript config
└── next.config.js         # Next.js configuration
```

## 🎨 Design Features

### Color Scheme
- **Primary Blue**: `#003893` (Nepal flag blue)
- **Primary Red**: `#DC143C` (Nepal flag red)
- **Background**: Light gray `#F9FAFB`
- **Text**: Dark gray `#1F2937`

### Typography
- **Font**: Noto Sans Devanagari (Google Fonts)
- **Supports**: Perfect Nepali Unicode rendering
- **Weights**: 300, 400, 500, 600, 700, 800

### Components
1. **Header**
   - Sticky navigation
   - Live badge
   - Category menu
   - Search bar
   - Mobile hamburger menu

2. **News Cards**
   - Image with category badge
   - Title and summary
   - Source attribution
   - View count, comments, likes
   - Interactive reactions

3. **Article Page**
   - Full article content
   - Source link back to original
   - Tags
   - Reactions (👍 ❤️ 😮)
   - Comments with moderation notice
   - Related articles sidebar

4. **Sidebar Widgets**
   - Trending news with rankings
   - Weather widget
   - Quick links
   - Ad space placeholders

## 🌐 Pages

### Homepage (`/`)
- Breaking news ticker
- Featured articles grid
- Category sections (Politics, Economy, Sports, Tech)
- Trending sidebar
- Weather widget

### Article Page (`/news/[id]`)
- Full article content in Nepali
- Source attribution with original link
- Reading time estimate
- Share buttons
- Reactions system
- Comments section with form
- Related articles

### Category Pages (Coming Soon)
- `/politics` - राजनीति
- `/economy` - अर्थतन्त्र
- `/sports` - खेलकुद
- `/tech` - प्रविधि
- `/entertainment` - मनोरञ्जन
- `/world` - विश्व
- `/health` - स्वास्थ्य

## 🔧 Configuration

### Environment Variables (for production)
Create `.env.local`:

```bash
# Database
DATABASE_URL=your_supabase_url
DATABASE_KEY=your_supabase_key

# AI Translation
GEMINI_API_KEY=your_gemini_key
# OR
OPENAI_API_KEY=your_openai_key

# News APIs
NEWS_API_KEY=your_newsapi_key
```

## 📦 Deployment

### Deploy to Vercel (Recommended - FREE)

1. **Push to GitHub**
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin your-repo-url
git push -u origin main
```

2. **Deploy on Vercel**
- Go to [vercel.com](https://vercel.com)
- Click "New Project"
- Import your GitHub repository
- Click "Deploy"
- Done! Your site is live

### Deploy to Netlify

```bash
npm run build
```

Then drag the `.next` folder to Netlify drop zone.

## 🗄️ Next Steps - Backend Integration

### Phase 1: Database Setup
1. Create Supabase account (free tier)
2. Create tables from the schema we designed
3. Get connection string
4. Add to `.env.local`

### Phase 2: News Fetcher
1. Create `/api/fetch-news` endpoint
2. Implement RSS feed parser
3. Store raw articles in database
4. Set up cron job (GitHub Actions or Vercel Cron)

### Phase 3: AI Translation
1. Get Gemini API key (free tier)
2. Create `/api/translate` endpoint
3. Implement translation logic with proper Nepali prompt
4. Test with 50+ articles for quality

### Phase 4: Admin Panel Integration
1. Connect admin panel to database
2. Implement URL management API
3. Add authentication
4. Connect fetch logs display

## 🎯 Mobile Optimization

- Touch-friendly buttons (min 44x44px)
- Readable font sizes (16px minimum)
- Optimized images with lazy loading
- Fast page loads (< 3 seconds)
- Works on 3G networks
- Offline support (PWA - coming soon)

## 🔒 Legal & Compliance

### Source Attribution
- ✅ Every article shows source
- ✅ Original link provided
- ✅ "Translated from [language]" notice
- ✅ Summarized content, not full copy

### Privacy
- No tracking cookies (yet)
- Comments require name/email only
- Email never shown publicly
- GDPR compliant

## 🐛 Known Issues

- Mock data only (backend not connected)
- Category pages not implemented
- Search not functional (UI only)
- Weather widget shows static data
- No actual translation happening yet

## 📱 Browser Support

- ✅ Chrome/Edge (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Mobile browsers (iOS/Android)
- ✅ Opera
- ⚠️ IE11 not supported

## 🤝 Contributing

This is a personal project, but suggestions are welcome!

## 📄 License

All rights reserved. © 2024 नेपाल खबर

## 📞 Contact

For queries about the project:
- Create an issue on GitHub
- Email: [your-email]

## 🙏 Acknowledgments

- News sources: BBC, Reuters, The Himalayan Times, etc.
- Font: Google Fonts (Noto Sans Devanagari)
- Icons: Lucide React
- Framework: Next.js by Vercel
- Hosting: Vercel (free tier)

---

**नेपाल खबर** - विश्वभरका समाचार नेपालीमा 🇳🇵
