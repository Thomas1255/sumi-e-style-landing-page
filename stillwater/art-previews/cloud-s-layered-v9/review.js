(() => {
  const stage = document.querySelector('.stage');
  const slider = document.querySelector('#progress');
  const output = document.querySelector('#progress-value');
  const play = document.querySelector('#play');
  const status = document.querySelector('#status');
  const after = document.querySelector('.landscape-after');
  const planes = [...document.querySelectorAll('.plane')];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let progress = .76, playing = false, animation = 0, previous = 0;
  function render() {
    const { width, height } = stage.getBoundingClientRect();
    sCloudStudy.frame(progress, width, height).forEach((layer, index) => {
      const image = planes[index];
      image.style.width = layer.width + 'px';
      image.style.height = layer.height + 'px';
      image.style.transform = 'translate3d(' + layer.x + 'px,' + layer.y + 'px,0)';
    });
    after.style.opacity = progress >= .5 ? '1' : '0';
    slider.value = String(Math.round(progress * 1000));
    output.value = Math.round(progress * 100) + '%';
  }
  function pause() {
    playing = false; cancelAnimationFrame(animation); animation = 0; previous = 0;
    play.textContent = 'Play full sweep'; play.setAttribute('aria-pressed','false');
  }
  function tick(time) {
    if (!playing) return;
    if (previous) progress = Math.min(1, progress + Math.min(100, time - previous) / 14000);
    previous = time; render();
    if (progress >= 1) { pause(); return; }
    animation = requestAnimationFrame(tick);
  }
  slider.addEventListener('input', () => { pause(); progress = Number(slider.value) / 1000; render(); });
  play.addEventListener('click', () => {
    if (playing) { pause(); return; }
    progress = 0;
    playing = true; previous = 0; play.textContent = 'Pause'; play.setAttribute('aria-pressed','true');
    animation = requestAnimationFrame(tick);
  });
  document.querySelector('#closed').addEventListener('click', () => { pause(); progress = .52; render(); });
  document.querySelector('#exit').addEventListener('click', () => { pause(); progress = .76; render(); });
  document.querySelector('#reset').addEventListener('click', () => { pause(); progress = 0; render(); });
  document.addEventListener('visibilitychange', () => { if (document.hidden) pause(); });
  reduced.addEventListener('change', pause);
  new ResizeObserver(render).observe(stage);
  Promise.all(planes.map(image => image.decode())).then(() => {
    status.textContent = 'Six layers ready. Drag the slider in either direction.';
    play.disabled = false; slider.disabled = false; render();
  }).catch(() => { status.textContent = 'A cloud image could not load. Check the individual PNGs below.'; });
  render();
})();
