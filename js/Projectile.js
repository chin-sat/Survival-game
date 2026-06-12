class Projectile {
    constructor(x, y, tx, ty) {
        this.x = x;
        this.y = y;
        
        // FIX: Scale projectile attributes dynamically with your new choice pool variables
        this.radius = 5 * (1 + (UPGRADES.size.level - 1) * 0.25);
        this.speed = 9;
        
        // Base payload damage is multiplied safely by your size scaling tiers
        this.damage = 15 * (1 + (UPGRADES.size.level - 1) * 0.4);
        
        this.pierce = 1; 
        this.hitTargets = new Set();

        let dx = tx - x;
        let dy = ty - y;
        let dist = Math.hypot(dx, dy);
        this.vx = dist > 0 ? (dx / dist) * this.speed : this.speed;
        this.vy = dist > 0 ? (dy / dist) * this.speed : 0;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
    }

    draw(ctx) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = "#ffff00";
        ctx.fill();
        ctx.closePath();
    }
}
