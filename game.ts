// Define interfaces for our game objects
interface Character {
    name: string;
    level: number;
    maxHp: number;
    currentHp: number;
    xp: number;
    xpToNextLevel: number;
    gold: number;
    attack: number;
    defense: number;
    passiveDamage: number;
    criticalChance: number;
    goldBonus: number;
}

interface Enemy {
    name: string;
    level: number;
    maxHp: number;
    currentHp: number;
    xpReward: number;
    goldReward: number;
    damage: number;
}

interface Upgrade {
    name: string;
    cost: number;
    level: number;
    baseEffect: number;
    description: string;
    apply: (character: Character) => void;
}

// Game state
class GameState {
    character: Character;
    enemy: Enemy;
    enemies: Enemy[];
    upgrades: Record<string, Upgrade>;
    enemiesDefeated: number = 0;
    totalGoldEarned: number = 0;
    criticalHits: number = 0;
    lastUpdate: number;
    gameLog: string[] = [];

    constructor() {
        // Initialize character
        this.character = {
            name: "Hero",
            level: 1,
            maxHp: 100,
            currentHp: 100,
            xp: 0,
            xpToNextLevel: 100,
            gold: 0,
            attack: 1,
            defense: 0,
            passiveDamage: 0,
            criticalChance: 5,
            goldBonus: 0
        };

        // Create enemy types
        this.enemies = [
            { name: "Goblin", level: 1, maxHp: 20, currentHp: 20, xpReward: 10, goldReward: 2, damage: 1 },
            { name: "Wolf", level: 1, maxHp: 25, currentHp: 25, xpReward: 15, goldReward: 3, damage: 2 },
            { name: "Bandit", level: 2, maxHp: 40, currentHp: 40, xpReward: 20, goldReward: 5, damage: 3 },
            { name: "Skeleton", level: 3, maxHp: 60, currentHp: 60, xpReward: 30, goldReward: 7, damage: 4 },
            { name: "Orc", level: 5, maxHp: 100, currentHp: 100, xpReward: 50, goldReward: 10, damage: 6 }
        ];

        // Spawn first enemy
        this.enemy = this.generateEnemy();

        // Set up upgrades
        this.upgrades = {
            weapon: {
                name: "Weapon Upgrade",
                cost: 10,
                level: 0,
                baseEffect: 1,
                description: "Increases attack by 1",
                apply: (character: Character) => {
                    character.attack += this.upgrades.weapon.baseEffect;
                }
            },
            armor: {
                name: "Armor Upgrade",
                cost: 15,
                level:.0,
                baseEffect: 1,
                description: "Increases defense by 1",
                apply: (character: Character) => {
                    character.defense += this.upgrades.armor.baseEffect;
                }
            },
            potion: {
                name: "Health Potion",
                cost: 5,
                level: 0,
                baseEffect: 20,
                description: "Heals 20 HP",
                apply: (character: Character) => {
                    character.currentHp = Math.min(character.currentHp + this.upgrades.potion.baseEffect, character.maxHp);
                    this.addToLog(`You used a health potion and healed ${this.upgrades.potion.baseEffect} HP!`);
                }
            },
            passive: {
                name: "Passive Damage",
                cost: 25,
                level: 0,
                baseEffect: 0.2,
                description: "Deal damage automatically over time",
                apply: (character: Character) => {
                    character.passiveDamage += this.upgrades.passive.baseEffect;
                }
            }
        };

        // Initialize last update time
        this.lastUpdate = Date.now();
        this.gameLog = ["Welcome to Fantasy Idle Clicker!", "Click on your character to attack enemies."];
    }

    generateEnemy(): Enemy {
        // Select enemy based on character level
        const availableEnemies = this.enemies.filter(e => e.level <= this.character.level + 2);
        const selectedEnemy = availableEnemies[Math.floor(Math.random() * availableEnemies.length)];
        
        // Clone the enemy to avoid modifying the template
        const enemy = { ...selectedEnemy };
        
        // Scale enemy with character level (if character is higher level than the enemy)
        if (this.character.level > enemy.level) {
            const levelDiff = this.character.level - enemy.level;
            enemy.maxHp += Math.floor(enemy.maxHp * 0.2 * levelDiff);
            enemy.currentHp = enemy.maxHp;
            enemy.xpReward += Math.floor(enemy.xpReward * 0.1 * levelDiff);
            enemy.goldReward += Math.floor(enemy.goldReward * 0.1 * levelDiff);
            enemy.damage += Math.floor(levelDiff / 2);
        }
        
        return enemy;
    }

    attackEnemy(damageMultiplier: number = 1): void {
        if (this.character.currentHp <= 0) {
            this.addToLog("You need to heal before attacking!");
            return;
        }

        // Calculate damage with critical hit chance
        let damage = this.character.attack * damageMultiplier;
        let isCritical = Math.random() * 100 < this.character.criticalChance;
        
        if (isCritical) {
            damage *= 2;
            this.criticalHits++;
            this.addToLog(`Critical hit! You dealt ${damage} damage to the ${this.enemy.name}!`);
        } else {
            this.addToLog(`You attacked the ${this.enemy.name} for ${damage} damage.`);
        }

        // Apply damage to enemy
        this.enemy.currentHp -= damage;

        // Check if enemy is defeated
        if (this.enemy.currentHp <= 0) {
            this.defeatEnemy();
        } else {
            // Enemy counterattack
            this.takeDamageFromEnemy();
        }

        // Update UI
        this.updateUI();
    }

    defeatEnemy(): void {
        // Calculate rewards with bonuses
        const goldReward = Math.floor(this.enemy.goldReward * (1 + this.character.goldBonus / 100));
        
        // Apply rewards
        this.character.xp += this.enemy.xpReward;
        this.character.gold += goldReward;
        this.totalGoldEarned += goldReward;
        this.enemiesDefeated++;
        
        this.addToLog(`You defeated the ${this.enemy.name}!`);
        this.addToLog(`+ ${this.enemy.xpReward} XP, + ${goldReward} gold`);
        
        // Check for level up
        this.checkLevelUp();
        
        // Generate a new enemy
        this.enemy = this.generateEnemy();
        this.addToLog(`A ${this.enemy.name} appears!`);
    }

    takeDamageFromEnemy(): void {
        // Calculate damage reduction from defense
        const damageReduction = Math.min(0.75, this.character.defense * 0.04); // Cap at 75% reduction
        const damageTaken = Math.max(1, Math.floor(this.enemy.damage * (1 - damageReduction)));
        
        this.character.currentHp -= damageTaken;
        this.addToLog(`The ${this.enemy.name} attacks you for ${damageTaken} damage.`);
        
        // Check if character is defeated
        if (this.character.currentHp <= 0) {
            this.character.currentHp = 0;
            this.addToLog("You have been defeated! Use a health potion to recover.");
        }
    }

    checkLevelUp(): void {
        if (this.character.xp >= this.character.xpToNextLevel) {
            this.character.level++;
            this.character.xp -= this.character.xpToNextLevel;
            this.character.xpToNextLevel = Math.floor(this.character.xpToNextLevel * 1.4);
            this.character.maxHp += 10;
            this.character.currentHp = this.character.maxHp;
            this.character.attack += 1;
            
            this.addToLog(`Level up! You are now level ${this.character.level}.`);
            this.addToLog("Your health has been restored!");
            
            // Check if there's another level up pending
            this.checkLevelUp();
        }
    }

    purchaseUpgrade(upgradeKey: string): void {
        const upgrade = this.upgrades[upgradeKey];
        
        if (!upgrade) {
            console.error("Upgrade not found:", upgradeKey);
            return;
        }
        
        if (this.character.gold >= upgrade.cost) {
            // Apply the upgrade effect
            upgrade.apply(this.character);
            
            // Deduct cost
            this.character.gold -= upgrade.cost;
            
            // Increase upgrade level and cost
            upgrade.level++;
            upgrade.cost = Math.floor(upgrade.cost * 1.5);
            
            this.addToLog(`You purchased ${upgrade.name}!`);
            
            // Update UI
            this.updateUI();
        } else {
            this.addToLog(`Not enough gold for ${upgrade.name}!`);
        }
    }

    update(): void {
        const now = Date.now();
        const deltaTime = (now - this.lastUpdate) / 1000; // Convert to seconds
        this.lastUpdate = now;
        
        // Apply passive damage if character is alive
        if (this.character.currentHp > 0 && this.character.passiveDamage > 0) {
            const passiveDamageAmount = this.character.passiveDamage * deltaTime;
            
            if (passiveDamageAmount >= 1) {
                this.enemy.currentHp -= passiveDamageAmount;
                
                // Only log the damage every second or so to avoid spam
                if (Math.random() < 0.1) {
                    this.addToLog(`Your passive abilities deal ${passiveDamageAmount.toFixed(1)} damage.`);
                }
                
                // Check if enemy was defeated by passive damage
                if (this.enemy.currentHp <= 0) {
                    this.defeatEnemy();
                }
            }
        }
        
        // Update UI
        this.updateUI();
    }

    addToLog(message: string): void {
        this.gameLog.unshift(message);
        if (this.gameLog.length > 20) {
            this.gameLog.pop();
        }
    }

    updateUI(): void {
        // This will be implemented in the game.js file after transpilation
        // This is just a placeholder for the TypeScript interface
    }
}

// Create and export the game instance
const game = new GameState();
export default game;