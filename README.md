# 🐯 Tall Tiger

A modern portfolio landing page showcasing bold SaaS projects and featuring an interactive Sky Pilot game. Where bold ideas become reality.

## ✨ Features

- **Portfolio Showcase**: Display of upcoming innovative SaaS projects
- **Interactive Game**: Embedded Sky Pilot challenge - a Flappy Bird-style airplane game
- **Modern Design**: Sleek dark theme with animated gradients and glassmorphism effects
- **Fully Responsive**: Optimized for desktop, tablet, and mobile devices

## 🎮 Sky Pilot Game - How to Play

- Use **Arrow Keys** (↑ ↓), **W/S** keys, or **Mouse** to control the airplane
- Dodge obstacles coming from the right
- Collect ⭐ stars for bonus points (+50 points)
- Pass through gaps for points (+10 points)
- The game speeds up progressively - stay sharp!
- Beat your high score (saved in browser)

## 🚀 Deploy to Vercel

### Prerequisites

1. Install [Vercel CLI](https://vercel.com/cli):
```bash
npm install -g vercel
```

2. Make sure you have a Vercel account (sign up at [vercel.com](https://vercel.com))

### Deployment Steps

#### Option 1: Deploy via CLI (Recommended)

1. Open terminal in the project directory
2. Login to Vercel:
```bash
vercel login
```

3. Deploy the project:
```bash
vercel
```

4. Follow the prompts:
   - Set up and deploy? **Y**
   - Which scope? Select your account
   - Link to existing project? **N**
   - Project name? **talltiger** (or press Enter for default)
   - In which directory is your code located? **./** (press Enter)
   - Want to override the settings? **N**

5. Your site will be deployed! You'll get a URL like `talltiger.vercel.app`

6. For production deployment:
```bash
vercel --prod
```

#### Option 2: Deploy via GitHub

1. Create a new repository on GitHub
2. Push your code:
```bash
git init
git add .
git commit -m "Initial commit: Tall Tiger portfolio site"
git branch -M main
git remote add origin YOUR_GITHUB_REPO_URL
git push -u origin main
```

3. Go to [vercel.com](https://vercel.com)
4. Click "Add New Project"
5. Import your GitHub repository
6. Click "Deploy"

### Connect Custom Domain (talltiger.net)

1. Go to your project on Vercel Dashboard
2. Click on "Settings" → "Domains"
3. Add your domain: `talltiger.net`
4. Vercel will provide DNS records
5. Go to Namecheap dashboard:
   - Go to Domain List → Manage → Advanced DNS
   - Add the DNS records provided by Vercel:
     - Type: **A Record**, Host: **@**, Value: **76.76.19.19**
     - Type: **CNAME**, Host: **www**, Value: **cname.vercel-dns.com**
6. Wait for DNS propagation (can take up to 48 hours, usually much faster)

## 🛠️ Local Development

To run the site locally:

### Option 1: Using Python
```bash
python3 -m http.server 8000
```
Then open: http://localhost:8000

### Option 2: Using Node.js
```bash
npx serve
```

### Option 3: Using VS Code
Install the "Live Server" extension and click "Go Live"

## 📁 Project Structure

```
talltiger.net/
├── index.html       # Main landing page with portfolio & game
├── style.css        # Modern styling with animations & gradients
├── game.js          # Sky Pilot game logic (Canvas API)
├── logo.svg         # Tall Tiger branding logo
├── package.json     # Project metadata
└── README.md        # This file
```

## 🎨 Project Highlights

### Portfolio Section
- **Hero Section**: Animated logo with glowing effects and bold headline
- **4 Upcoming Projects**: 
  - 🚀 Project Alpha - Revolutionary productivity tool
  - 💡 Project Nova - AI-powered analytics platform
  - 🎯 Project Zenith - Smart workflow automation
  - 🌟 Project Stellar - Next-gen collaboration suite

### Sky Pilot Game
- ✅ Smooth flight mechanics with multiple control options
- ✅ Progressive difficulty system
- ✅ Star collection for bonus points
- ✅ Score tracking with localStorage persistence
- ✅ Responsive canvas that adapts to screen size
- ✅ Touch controls for mobile devices
- ✅ Beautiful animated background with floating icons
- ✅ Particle effects and visual polish

## 🔧 Customization

### Change Theme Colors
Edit the gradients and colors in `style.css`:
```css
/* Primary gradient */
background: linear-gradient(135deg, #FF6B35 0%, #FF8C42 100%);

/* Hero accent gradient */
background: linear-gradient(135deg, #FF6B35 0%, #FF8C42 30%, #8B45FF 70%, #FF6B35 100%);
```

### Adjust Game Difficulty
In `game.js`, modify these variables:
- `gameSpeed`: Initial game speed (line 13, default: 2)
- `gap`: Space between obstacles (line 50, default: 188)
- `player.speed`: Airplane responsiveness (line 23, default: 0.15)
- Speed increase rate: Line 317 (increases every 300 frames)

### Update Projects
Edit the project cards in `index.html` (lines 33-59):
```html
<div class="project-card coming-soon">
    <div class="project-icon">🚀</div>
    <h3 class="project-title">Your Project Name</h3>
    <p class="project-description">Your description</p>
    <span class="project-status">Your Status</span>
</div>
```

## 🎨 Design Features

- **Modern UI**: Glassmorphism with backdrop filters
- **Animated Gradients**: Dynamic color transitions throughout
- **Smooth Animations**: Fade-ins, float effects, hover states
- **Dark Theme**: Professional dark background with vibrant accents
- **Responsive Layout**: Mobile-first design with breakpoints at 768px and 480px
- **Performance**: Pure CSS animations with hardware acceleration

## 📱 Browser Support

- Chrome ✅
- Firefox ✅
- Safari ✅
- Edge ✅
- Mobile browsers ✅

## 🛠️ Tech Stack

- **HTML5**: Semantic markup with Canvas API
- **CSS3**: Modern features (Grid, Flexbox, Custom Properties, Animations)
- **Vanilla JavaScript**: No frameworks or dependencies
- **localStorage API**: For high score persistence
- **Canvas API**: For game rendering

## 📄 License

MIT License - Feel free to use and modify!

## 🎉 Enjoy!

Experience the Tall Tiger vision - where innovative SaaS projects come to life. Play Sky Pilot and reach for the stars!

---

Made with 🧡 for talltiger.net

