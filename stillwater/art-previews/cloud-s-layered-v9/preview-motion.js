// Standalone artwork study only; the website does not import this preview.
(() => {
  const clamp = value => Math.max(0, Math.min(1, value));
  const ease = value => { const t = clamp(value); return t * t * (3 - 2 * t); };
  const interval = (p, range) => ease((p - range[0]) / (range[1] - range[0]));
  const layers = [
    { file: 'complete-clouds/01-rear-upper-cloud.png', aspect: 1672/941, width: 2.05, x: -.55, y: -.61, drift: .035, enter: [0,.36], leave: [.74,1] },
    { file: 'complete-clouds/02-rear-low-cloud.png', aspect: 1920/819, width: 2.10, x: -.44, y: -.17, drift: -.025, enter: [.025,.39], leave: [.71,.99] },
    { file: 'complete-clouds/03-middle-cluster.png', aspect: 1, width: 2.20, x: -.60, y: -1.60, drift: .025, enter: [.065,.41], leave: [.68,.97] },
    { file: 'complete-clouds/04-middle-pendant.png', aspect: 1448/1086, width: 1.50, x: -.20, y: -.45, drift: -.045, enter: [.11,.44], leave: [.65,.94] },
    { file: 'complete-clouds/05-front-whiskers.png', aspect: 2, width: 1.55, x: -.12, y: -.30, drift: .055, enter: [.15,.455], leave: [.60,.87] },
    { file: 'complete-clouds/06-front-low-billow.png', aspect: 1.5, width: 1.30, x: -.12, y: -.04, drift: -.035, enter: [.21,.46], leave: [.63,.90] }
  ].map(Object.freeze);
  function frame(progress, width, height) {
    const p = clamp(progress);
    return layers.map(layer => {
      const w = width * layer.width, h = w / layer.aspect;
      const entry = interval(p, layer.enter), exit = interval(p, layer.leave);
      const start = width + 24, closed = width * layer.x, end = -w - 24;
      return {
        file: layer.file, width: w, height: h,
        x: start + (closed - start) * entry + (end - closed) * exit,
        y: height * (layer.y + layer.drift * Math.sin(Math.PI * (entry + exit))),
        entry, exit
      };
    });
  }
  globalThis.sCloudStudy = Object.freeze({ layers: Object.freeze(layers), frame });
})();
