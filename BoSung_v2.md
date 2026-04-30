<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>RingBeat — Feel Every Beat</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:ital,wght@0,300;0,400;0,500;1,300&display=swap" rel="stylesheet" />
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    :root {
      --green: #1db954;
      --green-dim: rgba(29,185,84,0.15);
      --green-glow: rgba(29,185,84,0.35);
      --white: #ffffff;
      --off-white: rgba(255,255,255,0.72);
      --muted: rgba(255,255,255,0.35);
      --bg: #050505;
      --surface: rgba(255,255,255,0.04);
      --border: rgba(255,255,255,0.08);
    }

    html, body {
      width: 100%; height: 100%;
      background: var(--bg);
      color: var(--white);
      font-family: 'DM Sans', sans-serif;
      overflow-x: hidden;
      scroll-behavior: smooth;
    }

    /* ── CANVAS (Three.js particles) ── */
    #bg-canvas {
      position: fixed;
      inset: 0;
      z-index: 0;
      pointer-events: none;
    }

    /* ── SKETCHFAB IFRAME ── */
    #sketchfab-wrap {
      position: fixed;
      inset: 0;
      z-index: 1;
      pointer-events: none;
      overflow: hidden;
    }
    #sketchfab-wrap iframe {
      width: 100%;
      height: 100%;
      border: none;
      pointer-events: none;
      opacity: 0;
      transition: opacity 1.8s ease;
    }
    #sketchfab-wrap iframe.loaded { opacity: 1; }

    /* dark overlay so text stays readable */
    .overlay-vignette {
      position: fixed;
      inset: 0;
      z-index: 2;
      background:
        radial-gradient(ellipse 80% 60% at 50% 100%, transparent 0%, rgba(5,5,5,0.72) 100%),
        linear-gradient(to bottom, rgba(5,5,5,0.55) 0%, transparent 30%, transparent 60%, rgba(5,5,5,0.85) 100%);
      pointer-events: none;
    }

    /* ── LAYOUT ── */
    #app {
      position: relative;
      z-index: 10;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }

    /* ── TOPBAR ── */
    nav {
      position: fixed;
      top: 0; left: 0; right: 0;
      z-index: 100;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 20px 48px;
      backdrop-filter: blur(20px) saturate(1.4);
      -webkit-backdrop-filter: blur(20px) saturate(1.4);
      background: rgba(5,5,5,0.45);
      border-bottom: 0.5px solid var(--border);
      animation: slideDown 0.8s cubic-bezier(0.4,0,0.2,1) both;
    }
    @keyframes slideDown {
      from { transform: translateY(-100%); opacity: 0; }
      to   { transform: translateY(0);    opacity: 1; }
    }

    .nav-logo {
      display: flex;
      align-items: center;
      gap: 10px;
      text-decoration: none;
    }
    .nav-logo-icon {
      width: 34px; height: 34px;
      border-radius: 8px;
      background: var(--green);
      display: flex; align-items: center; justify-content: center;
    }
    .nav-logo-icon svg { width: 18px; height: 18px; fill: #000; }
    .nav-logo-text {
      font-family: 'Bebas Neue', sans-serif;
      font-size: 22px;
      letter-spacing: 2px;
      color: var(--white);
    }

    .nav-links {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .nav-links a {
      text-decoration: none;
      font-size: 13px;
      font-weight: 500;
      letter-spacing: 0.02em;
      transition: all 0.2s;
    }
    .btn-ghost {
      color: var(--off-white);
      padding: 9px 22px;
      border-radius: 99px;
      border: 1px solid var(--border);
      background: transparent;
    }
    .btn-ghost:hover {
      color: var(--white);
      border-color: rgba(255,255,255,0.25);
      background: rgba(255,255,255,0.06);
    }
    .btn-solid {
      color: #000;
      padding: 9px 22px;
      border-radius: 99px;
      background: var(--green);
      border: 1px solid transparent;
      font-weight: 500;
    }
    .btn-solid:hover {
      background: #1ed760;
      transform: translateY(-1px);
      box-shadow: 0 8px 24px var(--green-glow);
    }

    /* ── HERO ── */
    .hero {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      padding: 140px 24px 80px;
      min-height: 100vh;
    }

    .hero-badge {
      display: inline-flex;
      align-items: center;
      gap: 7px;
      font-size: 11px;
      font-weight: 500;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: var(--green);
      padding: 6px 14px;
      border-radius: 99px;
      border: 1px solid rgba(29,185,84,0.3);
      background: rgba(29,185,84,0.08);
      margin-bottom: 32px;
      animation: fadeUp 1s 0.3s both;
    }
    .hero-badge-dot {
      width: 6px; height: 6px;
      border-radius: 50%;
      background: var(--green);
      animation: pulse 2s ease-in-out infinite;
    }
    @keyframes pulse {
      0%,100% { opacity: 1; transform: scale(1); }
      50%      { opacity: 0.4; transform: scale(0.7); }
    }

    .hero-title {
      font-family: 'Bebas Neue', sans-serif;
      font-size: clamp(72px, 12vw, 160px);
      line-height: 0.92;
      letter-spacing: 4px;
      color: var(--white);
      animation: fadeUp 1s 0.5s both;
      text-shadow: 0 0 80px rgba(29,185,84,0.15);
    }
    .hero-title .accent {
      color: var(--green);
      display: block;
      text-shadow: 0 0 60px rgba(29,185,84,0.4);
    }

    .hero-sub {
      margin-top: 24px;
      font-size: clamp(15px, 2vw, 18px);
      font-weight: 300;
      color: var(--off-white);
      max-width: 480px;
      line-height: 1.65;
      animation: fadeUp 1s 0.7s both;
    }

    .hero-actions {
      display: flex;
      align-items: center;
      gap: 14px;
      margin-top: 40px;
      flex-wrap: wrap;
      justify-content: center;
      animation: fadeUp 1s 0.9s both;
    }
    .btn-hero-primary {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 15px 32px;
      border-radius: 99px;
      background: var(--green);
      color: #000;
      font-weight: 500;
      font-size: 15px;
      text-decoration: none;
      border: none;
      cursor: pointer;
      transition: all 0.25s;
      font-family: 'DM Sans', sans-serif;
      letter-spacing: 0.01em;
    }
    .btn-hero-primary:hover {
      background: #1ed760;
      transform: translateY(-2px);
      box-shadow: 0 12px 40px var(--green-glow);
    }
    .btn-hero-primary svg { width: 18px; height: 18px; fill: #000; }

    .btn-hero-ghost {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 14px 28px;
      border-radius: 99px;
      background: transparent;
      color: var(--off-white);
      font-size: 15px;
      text-decoration: none;
      border: 1px solid var(--border);
      cursor: pointer;
      transition: all 0.25s;
      font-family: 'DM Sans', sans-serif;
    }
    .btn-hero-ghost:hover {
      color: var(--white);
      border-color: rgba(255,255,255,0.25);
      background: rgba(255,255,255,0.06);
    }

    @keyframes fadeUp {
      from { opacity: 0; transform: translateY(28px); }
      to   { opacity: 1; transform: translateY(0); }
    }

    /* ── SCROLL INDICATOR ── */
    .scroll-hint {
      position: absolute;
      bottom: 36px;
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      font-size: 10px;
      letter-spacing: 0.15em;
      text-transform: uppercase;
      color: var(--muted);
      animation: fadeUp 1s 1.2s both;
    }
    .scroll-hint-line {
      width: 1px; height: 48px;
      background: linear-gradient(to bottom, rgba(255,255,255,0.3), transparent);
      animation: scrollPulse 2s ease-in-out infinite;
    }
    @keyframes scrollPulse {
      0%,100% { transform: scaleY(1); opacity: 0.6; }
      50%      { transform: scaleY(0.5); opacity: 0.2; }
    }

    /* ── FEATURES SECTION ── */
    .features {
      padding: 120px 48px;
      max-width: 1200px;
      margin: 0 auto;
      width: 100%;
    }
    .section-label {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.15em;
      color: var(--green);
      font-weight: 500;
      margin-bottom: 16px;
    }
    .section-title {
      font-family: 'Bebas Neue', sans-serif;
      font-size: clamp(40px, 6vw, 72px);
      letter-spacing: 2px;
      line-height: 1;
      margin-bottom: 60px;
      color: var(--white);
    }

    .features-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 16px;
    }
    .feature-card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 20px;
      padding: 32px 28px;
      transition: all 0.3s;
      position: relative;
      overflow: hidden;
    }
    .feature-card::before {
      content: '';
      position: absolute;
      inset: 0;
      background: radial-gradient(circle at 20% 20%, rgba(29,185,84,0.06), transparent 60%);
      opacity: 0;
      transition: opacity 0.3s;
    }
    .feature-card:hover {
      border-color: rgba(29,185,84,0.25);
      transform: translateY(-4px);
    }
    .feature-card:hover::before { opacity: 1; }

    .feature-icon {
      width: 48px; height: 48px;
      border-radius: 12px;
      background: var(--green-dim);
      display: flex; align-items: center; justify-content: center;
      margin-bottom: 20px;
    }
    .feature-icon svg { width: 22px; height: 22px; stroke: var(--green); fill: none; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
    .feature-name {
      font-size: 16px;
      font-weight: 500;
      color: var(--white);
      margin-bottom: 10px;
      letter-spacing: -0.01em;
    }
    .feature-desc {
      font-size: 13.5px;
      color: var(--muted);
      line-height: 1.65;
      font-weight: 300;
    }

    /* ── DEMO SECTION ── */
    .demo-section {
      padding: 60px 48px 120px;
      max-width: 1200px;
      margin: 0 auto;
      width: 100%;
    }
    .demo-card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 28px;
      overflow: hidden;
      position: relative;
    }
    .demo-card-inner {
      display: flex;
      align-items: center;
      gap: 0;
    }
    .demo-left {
      flex: 1;
      padding: 56px 48px;
    }
    .demo-right {
      width: 340px;
      flex-shrink: 0;
      padding: 32px;
      border-left: 1px solid var(--border);
      background: rgba(29,185,84,0.03);
    }
    .demo-eyebrow {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.15em;
      color: var(--green);
      font-weight: 500;
      margin-bottom: 16px;
    }
    .demo-title {
      font-family: 'Bebas Neue', sans-serif;
      font-size: 52px;
      letter-spacing: 2px;
      line-height: 1;
      margin-bottom: 16px;
    }
    .demo-desc {
      font-size: 14px;
      color: var(--off-white);
      line-height: 1.7;
      font-weight: 300;
      margin-bottom: 32px;
      max-width: 360px;
    }
    .demo-btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 13px 28px;
      border-radius: 99px;
      background: var(--green);
      color: #000;
      font-size: 14px;
      font-weight: 500;
      text-decoration: none;
      border: none;
      cursor: pointer;
      transition: all 0.25s;
      font-family: 'DM Sans', sans-serif;
    }
    .demo-btn:hover {
      background: #1ed760;
      transform: translateY(-1px);
      box-shadow: 0 8px 28px var(--green-glow);
    }

    /* Mock player UI */
    .mock-player {
      background: rgba(5,5,5,0.7);
      border: 1px solid var(--border);
      border-radius: 16px;
      padding: 20px;
      backdrop-filter: blur(12px);
    }
    .mock-cover {
      width: 100%;
      aspect-ratio: 1;
      border-radius: 10px;
      background: linear-gradient(135deg, #1a3a2a 0%, #0d2118 50%, #1db954 100%);
      margin-bottom: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      overflow: hidden;
    }
    .mock-cover-vinyl {
      width: 80px; height: 80px;
      border-radius: 50%;
      background: #080808;
      border: 2px solid rgba(255,255,255,0.1);
      display: flex; align-items: center; justify-content: center;
      animation: vinylSpin 4s linear infinite;
    }
    @keyframes vinylSpin {
      from { transform: rotate(0deg); }
      to   { transform: rotate(360deg); }
    }
    .mock-cover-center {
      width: 24px; height: 24px;
      border-radius: 50%;
      background: linear-gradient(135deg, #1db954, #0d7a3a);
    }
    .mock-song-info { margin-bottom: 14px; }
    .mock-song-title { font-size: 14px; font-weight: 500; margin-bottom: 3px; }
    .mock-song-artist { font-size: 12px; color: var(--muted); }
    .mock-progress {
      height: 3px;
      background: rgba(255,255,255,0.1);
      border-radius: 3px;
      margin-bottom: 4px;
      position: relative;
    }
    .mock-progress-fill {
      position: absolute;
      left: 0; top: 0; bottom: 0;
      width: 45%;
      background: var(--green);
      border-radius: 3px;
    }
    .mock-times { display: flex; justify-content: space-between; font-size: 10px; color: var(--muted); margin-bottom: 14px; }
    .mock-controls { display: flex; align-items: center; justify-content: center; gap: 16px; }
    .mock-ctrl { font-size: 16px; color: var(--muted); cursor: pointer; }
    .mock-play {
      width: 36px; height: 36px;
      border-radius: 50%;
      background: var(--green);
      display: flex; align-items: center; justify-content: center;
      font-size: 14px;
      color: #000;
      cursor: pointer;
    }

    /* ── FOOTER ── */
    footer {
      border-top: 1px solid var(--border);
      padding: 32px 48px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      color: var(--muted);
      font-size: 12px;
    }
    footer a { color: var(--muted); text-decoration: none; }
    footer a:hover { color: var(--white); }

    /* ── WAVEFORM ANIMATION ── */
    .waveform {
      display: flex;
      align-items: center;
      gap: 3px;
      height: 24px;
    }
    .wave-bar {
      width: 3px;
      border-radius: 3px;
      background: var(--green);
      animation: waveBounce var(--dur, 1s) ease-in-out infinite;
      animation-delay: var(--delay, 0s);
    }
    @keyframes waveBounce {
      0%,100% { height: 4px; }
      50%      { height: var(--h, 20px); }
    }

    /* ── SCROLLED SECTION REVEAL ── */
    .reveal {
      opacity: 0;
      transform: translateY(40px);
      transition: opacity 0.8s cubic-bezier(0.4,0,0.2,1), transform 0.8s cubic-bezier(0.4,0,0.2,1);
    }
    .reveal.visible {
      opacity: 1;
      transform: translateY(0);
    }

    @media (max-width: 768px) {
      nav { padding: 16px 20px; }
      .hero { padding: 120px 20px 80px; }
      .features, .demo-section { padding: 80px 20px; }
      .demo-card-inner { flex-direction: column; }
      .demo-right { width: 100%; border-left: none; border-top: 1px solid var(--border); }
      footer { flex-direction: column; gap: 12px; text-align: center; }
    }
  </style>
</head>
<body>

<!-- Three.js Particle Canvas -->
<canvas id="bg-canvas"></canvas>

<!-- Sketchfab Background -->
<div id="sketchfab-wrap">
  <iframe
    id="sketchfab-iframe"
    title="Boombox Space Cat"
    allow="autoplay; fullscreen; xr-spatial-tracking"
    src="https://sketchfab.com/models/693ad5aec6bb4815a1e48fad7c07b319/embed?autostart=1&ui_controls=0&ui_infos=0&ui_inspector=0&ui_stop=0&ui_watermark=0&ui_watermark_link=0&ui_hint=0&ui_ar=0&ui_help=0&ui_settings=0&ui_vr=0&ui_fullscreen=0&ui_annotations=0&camera=0&transparent=0&preload=1&autospin=0.3"
  ></iframe>
</div>

<!-- Vignette overlay -->
<div class="overlay-vignette"></div>

<!-- App Shell -->
<div id="app">

  <!-- NAVIGATION -->
  <nav>
    <a href="#" class="nav-logo">
      <div class="nav-logo-icon">
        <svg viewBox="0 0 24 24"><path d="M12 3C7 3 3 7 3 12s4 9 9 9 9-4 9-9-4-9-9-9zm4.1 13c-.2.3-.6.4-.9.2-2.5-1.5-5.6-1.9-9.2-1-.4.1-.7-.1-.8-.5-.1-.4.1-.7.5-.8 4-.9 7.4-.5 10.2 1.2.3.2.4.5.2.9zm1.1-2.5c-.2.3-.7.5-1 .3-2.8-1.7-7.1-2.2-10.4-1.2-.4.1-.8-.1-1-.5-.1-.4.1-.8.5-1 3.8-1.1 8.5-.6 11.6 1.4.4.2.5.6.3 1zm.1-2.6c-3.4-2-9-2.2-12.2-1.2-.5.1-1-.2-1.1-.6-.1-.5.2-1 .6-1.1 3.7-1.1 9.9-.9 13.7 1.4.4.3.6.8.3 1.2-.2.5-.8.6-1.3.3z"/></svg>
      </div>
      <span class="nav-logo-text">RingBeat</span>
    </a>

    <div class="nav-links">
      <a href="/login" class="btn-ghost">Đăng nhập</a>
      <a href="/register" class="btn-solid">Đăng ký miễn phí</a>
    </div>
  </nav>

  <!-- HERO -->
  <section class="hero">
    <div class="hero-badge">
      <span class="hero-badge-dot"></span>
      Âm nhạc không giới hạn
    </div>

    <h1 class="hero-title">
      Feel<br/>
      <span class="accent">Every</span><br/>
      Beat
    </h1>

    <p class="hero-sub">
      Khám phá hàng triệu bài hát, kết nối với nghệ sĩ yêu thích và chia sẻ âm nhạc cùng bạn bè — tất cả trong một nơi.
    </p>

    <div class="hero-actions">
      <a href="/register" class="btn-hero-primary">
        <svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
        Bắt đầu nghe nhạc
      </a>
      <a href="#demo" class="btn-hero-ghost">
        <div class="waveform">
          <div class="wave-bar" style="--dur:0.9s; --delay:0s;   --h:18px;"></div>
          <div class="wave-bar" style="--dur:1.1s; --delay:0.1s; --h:22px;"></div>
          <div class="wave-bar" style="--dur:0.8s; --delay:0.2s; --h:14px;"></div>
          <div class="wave-bar" style="--dur:1.2s; --delay:0.05s;--h:20px;"></div>
          <div class="wave-bar" style="--dur:1.0s; --delay:0.15s;--h:16px;"></div>
        </div>
        Trải nghiệm demo
      </a>
    </div>

    <div class="scroll-hint">
      <div class="scroll-hint-line"></div>
      <span>Cuộn xuống</span>
    </div>
  </section>

  <!-- FEATURES -->
  <section class="features reveal" id="features">
    <div class="section-label">Tính năng nổi bật</div>
    <div class="section-title">Mọi thứ bạn cần<br/>cho âm nhạc</div>

    <div class="features-grid">
      <div class="feature-card">
        <div class="feature-icon">
          <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8"/></svg>
        </div>
        <div class="feature-name">Nghe nhạc chất lượng cao</div>
        <div class="feature-desc">Stream nhạc 320kbps không giới hạn với tài khoản Premium. Cảm nhận từng chi tiết âm thanh tinh tế.</div>
      </div>

      <div class="feature-card">
        <div class="feature-icon">
          <svg viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
        </div>
        <div class="feature-name">Friend Activity</div>
        <div class="feature-desc">Xem bạn bè đang nghe gì theo thời gian thực. Kết nối qua âm nhạc theo cách chưa từng có.</div>
      </div>

      <div class="feature-card">
        <div class="feature-icon">
          <svg viewBox="0 0 24 24"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>
        </div>
        <div class="feature-name">Collaborative Playlist</div>
        <div class="feature-desc">Tạo playlist chung với bạn bè, cùng nhau thêm bài hát và xây dựng không gian âm nhạc riêng.</div>
      </div>

      <div class="feature-card">
        <div class="feature-icon">
          <svg viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
        </div>
        <div class="feature-name">Lời bài hát đồng bộ</div>
        <div class="feature-desc">Karaoke theo nhạc với lyrics cuộn thời gian thực, highlight từng dòng chính xác đến từng giây.</div>
      </div>

      <div class="feature-card">
        <div class="feature-icon">
          <svg viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
        </div>
        <div class="feature-name">Khám phá hàng tuần</div>
        <div class="feature-desc">Thuật toán gợi ý nhạc thông minh, cá nhân hoá theo thị hiếu của bạn mỗi ngày một mới.</div>
      </div>

      <div class="feature-card">
        <div class="feature-icon">
          <svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="9" y1="3" x2="9" y2="21"/><line x1="15" y1="3" x2="15" y2="21"/></svg>
        </div>
        <div class="feature-name">Nghệ sĩ Dashboard</div>
        <div class="feature-desc">Upload nhạc, quản lý album, xem analytics — nền tảng đầy đủ cho nghệ sĩ độc lập.</div>
      </div>
    </div>
  </section>

  <!-- DEMO SECTION -->
  <section class="demo-section reveal" id="demo">
    <div class="demo-card">
      <div class="demo-card-inner">
        <div class="demo-left">
          <div class="demo-eyebrow">Trải nghiệm ngay</div>
          <h2 class="demo-title">Nghe thử<br/>không cần<br/>đăng ký</h2>
          <p class="demo-desc">
            Khám phá giao diện RingBeat với bản demo miễn phí. Tìm kiếm bài hát, xem trang nghệ sĩ và cảm nhận trải nghiệm trước khi tạo tài khoản.
          </p>
          <a href="/demo" class="demo-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="#000"><path d="M8 5v14l11-7z"/></svg>
            Vào trang Demo
          </a>
        </div>
        <div class="demo-right">
          <!-- Mock Player -->
          <div class="mock-player">
            <div class="mock-cover">
              <div class="mock-cover-vinyl">
                <div class="mock-cover-center"></div>
              </div>
            </div>
            <div class="mock-song-info">
              <div class="mock-song-title">Chúng Ta Của Hiện Tại</div>
              <div class="mock-song-artist">Sơn Tùng M-TP</div>
            </div>
            <div class="mock-progress"><div class="mock-progress-fill"></div></div>
            <div class="mock-times"><span>1:46</span><span>4:38</span></div>
            <div class="mock-controls">
              <div class="mock-ctrl">⇄</div>
              <div class="mock-ctrl">⏮</div>
              <div class="mock-play">▶</div>
              <div class="mock-ctrl">⏭</div>
              <div class="mock-ctrl">↺</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- FOOTER -->
  <footer>
    <div style="display:flex;align-items:center;gap:8px;">
      <div style="width:24px;height:24px;border-radius:6px;background:var(--green);display:flex;align-items:center;justify-content:center;">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="#000"><path d="M12 3C7 3 3 7 3 12s4 9 9 9 9-4 9-9-4-9-9-9zm4.1 13c-.2.3-.6.4-.9.2-2.5-1.5-5.6-1.9-9.2-1-.4.1-.7-.1-.8-.5-.1-.4.1-.7.5-.8 4-.9 7.4-.5 10.2 1.2.3.2.4.5.2.9zm1.1-2.5c-.2.3-.7.5-1 .3-2.8-1.7-7.1-2.2-10.4-1.2-.4.1-.8-.1-1-.5-.1-.4.1-.8.5-1 3.8-1.1 8.5-.6 11.6 1.4.4.2.5.6.3 1zm.1-2.6c-3.4-2-9-2.2-12.2-1.2-.5.1-1-.2-1.1-.6-.1-.5.2-1 .6-1.1 3.7-1.1 9.9-.9 13.7 1.4.4.3.6.8.3 1.2-.2.5-.8.6-1.3.3z"/></svg>
      </div>
      <span style="font-family:'Bebas Neue',sans-serif;font-size:16px;letter-spacing:2px;color:rgba(255,255,255,0.7);">RingBeat</span>
    </div>
    <div style="display:flex;gap:24px;">
      <a href="#">Điều khoản</a>
      <a href="#">Quyền riêng tư</a>
      <a href="#">Liên hệ</a>
    </div>
    <div>© 2025 RingBeatMusic. All rights reserved.</div>
  </footer>

</div>

<!-- Three.js -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
<script>
(function() {
  const canvas = document.getElementById('bg-canvas');
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  renderer.setSize(window.innerWidth, window.innerHeight);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 200);
  camera.position.z = 60;

  // Star field
  const starCount = 1200;
  const starGeo = new THREE.BufferGeometry();
  const positions = new Float32Array(starCount * 3);
  const colors    = new Float32Array(starCount * 3);
  const sizes     = new Float32Array(starCount);

  for (let i = 0; i < starCount; i++) {
    positions[i*3]   = (Math.random() - 0.5) * 200;
    positions[i*3+1] = (Math.random() - 0.5) * 200;
    positions[i*3+2] = (Math.random() - 0.5) * 200;

    const isGreen = Math.random() < 0.15;
    if (isGreen) {
      colors[i*3]   = 0.11;
      colors[i*3+1] = 0.73;
      colors[i*3+2] = 0.33;
    } else {
      const b = 0.5 + Math.random() * 0.5;
      colors[i*3] = b; colors[i*3+1] = b; colors[i*3+2] = b;
    }
    sizes[i] = Math.random() * 2.5 + 0.5;
  }

  starGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  starGeo.setAttribute('color',    new THREE.BufferAttribute(colors, 3));
  starGeo.setAttribute('size',     new THREE.BufferAttribute(sizes, 1));

  const starMat = new THREE.PointsMaterial({
    size: 0.6,
    vertexColors: true,
    transparent: true,
    opacity: 0.75,
    sizeAttenuation: true,
  });

  const stars = new THREE.Points(starGeo, starMat);
  scene.add(stars);

  // Floating music note particles
  const noteCount = 60;
  const noteGeo = new THREE.BufferGeometry();
  const notePos = new Float32Array(noteCount * 3);
  const noteSizes = new Float32Array(noteCount);
  for (let i = 0; i < noteCount; i++) {
    notePos[i*3]   = (Math.random() - 0.5) * 120;
    notePos[i*3+1] = (Math.random() - 0.5) * 100;
    notePos[i*3+2] = (Math.random() - 0.5) * 60;
    noteSizes[i] = Math.random() * 3 + 1;
  }
  noteGeo.setAttribute('position', new THREE.BufferAttribute(notePos, 3));
  noteGeo.setAttribute('size',     new THREE.BufferAttribute(noteSizes, 1));

  const noteMat = new THREE.PointsMaterial({
    size: 1.2,
    color: 0x1db954,
    transparent: true,
    opacity: 0.4,
    sizeAttenuation: true,
  });
  const notes = new THREE.Points(noteGeo, noteMat);
  scene.add(notes);

  // Mouse parallax
  let mx = 0, my = 0;
  document.addEventListener('mousemove', e => {
    mx = (e.clientX / window.innerWidth  - 0.5) * 2;
    my = (e.clientY / window.innerHeight - 0.5) * 2;
  });

  // Resize
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  let t = 0;
  function animate() {
    requestAnimationFrame(animate);
    t += 0.004;

    stars.rotation.y = t * 0.04 + mx * 0.04;
    stars.rotation.x = my * 0.03;

    notes.rotation.y = t * 0.08;
    notes.rotation.x = Math.sin(t * 0.3) * 0.05;

    // Pulse green notes opacity
    noteMat.opacity = 0.25 + Math.sin(t * 2) * 0.15;

    renderer.render(scene, camera);
  }
  animate();

  // Sketchfab iframe fade-in
  const iframe = document.getElementById('sketchfab-iframe');
  setTimeout(() => iframe.classList.add('loaded'), 2500);
})();

// Intersection Observer for reveal animations
const revealEls = document.querySelectorAll('.reveal');
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });
revealEls.forEach(el => observer.observe(el));
</script>
</body>
</html>