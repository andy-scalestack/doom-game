import * as THREE from 'three';
import { Level } from './level';

export class Player {
  private camera: THREE.PerspectiveCamera;
  private level: Level;
  private velocity: THREE.Vector3;
  private height: number = 1.8; // Player height in units
  private speed: number = 10.0; // Increased movement speed for faster gameplay
  private health: number = 100;
  private maxHealth: number = 100;
  private position: THREE.Vector3;
  private direction: THREE.Vector3;
  private raycaster: THREE.Raycaster;
  private collisionDistance: number = 0.5; // Collision detection distance

  constructor(camera: THREE.PerspectiveCamera, level: Level) {
    this.camera = camera;
    this.level = level;
    this.velocity = new THREE.Vector3(0, 0, 0);
    this.position = new THREE.Vector3(0, this.height, 0);
    this.direction = new THREE.Vector3(0, 0, -1);
    this.raycaster = new THREE.Raycaster();
    
    // Set initial camera position
    this.camera.position.copy(this.position);
  }

  public update(delta: number): void {
    // Apply velocity to position with collision detection
    if (this.velocity.length() > 0) {
      // Normalize velocity and scale by speed and delta time
      const moveVector = this.velocity.clone().normalize().multiplyScalar(this.speed * delta);
      
      // Check for collisions in X direction
      if (moveVector.x !== 0) {
        const directionX = new THREE.Vector3(Math.sign(moveVector.x), 0, 0);
        this.raycaster.set(this.position, directionX);
        const intersectionsX = this.raycaster.intersectObjects(this.level.getWalls());
        if (intersectionsX.length === 0 || intersectionsX[0].distance > this.collisionDistance) {
          this.position.x += moveVector.x;
        }
      }
      
      // Check for collisions in Z direction
      if (moveVector.z !== 0) {
        const directionZ = new THREE.Vector3(0, 0, Math.sign(moveVector.z));
        this.raycaster.set(this.position, directionZ);
        const intersectionsZ = this.raycaster.intersectObjects(this.level.getWalls());
        if (intersectionsZ.length === 0 || intersectionsZ[0].distance > this.collisionDistance) {
          this.position.z += moveVector.z;
        }
      }
      
      // Update camera position
      this.camera.position.copy(this.position);
    }
    
    // Reset velocity
    this.velocity.set(0, 0, 0);
  }

  public moveForward(distance: number): void {
    // Move forward along camera direction
    this.direction.set(0, 0, -1).applyQuaternion(this.camera.quaternion);
    this.direction.y = 0; // Keep movement on XZ plane
    this.direction.normalize();
    this.velocity.add(this.direction.multiplyScalar(distance));
  }

  public moveRight(distance: number): void {
    // Move right relative to camera direction
    this.direction.set(1, 0, 0).applyQuaternion(this.camera.quaternion);
    this.velocity.add(this.direction.multiplyScalar(distance));
  }

  public lookAt(x: number, y: number): void {
    // Rotate camera based on mouse movement - only horizontal rotation
    this.camera.rotation.y -= x * 0.01;
    
    // Comment out vertical rotation to lock the vertical axis
    // this.camera.rotation.x -= y * 0.01;
    
    // Keep a fixed vertical angle (slightly downward for better visibility)
    this.camera.rotation.x = -0.1; // Fixed slight downward angle
  }

  public getPosition(): THREE.Vector3 {
    return this.position.clone();
  }

  public getHealth(): number {
    return this.health;
  }

  public getMaxHealth(): number {
    return this.maxHealth;
  }

  public takeDamage(amount: number): void {
    this.health = Math.max(0, this.health - amount);
  }

  public heal(amount: number): void {
    this.health = Math.min(this.maxHealth, this.health + amount);
  }

  public isDead(): boolean {
    return this.health <= 0;
  }

  public getRotation(): number {
    // Return the player's rotation around the Y axis (for minimap)
    return this.camera.rotation.y;
  }
}
