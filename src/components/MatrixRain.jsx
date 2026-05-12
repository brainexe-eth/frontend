import { useEffect, useRef } from 'react';

const MatrixRain = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let animationId;
    let lastTime = 0;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // Matrix characters: katakana, latin, numbers, symbols
    const chars =
      'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン' +
      '0123456789' +
      'ABCDEFGHIJKLMNOPQRSTUVWXYZ' +
      'abcdefghijklmnopqrstuvwxyz' +
      'ﾊﾐﾋｰｳｼﾅﾓﾆｻﾜﾂｵﾘｱﾎﾃﾏｹﾒｴｶｷﾑﾕﾗｾﾈｽﾀﾇﾍ' +
      '><=-+*/%$#@!&^~`|\\:;,.?{}[]()';

    const fontSize = 16;
    let columns = Math.floor(canvas.width / fontSize);
    const drops = [];

    const initDrops = () => {
      columns = Math.floor(canvas.width / fontSize);
      drops.length = 0;
      for (let i = 0; i < columns; i++) {
        // Randomize starting position so they don't all start at top
        drops[i] = Math.random() * -100;
      }
    };
    initDrops();

    // Occasionally change some characters
    const charMap = [];
    for (let i = 0; i < columns; i++) {
      charMap[i] = chars[Math.floor(Math.random() * chars.length)];
    }

    const draw = (timestamp) => {
      // Throttle to ~30fps for performance and aesthetic
      if (timestamp - lastTime < 33) {
        animationId = requestAnimationFrame(draw);
        return;
      }
      lastTime = timestamp;

      // Semi-transparent black for trail effect
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.font = `${fontSize}px 'JetBrains Mono', monospace`;

      for (let i = 0; i < drops.length; i++) {
        // Randomly change character at this column
        if (Math.random() > 0.95) {
          charMap[i] = chars[Math.floor(Math.random() * chars.length)];
        }
        const text = charMap[i];
        const x = i * fontSize;
        const y = drops[i] * fontSize;

        // Draw trail (dimmer versions behind)
        const headY = drops[i];
        for (let t = 1; t <= 8; t++) {
          const trailY = (headY - t) * fontSize;
          if (trailY > 0) {
            const alpha = Math.max(0, 0.08 - t * 0.01);
            ctx.fillStyle = `rgba(0, 255, 136, ${alpha})`;
            ctx.fillText(text, x, trailY);
          }
        }

        // Bright head
        const brightness = 0.7 + Math.random() * 0.3;
        ctx.fillStyle = `rgba(0, 255, 136, ${brightness})`;
        ctx.shadowColor = 'rgba(0, 255, 136, 0.9)';
        ctx.shadowBlur = 12;
        ctx.fillText(text, x, y);
        ctx.shadowBlur = 0;

        // Reset drop to top randomly after it crosses screen
        if (y > canvas.height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i]++;
      }

      animationId = requestAnimationFrame(draw);
    };

    animationId = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
        pointerEvents: 'none',
      }}
    />
  );
};

export default MatrixRain;
