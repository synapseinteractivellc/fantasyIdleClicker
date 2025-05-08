// Define interfaces for our game objects
interface Character {
    name: string;
    level: number;
    characterClass: string;
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
    specialAbility: SpecialAbility;
}

interface SpecialAbility {
    name: string;
    cooldown: number;
    currentCooldown: number;
    description: string;
    effect: () => void;
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

interface LootItem {
    name: string;
    rarity: 'common' | 'uncommon' | 'rare' | 'epic';
    effect: string;
    chance: number;
    action: (character: Character) => void;
}

interface Achievement {
    name: string;
    description: string;
    target: number;
    current: number;
    type: 'enemies' | 'gold' | 'level' | 'crits' | 'upgrades';
    completed: boolean;
    reward: AchievementReward;
}

interface AchievementReward {
    gold?: number;
    attack?: number;
    defense?: number;
    maxHp?: number;
    criticalChance?: number;
    goldBonus?: number;
}

interface LogEntry {
    text: string;
    type: '' | 'critical' | 'reward' | 'level-up';
}

// Game state
class GameState {
    // Character Data
    character: Character;
    
    // Enemy Data
    enemy: Enemy;
    enemies: Enemy[];
    
    // Loot System
    loot: LootItem[];
    
    // Upgrade System
    upgrades: Record<string, Upgrade>;
    
    // Achievement System
    achievements: Record<string, Achievement>;
    
    // Game Statistics
    enemiesDefeated: number = 0;
    totalGoldEarned: number = 0;
    criticalHits: number = 0;
    totalUpgradesPurchased: number = 0;
    gameLog: LogEntry[] = [];
    lastUpdate: number;

    constructor() {
        // Initialize character
        this.character = {
            name: "Hero",
            level: 1,
            characterClass: "",
            maxHp: 100,
            currentHp: 100,
            xp: 0,
            xpToNextLevel: 100,
            gold: 0,
            attack: 1,
            defense: 0,
            passiveDamage: 0,
            criticalChance: 5,
            goldBonus: 0,
            specialAbility: {
                name: "",
                cooldown: 0,
                currentCooldown: 0,
                description: "",
                effect: () => {}
            }
        };

        // Create enemy types
        this.enemies = [
            { name: "Goblin", level: 1, maxHp: 20, currentHp: 20, xpReward: 10, goldReward: 2, damage: 1 },
            { name: "Wolf", level: 1, maxHp: 25, currentHp: 25, xpReward: 15, goldReward: 3, damage: 2 },
            { name: "Bandit", level: 2, maxHp: 40, currentHp: 40, xpReward: 20, goldReward: 5, damage: 3 },
            { name: "Skeleton", level: 3, maxHp: 60, currentHp: 60, xpReward: 30, goldReward: 7, damage: 4 },
            { name: "Orc", level: 5, maxHp: 100, currentHp: 100, xpReward: 50, goldReward: 10, damage: 6 },
            { name: "Troll", level: 7, maxHp: 150, currentHp: 150, xpReward: 70, goldReward: 15, damage: 8 },
            { name: "Dark Elf", level: 8, maxHp: 130, currentHp: 130, xpReward: 80, goldReward: 18, damage: 10 },
            { name: "Minotaur", level: 10, maxHp: 200, currentHp: 200, xpReward: 100, goldReward: 25, damage: 12 },
            { name: "Dragon Hatchling", level: 12, maxHp: 250, currentHp: 250, xpReward: 120, goldReward: 30, damage: 15 },
            { name: "Ancient Golem", level: 15, maxHp: 400, currentHp: 400, xpReward: 200, goldReward: 50, damage: 20 }
        ];

        // Spawn first enemy
        this.enemy = this.generateEnemy();

        // Setup loot system
        this.loot = [
            { name: "Health Potion", rarity: 'common', effect: "Restore 20 HP", chance: 0.2, 
              action: (char) => { char.currentHp = Math.min(char.currentHp + 20, char.maxHp); } },
            { name: "Gold Coin Pouch", rarity: 'common', effect: "Gain 5 extra gold", chance: 0.3, 
              action: (char) => { char.gold += 5; } },
            { name: "Sharpening Stone", rarity: 'uncommon', effect: "Temporary +2 attack", chance: 0.1, 
              action: (char) => { 
                  const originalAttack = char.attack;
                  char.attack += 2;
                  setTimeout(() => { char.attack = originalAttack; }, 60000);
              } },
            { name: "Lucky Charm", rarity: 'uncommon', effect: "Temporary +5% critical chance", chance: 0.1, 
              action: (char) => { 
                  const originalCrit = char.criticalChance;
                  char.criticalChance += 5;
                  setTimeout(() => { char.criticalChance = originalCrit; }, 60000);
              } },
            { name: "Ancient Scroll", rarity: 'rare', effect: "Gain 30 XP", chance: 0.05, 
              action: (char) => { char.xp += 30; } },
            { name: "Enchanted Armor", rarity: 'rare', effect: "Temporary +3 defense", chance: 0.05, 
              action: (char) => { 
                  const originalDefense = char.defense;
                  char.defense += 3;
                  setTimeout(() => { char.defense = originalDefense; }, 60000);
              } },
            { name: "Legendary Rune", rarity: 'epic', effect: "All stats +1 permanently", chance: 0.01, 
              action: (char) => { 
                  char.attack += 1;
                  char.defense += 1;
                  char.criticalChance += 1;
                  char.maxHp += 10;
                  char.currentHp += 10;
              } }
        ];

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
                level: 0,
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

        // Setup achievements
        this.achievements = {
            "enemies-10": { 
                name: "Novice Hunter", 
                description: "Defeat 10 enemies", 
                target: 10, 
                current: 0, 
                type: "enemies", 
                completed: false, 
                reward: { gold: 10 } 
            },
            "enemies-50": { 
                name: "Veteran Slayer", 
                description: "Defeat 50 enemies", 
                target: 50, 
                current: 0, 
                type: "enemies", 
                completed: false, 
                reward: { gold: 50, criticalChance: 2 } 
            },
            "gold-100": { 
                name: "Treasure Hunter", 
                description: "Collect 100 gold", 
                target: 100, 
                current: 0, 
                type: "gold", 
                completed: false, 
                reward: { gold: 20 } 
            },
            "gold-500": { 
                name: "Treasure Baron", 
                description: "Collect 500 gold", 
                target: 500, 
                current: 0, 
                type: "gold", 
                completed: false, 
                reward: { gold: 100, goldBonus: 5 } 
            },
            "level-5": { 
                name: "Rising Hero", 
                description: "Reach level 5", 
                target: 5, 
                current: 1, 
                type: "level", 
                completed: false, 
                reward: { maxHp: 20 } 
            },
            "level-10": { 
                name: "Legendary Explorer", 
                description: "Reach level 10", 
                target: 10, 
                current: 1, 
                type: "level", 
                completed: false, 
                reward: { attack: 3, defense: 3 } 
            },
            "crits-20": { 
                name: "Critical Striker", 
                description: "Land 20 critical hits", 
                target: 20, 
                current: 0, 
                type: "crits", 
                completed: false, 
                reward: { criticalChance: 5 } 
            },
            "upgrades-10": { 
                name: "Master Upgrader", 
                description: "Purchase 10 upgrades", 
                target: 10, 
                current: 0, 
                type: "upgrades", 
                completed: false, 
                reward: { gold: 30, attack: 1, defense: 1 } 
            }
        };

        // Initialize last update time
        this.lastUpdate = Date.now();
        this.gameLog = [
            { text: "Welcome to Fantasy Idle Clicker!", type: "level-up" },
            { text: "Click on your character to attack enemies.", type: "" }
        ];
    }

    // ========================
    // Game Methods
    // ========================
    
    // Enemy Generation
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

    // Combat System
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
            this.addToLog(`Critical hit! You dealt ${damage} damage to the ${this.enemy.name}!`, 'critical');
            
            // Check for critical hit achievement
            this.checkAchievements('crits');
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
        
        this.addToLog(`You defeated the ${this.enemy.name}!`, 'critical');
        this.addToLog(`+ ${this.enemy.xpReward} XP, + ${goldReward} gold`, 'reward');
        
        // Check for random loot drop
        this.checkForLoot();
        
        // Check for achievements
        this.checkAchievements('enemies');
        this.checkAchievements('gold');
        
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

    // Progression System
    checkLevelUp(): void {
        if (this.character.xp >= this.character.xpToNextLevel) {
            this.character.level++;
            this.character.xp -= this.character.xpToNextLevel;
            this.character.xpToNextLevel = Math.floor(this.character.xpToNextLevel * 1.4);
            this.character.maxHp += 10;
            this.character.currentHp = this.character.maxHp;
            this.character.attack += 1;
            
            this.addToLog(`Level up! You are now level ${this.character.level}.`, 'level-up');
            this.addToLog("Your health has been restored!", 'level-up');
            
            // Check level achievements
            this.checkAchievements('level');
            
            // Check if there's another level up pending
            this.checkLevelUp();
        }
    }

    // Upgrade System
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
            
            // Increment total upgrades purchased
            this.totalUpgradesPurchased++;
            
            // Check upgrades achievement
            this.checkAchievements('upgrades');
            
            this.addToLog(`You purchased ${upgrade.name}!`);
            
            // Update UI
            this.updateUI();
        } else {
            this.addToLog(`Not enough gold for ${upgrade.name}!`);
        }
    }

    // Loot System
    checkForLoot(): void {
        // Higher level enemies have better loot chances
        const lootChanceMultiplier = 1 + (this.enemy.level * 0.05);
        
        // Roll for each possible loot item
        this.loot.forEach(item => {
            const adjustedChance = item.chance * lootChanceMultiplier;
            if (Math.random() < adjustedChance) {
                // Player got this loot!
                item.action(this.character);
                
                // Determine message style based on rarity
                let messageStyle: LogEntry['type'] = '';
                switch (item.rarity) {
                    case 'common':
                        messageStyle = '';
                        break;
                    case 'uncommon':
                        messageStyle = 'reward';
                        break;
                    case 'rare':
                        messageStyle = 'level-up';
                        break;
                    case 'epic':
                        messageStyle = 'critical';
                        break;
                }
                
                this.addToLog(`You found ${item.rarity === 'epic' ? 'a' : 'an'} ${item.rarity} ${item.name}!`, messageStyle);
                this.addToLog(`Effect: ${item.effect}`, messageStyle);
                
                this.updateUI();
            }
        });
    }

    // Achievement System
    checkAchievements(type: Achievement['type'], value?: number | null): void {
        let achievementsUpdated = false;
        
        Object.keys(this.achievements).forEach(key => {
            const achievement = this.achievements[key];
            
            // Skip if already completed
            if (achievement.completed) return;
            
            // Check if this achievement matches the type we're checking
            if (achievement.type === type) {
                // Update the current value based on the achievement type
                switch (type) {
                    case 'enemies':
                        achievement.current = this.enemiesDefeated;
                        break;
                    case 'gold':
                        achievement.current = this.totalGoldEarned;
                        break;
                    case 'level':
                        achievement.current = this.character.level;
                        break;
                    case 'crits':
                        achievement.current = this.criticalHits;
                        break;
                    case 'upgrades':
                        achievement.current = this.totalUpgradesPurchased;
                        break;
                }
                
                // Check if achievement is completed
                if (achievement.current >= achievement.target) {
                    achievement.completed = true;
                    achievement.current = achievement.target; // Cap at target
                    achievementsUpdated = true;
                    
                    // Apply rewards
                    this.applyAchievementReward(key, achievement);
                    
                    // Log the achievement completion
                    this.addToLog(`Achievement Unlocked: ${achievement.name}!`, 'level-up');
                }
            }
        });
        
        if (achievementsUpdated) {
            this.updateAchievementsUI();
        }
    }
    
    applyAchievementReward(key: string, achievement: Achievement): void {
        const reward = achievement.reward;
        
        if (reward.gold) {
            this.character.gold += reward.gold;
            this.totalGoldEarned += reward.gold;
            this.addToLog(`Reward: +${reward.gold} gold`, 'reward');
        }
        
        if (reward.attack) {
            this.character.attack += reward.attack;
            this.addToLog(`Reward: +${reward.attack} attack`, 'reward');
        }
        
        if (reward.defense) {
            this.character.defense += reward.defense;
            this.addToLog(`Reward: +${reward.defense} defense`, 'reward');
        }
        
        if (reward.maxHp) {
            this.character.maxHp += reward.maxHp;
            this.character.currentHp += reward.maxHp;
            this.addToLog(`Reward: +${reward.maxHp} max HP`, 'reward');
        }
        
        if (reward.criticalChance) {
            this.character.criticalChance += reward.criticalChance;
            this.addToLog(`Reward: +${reward.criticalChance}% critical chance`, 'reward');
        }
        
        if (reward.goldBonus) {
            this.character.goldBonus += reward.goldBonus;
            this.addToLog(`Reward: +${reward.goldBonus}% gold bonus`, 'reward');
        }
        
        // Update UI
        this.updateUI();
    }

    // Game Loop Update
    update(): void {
        const now = Date.now();
        const deltaTime = (now - this.lastUpdate) / 1000; // Convert to seconds
        this.lastUpdate = now;
        
        // Apply passive damage if character is alive
        if (this.character.currentHp > 0 && this.character.passiveDamage > 0) {
            const passiveDamageAmount = this.character.passiveDamage * deltaTime;
            
            if (passiveDamageAmount >= 0.1) {
                this.enemy.currentHp -= passiveDamageAmount;
                
                // Only log the damage occasionally to avoid spam
                if (Math.random() < 0.05) {
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

    // UI Updates
    addToLog(message: string, type: LogEntry['type'] = ''): void {
        this.gameLog.unshift({
            text: message,
            type: type
        });
        
        if (this.gameLog.length > 20) {
            this.gameLog.pop();
        }
    }
    
    // These methods will be implemented in the JavaScript code
    updateUI(): void {}
    updateAchievementsUI(): void {}
    
    // Save/Load System
    saveGame(): void {
        const gameData = {
            character: this.character,
            enemiesDefeated: this.enemiesDefeated,
            totalGoldEarned: this.totalGoldEarned,
            criticalHits: this.criticalHits,
            upgrades: this.upgrades,
            achievements: this.achievements,
            totalUpgradesPurchased: this.totalUpgradesPurchased
        };
        
        localStorage.setItem('fantasyIdleSave', JSON.stringify(gameData));
    }
    
    loadGame(): boolean {
        const savedData = localStorage.getItem('fantasyIdleSave');
        
        if (savedData) {
            try {
                const gameData = JSON.parse(savedData);
                
                // Load character data
                this.character = gameData.character;
                
                // Load game stats
                this.enemiesDefeated = gameData.enemiesDefeated;
                this.totalGoldEarned = gameData.totalGoldEarned;
                this.criticalHits = gameData.criticalHits;
                
                // Load upgrades
                this.upgrades = gameData.upgrades;
                
                // Load achievements
                this.achievements = gameData.achievements;
                
                // Load other stats
                this.totalUpgradesPurchased = gameData.totalUpgradesPurchased || 0;
                
                // Generate a new enemy
                this.enemy = this.generateEnemy();
                
                // Update UI
                this.updateUI();
                this.updateAchievementsUI();
                
                this.addToLog('Game loaded successfully!', 'level-up');
                
                return true;
            } catch (error) {
                console.error('Error loading save:', error);
                return false;
            }
        } else {
            return false;
        }
    }
}

// Create and export the game instance
const game = new GameState();
export default game;