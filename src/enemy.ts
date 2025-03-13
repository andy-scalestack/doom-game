import * as THREE from 'three';
import { Player } from './player';

export class Enemy {
  private scene: THREE.Scene;
  private mesh: THREE.Group;
  private position: THREE.Vector3;
  private player: Player;
  private health: number = 50;
  private speed: number = 2.0;
  private damage: number = 10;
  private attackRange: number = 1.5;
  private detectionRange: number = 15;
  private attackCooldown: number = 1.0; // seconds
  private lastAttackTime: number = 0;
  private isDying: boolean = false;
  private dyingAnimation: number = 0;

  constructor(scene: THREE.Scene, position: THREE.Vector3, player: Player) {
    this.scene = scene;
    this.position = position;
    this.player = player;
    
    // Create enemy mesh
    this.mesh = this.createEnemyMesh();
    this.mesh.position.copy(this.position);
    this.scene.add(this.mesh);
  }

  private createEnemyMesh(): THREE.Group {
    const group = new THREE.Group();
    
    // Enemy body
    const bodyGeometry = new THREE.BoxGeometry(0.8, 1.5, 0.5);
    const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0x8B0000 });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 0.75;
    body.castShadow = true;
    group.add(body);
    
    // Enemy head
    const headGeometry = new THREE.SphereGeometry(0.3, 16, 16);
    const headMaterial = new THREE.MeshStandardMaterial({ color: 0x8B0000 });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.y = 1.6;
    head.castShadow = true;
    group.add(head);
    
    // Enemy arms
    const armGeometry = new THREE.BoxGeometry(0.2, 0.7, 0.2);
    const armMaterial = new THREE.MeshStandardMaterial({ color: 0x8B0000 });
    
    const leftArm = new THREE.Mesh(armGeometry, armMaterial);
    leftArm.position.set(-0.5, 0.85, 0);
    leftArm.rotation.z = -Math.PI / 6;
    leftArm.castShadow = true;
    group.add(leftArm);
    
    const rightArm = new THREE.Mesh(armGeometry, armMaterial);
    rightArm.position.set(0.5, 0.85, 0);
    rightArm.rotation.z = Math.PI / 6;
    rightArm.castShadow = true;
    group.add(rightArm);
    
    // Enemy legs
    const legGeometry = new THREE.BoxGeometry(0.25, 0.8, 0.25);
    const legMaterial = new THREE.MeshStandardMaterial({ color: 0x8B0000 });
    
    const leftLeg = new THREE.Mesh(legGeometry, legMaterial);
    leftLeg.position.set(-0.25, 0.4, 0);
    leftLeg.castShadow = true;
    group.add(leftLeg);
    
    const rightLeg = new THREE.Mesh(legGeometry, legMaterial);
    rightLeg.position.set(0.25, 0.4, 0);
    rightLeg.castShadow = true;
    group.add(rightLeg);
    
    // Enemy eyes (glowing)
    const eyeGeometry = new THREE.SphereGeometry(0.08, 8, 8);
    const eyeMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    
    const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    leftEye.position.set(-0.15, 1.65, 0.25);
    group.add(leftEye);
    
    const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    rightEye.position.set(0.15, 1.65, 0.25);
    group.add(rightEye);
    
    return group;
  }

  public update(delta: number): void {
    if (this.isDying) {
      this.updateDyingAnimation(delta);
      return;
    }
    
    // Get direction to player
    const playerPosition = this.player.getPosition();
    const direction = new THREE.Vector3()
      .subVectors(playerPosition, this.position)
      .normalize();
    
    // Calculate distance to player
    const distanceToPlayer = this.position.distanceTo(playerPosition);
    
    // If player is within detection range, move towards them
    if (distanceToPlayer < this.detectionRange) {
      // Move towards player
      if (distanceToPlayer > this.attackRange) {
        this.position.add(direction.multiplyScalar(this.speed * delta));
        this.mesh.position.copy(this.position);
      }
      
      // Face the player
      this.mesh.lookAt(playerPosition);
    }
  }

  private updateDyingAnimation(delta: number): void {
    this.dyingAnimation += delta;
    
    // Sink into floor
    this.mesh.position.y = Math.max(0, this.position.y - this.dyingAnimation * 2);
    
    // Rotate
    this.mesh.rotation.z += delta * 5;
    
    // Scale down
    const scale = Math.max(0, 1 - this.dyingAnimation);
    this.mesh.scale.set(scale, scale, scale);
    
    // Remove when animation complete
    if (this.dyingAnimation >= 1) {
      this.remove();
    }
  }

  public isHittingPlayer(): boolean {
    if (this.isDying) return false;
    
    const now = Date.now() / 1000; // Current time in seconds
    const playerPosition = this.player.getPosition();
    const distanceToPlayer = this.position.distanceTo(playerPosition);
    
    // Check if player is within attack range and cooldown has elapsed
    if (distanceToPlayer <= this.attackRange && now - this.lastAttackTime > this.attackCooldown) {
      this.lastAttackTime = now;
      return true;
    }
    
    return false;
  }

  public takeDamage(amount: number): void {
    this.health -= amount;
    
    // Flash red when hit
    this.mesh.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshStandardMaterial) {
        const originalColor = child.material.color.clone();
        child.material.color.set(0xffffff);
        
        // Reset color after flash
        setTimeout(() => {
          if (child.material instanceof THREE.MeshStandardMaterial) {
            child.material.color.copy(originalColor);
          }
        }, 100);
      }
    });
    
    if (this.health <= 0 && !this.isDying) {
      this.isDying = true;
    }
  }

  public getPosition(): THREE.Vector3 {
    return this.position.clone();
  }

  public getDamage(): number {
    return this.damage;
  }

  public isDead(): boolean {
    return this.health <= 0;
  }

  public remove(): void {
    if (this.mesh && this.mesh.parent) {
      this.scene.remove(this.mesh);
    }
  }
}
