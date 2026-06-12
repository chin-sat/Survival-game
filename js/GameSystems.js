class Game extends GameBase {
    spawn(ts) {
        if (this.bossCount < Math.floor(this.runTime / 60)) { this.addEnemy('boss'); this.bossCount++; }
        if (ts - this.lastSpawn > Math.max(450, 2000 - (this.runTime * 20))) { this.addEnemy(this.runTime > 15 && Math.random() < 0.3 ? 'brute' : 'scout'); this.lastSpawn = ts; }
    }
    // Inside js/GameSystems.js:
    addEnemy(t) { 
        let a = Math.random() * Math.PI * 2; 
        let spawnDistance = Math.max(this.canvas.width, this.canvas.height);
        let x = this.player.x + Math.cos(a) * spawnDistance;
        let y = this.player.y + Math.sin(a) * spawnDistance;
        
        let newEnemy = new Enemy(x, y, t);
        
        // Scale enemy movement speed by 1% for every 10 seconds survived
        let speedBonus = 1 + (this.runTime * 0.01);
        newEnemy.speed *= speedBonus;
        
        this.enemies.push(newEnemy); 
    }
    weapons(ts) {
        if (ts - this.lastShoot > 550 * Math.pow(0.8, UPGRADES.fireRate.level - 1) && this.enemies.length > 0) {
            let tgts = [...this.enemies].sort((a,b) => Math.hypot(a.x-this.player.x, a.y-this.player.y) - Math.hypot(b.x-this.player.x, b.y-this.player.y));
            for (let i = 0; i < UPGRADES.multishot.level; i++) { let t = tgts[i % tgts.length]; if (t) { this.projectiles.push(new Projectile(this.player.x, this.player.y, t.x + (i*25 - (UPGRADES.multishot.level-1)*12.5), t.y)); sfx.play('shoot'); } }
            this.lastShoot = ts;
        }
        if (UPGRADES.lightning.level > 0 && ts - this.lastLightning > 2500) { this.chainLtg(); this.lastLightning = ts; }
        if (UPGRADES.regen.level > 0 && ts - this.lastRegen > 1000) {
            this.player.health = Math.min(this.player.maxHealth, this.player.health + UPGRADES.regen.level); 
            this.damageNumbers.push(new DamageNumber(this.player.x, this.player.y, `+${UPGRADES.regen.level}`, "#2ed573")); this.hud(); this.lastRegen = ts;
        }
    }
    chainLtg() {
        if (!this.enemies.length) return;
        let src = {x:this.player.x, y:this.player.y}, pool = [...this.enemies], dmg = 25 * UPGRADES.lightning.level, path = [{x:this.player.x, y:this.player.y}];
        for (let j = 0; j < 2 + UPGRADES.lightning.level; j++) {
            let close = null, min = 200, idx = -1; pool.forEach((e, i) => { let d = Math.hypot(e.x-src.x, e.y-src.y); if (d < min) { min = d; close = e; idx = i; } });
            if (!close) break; close.health -= dmg; if (close.health <= 0) close.dead = true; sfx.play('hit');
            this.damageNumbers.push(new DamageNumber(close.x, close.y, `⚡${dmg}`, "#ffff00")); path.push({x:close.x, y:close.y}); src = close; pool.splice(idx, 1);
        }
        if (path.length > 1) this.beams.push({path, a: 1});
    }
    physics() {
        this.player.update(this.keys, this); if (this.shake > 0) this.shake *= 0.9;
        // Dynamically compute camera tracking matrices based on center constraints
        this.camX = this.player.x - this.canvas.width / 2; this.camY = this.player.y - this.canvas.height / 2;
        [this.damageNumbers, this.particles].forEach(arr => arr.forEach(o => o.update()));
        this.damageNumbers = this.damageNumbers.filter(n => n.alpha > 0); this.particles = this.particles.filter(p => p.alpha > 0);
        this.beams.forEach(b => b.a -= 0.08); this.beams = this.beams.filter(b => b.a > 0);
        for (let i = this.projectiles.length-1; i >= 0; i--) {
            let p = this.projectiles[i]; p.update(); if (Math.hypot(p.x-this.player.x, p.y-this.player.y) > 2000) { this.projectiles.splice(i,1); continue; }
            for (let e of this.enemies) {
                if (!p.hitTargets.has(e) && Math.hypot(p.x-e.x, p.y-e.y) < p.radius+e.radius) {
                    e.health -= p.damage; p.hitTargets.add(e); p.pierce--; this.damageNumbers.push(new DamageNumber(e.x, e.y, Math.floor(p.damage))); sfx.play('hit');
                    if (e.health <= 0) e.dead = true; if (p.pierce <= 0) break;
                }
            }
            if (p.pierce <= 0) this.projectiles.splice(i,1);
        }
        for (let i = this.enemies.length-1; i >= 0; i--) {
            let e = this.enemies[i]; e.update(this.player.x, this.player.y);
            if (Math.hypot(this.player.x-e.x, this.player.y-e.y) < this.player.radius+e.radius) {
                this.player.health -= e.damage; this.shake = 12; this.hud(); this.enemies.splice(i,1); sfx.play('hurt'); if (this.player.health <= 0) { this.end(); return; } continue;
            }
            if (e.dead) { this.gems.push(new XpGem(e.x, e.y, e.xpValue)); for (let k=0; k<8; k++) this.particles.push(new DeathParticle(e.x, e.y, e.color)); this.enemies.splice(i,1); }
        }
        this.gems.forEach(g => g.update(this.player.x, this.player.y));
        for (let i = this.gems.length-1; i >= 0; i--) { if (Math.hypot(this.player.x-this.gems[i].x, this.player.y-this.gems[i].y) < this.player.radius+this.gems[i].radius+5) { this.player.addXp(this.gems[i].value); this.gems.splice(i,1); } }
    }
    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height); this.ctx.save();
        if (this.shake > 0.5) this.ctx.translate((Math.random()*2-1)*this.shake, (Math.random()*2-1)*this.shake);
        
        // PROCEDURAL BACKGROUND SCROLLING ARENA GRID SYSTEM
        this.ctx.save(); this.ctx.strokeStyle = "#252525"; this.ctx.lineWidth = 1;
        let gridSize = 60, startGridX = Math.floor(this.camX / gridSize) * gridSize, startGridY = Math.floor(this.camY / gridSize) * gridSize;
        for (let x = startGridX; x < startGridX + this.canvas.width + gridSize; x += gridSize) { this.ctx.beginPath(); this.ctx.moveTo(x - this.camX, 0); this.ctx.lineTo(x - this.camX, this.canvas.height); this.ctx.stroke(); }
        for (let y = startGridY; y < startGridY + this.canvas.height + gridSize; y += gridSize) { this.ctx.beginPath(); this.ctx.moveTo(0, y - this.camY); this.ctx.lineTo(this.canvas.width, y - this.camY); this.ctx.stroke(); }
        this.ctx.restore();

        // Project remaining world objects relative to camera view offsets
        this.ctx.translate(-this.camX, -this.camY);
        this.gems.forEach(g => g.draw(this.ctx)); this.projectiles.forEach(p => p.draw(this.ctx)); this.enemies.forEach(e => e.draw(this.ctx)); this.particles.forEach(p => p.draw(this.ctx));
        this.beams.forEach(b => { this.ctx.save(); this.ctx.globalAlpha = b.a; this.ctx.strokeStyle = this.ctx.shadowColor = "#00ffff"; this.ctx.lineWidth = 3; this.ctx.shadowBlur = 10; this.ctx.beginPath(); this.ctx.moveTo(b.path[0].x, b.path[0].y); b.path.forEach(pt => this.ctx.lineTo(pt.x, pt.y)); this.ctx.stroke(); this.ctx.restore(); });
        if (this.player.health > 0) this.player.draw(this.ctx); this.damageNumbers.forEach(n => n.draw(this.ctx)); this.ctx.restore();
    }
}
window.addEventListener("DOMContentLoaded", () => new Game());
