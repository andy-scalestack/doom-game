import { Game } from './game';

// Wait for the DOM to be loaded
document.addEventListener('DOMContentLoaded', () => {
  // Hide loading screen when game is initialized
  const loadingElement = document.getElementById('loading');
  if (loadingElement) {
    loadingElement.style.display = 'none';
  }

  // Initialize the game
  const game = new Game();
  game.start();
});
