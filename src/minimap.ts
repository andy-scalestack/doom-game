import * as THREE from 'three';
import { Player } from './player';
import { Enemy } from './enemy';
import { Boss } from './boss';
import { Level } from './level';

export class Minimap {
  private canvas: HTMLCanvasElement;
  private context: CanvasRenderingContext2D;
  private player: Player;
  private level: Level;
  private enemies: Enemy[];
  private boss: Boss | null;
  private mapScale: number = 5; // Scale factor for the map
  private mapSize: number = 150; // Size of the minimap in pixels

  constructor(player: Player, level: Level, enemies: Enemy[], boss: Boss | null) {
    this.player = player;
    this.level = level;
    this.enemies = enemies;
    this.boss = boss;

    // Create canvas element
    this.canvas = document.createElement('canvas');
    this.canvas.width = this.mapSize;
    this.canvas.height = this.mapSize;
    this.canvas.id = 'minimap';
    this.canvas.style.position = 'absolute';
    this.canvas.style.top = '20px';
    this.canvas.style.right = '20px';
    this.canvas.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    this.canvas.style.border = '2px solid #444';
    this.canvas.style.borderRadius = '50%';
    document.body.appendChild(this.canvas);

    // Get context
    const ctx = this.canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get canvas context');
    this.context = ctx;
  }

  public update(): void {
    // Clear canvas
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw map background
    this.context.fillStyle = 'rgba(0, 0, 0, 0.7)';
    this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw circular mask for minimap
    this.context.globalCompositeOperation = 'destination-in';
    this.context.beginPath();
    this.context.arc(this.mapSize / 2, this.mapSize / 2, this.mapSize / 2, 0, Math.PI * 2);
    this.context.fill();
    this.context.globalCompositeOperation = 'source-over';

    // Get player position
    const playerPosition = this.player.getPosition();
    
    // Draw walls
    this.drawWalls(playerPosition);

    // Draw enemies
    this.drawEnemies(playerPosition);

    // Draw boss
    if (this.boss) {
      this.drawBoss(playerPosition);
    }

    // Draw player (always in center)
    this.drawPlayer();

    // Draw player direction indicator
    this.drawPlayerDirection();
  }

  private drawWalls(playerPosition: THREE.Vector3): void {
    // Get walls from level
    const walls = this.level.getWalls();

    // Draw each wall
    this.context.fillStyle = '#555';
    walls.forEach(wall => {
      const wallPosition = wall.position.clone();
      const relativeX = (wallPosition.x - playerPosition.x) * this.mapScale;
      const relativeZ = (wallPosition.z - playerPosition.z) * this.mapScale;
      
      // Calculate wall size based on its geometry
      const geometry = wall.geometry as THREE.BoxGeometry;
      const width = geometry.parameters.width * this.mapScale;
      const depth = geometry.parameters.depth * this.mapScale;
      
      // Convert to minimap coordinates (center of minimap is player position)
      const mapX = this.mapSize / 2 + relativeX - width / 2;
      const mapY = this.mapSize / 2 + relativeZ - depth / 2;
      
      // Draw wall
      this.context.fillRect(mapX, mapY, width, depth);
    });
  }

  private drawEnemies(playerPosition: THREE.Vector3): void {
    // Draw each enemy
    this.context.fillStyle = '#ff0000';
    this.enemies.forEach(enemy => {
      if (!enemy.isDead()) {
        const enemyPosition = enemy.getPosition();
        const relativeX = (enemyPosition.x - playerPosition.x) * this.mapScale;
        const relativeZ = (enemyPosition.z - playerPosition.z) * this.mapScale;
        
        // Convert to minimap coordinates
        const mapX = this.mapSize / 2 + relativeX;
        const mapY = this.mapSize / 2 + relativeZ;
        
        // Draw enemy as a small dot
        this.context.beginPath();
        this.context.arc(mapX, mapY, 3, 0, Math.PI * 2);
        this.context.fill();
      }
    });
  }

  private drawBoss(playerPosition: THREE.Vector3): void {
    if (!this.boss || this.boss.isDead()) return;
    
    // Draw boss
    this.context.fillStyle = '#ff00ff';
    const bossPosition = this.boss.getPosition();
    const relativeX = (bossPosition.x - playerPosition.x) * this.mapScale;
    const relativeZ = (bossPosition.z - playerPosition.z) * this.mapScale;
    
    // Convert to minimap coordinates
    const mapX = this.mapSize / 2 + relativeX;
    const mapY = this.mapSize / 2 + relativeZ;
    
    // Draw boss as a larger dot
    this.context.beginPath();
    this.context.arc(mapX, mapY, 5, 0, Math.PI * 2);
    this.context.fill();
  }

  private drawPlayer(): void {
    // Draw player in the center of the minimap
    this.context.fillStyle = '#00ff00';
    this.context.beginPath();
    this.context.arc(this.mapSize / 2, this.mapSize / 2, 4, 0, Math.PI * 2);
    this.context.fill();
  }

  private drawPlayerDirection(): void {
    // Draw a line indicating the player's direction
    const rotation = this.player.getRotation();
    const dirX = Math.sin(rotation) * 10;
    const dirZ = Math.cos(rotation) * 10;
    
    this.context.strokeStyle = '#00ff00';
    this.context.lineWidth = 2;
    this.context.beginPath();
    this.context.moveTo(this.mapSize / 2, this.mapSize / 2);
    this.context.lineTo(this.mapSize / 2 + dirX, this.mapSize / 2 + dirZ);
    this.context.stroke();
  }

  public resize(): void {
    // Update minimap position if needed
    this.canvas.style.top = '20px';
    this.canvas.style.right = '20px';
  }
}
