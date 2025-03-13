import * as THREE from 'three';
import { Player } from './player';
import { Level } from './level';
import { Enemy } from './enemy';
import { Weapon } from './weapon';
import { Boss } from './boss';
import { InputHandler } from './input';
import { UI } from './ui';
import { Minimap } from './minimap';

export class Game {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private clock: THREE.Clock;
  private player: Player;
  private level: Level;
  private enemies: Enemy[] = [];
  private weapon: Weapon;
  private inputHandler: InputHandler;
  private ui: UI;
  private minimap: Minimap;
  private boss: Boss | null = null;
  private gameOver: boolean = false;
  private levelComplete: boolean = false;

  constructor() {
    // Initialize Three.js components
    this.scene = new THREE.Scene();
    // Changed background color from black to dark gray for better visibility
    this.scene.background = new THREE.Color(0x111111);
    // Reduced fog density from 0.05 to 0.02 for better visibility
    this.scene.fog = new THREE.FogExp2(0x111111, 0.02);

    // Create camera
    this.camera = new THREE.PerspectiveCamera(
      75, window.innerWidth / window.innerHeight, 0.1, 1000
    );
    
    // Create renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    document.body.appendChild(this.renderer.domElement);

    // Create clock for timing
    this.clock = new THREE.Clock();

    // Initialize level
    this.level = new Level(this.scene);

    // Initialize player
    this.player = new Player(this.camera, this.level);
    
    // Initialize weapon
    this.weapon = new Weapon(this.scene, this.camera);

    // Initialize input handler
    this.inputHandler = new InputHandler(this.player, this.weapon);

    // Initialize UI
    this.ui = new UI(this.player, this.weapon);
    
    // Initialize minimap (will be fully initialized after enemies and boss are created)
    this.minimap = new Minimap(this.player, this.level, [], null);

    // Handle window resize
    window.addEventListener('resize', this.onWindowResize.bind(this));
  }

  public start(): void {
    // Spawn enemies
    this.spawnEnemies();
    
    // Spawn boss
    this.spawnBoss();

    // Reinitialize minimap with enemies and boss
    this.minimap = new Minimap(this.player, this.level, this.enemies, this.boss);

    // Start game loop
    this.animate();
  }

  private spawnEnemies(): void {
    // Spawn enemies throughout the map in a more distributed pattern
    const enemyPositions = [
      // Early area
      new THREE.Vector3(10, 0, -10),
      new THREE.Vector3(-10, 0, -15),
      new THREE.Vector3(15, 0, -20),
      
      // Mid area
      new THREE.Vector3(-15, 0, -25),
      new THREE.Vector3(5, 0, -30),
      new THREE.Vector3(-5, 0, -35),
      new THREE.Vector3(0, 0, -40),
      
      // Later areas (more distributed throughout the map)
      new THREE.Vector3(12, 0, -45),
      new THREE.Vector3(-12, 0, -50),
      new THREE.Vector3(8, 0, -55),
      new THREE.Vector3(-8, 0, -60),
      new THREE.Vector3(15, 0, -65),
      new THREE.Vector3(-15, 0, -70),
      new THREE.Vector3(5, 0, -75)
    ];

    enemyPositions.forEach(position => {
      const enemy = new Enemy(this.scene, position, this.player);
      this.enemies.push(enemy);
    });
  }

  private spawnBoss(): void {
    // Spawn boss at the end of the level
    const bossPosition = new THREE.Vector3(0, 0, -80);
    this.boss = new Boss(this.scene, bossPosition, this.player, this.level);
  }

  private animate(): void {
    if (this.gameOver || this.levelComplete) return;

    requestAnimationFrame(this.animate.bind(this));

    const delta = this.clock.getDelta();

    // Update player
    this.player.update(delta);

    // Update enemies
    this.enemies.forEach((enemy, index) => {
      enemy.update(delta);
      
      // Check if enemy is hit by weapon
      if (this.weapon.isHitting && this.weapon.canHit(enemy.getPosition())) {
        enemy.takeDamage(this.weapon.getDamage());
        if (enemy.isDead()) {
          enemy.remove();
          this.enemies.splice(index, 1);
        }
      }

      // Check if enemy is hitting player
      if (enemy.isHittingPlayer()) {
        this.player.takeDamage(enemy.getDamage());
        if (this.player.isDead()) {
          this.gameOver = true;
          this.showGameOver();
        }
      }
    });

    // Update boss if exists
    if (this.boss) {
      this.boss.update(delta);

      // Check if boss is hit by weapon
      if (this.weapon.isHitting && this.weapon.canHit(this.boss.getPosition())) {
        this.boss.takeDamage(this.weapon.getDamage());
        if (this.boss.isDead()) {
          this.boss.remove();
          this.boss = null;
          this.levelComplete = true;
          this.showLevelComplete();
        }
      }

      // Check if boss is hitting player
      if (this.boss && this.boss.isHittingPlayer()) {
        this.player.takeDamage(this.boss.getDamage());
        if (this.player.isDead()) {
          this.gameOver = true;
          this.showGameOver();
        }
      }
    }

    // Update weapon
    this.weapon.update(delta);

    // Update UI
    this.ui.update();
    
    // Update minimap
    this.minimap.update();

    // Render the scene
    this.renderer.render(this.scene, this.camera);
  }

  private onWindowResize(): void {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.minimap.resize();
  }

  private showGameOver(): void {
    const gameOverElement = document.getElementById('game-over');
    if (gameOverElement) {
      gameOverElement.style.display = 'block';
    }
    this.inputHandler.disable();
  }

  private showLevelComplete(): void {
    const levelCompleteElement = document.getElementById('level-complete');
    if (levelCompleteElement) {
      levelCompleteElement.style.display = 'block';
    }
    this.inputHandler.disable();
  }
}
