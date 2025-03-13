# TypeScript DOOM

A DOOM-style first-person shooter game built with TypeScript and Three.js.

## Features

- First-person shooter gameplay
- 3D graphics using Three.js
- WASD movement controls
- Mouse look controls
- Shooting mechanics with reloading
- Enemy AI that follows and attacks the player
- Level with walls and obstacles
- Final boss battle
- Health and ammo UI

## Controls

- **W, A, S, D**: Move
- **Mouse**: Look around
- **Left Click**: Shoot
- **R**: Reload weapon
- **Click on screen**: Lock mouse pointer (required to look around)

## How to Play

1. Navigate through the level, defeating enemies along the way
2. Manage your health and ammo
3. Find and defeat the final boss at the end of the level

## Development

### Prerequisites

- Node.js and npm

### Setup

```bash
# Install dependencies
npm install

# Start development server
npm start

# Build for production
npm run build:prod
```

## Deployment

This game is configured for deployment to GitHub Pages. To deploy:

1. Create a GitHub repository for this project
2. Push your code to the repository's main branch
3. GitHub Actions will automatically build and deploy the game to GitHub Pages
4. Your game will be available at `https://[your-username].github.io/typescript-doom/`

Alternatively, you can deploy to other static hosting services like Netlify, Vercel, or Firebase Hosting by uploading the contents of the `dist` directory.

## Technical Details

This game is built using:

- TypeScript for type-safe code
- Three.js for 3D rendering
- Webpack for bundling

## Project Structure

- `src/index.ts`: Main entry point
- `src/game.ts`: Game loop and main logic
- `src/player.ts`: Player movement and controls
- `src/enemy.ts`: Enemy AI and behavior
- `src/boss.ts`: Final boss behavior
- `src/weapon.ts`: Weapon mechanics
- `src/level.ts`: Level design and environment
- `src/input.ts`: Input handling
- `src/ui.ts`: User interface
