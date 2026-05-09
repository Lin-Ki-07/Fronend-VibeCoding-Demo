// 粒子背景
const canvas = document.getElementById('particles');
const ctx = canvas.getContext('2d');
let particles = [];
function resizeCanvas() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
class Particle {
  constructor() { this.reset(); }
  reset() {
    this.x = Math.random() * canvas.width; this.y = Math.random() * canvas.height;
    this.size = Math.random() * 2 + 0.5;
    this.speedX = (Math.random() - 0.5) * 0.5; this.speedY = (Math.random() - 0.5) * 0.5;
    this.opacity = Math.random() * 0.4 + 0.1;
  }
  update() {
    this.x += this.speedX; this.y += this.speedY;
    if (this.x < 0 || this.x > canvas.width || this.y < 0 || this.y > canvas.height) this.reset();
  }
  draw() {
    ctx.fillStyle = `rgba(255, 189, 89, ${this.opacity})`;
    ctx.beginPath(); ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2); ctx.fill();
  }
}
function initParticles() { particles = []; for (let i = 0; i < 80; i++) particles.push(new Particle()); }
function animateParticles() {
  ctx.clearRect(0,0,canvas.width,canvas.height);
  particles.forEach(p => { p.update(); p.draw(); });
  requestAnimationFrame(animateParticles);
}
resizeCanvas(); initParticles(); animateParticles();
window.addEventListener('resize', () => { resizeCanvas(); if (cCanvas) resizeCardCanvas(); });

// 卡片动效
const cCanvas = document.getElementById('cardCanvas');
const cCtx = cCanvas ? cCanvas.getContext('2d') : null;
let cPoints = [];
let mouse = { x:0, y:0, radius:60 };
let isMouseOver = false;
function resizeCardCanvas() {
  if (!cCanvas) return;
  cCanvas.width = cCanvas.offsetWidth; cCanvas.height = cCanvas.offsetHeight;
  initCardPoints();
}
function initCardPoints() {
  if (!cCtx) return; cPoints = [];
  const cx = cCanvas.width/2, cy = cCanvas.height/2;
  const count = 192;
  for (let i=0; i<count; i++) {
    const angle = (i/count)*Math.PI*2;
    const r = 80 + Math.random()*20;
    const x = cx + Math.cos(angle)*r;
    const y = cy + Math.sin(angle)*r;
    cPoints.push({x,y,ox:x,oy:y,size:Math.random()*2.5+1.5});
  }
}
function animateCard() {
  if (!cCtx) { requestAnimationFrame(animateCard); return; }
  cCtx.clearRect(0,0,cCanvas.width,cCanvas.height);
  cPoints.forEach(p => {
    const dx = p.x - mouse.x, dy = p.y - mouse.y;
    const d = Math.hypot(dx,dy);
    if (isMouseOver && d < mouse.radius) {
      const a = Math.atan2(dy,dx);
      p.x += Math.cos(a)*(mouse.radius-d)*0.15;
      p.y += Math.sin(a)*(mouse.radius-d)*0.15;
    } else {
      p.x += (p.ox-p.x)*0.1;
      p.y += (p.oy-p.y)*0.1;
    }
    cCtx.fillStyle = '#ffbd59';
    cCtx.beginPath(); cCtx.arc(p.x,p.y,p.size,0,Math.PI*2); cCtx.fill();
  });
  requestAnimationFrame(animateCard);
}
if (cCanvas) {
  resizeCardCanvas(); animateCard();
  cCanvas.addEventListener('mouseenter', ()=>isMouseOver=true);
  cCanvas.addEventListener('mouseleave', ()=>isMouseOver=false);
  cCanvas.addEventListener('mousemove',(e)=>{
    const r = cCanvas.getBoundingClientRect();
    mouse.x = e.clientX - r.left;
    mouse.y = e.clientY - r.top;
  });
}

// 翻页
const slides = document.querySelectorAll('.slide');
const dotsContainer = document.querySelector('.dots');
const backBtn = document.getElementById('backBtn');
let current = 0;

document.getElementById('goto2').onclick = () => showSlide(1);
backBtn.onclick = () => showSlide(0);

function createDots() {
  slides.forEach((_,i)=>{
    const d = document.createElement('div');
    d.className = 'dot';
    if (i===0) d.classList.add('active');
    d.onclick = () => showSlide(i);
    dotsContainer.appendChild(d);
  });
}

function showSlide(i) {
  current = i;
  slides.forEach((s,idx)=>s.classList.toggle('active', idx===i));
  document.querySelectorAll('.dot').forEach((d,idx)=>d.classList.toggle('active', idx===i));
  backBtn.classList.toggle('show', i !== 0);

  // 控制抽屉标签可见性（仅第4页，index=3）
  document.querySelectorAll('.drawer-tab').forEach(tab => {
    tab.style.display = (i === 3) ? 'flex' : 'none';
  });
  // 离开第4页时关闭抽屉
  if (i !== 3 && openDrawer) {
    closeDrawer();
  }
  // 切换到第5页时重置卡片状态
  if (i === 4) {
    cardIndex = 0;
    const track = document.getElementById('cardsTrack');
    if (track) track.style.transform = 'translateX(0)';
    updateCardNav();
    document.querySelectorAll('.flip-card').forEach(c => c.classList.remove('flipped'));
  }
}

// ===== 第5页卡片横向滚动逻辑 =====
let cardIndex = 0;
let cardsTrack = null;
let flipCards = null;

function getCardState() {
  if (!cardsTrack) {
    cardsTrack = document.getElementById('cardsTrack');
    flipCards = document.querySelectorAll('#cardsTrack .flip-card');
  }
  return { track: cardsTrack, cards: flipCards };
}

function scrollCards(direction) {
  const { track, cards } = getCardState();
  if (!track || !cards.length) return;
  const maxIdx = cards.length - 1;
  cardIndex = Math.max(0, Math.min(maxIdx, cardIndex + direction));

  // 计算偏移：将目标卡片滚动到可见区域中央
  const wrapper = track.parentElement;
  const wrapperWidth = wrapper ? wrapper.offsetWidth : window.innerWidth;
  const targetCard = cards[cardIndex];
  const cardWidth = targetCard.offsetWidth;
  // 找到目标卡片在 track 中的位置
  const targetLeft = targetCard.offsetLeft;
  // 让卡片居中于 wrapper 中
  const offset = targetLeft - (wrapperWidth / 2 - cardWidth / 2);
  track.style.transform = `translateX(-${Math.max(0, offset)}px)`;

  updateCardNav();
}

function updateCardNav() {
  const dots = document.querySelectorAll('.cards-nav-dot');
  dots.forEach((d, i) => d.classList.toggle('active', i === cardIndex));
}

function jumpToCard(idx) {
  cardIndex = idx;
  const { track, cards } = getCardState();
  if (!track || !cards.length) return;
  const wrapper = track.parentElement;
  const wrapperWidth = wrapper ? wrapper.offsetWidth : window.innerWidth;
  const targetCard = cards[idx];
  const cardWidth = targetCard.offsetWidth;
  const targetLeft = targetCard.offsetLeft;
  const offset = targetLeft - (wrapperWidth / 2 - cardWidth / 2);
  track.style.transform = `translateX(-${Math.max(0, offset)}px)`;
  updateCardNav();
}

// 统一滚轮翻页（含第5页卡片横向滚动）
window.addEventListener('wheel', function(e) {
  // 第5页（index=4）：优先横向滚动卡片
  if (current === 4) {
    const { cards } = getCardState();
    if (cards && cards.length) {
      const maxIdx = cards.length - 1;
      if (e.deltaX !== 0) {
        if (e.deltaX > 0 && cardIndex < maxIdx) {
          e.preventDefault(); scrollCards(1); return;
        } else if (e.deltaX < 0 && cardIndex > 0) {
          e.preventDefault(); scrollCards(-1); return;
        }
      }
      if (e.deltaY > 0 && cardIndex < maxIdx) {
        e.preventDefault(); scrollCards(1); return;
      } else if (e.deltaY < 0 && cardIndex > 0) {
        e.preventDefault(); scrollCards(-1); return;
      }
    }
  }
  // 正常翻页
  const next = Math.max(0, Math.min(slides.length - 1, current + (e.deltaY > 0 ? 1 : -1)));
  showSlide(next);
}, { passive: false });

window.addEventListener('keydown', function(e) {
  // 第5页时左右键切换卡片
  if (current === 4) {
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      scrollCards(1);
      return;
    }
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      scrollCards(-1);
      return;
    }
  }
  let next = current;
  if (e.key === 'ArrowDown') next++;
  if (e.key === 'ArrowUp') next--;
  next = Math.max(0, Math.min(slides.length-1, next));
  showSlide(next);
});

// 翻转卡片点击事件
document.addEventListener('click', function(e) {
  const card = e.target.closest('.flip-card');
  if (card) {
    card.classList.toggle('flipped');
  }
});

// 卡片导航圆点点击
document.addEventListener('click', function(e) {
  if (e.target.classList.contains('cards-nav-dot')) {
    const idx = parseInt(e.target.dataset.index);
    if (!isNaN(idx)) jumpToCard(idx);
  }
});

// ===== 第4页 侧边抽屉逻辑 =====
let openDrawer = null;
let drawerSlideIdx = 0;

function setDrawerSlide(idx) {
  const slides = document.querySelectorAll('#drawer1 .drawer-slide');
  const dots = document.querySelectorAll('#drawer1 .drawer-slide-dot');
  if (!slides.length) return;
  idx = Math.max(0, Math.min(slides.length - 1, idx));
  drawerSlideIdx = idx;
  slides.forEach((s, i) => s.classList.toggle('active', i === idx));
  dots.forEach((d, i) => d.classList.toggle('active', i === idx));
}

// 抽屉拖动调整宽度
let resizing = null;
let resizeStartX = 0;
let resizeStartW = 0;

document.addEventListener('mousedown', function(e) {
  if (e.target.classList.contains('drawer-resize-handle')) {
    e.preventDefault();
    const panel = e.target.closest('.drawer-panel');
    if (!panel) return;
    resizing = panel;
    resizeStartX = e.clientX;
    resizeStartW = panel.getBoundingClientRect().width;
    e.target.classList.add('dragging');
  }
});

document.addEventListener('mousemove', function(e) {
  if (!resizing) return;
  const dx = e.clientX - resizeStartX;
  const newW = Math.max(320, Math.min(window.innerWidth * 0.9, resizeStartW + dx));
  resizing.style.width = newW + 'px';

  const tab = document.getElementById('drawerTab1');
  if (tab) tab.style.left = newW + 'px';
});

document.addEventListener('mouseup', function() {
  if (resizing) {
    resizing.querySelector('.drawer-resize-handle').classList.remove('dragging');
    resizing = null;
  }
});

function closeDrawer() {
  const panel = document.getElementById('drawer1');
  const overlay = document.getElementById('drawerOverlay');
  if (panel) panel.classList.remove('open');
  if (overlay) overlay.classList.remove('show');
  openDrawer = null;

  const tab = document.getElementById('drawerTab1');
  if (tab) {
    tab.style.left = '0';
    tab.textContent = '◀';
  }
}

function openDrawerPanel() {
  const panel = document.getElementById('drawer1');
  const overlay = document.getElementById('drawerOverlay');
  if (panel) panel.classList.add('open');
  if (overlay) overlay.classList.add('show');
  openDrawer = 'drawer1';
  setDrawerSlide(0);

  const tab = document.getElementById('drawerTab1');
  if (tab && panel) {
    tab.style.left = panel.getBoundingClientRect().width + 'px';
    tab.textContent = '▶';
  }
}

// 抽屉内滚轮切换内容
document.getElementById('drawer1').addEventListener('wheel', function(e) {
  if (!openDrawer) return;
  e.preventDefault();
  e.stopPropagation();
  const slides = document.querySelectorAll('#drawer1 .drawer-slide');
  const total = slides.length;
  if (e.deltaY > 0) {
    setDrawerSlide((drawerSlideIdx + 1) % total);
  } else if (e.deltaY < 0) {
    setDrawerSlide((drawerSlideIdx - 1 + total) % total);
  }
}, { passive: false });

document.addEventListener('click', function(e) {
  // 抽屉标签点击
  if (e.target.classList.contains('drawer-tab')) {
    if (openDrawer) {
      closeDrawer();
    } else {
      openDrawerPanel();
    }
  }
  // 关闭按钮
  if (e.target.classList.contains('drawer-close')) {
    closeDrawer();
  }
  // 点击遮罩关闭
  if (e.target.id === 'drawerOverlay') {
    if (openDrawer) closeDrawer();
  }
  // 抽屉内导航圆点点击
  if (e.target.classList.contains('drawer-slide-dot')) {
    const dots = document.querySelectorAll('#drawer1 .drawer-slide-dot');
    const idx = Array.from(dots).indexOf(e.target);
    if (idx >= 0) setDrawerSlide(idx);
  }
  // 第3页 点击交互词汇展开/收起信息卡片
  if (e.target.classList.contains('info-trigger') || e.target.classList.contains('title-trigger')) {
    const cardId = e.target.dataset.info;
    const card = document.getElementById(cardId);
    if (card) {
      const wasOpen = card.classList.contains('open');
      document.querySelectorAll('.info-card').forEach(c => c.classList.remove('open'));
      if (!wasOpen) card.classList.add('open');
    }
  }
});

// ===== 第2页 大型项目 弹窗 =====
const projectTrigger = document.getElementById('projectTrigger');
const projectOverlay = document.getElementById('projectOverlay');
const projectClose = document.getElementById('projectClose');

if (projectTrigger) {
  projectTrigger.addEventListener('click', function(e) {
    e.stopPropagation();
    projectOverlay.classList.add('show');
  });
}
if (projectClose) {
  projectClose.addEventListener('click', function() {
    projectOverlay.classList.remove('show');
  });
}
if (projectOverlay) {
  projectOverlay.addEventListener('click', function(e) {
    if (e.target === projectOverlay) projectOverlay.classList.remove('show');
  });
}

createDots();
showSlide(0);
