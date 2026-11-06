/**
 * Live 9:16 Client Controller — Chánh Điện Đức Phật A Di Đà & Đạo Tràng Phật Tử Quỳ Lễ
 * - Hiển thị 6 Đệm Quỳ VIP (Top 6 Bảng Vàng Công Đức)
 * - Hiển thị 40 Phật Tử mặc áo lam quỳ hai bên thảm đỏ + thẻ tên người xem
 * - Hiệu ứng người xem bước dọc thảm đỏ lên trước Lư Hương Đồng dâng hương
 * - Giọng đọc ZeroTTS (Mai Chi) + Pháp khí Web Audio
 */
(function () {
  const params = new URLSearchParams(window.location.search);
  if (params.get('obs') === '1') {
    document.body.classList.add('obs-mode');
  }

  // 1. Tự động co giãn khung 1080x1920 vừa khít Stage Wrapper (9:16)
  const stageWrapper = document.getElementById('stageWrapper');
  const stage9x16 = document.getElementById('stage9x16');

  function fitStage() {
    if (!stageWrapper || !stage9x16) return;
    const rect = stageWrapper.getBoundingClientRect();
    const scale = rect.width / 1080;
    stage9x16.style.transform = `scale(${scale})`;
  }
  window.addEventListener('resize', fitStage);
  fitStage();

  // 2. Khởi tạo Particle Engine & Audio Engine (ZeroTTS Mai Chi)
  const canvas = document.getElementById('templeCanvas');
  const particles = new window.TempleParticleEngine(canvas);
  const audio = new window.TempleAudioEngine();

  const isObsMode = params.get('obs') === '1';
  let manualLocalAudioUnlock = false;

  function syncAudioMasterState(obsActive) {
    const btnUnlock = document.getElementById('btnUnlockAudio');
    if (!isObsMode && obsActive && !manualLocalAudioUnlock) {
      audio.muteAsSecondaryTab();
      if (btnUnlock) {
        btnUnlock.textContent = '🔇 Đang phát tiếng trên TikTok Studio (Bấm để nghe tại đây)';
        btnUnlock.classList.remove('active-toggle');
        btnUnlock.classList.add('gold');
      }
    }
  }

  function unlockAudioOnce(isManualBtn = false) {
    if (isManualBtn) {
      manualLocalAudioUnlock = true;
      audio.claimAudioMaster(true);
    } else if (audio.mutedByOtherTab && !isObsMode) {
      return;
    }
    audio.ensureContext();
    const btnUnlock = document.getElementById('btnUnlockAudio');
    if (btnUnlock) {
      btnUnlock.textContent = '✅ Âm Thanh Chùa Đã Sẵn Sàng';
      btnUnlock.classList.remove('gold');
      btnUnlock.classList.add('active-toggle');
    }
  }
  window.addEventListener('pointerdown', () => unlockAudioOnce(false), { once: true });
  document.getElementById('btnUnlockAudio')?.addEventListener('click', () => unlockAudioOnce(true));
  if (isObsMode) {
    setTimeout(() => unlockAudioOnce(false), 300);
  }

  // 3. Vẽ các nén nhang đang cháy trong Lư Hương Đỉnh Đồng (x=540, y=895)
  const incenseHolder = document.getElementById('incenseSticksHolder');
  let renderedStickCount = 0;

  function renderIncenseSticks(count) {
    const target = Math.max(3, Math.min(27, Number(count) || 9));
    if (target === renderedStickCount && incenseHolder.children.length > 0) return;
    renderedStickCount = target;
    incenseHolder.innerHTML = '';

    const tips = [];
    for (let i = 0; i < target; i++) {
      const stick = document.createElement('div');
      stick.className = 'incense-stick';

      const spread = target === 1 ? 0 : (i / (target - 1) - 0.5) * 2;
      const leftPx = 65 + spread * 28 + Math.sin(i * 2.1) * 2;
      const angleDeg = spread * 12 + Math.cos(i * 1.5) * 1.5;
      const heightPx = 76 + (i % 3) * 6;

      stick.style.left = `${leftPx}px`;
      stick.style.height = `${heightPx}px`;
      stick.style.transform = `rotate(${angleDeg}deg)`;

      const ember = document.createElement('div');
      ember.className = 'incense-ember';
      ember.style.animationDelay = `${(i * 0.15) % 1.1}s`;
      stick.appendChild(ember);
      incenseHolder.appendChild(stick);

      const rad = (angleDeg * Math.PI) / 180;
      const tipX = 540 + (leftPx - 65) + Math.sin(rad) * heightPx;
      const tipY = 895 - Math.cos(rad) * heightPx;
      tips.push({ x: tipX, y: tipY });
    }
    particles.setIncenseTips(tips);
  }

  // 4. Dựng Hàng 6 Đệm Quỳ VIP (Top 6 Thí Chủ trên bục gỗ y=1188, thu vào vùng an toàn điện thoại x=176..904)
  const VIP_CUSHION_COORDS = [
    { x: 152, y: 1188, rank: 1 },
    { x: 274, y: 1188, rank: 2 },
    { x: 396, y: 1188, rank: 3 },
    { x: 684, y: 1188, rank: 4 },
    { x: 806, y: 1188, rank: 5 },
    { x: 928, y: 1188, rank: 6 }
  ];

  function renderVipCushions(leaderboard = []) {
    const layer = document.getElementById('vipCushionsLayer');
    if (!layer) return;

    layer.innerHTML = VIP_CUSHION_COORDS.map((slot, idx) => {
      const dev = leaderboard[idx];
      if (!dev) return '';
      return `
        <div class="vip-devotee-slot" style="left: ${slot.x}px; top: ${slot.y}px; z-index: ${12 + idx};">
          <img src="/assets/devotee.png" alt="VIP Devotee" class="devotee-sprite" />
          <div class="vip-rank-pill">
            <span class="vip-rank-num">${slot.rank}</span>
            <span class="vip-rank-name">${escapeHtml(shortenName(dev.name, 12))}</span>
          </div>
        </div>
      `;
    }).join('');
  }

  // 5. Dựng Đạo Tràng 40 Phật Tử Quỳ Lễ Hai Bên Thảm Đỏ (5 Hàng x 4 Cột mỗi bên, trong vùng an toàn điện thoại)
  const congregationHall = document.getElementById('congregationHall');
  const HALL_SEAT_COORDS = [];

  (function buildHallGrid() {
    const rows = 5;
    const colsPerSide = 4;
    for (let r = 0; r < rows; r++) {
      const progress = r / (rows - 1); // 0 (xa) -> 1 (gần)
      const y = Math.round(1290 + progress * 355); // 1290 -> 1645
      const scale = +(0.76 + progress * 0.28).toFixed(2);

      // Cánh trái thảm đỏ (nằm gọn trong x >= 120 để không bị cắt mép trên điện thoại)
      const leftInnerX = Math.round(335 - progress * 42);
      const leftOuterX = 120;
      for (let c = 0; c < colsPerSide; c++) {
        const t = c / (colsPerSide - 1);
        const x = Math.round(leftOuterX + t * (leftInnerX - leftOuterX));
        HALL_SEAT_COORDS.push({ side: 'L', row: r, col: c, x, y, scale });
      }

      // Cánh phải thảm đỏ (nằm gọn trong x <= 960 để không bị cắt mép trên điện thoại)
      const rightInnerX = Math.round(745 + progress * 42);
      const rightOuterX = 960;
      for (let c = 0; c < colsPerSide; c++) {
        const t = c / (colsPerSide - 1);
        const x = Math.round(rightInnerX + t * (rightOuterX - rightInnerX));
        HALL_SEAT_COORDS.push({ side: 'R', row: r, col: c, x, y, scale });
      }
    }
  })();

  let lastRenderedLeaderboardJson = '';

  function renderCongregationHall(leaderboard = []) {
    if (!congregationHall) return;
    // Những người xếp từ hạng 7 trở đi ngồi ở các vị trí đầu tiên cạnh thảm đỏ
    const hallViewers = leaderboard.slice(6);
    const sig = JSON.stringify(hallViewers.map((d) => `${d.name}:${d.merit}`));
    if (sig === lastRenderedLeaderboardJson && congregationHall.children.length > 0) return;
    lastRenderedLeaderboardJson = sig;

    // Ưu tiên gắn thẻ tên vào các ghế gần thảm đỏ dễ nhìn nhất
    const labeledSeatIndices = [
      3, 4, 11, 12, 19, 20, 27, 28, 35, 36, 2, 5, 10, 13, 18, 21, 26, 29
    ];
    const seatViewerMap = new Map();
    hallViewers.forEach((viewer, idx) => {
      if (idx < labeledSeatIndices.length) {
        seatViewerMap.set(labeledSeatIndices[idx], viewer);
      }
    });

    congregationHall.innerHTML = HALL_SEAT_COORDS.map((seat, idx) => {
      const viewer = seatViewerMap.get(idx);
      const badgeHtml = viewer
        ? `
          <div class="seat-badge">
            <span class="seat-avatar">${
              viewer.avatar
                ? `<img src="${escapeHtml(viewer.avatar)}" alt="" />`
                : escapeHtml(String(viewer.name || 'P').charAt(0).toUpperCase())
            }</span>
            <span class="seat-username">${escapeHtml(shortenName(viewer.name, 11))}</span>
          </div>
        `
        : '';

      return `
        <div
          class="hall-seat seat-side-${seat.side}"
          data-seat-idx="${idx}"
          style="left: ${seat.x}px; top: ${seat.y}px; z-index: ${20 + seat.row * 2}; transform: translate(-50%, -100%) scale(${seat.scale});"
        >
          <img
            src="/assets/devotee.png"
            alt="Phật tử"
            class="devotee-sprite"
            style="animation-delay: ${((idx * 0.27) % 3.5).toFixed(2)}s;"
          />
          ${badgeHtml}
        </div>
      `;
    }).join('');
  }

  // Preload toàn bộ 8 frame nhân vật vào bộ nhớ để chuyển frame mượt 0ms
  const SPRITE_FRAMES = {
    walk1: '/assets/devotee_walk.png',
    walk2: '/assets/devotee_walk_2.png',
    kneelDown: '/assets/devotee_kneel_down.png',
    kneel: '/assets/devotee.png',
    forehead: '/assets/devotee_bow.png',
    bowMid: '/assets/devotee_bow_mid.png',
    prostrate: '/assets/devotee_prostrate.png',
    prostrateDeep: '/assets/devotee_prostrate_deep.png'
  };
  Object.values(SPRITE_FRAMES).forEach((url) => {
    const img = new Image();
    img.src = url;
  });

  function pulseHallBowing(fullHall = false) {
    if (congregationHall) {
      const seats = congregationHall.querySelectorAll('.hall-seat');
      seats.forEach((el, i) => {
        if (!fullHall && i % 3 !== 0 && Math.random() > 0.35) return;
        const img = el.querySelector('.devotee-sprite');
        if (!img) return;
        const delay = fullHall
          ? Math.floor(i / 8) * 85 + (i % 4) * 32
          : (i % 5) * 70 + Math.round(Math.random() * 60);
        setTimeout(() => {
          img.src = SPRITE_FRAMES.forehead;
          el.classList.add('is-bowing-prepare');
        }, delay);
        setTimeout(() => {
          img.src = SPRITE_FRAMES.bowMid;
          el.classList.remove('is-bowing-prepare');
          el.classList.add('is-bowing');
        }, delay + 145);
        setTimeout(() => {
          img.src = SPRITE_FRAMES.prostrateDeep;
          el.classList.add('is-bowing-deep');
        }, delay + 310);
        setTimeout(() => {
          img.src = SPRITE_FRAMES.bowMid;
          el.classList.remove('is-bowing-deep');
        }, delay + 640);
        setTimeout(() => {
          img.src = SPRITE_FRAMES.kneel;
          el.classList.remove('is-bowing');
        }, delay + 820);
      });
    }
    const vipLayer = document.getElementById('vipCushionsLayer');
    if (vipLayer) {
      const vipSlots = vipLayer.querySelectorAll('.vip-devotee-slot');
      vipSlots.forEach((slot, idx) => {
        if (!fullHall && idx % 2 !== 0 && Math.random() > 0.5) return;
        const img = slot.querySelector('.devotee-sprite');
        if (!img) return;
        const delay = idx * 60;
        setTimeout(() => {
          img.src = SPRITE_FRAMES.forehead;
          slot.classList.add('is-bowing-prepare');
        }, delay);
        setTimeout(() => {
          img.src = SPRITE_FRAMES.bowMid;
          slot.classList.remove('is-bowing-prepare');
          slot.classList.add('is-bowing');
        }, delay + 150);
        setTimeout(() => {
          img.src = SPRITE_FRAMES.prostrateDeep;
          slot.classList.add('is-bowing-deep');
        }, delay + 320);
        setTimeout(() => {
          img.src = SPRITE_FRAMES.bowMid;
          slot.classList.remove('is-bowing-deep');
        }, delay + 680);
        setTimeout(() => {
          img.src = SPRITE_FRAMES.kneel;
          slot.classList.remove('is-bowing');
        }, delay + 850);
      });
    }
  }

  function _legacyPulseHallBowing(fullHall = false) {
    if (congregationHall) {
      const seats = congregationHall.querySelectorAll('.hall-seat');
      seats.forEach((el, i) => {
        if (!fullHall && i % 4 !== 0) return;
        const img = el.querySelector('.devotee-sprite');
        if (!img) return;
        const delay = fullHall ? Math.floor(i / 8) * 90 + (i % 4) * 35 : (i % 4) * 80;
        setTimeout(() => { img.src = SPRITE_FRAMES.forehead; }, delay);
        setTimeout(() => { img.src = SPRITE_FRAMES.bowMid; }, delay + 140);
        setTimeout(() => { img.src = SPRITE_FRAMES.prostrateDeep; }, delay + 300);
        setTimeout(() => { img.src = SPRITE_FRAMES.bowMid; }, delay + 620);
        setTimeout(() => { img.src = SPRITE_FRAMES.kneel; }, delay + 780);
      });
    }
    if (fullHall) {
      const vipLayer = document.getElementById('vipCushionsLayer');
      if (vipLayer) {
        const vipSprites = vipLayer.querySelectorAll('.devotee-sprite');
        vipSprites.forEach((img, idx) => {
          const delay = idx * 55;
          setTimeout(() => { img.src = SPRITE_FRAMES.forehead; }, delay);
          setTimeout(() => { img.src = SPRITE_FRAMES.bowMid; }, delay + 150);
          setTimeout(() => { img.src = SPRITE_FRAMES.prostrateDeep; }, delay + 320);
          setTimeout(() => { img.src = SPRITE_FRAMES.bowMid; }, delay + 680);
          setTimeout(() => { img.src = SPRITE_FRAMES.kneel; }, delay + 840);
        });
      }
    }
  }

  let prostrationTimers = [];
  function clearProstrationTimers() {
    while (prostrationTimers.length > 0) {
      clearTimeout(prostrationTimers.pop());
    }
  }

  // Chuyển đổi tức thời giữa 8 khung hình đã giải mã sẵn trên GPU (KHÔNG BAO GIỜ BỊ MẤT HÌNH)
  function setCentralPose(poseKey) {
    const stack = document.getElementById('centralSpriteStack');
    if (!stack) return;
    const frames = stack.querySelectorAll('.pose-frame');
    frames.forEach((img) => {
      img.classList.toggle('active', img.getAttribute('data-pose') === poseKey);
    });
  }

  function schedulePose(ms, poseKey) {
    prostrationTimers.push(
      setTimeout(() => {
        setCentralPose(poseKey);
      }, ms)
    );
  }

  // Chuỗi 8 khung hình Đảnh lễ Tam Bái mượt mà (Hạ gối -> Chắp tay ngực -> Đưa lên trán -> Nghiêng 45° -> Chống tay -> Lạy sát đất -> Ngẩng lên)
  function playThreeBowsSequence(startDelayMs = 0) {
    schedulePose(startDelayMs, 'kneelDown');
    schedulePose(startDelayMs + 160, 'kneel');

    const bowOffsets = [startDelayMs + 320, startDelayMs + 1820, startDelayMs + 3320];
    bowOffsets.forEach((t0) => {
      schedulePose(t0, 'forehead');            // 1. Chắp tay đưa lên trán
      schedulePose(t0 + 170, 'bowMid');        // 2. Cúi gập lưng 45°
      schedulePose(t0 + 330, 'prostrate');     // 3. Vươn hai tay chống xuống đệm
      schedulePose(t0 + 490, 'prostrateDeep'); // 4. Lạy sát đất (Ngũ thể đầu địa)
      schedulePose(t0 + 860, 'prostrate');     // 5. Bắt đầu nâng đầu lên
      schedulePose(t0 + 1020, 'bowMid');       // 6. Nâng lưng lên góc 45°
      schedulePose(t0 + 1180, 'kneel');        // 7. Ngồi quỳ thẳng lưng
    });

    schedulePose(startDelayMs + 4800, 'forehead');
    schedulePose(startDelayMs + 5350, 'kneel');
  }

  // Hiệu ứng thí chủ ĐỨNG ĐI BỘ từng bước dọc thảm đỏ rồi Hạ gối Quỳ Đảnh Lễ (trên cùng 1 nhân vật, không bao giờ mất hình)
  function animateWalkerOnCarpet(user, avatar, actionLabel, wish) {
    const centralEl = document.getElementById('centralWorshipper');
    if (!centralEl) return;

    clearProstrationTimers();
    updateCentralWorshipper(user, avatar, actionLabel, wish, false);

    // Khởi động bước đi từ cuối thảm đỏ lên chính điện
    centralEl.classList.remove('walking-up');
    void centralEl.offsetWidth;
    centralEl.classList.add('walking-up');

    setCentralPose('walk1');
    for (let step = 1; step <= 10; step++) {
      schedulePose(step * 185, step % 2 === 0 ? 'walk1' : 'walk2');
    }

    // Khi bước tới trước Lư Hương (2.05s): dừng bước, hạ gối quỳ xuống đệm và bắt đầu Đảnh lễ 3 lạy
    prostrationTimers.push(
      setTimeout(() => {
        centralEl.classList.remove('walking-up');
      }, 2100)
    );
    playThreeBowsSequence(2050);
  }

  function updateCentralWorshipper(user, avatar, actionLabel, wish, doThreeBows = true) {
    const nameEl = document.getElementById('centralName');
    const actEl = document.getElementById('centralAction');
    const wishEl = document.getElementById('centralWishBubble');
    const avatarEl = document.getElementById('centralAvatar');
    const beam = document.getElementById('sacredLightBeam');

    if (nameEl) nameEl.textContent = user || 'Thí Chủ Hữu Duyên';
    if (actEl) actEl.textContent = actionLabel || '✨ Dâng hương cầu an';
    if (wishEl) wishEl.textContent = `“${wish || 'Nam Mô A Di Đà Phật, cầu bình an cát tường'}”`;

    if (avatarEl) {
      if (avatar) {
        avatarEl.innerHTML = `<img src="${escapeHtml(avatar)}" alt="" />`;
      } else {
        avatarEl.textContent = String(user || '🙏').trim().charAt(0).toUpperCase();
      }
    }

    if (doThreeBows) {
      clearProstrationTimers();
      const centralEl = document.getElementById('centralWorshipper');
      if (centralEl) centralEl.classList.remove('walking-up');
      playThreeBowsSequence(0);
    }
    if (beam) {
      beam.classList.add('intense');
      setTimeout(() => beam.classList.remove('intense'), 4500);
    }

    const haloSys = document.getElementById('buddhaHaloSystem');
    const lotusHand = document.getElementById('lotusHandHalo');
    if (haloSys) {
      haloSys.classList.add('flare');
      setTimeout(() => haloSys.classList.remove('flare'), 3600);
    }
    if (lotusHand) {
      lotusHand.classList.add('flare');
      setTimeout(() => lotusHand.classList.remove('flare'), 3600);
    }
    particles.spawnBellWave(540, 260, 2);

    // Cập nhật dòng thông báo dưới thanh HUD
    const hudName = document.getElementById('devoteeNameLine');
    const hudAct = document.getElementById('devoteeActionTag');
    if (hudName) hudName.textContent = user || 'Thí Chủ';
    if (hudAct) hudAct.textContent = actionLabel || 'Dâng hương';
  }

  // 6. Cập nhật toàn bộ giao diện theo State từ Server
  let hasInitializedRealLeader = false;

  function updateUIState(st) {
    if (!st) return;

    document.getElementById('statIncense').textContent = Number(st.totalIncense || 0).toLocaleString('vi-VN');
    document.getElementById('statMerit').textContent = Number(st.totalMerit || 0).toLocaleString('vi-VN');
    document.getElementById('statWoodenFish').textContent = Number(st.woodenFishHits || 0).toLocaleString('vi-VN');

    renderIncenseSticks(st.activeIncenseSticks || 9);

    const lb = Array.isArray(st.leaderboard) ? st.leaderboard : [];
    renderVipCushions(lb);
    renderCongregationHall(lb);

    // Đồng bộ tên Chủ Lễ mặc định theo người dẫn đầu thực tế nếu chưa có sự kiện mới
    if (!hasInitializedRealLeader && lb.length > 0) {
      hasInitializedRealLeader = true;
      const topDev = lb[0];
      updateCentralWorshipper(
        topDev.name,
        topDev.avatar,
        `✨ Công đức: ${Number(topDev.merit).toLocaleString('vi-VN')} CĐ`,
        topDev.lastWish || 'Nam Mô A Di Đà Phật, cầu bình an cát tường',
        false
      );
    }

    // Cập nhật Bảng Vàng Công Đức bên trái (Top 5 giống mẫu tham chiếu)
    const sideLbEl = document.getElementById('sideLeaderboardList');
    if (sideLbEl) {
      const top5 = [];
      for (let i = 0; i < 5; i++) {
        const realItem = lb[i];
        if (realItem) {
          top5.push({ rank: i + 1, ...realItem });
        } else {
          top5.push({ rank: i + 1, name: 'Chờ thí chủ...', merit: 0, avatar: '' });
        }
      }

      sideLbEl.innerHTML = top5
        .map((item) => {
          const avatarInner = item.avatar
            ? `<img src="${escapeHtml(item.avatar)}" alt="" />`
            : escapeHtml(String(item.name || 'P').trim().charAt(0).toUpperCase());
          return `
            <div class="smb-row top-${item.rank}">
              <span class="smb-rank">${item.rank}</span>
              <span class="smb-avatar">${avatarInner}</span>
              <div class="smb-info">
                <div class="smb-name">${escapeHtml(shortenName(item.name, 15))}</div>
                <div class="smb-merit">★ ${Number(item.merit || 0).toLocaleString('vi-VN')} tâm đức</div>
              </div>
            </div>
          `;
        })
        .join('');
    }

    // Cập nhật Bảng TẤM LÒNG THÀNH ở góc dưới phải (Top 4)
    const lbList = document.getElementById('leaderboardList');
    if (lbList) {
      lbList.innerHTML = lb
        .slice(0, 4)
        .map(
          (item) => `
          <div class="leader-item">
            <span class="leader-rank">${item.rank}</span>
            <span class="leader-name">${escapeHtml(shortenName(item.name, 14))}</span>
            <span class="leader-merit">${Number(item.merit).toLocaleString('vi-VN')}</span>
          </div>
        `
        )
        .join('');
    }

    // Trạng thái kết nối TikTok Live
    const liveDot = document.getElementById('liveDot');
    const liveText = document.getElementById('liveStatusText');
    if (st.tiktok?.connected) {
      liveDot.classList.add('connected');
      liveText.textContent = `LIVE @${st.tiktok.username} • ${st.tiktok.viewerCount || 0} mắt`;
    } else if (st.tiktok?.connecting) {
      liveDot.classList.remove('connected');
      liveText.textContent = `Đang kết nối @${st.tiktok.username}...`;
    } else {
      liveDot.classList.remove('connected');
      liveText.textContent = st.settings?.autoSim
        ? 'CHÙA LINH ỨNG • TỰ ĐỘNG GIẢ LẬP ĐÔNG NGƯỜI'
        : 'CHÙA LINH ỨNG • ĐỨC PHẬT A DI ĐÀ';
    }

    const btnAutoSim = document.getElementById('btnToggleAutoSim');
    if (btnAutoSim && st.settings) {
      btnAutoSim.textContent = st.settings.autoSim
        ? '🤖 Tự động Giả lập Người Xem: ĐANG BẬT'
        : '🤖 Tự động Giả lập Người Xem: TẮT';
      btnAutoSim.classList.toggle('active-toggle', Boolean(st.settings.autoSim));
    }
    if (st.settings) {
      if (typeof st.settings.musicVolume === 'number') {
        audio.setMusicVolume(st.settings.musicVolume);
        const sMus = document.getElementById('sliderMusicVol');
        const vMus = document.getElementById('valMusicVol');
        const pct = Math.round(st.settings.musicVolume * 100);
        if (sMus) sMus.value = String(pct);
        if (vMus) vMus.textContent = `${pct}%`;
      }
      if (typeof st.settings.ttsVolume === 'number') {
        audio.setTtsVolume(st.settings.ttsVolume);
        const sTts = document.getElementById('sliderTtsVol');
        const vTts = document.getElementById('valTtsVol');
        const pct = Math.round(st.settings.ttsVolume * 100);
        if (sTts) sTts.value = String(pct);
        if (vTts) vTts.textContent = `${pct}%`;
      }
    }


    const feed = document.getElementById('eventFeed');
    if (feed && Array.isArray(st.recentEvents)) {
      feed.innerHTML = st.recentEvents
        .slice(0, 8)
        .map((ev) => `<div class="event-feed-item">${formatEventSummary(ev)}</div>`)
        .join('');
    }

    // Cập nhật Widget Mục Tiêu Đại Lễ Bông Hồng (10 Bông Hồng / Đại Lễ)
    const totalRoses = Number(st.offerings?.lotus || 0);
    const goalStep = 10;
    const currentStepRoses = totalRoses % goalStep;
    const goalPct = totalRoses > 0 && currentStepRoses === 0 ? 100 : Math.max(10, Math.round((currentStepRoses / goalStep) * 100));
    const goalValEl = document.getElementById('rtGoalValue');
    const goalFillEl = document.getElementById('rtGoalFill');
    if (goalValEl) {
      goalValEl.textContent = `${currentStepRoses} / ${goalStep} Bông 🌹`;
    }
    if (goalFillEl) {
      goalFillEl.style.width = `${goalPct}%`;
    }

    // Cập nhật Widget Khung Chat & Lời Khấn Trực Tiếp trên màn hình 9:16
    const lcoList = document.getElementById('liveChatOverlayList');
    if (lcoList && Array.isArray(st.recentEvents)) {
      lcoList.innerHTML = st.recentEvents
        .slice(0, 4)
        .map((ev) => {
          const dt = ev.timestamp ? new Date(ev.timestamp) : new Date();
          const hh = String(dt.getHours()).padStart(2, '0');
          const mm = String(dt.getMinutes()).padStart(2, '0');
          const ss = String(dt.getSeconds()).padStart(2, '0');
          return `<div class="lco-item"><span class="lco-time">[${hh}:${mm}:${ss}]</span>${formatEventSummary(ev)}</div>`;
        })
        .join('');
    }
  }

  function formatEventSummary(ev) {
    switch (ev.type) {
      case 'burnIncense':
        return `🔥 <strong>${escapeHtml(ev.user)}</strong> dâng ${ev.count} nén nhang (+${ev.merit} CĐ)`;
      case 'strikeWoodenFish':
        return `🪵 <strong>${escapeHtml(ev.user)}</strong> gõ mõ ${ev.count} nhịp (+${ev.merit} CĐ)`;
      case 'ringBell':
        return `🔔 <strong>${escapeHtml(ev.user)}</strong> thỉnh Đại Hồng Chung (+${ev.merit} CĐ)`;
      case 'sendPrayer':
        return `🏮 <strong>${escapeHtml(ev.user)}</strong> cầu phúc: “${escapeHtml(ev.wish)}”`;
      case 'offerGift':
      case 'grandCeremony':
        return `🪷 <strong>${escapeHtml(ev.user)}</strong> dâng <em>${escapeHtml(ev.giftName)}</em> (+${ev.merit} CĐ)`;
      case 'drawFortune':
        return `🎋 <strong>${escapeHtml(ev.user)}</strong> gieo được Quẻ số ${ev.fortune?.number} (${ev.fortune?.rank})`;
      case 'memberJoin':
        return `👋 <strong>${escapeHtml(ev.user)}</strong> bước vào Chánh Điện (+${ev.merit || 2} Tâm Đức)`;
      default:
        return `✨ <strong>${escapeHtml(ev.user || 'Thí chủ')}</strong> tương tác`;
    }
  }

  // 7. Xử lý hiệu ứng khi có Nghi Thức mới
  let fortuneTimer = null;
  let grandTimer = null;
  let giftZoomTimer1 = null;
  let giftZoomTimer2 = null;

  function triggerGiftZoomSpotlight(ev, isGrand = false, isContinuation = false) {
    const centralEl = document.getElementById('centralWorshipper');
    const ghcLine = document.getElementById('ghcGiftLine');
    const combo = Math.max(1, Number(ev?.comboCount) || 1);
    const emoji = ev?.giftEmoji || (isGrand ? '🐉' : '🪷');
    if (ghcLine && ev) {
      const comboTag = combo > 1 ? ` (COMBO x${combo})` : '';
      ghcLine.textContent = `${emoji} ${ev.giftName || 'Lễ Vật Tâm Thành'}${comboTag} • +${Number(ev.merit || 20).toLocaleString('vi-VN')} CĐ`;
    }

    clearTimeout(giftZoomTimer1);
    clearTimeout(giftZoomTimer2);

    if (stage9x16) {
      stage9x16.classList.remove('gift-zoom-active', 'gift-zoom-grand');
      stage9x16.classList.add(isGrand ? 'gift-zoom-grand' : 'gift-zoom-active');
    }

    if (isContinuation) {
      // Nếu đang tặng Bông liên hoàn (x2, x3, x5...): Giữ nguyên góc máy cận cảnh tại bàn thờ, không giật lùi
      if (centralEl) {
        centralEl.classList.add(isGrand ? 'gift-zoom-focus-grand' : 'gift-zoom-focus');
      }
      particles.spawnIncenseBurst(540, 1020);
      particles.spawnBellWave(540, 1020, 2);
    } else {
      if (centralEl) {
        centralEl.classList.remove('gift-zoom-focus', 'gift-zoom-focus-grand');
      }
      // Khi thí chủ vừa bước lên tới trước Lư Hương (2.1s): Phóng cận cảnh nhân vật + bật vòng Pháp Luân Sen Vàng
      giftZoomTimer1 = setTimeout(() => {
        if (centralEl) {
          centralEl.classList.add(isGrand ? 'gift-zoom-focus-grand' : 'gift-zoom-focus');
        }
        particles.spawnIncenseBurst(540, 1020);
        particles.spawnBellWave(540, 1020, 2);
      }, 2080);
    }

    // Sau khi hoàn tất chuỗi lạy: Thu phóng mượt mà trở về toàn cảnh Chánh Điện
    giftZoomTimer2 = setTimeout(() => {
      if (stage9x16) {
        stage9x16.classList.remove('gift-zoom-active', 'gift-zoom-grand');
      }
      if (centralEl) {
        centralEl.classList.remove('gift-zoom-focus', 'gift-zoom-focus-grand');
      }
    }, isContinuation ? 5200 : 6900);
  }

  function triggerRitualVisuals(ev) {
    if (!ev) return;

    if (ev.ttsText && ev.type !== 'drawFortune') {
      audio.enqueueTts(ev.ttsText, {
        voice: ev.ttsVoice || 'maichi',
        priority: ev.ttsPriority || (ev.type === 'offerGift' || ev.type === 'grandCeremony' ? 3 : 1),
        userKey: ev.uniqueId || ev.user || ''
      });
    }

    switch (ev.type) {
      case 'burnIncense': {
        audio.playIncenseChime();
        particles.spawnIncenseBurst(540, 895);
        particles.spawnFloatingMerit(`+${ev.merit} Công Đức`, 540, 860, '#ffe082');
        animateWalkerOnCarpet(ev.user, ev.avatar, `🔥 Dâng ${ev.count} nén hương (+${ev.merit} CĐ)`, ev.wish);
        break;
      }

      case 'strikeWoodenFish': {
        audio.playWoodenFish();
        pulseHallBowing();
        particles.spawnFloatingMerit(`+${ev.merit} Công Đức`, 890, 935, '#ffd54f');
        break;
      }

      case 'ringBell': {
        audio.playTempleBell(1.0);
        pulseHallBowing();
        particles.spawnBellWave(540, 510, 4);
        particles.spawnFloatingMerit(`+${ev.merit} Công Đức`, 190, 935, '#fff3b0');
        updateCentralWorshipper(ev.user, ev.avatar, `🔔 Thỉnh Đại Hồng Chung (+${ev.merit} CĐ)`, ev.wish);
        break;
      }

      case 'sendPrayer': {
        audio.playIncenseChime();
        spawnSkyLantern(ev.user, ev.wish);
        particles.spawnFloatingMerit(`+${ev.merit} Công Đức`, 540, 920, '#ffb74d');
        animateWalkerOnCarpet(ev.user, ev.avatar, `🏮 Cầu phúc (+${ev.merit} CĐ)`, ev.wish);
        break;
      }

      case 'offerGift': {
        const emoji = ev.giftEmoji || '🌹';
        const combo = Math.max(1, Number(ev.comboCount) || 1);
        const isRose = Boolean(ev.isRoseGift || emoji === '🌹');
        const wishTag = ev.wishTitle ? ` • ${ev.wishTitle}` : '';
        const comboLabel = combo > 1 ? ` x${combo}` : '';

        audio.playGiftFanfare(combo >= 5);
        if (!ev.isComboContinuation || combo % 3 === 0) {
          audio.playTempleBell(0.85);
        }

        if (isRose) {
          particles.spawnRoseShower(combo);
          spawnRoseBloomRing(combo);
          if (ev.milestoneCeremony) {
            particles.spawnGrandCeremonyRain();
            showGrandCeremonyBanner(ev.user, 'ĐỦ 10 BÔNG HỒNG — KHAI MỞ ĐẠI LỄ CẦU AN', ev.merit * 2);
          }
        } else {
          particles.spawnIncenseBurst(540, 895);
        }

        if (ev.rankUpTo === 1) {
          showGrandCeremonyBanner(ev.user, '👑 SOÁN NGÔI SỐ 1 BẢNG VÀNG CÔNG ĐỨC', ev.merit);
        }

        particles.spawnFloatingMerit(
          `${emoji}${comboLabel} +${Number(ev.merit || 20).toLocaleString('vi-VN')} Tâm Đức`,
          540,
          840,
          isRose ? '#ff9ebb' : '#fff3b0'
        );
        pulseHallBowing(true);
        spawnFlyingGiftOffering(ev, false);
        showGiftComboBanner(ev, false);
        highlightSideGiftMenuItem(ev);

        if (ev.isComboContinuation) {
          // Đang nhấn tặng bông liên tiếp: Giữ thí chủ quỳ lạy tại chỗ trước bàn thờ, không chạy lại từ cuối thảm
          updateCentralWorshipper(
            ev.user,
            ev.avatar,
            `${emoji} Dâng ${ev.giftName}${comboLabel}${wishTag} (+${ev.merit} CĐ)`,
            ev.wish,
            true
          );
          triggerGiftZoomSpotlight(ev, false, true);
        } else {
          animateWalkerOnCarpet(
            ev.user,
            ev.avatar,
            `${emoji} Dâng ${ev.giftName}${comboLabel}${wishTag} (+${ev.merit} CĐ)`,
            ev.wish
          );
          triggerGiftZoomSpotlight(ev, false, false);
        }
        break;
      }

      case 'grandCeremony': {
        audio.playGiftFanfare(true);
        audio.playTempleBell(1.2);
        setTimeout(() => audio.playTempleBell(1.1), 900);
        particles.spawnGrandCeremonyRain();
        particles.spawnFloatingMerit(
          `🐉 ĐẠI LỄ +${Number(ev.merit || 500).toLocaleString('vi-VN')} TÂM ĐỨC`,
          540,
          820,
          '#ffd56b'
        );
        pulseHallBowing(true);
        spawnFlyingGiftOffering(ev, true);
        showGiftComboBanner(ev, true);
        highlightSideGiftMenuItem(ev);
        showGrandCeremonyBanner(ev.user, ev.giftName, ev.merit);
        animateWalkerOnCarpet(ev.user, ev.avatar, `🐉 ${ev.giftName} (+${ev.merit} CĐ)`, ev.wish);
        triggerGiftZoomSpotlight(ev, true);
        break;
      }

      case 'drawFortune': {
        audio.playFortuneShake();
        updateCentralWorshipper(
          ev.user,
          ev.avatar,
          `🎋 Đang xin xăm...`,
          `Thí chủ ${ev.user} đang thành tâm xin quẻ...`,
          false
        );
        // Chỉ hiển thị tờ Quẻ Xăm đúng thời điểm giọng đọc bắt đầu vang lên!
        audio.enqueueTts(ev.ttsText || '', {
          voice: ev.ttsVoice || 'maichi',
          onStart: () => {
            audio.playIncenseChime();
            showFortuneModal(ev.user, ev.fortune);
            updateCentralWorshipper(
              ev.user,
              ev.avatar,
              `🎋 Quẻ số ${ev.fortune?.number} (${ev.fortune?.rank})`,
              ev.fortune?.meaning || '',
              true
            );
          },
          onEnd: () => {
            clearTimeout(fortuneTimer);
            fortuneTimer = setTimeout(() => {
              document.getElementById('fortuneModal')?.classList.remove('visible');
            }, 1800);
          }
        });
        break;
      }

      case 'memberJoin': {
        audio.playWelcomeChime();
        particles.spawnWelcomeBurst(540, 1220);
        particles.spawnFloatingMerit(
          `👋 ${shortenName(ev.user, 14)} +${ev.merit || 2} Tâm Đức`,
          540,
          960,
          '#ffe57f'
        );
        showMemberWelcomeBanner(ev);
        spawnCarpetGuestWalker(ev);

        // Hào quang Đức Phật bừng sáng chúc phúc người mới vào
        const haloSys = document.getElementById('buddhaHaloSystem');
        const lotusHand = document.getElementById('lotusHandHalo');
        if (haloSys) {
          haloSys.classList.add('flare');
          setTimeout(() => haloSys.classList.remove('flare'), 2600);
        }
        if (lotusHand) {
          lotusHand.classList.add('flare');
          setTimeout(() => lotusHand.classList.remove('flare'), 2600);
        }

        // Nếu hàng đợi đọc khấn đang rảnh (hoặc bấm nút Test), đọc lời chào thí chủ mới vào
        const nowMs = Date.now();
        if (
          ev.welcomeTtsText &&
          (ev.forceTts || (!audio.ttsPlaying && audio.ttsQueue.length === 0 && nowMs - lastWelcomeTtsTime > 10000))
        ) {
          lastWelcomeTtsTime = nowMs;
          audio.enqueueTts(ev.welcomeTtsText, { voice: ev.ttsVoice || 'maichi' });
        }
        break;
      }
    }
  }

  let lastWelcomeTtsTime = 0;

  function showMemberWelcomeBanner(ev) {
    const layer = document.getElementById('memberWelcomeLayer');
    if (!layer || !ev) return;

    while (layer.children.length >= 2) {
      layer.firstElementChild.remove();
    }

    const card = document.createElement('div');
    card.className = 'member-welcome-card';
    const avatarHtml = ev.avatar
      ? `<img src="${escapeHtml(ev.avatar)}" alt="" />`
      : `<span>${escapeHtml(String(ev.user || '🙏').trim().charAt(0).toUpperCase())}</span>`;

    card.innerHTML = `
      <div class="mwc-avatar-wrap">
        <div class="mwc-lotus-ring"></div>
        <div class="mwc-avatar">${avatarHtml}</div>
      </div>
      <div class="mwc-body">
        <div class="mwc-overline">🪷 NGHÊNH ĐÓN THÍ CHỦ HỮU DUYÊN • +${Number(ev.merit || 2)} TÂM ĐỨC</div>
        <div class="mwc-username">${escapeHtml(shortenName(ev.user, 20))}</div>
        <div class="mwc-sub">Bước vào Chánh Điện lễ Phật • Chúc bình an cát tường</div>
      </div>
    `;

    layer.appendChild(card);
    setTimeout(() => {
      card.classList.add('out');
      setTimeout(() => card.remove(), 550);
    }, 3900);
  }

  let walkerSeqCounter = 0;
  let lastWalkerSpawnMs = 0;

  function spawnFootprintRipple(layer, x, y, scale = 1, isExit = false) {
    if (!layer) return;
    const fp = document.createElement('div');
    fp.className = `carpet-footprint-ripple${isExit ? ' fp-exit' : ''}`;
    fp.style.left = `${Math.round(x)}px`;
    fp.style.top = `${Math.round(y)}px`;
    fp.style.setProperty('--fp-scale', String(scale));
    fp.innerHTML = `<span class="fp-lotus">🪷</span>`;
    layer.appendChild(fp);
    setTimeout(() => fp.remove(), 1100);
  }

  function flashHallSeatArrival(seatIdx, user, avatar) {
    if (!congregationHall) return;
    const seatEl = congregationHall.querySelector(`.hall-seat[data-seat-idx="${seatIdx}"]`);
    if (!seatEl) return;

    seatEl.classList.remove('seat-arrival-flash');
    void seatEl.offsetWidth;
    seatEl.classList.add('seat-arrival-flash');

    if (user) {
      let badge = seatEl.querySelector('.seat-badge');
      if (!badge) {
        badge = document.createElement('div');
        badge.className = 'seat-badge';
        seatEl.appendChild(badge);
      }
      const avatarHtml = avatar
        ? `<img src="${escapeHtml(avatar)}" alt="" />`
        : escapeHtml(String(user || 'P').trim().charAt(0).toUpperCase());
      badge.innerHTML = `
        <span class="seat-avatar">${avatarHtml}</span>
        <span class="seat-username">${escapeHtml(shortenName(user, 11))}</span>
      `;
    }

    setTimeout(() => {
      seatEl.classList.remove('seat-arrival-flash');
    }, 2400);
  }

  function spawnCarpetGuestWalker(ev) {
    const layer = document.getElementById('carpetWalkerLayer');
    if (!layer || !ev) return;

    lastWalkerSpawnMs = Date.now();
    walkerSeqCounter++;

    // Giới hạn tối đa 6 nhân vật đang di chuyển cùng lúc để khung hình mượt
    const activeWalkers = layer.querySelectorAll('.carpet-guest-walker');
    if (activeWalkers.length >= 6) {
      activeWalkers[0].remove();
    }

    // Luân phiên: 2/3 khách sau khi lạy Phật sẽ đi vào ngồi ghế Đạo Tràng, 1/3 khách lạy xong sẽ đi dọc hành lang ra về
    const mode = walkerSeqCounter % 3 === 0 ? 'aisleExit' : 'takeSeat';
    const startX = 540 + Math.round((Math.random() - 0.5) * 86);
    const startY = 1865;
    const startScale = 1.22;

    const stopX = 540 + Math.round((Math.random() - 0.5) * 94);
    const stopY = 1320 + Math.round(Math.random() * 58);
    const stopScale = +(0.92 + ((stopY - 1320) / 400) * 0.1).toFixed(2);

    const avatarHtml = ev.avatar
      ? `<img src="${escapeHtml(ev.avatar)}" alt="" />`
      : escapeHtml(String(ev.user || 'P').trim().charAt(0).toUpperCase());

    const walker = document.createElement('div');
    walker.className = 'carpet-guest-walker cgw-walking cgw-entering';
    walker.style.left = `${startX}px`;
    walker.style.top = `${startY}px`;
    walker.style.setProperty('--cgw-scale', String(startScale));
    walker.style.setProperty('--cgw-lean', '0deg');
    walker.style.setProperty('--cgw-move-ms', '2250ms');

    walker.innerHTML = `
      <div class="cgw-status-bubble">🙏 Thành tâm tiến lễ...</div>
      <div class="cgw-body-rig">
        <div class="cgw-aura-halo"></div>
        <img src="${SPRITE_FRAMES.walk1}" class="cgw-sprite" alt="" />
      </div>
      <div class="cgw-ground-shadow"></div>
      <div class="cgw-lotus-step"></div>
      <div class="cgw-prostrate-wave"></div>
      <div class="cgw-badge">
        <span class="cgw-avatar">${avatarHtml}</span>
        <span class="cgw-name">👋 ${escapeHtml(shortenName(ev.user, 16))}</span>
      </div>
    `;

    layer.appendChild(walker);
    const spriteEl = walker.querySelector('.cgw-sprite');
    const statusEl = walker.querySelector('.cgw-status-bubble');
    const waveEl = walker.querySelector('.cgw-prostrate-wave');
    const stepTimers = [];

    // Bắt đầu di chuyển từ cổng Tam Quan (y=1865) lên trước bàn thờ (y=stopY)
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const leanDeg = ((stopX - startX) * 0.04).toFixed(1);
        walker.style.setProperty('--cgw-lean', `${leanDeg}deg`);
        walker.style.left = `${stopX}px`;
        walker.style.top = `${stopY}px`;
        walker.style.setProperty('--cgw-scale', String(stopScale));
      });
    });

    // Bước chân 1 -> 12 (0ms -> 2160ms) kèm dấu chân hoa sen nở trên thảm đỏ
    const totalWalkInSteps = 12;
    for (let step = 1; step <= totalWalkInSteps; step++) {
      stepTimers.push(
        setTimeout(() => {
          if (!walker.isConnected) return;
          if (spriteEl) {
            spriteEl.src = step % 2 === 0 ? SPRITE_FRAMES.walk1 : SPRITE_FRAMES.walk2;
          }
          const t = step / totalWalkInSteps;
          const curX = startX + (stopX - startX) * t + (step % 2 === 0 ? -11 : 11);
          const curY = startY + (stopY - startY) * t;
          const curScale = +(startScale + (stopScale - startScale) * t).toFixed(2);
          if (step % 2 === 1 || step === totalWalkInSteps) {
            spawnFootprintRipple(layer, curX, curY, curScale, false);
          }
        }, step * 180)
      );
    }

    // Giai đoạn 2: Dừng bước, hạ gối quỳ và Đảnh lễ 2 lạy trang nghiêm (2250ms -> 5100ms)
    const bowTimeline = [
      [2250, SPRITE_FRAMES.kneelDown, 'cgw-kneel-down', '🙇 Hạ gối kính lễ Tam Bảo...'],
      [2420, SPRITE_FRAMES.kneel, 'cgw-kneel', `🙏 Cầu bình an • +${Number(ev.merit || 2)} Tâm Đức`],
      [2600, SPRITE_FRAMES.forehead, 'cgw-bow-prep', ''],
      [2780, SPRITE_FRAMES.bowMid, 'cgw-bow-mid', ''],
      [2960, SPRITE_FRAMES.prostrate, 'cgw-bow-low', ''],
      [3120, SPRITE_FRAMES.prostrateDeep, 'cgw-bow-deep', '✨ Nhất tâm đảnh lễ A Di Đà Phật'],
      [3520, SPRITE_FRAMES.bowMid, 'cgw-bow-mid', ''],
      [3700, SPRITE_FRAMES.kneel, 'cgw-kneel', ''],
      [3920, SPRITE_FRAMES.forehead, 'cgw-bow-prep', ''],
      [4090, SPRITE_FRAMES.bowMid, 'cgw-bow-mid', ''],
      [4260, SPRITE_FRAMES.prostrateDeep, 'cgw-bow-deep', '🪷 Nguyện cầu gia đạo bình an'],
      [4680, SPRITE_FRAMES.bowMid, 'cgw-bow-mid', ''],
      [4880, SPRITE_FRAMES.kneel, 'cgw-kneel', '']
    ];

    bowTimeline.forEach(([ms, src, poseClass, bubbleText]) => {
      stepTimers.push(
        setTimeout(() => {
          if (!walker.isConnected) return;
          walker.classList.remove(
            'cgw-walking',
            'cgw-entering',
            'cgw-kneel-down',
            'cgw-kneel',
            'cgw-bow-prep',
            'cgw-bow-mid',
            'cgw-bow-low',
            'cgw-bow-deep'
          );
          walker.classList.add('cgw-praying', poseClass);
          walker.style.setProperty('--cgw-lean', '0deg');
          if (spriteEl) spriteEl.src = src;
          if (bubbleText && statusEl) statusEl.textContent = bubbleText;

          if (poseClass === 'cgw-bow-deep' && waveEl) {
            waveEl.classList.remove('active');
            void waveEl.offsetWidth;
            waveEl.classList.add('active');
            pulseHallBowing(false);
          }
        }, ms)
      );
    });

    // Giai đoạn 3: Đứng dậy và đi vào hàng ghế Đạo Tràng HOẶC bước ra theo lối hành lang hai bên (5120ms -> 7350ms)
    stepTimers.push(
      setTimeout(() => {
        if (!walker.isConnected) return;
        walker.classList.remove('cgw-praying', 'cgw-kneel', 'cgw-bow-mid', 'cgw-bow-deep');
        if (spriteEl) spriteEl.src = SPRITE_FRAMES.kneelDown;
      }, 5080)
    );

    if (mode === 'takeSeat' && HALL_SEAT_COORDS.length > 0) {
      const candidateIndices = [3, 4, 11, 12, 19, 20, 27, 28, 2, 5, 10, 13, 18, 21, 26, 29];
      const chosenSeatIdx = candidateIndices[walkerSeqCounter % candidateIndices.length];
      const targetSeat = HALL_SEAT_COORDS[chosenSeatIdx] || HALL_SEAT_COORDS[0];
      const seatMoveMs = 1650;

      stepTimers.push(
        setTimeout(() => {
          if (!walker.isConnected) return;
          walker.classList.add('cgw-walking', 'cgw-moving-to-seat');
          if (statusEl) statusEl.textContent = '🪷 Vào hàng ghế Đạo Tràng';
          const dx = targetSeat.x - stopX;
          walker.style.setProperty('--cgw-lean', dx < 0 ? '-4.5deg' : '4.5deg');
          walker.style.setProperty('--cgw-move-ms', `${seatMoveMs}ms`);
          walker.style.left = `${targetSeat.x}px`;
          walker.style.top = `${targetSeat.y}px`;
          walker.style.setProperty('--cgw-scale', String(targetSeat.scale));
        }, 5220)
      );

      const seatSteps = 9;
      for (let s = 1; s <= seatSteps; s++) {
        stepTimers.push(
          setTimeout(() => {
            if (!walker.isConnected) return;
            if (spriteEl) {
              spriteEl.src = s % 2 === 0 ? SPRITE_FRAMES.walk1 : SPRITE_FRAMES.walk2;
            }
            const t = s / seatSteps;
            const cx = stopX + (targetSeat.x - stopX) * t;
            const cy = stopY + (targetSeat.y - stopY) * t;
            if (s % 2 === 1) {
              spawnFootprintRipple(layer, cx, cy, targetSeat.scale, false);
            }
          }, 5220 + s * 175)
        );
      }

      stepTimers.push(
        setTimeout(() => {
          if (!walker.isConnected) return;
          walker.classList.remove('cgw-walking', 'cgw-moving-to-seat');
          walker.classList.add('cgw-merge-seat');
          walker.style.setProperty('--cgw-lean', '0deg');
          if (spriteEl) spriteEl.src = SPRITE_FRAMES.kneel;
          flashHallSeatArrival(chosenSeatIdx, ev.user, ev.avatar);
        }, 6880)
      );

      stepTimers.push(
        setTimeout(() => {
          while (stepTimers.length) clearTimeout(stepTimers.pop());
          walker.remove();
        }, 7450)
      );
    } else {
      // Kịch bản đi ra dọc theo hành lang thảm đỏ (trái hoặc phải) về phía cổng dưới màn hình
      const goLeft = walkerSeqCounter % 2 === 0;
      const aisleX = goLeft
        ? 368 + Math.round((Math.random() - 0.5) * 28)
        : 712 + Math.round((Math.random() - 0.5) * 28);
      const exitY = 1885;
      const exitScale = 1.24;
      const exitMoveMs = 2150;

      stepTimers.push(
        setTimeout(() => {
          if (!walker.isConnected) return;
          walker.classList.add('cgw-walking', 'cgw-exiting-aisle');
          if (statusEl) statusEl.textContent = '✨ Nhận phước lành • Hoan hỷ';
          walker.style.setProperty('--cgw-lean', goLeft ? '-3deg' : '3deg');
          walker.style.setProperty('--cgw-move-ms', `${exitMoveMs}ms`);
          walker.style.left = `${aisleX}px`;
          walker.style.top = `${exitY}px`;
          walker.style.setProperty('--cgw-scale', String(exitScale));
        }, 5220)
      );

      const exitSteps = 11;
      for (let s = 1; s <= exitSteps; s++) {
        stepTimers.push(
          setTimeout(() => {
            if (!walker.isConnected) return;
            if (spriteEl) {
              spriteEl.src = s % 2 === 0 ? SPRITE_FRAMES.walk1 : SPRITE_FRAMES.walk2;
            }
            const t = s / exitSteps;
            const cx = stopX + (aisleX - stopX) * t + (s % 2 === 0 ? -9 : 9);
            const cy = stopY + (exitY - stopY) * t;
            const cs = +(stopScale + (exitScale - stopScale) * t).toFixed(2);
            if (s % 2 === 1) {
              spawnFootprintRipple(layer, cx, cy, cs, true);
            }
          }, 5220 + s * 185)
        );
      }

      stepTimers.push(
        setTimeout(() => {
          if (!walker.isConnected) return;
          walker.classList.add('cgw-fade-exit');
        }, 7100)
      );

      stepTimers.push(
        setTimeout(() => {
          while (stepTimers.length) clearTimeout(stepTimers.pop());
          walker.remove();
        }, 7600)
      );
    }
  }

  // Hiệu ứng Phật tử từ hàng ghế Đạo Tràng đứng dậy, bước ra thảm đỏ vái tạ Phật rồi đi về
  let leavingPilgrimCounter = 0;

  function spawnLeavingDevotee(customName) {
    const layer = document.getElementById('carpetWalkerLayer');
    if (!layer || !HALL_SEAT_COORDS.length) return;

    const activeWalkers = layer.querySelectorAll('.carpet-guest-walker');
    if (activeWalkers.length >= 5) return;

    leavingPilgrimCounter++;
    const seatPool = [3, 4, 11, 12, 19, 20, 27, 28];
    const seatIdx = seatPool[leavingPilgrimCounter % seatPool.length];
    const seat = HALL_SEAT_COORDS[seatIdx] || HALL_SEAT_COORDS[3];

    const seatEl = congregationHall?.querySelector(`.hall-seat[data-seat-idx="${seatIdx}"]`);
    const seatNameEl = seatEl?.querySelector('.seat-username');
    const pilgrimName = customName || seatNameEl?.textContent || 'Thí Chủ Hữu Duyên';

    if (seatEl) {
      seatEl.classList.add('seat-temporarily-standing');
      setTimeout(() => seatEl.classList.remove('seat-temporarily-standing'), 4200);
    }

    const aisleX = seat.side === 'L' ? 405 : 675;
    const bowY = Math.max(1340, seat.y - 10);
    const exitX = seat.side === 'L' ? 375 : 705;
    const exitY = 1885;

    const walker = document.createElement('div');
    walker.className = 'carpet-guest-walker cgw-leaving-guest';
    walker.style.left = `${seat.x}px`;
    walker.style.top = `${seat.y}px`;
    walker.style.setProperty('--cgw-scale', String(seat.scale));
    walker.style.setProperty('--cgw-lean', '0deg');
    walker.style.setProperty('--cgw-move-ms', '850ms');

    const initialChar = escapeHtml(String(pilgrimName || 'P').trim().charAt(0).toUpperCase());
    walker.innerHTML = `
      <div class="cgw-status-bubble">🙏 Lễ tạ Tam Bảo...</div>
      <div class="cgw-body-rig">
        <div class="cgw-aura-halo"></div>
        <img src="${SPRITE_FRAMES.kneelDown}" class="cgw-sprite" alt="" />
      </div>
      <div class="cgw-ground-shadow"></div>
      <div class="cgw-lotus-step"></div>
      <div class="cgw-prostrate-wave"></div>
      <div class="cgw-badge cgw-badge-exit">
        <span class="cgw-avatar">${initialChar}</span>
        <span class="cgw-name">🌸 ${escapeHtml(shortenName(pilgrimName, 15))}</span>
      </div>
    `;

    layer.appendChild(walker);
    const spriteEl = walker.querySelector('.cgw-sprite');
    const statusEl = walker.querySelector('.cgw-status-bubble');
    const waveEl = walker.querySelector('.cgw-prostrate-wave');
    const timers = [];

    // Bước 1: Đứng dậy từ ghế ngồi bước ra mép thảm đỏ (0ms -> 880ms)
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        walker.classList.add('cgw-walking');
        walker.style.setProperty('--cgw-lean', seat.side === 'L' ? '3.5deg' : '-3.5deg');
        walker.style.left = `${aisleX}px`;
        walker.style.top = `${bowY}px`;
      });
    });

    for (let s = 1; s <= 4; s++) {
      timers.push(
        setTimeout(() => {
          if (spriteEl) spriteEl.src = s % 2 === 0 ? SPRITE_FRAMES.walk1 : SPRITE_FRAMES.walk2;
        }, s * 190)
      );
    }

    // Bước 2: Chắp tay cúi xá lễ tạ trước khi ra về (900ms -> 1850ms)
    timers.push(
      setTimeout(() => {
        if (!walker.isConnected) return;
        walker.classList.remove('cgw-walking');
        walker.classList.add('cgw-praying', 'cgw-bow-prep');
        walker.style.setProperty('--cgw-lean', '0deg');
        if (spriteEl) spriteEl.src = SPRITE_FRAMES.forehead;
      }, 900)
    );
    timers.push(
      setTimeout(() => {
        if (!walker.isConnected) return;
        walker.classList.add('cgw-bow-mid');
        if (spriteEl) spriteEl.src = SPRITE_FRAMES.bowMid;
        if (waveEl) {
          waveEl.classList.remove('active');
          void waveEl.offsetWidth;
          waveEl.classList.add('active');
        }
      }, 1150)
    );
    timers.push(
      setTimeout(() => {
        if (!walker.isConnected) return;
        walker.classList.remove('cgw-bow-mid');
        if (spriteEl) spriteEl.src = SPRITE_FRAMES.forehead;
      }, 1550)
    );

    // Bước 3: Bước dọc hành lang thảm đỏ đi ra cổng Tam Quan (1820ms -> 3950ms)
    timers.push(
      setTimeout(() => {
        if (!walker.isConnected) return;
        walker.classList.remove('cgw-praying', 'cgw-bow-prep');
        walker.classList.add('cgw-walking', 'cgw-exiting-aisle');
        if (statusEl) statusEl.textContent = '✨ Bình an hoan hỷ ra về';
        walker.style.setProperty('--cgw-move-ms', '2050ms');
        walker.style.setProperty('--cgw-lean', seat.side === 'L' ? '-2.5deg' : '2.5deg');
        walker.style.left = `${exitX}px`;
        walker.style.top = `${exitY}px`;
        walker.style.setProperty('--cgw-scale', '1.22');
      }, 1820)
    );

    const outSteps = 10;
    for (let s = 1; s <= outSteps; s++) {
      timers.push(
        setTimeout(() => {
          if (!walker.isConnected) return;
          if (spriteEl) spriteEl.src = s % 2 === 0 ? SPRITE_FRAMES.walk1 : SPRITE_FRAMES.walk2;
          const t = s / outSteps;
          const cx = aisleX + (exitX - aisleX) * t + (s % 2 === 0 ? -8 : 8);
          const cy = bowY + (exitY - bowY) * t;
          const cs = +(seat.scale + (1.22 - seat.scale) * t).toFixed(2);
          if (s % 2 === 1) {
            spawnFootprintRipple(layer, cx, cy, cs, true);
          }
        }, 1820 + s * 190)
      );
    }

    timers.push(
      setTimeout(() => {
        if (walker.isConnected) walker.classList.add('cgw-fade-exit');
      }, 3650)
    );
    timers.push(
      setTimeout(() => {
        while (timers.length) clearTimeout(timers.pop());
        walker.remove();
      }, 4150)
    );
  }

  function _legacySpawnCarpetGuestWalker(ev) {
    const layer = document.getElementById('carpetWalkerLayer');
    if (!layer || !ev) return;

    // Giới hạn tối đa 4 khách đang bước đi cùng lúc để khung hình mượt
    while (layer.children.length >= 4) {
      layer.firstElementChild.remove();
    }

    const walker = document.createElement('div');
    walker.className = 'carpet-guest-walker';
    const offsetX = Math.round((Math.random() - 0.5) * 96);
    walker.style.left = `${540 + offsetX}px`;

    const avatarHtml = ev.avatar
      ? `<img src="${escapeHtml(ev.avatar)}" alt="" />`
      : escapeHtml(String(ev.user || 'P').trim().charAt(0).toUpperCase());

    walker.innerHTML = `
      <div class="cgw-lotus-step"></div>
      <img src="${SPRITE_FRAMES.walk1}" class="cgw-sprite" alt="" />
      <div class="cgw-badge">
        <span class="cgw-avatar">${avatarHtml}</span>
        <span class="cgw-name">👋 ${escapeHtml(shortenName(ev.user, 16))}</span>
      </div>
    `;

    layer.appendChild(walker);
    const spriteEl = walker.querySelector('.cgw-sprite');
    const stepTimers = [];

    // Bước đi từng nhịp dọc thảm đỏ (0 -> 1.95s)
    for (let step = 1; step <= 10; step++) {
      stepTimers.push(
        setTimeout(() => {
          if (spriteEl) {
            spriteEl.src = step % 2 === 0 ? SPRITE_FRAMES.walk1 : SPRITE_FRAMES.walk2;
          }
        }, step * 185)
      );
    }

    // Dừng bước trước bàn thờ, hạ gối quỳ và vái 1 lạy trang nghiêm (2.0s -> 3.6s)
    const bowFrames = [
      [2000, SPRITE_FRAMES.kneelDown],
      [2160, SPRITE_FRAMES.kneel],
      [2320, SPRITE_FRAMES.forehead],
      [2500, SPRITE_FRAMES.bowMid],
      [2680, SPRITE_FRAMES.prostrateDeep],
      [3100, SPRITE_FRAMES.bowMid],
      [3280, SPRITE_FRAMES.kneel]
    ];
    bowFrames.forEach(([ms, src]) => {
      stepTimers.push(
        setTimeout(() => {
          if (spriteEl) spriteEl.src = src;
        }, ms)
      );
    });

    // Tỏa sáng hào quang rồi nhập vào hàng ghế Đạo Tràng
    setTimeout(() => {
      walker.classList.add('cgw-ascend-out');
      pulseHallBowing();
    }, 3550);

    setTimeout(() => {
      while (stepTimers.length) clearTimeout(stepTimers.pop());
      walker.remove();
    }, 4100);
  }

  // 7C. Hiệu ứng Lễ Vật / Chùm Bông Hồng Dâng Bay Lên Đài Sen Trên Tay Đức Phật & Nổ Pháo Hoa Pháp Vũ
  function spawnFlyingGiftOffering(ev, isGrand = false) {
    const layer = document.getElementById('giftOfferingLayer');
    if (!layer || !ev) return;

    const emoji = ev.giftEmoji || (isGrand ? '🐉' : '🌹');
    const combo = Math.max(1, Number(ev.comboCount) || 1);
    const isRose = Boolean(ev.isRoseGift || emoji === '🌹');

    // Khi tặng Bông Hồng: Phóng chùm 3 -> 6 đóa bông hồng từ nhiều hướng bay hội tụ lên Đài Sen Phật!
    const orbCount = isGrand ? 4 : isRose ? Math.min(6, 2 + Math.ceil(combo / 2)) : 2;
    const spreadOffsets = [-210, 210, -110, 110, -50, 50];

    for (let i = 0; i < orbCount; i++) {
      setTimeout(() => {
        const orb = document.createElement('div');
        orb.className = `flying-gift-orb${isGrand ? ' grand-orb' : ''}${isRose ? ' rose-orb' : ''}`;
        const startOffsetX = spreadOffsets[i % spreadOffsets.length] + Math.round((Math.random() - 0.5) * 36);
        orb.style.setProperty('--start-x', `${startOffsetX}px`);

        const iconInner = ev.giftIcon
          ? `<img src="${escapeHtml(ev.giftIcon)}" alt="" class="fgo-img" />`
          : `<span class="fgo-emoji">${emoji}</span>`;

        orb.innerHTML = `
          <div class="fgo-aura-ring"></div>
          <div class="fgo-core">${iconInner}</div>
          <div class="fgo-trail"></div>
        `;
        layer.appendChild(orb);

        // Khi bông hồng đầu tiên chạm tới Đài Sen trên tay Đức Phật (950ms): Nổ pháo hoa Pháp Vũ + bừng sáng hào quang!
        if (i === 0 || i === orbCount - 1) {
          setTimeout(() => {
            particles.spawnGiftFireworks(540, 490, isGrand || combo >= 5);
            const haloSys = document.getElementById('buddhaHaloSystem');
            const lotusHand = document.getElementById('lotusHandHalo');
            if (haloSys) {
              haloSys.classList.add('flare');
              setTimeout(() => haloSys.classList.remove('flare'), 3600);
            }
            if (lotusHand) {
              lotusHand.classList.add('flare');
              setTimeout(() => lotusHand.classList.remove('flare'), 3600);
            }
          }, 950);
        }

        setTimeout(() => {
          orb.remove();
        }, 1420);
      }, i * 115);
    }
  }

  // Hiệu ứng Vòng Hoa Hồng Nở Rộ Quanh Bàn Thờ & Thí Chủ khi tặng bông nhiều
  let totalRosesOfferedSession = 0;

  function spawnRoseBloomRing(combo = 1) {
    const layer = document.getElementById('giftOfferingLayer');
    if (!layer) return;

    totalRosesOfferedSession += 1;
    const peaceItemSub = document.querySelector('#giftItemPeace .sgm-gift-name');
    if (peaceItemSub) {
      peaceItemSub.textContent = `Hoa hồng (1 xu) • ${totalRosesOfferedSession} 🌹`;
    }

    const bloomCount = Math.min(10, 4 + combo);
    for (let i = 0; i < bloomCount; i++) {
      const bloom = document.createElement('div');
      bloom.className = 'floating-rose-bloom';
      const x = 180 + Math.round(Math.random() * 720);
      const y = 780 + Math.round(Math.random() * 380);
      const scale = (0.75 + Math.random() * 0.65).toFixed(2);
      bloom.style.left = `${x}px`;
      bloom.style.top = `${y}px`;
      bloom.style.setProperty('--bloom-scale', scale);
      bloom.textContent = i % 4 === 0 ? '🪷' : '🌹';
      layer.appendChild(bloom);

      setTimeout(() => {
        bloom.remove();
      }, 2100);
    }
  }

  let giftComboBannerTimer = null;

  function showGiftComboBanner(ev, isGrand = false) {
    const layer = document.getElementById('giftComboBannerLayer');
    if (!layer || !ev) return;

    const emoji = ev.giftEmoji || (isGrand ? '🐉' : '🌹');
    const combo = Math.max(1, Number(ev.comboCount) || 1);
    const isRose = Boolean(ev.isRoseGift || emoji === '🌹');
    const wishTitle = ev.wishTitle || (isGrand ? 'Đại Lễ Cầu An' : 'Cầu Bình An');
    const avatarHtml = ev.avatar
      ? `<img src="${escapeHtml(ev.avatar)}" alt="" />`
      : `<span>${escapeHtml(String(ev.user || '🙏').trim().charAt(0).toUpperCase())}</span>`;

    const iconHtml = ev.giftIcon
      ? `<img src="${escapeHtml(ev.giftIcon)}" alt="" class="gcb-gift-img" />`
      : `<span class="gcb-gift-emoji">${emoji}</span>`;

    const topTagText =
      ev.rankUpTo === 1
        ? `👑 TÂN QUÁN QUÂN SỐ 1 BẢNG VÀNG • +${Number(ev.merit || 20).toLocaleString('vi-VN')} TÂM ĐỨC`
        : ev.rankUpTo > 0
          ? `🏆 VƯƠN LÊN TOP #${ev.rankUpTo} BẢNG VÀNG • +${Number(ev.merit || 20).toLocaleString('vi-VN')} TÂM ĐỨC`
          : combo >= 2 && isRose
            ? `🌹 BÃO HOA HỒNG LIÊN HOÀN x${combo} • +${Number(ev.merit * combo).toLocaleString('vi-VN')} TÂM ĐỨC`
            : `✨ ${wishTitle.toUpperCase()} • +${Number(ev.merit || 20).toLocaleString('vi-VN')} TÂM ĐỨC`;

    const oracleSub = ev.giftOracle
      ? `<div class="gcb-oracle-line">📜 ${escapeHtml(ev.giftOracle)}</div>`
      : '';

    layer.innerHTML = `
      <div class="gift-combo-banner ${isGrand || ev.rankUpTo === 1 ? 'grand' : ''} ${isRose && combo >= 2 ? 'rose-storm' : ''}">
        <div class="gcb-avatar-box">
          <div class="gcb-crown">${ev.rankUpTo === 1 || combo >= 5 ? '👑' : '🌹'}</div>
          <div class="gcb-avatar-ring"></div>
          <div class="gcb-avatar">${avatarHtml}</div>
        </div>
        <div class="gcb-info">
          <div class="gcb-top-tag">${escapeHtml(topTagText)}</div>
          <div class="gcb-user-line">${escapeHtml(shortenName(ev.user, 17))}</div>
          <div class="gcb-gift-line">Dâng cúng <strong>${escapeHtml(ev.giftName || 'Hoa Hồng')}</strong> ${combo >= 2 ? `<em>(Liên hoàn ${combo} bông!)</em>` : ''}</div>
          ${oracleSub}
        </div>
        <div class="gcb-combo-right">
          <div class="gcb-icon-circle">${iconHtml}</div>
          <div class="gcb-combo-mult">x${combo}</div>
        </div>
      </div>
    `;

    clearTimeout(giftComboBannerTimer);
    giftComboBannerTimer = setTimeout(() => {
      const bannerEl = layer.querySelector('.gift-combo-banner');
      if (bannerEl) {
        bannerEl.classList.add('out');
        setTimeout(() => {
          layer.innerHTML = '';
        }, 520);
      }
    }, 5200);
  }

  let sideGiftHighlightTimer = null;

  function highlightSideGiftMenuItem(ev) {
    if (!ev) return;
    const allItems = document.querySelectorAll('.side-gift-menu .sgm-item');
    allItems.forEach((el) => el.classList.remove('gift-active-glow'));

    const lower = `${ev.giftName || ''} ${ev.wishTitle || ''}`.toLowerCase();
    let targetId = 'giftItemPeace';
    if (lower.includes('tình duyên') || lower.includes('bắn tim') || lower.includes('finger') || ev.coins === 5) {
      targetId = 'giftItemLove';
    } else if (lower.includes('gia đình') || lower.includes('donut') || ev.coins === 30) {
      targetId = 'giftItemFamily';
    } else if (lower.includes('làm ăn') || lower.includes('đèn') || lower.includes('tim') || ev.coins === 10) {
      targetId = 'giftItemWealth';
    } else if (lower.includes('sức khỏe') || lower.includes('sen') || lower.includes('lotus') || ev.coins >= 20) {
      targetId = 'giftItemHealth';
    }

    const targetEl = document.getElementById(targetId);
    if (targetEl) {
      targetEl.classList.add('gift-active-glow');
      clearTimeout(sideGiftHighlightTimer);
      sideGiftHighlightTimer = setTimeout(() => {
        targetEl.classList.remove('gift-active-glow');
      }, 4800);
    }
  }

  function spawnSkyLantern(user, wish) {
    const layer = document.getElementById('skyLanternsLayer');
    if (!layer) return;
    const lantern = document.createElement('div');
    lantern.className = 'sky-lantern';
    const leftPos = 80 + Math.floor(Math.random() * 640);
    lantern.style.left = `${leftPos}px`;
    lantern.innerHTML = `
      <div class="sky-lantern-user">🙏 ${escapeHtml(user)}</div>
      <div class="sky-lantern-wish">“${escapeHtml(wish)}”</div>
    `;
    layer.appendChild(lantern);
    setTimeout(() => {
      lantern.remove();
    }, 10600);
  }

  function showFortuneModal(user, fortune) {
    if (!fortune) return;
    const modal = document.getElementById('fortuneModal');
    document.getElementById('fortuneRankBadge').textContent = fortune.rank.toUpperCase();
    document.getElementById('fortuneTitle').textContent = `Quẻ Số ${fortune.number} — ${fortune.title}`;
    document.getElementById('fortuneDevotee').textContent = `Thí chủ cầu quẻ: ${user}`;
    document.getElementById('fortunePoem').textContent = fortune.poem;
    document.getElementById('fortuneMeaning').textContent = `Lời bàn: ${fortune.meaning}`;

    modal.classList.add('visible');
    clearTimeout(fortuneTimer);
    fortuneTimer = setTimeout(() => {
      modal.classList.remove('visible');
    }, 15000);
  }

  document.getElementById('fortuneModal')?.addEventListener('click', () => {
    document.getElementById('fortuneModal').classList.remove('visible');
  });

  function showGrandCeremonyBanner(user, giftName, merit) {
    const banner = document.getElementById('grandCeremonyBanner');
    document.getElementById('grandTitle').textContent = `🐉 ${giftName.toUpperCase()} 🐉`;
    document.getElementById('grandSub').textContent = `Đại Thí Chủ ${user} • Công Đức Vô Lượng (+${merit} CĐ)`;
    banner.classList.add('visible');
    clearTimeout(grandTimer);
    grandTimer = setTimeout(() => {
      banner.classList.remove('visible');
    }, 6800);
  }

  // 8. Kết nối JSON-RPC 2.0 WebSocket & Gửi Lệnh RPC
  let ws = null;
  let rpcId = 1;

  function connectWebSocket() {
    const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsQuery = isObsMode ? '?obs=1' : '';
    ws = new WebSocket(`${proto}//${window.location.host}/ws${wsQuery}`);

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.method === 'temple.state') {
          if (typeof msg.params?.obsAudioActive === 'boolean') {
            syncAudioMasterState(msg.params.obsAudioActive);
          }
          updateUIState(msg.params);
        } else if (msg.method === 'temple.audioMaster') {
          syncAudioMasterState(Boolean(msg.params?.obsAudioActive));
        } else if (msg.method === 'temple.event') {
          if (msg.params?.state) updateUIState(msg.params.state);
          if (msg.params?.event) triggerRitualVisuals(msg.params.event);
        } else if (msg.method === 'tts.play') {
          if (msg.params?.url) {
            audio.enqueueTts(msg.params.text || 'Nam mô A Di Đà Phật', {
              voice: msg.params.voice || 'maichi',
              url: msg.params.url
            });
          }
        } else if (msg.method === 'tts.clear') {
          audio.ttsQueue = [];
          audio.stopCurrentAudio();
          audio.ttsPlaying = false;
          updateCentralWorshipper('Thí Chủ Hữu Duyên', '', '✨ Thành tâm lễ Phật', 'Nam Mô A Di Đà Phật, cầu bình an cát tường', false);
        }
      } catch (_) {}
    };

    ws.onclose = () => {
      setTimeout(connectWebSocket, 2000);
    };
  }
  connectWebSocket();

  async function callRpc(method, params = {}) {
    if (!audio.mutedByOtherTab) {
      audio.ensureContext();
    }
    const payload = {
      jsonrpc: '2.0',
      id: rpcId++,
      method,
      params
    };
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(payload));
      return;
    }
    const res = await fetch('/rpc', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (data?.result?.state) updateUIState(data.result.state);
    if (data?.result?.event) triggerRitualVisuals(data.result.event);
    return data;
  }

  function getFormInput() {
    const user = document.getElementById('inputDevoteeName')?.value.trim() || 'Quỳnh_Finn';
    const wish =
      document.getElementById('inputDevoteeWish')?.value.trim() ||
      'Cầu cho gia đình bình an, tài lộc hanh thông';
    return { user, wish };
  }

  // Gắn sự kiện tương tác trực tiếp trên màn hình 9:16 & Thanh HUD dưới đáy
  document.getElementById('incenseBurnerZone')?.addEventListener('click', () => {
    const { user, wish } = getFormInput();
    callRpc('temple.burnIncense', { user, count: 3, wish });
  });

  document.getElementById('cardIncense')?.addEventListener('click', () => {
    const { user, wish } = getFormInput();
    callRpc('temple.burnIncense', { user, count: 3, wish });
  });

  document.getElementById('cardBlessing')?.addEventListener('click', () => {
    const { user, wish } = getFormInput();
    callRpc('temple.sendPrayer', { user, wish });
  });

  document.getElementById('cardLotus')?.addEventListener('click', () => {
    const { user, wish } = getFormInput();
    callRpc('temple.offerGift', {
      user,
      giftType: 'lotus',
      coins: 20,
      giftName: 'Đài Hoa Sen Vàng',
      wish
    });
  });

  document.getElementById('woodenFishStation')?.addEventListener('click', () => {
    const { user } = getFormInput();
    callRpc('temple.strikeWoodenFish', { user, count: 1 });
  });

  document.getElementById('bellStation')?.addEventListener('click', () => {
    const { user, wish } = getFormInput();
    callRpc('temple.ringBell', { user, count: 1, wish, readTts: true });
  });

  document.getElementById('fortuneCylinder')?.addEventListener('click', () => {
    const { user, wish } = getFormInput();
    callRpc('temple.drawFortune', { user, topic: wish });
  });

  // Sự kiện bấm vào 6 mục Quà Cầu Nguyện bên phải màn hình
  document.getElementById('giftItemPeace')?.addEventListener('click', () => {
    const { user } = getFormInput();
    callRpc('temple.offerGift', {
      user,
      giftType: 'lotus',
      coins: 1,
      giftName: 'Hoa Hồng Cầu Bình An',
      wish: 'Thành tâm dâng Hoa Hồng cầu gia đạo bình an, tai qua nạn khỏi'
    });
  });

  document.getElementById('giftItemLove')?.addEventListener('click', () => {
    const { user } = getFormInput();
    callRpc('temple.offerGift', {
      user,
      giftType: 'lamp',
      coins: 5,
      giftName: 'Bắn Tim Cầu Tình Duyên',
      wish: 'Thành tâm cầu nhân duyên viên mãn, hạnh phúc trăm năm'
    });
  });

  document.getElementById('giftItemFamily')?.addEventListener('click', () => {
    const { user } = getFormInput();
    callRpc('temple.offerGift', {
      user,
      giftType: 'fruit',
      coins: 30,
      giftName: 'Donut Cầu Gia Đình',
      wish: 'Thành tâm cầu cho cha mẹ mạnh khỏe, gia đình sum vầy êm ấm'
    });
  });

  document.getElementById('giftItemWealth')?.addEventListener('click', () => {
    const { user } = getFormInput();
    callRpc('temple.offerGift', {
      user,
      giftType: 'lamp',
      coins: 10,
      giftName: 'Đèn Hoa Cầu Làm Ăn',
      wish: 'Cầu công việc hanh thông, buôn may bán đắt, tài lộc dồi dào'
    });
  });

  document.getElementById('giftItemHealth')?.addEventListener('click', () => {
    const { user } = getFormInput();
    callRpc('temple.offerGift', {
      user,
      giftType: 'fruit',
      coins: 20,
      giftName: 'Hoa Sen Vàng Cầu Sức Khỏe',
      wish: 'Cầu thân tâm an lạc, bách bệnh tiêu trừ, vạn sự cát tường'
    });
  });

  document.getElementById('giftItemIncense')?.addEventListener('click', () => {
    const { user, wish } = getFormInput();
    callRpc('temple.burnIncense', { user, count: 3, wish });
  });

  // Các nút trên Quick RPC Dock bên phải
  document.getElementById('btnRpcIncense')?.addEventListener('click', () => {
    const { user, wish } = getFormInput();
    callRpc('temple.burnIncense', { user, count: 3, wish });
  });

  document.getElementById('btnRpcLantern')?.addEventListener('click', () => {
    const { user, wish } = getFormInput();
    callRpc('temple.sendPrayer', { user, wish });
  });

  document.getElementById('btnRpcWoodenFish')?.addEventListener('click', () => {
    const { user } = getFormInput();
    callRpc('temple.strikeWoodenFish', { user, count: 5 });
  });

  document.getElementById('btnRpcBell')?.addEventListener('click', () => {
    const { user, wish } = getFormInput();
    callRpc('temple.ringBell', { user, count: 1, wish, readTts: true });
  });

  document.getElementById('btnRpcFortune')?.addEventListener('click', () => {
    const { user, wish } = getFormInput();
    callRpc('temple.drawFortune', { user, topic: wish });
  });

  document.getElementById('btnRpcGiftLotus')?.addEventListener('click', () => {
    const { user, wish } = getFormInput();
    callRpc('temple.offerGift', {
      user,
      giftType: 'lotus',
      coins: 20,
      giftName: 'Đài Hoa Sen Vàng',
      wish
    });
  });

  document.getElementById('btnRpcGrandCeremony')?.addEventListener('click', () => {
    const { user, wish } = getFormInput();
    callRpc('temple.grandCeremony', {
      user,
      coins: 299,
      giftName: 'Đại Lễ Kim Long Chầu Phật',
      wish
    });
  });

  document.getElementById('btnRpcWelcome')?.addEventListener('click', () => {
    const { user } = getFormInput();
    callRpc('temple.welcomeMember', {
      user,
      forceTts: true
    });
  });

  document.getElementById('btnRpcRoseCombo')?.addEventListener('click', () => {
    const { user } = getFormInput();
    for (let i = 0; i < 5; i++) {
      setTimeout(() => {
        callRpc('temple.offerGift', {
          user,
          giftType: 'lotus',
          coins: 1,
          giftName: 'Hoa Hồng Cầu Bình An'
        });
      }, i * 520);
    }
  });

  document.getElementById('btnConnectTikTok')?.addEventListener('click', () => {
    const username = document.getElementById('inputTikTokUser')?.value.trim();
    if (!username) return;
    callRpc('live.connect', { username });
  });

  let autoSimState = false;
  document.getElementById('btnToggleAutoSim')?.addEventListener('click', () => {
    autoSimState = !autoSimState;
    callRpc('live.setAutoSim', { enabled: autoSimState });
  });

  document.getElementById('btnResetMeritQuick')?.addEventListener('click', () => {
    callRpc('temple.resetMerit', {});
  });

  document.getElementById('btnToggleTts')?.addEventListener('click', (e) => {
    audio.ttsEnabled = !audio.ttsEnabled;
    const btn = e.currentTarget;
    btn.textContent = `🎙️ Giọng Đọc: ${audio.ttsEnabled ? 'BẬT' : 'TẮT'}`;
    btn.classList.toggle('active-toggle', audio.ttsEnabled);
  });

  document.getElementById('btnToggleMusic')?.addEventListener('click', (e) => {
    audio.bgMusicEnabled = !audio.bgMusicEnabled;
    if (audio.bgMusicEnabled) {
      audio.startZenAmbience();
    } else {
      audio.stopZenAmbience();
    }
    const btn = e.currentTarget;
    btn.textContent = `🎵 Nhạc Nền: ${audio.bgMusicEnabled ? 'BẬT' : 'TẮT'}`;
    btn.classList.toggle('active-toggle', audio.bgMusicEnabled);
  });

  // Khởi tạo và gắn sự kiện thanh trượt chỉnh âm lượng Nhạc nền & Giọng đọc
  const sliderMusicVol = document.getElementById('sliderMusicVol');
  const valMusicVol = document.getElementById('valMusicVol');
  if (sliderMusicVol && valMusicVol) {
    const initMusPct = Math.round(audio.bgBaseVolume * 100);
    sliderMusicVol.value = String(initMusPct);
    valMusicVol.textContent = `${initMusPct}%`;
    sliderMusicVol.addEventListener('input', (e) => {
      const pct = Number(e.target.value);
      valMusicVol.textContent = `${pct}%`;
      audio.ensureContext();
      audio.setMusicVolume(pct / 100);
    });
    sliderMusicVol.addEventListener('change', (e) => {
      const pct = Number(e.target.value);
      callRpc('temple.updateSettings', { musicVolume: +(pct / 100).toFixed(2) });
    });
  }

  const sliderTtsVol = document.getElementById('sliderTtsVol');
  const valTtsVol = document.getElementById('valTtsVol');
  if (sliderTtsVol && valTtsVol) {
    const initTtsPct = Math.round(audio.ttsVolume * 100);
    sliderTtsVol.value = String(initTtsPct);
    valTtsVol.textContent = `${initTtsPct}%`;
    sliderTtsVol.addEventListener('input', (e) => {
      const pct = Number(e.target.value);
      valTtsVol.textContent = `${pct}%`;
      audio.setTtsVolume(pct / 100);
    });
    sliderTtsVol.addEventListener('change', (e) => {
      const pct = Number(e.target.value);
      callRpc('temple.updateSettings', { ttsVolume: +(pct / 100).toFixed(2) });
    });
  }

  function shortenName(name, maxLen = 13) {
    const str = String(name || '');
    return str.length > maxLen ? str.slice(0, maxLen - 1) + '…' : str;
  }

  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // 9. Đồng hồ Thời Gian Thực (10Hz) + Đếm Ngược Đại Lễ + Chuyển Động Tự Nhiên Chống Cảnh Báo Tĩnh
  let ceremonyRemainDeci = 1500; // 150.0 giây (2 phút 30 giây)
  const rtClockEl = document.getElementById('rtLiveClock');
  const rtCountdownEl = document.getElementById('rtCeremonyCountdown');

  setInterval(() => {
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    const ss = String(now.getSeconds()).padStart(2, '0');
    const deci = Math.floor(now.getMilliseconds() / 100);
    if (rtClockEl) {
      rtClockEl.textContent = `🕒 ${hh}:${mm}:${ss}.${deci}`;
    }

    ceremonyRemainDeci -= 1;
    if (ceremonyRemainDeci <= 0) {
      ceremonyRemainDeci = 1500;
      particles.spawnGrandCeremonyRain();
      particles.spawnBellWave(540, 260, 2);
      pulseHallBowing();
    }
    if (rtCountdownEl) {
      const remSec = Math.floor(ceremonyRemainDeci / 10);
      const remD = ceremonyRemainDeci % 10;
      const cMin = String(Math.floor(remSec / 60)).padStart(2, '0');
      const cSec = String(remSec % 60).padStart(2, '0');
      rtCountdownEl.textContent = `⏳ Đại lễ: ${cMin}:${cSec}.${remD}`;
    }
  }, 100);

  // Tự động kích hoạt làn sóng Phật tử vái lạy và khói hương mỗi 4.5 giây để khung hình luôn sống động
  let ambientTick = 0;
  setInterval(() => {
    ambientTick++;
    pulseHallBowing();
    particles.spawnIncenseBurst(540, 895);
    if (ambientTick % 2 === 0 && prostrationTimers.length === 0) {
      playThreeBowsSequence(0);
    }
    // Luồng Phật tử vào/ra lễ Phật tự nhiên liên tục để Chánh Điện luôn sống động như thật
    const idleMs = Date.now() - lastWalkerSpawnMs;
    if (ambientTick % 2 === 1) {
      spawnLeavingDevotee();
    } else if (idleMs > 6200) {
      const AMBIENT_PILGRIMS = [
        'Phật Tử Diệu Âm',
        'Thí Chủ Minh Đức',
        'Phật Tử Thanh Tâm',
        'Thí Chủ Bảo An',
        'Phật Tử Từ Tâm',
        'Thí Chủ Phúc Lộc'
      ];
      const name = AMBIENT_PILGRIMS[ambientTick % AMBIENT_PILGRIMS.length];
      spawnCarpetGuestWalker({ user: name, merit: 2 });
    }
  }, 4500);
})();
