const spinSound = new Audio('/assets/sounds/wheel.mp3');
const rewardSound = new Audio('/assets/sounds/gift.mp3');

function showSparkle() {
  const div = document.createElement('div');
  div.classList.add('sparkle');
  document.body.appendChild(div);
  setTimeout(() => div.remove(), 1500);
}

export function showMemeWheel() {
    const overlay = document.getElementById('memeWheelOverlay');
    overlay.classList.remove('hidden');
  
    const canvas = document.getElementById('wheelCanvas');
    const size = window.innerWidth < 500 ? 250 : 300;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
  
    const segments = [
      '+1 XP', '+1 Qbit', '+2 XP', '+2 Qbit', '+3 XP',
      '+3 Qbit', 'Meme: Motivational', 'Meme: Chaotic', 'Meme: Nerdy', '+5 Qbit'
    ];
  
    drawWheel(ctx, segments);
  
    document.getElementById('spinWheel').onclick = () => {
      const resultIndex = Math.floor(Math.random() * segments.length);
      spinSound.currentTime = 0;
      spinSound.play();
      animateSpin(ctx, segments, resultIndex, () => {
        handleResult(segments[resultIndex]);
      });
    };
  }

  function drawWheel(ctx, segments) {
    const canvas = ctx.canvas;
    const center = canvas.width / 2;
    const radius = canvas.width / 2;
    const angle = (2 * Math.PI) / segments.length;
  
    segments.forEach((label, i) => {
      const start = i * angle;
      const end = start + angle;
  
      ctx.beginPath();
      ctx.moveTo(center, center);
      ctx.arc(center, center, radius, start, end);
      ctx.fillStyle = `hsl(${i * 36}, 90%, 60%)`;
      ctx.fill();
  
      ctx.save();
      ctx.translate(center, center);
      ctx.rotate(start + angle / 2);
      ctx.fillStyle = 'white';
      ctx.font = `${Math.floor(radius * 0.1)}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(label, radius * 0.5, 0);
      ctx.restore();
    });
  }
  
  function animateSpin(ctx, segments, resultIndex, callback) {
    let currentAngle = 0;
    const totalSpins = 6;
    const finalAngle = (2 * Math.PI * resultIndex) / segments.length;
    const targetAngle = totalSpins * 2 * Math.PI + finalAngle;
    const duration = 3000;
    const start = performance.now();
  
    function easeOut(t) {
      return 1 - Math.pow(1 - t, 3);
    }
  
    function animate(time) {
      const elapsed = time - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = easeOut(progress);
      currentAngle = eased * targetAngle;
  
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      ctx.save();
      ctx.translate(ctx.canvas.width / 2, ctx.canvas.height / 2);
      ctx.rotate(currentAngle);
      ctx.translate(-ctx.canvas.width / 2, -ctx.canvas.height / 2);
      drawWheel(ctx, segments);
      ctx.restore();
  
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        highlightSegment(ctx, segments, resultIndex);
        setTimeout(callback, 1000);
      }
    }
  
    requestAnimationFrame(animate);
  }
  
  function highlightSegment(ctx, segments, index) {
    const angle = (2 * Math.PI) / segments.length;
    const start = index * angle;
    const end = start + angle;
  
    ctx.save();
    ctx.translate(ctx.canvas.width / 2, ctx.canvas.height / 2);
    ctx.beginPath();
    ctx.arc(0, 0, ctx.canvas.width / 2, start, end);
    ctx.lineWidth = 6;
    ctx.strokeStyle = 'gold';
    ctx.stroke();
    ctx.restore();
  }
  
  async function handleResult(result) {
    const overlay = document.getElementById('memeWheelOverlay');
  
    if (result.startsWith('+')) {
      const [amount, type] = result.replace('+', '').split(' ');
      const endpoint = type.toLowerCase() === 'xp' ? '/api/rewards/xp' : '/api/rewards/qbit';
  
      await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: parseInt(amount) })
      });
  
      rewardSound.currentTime = 0;
      rewardSound.play();
      showSparkle();
      showPopup(`Je kreeg ${amount} ${type}!`);
    } else if (result.startsWith('Meme')) {
      const category = result.split(': ')[1].toLowerCase();
      const res = await fetch(`/api/memes/random?category=${category}`);
      const meme = await res.json();
      showMeme(meme);
    }
  
    setTimeout(() => overlay.classList.add('hidden'), 10000);
  }
  
  function showPopup(text) {
    const div = document.createElement('div');
    div.classList.add('popup-message');
    div.innerText = text;
    div.addEventListener('click', () => div.remove());
    document.body.appendChild(div);
    setTimeout(() => {
      if (document.body.contains(div)) div.remove();
    }, 10000);
  }
  
  function showMeme({ image_url, quote }) {
    const div = document.createElement('div');
    div.classList.add('popup-message');
    div.innerHTML = `<img src="${image_url}" alt="Meme"><p>${quote}</p>`;
    div.addEventListener('click', () => div.remove());
    document.body.appendChild(div);
    setTimeout(() => {
      if (document.body.contains(div)) div.remove();
    }, 10000);
  }
  
  