(function () {
  'use strict';

  /* ==========================================================
     核心工具类：安全的本地存储与防 XSS 注入
     ========================================================== */
  const Utils = {
    storage: {
      get(key, defaultVal = []) {
        try {
          const raw = localStorage.getItem(key);
          return raw ? JSON.parse(raw) : defaultVal;
        } catch (e) {
          console.warn('LocalStorage 读取失败:', e);
          return defaultVal;
        }
      },
      set(key, val) {
        try {
          localStorage.setItem(key, JSON.stringify(val));
          return true;
        } catch (e) {
          showToast('存储空间不足或已被禁用，无法保存 😢');
          return false;
        }
      }
    },
    escapeHTML(str) {
      if (!str) return '';
      const div = document.createElement('div');
      div.textContent = str;
      return div.innerHTML;
    },
    formatTime(timestamp) {
      const diff = Date.now() - new Date(timestamp).getTime();
      const mins = Math.floor(diff / 60000);
      const hrs = Math.floor(diff / 3600000);
      const days = Math.floor(diff / 86400000);

      if (mins < 1) return '刚刚';
      if (mins < 60) return `${mins}分钟前`;
      if (hrs < 24) return `${hrs}小时前`;
      if (days < 7) return `${days}天前`;
      const d = new Date(timestamp);
      return `${d.getMonth() + 1}月${d.getDate()}日 ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    }
  };

  /* ==========================================================
     全局 Toast 提示系统
     ========================================================== */
  function showToast(message) {
    let toast = document.querySelector('.toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.className = 'toast';
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add('show');
    
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => {
      toast.classList.remove('show');
    }, 2500);
  }

  /* ==========================================================
     主题切换 (Dark / Light Mode)
     ========================================================== */
  const themeToggle = document.getElementById('themeToggle');
  const themeIcon = themeToggle.querySelector('.theme-icon');
  
  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    themeIcon.textContent = theme === 'dark' ? '☀️' : '🌙';
    Utils.storage.set('wenjing_theme', theme);
  }

  const savedTheme = Utils.storage.get('wenjing_theme', 'light');
  applyTheme(typeof savedTheme === 'string' ? savedTheme : 'light');

  themeToggle.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme');
    applyTheme(current === 'dark' ? 'light' : 'dark');
  });

  /* ==========================================================
     全局背景音乐控制 (修复自动播放拦截与状态同步)
     ========================================================== */
  const bgMusic = document.getElementById('bgMusic');
  const globalMusicBtn = document.getElementById('globalMusicBtn');
  const vinylRecord = document.querySelector('.vinyl');

  if (bgMusic && globalMusicBtn) {
    const updateMusicUI = (isPlaying) => {
      globalMusicBtn.classList.toggle('playing', isPlaying);
      if (vinylRecord) vinylRecord.classList.toggle('paused', !isPlaying);
    };

    const toggleMusic = () => {
      if (bgMusic.paused) {
        bgMusic.play().then(() => updateMusicUI(true)).catch(() => showToast('播放失败，请稍后重试'));
      } else {
        bgMusic.pause();
        updateMusicUI(false);
      }
    };

    globalMusicBtn.addEventListener('click', toggleMusic);
    if (vinylRecord) vinylRecord.addEventListener('click', toggleMusic);

    const initAudio = () => {
      if (bgMusic.paused) {
        bgMusic.play().then(() => updateMusicUI(true)).catch(() => {});
      }
      document.removeEventListener('click', initAudio);
    };
    document.addEventListener('click', initAudio, { once: true });
  }

  /* ==========================================================
     随手记 (Journal) - 采用事件委托优化性能
     ========================================================== */
  const JOURNAL_KEY = 'wenjing_journal';
  const journalInput = document.getElementById('journalInput');
  const journalSave = document.getElementById('journalSave');
  const journalList = document.getElementById('journalList');

  function renderJournal() {
    const entries = Utils.storage.get(JOURNAL_KEY, []);
    if (entries.length === 0) {
      journalList.innerHTML = `<div class="journal-entry glass-panel" style="justify-content:center; color:var(--text-muted);">还没有随手记，记录一下今天的心情吧 ☁️</div>`;
      return;
    }
    
    const fragment = document.createDocumentFragment();
    entries.forEach(e => {
      const el = document.createElement('div');
      el.className = 'journal-entry glass-panel';
      el.innerHTML = `
        <div style="flex:1;">
          <div class="journal-text">${Utils.escapeHTML(e.text)}</div>
          <div class="card-time">${Utils.formatTime(e.timestamp)}</div>
        </div>
        <button class="delete-btn journal-entry-del" data-id="${e.id}" title="删除">✕</button>
      `;
      fragment.appendChild(el);
    });
    
    journalList.innerHTML = '';
    journalList.appendChild(fragment);
  }

  if (journalSave && journalInput) {
    journalSave.addEventListener('click', () => {
      const text = journalInput.value.trim();
      if (!text) return showToast('先写点什么吧 ✍️');
      
      const entries = Utils.storage.get(JOURNAL_KEY, []);
      entries.unshift({ id: Date.now(), text, timestamp: Date.now() });
      if (Utils.storage.set(JOURNAL_KEY, entries)) {
        journalInput.value = '';
        renderJournal();
        showToast('保存成功 ✨');
      }
    });

    journalList.addEventListener('click', (e) => {
      const btn = e.target.closest('.journal-entry-del');
      if (btn) {
        const id = Number(btn.dataset.id);
        const entries = Utils.storage.get(JOURNAL_KEY, []).filter(item => item.id !== id);
        Utils.storage.set(JOURNAL_KEY, entries);
        renderJournal();
        showToast('记录已删除 🗑️');
      }
    });

    renderJournal();
  }

  /* ==========================================================
     留言板 (Guestbook) - 事件委托与防注入
     ========================================================== */
  const GUESTBOOK_KEY = 'wenjing_guestbook';
  const guestbookGrid = document.getElementById('guestbookGrid');
  const submitGuestbook = document.getElementById('submitGuestbook');
  const guestName = document.getElementById('guestName');
  const guestMessage = document.getElementById('guestMessage');

  function renderGuestbook() {
    const msgs = Utils.storage.get(GUESTBOOK_KEY, []);
    const countEl = document.getElementById('guestbookCount');
    if (countEl) countEl.textContent = msgs.length;

    if (msgs.length === 0) {
      guestbookGrid.innerHTML = `<div class="guestbook-card glass-panel" style="grid-column: 1/-1; text-align:center;">🍃 还没有人留言，来抢沙发吧～</div>`;
      return;
    }

    const fragment = document.createDocumentFragment();
    msgs.forEach(msg => {
      const card = document.createElement('div');
      card.className = 'guestbook-card glass-panel';
      card.innerHTML = `
        <div class="card-header">
          <div class="card-avatar">${Utils.escapeHTML(msg.avatar) || '🌸'}</div>
          <div>
            <strong style="color:var(--purple-deep)">${Utils.escapeHTML(msg.name)}</strong>
            <div class="card-time">${Utils.formatTime(msg.timestamp)}</div>
          </div>
        </div>
        <div class="card-message">${Utils.escapeHTML(msg.content)}</div>
        <button class="delete-btn guestbook-del" data-id="${msg.id}">删除</button>
      `;
      fragment.appendChild(card);
    });

    guestbookGrid.innerHTML = '';
    guestbookGrid.appendChild(fragment);
  }

  if (submitGuestbook) {
    const avatars = ['🌸', '✨', '🌟', '🦋', '🐱', '💖', '🌈', '🍰'];
    
    guestName.addEventListener('input', () => {
      const preview = document.getElementById('nameEmojiPreview');
      if (preview) preview.textContent = avatars[Math.floor(Math.random() * avatars.length)];
    });

    submitGuestbook.addEventListener('click', () => {
      const name = guestName.value.trim();
      const content = guestMessage.value.trim();
      
      if (!name || !content) return showToast('名字和留言都不能为空哦 ✨');

      const msgs = Utils.storage.get(GUESTBOOK_KEY, []);
      msgs.unshift({
        id: Date.now(),
        name: name.substring(0, 20),
        content: content.substring(0, 200),
        avatar: document.getElementById('nameEmojiPreview').textContent,
        timestamp: Date.now()
      });
      
      if (Utils.storage.set(GUESTBOOK_KEY, msgs)) {
        guestName.value = '';
        guestMessage.value = '';
        renderGuestbook();
        showToast('留言成功，感谢你的足迹 🐾');
      }
    });

    guestbookGrid.addEventListener('click', (e) => {
      const btn = e.target.closest('.guestbook-del');
      if (btn && confirm('确定要删除这条留言吗？🥺')) {
        const id = Number(btn.dataset.id);
        const msgs = Utils.storage.get(GUESTBOOK_KEY, []).filter(m => m.id !== id);
        Utils.storage.set(GUESTBOOK_KEY, msgs);
        renderGuestbook();
        showToast('已删除该留言 🗑️');
      }
    });

    renderGuestbook();
  }

  /* ==========================================================
     防抖优化：3D 悬浮卡片 (requestAnimationFrame 避免卡顿)
     ========================================================== */
  const cards = document.querySelectorAll('.interest-card');
  cards.forEach(card => {
    let ticking = false;
    card.addEventListener('mousemove', (e) => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const rect = card.getBoundingClientRect();
          const x = e.clientX - rect.left - rect.width / 2;
          const y = e.clientY - rect.top - rect.height / 2;
          card.style.transform = `perspective(1000px) rotateX(${-y / 25}deg) rotateY(${x / 25}deg) translateY(-8px) scale(1.02)`;
          ticking = false;
        });
        ticking = true;
      }
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
    });
  });

  /* ==========================================================
     相册 Lightbox & 滚动呈现 (Reveal)
     ========================================================== */
  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightboxImg');
  const galleryItems = document.querySelectorAll('.gallery-item img');

  galleryItems.forEach(img => {
    img.addEventListener('click', () => {
      lightboxImg.src = img.getAttribute('data-full') || img.src;
      lightbox.classList.add('open');
      document.body.style.overflow = 'hidden';
    });
  });

  lightbox.addEventListener('click', (e) => {
    if (e.target !== lightboxImg) {
      lightbox.classList.remove('open');
      document.body.style.overflow = '';
    }
  });

  const revealElements = document.querySelectorAll('.reveal');
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

  revealElements.forEach(el => revealObserver.observe(el));

  /* ==========================================================
     Footer 随机语录
     ========================================================== */
  const quotes = [
    '"即使在最黑暗的时刻，也能找到幸福，只要你记得点亮灯光。"',
    '"决定我们成为什么样的人的，不是我们的能力，而是我们的选择。"',
    '"不要怜悯死者，怜悯活着的人。"',
    '"云朵是天空的便签，风一吹就换一页。"',
    '"bug 是代码的悄悄话，它在告诉你哪里还不够细心。"'
  ];
  const footerQuote = document.getElementById('footerQuote');
  if (footerQuote) {
    footerQuote.addEventListener('click', () => {
      footerQuote.style.opacity = 0;
      setTimeout(() => {
        footerQuote.textContent = quotes[Math.floor(Math.random() * quotes.length)] + ' —— 阿不思·邓布利多 / 尹文静';
        footerQuote.style.opacity = 1;
      }, 300);
    });
  }

  /* ==========================================================
     恢复原版 Easter Egg 彩蛋：双击 Logo 飘散表情包
     ========================================================== */
  const logo = document.querySelector('.logo');
  const secretMessages = [
    '✨ 你发现了第一个小彩蛋！',
    '🪄 飞来咒！啊不对，是飞来一只猫',
    '🌟 今天会有好事情发生',
    '🎵 周杰伦的哪首歌正在你脑海里播放？',
    '☁️ 此刻的云是什么形状的？'
  ];

  if (logo) {
    logo.addEventListener('dblclick', () => {
      const msg = secretMessages[Math.floor(Math.random() * secretMessages.length)];
      showToast(msg);

      const rect = logo.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      
      const emojis = ['✨', '⭐', '🌟', '💫', '🌸', '🫧', '🎵', '♪', '💖', '🦋'];
      const fragment = document.createDocumentFragment();

      for (let i = 0; i < 20; i++) {
        const particle = document.createElement('span');
        particle.className = 'particle';
        particle.textContent = emojis[Math.floor(Math.random() * emojis.length)];

        const angle = (Math.PI * 2 * i) / 20 + (Math.random() - 0.5) * 0.5;
        const distance = 60 + Math.random() * 120;
        const dx = Math.cos(angle) * distance;
        const dy = Math.sin(angle) * distance - 30;
        
        particle.style.cssText = `
          left: ${cx}px;
          top: ${cy}px;
          font-size: ${1 + Math.random()}rem;
          --dx: ${dx}px;
          --dy: ${dy}px;
          --rot: ${(Math.random() - 0.5) * 180}deg;
          --dur: ${0.8 + Math.random() * 0.6}s;
        `;
        fragment.appendChild(particle);
      }

      document.body.appendChild(fragment);
      setTimeout(() => {
        document.querySelectorAll('.particle').forEach(p => p.remove());
      }, 2000);
    });
  }

})();