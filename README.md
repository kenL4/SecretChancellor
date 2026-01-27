# 🎓 Secret Chancellor

A web-based multiplayer social deduction game with a Cambridge University theme.

## 🎮 Game Overview

**Secret Chancellor** is a social deduction game for 5-10 players where you must work together—or deceive your way to victory!

### Roles

- **📚 Student Union** - The majority. Work together to enact policies and identify the Chancellor.
- **🏛️ Chancellor's Office** - The minority. Help the Chancellor gain power through deception.
- **👑 Chancellor** - The secret antagonist. Stay hidden until you can seize control!

### Win Conditions

**Student Union Wins:**
- Enact 5 Student Union policies, OR
- Execute the Chancellor

**Admin Wins:**
- Enact 6 Admin policies, OR
- Elect the Chancellor as Policy Chair after 3 Admin policies are enacted

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm 9+

### Installation

```bash
# Clone or navigate to the project
cd secret-chancellor

# Install dependencies
npm install
```

### Development

```bash
# Start the development server
npm run dev
```

The game will be available at [http://localhost:3000](http://localhost:3000)

### Production Build

```bash
# Create production build
npm run build

# Start production server
npm start
```

## 📱 Features

- **Real-time Multiplayer** - Socket.io powered WebSocket connections
- **Responsive Design** - Works on desktop and mobile browsers
- **Cambridge Theme** - Beautiful dark UI with gold accents
- **Game Phases**:
  - Role reveal with teammate identification (for Admin team)
  - Vice-Chancellor nomination
  - Voting on governments
  - Policy draw and enactment
  - Executive actions (Investigation, Policy Peek, Special Election, Execution)
- **In-game Chat** - Discuss and debate during gameplay
- **Shareable Game Links** - Easy lobby creation via URL

## 🌐 Deployment to Vercel

### Option 1: Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# For production
vercel --prod
```

### Option 2: GitHub Integration

1. Push your code to a GitHub repository
2. Go to [vercel.com](https://vercel.com)
3. Import your repository
4. Vercel will auto-detect Next.js and configure the build
5. Click "Deploy"

### Environment Variables (Optional)

For production, you may want to set:

```env
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

### Important Notes for Vercel Deployment

- The Socket.io server runs as a serverless function
- In-memory game storage resets when functions cold start
- For production persistence, consider:
  - Redis (Upstash) for game state
  - Supabase for persistent storage
  - Vercel KV for key-value storage

## 🎯 How to Play

1. **Create or Join a Game** - Host creates a game and shares the 6-character code
2. **Wait for Players** - Need 5-10 players to start
3. **Role Reveal** - Each player secretly learns their role
4. **Election Rounds**:
   - Vice-Chancellor nominates a Policy Chair
   - All players vote Ja! (yes) or Nein! (no)
   - If approved, the legislative session begins
5. **Legislation**:
   - Vice-Chancellor draws 3 policies, discards 1
   - Policy Chair receives 2, discards 1, enacts 1
6. **Executive Actions** - Admin policies unlock special powers
7. **Victory** - Play until a team achieves their win condition!

## 🛠️ Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Real-time**: Socket.io
- **Styling**: Vanilla CSS with CSS Custom Properties
- **Fonts**: Inter + Playfair Display (Google Fonts)
- **Deployment**: Vercel-ready

## 📁 Project Structure

```
secret-chancellor/
├── src/
│   ├── app/                 # Next.js App Router pages
│   │   ├── api/            # API routes
│   │   ├── globals.css     # Global styles
│   │   ├── layout.tsx      # Root layout
│   │   └── page.tsx        # Home page
│   ├── components/         # React components
│   │   ├── Chat.tsx        # In-game chat
│   │   ├── Game.tsx        # Main game orchestrator
│   │   ├── GameBoard.tsx   # Active game UI
│   │   ├── GameOver.tsx    # End game screen
│   │   ├── HomeScreen.tsx  # Landing/menu
│   │   ├── Lobby.tsx       # Pre-game lobby
│   │   ├── PlayerList.tsx  # Player display
│   │   ├── PolicyCard.tsx  # Policy cards
│   │   ├── PolicyTrack.tsx # Policy tracks
│   │   └── RoleReveal.tsx  # Role reveal screen
│   ├── context/            # React contexts
│   │   └── GameContext.tsx # Game state management
│   ├── lib/                # Core logic
│   │   ├── gameLogic.ts    # Game rules & state
│   │   ├── gameStore.ts    # In-memory storage
│   │   ├── gameTypes.ts    # TypeScript types
│   │   ├── socketClient.ts # Client socket
│   │   └── socketEvents.ts # Event constants
│   └── pages/              # Pages API for Socket.io
│       └── api/
│           └── socketio.ts # Socket server
├── package.json
└── README.md
```

## 🎨 Theming

The game uses CSS custom properties for easy theming:

```css
:root {
  --cambridge-blue: #a3c1ad;
  --gold-accent: #c4a35a;
  --student-union: #3498db;
  --admin: #c0392b;
  /* ... more variables */
}
```

## 📄 License

MIT License - Feel free to use and modify for your own games!

---

*A Cambridge University themed social deduction game. Not affiliated with Cambridge University or Secret Hitler.*
