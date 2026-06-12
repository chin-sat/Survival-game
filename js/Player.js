class Player {
    constructor(x, y, canvasWidth, canvasHeight, onLevelUp, updateHUD) {
        this.x = x;
        this.y = y;
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;
        this.onLevelUp = onLevelUp;
        this.updateHUD = updateHUD;
        
        this.radius = 16;
        this.baseSpeed = 3.5;
        this.maxHealth = 100;
        this.health = this.maxHealth;
        this.level = 1;
        this.xp = 0;
        this.xpNeeded = 30;
    }

    get speed() { return this.baseSpeed * (1 + (UPGRADES.speed.level - 1) * 0.15); }

    update(keys, gameInstance) {
        let moveX = 0, moveY = 0;
        if (keys['w'] || keys['W'] || keys['ArrowUp']) moveY -= 1;
        if (keys['s'] || keys['S'] || keys['ArrowDown']) moveY += 1;
        if (keys['a'] || keys['A'] || keys['ArrowLeft']) moveX -= 1;
        if (keys['d'] || keys['D'] || keys['ArrowRight']) moveX += 1;

        if (moveX === 0 && moveY === 0 && gameInstance && gameInstance.touchInput) {
            moveX = gameInstance.touchInput.x; moveY = gameInstance.touchInput.y;
        }
        if (moveX !== 0 && moveY !== 0) { moveX *= 0.7071; moveY *= 0.7071; }

        // Permit player vectors to safely translate infinitely through world space coordinates
        this.x += moveX * this.speed; this.y += moveY * this.speed;
        
        if (moveX !== 0 || moveY !== 0) {
            const tut = document.getElementById("tutorialOverlay");
            if (tut) { tut.style.opacity = "0"; setTimeout(() => tut.remove(), 500); }
        }
    }


    draw(ctx) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = "#1e90ff";
        ctx.fill();
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.closePath();
    }

    addXp(amount) {
        this.xp += amount;
        if (this.xp >= this.xpNeeded) {
            this.xp -= this.xpNeeded;
            this.level++;
            this.xpNeeded = Math.floor(this.xpNeeded * 1.4) + 5;
            this.onLevelUp();
        }
        this.updateHUD();
    }
}
