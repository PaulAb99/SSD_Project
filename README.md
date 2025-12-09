# 🏛️ Echoes: Timișoara Digital Heritage Trail

<div align="center">

**Discover Romania's Cultural Heritage Through an Interactive GPS-Powered Experience**

[![Built with React](https://img.shields.io/badge/React-18-blue.svg)](https://reactjs.org/)
[![Powered by Supabase](https://img.shields.io/badge/Supabase-Enabled-green.svg)](https://supabase.com/)
[![PWA Ready](https://img.shields.io/badge/PWA-Ready-purple.svg)](https://web.dev/progressive-web-apps/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

</div>

---

## 📖 About

**Echoes** is a mobile-first progressive web application that transforms how people experience Timișoara's rich cultural heritage. As users explore Romania's first free city, they unlock geo-located audio stories, historical images, and fascinating details about iconic landmarks through GPS-triggered content.

This immersive digital heritage trail combines cutting-edge web technology with cultural preservation, making history accessible, engaging, and interactive for locals and tourists alike.

### 🎯 Key Highlights

- 🗺️ **GPS-Based Discovery**: Automatically unlock content as you approach heritage sites
- 🎧 **Multi-Language Audio**: Stories in Romanian, Hungarian, English, German & French
- 🏆 **Gamification**: Earn points, climb leaderboards, and track your discoveries
- 👥 **Social Features**: Connect with friends and see their heritage journey
- 🎨 **Beautiful UI**: Earth-toned design inspired by Timișoara's baroque architecture
- 📱 **Mobile-First**: Optimized for on-the-go exploration with PWA capabilities

---

## ✨ Features

### 🗺️ Interactive Heritage Map
- Real-time GPS tracking with OpenStreetMap tiles
- 45+ pre-loaded cultural nodes across Timișoara
- Proximity-based content unlocking (50m radius)
- Visual indicators for discovered/undiscovered locations
- Custom node markers with category-based icons

### 🎵 Audio & Content
- AI-generated multi-language narrations using Google Gemini
- Historic images from multiple sources
- Detailed descriptions and historical context
- Interactive audio player with playback controls
- Automatic translation system for 5 languages

### 👤 User Experience
- User authentication with Supabase Auth
- Profile management and statistics tracking
- Discovery history and achievement system
- Personalized onboarding tutorial
- Dark/light theme support

### 🎮 Gamification & Social
- **Leaderboard System**: Compete with other heritage explorers
- **Points System**: Earn 10 points per discovery
- **Friends System**: Add friends, view their discoveries, send requests
- **Activity Tracking**: Monitor your progress and stats
- **Achievement Badges**: Unlock special milestones

### 🛤️ Route Planning
- **Smart Route Generation**: AI-powered route creation based on preferences
- **Category Filtering**: Choose specific heritage types to visit
- **Time-Based Planning**: Create routes that fit your schedule
- **Custom Paths**: Select specific locations for a personalized tour
- **Turn-by-Turn Navigation**: Get directions to each heritage site

### 🤖 AI Assistant
- Built-in heritage chatbot powered by Google Gemini
- Ask questions about locations, history, and context
- Get personalized recommendations for nearby restaurants and cafes
- Practical visiting tips and opening hours

### 🌍 Translation System
- Pre-translated content for instant language switching
- Support for 5 languages: Romanian, Hungarian, English, German, French
- Node-specific translations stored in database
- UI translations with fallback support

### 🏗️ Community Features
- **Location Requests**: Users can suggest new heritage sites
- **Photo Uploads**: Share images of cultural locations
- **Admin Dashboard**: Approve and manage user submissions
- **User Reviews**: (Coming soon) Rate and review locations

---

## 🛠️ Technology Stack

### Frontend
- **Framework**: React 18 with Vite for lightning-fast builds
- **State Management**: Zustand for efficient global state
- **Styling**: Tailwind CSS + Relume UI components
- **Animations**: Framer Motion for smooth transitions
- **Maps**: Leaflet + React Leaflet for interactive mapping
- **Routing**: Leaflet Routing Machine for navigation
- **Icons**: Lucide React icon library
- **Alerts**: SweetAlerts2 for beautiful notifications

### Backend & Services
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth with email/password
- **Storage**: Supabase Storage for images and audio
- **AI Services**: Google Gemini API for translations and chatbot
- **Real-time**: Supabase Realtime for live updates

### DevOps
- **Hosting**: Vercel (optimized for Next.js/React)
- **Version Control**: Git + GitHub
- **Package Manager**: pnpm (fast, efficient)
- **Build Tool**: Vite with HMR for instant feedback

---

## 🚀 Getting Started

### Prerequisites

```bash
Node.js 18+ 
pnpm (recommended) or npm
Supabase account (free tier works)
Google Gemini API key (optional, for AI features)
```

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/ionutT77/Echoes-Digital-Heritage-Trail.git
cd Echoes-Digital-Heritage-Trail
```

2. **Install dependencies**
```bash
pnpm install
# or
npm install
```

3. **Set up environment variables**

Create a `.env` file in the root directory:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_GEMINI_API_KEY=your_gemini_api_key
```

4. **Set up Supabase database**

Run the migrations in order in your Supabase SQL Editor:

```bash
supabase/migrations/001_initial_schema.sql
supabase/migrations/002_create_profiles.sql
supabase/migrations/003_leaderboard_system.sql
supabase/migrations/004_location_requests.sql
supabase/migrations/008_friends_system.sql
```

5. **Migrate nodes to database**

```bash
npm run migrate
```

6. **Start development server**

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### 📱 Testing on Mobile

1. Start the dev server with host flag (already configured):
```bash
npm run dev
```

2. Note the network URL displayed (e.g., `http://192.168.1.x:5173`)

3. Open this URL on your mobile device (must be on same network)

4. Allow location permissions when prompted

5. Start exploring! The app works best outdoors with GPS signal

### 🖥️ Simulating Location (Desktop Testing)

Use Chrome DevTools to test GPS features:

1. Open DevTools (F12)
2. Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on Mac)
3. Type "sensors" and select **Show Sensors**
4. Set a custom location in Timișoara:
   - Victory Square: `45.7489, 21.2087`
   - Union Square: `45.7564, 21.2292`
   - Huniade Castle: `45.7544, 21.2269`

---

## 📂 Project Structure

```
echoes-heritage-trail/
├── public/                    # Static assets
│   └── audio/                 # Audio files for nodes
├── src/
│   ├── components/            # React components
│   │   ├── Audio/
│   │   │   └── AudioPlayer.jsx         # Audio playback controls
│   │   ├── Auth/
│   │   │   ├── LoginForm.jsx           # Login interface
│   │   │   ├── SignUpForm.jsx          # Registration form
│   │   │   ├── ProtectedRoute.jsx      # Route protection
│   │   │   └── ForgotPasswordModal.jsx # Password reset
│   │   ├── Debug/
│   │   │   └── DebugPanel.jsx          # Development tools
│   │   ├── Header/
│   │   │   └── Header.jsx              # Main navigation
│   │   ├── Map/
│   │   │   ├── MapContainer.jsx        # Leaflet map wrapper
│   │   │   ├── NodeMarker.jsx          # Heritage site markers
│   │   │   └── UserLocation.jsx        # User position indicator
│   │   ├── Node/
│   │   │   └── NodeModal.jsx           # Heritage site details popup
│   │   └── Onboarding/
│   │       └── OnboardingOverlay.jsx   # First-time tutorial
│   ├── contexts/              # React contexts
│   │   ├── AuthContext.jsx             # Authentication state
│   │   └── ThemeContext.jsx            # Dark/light mode
│   ├── hooks/                 # Custom React hooks
│   │   ├── useGeolocation.js           # GPS tracking
│   │   ├── useProximity.js             # Proximity detection
│   │   └── useRouting.js               # Route calculation
│   ├── lib/                   # External service configs
│   │   ├── supabase.js                 # Supabase client
│   │   └── supabaseClient.js           # Supabase utilities
│   ├── pages/                 # Page components
│   │   ├── HomePage.jsx                # Landing page
│   │   ├── MapPage.jsx                 # Main map interface
│   │   ├── ProfilePage.jsx             # User profile
│   │   ├── LeaderboardPage.jsx         # Rankings
│   │   ├── FriendsPage.jsx             # Friends management
│   │   ├── AdminPage.jsx               # Admin dashboard
│   │   ├── RequestLocationPage.jsx     # Submit new locations
│   │   └── ResetPasswordPage.jsx       # Password recovery
│   ├── services/              # API services
│   │   ├── leaderboardService.js       # Leaderboard API
│   │   ├── locationRequestService.js   # Location submissions
│   │   ├── friendsService.js           # Friends management
│   │   └── nodesService.js             # Heritage nodes API
│   ├── stores/                # Zustand state stores
│   │   ├── audioStore.js               # Audio player state
│   │   └── mapStore.js                 # Map & app state
│   ├── utils/                 # Utility functions
│   │   ├── distance.js                 # Haversine calculations
│   │   ├── permissions.js              # Location permissions
│   │   └── uiTranslations.js           # Translation mappings
│   ├── App.jsx                         # Root component
│   ├── main.jsx                        # App entry point
│   └── index.css                       # Global styles
├── scripts/
│   └── migrate-nodes.js       # Database migration script
├── supabase/
│   └── migrations/            # SQL migration files
├── .env                       # Environment variables (create this)
├── package.json               # Dependencies
├── tailwind.config.js         # Tailwind configuration
├── vite.config.js             # Vite build config
└── vercel.json                # Vercel deployment config
```

---

## 🗺️ Heritage Locations

The app currently includes **45 cultural nodes** across Timișoara, including:

### 🏛️ Major Landmarks
- Victory Square (Piața Victoriei)
- Union Square (Piața Unirii)
- Liberty Square (Piața Libertății)
- Huniade Castle
- Metropolitan Cathedral
- Orthodox Cathedral with 11 towers

### 🎭 Cultural Sites
- Opera House
- National Theatre
- Philharmonic
- Multiple museums and galleries

### 🏗️ Historical Architecture
- Baroque buildings in Union Square
- Art Nouveau facades
- Habsburg-era monuments
- 1989 Revolution Memorial

### 🌳 Parks & Public Spaces
- Roses Park (Parcul Rozelor)
- Bega Canal promenade
- Central Park
- Children's Park

---

## 🔧 Configuration & Customization

### Adding New Heritage Nodes

#### Via Admin Dashboard (Recommended)
1. Log in as admin
2. Navigate to `/admin`
3. Fill in the node creation form
4. Upload images and audio
5. Submit for database insertion

#### Manually via Database
```sql
INSERT INTO nodes (
  title, latitude, longitude, proximity_radius,
  description, historical_period, category,
  audio_url, audio_duration, primary_image_url
) VALUES (
  'Your Location Name',
  45.7500,
  21.2000,
  50,
  'Historical description...',
  '1900-1950',
  'architecture',
  '/audio/your-story.mp3',
  120,
  'https://your-image-url.com/image.jpg'
);
```

### Translation System

Run the translation script to translate node content:

```bash
npm run translate
```

This will:
- Fetch all nodes from the database
- Translate titles and descriptions to 5 languages using Gemini API
- Store translations in the `translations` table
- Show progress for each node

**Note**: Free tier Gemini has a limit of 250 requests/day. The script will resume where it left off on subsequent runs.

---

## 🎨 Customization

### Theme Colors

Edit `tailwind.config.js` to customize the heritage theme:

```javascript
colors: {
  heritage: {
    50: '#faf8f5',
    100: '#f5f1ea',
    // ... customize the brown/earth tones
    900: '#2d1f1a',
  }
}
```

### Map Styling

Customize map tiles in `src/components/Map/MapContainer.jsx`:

```javascript
<TileLayer
  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
  // Change to your preferred tile provider
/>
```

---

## 📊 Database Schema

### Core Tables

- `nodes` - Heritage locations with content
- `profiles` - User profiles and stats
- `user_discoveries` - Tracks which nodes users have discovered
- `translations` - Multi-language content for nodes
- `friendships` - Friend connections between users
- `location_requests` - User-submitted location suggestions

### Key Views

- `leaderboard` - Ranked users by points and discoveries
- `friends_list` - Friend relationships with discovery counts
- `friend_requests` - Pending friend requests

See `supabase/migrations/` for complete schema.

---

## 🚢 Deployment

### Deploy to Vercel (Recommended)

1. Push your code to GitHub

2. Import project in Vercel dashboard

3. Configure environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_GEMINI_API_KEY`

4. Deploy!

The `vercel.json` configuration handles SPA routing automatically.

### Build for Production

```bash
npm run build
npm run preview  # Test production build locally
```

---

## 🗺️ Roadmap

### Phase 1: MVP ✅
- [x] Core GPS-based heritage discovery
- [x] Multi-language audio narrations
- [x] User authentication and profiles
- [x] Leaderboard and points system
- [x] Friends system with discovery sharing
- [x] Route planning and navigation

### Phase 2: Enhancement (In Progress)
- [ ] Complete PWA offline support
- [ ] Push notifications for nearby nodes
- [ ] User reviews and ratings
- [ ] Photo upload for discovered locations
- [ ] Enhanced chatbot with context memory
- [ ] Admin analytics dashboard

### Phase 3: Expansion
- [ ] Expand to other Romanian cities
- [ ] AR features for heritage visualization
- [ ] Virtual tours for remote exploration
- [ ] Educational quiz system
- [ ] Integration with local tourism boards
- [ ] Mobile native apps (iOS/Android)

---

## 🤝 Contributing

We welcome contributions! Here's how to get involved:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow the existing code style (Prettier/ESLint)
- Write meaningful commit messages
- Test on both desktop and mobile
- Update documentation for new features
- Ensure accessibility standards (WCAG 2.1)

---

## 📄 License

This project is licensed under the **MIT License** - see the LICENSE file for details.

---

## 🙏 Acknowledgments

- **Timișoara Municipality** for cultural heritage information
- **OpenStreetMap** contributors for mapping data
- **Supabase** for backend infrastructure
- **Google** for Gemini AI capabilities
- **Relume** for beautiful UI components

---

## 📞 Contact & Support

- **Developers**:
  - Cristea Laur-Alexandru (https://github.com/AlexandruCL)
  - Toma Ionut-Adrian (https://github.com/ionutT77)
  - Boros Fabian (https://github.com/Skips26)
  - Pop Patric (https://github.com/patric1304)
- **GitHub**: [ionutT77](https://github.com/ionutT77)
- **Project**: [Echoes Digital Heritage Trail](https://github.com/ionutT77/Echoes-Digital-Heritage-Trail)

---

<div align="center">

**Built with ❤️ for Timișoara's Cultural Heritage**

*Discover. Explore. Remember.*

</div>
