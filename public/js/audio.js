/**
 * TempleAudioEngine
 * - Nhạc nền: Phát trực tiếp file "Nam Mô A Di Đà Phật.m4a" (/assets/bg_chant.m4a) lặp vô tận êm dịu,
 *   tự động hạ nhỏ âm lượng (ducking) khi có giọng đọc lời khấn để không bị đè tiếng hay rè/xước.
 * - Pháp khí: Tổng hợp tiếng Mõ gỗ, Đại Hồng Chung, Ống xăm nhẹ nhàng, không vượt ngưỡng 0dBFS.
 * - Giọng đọc: Hàng đợi ZeroTTS phát tuần tự mượt mà.
 */
class TempleAudioEngine {
  constructor() {
    this.ctx = null;
    this.unlocked = false;
    this.sfxEnabled = true;
    this.bgMusicEnabled = true;
    this.ttsEnabled = true;
    this.ttsVoice = 'maichi';

    // Nhạc nền "Nam Mô A Di Đà Phật.m4a" — mặc định 65%, cho phép chỉnh trực tiếp 0% - 100%
    const savedMusicVol = parseFloat(localStorage.getItem('temple_music_vol'));
    const savedTtsVol = parseFloat(localStorage.getItem('temple_tts_vol'));
    this.bgBaseVolume = Number.isFinite(savedMusicVol) ? Math.max(0, Math.min(1, savedMusicVol)) : 0.65;
    this.ttsVolume = Number.isFinite(savedTtsVol) ? Math.max(0, Math.min(1, savedTtsVol)) : 0.95;

    this.useSynthMusicFallback = false;
    this.synthBgTimer = null;
    this.bgAudio = new Audio('/assets/nhac_nen.mp3');
    this.bgAudio.loop = true;
    this.bgAudio.preload = 'auto';
    this.bgAudio.volume = this.bgBaseVolume;
    this.bgAudio.onerror = () => {
      this.useSynthMusicFallback = true;
    };
    this.ttsQueue = [];
    this.ttsPlaying = false;
    this.currentAudio = null;
    this.onTtsStateChange = null;
    this.instanceId = `tab_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    this.isObsClient = new URLSearchParams(window.location.search).get('obs') === '1';
    this.mutedByOtherTab = false;

    // Đồng bộ chống 2 tab trình duyệt phát đè tiếng nhau
    try {
      this.audioChannel = new BroadcastChannel('temple_audio_master_channel');
      this.audioChannel.onmessage = (ev) => {
        const data = ev.data || {};
        if (data.type === 'CLAIM_MASTER' && data.instanceId !== this.instanceId) {
          // Nếu tab kia là OBS hoặc người dùng chủ động bật tiếng ở tab kia -> Tab này tự động nhường âm thanh
          if (data.isObs || !this.isObsClient) {
            this.muteAsSecondaryTab();
          }
        } else if (data.type === 'PING_OBS' && this.isObsClient) {
          this.audioChannel.postMessage({
            type: 'CLAIM_MASTER',
            instanceId: this.instanceId,
            isObs: true
          });
        }
      };
      if (this.isObsClient) {
        this.audioChannel.postMessage({
          type: 'CLAIM_MASTER',
          instanceId: this.instanceId,
          isObs: true
        });
      } else {
        this.audioChannel.postMessage({ type: 'PING_OBS', instanceId: this.instanceId });
      }
    } catch (_) {
      this.audioChannel = null;
    }
  }

  claimAudioMaster(forceManual = false) {
    this.mutedByOtherTab = false;
    if (this.audioChannel && (this.isObsClient || forceManual)) {
      try {
        this.audioChannel.postMessage({
          type: 'CLAIM_MASTER',
          instanceId: this.instanceId,
          isObs: this.isObsClient || forceManual
        });
      } catch (_) {}
    }
  }

  muteAsSecondaryTab() {
    this.mutedByOtherTab = true;
    this.ttsQueue = [];
    this.stopCurrentAudio();
    this.stopZenAmbience();
  }

  stopCurrentAudio() {
    if (this.currentAudio) {
      try {
        this.currentAudio.onended = null;
        this.currentAudio.onerror = null;
        this.currentAudio.pause();
        this.currentAudio.src = '';
      } catch (_) {}
      this.currentAudio = null;
    }
  }

  ensureContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    this.unlocked = true;
    if (this.bgMusicEnabled) {
      this.startZenAmbience();
    }
    return this.ctx;
  }

  // --------------------------------------------------------------------------
  // 1. NHẠC NỀN "NAM MÔ A DI ĐÀ PHẬT.M4A" (CÓ AUTO-DUCKING KHI ĐỌC LỜI KHẤN)
  // --------------------------------------------------------------------------
  getDuckedVolume() {
    return Math.max(0.08, +(this.bgBaseVolume * 0.35).toFixed(2));
  }

  setMusicVolume(vol) {
    const v = Math.max(0, Math.min(1, Number(vol)));
    if (!Number.isFinite(v)) return;
    this.bgBaseVolume = v;
    try {
      localStorage.setItem('temple_music_vol', String(v));
    } catch (_) { }
    if (this.bgAudio && !this.useSynthMusicFallback) {
      this.bgAudio.volume = this.ttsPlaying ? this.getDuckedVolume() : this.bgBaseVolume;
    }
  }

  setTtsVolume(vol) {
    const v = Math.max(0, Math.min(1, Number(vol)));
    if (!Number.isFinite(v)) return;
    this.ttsVolume = v;
    try {
      localStorage.setItem('temple_tts_vol', String(v));
    } catch (_) { }
    if (this.currentAudio) {
      this.currentAudio.volume = this.ttsVolume;
    }
  }

  startZenAmbience() {
    if (!this.bgMusicEnabled || this.mutedByOtherTab) return;
    if (this.useSynthMusicFallback) {
      this.startDefaultZenSynthLoop();
      return;
    }
    try {
      this.bgAudio.volume = this.ttsPlaying ? this.getDuckedVolume() : this.bgBaseVolume;
      if (this.bgAudio.paused) {
        const p = this.bgAudio.play();
        if (p && typeof p.catch === 'function') {
          p.catch(() => {
            if (this.bgAudio.error) {
              this.useSynthMusicFallback = true;
              this.startDefaultZenSynthLoop();
            }
          });
        }
      }
    } catch (_) {
      this.useSynthMusicFallback = true;
      this.startDefaultZenSynthLoop();
    }
  }

  startDefaultZenSynthLoop() {
    if (!this.bgMusicEnabled || this.synthBgTimer) return;
    const PENTATONIC = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25];
    let step = 0;
    const playZenNote = () => {
      if (!this.bgMusicEnabled || !this.ctx) return;
      try {
        const now = this.ctx.currentTime;
        const freq = PENTATONIC[step % PENTATONIC.length];
        step++;
        const vol = (this.ttsPlaying ? this.getDuckedVolume() : this.bgBaseVolume) * 0.18;
        if (vol <= 0.002) return;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);

        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.linearRampToValueAtTime(vol, now + 0.6);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 4.2);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.onended = () => {
          osc.disconnect();
          gain.disconnect();
        };
        osc.start(now);
        osc.stop(now + 4.25);
      } catch (_) { }
    };
    playZenNote();
    this.synthBgTimer = setInterval(playZenNote, 3600);
  }

  stopZenAmbience() {
    try {
      this.bgAudio.pause();
    } catch (_) { }
    if (this.synthBgTimer) {
      clearInterval(this.synthBgTimer);
      this.synthBgTimer = null;
    }
  }

  setBgDucking(ducked) {
    if (!this.bgMusicEnabled) return;
    try {
      if (!this.useSynthMusicFallback && this.bgAudio) {
        this.bgAudio.volume = ducked ? this.getDuckedVolume() : this.bgBaseVolume;
      }
    } catch (_) { }
  }

  // --------------------------------------------------------------------------
  // 2. TIẾNG MÕ GỖ TỤNG KINH (WOODEN FISH PERCUSSION SYNTH)
  // --------------------------------------------------------------------------
  playWoodenFish(pitchMultiplier = 1.0) {
    if (!this.sfxEnabled || this.mutedByOtherTab) return;
    try {
      const ctx = this.ensureContext();
      const now = ctx.currentTime;

      const osc1 = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();

      const baseFreq = 620 * pitchMultiplier * (0.98 + Math.random() * 0.04);
      osc1.type = 'triangle';
      osc1.frequency.setValueAtTime(baseFreq * 1.4, now);
      osc1.frequency.exponentialRampToValueAtTime(baseFreq, now + 0.018);
      osc1.frequency.exponentialRampToValueAtTime(baseFreq * 0.82, now + 0.14);

      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(baseFreq * 1.15, now);
      filter.Q.setValueAtTime(4.0, now);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.28, now + 0.006);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

      osc1.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc1.onended = () => {
        osc1.disconnect();
        filter.disconnect();
        gain.disconnect();
      };

      osc1.start(now);
      osc1.stop(now + 0.16);
    } catch (_) { }
  }

  // --------------------------------------------------------------------------
  // 3. TIẾNG ĐẠI HỒNG CHUNG (TEMPLE BRONZE BELL)
  // --------------------------------------------------------------------------
  playTempleBell(intensity = 1.0) {
    if (!this.sfxEnabled || this.mutedByOtherTab) return;
    try {
      const ctx = this.ensureContext();
      const now = ctx.currentTime;

      const base = 174;
      const partials = [
        { ratio: 0.5, amp: 0.22, decay: 4.2 },
        { ratio: 1.0, amp: 0.35, decay: 3.6 },
        { ratio: 1.506, amp: 0.16, decay: 2.4 },
        { ratio: 2.0, amp: 0.18, decay: 1.9 }
      ];

      const master = ctx.createGain();
      master.gain.setValueAtTime(0.28 * Math.min(1.0, intensity), now);
      master.connect(ctx.destination);

      partials.forEach((p, idx) => {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(base * p.ratio, now);

        g.gain.setValueAtTime(0.0001, now);
        g.gain.linearRampToValueAtTime(p.amp, now + 0.015);
        g.gain.exponentialRampToValueAtTime(0.0001, now + p.decay);

        osc.connect(g);
        g.connect(master);
        osc.onended = () => {
          osc.disconnect();
          g.disconnect();
          if (idx === 0) master.disconnect();
        };
        osc.start(now);
        osc.stop(now + p.decay + 0.05);
      });
    } catch (_) { }
  }

  // --------------------------------------------------------------------------
  // 4. TIẾNG LẮC ỐNG XĂM TRE (FORTUNE STICK SHAKER)
  // --------------------------------------------------------------------------
  playFortuneShake() {
    if (!this.sfxEnabled) return;
    for (let i = 0; i < 5; i++) {
      setTimeout(() => {
        this.playWoodenFish(1.32 + (i % 2) * 0.16);
      }, i * 120);
    }
  }

  // --------------------------------------------------------------------------
  // 5. TIẾNG CHUÔNG NGỌC DÂNG LỄ / THẮP HƯƠNG (SINGING CHIME)
  // --------------------------------------------------------------------------
  playIncenseChime() {
    if (!this.sfxEnabled || this.mutedByOtherTab) return;
    try {
      const ctx = this.ensureContext();
      const now = ctx.currentTime;
      const notes = [528, 660];
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.1);

        gain.gain.setValueAtTime(0.0001, now + idx * 0.1);
        gain.gain.linearRampToValueAtTime(0.10, now + idx * 0.1 + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.1 + 1.1);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.onended = () => {
          osc.disconnect();
          gain.disconnect();
        };
        osc.start(now + idx * 0.1);
        osc.stop(now + idx * 0.1 + 1.15);
      });
    } catch (_) { }
  }

  // --------------------------------------------------------------------------
  // 5B. TIẾNG CHUÔNG GIÓ BÁT NHÃ ĐÓN THÍ CHỦ VÀO LIVE (WELCOME CHIME)
  // --------------------------------------------------------------------------
  playWelcomeChime() {
    if (!this.sfxEnabled || this.mutedByOtherTab) return;
    const nowMs = Date.now();
    if (this._lastWelcomeChimeMs && nowMs - this._lastWelcomeChimeMs < 950) return;
    this._lastWelcomeChimeMs = nowMs;
    try {
      const ctx = this.ensureContext();
      const now = ctx.currentTime;
      const notes = [440, 587.33, 880];
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.085);

        gain.gain.setValueAtTime(0.0001, now + idx * 0.085);
        gain.gain.linearRampToValueAtTime(0.085, now + idx * 0.085 + 0.012);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.085 + 0.95);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.onended = () => {
          osc.disconnect();
          gain.disconnect();
        };
        osc.start(now + idx * 0.085);
        osc.stop(now + idx * 0.085 + 1.0);
      });
    } catch (_) { }
  }

  // --------------------------------------------------------------------------
  // 5C. KHÁNH VÀNG CUNG ĐÀN DÂNG LỄ KHI TẶNG QUÀ (GIFT FANFARE ARPEGGIO)
  // --------------------------------------------------------------------------
  playGiftFanfare(isGrand = false) {
    if (!this.sfxEnabled || this.mutedByOtherTab) return;
    try {
      const ctx = this.ensureContext();
      const now = ctx.currentTime;
      const notes = isGrand
        ? [523.25, 659.25, 783.99, 1046.5, 1318.5]
        : [523.25, 659.25, 783.99, 1046.5];

      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
        const t0 = now + idx * 0.095;
        osc.frequency.setValueAtTime(freq, t0);

        gain.gain.setValueAtTime(0.0001, t0);
        gain.gain.linearRampToValueAtTime(isGrand ? 0.13 : 0.105, t0 + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.0001, t0 + (isGrand ? 1.45 : 1.15));

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.onended = () => {
          osc.disconnect();
          gain.disconnect();
        };
        osc.start(t0);
        osc.stop(t0 + (isGrand ? 1.5 : 1.2));
      });
    } catch (_) { }
  }

  // --------------------------------------------------------------------------
  // 6. ZEROTTS VOICE QUEUE & PREFETCHER (SINGLE-VOICE MUTEX - KHÔNG BAO GIỜ ĐÈ GIỌNG)
  // --------------------------------------------------------------------------
  enqueueTts(text, options = {}) {
    const onStart = typeof options.onStart === 'function' ? options.onStart : null;
    const onEnd = typeof options.onEnd === 'function' ? options.onEnd : null;

    if (!this.ttsEnabled || this.mutedByOtherTab) {
      if (onStart) onStart();
      if (onEnd) setTimeout(onEnd, 4500);
      return;
    }
    const clean = String(text || '').trim();
    if (!clean) {
      if (onStart) onStart();
      if (onEnd) setTimeout(onEnd, 4500);
      return;
    }

    const priority = Number(options.priority) || 1;
    const userKey = String(options.userKey || '').toLowerCase().trim();

    // 1. Chống lặp/đè câu của cùng 1 người (VD: vừa bình luận vừa tặng quà vừa tăng hạng cùng lúc):
    // Nếu trong hàng đợi đang có câu chưa đọc của cùng người đó (mà không phải câu xin xăm có callback riêng),
    // thay thế câu cũ bằng câu mới quan trọng hơn thay vì đọc 2-3 câu liên tiếp!
    if (userKey) {
      const existingIdx = this.ttsQueue.findIndex((q) => q.userKey === userKey && !q.onStart);
      if (existingIdx >= 0) {
        const existing = this.ttsQueue[existingIdx];
        if (priority >= (existing.priority || 1)) {
          this.ttsQueue.splice(existingIdx, 1);
        } else {
          // Đã có câu ưu tiên cao hơn (VD: câu tặng quà) của người này trong hàng đợi -> Bỏ qua câu bình luận thường
          return;
        }
      }
    }

    // 2. Giới hạn hàng đợi tối đa 4 câu để âm thanh luôn khớp thời gian thực, không bị trễ/dồn toa
    while (this.ttsQueue.length >= 4) {
      const lowIdx = this.ttsQueue.findIndex((q) => (q.priority || 1) <= 1 && !q.onStart);
      const dropIdx = lowIdx >= 0 ? lowIdx : 0;
      const [dropped] = this.ttsQueue.splice(dropIdx, 1);
      if (dropped?.onStart) dropped.onStart();
      if (dropped?.onEnd) dropped.onEnd();
    }

    const item = {
      id: `tts_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      text: clean,
      priority,
      userKey,
      voice: (options.voice || this.ttsVoice || 'maichi').toLowerCase(),
      url: options.url || null,
      onStart,
      onEnd,
      fetchPromise: null
    };

    if (!item.url) {
      item.fetchPromise = this.fetchZeroTtsAudio(item.text, item.voice);
    }

    if (priority >= 3) {
      // Quà tặng / Tăng hạng VIP: Đưa lên đầu hàng đợi chờ phát ngay sau khi câu hiện tại kết thúc (KHÔNG cắt ngang đè lên câu đang nói)
      const insertIdx = this.ttsQueue.findIndex((q) => (q.priority || 1) < 3);
      if (insertIdx >= 0) {
        this.ttsQueue.splice(insertIdx, 0, item);
      } else {
        this.ttsQueue.push(item);
      }
    } else {
      this.ttsQueue.push(item);
    }

    this.processTtsQueue();
  }

  async fetchZeroTtsAudio(text, voice = 'maichi') {
    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, voice })
      });
      const data = await res.json();
      if (data && data.ok && data.url) {
        return data;
      }
      return { ok: false, error: data?.error || 'ZeroTTS unavailable' };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  }

  async processTtsQueue() {
    // Khóa Mutex nghiêm ngặt: Nếu đang có câu đọc hoặc đang trong nhịp nghỉ giữa 2 câu -> tuyệt đối không chạy song song
    if (this.ttsPlaying) return;
    if (this.ttsQueue.length === 0 || this.mutedByOtherTab || !this.ttsEnabled) {
      this.setBgDucking(false);
      if (this.onTtsStateChange) {
        this.onTtsStateChange({ speaking: false, synthesizing: false, text: '' });
      }
      return;
    }

    this.ttsPlaying = true;

    while (this.ttsQueue.length > 0 && this.ttsEnabled && !this.mutedByOtherTab) {
      const item = this.ttsQueue.shift();
      if (!item) break;

      try {
        let audioUrl = item.url;
        if (!audioUrl && item.fetchPromise) {
          const res = await item.fetchPromise;
          if (res && res.ok && res.url) {
            audioUrl = res.url;
          }
        }

        if (audioUrl && this.ttsEnabled && !this.mutedByOtherTab) {
          this.setBgDucking(true);
          if (this.onTtsStateChange) {
            this.onTtsStateChange({ speaking: true, synthesizing: false, text: item.text });
          }
          if (item.onStart) item.onStart();
          await this.playWavUrl(audioUrl);
          if (item.onEnd) item.onEnd();
        } else {
          if (item.onStart) item.onStart();
          if (item.onEnd) setTimeout(item.onEnd, 4500);
        }
      } catch (err) {
        console.warn('[ZeroTTS Playback Warning]', err);
        if (item.onStart) item.onStart();
        if (item.onEnd) item.onEnd();
      }

      // Nhịp nghỉ tự nhiên 420ms giữa 2 câu đọc (vẫn giữ khóa this.ttsPlaying = true để không câu nào chen ngang!)
      if (this.ttsQueue.length > 0) {
        await new Promise((r) => setTimeout(r, 420));
      }
    }

    this.ttsPlaying = false;
    this.setBgDucking(false);
    if (this.onTtsStateChange) {
      this.onTtsStateChange({ speaking: false, synthesizing: false, text: '' });
    }
  }

  playWavUrl(url) {
    return new Promise((resolve) => {
      try {
        // Đảm bảo hủy triệt để mọi Audio cũ trước khi phát câu mới (100% không bao giờ phát chồng 2 giọng)
        this.stopCurrentAudio();

        const audio = new Audio(url);
        this.currentAudio = audio;
        audio.volume = this.ttsVolume;

        let settled = false;
        const finish = () => {
          if (settled) return;
          settled = true;
          if (this.currentAudio === audio) {
            this.currentAudio = null;
          }
          resolve();
        };

        // Timeout an toàn tối đa 16 giây phòng trường hợp trình duyệt treo sự kiện onended
        const safetyTimer = setTimeout(finish, 16000);

        audio.onended = () => {
          clearTimeout(safetyTimer);
          finish();
        };
        audio.onerror = () => {
          clearTimeout(safetyTimer);
          finish();
        };
        const playPromise = audio.play();
        if (playPromise && typeof playPromise.catch === 'function') {
          playPromise.catch(() => {
            clearTimeout(safetyTimer);
            finish();
          });
        }
      } catch (_) {
        resolve();
      }
    });
  }
}

window.TempleAudioEngine = TempleAudioEngine;
