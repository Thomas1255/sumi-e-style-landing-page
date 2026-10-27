(() => {
  'use strict';
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const tabs = [...document.querySelectorAll('[role="tab"]')];
  const panels = [...document.querySelectorAll('[role="tabpanel"]')];

  function selectChapter(name, focus = false) {
    const selected = tabs.find(tab => tab.dataset.chapter === name);
    if (!selected) return;
    tabs.forEach(tab => {
      const active = tab === selected;
      tab.classList.toggle('is-active', active);
      tab.setAttribute('aria-selected', String(active));
      tab.tabIndex = active ? 0 : -1;
    });
    panels.forEach(panel => { panel.hidden = panel.id !== selected.getAttribute('aria-controls'); });
    if (focus) selected.focus({ preventScroll: true });
  }
  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => selectChapter(tab.dataset.chapter));
    tab.addEventListener('keydown', event => {
      let next;
      if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
      if (event.key === 'ArrowLeft') next = (index + tabs.length - 1) % tabs.length;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = tabs.length - 1;
      if (next !== undefined) {
        event.preventDefault();
        selectChapter(tabs[next].dataset.chapter, true);
      }
    });
  });
  document.querySelectorAll('[data-next]').forEach(button => button.addEventListener('click', () => {
    selectChapter(button.dataset.next, true);
    document.querySelector('.chapter-tabs').scrollIntoView({ behavior: motion.matches ? 'instant' : 'smooth', block: 'start' });
  }));

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    }), { threshold: .1 });
    document.querySelectorAll('.reveal').forEach(element => observer.observe(element));
    document.documentElement.classList.add('motion-ready');
  }

  const progress = document.querySelector('.reading-progress');
  const art = document.querySelector('.hero-art');
  let scheduled = false;
  function updateScroll() {
    const max = document.documentElement.scrollHeight - innerHeight;
    progress.style.transform = `scaleX(${max > 0 ? scrollY / max : 0})`;
    if (!motion.matches && scrollY < innerHeight * 1.3) {
      art.style.transform = `translateY(${Math.min(scrollY * .13, 110)}px) scale(1.025)`;
    } else if (motion.matches) art.style.transform = '';
    scheduled = false;
  }
  function scheduleScroll() { if (!scheduled) { scheduled = true; requestAnimationFrame(updateScroll); } }
  addEventListener('scroll', scheduleScroll, { passive: true });
  addEventListener('resize', scheduleScroll, { passive: true });
  motion.addEventListener('change', scheduleScroll);
  updateScroll();

  const rippleLayer = document.querySelector('.ripple-layer');
  document.querySelector('.hero').addEventListener('pointerdown', event => {
    if (motion.matches || event.target.closest('a,button')) return;
    const ripple = document.createElement('span');
    ripple.className = 'pointer-ripple';
    ripple.style.left = `${event.clientX}px`;
    ripple.style.top = `${event.clientY}px`;
    rippleLayer.append(ripple);
    ripple.addEventListener('animationend', () => ripple.remove(), { once: true });
    setTimeout(() => ripple.remove(), 2000);
  });

  const soundButton = document.querySelector('.sound-toggle');
  const soundLabel = soundButton.querySelector('.sound-label');
  let context, volume, noiseSource, chimeTimer, playing = false;
  function createPond() {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) throw new Error('Web Audio is unavailable');
    context = new AudioContext();
    volume = context.createGain();
    volume.gain.value = 0;
    volume.connect(context.destination);
    const buffer = context.createBuffer(1, context.sampleRate * 5, context.sampleRate);
    const channel = buffer.getChannelData(0);
    let previous = 0;
    for (let i = 0; i < channel.length; i++) {
      previous = (previous + .025 * (Math.random() * 2 - 1)) / 1.025;
      channel[i] = previous * 3;
    }
    noiseSource = context.createBufferSource();
    noiseSource.buffer = buffer;
    noiseSource.loop = true;
    const water = context.createBiquadFilter();
    water.type = 'lowpass';
    water.frequency.value = 740;
    noiseSource.connect(water);
    water.connect(volume);
    noiseSource.start();
  }
  function drop() {
    if (!playing || context.state !== 'running') return;
    const now = context.currentTime;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(850 + Math.random() * 900, now);
    oscillator.frequency.exponentialRampToValueAtTime(320, now + .17);
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(.065, now + .008);
    gain.gain.exponentialRampToValueAtTime(.0001, now + .34);
    oscillator.connect(gain);
    gain.connect(volume);
    oscillator.start(now);
    oscillator.stop(now + .36);
    oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
  }
  soundButton.addEventListener('click', async () => {
    soundButton.disabled = true;
    try {
      if (!context) createPond();
      await context.resume();
      playing = !playing;
      volume.gain.cancelScheduledValues(context.currentTime);
      volume.gain.setTargetAtTime(playing ? .28 : 0, context.currentTime, .4);
      clearInterval(chimeTimer);
      if (playing) chimeTimer = setInterval(drop, 2200);
      soundButton.setAttribute('aria-pressed', String(playing));
      soundButton.setAttribute('aria-label', `Turn ${playing ? 'off' : 'on'} ambient pond sounds`);
      soundLabel.textContent = playing ? 'Sound on' : 'Sound off';
    } catch {
      playing = false;
      soundLabel.textContent = 'Sound unavailable';
      soundButton.setAttribute('aria-label', 'Ambient pond sounds are unavailable in this browser');
      soundButton.setAttribute('aria-pressed', 'false');
    } finally { soundButton.disabled = false; }
  });
  document.addEventListener('visibilitychange', () => {
    if (!context) return;
    if (document.hidden) context.suspend().catch(() => {});
    else if (playing) context.resume().catch(() => {});
  });
})();
