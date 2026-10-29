document.addEventListener('DOMContentLoaded', function () {
  'use strict';
  var root = document.documentElement;
  var header = document.getElementById('top');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var MENU_BREAKPOINT = 960;   /* must match the 960px media query in style.css */

  /* ========================================
     1. HEADER HEIGHT (sections fit the window)
  ======================================== */
  function setHeader() {
    if (header) root.style.setProperty('--hdr', header.offsetHeight + 'px');
  }
  setHeader();
  window.addEventListener('resize', setHeader);
  window.addEventListener('load', setHeader);

  /* ========================================
     2. READING TOOLS
  ======================================== */
  var size = 20;
  function setSize(n) {
    size = Math.max(16, Math.min(28, n));
    root.style.setProperty('--size', size + 'px');
    setHeader();
  }
  var larger = document.getElementById('larger');
  var smaller = document.getElementById('smaller');
  var contrast = document.getElementById('contrast');
  if (larger) larger.addEventListener('click', function () { setSize(size + 2); });
  if (smaller) smaller.addEventListener('click', function () { setSize(size - 2); });
  if (contrast) contrast.addEventListener('click', function () {
    var on = root.classList.toggle('hc');
    contrast.setAttribute('aria-pressed', String(on));
  });

  /* ========================================
     3. VIDEO CAROUSEL
     Every video plays for SECONDS, then the next one starts.
     Edit the list: file name, big title, small text.
  ======================================== */
  var SECONDS = 8;

  var VIDEOS = [
    { src: 'assets/parlament.mp4',      title: 'In Parliament',             text: 'First speech.' },
    { src: 'assets/SSB Foundation.mp4', title: 'SSB Foundation',            text: 'Helping through foundation initiatives.' },
    { src: 'assets/Am green.mp4',       title: 'Project Visits',            text: 'On the ground where development takes shape.' },
    { src: 'assets/people.mp4',         title: 'Connecting With People', text: 'Real conversations to know their concerns. ' },
    { src: 'assets/kite.1.mp4',         title: 'With GenZ',             text: 'Inspiring yound minds. Enabling brighter futures.' }
  ];

  var stage = document.getElementById('stage');
  if (stage) {
    var player = document.getElementById('player');
    var capTitle = document.getElementById('capTitle');
    var capText = document.getElementById('capText');
    var dotsBox = document.getElementById('dots');
    var prevBtn = document.getElementById('prev');
    var nextBtn = document.getElementById('next');
    var toggleBtn = document.getElementById('toggle');
    var soundBtn = document.getElementById('sound');

    var idx = 0;
    var dotBtns = [];
    var fills = [];
    var playing = !reduce;      /* what the visitor wants */
    var visible = true;         /* is the carousel on screen */
    var loading = false;        /* true while a new video is loading */

    player.muted = true;
    player.playsInline = true;

    function safePlay() {
      if (!playing || !visible) return;
      var p = player.play();
      if (p && p.catch) p.catch(function () {});
    }

    function paintToggle() {
      if (!toggleBtn) return;
      toggleBtn.textContent = playing ? '❚❚' : '▶';
      toggleBtn.setAttribute('aria-label', playing ? 'Pause video' : 'Play video');
    }

    /* Time bars: finished videos are full, the current one fills over SECONDS */
    function paintBars(pct) {
      fills.forEach(function (f, k) {
        f.style.width = (k < idx ? 100 : (k === idx ? pct : 0)) + '%';
      });
    }

    function show(i) {
      idx = (i + VIDEOS.length) % VIDEOS.length;
      var v = VIDEOS[idx];

      loading = true;
      player.pause();
      player.src = encodeURI(v.src) + (playing ? '' : '#t=0.1');
      player.setAttribute('aria-label', v.title);
      player.load();

      capTitle.textContent = v.title;
      capText.textContent = v.text;

      dotBtns.forEach(function (b, k) {
        b.classList.toggle('cur', k === idx);
        if (k === idx) b.setAttribute('aria-current', 'true');
        else b.removeAttribute('aria-current');
      });
      paintBars(0);
      safePlay();
    }

    VIDEOS.forEach(function (v, k) {
      var b = document.createElement('button');
      b.type = 'button';
      b.setAttribute('aria-label', 'Go to video ' + (k + 1) + ': ' + v.title);
      var fill = document.createElement('i');
      b.appendChild(fill);
      b.addEventListener('click', function () { show(k); });
      dotsBox.appendChild(b);
      dotBtns.push(b);
      fills.push(fill);
    });

    /* The clock counts only while the video is really playing */
    player.addEventListener('loadedmetadata', function () { loading = false; });
    player.addEventListener('timeupdate', function () {
      if (loading || !playing) return;
      var t = player.currentTime;
      paintBars(Math.min(t / SECONDS * 100, 100));
      if (t >= SECONDS) show(idx + 1);
    });

    /* A video shorter than SECONDS moves on when it ends */
    player.addEventListener('ended', function () { show(idx + 1); });

    /* A missing file: show a message, then skip it */
    player.addEventListener('error', function () {
      capText.textContent = 'This video could not be loaded. Check the file name in assets.';
      setTimeout(function () { if (player.error) show(idx + 1); }, 3000);
    });

    if (prevBtn) prevBtn.addEventListener('click', function () { show(idx - 1); });
    if (nextBtn) nextBtn.addEventListener('click', function () { show(idx + 1); });

    if (toggleBtn) toggleBtn.addEventListener('click', function () {
      playing = !playing;
      if (playing) safePlay(); else player.pause();
      paintToggle();
    });

    if (soundBtn) soundBtn.addEventListener('click', function () {
      player.muted = !player.muted;
      soundBtn.textContent = player.muted ? '🔇' : '🔊';
      soundBtn.setAttribute('aria-label', player.muted ? 'Turn sound on' : 'Turn sound off');
      soundBtn.setAttribute('aria-pressed', String(!player.muted));
    });

    stage.addEventListener('keydown', function (e) {
      if (e.target.closest('button, a')) return;
      if (e.key === 'ArrowRight') show(idx + 1);
      if (e.key === 'ArrowLeft') show(idx - 1);
    });

    /* Pause while the carousel is off-screen, continue when it returns */
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          visible = en.isIntersecting;
          if (!visible) player.pause();
          else safePlay();
        });
      }, { threshold: 0.25 }).observe(stage);
    }

    paintToggle();
    show(0);
  }

  /* ========================================
     4. BACK-TO-TOP BUTTON
  ======================================== */
  var toTop = document.getElementById('toTop');
  var hero = document.querySelector('.hero');
  function toggleToTop() {
    if (!toTop || !hero) return;
    toTop.classList.toggle('show', window.scrollY > hero.offsetHeight - 120);
  }
  window.addEventListener('scroll', toggleToTop, { passive: true });
  window.addEventListener('resize', toggleToTop);
  toggleToTop();

  /* ========================================
     5. HEADER: MENU (tablets + phones) AND READING OPTIONS
  ======================================== */
  var burger = document.getElementById('burger');
  var nav = document.getElementById('nav');
  var accessBtn = document.getElementById('accessBtn');
  var accessPanel = document.getElementById('accessPanel');

  function closeMenu() {
    if (!nav || !burger) return;
    nav.classList.remove('open');
    burger.setAttribute('aria-expanded', 'false');
    burger.setAttribute('aria-label', 'Open menu');
  }
  function closePanel() {
    if (!accessBtn || !accessPanel) return;
    accessPanel.hidden = true;
    accessBtn.setAttribute('aria-expanded', 'false');
  }

  if (burger && nav) {
    burger.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      burger.setAttribute('aria-expanded', String(open));
      burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      closePanel();
    });
    /* Tapping a link closes the menu */
    nav.addEventListener('click', function (e) {
      if (e.target.closest('a')) closeMenu();
    });
    /* Growing the window to desktop size closes the menu */
    window.addEventListener('resize', function () {
      if (window.innerWidth > MENU_BREAKPOINT) closeMenu();
    });
  }
  if (accessBtn && accessPanel) {
    accessBtn.addEventListener('click', function () {
      var open = accessPanel.hidden;
      accessPanel.hidden = !open;
      accessBtn.setAttribute('aria-expanded', String(open));
      closeMenu();
    });
  }
  /* Tapping outside closes whatever is open */
  document.addEventListener('click', function (e) {
    if (!e.target.closest('.access')) closePanel();
    if (!e.target.closest('#nav') && !e.target.closest('#burger')) closeMenu();
  });
  /* Escape closes the menu and returns focus to the menu button */
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    var menuWasOpen = nav && nav.classList.contains('open');
    closePanel();
    closeMenu();
    if (menuWasOpen && burger) burger.focus();
  });

  /* ========================================
     6. ACTIVE NAV LINK (the Contact button is skipped)
  ======================================== */
  var navLinks = Array.prototype.slice.call(document.querySelectorAll('#nav a[href^="#"]:not(.btn)'));
  var navTargets = navLinks.map(function (a) { return document.querySelector(a.getAttribute('href')); });
  var connectSec = document.getElementById('connect');
  function spy() {
    if (!header) return;
    var y = window.scrollY + header.offsetHeight + window.innerHeight * 0.3;
    var found = -1;
    navTargets.forEach(function (t, i) { if (t && t.offsetTop <= y) found = i; });
    if (connectSec && connectSec.offsetTop <= y) found = -1;
    navLinks.forEach(function (a, i) {
      a.classList.toggle('active', i === found);
      if (i === found) a.setAttribute('aria-current', 'location');
      else a.removeAttribute('aria-current');
    });
  }
  window.addEventListener('scroll', spy, { passive: true });
  window.addEventListener('resize', spy);
  spy();
});