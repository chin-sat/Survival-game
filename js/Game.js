class Game {
    constructor() {
        this.canvas = document.getElementById("gameCanvas");
        this.ctx = this.canvas.getContext("2d");

        // Element Interfaces
        this.scoreHUD = document.getElementById("scoreHUD");
        this.levelHUD = document.getElementById("levelHUD");
        this.healthHUD = document.getElementById("healthHUD");
        this.xpBarFill = document.getElementById("xpBarFill");
        this.levelUpScreen = document.getElementById("levelUpScreen");
        this.upgradeOptionsContainer = document.getElementById("upgradeOptions");
        this.gameOverScreen = document.getElementById("gameOverScreen");
        this.finalScore = document.getElementById("finalScore");
        this.restartBtn = document.getElementById("restartBtn");

        this.setupInput();
        this.init();
        
        this.lastTime = 0;
        requestAnimationFrame((ts) => this.engineLoop(ts));
    }

    init() {
        this.enemies = [];
        this.projectiles = [];
        this.gems = [];
        this.keys = {};
        this.runTime = 0;
        this.lastSpawnTime = 0;
        this.lastShootTime = 0;
        this.bossSpawned = false;

        this.bossesSpawnedCount = 0; // Tracks total bosses spawned this run


        Object.keys(UPGRADES).forEach(k => UPGRADES[k].level = 1);

        this.player = new Player(
            this.canvas.width / 2, 
            this.canvas.height / 2,
            this.canvas.width,
            this.canvas.height,
            () => this.triggerLevelUp(),
            () => this.updateHUD()
        );

        this.gameOverScreen.style.display = "none";
        this.levelUpScreen.style.display = "none";
        this.gameState = "PLAY";
        this.updateHUD();
    }

    setupInput() {
        window.addEventListener("keydown", e => this.keys[e.key] = true);
        window.addEventListener("keyup", e => this.keys[e.key] = false);
        this.restartBtn.addEventListener("click", () => this.init());
    }

    updateHUD() {
        this.scoreHUD.innerText = `Time: ${Math.floor(this.runTime)}s`;
        this.levelHUD.innerText = `Lv. ${this.player.level}`;
        this.healthHUD.innerText = `HP: ${Math.max(0, this.player.health)}/${this.player.maxHealth}`;
        let pct = (this.player.xp / this.player.xpNeeded) * 100;
        this.xpBarFill.style.width = `${Math.min(100, pct)}%`;
    }

    spawnSystem(ts) {
        // 1. SAFE BOSS MILESTONE SYSTEM
        // Calculates how many bosses should have spawned by now (1 every 60 seconds)
        let expectedBosses = Math.floor(this.runTime / 60);
    
        if (this.bossesSpawnedCount < expectedBosses) {
            this.spawnEnemy('boss');
            this.bossesSpawnedCount++; // Increments once per milestone, completely safe from frame-skips
        }
    
        // 2. STANDARD ENEMY SWARM TIMERS
        let spawnInterval = Math.max(450, 2000 - (this.runTime * 15));
        if (ts - this.lastSpawnTime > spawnInterval) {
            let roll = Math.random();
            if (this.runTime > 40 && roll < 0.25) {
                this.spawnEnemy('brute');
            } else {
                this.spawnEnemy('scout');
            }
            this.lastSpawnTime = ts;
        }
    }
    

    spawnEnemy(type) {
        const angle = Math.random() * Math.PI * 2;
        const dist = 500;
        const x = this.player.x + Math.cos(angle) * dist;
        const y = this.player.y + Math.sin(angle) * dist;
        this.enemies.push(new Enemy(x, y, type));
    }

    weaponSystem(ts) {
        let baseCooldown = 600;
        let cooldown = baseCooldown * Math.pow(0.8, UPGRADES.fireRate.level - 1);

        if (ts - this.lastShootTime > cooldown && this.enemies.length > 0) {
            let nearestEnemy = null;
            let minDist = Infinity;

            for (let e of this.enemies) {
                let d = Math.hypot(e.x - this.player.x, e.y - this.player.y);
                if (d < minDist) {
                    minDist = d;
                    nearestEnemy = e;
                }
            }

            if (nearestEnemy) {
                this.projectiles.push(new Projectile(this.player.x, this.player.y, nearestEnemy.x, nearestEnemy.y));
                this.lastShootTime = ts;
            }
        }
    }

    processPhysics() {
        this.player.update(this.keys);

        // Projectiles Loop
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            let p = this.projectiles[i];
            p.update();

            if (p.x < 0 || p.x > this.canvas.width || p.y < 0 || p.y > this.canvas.height) {
                this.projectiles.splice(i, 1);
                continue;
            }

            for (let e of this.enemies) {
                if (p.hitTargets.has(e)) continue;
                if (Math.hypot(p.x - e.x, p.y - e.y) < p.radius + e.radius) {
                    e.health -= p.damage;
                    p.hitTargets.add(e);
                    p.pierce--;

                    if (e.health <= 0) e.dead = true;
                    if (p.pierce <= 0) break;
                }
            }

            if (p.pierce <= 0) this.projectiles.splice(i, 1);
        }

        // Enemies Loop
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            let e = this.enemies[i];
            e.update(this.player.x, this.player.y);

            if (Math.hypot(this.player.x - e.x, this.player.y - e.y) < this.player.radius + e.radius) {
                this.player.health -= e.damage;
                this.updateHUD();
                this.enemies.splice(i, 1);
                if (this.player.health <= 0) this.endGame();
                continue;
            }

            if (e.dead) {
                this.gems.push(new XpGem(e.x, e.y, e.xpValue));
                this.enemies.splice(i, 1);
            }
        }

        // Gems Loop
        for (let i = this.gems.length - 1; i >= 0; i--) {
            let g = this.gems[i];
            if (Math.hypot(this.player.x - g.x, this.player.y - g.y) < this.player.radius + g.radius + 10) {
                this.player.addXp(g.value);
                this.gems.splice(i, 1);
            }
        }
    }

    drawSystem() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.gems.forEach(g => g.draw(this.ctx));
        this.projectiles.forEach(p => p.draw(this.ctx));
        this.enemies.forEach(e => e.draw(this.ctx));
        if (this.player.health > 0) this.player.draw(this.ctx);
    }

    triggerLevelUp() {
        this.gameState = "LEVEL_UP";
        this.upgradeOptionsContainer.innerHTML = "";

        let keys = Object.keys(UPGRADES);
        let shuffled = keys.sort(() => 0.5 - Math.random());
        let choices = shuffled.slice(0, 3);

        choices.forEach(key => {
            let up = UPGRADES[key];
            let card = document.createElement("div");
            card.className = "upgrade-card";
            card.innerHTML = `
                <div class="upgrade-title">${up.title}</div>
                <div class="upgrade-desc">${up.desc}<br><br><strong>Current: Lv.${up.level}</strong></div>
            `;
            card.onclick = () => this.selectUpgrade(key);
            this.upgradeOptionsContainer.appendChild(card);
        });

        this.levelUpScreen.style.display = "flex";
    }

    selectUpgrade(key) {
        UPGRADES[key].level++;
        this.levelUpScreen.style.display = "none";
        this.gameState = "PLAY";
    }

    endGame() {
        this.gameState = "GAMEOVER";
        this.finalScore.innerText = `You survived ${Math.floor(this.runTime)} seconds at Level ${this.player.level}!`;
        this.gameOverScreen.style.display = "flex";
    }


    engineLoop(timestamp) {
        if (!this.lastTime) this.lastTime = timestamp;
        let dt = timestamp - this.lastTime;
        this.lastTime = timestamp;
    
        // FIX: Only advance time and process engine systems if the player is actively playing
        if (this.gameState === "PLAY") {
            this.runTime += dt / 1000;
            this.updateHUD();
    
            this.spawnSystem(timestamp);
            this.weaponSystem(timestamp);
            this.processPhysics();
            this.drawSystem();
        } else {
            // FIX: If paused/leveling up, continuously shift the lastSpawn and weapon timers 
            // forward by the elapsed downtime so they don't burst-fire when you resume!
            this.lastSpawnTime += dt;
            this.lastShootTime += dt;
        }
    
        requestAnimationFrame((ts) => this.engineLoop(ts));
    }
    
}

// Global initialization
window.addEventListener("DOMContentLoaded", () => {
    new Game();
});
