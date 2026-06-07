(function () {
  'use strict';

  /* ==========================================================
     DOM References
     ========================================================== */
  const header = document.getElementById('header');
  const navToggle = document.getElementById('navToggle');
  const navList = document.getElementById('navList');
  const navLinks = navList.querySelectorAll('a');
  const themeToggle = document.getElementById('themeToggle');
  const themeIcon = themeToggle.querySelector('.theme-icon');
  const html = document.documentElement;

  /* ==========================================================
     Scroll Progress Bar
     ========================================================== */
  const progressBar = document.createElement('div');
  progressBar.className = 'scroll-progress';
  document.body.prepend(progressBar);

  function updateProgress() {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    progressBar.style.width = progress + '%';
  }

  /* ==========================================================
     Dark / Light Mode Toggle
     ========================================================== */
  const THEME_KEY = 'wenjing_theme';

  function getSavedTheme() {
    try { return localStorage.getItem(THEME_KEY); } catch (e) { return null; }
  }

  function applyTheme(theme) {
    html.setAttribute('data-theme', theme);
    themeIcon.textContent = theme === 'dark' ? '☀️' : '🌙';
    themeToggle.setAttribute('aria-label',
      theme === 'dark' ? '切换浅色模式' : '切换深色模式');
  }

  function toggleTheme() {
    const current = html.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    try { localStorage.setItem(THEME_KEY, next); } catch (e) {}
  }

  const savedTheme = getSavedTheme();
  if (savedTheme === 'dark' || savedTheme === 'light') {
    applyTheme(savedTheme);
  }

  themeToggle.addEventListener('click', toggleTheme);

  /* ==========================================================
     Mobile Navigation
     ========================================================== */
  function closeNav() {
    navList.classList.remove('open');
    navToggle.classList.remove('open');
    navToggle.setAttribute('aria-expanded', 'false');
    navToggle.setAttribute('aria-label', '打开菜单');
  }

  navToggle.addEventListener('click', () => {
    const isOpen = navList.classList.toggle('open');
    navToggle.classList.toggle('open');
    navToggle.setAttribute('aria-expanded', isOpen);
    navToggle.setAttribute('aria-label', isOpen ? '关闭菜单' : '打开菜单');
  });

  navLinks.forEach(link => link.addEventListener('click', closeNav));

  document.addEventListener('click', (e) => {
    if (!navToggle.contains(e.target) && !navList.contains(e.target)) closeNav();
  });

  /* ==========================================================
     Header Scroll Shadow
     ========================================================== */
  function updateHeaderShadow() {
    header.classList.toggle('scrolled', window.scrollY > 10);
  }

  /* ==========================================================
     Back to Top Button
     ========================================================== */
  const backToTop = document.createElement('button');
  backToTop.className = 'back-to-top';
  backToTop.setAttribute('aria-label', '回到顶部');
  backToTop.innerHTML = '↑';
  document.body.appendChild(backToTop);

  function updateBackToTop() {
    backToTop.classList.toggle('show', window.scrollY > 500);
  }

  backToTop.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  /* ==========================================================
     Combined scroll handler (throttled)
     ========================================================== */
  let ticking = false;
  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        updateProgress();
        updateHeaderShadow();
        updateBackToTop();
        updateActiveNav();
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });

  /* ==========================================================
     Active Nav Highlight (Intersection Observer)
     ========================================================== */
  const sections = document.querySelectorAll('section[id]');
  const navObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.getAttribute('id');
        navLinks.forEach(link => {
          link.classList.toggle('active', link.getAttribute('href') === '#' + id);
        });
      }
    });
  }, { rootMargin: '-25% 0px -60% 0px', threshold: 0 });

  sections.forEach(section => navObserver.observe(section));

  function updateActiveNav() {
    // Fallback: manual check for current section
    const scrollPos = window.scrollY + window.innerHeight / 3;
    let current = '';
    sections.forEach(section => {
      const top = section.offsetTop - 100;
      if (scrollPos >= top) current = section.getAttribute('id');
    });
    if (current) {
      navLinks.forEach(link => {
        link.classList.toggle('active', link.getAttribute('href') === '#' + current);
      });
    }
  }

  /* ==========================================================
     Scroll Reveal Animation
     ========================================================== */
  const revealElements = document.querySelectorAll('.reveal');
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.06, rootMargin: '0px 0px -30px 0px' });

  revealElements.forEach(el => revealObserver.observe(el));

  /* ==========================================================
     Hero Parallax Blobs
     ========================================================== */
  const heroBlobs = document.querySelectorAll('.hero-blob');
  const hero = document.querySelector('.hero');

  if (hero && heroBlobs.length) {
    window.addEventListener('scroll', () => {
      const scrollY = window.scrollY;
      const heroHeight = hero.offsetHeight;
      if (scrollY < heroHeight) {
        const factor = scrollY / heroHeight;
        heroBlobs.forEach((blob, i) => {
          const speed = 0.3 + i * 0.15;
          blob.style.transform = `translateY(${scrollY * speed}px)`;
        });
      }
    }, { passive: true });
  }

  /* ==========================================================
     3D Tilt on Interest Cards
     ========================================================== */
  const cards = document.querySelectorAll('.interest-card');

  cards.forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const rotateX = ((y - centerY) / centerY) * -8;
      const rotateY = ((x - centerX) / centerX) * 8;
      card.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-6px)`;
      card.style.boxShadow = 'var(--shadow-lg)';
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = 'perspective(800px) rotateX(0) rotateY(0) translateY(0)';
      card.style.boxShadow = '';
    });
  });

  /* ==========================================================
     Interactive Vinyl
     ========================================================== */
  const vinyl = document.querySelector('.vinyl');
  if (vinyl) {
    vinyl.addEventListener('click', () => {
      if (vinyl.classList.contains('paused')) {
        vinyl.classList.remove('paused');
        showToast('唱片继续转动 🎵');
      } else {
        vinyl.classList.add('paused');
        showToast('唱片暂停了 ⏸');
      }
    });
  }

  /* ==========================================================
     Photo Lightbox (enhanced with nav + counter)
     ========================================================== */
  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightboxImg');
  const lightboxClose = lightbox.querySelector('.lightbox-close');
  const galleryItems = document.querySelectorAll('.gallery-item img');
  const galleryImages = Array.from(galleryItems);
  let currentLightboxIndex = 0;

  function openLightbox(src, alt, index) {
    currentLightboxIndex = index;
    lightboxImg.src = src;
    lightboxImg.alt = alt;
    lightbox.classList.add('open');
    lightbox.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    updateLightboxCounter();
  }

  function closeLightbox() {
    lightbox.classList.remove('open');
    lightbox.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  function showPrev(e) {
    e.stopPropagation();
    currentLightboxIndex = (currentLightboxIndex - 1 + galleryImages.length) % galleryImages.length;
    const img = galleryImages[currentLightboxIndex];
    lightboxImg.src = img.getAttribute('data-full') || img.src;
    lightboxImg.alt = img.alt;
    updateLightboxCounter();
    animateLightboxImg();
  }

  function showNext(e) {
    e.stopPropagation();
    currentLightboxIndex = (currentLightboxIndex + 1) % galleryImages.length;
    const img = galleryImages[currentLightboxIndex];
    lightboxImg.src = img.getAttribute('data-full') || img.src;
    lightboxImg.alt = img.alt;
    updateLightboxCounter();
    animateLightboxImg();
  }

  function updateLightboxCounter() {
    let counter = lightbox.querySelector('.lightbox-counter');
    if (!counter) {
      counter = document.createElement('div');
      counter.className = 'lightbox-counter';
      lightbox.appendChild(counter);
    }
    counter.textContent = (currentLightboxIndex + 1) + ' / ' + galleryImages.length;
  }

  function animateLightboxImg() {
    lightboxImg.style.transform = 'scale(0.9)';
    requestAnimationFrame(() => {
      lightboxImg.style.transform = 'scale(1)';
    });
  }

  // Add nav buttons
  const prevBtn = document.createElement('button');
  prevBtn.className = 'lightbox-nav lightbox-prev';
  prevBtn.setAttribute('aria-label', '上一张');
  prevBtn.innerHTML = '‹';
  prevBtn.addEventListener('click', showPrev);

  const nextBtn = document.createElement('button');
  nextBtn.className = 'lightbox-nav lightbox-next';
  nextBtn.setAttribute('aria-label', '下一张');
  nextBtn.innerHTML = '›';
  nextBtn.addEventListener('click', showNext);

  lightbox.appendChild(prevBtn);
  lightbox.appendChild(nextBtn);

  galleryImages.forEach((img, index) => {
    img.addEventListener('click', () => {
      const fullSrc = img.getAttribute('data-full') || img.src;
      openLightbox(fullSrc, img.alt, index);
    });

    img.parentElement.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        const fullSrc = img.getAttribute('data-full') || img.src;
        openLightbox(fullSrc, img.alt, index);
      }
    });
  });

  lightboxClose.addEventListener('click', closeLightbox);

  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) closeLightbox();
  });

  document.addEventListener('keydown', (e) => {
    if (!lightbox.classList.contains('open')) return;
    if (e.key === 'Escape') {
      closeLightbox();
    } else if (e.key === 'ArrowLeft') {
      showPrev(e);
    } else if (e.key === 'ArrowRight') {
      showNext(e);
    }
  });

  /* ==========================================================
     Journal / 随手记 — localStorage CRUD
     ========================================================== */
  const JOURNAL_KEY = 'wenjing_journal';
  const journalInput = document.getElementById('journalInput');
  const journalSave = document.getElementById('journalSave');
  const journalList = document.getElementById('journalList');
  const journalHint = document.getElementById('journalHint');

  function loadEntries() {
    try {
      const raw = localStorage.getItem(JOURNAL_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) { return []; }
  }

  function saveEntries(entries) {
    try {
      localStorage.setItem(JOURNAL_KEY, JSON.stringify(entries));
    } catch (e) {
      showToast('储存空间满了，清一清旧的吧');
    }
  }

  function addEntry(text) {
    const entries = loadEntries();
    entries.unshift({
      id: Date.now(),
      text: text.trim(),
      timestamp: new Date().toISOString()
    });
    saveEntries(entries);
    renderEntries();
  }

  function deleteEntry(id) {
    let entries = loadEntries();
    entries = entries.filter(e => e.id !== id);
    saveEntries(entries);
    renderEntries();
  }

  function formatTime(isoString) {
    const d = new Date(isoString);
    const now = new Date();
    const diffMs = now - d;
    const diffMin = Math.floor(diffMs / 60000);
    const diffHr = Math.floor(diffMs / 3600000);
    const diffDay = Math.floor(diffMs / 86400000);

    if (diffMin < 1) return '刚刚';
    if (diffMin < 60) return diffMin + ' 分钟前';
    if (diffHr < 24) return diffHr + ' 小时前';
    if (diffDay < 7) return diffDay + ' 天前';

    const month = d.getMonth() + 1;
    const day = d.getDate();
    const hour = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    return month + '月' + day + '日 ' + hour + ':' + min;
  }

  function escapeHTML(str) {
    const div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
  }

  function renderEntries() {
    const entries = loadEntries();

    if (entries.length === 0) {
      journalList.innerHTML = `
        <div class="journal-empty" role="status">
          <span class="journal-empty-icon">☁️</span>
          还没有随手记，写一条吧
        </div>`;
      return;
    }

    journalList.innerHTML = entries.map(e => `
      <div class="journal-entry">
        <div style="flex:1;min-width:0;">
          <div class="journal-entry-text">${escapeHTML(e.text)}</div>
          <div class="journal-entry-time">${formatTime(e.timestamp)}</div>
        </div>
        <button class="journal-entry-del"
                data-id="${e.id}"
                aria-label="删除这条随手记"
                title="删除">✕</button>
      </div>
    `).join('');

    journalList.querySelectorAll('.journal-entry-del').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = Number(btn.getAttribute('data-id'));
        deleteEntry(id);
        showToast('这条记录已删除');
      });
    });
  }

  journalSave.addEventListener('click', () => {
    const text = journalInput.value.trim();
    if (!text) {
      showToast('先写点什么吧 ✍️');
      journalInput.focus();
      return;
    }
    addEntry(text);
    journalInput.value = '';
    journalInput.focus();
    updateCharHint();
    showToast('保存成功 ✨');
  });

  // Ctrl+Enter to save
  journalInput.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      journalSave.click();
    }
  });

  function updateCharHint() {
    const len = journalInput.value.trim().length;
    if (len > 0) {
      journalHint.textContent = '已写 ' + len + ' 字 · Ctrl+Enter 保存';
      journalHint.classList.add('has-content');
    } else {
      journalHint.textContent = '写下来，就不会忘啦';
      journalHint.classList.remove('has-content');
    }
  }

  journalInput.addEventListener('input', updateCharHint);

  // Initial render
  renderEntries();

  /* ==========================================================
     Footer Quote Rotation
     ========================================================== */
  const footerQuote = document.getElementById('footerQuote');
  const quotes = [
    '"即使在最黑暗的时刻，也能找到幸福，只要你记得点亮灯光。" —— 阿不思·邓布利多',
    '"决定我们成为什么样的人的，不是我们的能力，而是我们的选择。" —— 阿不思·邓布利多',
    '"不要怜悯死者，怜悯活着的人。" —— 阿不思·邓布利多',
    '"勇敢的人不是没有恐惧，而是能够面对恐惧。" —— 分院帽',
    '"云朵是天空的便签，风一吹就换一页。" —— 某天下午看着窗外写的',
    '"做一个温柔的人，像软软的抱枕，像刚出炉的面包。" —— 给自己的备忘录',
    '"bug 是代码的悄悄话，它在告诉你哪里还不够细心。" —— 凌晨三点的感悟',
  ];

  let quoteIndex = 0;
  function rotateQuote() {
    let next;
    do {
      next = Math.floor(Math.random() * quotes.length);
    } while (next === quoteIndex && quotes.length > 1);
    quoteIndex = next;

    footerQuote.style.opacity = '0';
    setTimeout(() => {
      footerQuote.textContent = quotes[quoteIndex];
      footerQuote.style.opacity = '1';
    }, 350);
  }

  footerQuote.style.transition = 'opacity 0.35s ease';
  footerQuote.addEventListener('click', rotateQuote);
  footerQuote.style.cursor = 'pointer';
  footerQuote.title = '点我换一句';

  /* ==========================================================
     Toast Notification
     ========================================================== */
  function showToast(message) {
    const old = document.querySelector('.toast');
    if (old) old.remove();

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.setAttribute('role', 'status');
    toast.setAttribute('aria-live', 'polite');
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
      if (toast.parentNode) toast.remove();
    }, 2600);
  }

  /* ==========================================================
     Easter Egg: logo double-click particle burst
     ========================================================== */
  const logo = document.querySelector('.logo');
  const secretMessages = [
    '✨ 你发现了第一个小彩蛋！',
    '🪄 飞来咒！啊不对，是飞来一只猫',
    '🌟 今天会有好事情发生',
    '🎵 周杰伦的哪首歌正在你脑海里播放？',
    '☁️ 此刻的云是什么形状的？',
    '📖 翻开手账，写点什么吧',
  ];

  logo.addEventListener('dblclick', (e) => {
    const msg = secretMessages[Math.floor(Math.random() * secretMessages.length)];
    showToast(msg);

    const rect = logo.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    spawnEmojis(cx, cy, 24);
  });

  function spawnEmojis(x, y, count) {
    const emojis = ['✨', '⭐', '🌟', '💫', '🌸', '🫧', '🎵', '♪', '💖', '🦋', '🍀', '🎀'];
    const fragment = document.createDocumentFragment();

    for (let i = 0; i < count; i++) {
      const particle = document.createElement('span');
      particle.className = 'particle';
      particle.setAttribute('aria-hidden', 'true');
      particle.textContent = emojis[Math.floor(Math.random() * emojis.length)];

      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
      const distance = 60 + Math.random() * 160;
      const dx = Math.cos(angle) * distance;
      const dy = Math.sin(angle) * distance - 30;
      const size = 0.7 + Math.random() * 1.3;
      const duration = 0.9 + Math.random() * 0.9;
      const rotation = (Math.random() - 0.5) * 180;

      particle.style.cssText = `
        left: ${x}px;
        top: ${y}px;
        font-size: ${size}rem;
        --dx: ${dx}px;
        --dy: ${dy}px;
        --rot: ${rotation}deg;
        --dur: ${duration}s;
      `;
      fragment.appendChild(particle);
    }

    document.body.appendChild(fragment);
    setTimeout(() => {
      document.querySelectorAll('.particle').forEach(p => p.remove());
    }, 2200);
  }

  /* ==========================================================
     Startup
     ========================================================== */
  // Initial calls
  updateProgress();
  updateHeaderShadow();
  updateBackToTop();

/* ==========================================================
     全局背景音乐完美控制逻辑（含浏览器自动播放拦截处理）
     ========================================================== */
  const bgMusic = document.getElementById('bgMusic');
  const globalMusicBtn = document.getElementById('globalMusicBtn');
  const vinylRecord = document.querySelector('.vinyl'); // 页面中间的黑胶唱片

  if (bgMusic && globalMusicBtn) {
    
    // 核心函数：同步更新所有UI状态
    function updateMusicUI(isPlaying) {
      if (isPlaying) {
        globalMusicBtn.classList.add('playing');
        globalMusicBtn.setAttribute('aria-label', '暂停背景音乐');
        if (vinylRecord) vinylRecord.classList.remove('paused');
      } else {
        globalMusicBtn.classList.remove('playing');
        globalMusicBtn.setAttribute('aria-label', '播放背景音乐');
        if (vinylRecord) vinylRecord.classList.add('paused');
      }
    }

    // 核心函数：切换播放与暂停
    function toggleMusic() {
      if (bgMusic.paused) {
        bgMusic.play().then(() => {
          updateMusicUI(true);
        }).catch(err => console.log("播放失败: ", err));
      } else {
        bgMusic.pause();
        updateMusicUI(false);
      }
    }

    // 1. 点击悬浮按钮切换状态
    globalMusicBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleMusic();
    });

    // 2. 与页面原有的黑胶唱片联动（点击中间的唱片也能暂停全站音乐）
    if (vinylRecord) {
      vinylRecord.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleMusic();
      });
    }

    // 3. 完美的自动播放处理方案
    // 网页一加载，先尝试悄悄播放
    const startAutoplay = () => {
      bgMusic.play().then(() => {
        // 如果成功自动播放了，点亮 UI
        updateMusicUI(true);
        // 成功后移除所有监听，防止重复触发
        removeAutoplayListeners();
      }).catch(() => {
        // 如果被浏览器拦截了，保持静止，等待用户第一次点击页面
        updateMusicUI(false);
      });
    };

    // 用户只要在网页任意地方点一下，就立刻激活播放（绕过浏览器限制）
    const playOnFirstInteraction = () => {
      if (bgMusic.paused) {
        bgMusic.play().then(() => {
          updateMusicUI(true);
          removeAutoplayListeners();
        }).catch(err => console.log("交互播放失败: ", err));
      }
    };

    function removeAutoplayListeners() {
      document.removeEventListener('click', playOnFirstInteraction);
      document.removeEventListener('touchstart', playOnFirstInteraction);
    }

    // 绑定首次交互监听
    document.addEventListener('click', playOnFirstInteraction);
    document.addEventListener('touchstart', playOnFirstInteraction);

    // 页面加载完成后触发初次尝试
    window.addEventListener('load', startAutoplay);
  }  

    /* ==========================================================
     访客留言板 Guestbook Module (localStorage)
     ========================================================== */
  const GUESTBOOK_KEY = 'wenjing_guestbook';
  const guestbookGrid = document.getElementById('guestbookGrid');
  const guestNameInput = document.getElementById('guestName');
  const guestMessageInput = document.getElementById('guestMessage');
  const submitBtn = document.getElementById('submitGuestbook');
  const guestbookCountSpan = document.getElementById('guestbookCount');
  const charCounterSpan = document.getElementById('charCounter');
  const nameEmojiPreview = document.getElementById('nameEmojiPreview');

  // 可爱头像池
  const avatarEmojis = [
    '🌸', '✨', '🌟', '⭐', '🦋', '🍀', '🐱', '🐶', '🐼', '🐧',
    '🎈', '💖', '🌈', '☁️', '🍰', '🍭', '🪄', '🎀', '🧸', '🌼'
  ];

  // 获取随机 Emoji
  function getRandomAvatar() {
    return avatarEmojis[Math.floor(Math.random() * avatarEmojis.length)];
  }

  // 读取留言列表
  function loadGuestbookMessages() {
    try {
      const raw = localStorage.getItem(GUESTBOOK_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  // 保存留言列表
  function saveGuestbookMessages(messages) {
    try {
      localStorage.setItem(GUESTBOOK_KEY, JSON.stringify(messages));
    } catch (e) {
      showToast('存储空间不足，无法保存新留言');
    }
  }

  // 格式化时间 (友好显示)
  function formatGuestTime(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return '刚刚';
    if (minutes < 60) return `${minutes}分钟前`;
    if (hours < 24) return `${hours}小时前`;
    if (days < 7) return `${days}天前`;
    return `${date.getMonth()+1}/${date.getDate()} ${date.getHours().toString().padStart(2,'0')}:${date.getMinutes().toString().padStart(2,'0')}`;
  }

  // 渲染留言板 (支持高亮新留言ID)
  function renderGuestbook(highlightId = null) {
    const messages = loadGuestbookMessages();
    if (!guestbookGrid) return;

    if (messages.length === 0) {
      guestbookGrid.innerHTML = `<div class="guestbook-empty"><span>🍃</span> 还没有留言，来做第一个留下足迹的人吧～</div>`;
      if (guestbookCountSpan) guestbookCountSpan.textContent = '0';
      return;
    }

    // 按时间倒序（最新的在前面）
    const sorted = [...messages].sort((a, b) => b.timestamp - a.timestamp);
    if (guestbookCountSpan) guestbookCountSpan.textContent = sorted.length;

    const fragment = document.createDocumentFragment();
    sorted.forEach(msg => {
      const card = document.createElement('div');
      card.className = 'guestbook-card';
      if (highlightId && msg.id === highlightId) {
        card.classList.add('guestbook-card-new');
      }

      card.setAttribute('data-id', msg.id);
      card.innerHTML = `
        <div class="card-header">
          <div class="card-avatar" aria-hidden="true">${escapeHTML(msg.avatar || '🌸')}</div>
          <div class="card-info">
            <div class="card-name">${escapeHTML(msg.name)}</div>
            <div class="card-time">${formatGuestTime(msg.timestamp)}</div>
          </div>
        </div>
        <div class="card-message">${escapeHTML(msg.content)}</div>
        <div class="card-footer">
          <button class="delete-message" data-id="${msg.id}" aria-label="删除留言">🗑️ 删除</button>
        </div>
      `;
      fragment.appendChild(card);
    });

    guestbookGrid.innerHTML = '';
    guestbookGrid.appendChild(fragment);

    // 绑定删除事件
    document.querySelectorAll('.delete-message').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = Number(btn.getAttribute('data-id'));
        deleteGuestbookMessage(id);
      });
    });

    // 若存在高亮ID且对应卡片出现，2秒后移除高亮class（但不会影响动画）
    if (highlightId) {
      setTimeout(() => {
        const newCard = document.querySelector(`.guestbook-card-new`);
        if (newCard) newCard.classList.remove('guestbook-card-new');
      }, 800);
    }
  }

  // 添加留言
  function addGuestbookMessage(name, content) {
    if (!name.trim() || !content.trim()) {
      showToast('昵称和留言内容都不能为空哦 ✨');
      return false;
    }

    const messages = loadGuestbookMessages();
    const newMessage = {
      id: Date.now(),
      name: name.trim().substring(0, 20),
      content: content.trim().substring(0, 200),
      avatar: getRandomAvatar(),
      timestamp: Date.now()
    };
    messages.push(newMessage);
    saveGuestbookMessages(messages);
    renderGuestbook(newMessage.id);  // 传入新ID，卡片会有浮现动画
    showToast('留言成功 ✨ 感谢你的分享');
    return true;
  }

// 删除留言（增加二次确认）
  function deleteGuestbookMessage(id) {
    if (!confirm('确定要删除这条留言吗？删除后将无法恢复哦 🥺')) {
      return; // 用户点击取消，直接退出
    }
    
    let messages = loadGuestbookMessages();
    const newMessages = messages.filter(msg => msg.id !== id);
    if (newMessages.length === messages.length) return;
    saveGuestbookMessages(newMessages);
    renderGuestbook();
    showToast('已悄悄删除一条留言');
  }

  // 提交表单处理
  function handleGuestbookSubmit() {
    const name = guestNameInput ? guestNameInput.value.trim() : '';
    const content = guestMessageInput ? guestMessageInput.value.trim() : '';
    if (!name) {
      showToast('请留下你的名字～');
      guestNameInput?.focus();
      return;
    }
    if (!content) {
      showToast('想说什么呢？写下来吧');
      guestMessageInput?.focus();
      return;
    }
    addGuestbookMessage(name, content);
    if (guestNameInput) guestNameInput.value = '';
    if (guestMessageInput) guestMessageInput.value = '';
    updateCharCount();
    // 刷新昵称预览的随机emoji
    if (nameEmojiPreview) nameEmojiPreview.textContent = getRandomAvatar();
    // 滚动到留言板顶部，让新留言可见
    const guestbookSection = document.getElementById('guestbook');
    if (guestbookSection) {
      guestbookSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

// 实时统计字数（增加超限样式）
  function updateCharCount() {
    if (charCounterSpan && guestMessageInput) {
      const len = guestMessageInput.value.length;
      charCounterSpan.textContent = `${len} / 200`;
      
      // 超限时显示红色警告样式
      if (len >= 200) {
        charCounterSpan.style.color = 'var(--pink-deep)';
        charCounterSpan.style.fontWeight = '700';
      } else {
        charCounterSpan.style.color = 'var(--text-muted)';
        charCounterSpan.style.fontWeight = 'normal';
      }
    }
  }

  // 输入昵称时随机刷新预览emoji（趣味小互动）
  function randomizePreviewEmoji() {
    if (nameEmojiPreview) {
      nameEmojiPreview.style.transform = 'scale(1.2)';
      setTimeout(() => {
        if (nameEmojiPreview) nameEmojiPreview.style.transform = '';
      }, 200);
      nameEmojiPreview.textContent = getRandomAvatar();
    }
  }

  // 初始化事件监听
  function initGuestbook() {
    renderGuestbook();

    if (submitBtn) {
      submitBtn.addEventListener('click', handleGuestbookSubmit);
    }

if (guestMessageInput) {
      guestMessageInput.addEventListener('input', () => {
        updateCharCount();
        // 实时截断超过200字的内容
        if (guestMessageInput.value.length > 200) {
          guestMessageInput.value = guestMessageInput.value.substring(0, 200);
          showToast('留言内容最多 200 字哦 ✍️');
          updateCharCount(); // 立即更新字数统计
        }
      });
    }

    if (guestNameInput) {
      guestNameInput.addEventListener('focus', randomizePreviewEmoji);
      // 每次点一下名字区域也能随机换头像预览
      guestNameInput.addEventListener('click', randomizePreviewEmoji);
    }

    // 支持回车快捷提交（ctrl+enter 或 在输入框按ctrl+enter）
    if (guestMessageInput) {
      guestMessageInput.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
          e.preventDefault();
          handleGuestbookSubmit();
        }
      });
    }
    if (guestNameInput) {
      guestNameInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          guestMessageInput?.focus();
        }
      });
    }
  }

  // 启动留言板（等待DOM完全加载）
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGuestbook);
  } else {
    initGuestbook();
  }
})();
