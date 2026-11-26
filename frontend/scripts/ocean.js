(() => {
  const canvas = document.getElementById("ocean-background");
  const context = canvas.getContext("2d", { alpha: false });
  const hero = canvas.closest(".hero");
  const background = new Image();
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  let width = 0;
  let height = 0;
  let pixelRatio = 1;
  let frame = null;
  let source = null;

  background.src = "assets/shoreline-hero-v2.png";

  function calculateCoverCrop() {
    const imageRatio = background.naturalWidth / background.naturalHeight;
    const canvasRatio = width / height;

    if (imageRatio > canvasRatio) {
      const sourceHeight = background.naturalHeight;
      const sourceWidth = sourceHeight * canvasRatio;
      source = {
        x: (background.naturalWidth - sourceWidth) / 2,
        y: 0,
        width: sourceWidth,
        height: sourceHeight
      };
    } else {
      const sourceWidth = background.naturalWidth;
      const sourceHeight = sourceWidth / canvasRatio;
      source = {
        x: 0,
        y: (background.naturalHeight - sourceHeight) / 2,
        width: sourceWidth,
        height: sourceHeight
      };
    }
  }

  function resize() {
    const bounds = hero.getBoundingClientRect();
    pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    width = Math.max(1, Math.round(bounds.width));
    height = Math.max(1, Math.round(bounds.height));

    canvas.width = Math.round(width * pixelRatio);
    canvas.height = Math.round(height * pixelRatio);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

    if (background.complete && background.naturalWidth) {
      calculateCoverCrop();
      draw(0);
    }
  }

  function drawBaseImage() {
    context.drawImage(
      background,
      source.x,
      source.y,
      source.width,
      source.height,
      0,
      0,
      width,
      height
    );
  }

  function drawMovingWater(time) {
    const waterTop = Math.floor(height * 0.17);
    const waterBottom = Math.floor(height * 0.74);
    const sliceHeight = 3;
    const sourceScaleY = source.height / height;
    for (let y = waterTop; y < waterBottom; y += sliceHeight) {
      const depth = (y - waterTop) / (waterBottom - waterTop);
      const slowCurrent = Math.sin(time * 0.00034 + y * 0.032) * (0.6 + depth * 1.5);
      const surfaceRipple = Math.sin(time * 0.0007 - y * 0.071) * (0.25 + depth * 0.7);
      const offset = slowCurrent + surfaceRipple;

      context.drawImage(
        background,
        source.x,
        source.y + y * sourceScaleY,
        source.width,
        sliceHeight * sourceScaleY + 1,
        offset,
        y,
        width + 2,
        sliceHeight + 1
      );

      if (depth > 0.46 && y % 15 === 0) {
        context.fillStyle = `rgba(235, 255, 251, ${0.018 + depth * 0.018})`;
        context.fillRect(0, y, width, 1);
      }
    }
  }

  function drawLight(time) {
    const glowX = width * (0.18 + Math.sin(time * 0.00008) * 0.025);
    const glow = context.createRadialGradient(
      glowX,
      height * 0.18,
      0,
      glowX,
      height * 0.18,
      width * 0.52
    );

    glow.addColorStop(0, "rgba(255, 229, 183, 0.13)");
    glow.addColorStop(0.45, "rgba(255, 235, 201, 0.045)");
    glow.addColorStop(1, "rgba(255, 255, 255, 0)");
    context.fillStyle = glow;
    context.fillRect(0, 0, width, height);
  }

  function draw(time) {
    if (!source) return;
    context.clearRect(0, 0, width, height);
    drawBaseImage();

    if (!reducedMotion.matches) {
      drawMovingWater(time);
      drawLight(time);
    }
  }

  function animate(time) {
    draw(time);
    frame = window.requestAnimationFrame(animate);
  }

  function start() {
    if (frame !== null || !background.complete || !background.naturalWidth) return;

    if (reducedMotion.matches) {
      draw(0);
      return;
    }

    frame = window.requestAnimationFrame(animate);
  }

  function stop() {
    if (frame === null) return;
    window.cancelAnimationFrame(frame);
    frame = null;
  }

  background.addEventListener("load", () => {
    calculateCoverCrop();
    draw(0);
    start();
  });

  window.addEventListener("resize", resize);
  reducedMotion.addEventListener("change", () => {
    stop();
    draw(0);
    start();
  });

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stop();
    else start();
  });

  resize();
})();
