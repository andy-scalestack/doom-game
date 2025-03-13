import * as THREE from 'three';

export class Level {
  private scene: THREE.Scene;
  private walls: THREE.Mesh[] = [];
  private floor!: THREE.Mesh; // Using definite assignment assertion
  private ceiling!: THREE.Mesh; // Using definite assignment assertion
  private textures: {
    wall: THREE.Texture;
    floor: THREE.Texture;
    ceiling: THREE.Texture;
  };

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    
    // Load textures with higher contrast patterns
    const textureLoader = new THREE.TextureLoader();
    this.textures = {
      // Enhanced wall texture with detailed brick pattern
      wall: textureLoader.load('https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/brick_diffuse.jpg'),
      // Enhanced floor texture with detailed pattern
      floor: textureLoader.load('https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/hardwood2_diffuse.jpg'),
      // Enhanced ceiling texture with detailed pattern
      ceiling: textureLoader.load('https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/plaster.jpg')
    };
    
    // Set texture repeat with optimized values for each texture
    // Wall texture - smaller repeat for more detailed bricks
    this.textures.wall.wrapS = THREE.RepeatWrapping;
    this.textures.wall.wrapT = THREE.RepeatWrapping;
    this.textures.wall.repeat.set(2, 2);
    
    // Floor texture - larger repeat for better wood plank appearance
    this.textures.floor.wrapS = THREE.RepeatWrapping;
    this.textures.floor.wrapT = THREE.RepeatWrapping;
    this.textures.floor.repeat.set(8, 8);
    
    // Ceiling texture - medium repeat
    this.textures.ceiling.wrapS = THREE.RepeatWrapping;
    this.textures.ceiling.wrapT = THREE.RepeatWrapping;
    this.textures.ceiling.repeat.set(6, 6);

    // Create level geometry
    this.createLevel();
    
    // Add lighting
    this.addLighting();
  }

  private createLevel(): void {
    // Create floor with enhanced material properties
    const floorGeometry = new THREE.PlaneGeometry(100, 200);
    const floorMaterial = new THREE.MeshStandardMaterial({ 
      map: this.textures.floor,
      roughness: 0.7,
      metalness: 0.3,
      bumpMap: this.textures.floor,
      bumpScale: 0.05,
      emissive: 0x111111,
      emissiveIntensity: 0.2
    });
    this.floor = new THREE.Mesh(floorGeometry, floorMaterial);
    this.floor.rotation.x = -Math.PI / 2;
    this.floor.position.y = -0.5;
    this.floor.receiveShadow = true;
    this.scene.add(this.floor);

    // Create ceiling with enhanced material properties
    const ceilingGeometry = new THREE.PlaneGeometry(100, 200);
    const ceilingMaterial = new THREE.MeshStandardMaterial({ 
      map: this.textures.ceiling,
      roughness: 0.7,
      metalness: 0.2,
      bumpMap: this.textures.ceiling,
      bumpScale: 0.03,
      emissive: 0x222222,
      emissiveIntensity: 0.3
    });
    this.ceiling = new THREE.Mesh(ceilingGeometry, ceilingMaterial);
    this.ceiling.rotation.x = Math.PI / 2;
    this.ceiling.position.y = 4;
    this.ceiling.receiveShadow = true;
    this.scene.add(this.ceiling);

    // Create walls with enhanced texture and properties
    const wallMaterial = new THREE.MeshStandardMaterial({ 
      map: this.textures.wall,
      roughness: 0.8,
      metalness: 0.4,
      emissive: 0x333333, // Stronger emissive property for better visibility
      emissiveIntensity: 0.4, // Increased emissive intensity
      bumpMap: this.textures.wall, // Use the texture as a bump map too
      bumpScale: 0.2, // Add subtle 3D effect to bricks
      normalScale: new THREE.Vector2(0.5, 0.5) // Enhance the 3D effect
    });

    // Level layout - walls
    this.createWall(new THREE.Vector3(-50, 2, 0), new THREE.Vector3(1, 4, 200), wallMaterial); // Left boundary
    this.createWall(new THREE.Vector3(50, 2, 0), new THREE.Vector3(1, 4, 200), wallMaterial);  // Right boundary
    this.createWall(new THREE.Vector3(0, 2, -100), new THREE.Vector3(100, 4, 1), wallMaterial); // Back boundary
    this.createWall(new THREE.Vector3(0, 2, 100), new THREE.Vector3(100, 4, 1), wallMaterial);  // Front boundary

    // Maze-like interior walls
    this.createWall(new THREE.Vector3(-30, 2, -20), new THREE.Vector3(20, 4, 1), wallMaterial);
    this.createWall(new THREE.Vector3(30, 2, -20), new THREE.Vector3(20, 4, 1), wallMaterial);
    this.createWall(new THREE.Vector3(-20, 2, -40), new THREE.Vector3(1, 4, 40), wallMaterial);
    this.createWall(new THREE.Vector3(20, 2, -40), new THREE.Vector3(1, 4, 40), wallMaterial);
    this.createWall(new THREE.Vector3(0, 2, -60), new THREE.Vector3(40, 4, 1), wallMaterial);
    this.createWall(new THREE.Vector3(-30, 2, -70), new THREE.Vector3(20, 4, 1), wallMaterial);
    this.createWall(new THREE.Vector3(30, 2, -70), new THREE.Vector3(20, 4, 1), wallMaterial);
    
    // Boss room
    this.createWall(new THREE.Vector3(-20, 2, -90), new THREE.Vector3(1, 4, 20), wallMaterial);
    this.createWall(new THREE.Vector3(20, 2, -90), new THREE.Vector3(1, 4, 20), wallMaterial);
  }

  private createWall(position: THREE.Vector3, size: THREE.Vector3, material: THREE.Material): void {
    const geometry = new THREE.BoxGeometry(size.x, size.y, size.z);
    const wall = new THREE.Mesh(geometry, material);
    wall.position.copy(position);
    wall.castShadow = true;
    wall.receiveShadow = true;
    this.scene.add(wall);
    this.walls.push(wall);
  }

  private addLighting(): void {
    // Ambient light - increased intensity from 0.5 to 1.5
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.5);
    this.scene.add(ambientLight);

    // Point lights throughout the level
    const createPointLight = (x: number, y: number, z: number, intensity: number = 1, color: number = 0xffffff) => {
      // Increased light range from 20 to 50
      const light = new THREE.PointLight(color, intensity, 50);
      light.position.set(x, y, z);
      light.castShadow = true;
      this.scene.add(light);
      return light;
    };

    // Add lights throughout the level with increased intensity
    createPointLight(0, 3, 0, 2.0);
    createPointLight(-20, 3, -30, 2.0);
    createPointLight(20, 3, -30, 2.0);
    createPointLight(0, 3, -60, 2.0);
    createPointLight(-30, 3, -10, 2.0); // Additional light
    createPointLight(30, 3, -10, 2.0);  // Additional light
    createPointLight(-10, 3, -50, 2.0); // Additional light
    createPointLight(10, 3, -50, 2.0);  // Additional light
    
    // Red light in boss area - increased intensity
    createPointLight(0, 3, -80, 3.0, 0xff0000);
  }

  public getWalls(): THREE.Mesh[] {
    return this.walls;
  }
}
