// Game state will be defined here after TypeScript compilation
// For now, we'll implement the UI handling and game loop

document.addEventListener('DOMContentLoaded', () => {
    // Game state
    const game = {
        character: {
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
        },
        enemy: null,
        enemies: [
            { name: "Goblin", level: 1, maxHp: 20, currentHp: 20, xpReward: 10, goldReward: 2, damage: 1 },
            { name: "Wolf", level: 1, maxHp: 25, currentHp: 25, xpReward: 15, goldReward: 3, damage: 2 },
            { name: "Bandit", level: 2, maxHp: 40, currentHp: 40, xpReward: 20, goldReward: 5, damage: 3 },
            { name: "Skeleton", level: 3, maxHp: 60, currentHp: 60, xpReward: 30, goldReward: 7, damage: 4 },
            { name: "Orc", level: 5, maxHp: 100, currentHp: 100, xpReward: 50, goldReward: 10, damage: 6 }
        ],
        upgrades: {
            weapon: {
                name: "Weapon Upgrade",
                cost: 10,
                level: 0,
                baseEffect: 1,
                description: "Increases attack by 1",
                apply: (character) => {
                    character.attack += game.upgrades.weapon.baseEffect;
                }
            },
            armor: {
                name: "Armor Upgrade",
                cost: 15,
                level: 0,
                baseEffect: 1,
                description: "Increases defense by 1",
                apply: (character) => {
                    character.defense += game.upgrades.armor.baseEffect;
                }
            },
            potion: {
                name: "Health Potion",
                cost: 5,
                level: 0,
                baseEffect: 20,
                description: "Heals 20 HP",
                apply: (character) => {
                    character.currentHp = Math.min(character.currentHp + game.upgrades.potion.baseEffect, character.maxHp);
                    game.addToLog(`You used a health potion and healed ${game.upgrades.potion.baseEffect} HP!`);
                }
            },
            passive: {
                name: "Passive Damage",
                cost: 25,
                level: 0,
                baseEffect: 0.2,
                description: "Deal damage automatically over time",
                apply: (character) => {
                    character.passiveDamage += game.upgrades.passive.baseEffect;
                }
            }
        },
        enemiesDefeated: 0,
        totalGoldEarned: 0,
        criticalHits: 0,
        gameLog: ["Welcome to Fantasy Idle Clicker!", "Click on your character to attack enemies."],
        lastUpdate: Date.now(),

        // Game methods
        generateEnemy() {
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
        },

        attackEnemy(damageMultiplier = 1) {
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
        },

        defeatEnemy() {
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
        },

        takeDamageFromEnemy() {
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
        },

        checkLevelUp() {
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
        },

        purchaseUpgrade(upgradeKey) {
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
        },

        update() {
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
        },

        addToLog(message) {
            this.gameLog.unshift(message);
            if (this.gameLog.length > 20) {
                this.gameLog.pop();
            }
            
            // Update log UI
            updateLogUI();
        },
        
        updateUI() {
            // Update character info
            document.getElementById('character-name').textContent = `${this.character.name} (Level ${this.character.level})`;
            document.getElementById('hp-value').textContent = `${Math.ceil(this.character.currentHp)}/${this.character.maxHp}`;
            document.getElementById('xp-value').textContent = `${this.character.xp}/${this.character.xpToNextLevel}`;
            document.getElementById('gold-value').textContent = this.character.gold.toString();
            
            // Update HP and XP bars
            const hpPercentage = (this.character.currentHp / this.character.maxHp) * 100;
            document.getElementById('hp-bar').style.width = `${hpPercentage}%`;
            
            const xpPercentage = (this.character.xp / this.character.xpToNextLevel) * 100;
            document.getElementById('xp-bar').style.width = `${xpPercentage}%`;
            
            // Update enemy info
            document.getElementById('enemy-name').textContent = this.enemy.name;
            document.getElementById('enemy-hp-value').textContent = `${Math.ceil(this.enemy.currentHp)}/${this.enemy.maxHp}`;
            
            const enemyHpPercentage = (this.enemy.currentHp / this.enemy.maxHp) * 100;
            document.getElementById('enemy-hp-bar').style.width = `${enemyHpPercentage}%`;
            
            // Update stats
            document.getElementById('stat-attack').textContent = this.character.attack.toString();
            document.getElementById('stat-defense').textContent = this.character.defense.toString();
            document.getElementById('stat-passive').textContent = this.character.passiveDamage.toFixed(1);
            document.getElementById('stat-critical').textContent = `${this.character.criticalChance}%`;
            document.getElementById('stat-gold-bonus').textContent = `${this.character.goldBonus}%`;
            
            document.getElementById('stat-enemies-defeated').textContent = this.enemiesDefeated.toString();
            document.getElementById('stat-total-gold').textContent = this.totalGoldEarned.toString();
            document.getElementById('stat-critical-hits').textContent = this.criticalHits.toString();
            
            // Update upgrade costs
            document.querySelectorAll('.upgrade-item').forEach(element => {
                const upgradeKey = element.id.replace('upgrade-', '');
                const upgrade = this.upgrades[upgradeKey];
                
                if (upgrade) {
                    const costElement = element.querySelector('span:last-child');
                    if (costElement) {
                        costElement.textContent = `${upgrade.cost} gold`;
                    }
                    
                    // Disable upgrade if not enough gold
                    if (this.character.gold < upgrade.cost) {
                        element.classList.add('disabled');
                    } else {
                        element.classList.remove('disabled');
                    }
                }
            });
            
            // Update adventure availability based on level
            const adventureItems = document.querySelectorAll('#adventures-tab .upgrade-item');
            adventureItems.forEach((item, index) => {
                const requiredLevel = [3, 5, 10][index];
                if (this.character.level >= requiredLevel) {
                    item.classList.remove('disabled');
                    item.querySelector('span:last-child').textContent = 'Available';
                }
            });
        }
    };
    
    // Initialize the game
    game.enemy = game.generateEnemy();
    game.updateUI();
    
    // UI Event handlers
    function updateLogUI() {
        const logContainer = document.getElementById('log-container');
        logContainer.innerHTML = '';
        
        game.gameLog.forEach(message => {
            const logEntry = document.createElement('div');
            logEntry.className = 'log-entry';
            logEntry.textContent = message;
            logContainer.appendChild(logEntry);
        });
    }
    
    // Tab switching
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', () => {
            const tabName = tab.getAttribute('data-tab');
            
            // Update active tab
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            // Update tab content
            document.querySelectorAll('.tab-content').forEach(content => {
                content.classList.remove('active');
            });
            document.getElementById(`${tabName}-tab`).classList.add('active');
        });
    });
    
    // Click attack
    document.getElementById('character-portrait').addEventListener('click', () => {
        game.attackEnemy();
    });
    
    // Purchase upgrades
    document.querySelectorAll('.upgrade-item').forEach(item => {
        item.addEventListener('click', () => {
            if (!item.classList.contains('disabled')) {
                const upgradeKey = item.id.replace('upgrade-', '');
                game.purchaseUpgrade(upgradeKey);
            }
        });
    });
    
    // Adventure button clicks
    document.querySelectorAll('#adventures-tab .upgrade-item').forEach((item, index) => {
        item.addEventListener('click', () => {
            if (!item.classList.contains('disabled')) {
                const adventureNames = ["Forest Expedition", "Dungeon Crawl", "Dragon's Lair"];
                const adventureBonuses = [
                    { gold: 10, xp: 25 },
                    { gold: 25, xp: 50 },
                    { gold: 100, xp: 200 }
                ];
                
                const adventure = adventureBonuses[index];
                game.character.gold += adventure.gold;
                game.character.xp += adventure.xp;
                game.totalGoldEarned += adventure.gold;
                
                game.addToLog(`You completed the ${adventureNames[index]}!`);
                game.addToLog(`+ ${adventure.xp} XP, + ${adventure.gold} gold`);
                
                // Check for level up
                game.checkLevelUp();
                
                // Put adventure on cooldown by temporarily disabling it
                item.classList.add('disabled');
                item.querySelector('span:last-child').textContent = 'Cooldown';
                
                setTimeout(() => {
                    item.classList.remove('disabled');
                    item.querySelector('span:last-child').textContent = 'Available';
                }, 60000); // 1 minute cooldown
            }
        });
    });
    
    // Game loop for passive updates
    setInterval(() => {
        game.update();
    }, 100); // Update every 100ms
    
    // Initial UI update
    updateLogUI();
});
