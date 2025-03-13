import { Player } from './player';
import { Weapon } from './weapon';

export class InputHandler {
  private player: Player;
  private weapon: Weapon;
  private keys: { [key: string]: boolean } = {};
  private isPointerLocked: boolean = false;
  private enabled: boolean = true;

  constructor(player: Player, weapon: Weapon) {
    this.player = player;
    this.weapon = weapon;
    
    // Set up event listeners
    document.addEventListener('keydown', this.onKeyDown.bind(this));
    document.addEventListener('keyup', this.onKeyUp.bind(this));
    document.addEventListener('mousemove', this.onMouseMove.bind(this));
    document.addEventListener('click', this.onClick.bind(this));
    
    // Set up pointer lock
    document.addEventListener('pointerlockchange', this.onPointerLockChange.bind(this));
    
    // Set up game loop for movement
    this.setupGameLoop();
  }

  private onKeyDown(event: KeyboardEvent): void {
    if (!this.enabled) return;
    this.keys[event.code] = true;
    
    // Handle reload key
    if (event.code === 'KeyR') {
      this.weapon.reload();
    }
  }

  private onKeyUp(event: KeyboardEvent): void {
    this.keys[event.code] = false;
  }

  private onMouseMove(event: MouseEvent): void {
    if (!this.enabled || !this.isPointerLocked) return;
    
    // Update player look direction based on mouse movement
    this.player.lookAt(event.movementX, event.movementY);
  }

  private onClick(event: MouseEvent): void {
    if (!this.enabled) return;
    
    // Request pointer lock on first click
    if (!this.isPointerLocked) {
      document.body.requestPointerLock();
      return;
    }
  }

  private onPointerLockChange(): void {
    this.isPointerLocked = document.pointerLockElement === document.body;
  }

  private setupGameLoop(): void {
    // Process movement input every frame
    const processInput = () => {
      if (!this.enabled) return;
      
      // Movement speed
      const moveSpeed = 0.1;
      
      // Handle WASD movement
      if (this.keys['KeyW']) {
        this.player.moveForward(moveSpeed);
      }
      if (this.keys['KeyS']) {
        this.player.moveForward(-moveSpeed);
      }
      if (this.keys['KeyA']) {
        this.player.moveRight(-moveSpeed);
      }
      if (this.keys['KeyD']) {
        this.player.moveRight(moveSpeed);
      }
      
      // Request next frame
      requestAnimationFrame(processInput);
    };
    
    // Start the input processing loop
    processInput();
  }

  public disable(): void {
    this.enabled = false;
    
    // Exit pointer lock if active
    if (document.pointerLockElement === document.body) {
      document.exitPointerLock();
    }
  }

  public enable(): void {
    this.enabled = true;
  }
}
