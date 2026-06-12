class AudioFX {
    constructor() {
        this.ctx = null;
        // Tracking registers to prevent frequency spamming
        this.lastPlayTimes = { shoot: 0, hit: 0, hurt: 0 };
    }
    init() {
        if (!this.ctx) this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
    play(type) {
        if (window.gameInstance && window.gameInstance.isMuted) return;
        this.init(); if (this.ctx.state === 'suspended') this.ctx.resume();
        
        let now = this.ctx.currentTime;
        
        // GATING RULES: Limit hits to every 40ms, shoots to every 90ms
        if (type === 'hit' && now - this.lastPlayTimes.hit < 0.04) return;
        if (type === 'shoot' && now - this.lastPlayTimes.shoot < 0.09) return;
        
        // Log the timestamp to close the gate for consecutive requests
        this.lastPlayTimes[type] = now;

        let osc = this.ctx.createOscillator(), gain = this.ctx.createGain();
        osc.connect(gain); gain.connect(this.ctx.destination);
        let t = this.ctx.currentTime;
        
        if (type === 'shoot') {
            osc.type = 'triangle'; osc.frequency.setValueAtTime(350, t); osc.frequency.exponentialRampToValueAtTime(80, t + 0.1);
            gain.gain.setValueAtTime(0.08, t); gain.gain.exponentialRampToValueAtTime(0.01, t + 0.1); osc.start(t); osc.stop(t + 0.1);
        } else if (type === 'hit') {
            osc.type = 'sawtooth'; osc.frequency.setValueAtTime(100, t); osc.frequency.linearRampToValueAtTime(30, t + 0.06);
            gain.gain.setValueAtTime(0.05, t); gain.gain.exponentialRampToValueAtTime(0.01, t + 0.06); osc.start(t); osc.stop(t + 0.06);
        } else if (type === 'lvl') {
            osc.type = 'sine'; osc.frequency.setValueAtTime(261.6, t); osc.frequency.setValueAtTime(329.6, t + 0.08); osc.frequency.setValueAtTime(392.0, t + 0.16);
            gain.gain.setValueAtTime(0.12, t); gain.gain.exponentialRampToValueAtTime(0.01, t + 0.3); osc.start(t); osc.stop(t + 0.3);
        } else if (type === 'hurt') {
            osc.type = 'square'; osc.frequency.setValueAtTime(80, t); osc.frequency.linearRampToValueAtTime(20, t + 0.12);
            gain.gain.setValueAtTime(0.15, t); gain.gain.exponentialRampToValueAtTime(0.01, t + 0.12); osc.start(t); osc.stop(t + 0.12);
        }
    }
}
const sfx = new AudioFX();
