class GameBase {
    constructor() {
        window.gameInstance = this;
        this.canvas = document.getElementById("gameCanvas"); this.ctx = this.canvas.getContext("2d");
        this.scoreHUD = document.getElementById("scoreHUD"); this.levelHUD = document.getElementById("levelHUD");
        this.healthHUD = document.getElementById("healthHUD"); this.xpBarFill = document.getElementById("xpBarFill");
        this.levelUpScreen = document.getElementById("levelUpScreen"); this.upgradeOptionsContainer = document.getElementById("upgradeOptions");
        this.gameOverScreen = document.getElementById("gameOverScreen"); this.finalScore = document.getElementById("finalScore");
        this.restartBtn = document.getElementById("restartBtn");
        window.addEventListener("resize", () => this.resizeCanvas()); this.resizeCanvas(); this.setupInput(); this.init(); this.lastTime = 0;
        requestAnimationFrame(ts => this.engineLoop(ts));
    }
    resizeCanvas() {
        this.canvas.width = window.innerWidth; this.canvas.height = window.innerHeight;
        if (this.player) { this.player.canvasWidth = this.canvas.width; this.player.canvasHeight = this.canvas.height; }
    }
    init() {
        this.enemies = []; this.projectiles = []; this.gems = []; this.keys = {}; this.damageNumbers = []; this.particles = []; this.beams = [];
        this.runTime = 0; this.lastSpawn = 0; this.lastShoot = 0; this.lastLightning = 0; this.lastRegen = 0; this.bossCount = 0; this.shake = 0;
        // Camera offset track coordinates for scrolling grid drawing
        this.camX = 0; this.camY = 0;
        Object.keys(UPGRADES).forEach(k => UPGRADES[k].level = (k === 'lightning' || k === 'regen') ? 0 : 1);
        this.player = new Player(this.canvas.width/2, this.canvas.height/2, this.canvas.width, this.canvas.height, () => this.lvlUp(), () => this.hud());
        this.gameOverScreen.style.display = this.levelUpScreen.style.display = "none";  // FIX: Start in the menu state instead of auto-playing!
        this.gameState = "START_MENU"; 
        this.hud();
    }
    setupInput() {
        window.addEventListener("keydown", e => { 
            this.keys[e.key] = true; sfx.init(); 
            // Start game if any key is pressed on the start menu
            if (this.gameState === "START_MENU") { this.startGameFromMenu(); }
        }); 
        window.addEventListener("keyup", e => this.keys[e.key] = false);
        this.restartBtn.addEventListener("click", () => this.init());
        
        // Fix: Make clicking the tutorial screen start the game as well
        const tut = document.getElementById("tutorialOverlay");
        if (tut) {
            tut.style.pointerEvents = "auto"; // Allow clicks to register
            tut.addEventListener("click", () => { sfx.init(); this.startGameFromMenu(); });
        }

        document.getElementById("pauseBtn").addEventListener("click", () => this.togglePause(true));
        document.getElementById("resumeBtn").addEventListener("click", () => this.togglePause(false));
        window.addEventListener("keydown", e => { if (e.key === "Escape" && this.gameState === "PLAY") this.togglePause(true); });
        
        this.isMuted = localStorage.getItem("arena_muted") === "true"; document.getElementById("muteBtn").innerText = this.isMuted ? "🔇 Muted" : "🔊 Mute";
        document.getElementById("muteBtn").addEventListener("click", () => { this.isMuted = !this.isMuted; localStorage.setItem("arena_muted", this.isMuted); document.getElementById("muteBtn").innerText = this.isMuted ? "🔇 Muted" : "🔊 Mute"; });
        
        const zone = document.getElementById("touchJoystickZone"); const knob = document.getElementById("joystickKnob"); this.touchInput = { x: 0, y: 0 };
        if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
            zone.style.display = "block"; let startX = 0, startY = 0;
            zone.addEventListener("touchstart", e => { 
                sfx.init(); startX = e.touches.clientX; startY = e.touches.clientY; 
                if (this.gameState === "START_MENU") { this.startGameFromMenu(); }
            });
            zone.addEventListener("touchmove", e => {
                let dx = e.touches.clientX - startX, dy = e.touches.clientY - startY, dist = Math.hypot(dx, dy), max = 35;
                if (dist > max) { dx = (dx / dist) * max; dy = (dy / dist) * max; }
                knob.style.transform = `translate(${dx}px, ${dy}px)`; this.touchInput.x = dx / max; this.touchInput.y = dy / max;
            });
            zone.addEventListener("touchend", () => { knob.style.transform = "translate(0,0)"; this.touchInput.x = this.touchInput.y = 0; });
        }
    }

    startGameFromMenu() {
        if (this.gameState !== "START_MENU") return;
        this.gameState = "PLAY";
        const tut = document.getElementById("tutorialOverlay");
        if (tut) { 
            tut.style.opacity = "0"; 
            setTimeout(() => tut.remove(), 500); 
        }
    }


    togglePause(p) {
        if (p && this.gameState === "PLAY") { this.gameState = "PAUSED"; document.getElementById("pauseScreen").style.display = "flex"; }
        else if (!p && this.gameState === "PAUSED") { this.gameState = "PLAY"; document.getElementById("pauseScreen").style.display = "none"; }
    }
    hud() {
        this.scoreHUD.innerText = `Time: ${Math.floor(this.runTime)}s`; this.levelHUD.innerText = `Lv. ${this.player.level}`;
        this.healthHUD.innerText = `HP: ${Math.max(0, Math.floor(this.player.health))}/${this.player.maxHealth}`;
        this.xpBarFill.style.width = `${Math.min(100, (this.player.xp / this.player.xpNeeded) * 100)}%`;
    }
    lvlUp() {
        sfx.play('lvl'); this.gameState = "LEVEL_UP"; this.upgradeOptionsContainer.innerHTML = "";
        Object.keys(UPGRADES).sort(() => 0.5 - Math.random()).slice(0, 3).forEach(k => {
            let u = UPGRADES[k], c = document.createElement("div"); c.className = "upgrade-card";
            // FIX: Removed button selectors inside the loop markup template to prevent vertical stretching
            c.innerHTML = `<div class="upgrade-inner"><div class="upgrade-title">${u.title}</div><div class="upgrade-desc">${u.desc}<br><br><strong>Rank: ${u.level}</strong></div></div>`;
            c.onclick = () => { UPGRADES[k].level++; this.levelUpScreen.style.display = "none"; this.gameState = "PLAY"; }; this.upgradeOptionsContainer.appendChild(c);
        });
        this.levelUpScreen.style.display = "flex";
           // FIX: Forces the browser to calculate the horizontal layout immediately without waiting for a resize!
           this.hud(); 
    }

    end() {
        this.gameState = "GAMEOVER"; let finalSecs = Math.floor(this.runTime), best = localStorage.getItem("arena_highscore") || 0;
        if (finalSecs > best) { localStorage.setItem("arena_highscore", finalSecs); best = finalSecs; }
        this.finalScore.innerHTML = `Survived ${finalSecs}s at Lv. ${this.player.level}<br><span style="color:#ffa500;font-size:16px;">🏆 Personal Best: ${best}s</span>`; this.gameOverScreen.style.display = "flex";
    }
    engineLoop(ts) {
        if (!this.lastTime) this.lastTime = ts; let dt = ts - this.lastTime; this.lastTime = ts;
        if (this.gameState === "PLAY") { this.runTime += dt/1000; this.hud(); this.spawn(ts); this.weapons(ts); this.physics(); this.draw(); }
        else { this.lastSpawn += dt; this.lastShoot += dt; this.lastLightning += dt; this.lastRegen += dt; }
        requestAnimationFrame(t => this.engineLoop(t));
    }
}
