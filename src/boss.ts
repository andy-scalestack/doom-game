import * as THREE from 'three';
import { Player } from './player';

export class Boss {
  private scene: THREE.Scene;
  private mesh: THREE.Group;
  private position: THREE.Vector3;
  private player: Player;
  private level: any; // Reference to the level for wall collision detection
  private health: number = 500;
  private maxHealth: number = 500;
  private speed: number = 1.5;
  private damage: number = 25;
  private attackRange: number = 2.5;
  private detectionRange: number = 30;
  private attackCooldown: number = 2.0; // seconds
  private lastAttackTime: number = 0;
  private isDying: boolean = false;
  private dyingAnimation: number = 0;
  private attackAnimation: number = 0;
  private isAttacking: boolean = false;
  private specialAttackCooldown: number = 10.0; // seconds
  private lastSpecialAttackTime: number = 0;
  private projectiles: THREE.Mesh[] = [];
  private projectileSpeed: number = 10;

  constructor(scene: THREE.Scene, position: THREE.Vector3, player: Player, level: any) {
    this.scene = scene;
    this.position = position;
    this.player = player;
    this.level = level;
    
    // Create boss mesh
    this.mesh = this.createBossMesh();
    this.mesh.position.copy(this.position);
    this.scene.add(this.mesh);
    
    // Add boss arena lighting
    this.addBossArenaLighting();
  }

  private createBossMesh(): THREE.Group {
    const group = new THREE.Group();
    
    // Boss body
    const bodyGeometry = new THREE.BoxGeometry(2, 3, 1.5);
    const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0x880000 });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 1.5;
    body.castShadow = true;
    group.add(body);
    
    // Boss head
    const headGeometry = new THREE.SphereGeometry(0.8, 32, 32);
    const headMaterial = new THREE.MeshStandardMaterial({ color: 0x880000 });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.y = 3.3;
    head.castShadow = true;
    group.add(head);
    
    // Boss horns
    const hornGeometry = new THREE.ConeGeometry(0.3, 1, 16);
    const hornMaterial = new THREE.MeshStandardMaterial({ color: 0x222222 });
    
    const leftHorn = new THREE.Mesh(hornGeometry, hornMaterial);
    leftHorn.position.set(-0.5, 3.8, 0);
    leftHorn.rotation.z = -Math.PI / 6;
    leftHorn.castShadow = true;
    group.add(leftHorn);
    
    const rightHorn = new THREE.Mesh(hornGeometry, hornMaterial);
    rightHorn.position.set(0.5, 3.8, 0);
    rightHorn.rotation.z = Math.PI / 6;
    rightHorn.castShadow = true;
    group.add(rightHorn);
    
    // Boss arms
    const armGeometry = new THREE.BoxGeometry(0.5, 2, 0.5);
    const armMaterial = new THREE.MeshStandardMaterial({ color: 0x880000 });
    
    const leftArm = new THREE.Mesh(armGeometry, armMaterial);
    leftArm.position.set(-1.25, 1.5, 0);
    leftArm.rotation.z = -Math.PI / 12;
    leftArm.castShadow = true;
    group.add(leftArm);
    
    const rightArm = new THREE.Mesh(armGeometry, armMaterial);
    rightArm.position.set(1.25, 1.5, 0);
    rightArm.rotation.z = Math.PI / 12;
    rightArm.castShadow = true;
    group.add(rightArm);
    
    // Boss claws
    const clawGeometry = new THREE.ConeGeometry(0.2, 0.5, 8);
    const clawMaterial = new THREE.MeshStandardMaterial({ color: 0x222222 });
    
    // Left hand claws
    for (let i = 0; i < 3; i++) {
      const claw = new THREE.Mesh(clawGeometry, clawMaterial);
      claw.position.set(-1.25 - 0.2 + i * 0.2, 0.5, 0.3);
      claw.rotation.x = -Math.PI / 4;
      claw.castShadow = true;
      group.add(claw);
    }
    
    // Right hand claws
    for (let i = 0; i < 3; i++) {
      const claw = new THREE.Mesh(clawGeometry, clawMaterial);
      claw.position.set(1.25 - 0.2 + i * 0.2, 0.5, 0.3);
      claw.rotation.x = -Math.PI / 4;
      claw.castShadow = true;
      group.add(claw);
    }
    
    // Boss legs
    const legGeometry = new THREE.BoxGeometry(0.6, 1.5, 0.6);
    const legMaterial = new THREE.MeshStandardMaterial({ color: 0x880000 });
    
    const leftLeg = new THREE.Mesh(legGeometry, legMaterial);
    leftLeg.position.set(-0.7, 0.75, 0);
    leftLeg.castShadow = true;
    group.add(leftLeg);
    
    const rightLeg = new THREE.Mesh(legGeometry, legMaterial);
    rightLeg.position.set(0.7, 0.75, 0);
    rightLeg.castShadow = true;
    group.add(rightLeg);
    
    // Boss eyes (glowing)
    const eyeGeometry = new THREE.SphereGeometry(0.15, 16, 16);
    const eyeMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    
    const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    leftEye.position.set(-0.3, 3.4, 0.6);
    group.add(leftEye);
    
    const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    rightEye.position.set(0.3, 3.4, 0.6);
    group.add(rightEye);
    
    return group;
  }

  private addBossArenaLighting(): void {
    // Add dramatic lighting for boss arena
    const redLight = new THREE.PointLight(0xff0000, 2, 30);
    redLight.position.set(this.position.x, this.position.y + 10, this.position.z);
    this.scene.add(redLight);
    
    // Add flickering effect
    setInterval(() => {
      redLight.intensity = 1.5 + Math.random() * 1;
    }, 100);
  }

  public update(delta: number): void {
    if (this.isDying) {
      this.updateDyingAnimation(delta);
      return;
    }
    
    // Update projectiles
    this.updateProjectiles(delta);
    
    // Get direction to player
    const playerPosition = this.player.getPosition();
    const direction = new THREE.Vector3()
      .subVectors(playerPosition, this.position)
      .normalize();
    
    // Calculate distance to player
    const distanceToPlayer = this.position.distanceTo(playerPosition);
    
    // If player is within detection range
    if (distanceToPlayer < this.detectionRange) {
      // Move towards player if not in attack range and not attacking
      if (distanceToPlayer > this.attackRange && !this.isAttacking) {
        this.position.add(direction.multiplyScalar(this.speed * delta));
        this.mesh.position.copy(this.position);
      }
      
      // Face the player
      this.mesh.lookAt(playerPosition);
      
      // Check for special attack
      const now = Date.now() / 1000;
      if (now - this.lastSpecialAttackTime > this.specialAttackCooldown) {
        this.lastSpecialAttackTime = now;
        this.fireProjectile();
      }
      
      // Update attack animation
      if (this.isAttacking) {
        this.updateAttackAnimation(delta);
      }
    }
  }

  private updateAttackAnimation(delta: number): void {
    this.attackAnimation += delta * 2;
    
    // Animate arms during attack
    const leftArm = this.mesh.children[3] as THREE.Mesh;
    const rightArm = this.mesh.children[4] as THREE.Mesh;
    
    const animationPhase = Math.sin(this.attackAnimation * Math.PI);
    
    leftArm.rotation.z = -Math.PI / 12 - animationPhase * Math.PI / 4;
    rightArm.rotation.z = Math.PI / 12 + animationPhase * Math.PI / 4;
    
    // End attack animation
    if (this.attackAnimation >= 1) {
      this.isAttacking = false;
      this.attackAnimation = 0;
      leftArm.rotation.z = -Math.PI / 12;
      rightArm.rotation.z = Math.PI / 12;
    }
  }

  private updateDyingAnimation(delta: number): void {
    this.dyingAnimation += delta * 0.5; // Slower death animation for boss
    
    // Flash red/black
    const flashIntensity = Math.sin(this.dyingAnimation * 20) * 0.5 + 0.5;
    
    this.mesh.traverse((child) => {
      if (child instanceof THREE.Mesh && 
          child.material instanceof THREE.MeshStandardMaterial &&
          child.material.color.r > 0.2) { // Only affect red parts
        child.material.color.setRGB(
          0.5 + flashIntensity * 0.5, 
          flashIntensity * 0.2, 
          flashIntensity * 0.2
        );
      }
    });
    
    // Shake
    this.mesh.position.x = this.position.x + (Math.random() - 0.5) * this.dyingAnimation;
    this.mesh.position.z = this.position.z + (Math.random() - 0.5) * this.dyingAnimation;
    
    // Sink and rotate
    this.mesh.position.y = Math.max(0, this.position.y - this.dyingAnimation);
    this.mesh.rotation.y += delta * this.dyingAnimation * 5;
    
    // Explode at the end
    if (this.dyingAnimation >= 2) {
      // Create explosion effect
      const explosionGeometry = new THREE.SphereGeometry(5, 32, 32);
      const explosionMaterial = new THREE.MeshBasicMaterial({ 
        color: 0xff0000,
        transparent: true,
        opacity: 0.8
      });
      const explosion = new THREE.Mesh(explosionGeometry, explosionMaterial);
      explosion.position.copy(this.position);
      explosion.position.y = 2;
      this.scene.add(explosion);
      
      // Animate explosion
      let size = 1;
      const expandExplosion = setInterval(() => {
        size += 0.2;
        explosion.scale.set(size, size, size);
        explosionMaterial.opacity = Math.max(0, 0.8 - (size - 1) / 5);
        
        if (size > 6) {
          clearInterval(expandExplosion);
          this.scene.remove(explosion);
        }
      }, 50);
      
      this.remove();
    }
  }

  private fireProjectile(): void {
    // Create multiple projectiles for a more impressive attack
    const numProjectiles = 3; // Fire 3 projectiles in a spread pattern
    
    for (let i = 0; i < numProjectiles; i++) {
      // Create projectile with glowing effect
      const projectileGeometry = new THREE.SphereGeometry(0.4, 16, 16);
      const projectileMaterial = new THREE.MeshStandardMaterial({ 
        color: 0xff3300,
        emissive: 0xff0000,
        emissiveIntensity: 1.0
      });
      const projectile = new THREE.Mesh(projectileGeometry, projectileMaterial);
      
      // Add glow effect
      const glowGeometry = new THREE.SphereGeometry(0.6, 16, 16);
      const glowMaterial = new THREE.MeshBasicMaterial({
        color: 0xff5500,
        transparent: true,
        opacity: 0.4
      });
      const glow = new THREE.Mesh(glowGeometry, glowMaterial);
      projectile.add(glow);
      
      // Position projectile at boss position + height
      projectile.position.copy(this.position);
      projectile.position.y = 3;
      
      // Get direction to player with slight spread for multiple projectiles
      const playerPosition = this.player.getPosition();
      const baseDirection = new THREE.Vector3()
        .subVectors(playerPosition, projectile.position)
        .normalize();
      
      // Add spread to direction (except for middle projectile)
      let direction = baseDirection.clone();
      if (numProjectiles > 1) {
        if (i === 0) { // Left projectile
          direction.x -= 0.2;
        } else if (i === 2) { // Right projectile
          direction.x += 0.2;
        }
        // Middle projectile (i === 1) stays on target
        direction.normalize(); // Re-normalize after adjusting
      }
      
      // Store direction and damage with projectile
      (projectile as any).direction = direction;
      (projectile as any).damage = 15;
      (projectile as any).lifeTime = 0; // Track how long the projectile has existed
      
      // Add to scene and projectiles array
      this.scene.add(projectile);
      this.projectiles.push(projectile);
    }
    
    // Start attack animation
    this.isAttacking = true;
    this.attackAnimation = 0;
  }

  private updateProjectiles(delta: number): void {
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const projectile = this.projectiles[i];
      const direction = (projectile as any).direction;
      
      // Update projectile lifetime
      (projectile as any).lifeTime += delta;
      
      // Pulse the glow effect
      if (projectile.children.length > 0) {
        const glow = projectile.children[0] as THREE.Mesh;
        const glowMaterial = glow.material as THREE.MeshBasicMaterial;
        const pulseRate = 10; // Speed of pulsing
        const pulseAmount = 0.3; // Amount of opacity change
        glowMaterial.opacity = 0.4 + Math.sin((projectile as any).lifeTime * pulseRate) * pulseAmount;
        
        // Also slightly scale the glow
        const scaleBase = 1.0;
        const scaleAmount = 0.1;
        const scale = scaleBase + Math.sin((projectile as any).lifeTime * pulseRate) * scaleAmount;
        glow.scale.set(scale, scale, scale);
      }
      
      // Move projectile
      projectile.position.add(direction.clone().multiplyScalar(this.projectileSpeed * delta));
      
      // Rotate projectile for visual effect
      projectile.rotation.x += delta * 5;
      projectile.rotation.y += delta * 3;
      
      // Check collision with player - increased hit radius for better gameplay
      const playerPosition = this.player.getPosition();
      const distanceToPlayer = projectile.position.distanceTo(playerPosition);
      
      if (distanceToPlayer < 1.2) { // Slightly larger collision radius
        // Hit player
        this.player.takeDamage((projectile as any).damage);
        
        // Create hit effect
        this.createHitEffect(projectile.position);
        
        // Remove projectile
        this.scene.remove(projectile);
        this.projectiles.splice(i, 1);
        continue;
      }
      
      // Check collision with walls
      const raycaster = new THREE.Raycaster(
        projectile.position.clone(), 
        direction.clone(),
        0,
        1
      );
      const intersections = raycaster.intersectObjects(this.level.getWalls());
      if (intersections.length > 0 && intersections[0].distance < 0.5) {
        // Create hit effect on wall
        this.createHitEffect(projectile.position);
        
        // Remove projectile
        this.scene.remove(projectile);
        this.projectiles.splice(i, 1);
        continue;
      }
      
      // Remove if too far or too old
      if (projectile.position.distanceTo(this.position) > 50 || (projectile as any).lifeTime > 5) {
        this.scene.remove(projectile);
        this.projectiles.splice(i, 1);
      }
    }
  }

  private createHitEffect(position: THREE.Vector3): void {
    // Create explosion effect
    const explosionGeometry = new THREE.SphereGeometry(0.5, 16, 16);
    const explosionMaterial = new THREE.MeshBasicMaterial({
      color: 0xff5500,
      transparent: true,
      opacity: 0.8
    });
    const explosion = new THREE.Mesh(explosionGeometry, explosionMaterial);
    explosion.position.copy(position);
    this.scene.add(explosion);
    
    // Animate explosion
    let size = 1;
    const expandExplosion = setInterval(() => {
      size += 0.3;
      explosion.scale.set(size, size, size);
      explosionMaterial.opacity = Math.max(0, 0.8 - (size - 1) / 2);
      
      if (size > 3) {
        clearInterval(expandExplosion);
        this.scene.remove(explosion);
      }
    }, 30);
  }

  public isHittingPlayer(): boolean {
    if (this.isDying) return false;
    
    const now = Date.now() / 1000; // Current time in seconds
    const playerPosition = this.player.getPosition();
    const distanceToPlayer = this.position.distanceTo(playerPosition);
    
    // Check if player is within attack range and cooldown has elapsed
    if (distanceToPlayer <= this.attackRange && now - this.lastAttackTime > this.attackCooldown) {
      this.lastAttackTime = now;
      this.isAttacking = true;
      this.attackAnimation = 0;
      return true;
    }
    
    return false;
  }

  public takeDamage(amount: number): void {
    this.health -= amount;
    
    // Flash white when hit
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
    
    // Speed up when health is low
    if (this.health < this.maxHealth * 0.3) {
      this.speed = 3.0; // Enraged mode
      this.attackCooldown = 1.0; // Attack faster
    }
    
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
    // Remove all projectiles
    this.projectiles.forEach(projectile => {
      this.scene.remove(projectile);
    });
    this.projectiles = [];
    
    // Remove boss mesh
    if (this.mesh && this.mesh.parent) {
      this.scene.remove(this.mesh);
    }
  }
}
