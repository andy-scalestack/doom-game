import * as THREE from 'three';

export class Weapon {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private mesh: THREE.Group;
  private isVisible: boolean = true;
  private ammo: number = 50;
  private maxAmmo: number = 50;
  private damage: number = 20;
  private isReloading: boolean = false;
  private reloadTime: number = 2; // seconds
  private reloadStartTime: number = 0;
  private shootingCooldown: number = 0.2; // seconds
  private lastShootTime: number = 0;
  private muzzleFlash: THREE.Mesh;
  private muzzleFlashVisible: boolean = false;
  private muzzleFlashTimeout: number | null = null;
  public isHitting: boolean = false;
  private hitDistance: number = 20;
  private hitDirection: THREE.Vector3 = new THREE.Vector3();
  private hitPosition: THREE.Vector3 = new THREE.Vector3();
  private raycaster: THREE.Raycaster;

  constructor(scene: THREE.Scene, camera: THREE.PerspectiveCamera) {
    this.scene = scene;
    this.camera = camera;
    this.raycaster = new THREE.Raycaster();
    
    // Create weapon mesh
    this.mesh = this.createWeaponMesh();
    this.scene.add(this.mesh);
    
    // Create muzzle flash
    const muzzleGeometry = new THREE.SphereGeometry(0.1, 16, 16);
    const muzzleMaterial = new THREE.MeshBasicMaterial({ 
      color: 0xffff00,
      transparent: true,
      opacity: 0.8
    });
    this.muzzleFlash = new THREE.Mesh(muzzleGeometry, muzzleMaterial);
    // Position the muzzle flash at the exact tip of the gun barrel
    this.muzzleFlash.position.set(0.3, -0.15, -1.5);
    this.muzzleFlash.scale.set(1, 1, 3); // Elongated in z direction
    this.muzzleFlash.visible = false;
    this.scene.add(this.muzzleFlash);
    
    // Add event listeners for shooting and reloading
    document.addEventListener('mousedown', this.shoot.bind(this));
    document.addEventListener('keydown', (event) => {
      if (event.code === 'KeyR') {
        this.reload();
      }
    });
  }

  private createWeaponMesh(): THREE.Group {
    const group = new THREE.Group();
    
    // Gun barrel
    const barrelGeometry = new THREE.BoxGeometry(0.1, 0.1, 1);
    const barrelMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
    const barrel = new THREE.Mesh(barrelGeometry, barrelMaterial);
    barrel.position.set(0.3, -0.15, -1);
    group.add(barrel);
    
    // Gun body
    const bodyGeometry = new THREE.BoxGeometry(0.3, 0.3, 0.8);
    const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0x666666 });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.set(0.3, -0.3, -0.5);
    group.add(body);
    
    // Gun handle
    const handleGeometry = new THREE.BoxGeometry(0.15, 0.4, 0.2);
    const handleMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
    const handle = new THREE.Mesh(handleGeometry, handleMaterial);
    handle.position.set(0.3, -0.6, -0.3);
    group.add(handle);
    
    // Gun sight
    const sightGeometry = new THREE.BoxGeometry(0.05, 0.05, 0.05);
    const sightMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000 });
    const sight = new THREE.Mesh(sightGeometry, sightMaterial);
    sight.position.set(0.3, -0.05, -1.3);
    group.add(sight);
    
    return group;
  }

  public update(delta: number): void {
    // Reset hitting state
    this.isHitting = false;
    
    // Update weapon position to follow camera
    this.updatePosition();
    
    // Update muzzle flash if visible
    if (this.muzzleFlashVisible) {
      // Get the world position of the gun barrel tip
      const barrelTip = new THREE.Vector3(0.3, -0.15, -1.5);
      barrelTip.applyMatrix4(this.mesh.matrixWorld);
      
      // Position the muzzle flash at the barrel tip
      this.muzzleFlash.position.copy(barrelTip);
      
      // Make sure the muzzle flash rotates with the camera
      this.muzzleFlash.quaternion.copy(this.camera.quaternion);
    }
    
    // Check if reloading is complete
    if (this.isReloading) {
      const now = Date.now() / 1000;
      if (now - this.reloadStartTime >= this.reloadTime) {
        this.isReloading = false;
        this.ammo = this.maxAmmo;
        this.showWeapon();
      }
    }
    
    // Bob weapon while moving
    this.bobWeapon(delta);
  }

  private updatePosition(): void {
    // Position weapon relative to camera
    this.mesh.position.copy(this.camera.position);
    this.mesh.quaternion.copy(this.camera.quaternion);
  }

  private bobWeapon(delta: number): void {
    // Simple bobbing effect
    const time = Date.now() * 0.002;
    this.mesh.position.y += Math.sin(time * 5) * 0.003;
  }

  public shoot(): void {
    if (this.isReloading || !this.isVisible) return;
    
    const now = Date.now() / 1000;
    if (now - this.lastShootTime < this.shootingCooldown) return;
    
    if (this.ammo <= 0) {
      // Click sound when out of ammo
      this.reload();
      return;
    }
    
    this.lastShootTime = now;
    this.ammo--;
    
    // Show muzzle flash
    this.showMuzzleFlash();
    
    // Recoil effect
    this.applyRecoil();
    
    // Set hitting state and direction for this frame
    this.isHitting = true;
    this.hitDirection.set(0, 0, -1).applyQuaternion(this.camera.quaternion);
    
    // Get the world position of the gun barrel tip
    const barrelTip = new THREE.Vector3(0.3, -0.15, -1.5);
    barrelTip.applyMatrix4(this.mesh.matrixWorld);
    this.hitPosition.copy(barrelTip);
    
    // Perform raycasting from the barrel tip in the camera direction
    this.raycaster.set(barrelTip, this.hitDirection);
    this.createBulletTrail();
  }

  private showMuzzleFlash(): void {
    // Update muzzle flash position to match the current gun position
    // Get the world position of the gun barrel tip
    const barrelTip = new THREE.Vector3(0.3, -0.15, -1.5);
    barrelTip.applyMatrix4(this.mesh.matrixWorld);
    
    // Position the muzzle flash at the barrel tip
    this.muzzleFlash.position.copy(barrelTip);
    
    // Apply camera rotation to the muzzle flash
    this.muzzleFlash.quaternion.copy(this.camera.quaternion);
    
    // Make the muzzle flash visible
    this.muzzleFlash.visible = true;
    this.muzzleFlashVisible = true;
    
    // Clear previous timeout if exists
    if (this.muzzleFlashTimeout !== null) {
      clearTimeout(this.muzzleFlashTimeout);
    }
    
    // Hide muzzle flash after a short time
    this.muzzleFlashTimeout = window.setTimeout(() => {
      this.muzzleFlash.visible = false;
      this.muzzleFlashVisible = false;
      this.muzzleFlashTimeout = null;
    }, 50);
  }

  private applyRecoil(): void {
    // Simple recoil effect
    this.camera.rotation.x -= 0.02;
    
    // Reset after a short delay
    setTimeout(() => {
      this.camera.rotation.x += 0.01;
    }, 50);
  }

  private createBulletTrail(): void {
    // Create a bullet trail effect
    const trailGeometry = new THREE.BufferGeometry();
    
    // Get the world position of the gun barrel tip for the start point
    const barrelTip = new THREE.Vector3(0.3, -0.15, -1.5);
    barrelTip.applyMatrix4(this.mesh.matrixWorld);
    const startPoint = barrelTip.clone();
    
    // Get the direction from the camera's quaternion
    const direction = new THREE.Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion);
    
    // Calculate end point based on hit distance and direction
    const endPoint = startPoint.clone().add(
      direction.clone().multiplyScalar(this.hitDistance)
    );
    
    const vertices = new Float32Array([
      startPoint.x, startPoint.y, startPoint.z,
      endPoint.x, endPoint.y, endPoint.z
    ]);
    
    trailGeometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    
    const trailMaterial = new THREE.LineBasicMaterial({
      color: 0xffff00,
      transparent: true,
      opacity: 0.5
    });
    
    const trail = new THREE.Line(trailGeometry, trailMaterial);
    this.scene.add(trail);
    
    // Remove trail after a short time
    setTimeout(() => {
      this.scene.remove(trail);
    }, 50);
  }

  public reload(): void {
    if (this.isReloading || this.ammo === this.maxAmmo) return;
    
    this.isReloading = true;
    this.reloadStartTime = Date.now() / 1000;
    
    // Hide weapon during reload
    this.hideWeapon();
    
    // Show weapon after reload time
    setTimeout(() => {
      this.showWeapon();
    }, this.reloadTime * 1000);
  }

  private hideWeapon(): void {
    this.isVisible = false;
    this.mesh.visible = false;
  }

  private showWeapon(): void {
    this.isVisible = true;
    this.mesh.visible = true;
  }

  public canHit(targetPosition: THREE.Vector3): boolean {
    if (!this.isHitting) return false;
    
    // Check if target is in front of the weapon and within range
    const toTarget = targetPosition.clone().sub(this.hitPosition);
    const distance = toTarget.length();
    
    if (distance > this.hitDistance) return false;
    
    // Check if target is in the direction of the shot
    toTarget.normalize();
    const dotProduct = toTarget.dot(this.hitDirection);
    
    // Target is in front if dot product is positive and close to 1
    // Allow some leeway with 0.7 (about 45 degrees)
    return dotProduct > 0.7;
  }

  public getAmmo(): number {
    return this.ammo;
  }

  public getMaxAmmo(): number {
    return this.maxAmmo;
  }

  public isCurrentlyReloading(): boolean {
    return this.isReloading;
  }

  public getDamage(): number {
    return this.damage;
  }
}
