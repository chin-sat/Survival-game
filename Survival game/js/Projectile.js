class Projectile {
    constructor(x, y, tx, ty) {
        this.x = x;
        this.y = y;
        this.radius = 5;
        this.speed = 9;
        this.damage = 15 * (1 + (UPGRADES.damage.level - 1) * 0.4);
        this.pierce = UPGRADES.pierce.level;
        this.hitTargets = new Set();

        let dx = tx - x;
        let dy = ty - y;
        let dist = Math.hypot(dx, dy);
        this.vx = (dx / dist) * this.speed;
        this.vy = (dy / dist) * this.speed;
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
