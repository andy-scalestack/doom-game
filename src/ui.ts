import { Player } from './player';
import { Weapon } from './weapon';

export class UI {
  private player: Player;
  private weapon: Weapon;
  private healthElement: HTMLElement | null;
  private ammoElement: HTMLElement | null;

  constructor(player: Player, weapon: Weapon) {
    this.player = player;
    this.weapon = weapon;
    
    // Get UI elements
    this.healthElement = document.getElementById('health');
    this.ammoElement = document.getElementById('ammo');
  }

  public update(): void {
    // Update health display
    if (this.healthElement) {
      const healthPercentage = Math.floor((this.player.getHealth() / this.player.getMaxHealth()) * 100);
      this.healthElement.textContent = `HEALTH: ${healthPercentage}`;
      
      // Change color based on health
      if (healthPercentage < 25) {
        this.healthElement.style.color = '#ff0000'; // Red for low health
      } else if (healthPercentage < 50) {
        this.healthElement.style.color = '#ff7700'; // Orange for medium health
      } else {
        this.healthElement.style.color = '#00ff00'; // Green for good health
      }
    }
    
    // Update ammo display
    if (this.ammoElement) {
      this.ammoElement.textContent = `AMMO: ${this.weapon.getAmmo()}`;
      
      // Show reloading text if weapon is reloading
      if (this.weapon.isCurrentlyReloading()) {
        this.ammoElement.textContent = 'RELOADING...';
      }
      
      // Change color based on ammo
      const ammoPercentage = (this.weapon.getAmmo() / this.weapon.getMaxAmmo()) * 100;
      if (ammoPercentage < 25) {
        this.ammoElement.style.color = '#ff0000'; // Red for low ammo
      } else if (ammoPercentage < 50) {
        this.ammoElement.style.color = '#ff7700'; // Orange for medium ammo
      } else {
        this.ammoElement.style.color = '#00ff00'; // Green for good ammo
      }
    }
  }
}
