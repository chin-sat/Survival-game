class XpGem {
    constructor(x, y, value) {
        this.x = x;
        this.y = y;
        this.value = value;
        this.radius = value >= 5 ? 6 : 4;
        this.color = value >= 50 ? "#9b59b6" : (value >= 5 ? "#ffa500" : "#2ed573");
    }

    draw(ctx) {
        ctx.beginPath();
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(Math.PI / 4);
        ctx.fillStyle = this.color;
        ctx.fillRect(-this.radius, -this.radius, this.radius * 2, this.radius * 2);
        ctx.restore();
        ctx.closePath();
    }
}
