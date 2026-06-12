class XpGem {
    constructor(x, y, value) {
        this.x = x;
        this.y = y;
        this.value = value;
        this.radius = value >= 5 ? 6 : 4;
        this.color = value >= 50 ? "#9b59b6" : (value >= 5 ? "#ffa500" : "#2ed573");
        
        // Gem pop physics engine
        let popAngle = Math.random() * Math.PI * 2;
        let popForce = Math.random() * 4 + 2;
        this.vx = Math.cos(popAngle) * popForce;
        this.vy = Math.sin(popAngle) * popForce;
        this.friction = 0.85;
    }

    update(playerX, playerY) {
        // Apply initial pop physics
        this.x += this.vx;
        this.y += this.vy;
        this.vx *= this.friction;
        this.vy *= this.friction;

        // Magnetized tracking behavior
        let dx = playerX - this.x;
        let dy = playerY - this.y;
        let dist = Math.hypot(dx, dy);
        if (dist < 120) { // Magnet trigger zone
            let pullSpeed = 5 * (1 - dist / 120) + 2;
            this.x += (dx / dist) * pullSpeed;
            this.y += (dy / dist) * pullSpeed;
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(Math.PI / 4);
        ctx.fillStyle = this.color;
        ctx.fillRect(-this.radius, -this.radius, this.radius * 2, this.radius * 2);
        ctx.restore();
    }
}
