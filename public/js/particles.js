/**
 * Ultra-Low-CPU 2.5D Sacred Temple Canvas Particle & Anti-Static Motion Engine
 * Tối ưu hóa cho OBS / TikTok Live Studio 24/7:
 * - Hiệu ứng chuyển động liên tục (Motion Overlay): Hạt bụi vàng lấp lánh, Cánh hoa sen rơi,
 *   Ngọn lửa đèn lồng & nến bàn thờ lung linh, Khói hương cuộn bay, Tia sáng Phật quang.
 * - Lớp nhiễu hạt điện ảnh động (Dynamic Film Grain / Sensor Noise) & Chỉnh màu ánh sáng thở nhẹ
 *   giúp 100% macroblock video luôn có chuyển động tự nhiên, chống cảnh báo màn hình tĩnh của TikTok.
 */
class TempleParticleEngine {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: true, desynchronized: true });
    this.width = 1080;
    this.height = 1920;
    this.canvas.width = this.width;
    this.canvas.height = this.height;

    this.smokeParticles = [];
    this.lotusPetals = [];
    this.goldSparks = [];
    this.soundWaves = [];
    this.floatingTexts = [];
    this.burstParticles = [];
    this.godRays = [];
    this.candleFlames = [];
    this.noiseFrames = [];
    this.noiseTick = 0;

    this.incenseTips = [];
    this.smokeDensity = 1.0;
    this.time = 0;
    this.lastFrameTime = 0;
    this.frameInterval = 1000 / 30; // 30 FPS ổn định

    this.buildOffscreenSprites();
    this.buildNoiseFrames();
    this.initAmbientParticles();
    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
  }

  buildOffscreenSprites() {
    // 1. Pre-render Smoke Puff Sprite (64x64)
    this.smokeSprite = document.createElement('canvas');
    this.smokeSprite.width = 64;
    this.smokeSprite.height = 64;
    const sctx = this.smokeSprite.getContext('2d');
    const sgrad = sctx.createRadialGradient(32, 32, 2, 32, 32, 30);
    sgrad.addColorStop(0, 'rgba(255, 246, 218, 0.88)');
    sgrad.addColorStop(0.5, 'rgba(238, 222, 185, 0.44)');
    sgrad.addColorStop(1, 'rgba(220, 200, 160, 0)');
    sctx.fillStyle = sgrad;
    sctx.beginPath();
    sctx.arc(32, 32, 30, 0, Math.PI * 2);
    sctx.fill();

    // 2. Pre-render Gold Spark Sprite (20x20)
    this.sparkSprite = document.createElement('canvas');
    this.sparkSprite.width = 20;
    this.sparkSprite.height = 20;
    const gctx = this.sparkSprite.getContext('2d');
    const ggrad = gctx.createRadialGradient(10, 10, 1, 10, 10, 9);
    ggrad.addColorStop(0, 'rgba(255, 252, 220, 1)');
    ggrad.addColorStop(0.45, 'rgba(255, 215, 90, 0.75)');
    ggrad.addColorStop(1, 'rgba(255, 180, 40, 0)');
    gctx.fillStyle = ggrad;
    gctx.beginPath();
    gctx.arc(10, 10, 9, 0, Math.PI * 2);
    gctx.fill();

    // 3. Pre-render Candle / Lantern Flame Glow Sprite (96x96)
    this.flameGlowSprite = document.createElement('canvas');
    this.flameGlowSprite.width = 96;
    this.flameGlowSprite.height = 96;
    const fctx = this.flameGlowSprite.getContext('2d');
    const fgrad = fctx.createRadialGradient(48, 48, 2, 48, 48, 46);
    fgrad.addColorStop(0, 'rgba(255, 248, 205, 0.95)');
    fgrad.addColorStop(0.3, 'rgba(255, 185, 55, 0.55)');
    fgrad.addColorStop(0.65, 'rgba(255, 110, 20, 0.22)');
    fgrad.addColorStop(1, 'rgba(255, 80, 0, 0)');
    fctx.fillStyle = fgrad;
    fctx.beginPath();
    fctx.arc(48, 48, 46, 0, Math.PI * 2);
    fctx.fill();

    // 4. Pre-render Pink, Gold & Crimson Rose Petal Sprites (28x28)
    this.pinkPetalSprite = this.createPetalSprite('rgba(248, 165, 194, 0.86)');
    this.goldPetalSprite = this.createPetalSprite('rgba(255, 218, 110, 0.88)');
    this.rosePetalSprite = this.createPetalSprite('rgba(255, 58, 98, 0.92)');
  }

  buildNoiseFrames() {
    // Tạo 4 frame hạt nhiễu điện ảnh (Film Grain 270x480) để phủ nhẹ lên toàn khung hình mỗi frame
    for (let f = 0; f < 4; f++) {
      const nc = document.createElement('canvas');
      nc.width = 270;
      nc.height = 480;
      const nctx = nc.getContext('2d');
      const imgData = nctx.createImageData(nc.width, nc.height);
      const data = imgData.data;
      for (let i = 0; i < data.length; i += 4) {
        const v = (Math.random() * 255) | 0;
        data[i] = v;
        data[i + 1] = (v * 0.92) | 0;
        data[i + 2] = (v * 0.78) | 0;
        data[i + 3] = 14 + ((Math.random() * 12) | 0); // Độ nhiễu hạt tinh tế ~4-8%
      }
      nctx.putImageData(imgData, 0, 0);
      this.noiseFrames.push(nc);
    }
  }

  createPetalSprite(fillStyle) {
    const c = document.createElement('canvas');
    c.width = 28;
    c.height = 28;
    const pctx = c.getContext('2d');
    const sz = 11;
    pctx.translate(14, 14);
    pctx.beginPath();
    pctx.moveTo(0, -sz);
    pctx.bezierCurveTo(sz * 0.85, -sz * 0.4, sz * 0.75, sz * 0.75, 0, sz);
    pctx.bezierCurveTo(-sz * 0.75, sz * 0.75, -sz * 0.85, -sz * 0.4, 0, -sz);
    pctx.fillStyle = fillStyle;
    pctx.fill();
    return c;
  }

  initAmbientParticles() {
    // 52 hạt bụi vàng lấp lánh khắp 1080x1920
    for (let i = 0; i < 52; i++) {
      this.goldSparks.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        size: 8 + Math.random() * 11,
        vy: -(0.75 + Math.random() * 1.45),
        vx: (Math.random() - 0.5) * 0.75,
        phase: Math.random() * Math.PI * 2,
        alpha: 0.42 + Math.random() * 0.55
      });
    }

    // 18 cánh hoa sen rơi liên tục
    for (let i = 0; i < 18; i++) {
      this.lotusPetals.push(this.createLotusPetal(true));
    }

    // 6 tia sáng Phật quang chuyển động nhẹ dọc Chánh Điện
    for (let i = 0; i < 6; i++) {
      this.godRays.push({
        x: 160 + i * 150,
        width: 75 + Math.random() * 55,
        phase: i * 1.1,
        speed: 0.5 + Math.random() * 0.4,
        alpha: 0.055 + Math.random() * 0.04
      });
    }

    // 8 vị trí ngọn lửa đèn lồng & nến bàn thờ lung linh liên tục
    this.candleFlames = [
      { x: 112, y: 250, baseR: 62, phase: 0.2 },
      { x: 968, y: 250, baseR: 62, phase: 1.5 },
      { x: 105, y: 615, baseR: 54, phase: 2.7 },
      { x: 975, y: 615, baseR: 54, phase: 3.9 },
      { x: 358, y: 862, baseR: 48, phase: 0.8 },
      { x: 722, y: 862, baseR: 48, phase: 2.1 },
      { x: 245, y: 878, baseR: 42, phase: 4.4 },
      { x: 835, y: 878, baseR: 42, phase: 5.2 }
    ];
  }

  createLotusPetal(randomY = false) {
    return {
      x: Math.random() * this.width,
      y: randomY ? Math.random() * this.height : -30 - Math.random() * 100,
      scale: 0.72 + Math.random() * 0.6,
      vy: 1.35 + Math.random() * 1.65,
      vx: (Math.random() - 0.5) * 1.05,
      rot: Math.random() * Math.PI * 2,
      vrot: (Math.random() - 0.5) * 0.042,
      swayPhase: Math.random() * Math.PI * 2,
      gold: Math.random() > 0.5
    };
  }

  setIncenseTips(tips) {
    this.incenseTips = Array.isArray(tips) ? tips : [];
  }

  spawnSmokeFromTips() {
    if (!this.incenseTips.length || this.smokeParticles.length >= 34) return;
    if (Math.random() > 0.68 * this.smokeDensity) return;

    const tip = this.incenseTips[Math.floor(Math.random() * this.incenseTips.length)];
    this.smokeParticles.push({
      x: tip.x + (Math.random() - 0.5) * 8,
      y: tip.y,
      vx: (Math.random() - 0.5) * 0.35,
      vy: -(2.5 + Math.random() * 1.2),
      radius: 10 + Math.random() * 6,
      maxRadius: 34 + Math.random() * 18,
      alpha: 0.28 + Math.random() * 0.12,
      age: 0,
      maxAge: 72 + Math.random() * 28,
      seed: Math.random() * 50
    });
  }

  spawnIncenseBurst(x = 540, y = 890) {
    for (let i = 0; i < 22; i++) {
      const angle = -Math.PI / 2 + (Math.random() - 0.5) * 1.2;
      const speed = 2.5 + Math.random() * 5.2;
      this.burstParticles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        r: 2.5 + Math.random() * 3.2,
        alpha: 1,
        decay: 0.032 + Math.random() * 0.02,
        color: i % 2 === 0 ? '#ffdf85' : '#ff9e44'
      });
    }
  }

  spawnBellWave(x = 540, y = 510, count = 2) {
    for (let i = 0; i < Math.min(count, 3); i++) {
      this.soundWaves.push({
        x,
        y,
        radius: 34 + i * 24,
        maxRadius: 460 + i * 55,
        alpha: 0.76 - i * 0.16,
        lineWidth: 3.2 - i * 0.6
      });
    }
  }

  spawnFloatingMerit(text = '+1 Công Đức', x = 540, y = 940, color = '#ffe082') {
    if (this.floatingTexts.length > 10) this.floatingTexts.shift();
    this.floatingTexts.push({
      text,
      x: x + (Math.random() - 0.5) * 42,
      y,
      vy: -3.2,
      alpha: 1.0,
      color
    });
  }

  spawnGrandCeremonyRain() {
    for (let i = 0; i < 18; i++) {
      this.lotusPetals.push(this.createLotusPetal(false));
    }
    for (let i = 0; i < 38; i++) {
      const angle = (Math.PI * 2 * i) / 38;
      const speed = 3.5 + Math.random() * 7.5;
      this.burstParticles.push({
        x: 540,
        y: 510,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        r: 3 + Math.random() * 3.5,
        alpha: 1,
        decay: 0.022 + Math.random() * 0.015,
        color: i % 3 === 0 ? '#fff3b0' : i % 3 === 1 ? '#ffb703' : '#ff7aa2'
      });
    }
  }

  spawnWelcomeBurst(x = 540, y = 1180) {
    // Thêm 6 cánh hoa sen vàng & hồng rơi đón khách
    for (let i = 0; i < 6; i++) {
      if (this.lotusPetals.length < 36) {
        this.lotusPetals.push(this.createLotusPetal(false));
      }
    }
    // Chùm hạt Pháp Vũ tỏa ra dọc thảm đỏ
    for (let i = 0; i < 24; i++) {
      const angle = -Math.PI / 2 + (Math.random() - 0.5) * 1.8;
      const speed = 2.2 + Math.random() * 5.0;
      this.burstParticles.push({
        x: x + (Math.random() - 0.5) * 90,
        y: y + (Math.random() - 0.5) * 40,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        r: 2.5 + Math.random() * 3.0,
        alpha: 1,
        decay: 0.028 + Math.random() * 0.018,
        color: i % 2 === 0 ? '#fff3b0' : '#ff9ecd'
      });
    }
    this.spawnBellWave(540, 895, 2);
  }

  spawnGiftFireworks(x = 540, y = 490, isGrand = false) {
    const petalCount = isGrand ? 22 : 12;
    for (let i = 0; i < petalCount; i++) {
      if (this.lotusPetals.length < 44) {
        this.lotusPetals.push(this.createLotusPetal(false));
      }
    }

    const count = isGrand ? 46 : 30;
    const colors = ['#fff3b0', '#ffd166', '#ff85a1', '#ff9e44', '#ffffff'];
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.15;
      const speed = (isGrand ? 4.2 : 3.0) + Math.random() * (isGrand ? 7.8 : 5.5);
      this.burstParticles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        r: 2.8 + Math.random() * 3.8,
        alpha: 1,
        decay: 0.018 + Math.random() * 0.015,
        color: colors[i % colors.length]
      });
    }

    this.spawnBellWave(x, y, isGrand ? 3 : 2);
  }

  spawnRoseShower(comboCount = 1) {
    const addPetals = Math.min(28, 10 + comboCount * 3);
    for (let i = 0; i < addPetals; i++) {
      if (this.lotusPetals.length < 62) {
        const p = this.createLotusPetal(false);
        p.rose = i % 3 !== 0; // 2/3 cánh hoa hồng đỏ thẫm, 1/3 cánh sen vàng
        p.gold = i % 3 === 0;
        p.scale = 0.85 + Math.random() * 0.65;
        p.vy = 1.8 + Math.random() * 2.2;
        this.lotusPetals.push(p);
      }
    }

    // Đài phun hạt pháo hoa Hồng Đỏ & Vàng Kim hai bên Lư Hương & trước ngực Phật
    const burstCount = Math.min(48, 22 + comboCount * 4);
    const roseColors = ['#ff2e63', '#ff758f', '#ffd166', '#fff3b0', '#ff4d6d'];
    for (let i = 0; i < burstCount; i++) {
      const originX = i % 3 === 0 ? 540 : i % 3 === 1 ? 370 : 710;
      const originY = i % 3 === 0 ? 500 : 885;
      const angle = -Math.PI / 2 + (Math.random() - 0.5) * 1.9;
      const speed = 3.2 + Math.random() * 6.5;
      this.burstParticles.push({
        x: originX + (Math.random() - 0.5) * 40,
        y: originY + (Math.random() - 0.5) * 30,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        r: 2.8 + Math.random() * 3.6,
        alpha: 1,
        decay: 0.019 + Math.random() * 0.015,
        color: roseColors[i % roseColors.length]
      });
    }
  }

  animate(timestamp) {
    requestAnimationFrame(this.animate);

    if (document.hidden) return;
    if (timestamp - this.lastFrameTime < this.frameInterval) return;
    this.lastFrameTime = timestamp;

    this.time += 0.042;
    this.noiseTick = (this.noiseTick + 1) % 10000;
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);

    // 0A. Tia sáng Phật quang chuyển động liên tục (Motion Overlay)
    for (let i = 0; i < this.godRays.length; i++) {
      const ray = this.godRays[i];
      const swayX = ray.x + Math.sin(this.time * ray.speed + ray.phase) * 65;
      const pulseAlpha = ray.alpha * (0.65 + 0.35 * Math.sin(this.time * 1.3 + ray.phase));
      ctx.globalAlpha = pulseAlpha;
      ctx.fillStyle = '#ffe596';
      ctx.beginPath();
      ctx.moveTo(540, 190);
      ctx.lineTo(swayX - ray.width, 1920);
      ctx.lineTo(swayX + ray.width, 1920);
      ctx.closePath();
      ctx.fill();
    }

    // 0B. Ánh lửa đèn lồng & nến bàn thờ lung linh nhấp nháy (Candle & Lantern Flicker)
    for (let i = 0; i < this.candleFlames.length; i++) {
      const fl = this.candleFlames[i];
      const flicker = 0.78 + 0.22 * Math.sin(this.time * 5.2 + fl.phase) * Math.cos(this.time * 8.7 + i);
      const r = fl.baseR * flicker;
      const jx = fl.x + Math.sin(this.time * 4.1 + fl.phase) * 3.5;
      const jy = fl.y + Math.cos(this.time * 6.3 + fl.phase) * 3.0;
      ctx.globalAlpha = 0.58 * flicker;
      ctx.drawImage(this.flameGlowSprite, jx - r, jy - r, r * 2, r * 2);

      // Ngọn lửa nhỏ nhấp nhô ở tâm
      ctx.globalAlpha = 0.85;
      ctx.fillStyle = '#fff6c2';
      ctx.beginPath();
      ctx.ellipse(
        jx,
        jy - 4 * flicker,
        4.5 * flicker,
        11 * flicker,
        Math.sin(this.time * 5 + fl.phase) * 0.14,
        0,
        Math.PI * 2
      );
      ctx.fill();
    }

    // 1. Hạt bụi vàng lấp lánh (Sparkles)
    for (let i = 0; i < this.goldSparks.length; i++) {
      const sp = this.goldSparks[i];
      sp.y += sp.vy;
      sp.x += sp.vx + Math.sin(this.time + sp.phase) * 0.55;
      if (sp.y < -20) {
        sp.y = this.height + 15;
        sp.x = Math.random() * this.width;
      }
      if (sp.x < -20) sp.x = this.width + 10;
      if (sp.x > this.width + 20) sp.x = -10;
      ctx.globalAlpha = sp.alpha * (0.5 + 0.5 * Math.sin(this.time * 2.4 + sp.phase));
      ctx.drawImage(this.sparkSprite, sp.x - sp.size * 0.5, sp.y - sp.size * 0.5, sp.size, sp.size);
    }

    // 2. Khói tâm hương cuộn bay
    this.spawnSmokeFromTips();
    for (let i = this.smokeParticles.length - 1; i >= 0; i--) {
      const p = this.smokeParticles[i];
      p.age += 1;
      if (p.age >= p.maxAge || p.y < 380) {
        this.smokeParticles.splice(i, 1);
        continue;
      }
      const progress = p.age / p.maxAge;
      const curl = Math.sin(this.time * 1.6 + p.seed + p.y * 0.014) * 0.65;
      p.x += p.vx + curl * (0.35 + progress * 0.55);
      p.y += p.vy;

      const r = p.radius + (p.maxRadius - p.radius) * progress;
      const fade = Math.sin(progress * Math.PI) * p.alpha * (1 - progress * 0.55);
      ctx.globalAlpha = Math.max(0, fade);
      ctx.drawImage(this.smokeSprite, p.x - r, p.y - r, r * 2, r * 2);
    }

    // 3. Cánh hoa sen rơi khắp màn hình
    ctx.globalAlpha = 1;
    for (let i = this.lotusPetals.length - 1; i >= 0; i--) {
      const petal = this.lotusPetals[i];
      petal.y += petal.vy;
      petal.x += petal.vx + Math.sin(this.time + petal.swayPhase) * 0.85;
      petal.rot += petal.vrot;

      if (petal.y > this.height + 35) {
        if (this.lotusPetals.length > 18) {
          this.lotusPetals.splice(i, 1);
          continue;
        } else {
          Object.assign(petal, this.createLotusPetal(false));
        }
      }

      ctx.save();
      ctx.translate(petal.x, petal.y);
      ctx.rotate(petal.rot);
      const sz = 28 * petal.scale;
      const sprite = petal.rose
        ? this.rosePetalSprite
        : petal.gold
          ? this.goldPetalSprite
          : this.pinkPetalSprite;
      ctx.drawImage(
        sprite,
        -sz * 0.5,
        -sz * 0.5,
        sz,
        sz
      );
      ctx.restore();
    }

    // 4. Sóng âm Đại Hồng Chung (tự động phát nhẹ định kỳ hoặc khi thỉnh chuông)
    if (this.noiseTick % 90 === 0 && this.soundWaves.length === 0) {
      this.spawnBellWave(540, 260, 1);
    }
    for (let i = this.soundWaves.length - 1; i >= 0; i--) {
      const w = this.soundWaves[i];
      w.radius += 10.5;
      w.alpha *= 0.94;
      if (w.radius >= w.maxRadius || w.alpha < 0.03) {
        this.soundWaves.splice(i, 1);
        continue;
      }
      ctx.globalAlpha = w.alpha;
      ctx.strokeStyle = '#ffd666';
      ctx.lineWidth = w.lineWidth;
      ctx.beginPath();
      ctx.arc(w.x, w.y, w.radius, 0, Math.PI * 2);
      ctx.stroke();
    }

    // 5. Hạt pháo hoa sen
    for (let i = this.burstParticles.length - 1; i >= 0; i--) {
      const b = this.burstParticles[i];
      b.x += b.vx;
      b.y += b.vy;
      b.vy += 0.08;
      b.alpha -= b.decay;
      if (b.alpha <= 0) {
        this.burstParticles.splice(i, 1);
        continue;
      }
      ctx.globalAlpha = Math.max(0, b.alpha);
      ctx.fillStyle = b.color;
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      ctx.fill();
    }

    // 6. Chữ +Công Đức bay lên
    if (this.floatingTexts.length > 0) {
      ctx.font = '800 27px "Be Vietnam Pro", sans-serif';
      ctx.textAlign = 'center';
      ctx.lineWidth = 4;
      ctx.strokeStyle = 'rgba(15, 4, 2, 0.9)';
      for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
        const ft = this.floatingTexts[i];
        ft.y += ft.vy;
        ft.alpha -= 0.032;
        if (ft.alpha <= 0) {
          this.floatingTexts.splice(i, 1);
          continue;
        }
        ctx.globalAlpha = Math.max(0, ft.alpha);
        ctx.strokeText(ft.text, ft.x, ft.y);
        ctx.fillStyle = ft.color;
        ctx.fillText(ft.text, ft.x, ft.y);
      }
    }

    // 7. Lớp Nhiễu Hạt Động (Dynamic Film Grain) & Chỉnh màu ánh sáng nhẹ toàn màn hình
    const nf = this.noiseFrames[this.noiseTick % this.noiseFrames.length];
    if (nf) {
      ctx.globalAlpha = 0.24;
      ctx.drawImage(nf, 0, 0, this.width, this.height);
    }

    ctx.globalAlpha = 1;
  }
}

window.TempleParticleEngine = TempleParticleEngine;
