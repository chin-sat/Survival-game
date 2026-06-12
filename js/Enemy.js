class Enemy {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type; 
        this.dead = false;

    // Inside js/Enemy.js constructor / reset block:
    if (type === 'brute') {
        this.radius = 24; this.speed = 1.2; this.health = 45; this.damage = 25; this.color = "#ffa500"; this.xpValue = 5;
    } else if (type === 'boss') {
        this.radius = 45; this.speed = 0.8; this.health = 400; this.damage = 50; this.color = "#9b59b6"; this.xpValue = 50;
    } else { 
        // BUFFED SCOUT STATS FOR AN EXCITING START
        this.radius = 11; 
        this.speed = 3.2;    /* Increased speed from 2.4 -> 3.2 */
        this.health = 35;   /* Increased health from 15 -> 35 */
        this.damage = 12;   /* Increased damage from 10 -> 12 */
        this.color = "#ff4757"; 
        this.xpValue = 1;
    }

    }

    update(playerX, playerY) {
        let dx = playerX - this.x;
        let dy = playerY - this.y;
        let dist = Math.hypot(dx, dy);
        if (dist > 0) {
            this.x += (dx / dist) * this.speed;
            this.y += (dy / dist) * this.speed;
        }
    }

    draw(ctx) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.strokeStyle = "#000";
        ctx.lineWidth = this.type === 'boss' ? 4 : 1.5;
        ctx.stroke();
        ctx.closePath();
    }
}
}
