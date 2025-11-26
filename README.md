# 🐯 Tall Tiger

A fun and addictive jumping game where you help a tiger reach the sky! Jump on platforms and see how high you can go!

## 🎮 How to Play

- Use **Arrow Keys** (← →) or **A/D** keys to move the tiger left and right
- The tiger automatically jumps when landing on platforms
- Try to climb as high as possible without falling off the bottom
- Beat your high score!

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
git commit -m "Initial commit: Tall Tiger game"
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

To run the game locally:

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
talltiger/
├── index.html       # Main HTML file
├── style.css        # Styling and animations
├── game.js          # Game logic
├── vercel.json      # Vercel configuration
├── package.json     # Project metadata
└── README.md        # This file
```

## 🎨 Features

- ✅ Smooth platformer mechanics
- ✅ Responsive design (works on mobile and desktop)
- ✅ Touch controls for mobile devices
- ✅ Score tracking with local storage
- ✅ Beautiful gradient background
- ✅ Animated UI elements
- ✅ High score persistence

## 🔧 Customization

### Change Colors
Edit the gradients in `style.css`:
```css
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
```

### Adjust Difficulty
In `game.js`, modify:
- `jumpPower`: Change jump height (line 72)
- `gravity`: Adjust falling speed (line 71)
- `speed`: Change horizontal movement speed (line 73)

## 📱 Browser Support

- Chrome ✅
- Firefox ✅
- Safari ✅
- Edge ✅
- Mobile browsers ✅

## 📄 License

MIT License - Feel free to use and modify!

## 🎉 Enjoy!

Have fun playing Tall Tiger! Try to beat your high score and challenge your friends!

---

Made with 🧡 for talltiger.net

