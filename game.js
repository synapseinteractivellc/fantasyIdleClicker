document.addEventListener('DOMContentLoaded', () => {
    // Game state
    const game = {
        // Character Data
        character: {
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
                effect: null
            }
        },
        
        // Enemy Data
        enemy: null,
        enemies: [
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
        ],
        
        // Loot System
        loot: [
            { name: "Health Potion", rarity: "common", effect: "Restore 20 HP", chance: 0.2, 
              action: (char) => { char.currentHp = Math.min(char.currentHp + 20, char.maxHp); } },
            { name: "Gold Coin Pouch", rarity: "common", effect: "Gain 5 extra gold", chance: 0.3, 
              action: (char) => { char.gold += 5; } },
            { name: "Sharpening Stone", rarity: "uncommon", effect: "Temporary +2 attack", chance: 0.1, 
              action: (char) => { 
                  const originalAttack = char.attack;
                  char.attack += 2;
                  setTimeout(() => { char.attack = originalAttack; }, 60000);
              } },
            { name: "Lucky Charm", rarity: "uncommon", effect: "Temporary +5% critical chance", chance: 0.1, 
              action: (char) => { 
                  const originalCrit = char.criticalChance;
                  char.criticalChance += 5;
                  setTimeout(() => { char.criticalChance = originalCrit; }, 60000);
              } },
            { name: "Ancient Scroll", rarity: "rare", effect: "Gain 30 XP", chance: 0.05, 
              action: (char) => { char.xp += 30; } },
            { name: "Enchanted Armor", rarity: "rare", effect: "Temporary +3 defense", chance: 0.05, 
              action: (char) => { 
                  const originalDefense = char.defense;
                  char.defense += 3;
                  setTimeout(() => { char.defense = originalDefense; }, 60000);
              } },
            { name: "Legendary Rune", rarity: "epic", effect: "All stats +1 permanently", chance: 0.01, 
              action: (char) => { 
                  char.attack += 1;
                  char.defense += 1;
                  char.criticalChance += 1;
                  char.maxHp += 10;
                  char.currentHp += 10;
              } }
        ],
        
        // Upgrade System
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
        
        // Achievement System
        achievements: {
            "enemies-10": { name: "Novice Hunter", description: "Defeat 10 enemies", target: 10, current: 0, type: "enemies", completed: false, reward: { gold: 10 } },
            "enemies-50": { name: "Veteran Slayer", description: "Defeat 50 enemies", target: 50, current: 0, type: "enemies", completed: false, reward: { gold: 50, criticalChance: 2 } },
            "gold-100": { name: "Treasure Hunter", description: "Collect 100 gold", target: 100, current: 0, type: "gold", completed: false, reward: { gold: 20 } },
            "gold-500": { name: "Treasure Baron", description: "Collect 500 gold", target: 500, current: 0, type: "gold", completed: false, reward: { gold: 100, goldBonus: 5 } },
            "level-5": { name: "Rising Hero", description: "Reach level 5", target: 5, current: 1, type: "level", completed: false, reward: { maxHp: 20 } },
            "level-10": { name: "Legendary Explorer", description: "Reach level 10", target: 10, current: 1, type: "level", completed: false, reward: { attack: 3, defense: 3 } },
            "crits-20": { name: "Critical Striker", description: "Land 20 critical hits", target: 20, current: 0, type: "crits", completed: false, reward: { criticalChance: 5 } },
            "upgrades-10": { name: "Master Upgrader", description: "Purchase 10 upgrades", target: 10, current: 0, type: "upgrades", completed: false, reward: { gold: 30, attack: 1, defense: 1 } }
        },
        
        // Game Statistics
        enemiesDefeated: 0,
        totalGoldEarned: 0,
        criticalHits: 0,
        totalUpgradesPurchased: 0,
        gameLog: [
            { text: "Welcome to Fantasy Idle Clicker!", type: "level-up" },
            { text: "Click on your character to attack enemies.", type: "" }
        ],
        lastUpdate: Date.now(),
        
        // ========================
        // Game Methods
        // ========================
        
        // Enemy Generation
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

        // Combat System
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
                this.addToLog(`Critical hit! You dealt ${damage} damage to the ${this.enemy.name}!`, 'critical');
                
                // Check for critical hit achievement
                this.checkAchievements('crits');
            } else {
                this.addToLog(`You attacked the ${this.enemy.name} for ${damage} damage.`);
            }
            
            // Trigger damage animation on enemy
            const enemyPortrait = document.getElementById('enemy-portrait');
            enemyPortrait.classList.add('damaged');
            setTimeout(() => {
                enemyPortrait.classList.remove('damaged');
            }, 300);

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

        // Progression System
        checkLevelUp() {
            if (this.character.xp >= this.character.xpToNextLevel) {
                this.character.level++;
                this.character.xp -= this.character.xpToNextLevel;
                this.character.xpToNextLevel = Math.floor(this.character.xpToNextLevel * 1.4);
                this.character.maxHp += 10;
                this.character.currentHp = this.character.maxHp;
                this.character.attack += 1;
                
                this.addToLog(`Level up! You are now level ${this.character.level}.`, 'level-up');
                this.addToLog("Your health has been restored!", 'level-up');
                
                // Enable special ability at level 3
                if (this.character.level === 3 && this.character.characterClass) {
                    document.getElementById('special-ability').disabled = false;
                    this.addToLog(`Your special ability is now available!`, 'level-up');
                    showToast(`${this.character.specialAbility.name} ability unlocked!`, 'success');
                }
                
                // Check level achievements
                this.checkAchievements('level');
                
                // Check if there's another level up pending
                this.checkLevelUp();
            }
        },

        // Upgrade System
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
        },

        // Loot System
        checkForLoot() {
            // Higher level enemies have better loot chances
            const lootChanceMultiplier = 1 + (this.enemy.level * 0.05);
            
            // Roll for each possible loot item
            this.loot.forEach(item => {
                const adjustedChance = item.chance * lootChanceMultiplier;
                if (Math.random() < adjustedChance) {
                    // Player got this loot!
                    item.action(this.character);
                    
                    // Determine message style based on rarity
                    let messageStyle = '';
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
                    
                    // Show toast notification for uncommon+ items
                    if (item.rarity !== 'common') {
                        showToast(`Found: ${item.name} (${item.rarity})`, 'success');
                    }
                    
                    this.updateUI();
                }
            });
        },

        // Achievement System
        checkAchievements(type, value = null) {
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
                        
                        // Log and show notification
                        this.addToLog(`Achievement Unlocked: ${achievement.name}!`, 'level-up');
                        showToast(`Achievement Unlocked: ${achievement.name}!`, 'success');
                    }
                }
            });
            
            if (achievementsUpdated) {
                this.updateAchievementsUI();
            }
        },
        
        applyAchievementReward(key, achievement) {
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
        },

        // Game Loop Update
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

        // UI Updates
        addToLog(message, type = '') {
            this.gameLog.unshift({
                text: message,
                type: type
            });
            
            if (this.gameLog.length > 20) {
                this.gameLog.pop();
            }
            
            // Update log UI
            updateLogUI();
        },
        
        updateUI() {
            // Update character info
            document.getElementById('character-name').textContent = `${this.character.name} (Level ${this.character.level})`;
            document.getElementById('character-class').textContent = this.character.characterClass || "Adventurer";
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
        },
        
        updateAchievementsUI() {
            Object.keys(this.achievements).forEach(key => {
                const achievement = this.achievements[key];
                const achievementElement = document.getElementById(`achievement-${key}`);
                
                if (achievementElement) {
                    // Update completion status
                    if (achievement.completed) {
                        achievementElement.classList.add('completed');
                    } else {
                        achievementElement.classList.remove('completed');
                    }
                    
                    // Update progress bar
                    const progressBar = achievementElement.querySelector('.achievement-progress-bar');
                    const progressPercentage = Math.min(100, (achievement.current / achievement.target) * 100);
                    progressBar.style.width = `${progressPercentage}%`;
                    
                    // Update progress text
                    const progressText = achievementElement.querySelector('.achievement-progress-text');
                    progressText.textContent = `${achievement.current}/${achievement.target}`;
                }
            });
        },
        
        // Save/Load System
        saveGame() {
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
            showToast('Game Saved!', 'success');
        },
        
        loadGame() {
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
                    
                    // Update special ability button if class is selected
                    if (this.character.characterClass && this.character.level >= 3) {
                        const specialAbilityButton = document.getElementById('special-ability');
                        specialAbilityButton.disabled = false;
                        specialAbilityButton.textContent = this.character.specialAbility.name;
                    }
                    
                    // Hide class selection modal if class is already selected
                    if (this.character.characterClass) {
                        classModal.classList.remove('active');
                    }
                    
                    showToast('Game Loaded!', 'success');
                    this.addToLog('Game loaded successfully!', 'level-up');
                    
                    return true;
                } catch (error) {
                    console.error('Error loading save:', error);
                    showToast('Error loading save data', 'error');
                    return false;
                }
            } else {
                showToast('No saved game found', 'info');
                return false;
            }
        }
    };
    
    // UI Event handlers
    function updateLogUI() {
        const logContainer = document.getElementById('log-container');
        logContainer.innerHTML = '';
        
        game.gameLog.forEach(entry => {
            const logEntry = document.createElement('div');
            logEntry.className = 'log-entry';
            
            // Add type-specific class if provided
            if (typeof entry === 'object' && entry.type) {
                logEntry.classList.add(entry.type);
                logEntry.textContent = entry.text;
            } else {
                // Handle legacy format (plain strings) for compatibility
                logEntry.textContent = typeof entry === 'string' ? entry : entry.text;
            }
            
            logContainer.appendChild(logEntry);
        });
    }
    
    // Initialize the game
    game.enemy = game.generateEnemy();
    game.updateUI();
    game.updateAchievementsUI();
    
    // Try to load saved game if exists
    game.loadGame();
    
    // Save/Load buttons
    document.getElementById('save-button').addEventListener('click', () => {
        game.saveGame();
    });
    
    document.getElementById('load-button').addEventListener('click', () => {
        if (confirm('Load saved game? Current progress will be lost if not saved.')) {
            game.loadGame();
        }
    });
    
    // Show class selection on game start
    const classModal = document.getElementById('class-modal');
    classModal.classList.add('active');
    
    // Class selection functionality
    let selectedClass = null;
    const classOptions = document.querySelectorAll('.class-option');
    const selectClassButton = document.getElementById('select-class-button');
    
    classOptions.forEach(option => {
        option.addEventListener('click', () => {
            classOptions.forEach(opt => opt.classList.remove('selected'));
            option.classList.add('selected');
            selectedClass = option.getAttribute('data-class');
            selectClassButton.classList.remove('disabled');
        });
    });
    
    selectClassButton.addEventListener('click', () => {
        if (selectedClass) {
            setCharacterClass(selectedClass);
            classModal.classList.remove('active');
            showToast(`You've chosen the ${selectedClass} class!`, 'success');
        }
    });
    
    function setCharacterClass(className) {
        game.character.characterClass = className.charAt(0).toUpperCase() + className.slice(1);
        
        // Update character portrait based on class
        const characterPortrait = document.getElementById('character-portrait');
        
        // Apply class-specific stats and abilities
        switch (className) {
            case 'warrior':
                game.character.maxHp += 50;
                game.character.currentHp += 50;
                game.character.defense += 2;
                game.character.attack += 1;
                characterPortrait.style.backgroundColor = '#e74c3c';
                
                // Set special ability
                game.character.specialAbility = {
                    name: "Berserk Rage",
                    cooldown: 30, // seconds
                    currentCooldown: 0,
                    description: "Double your attack for 10 seconds",
                    effect: () => {
                        const originalAttack = game.character.attack;
                        game.character.attack *= 2;
                        game.addToLog(`Berserk Rage activated! Attack doubled for 10 seconds.`, 'level-up');
                        showToast('Berserk Rage activated!', 'info');
                        
                        setTimeout(() => {
                            game.character.attack = originalAttack;
                            game.addToLog(`Berserk Rage has worn off.`);
                        }, 10000);
                    }
                };
                break;
                
            case 'mage':
                game.character.maxHp -= 20;
                game.character.currentHp -= 20;
                game.character.attack += 3;
                game.character.passiveDamage += 0.5;
                characterPortrait.style.backgroundColor = '#3498db';
                
                // Set special ability
                game.character.specialAbility = {
                    name: "Arcane Blast",
                    cooldown: 20, // seconds
                    currentCooldown: 0,
                    description: "Deal massive damage to the current enemy",
                    effect: () => {
                        const damage = game.character.attack * 5;
                        game.enemy.currentHp -= damage;
                        game.addToLog(`Arcane Blast hits the ${game.enemy.name} for ${damage} damage!`, 'critical');
                        showToast(`Arcane Blast: ${damage} damage!`, 'info');
                        
                        // Check if enemy is defeated
                        if (game.enemy.currentHp <= 0) {
                            game.defeatEnemy();
                        }
                    }
                };
                break;
                
            case 'rogue':
                game.character.criticalChance += 15;
                game.character.goldBonus += 20;
                characterPortrait.style.backgroundColor = '#2ecc71';
                
                // Set special ability
                game.character.specialAbility = {
                    name: "Sneak Attack",
                    cooldown: 25, // seconds
                    currentCooldown: 0,
                    description: "Guaranteed critical hit and steal extra gold",
                    effect: () => {
                        // Deal critical damage
                        const damage = game.character.attack * 3;
                        game.enemy.currentHp -= damage;
                        game.addToLog(`Sneak Attack hits the ${game.enemy.name} for ${damage} damage!`, 'critical');
                        
                        // Steal gold
                        const goldStolen = Math.ceil(game.enemy.goldReward * 1.5);
                        game.character.gold += goldStolen;
                        game.totalGoldEarned += goldStolen;
                        game.addToLog(`You stole ${goldStolen} gold!`, 'reward');
                        
                        showToast(`Sneak Attack: ${damage} damage and ${goldStolen} gold stolen!`, 'info');
                        
                        // Check if enemy is defeated
                        if (game.enemy.currentHp <= 0) {
                            game.defeatEnemy();
                        }
                    }
                };
                break;
        }
        
        // Update the special ability button
        const specialAbilityButton = document.getElementById('special-ability');
        specialAbilityButton.textContent = `${game.character.specialAbility.name} (Level 3)`;
        specialAbilityButton.title = game.character.specialAbility.description;
        
        // Update UI
        game.updateUI();
    }
    
    // Special ability cooldown tracker
    setInterval(() => {
        if (game.character.specialAbility.currentCooldown > 0) {
            game.character.specialAbility.currentCooldown -= 1;
            
            const specialAbilityButton = document.getElementById('special-ability');
            if (game.character.specialAbility.currentCooldown === 0 && game.character.level >= 3) {
                specialAbilityButton.disabled = false;
                specialAbilityButton.textContent = game.character.specialAbility.name;
                showToast(`${game.character.specialAbility.name} ready!`, 'info');
            } else if (game.character.level >= 3) {
                specialAbilityButton.textContent = `${game.character.specialAbility.name} (${game.character.specialAbility.currentCooldown}s)`;
            }
        }
    }, 1000);
    
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
    
    // Special ability usage
    document.getElementById('special-ability').addEventListener('click', () => {
        if (!document.getElementById('special-ability').disabled && game.character.level >= 3) {
            // Use the special ability
            game.character.specialAbility.effect();
            
            // Start cooldown
            game.character.specialAbility.currentCooldown = game.character.specialAbility.cooldown;
            document.getElementById('special-ability').disabled = true;
            document.getElementById('special-ability').textContent = 
                `${game.character.specialAbility.name} (${game.character.specialAbility.currentCooldown}s)`;
        }
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
                game.addToLog(`+ ${adventure.xp} XP, + ${adventure.gold} gold`, 'reward');
                
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
    
    // Toast notification system
    function showToast(message, type = '') {
        const toastContainer = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const toastText = document.createElement('div');
        toastText.className = 'toast-text';
        toastText.textContent = message;
        toast.appendChild(toastText);
        
        const closeButton = document.createElement('div');
        closeButton.className = 'toast-close';
        closeButton.textContent = '×';
        closeButton.addEventListener('click', () => {
            toast.remove();
        });
        toast.appendChild(closeButton);
        
        toastContainer.appendChild(toast);
        
        // Auto-remove toast after 5 seconds
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(100%)';
            setTimeout(() => {
                toast.remove();
            }, 300);
        }, 5000);
    }
    
    // Game loop for passive updates
    setInterval(() => {
        game.update();
    }, 100); // Update every 100ms
    
    // Auto-save every 2 minutes
    setInterval(() => {
        game.saveGame();
        showToast('Game auto-saved', 'info');
    }, 120000); // 2 minutes
    
    // Initial UI update
    updateLogUI();
});