class DamageNumber {
    constructor(x, y, text, color = "#fff") {
        this.x = x + (Math.random() * 20 - 10);
        this.y = y - 10;
        this.text = text;
        this.color = color;
        this.alpha = 1;
        this.vy = -1.5; // Floats upwards
    }
    update() {
        this.y += this.vy;
        this.alpha -= 0.025; // Fades out smoothly
    }
    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.font = "bold 16px sans-serif";
        ctx.fillStyle = this.color;
        ctx.textAlign = "center";
        ctx.fillText(this.text, this.x, this.y);
        ctx.restore();
    }
}

class DeathParticle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.radius = Math.random() * 3 + 1;
        let angle = Math.random() * Math.PI * 2;
        let speed = Math.random() * 3 + 1;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        this.alpha = 1;
    }
    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.alpha -= 0.04;
    }
    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.closePath();
        ctx.restore();
    }
}
