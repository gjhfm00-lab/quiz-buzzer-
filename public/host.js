const socket = io();

/* ══ DOM refs ══ */
const setupCard       = document.getElementById('setupCard');
const hostPanel       = document.getElementById('hostPanel');
const createError     = document.getElementById('createError');
const setupError      = document.getElementById('setupError');
const createBtn       = document.getElementById('createBtn');
const customCode      = document.getElementById('customCode');
const reconnectBtn    = document.getElementById('reconnectBtn');
const reconnectCode   = document.getElementById('reconnectCode');
const roomCodeDisplay = document.getElementById('roomCodeDisplay');
const joinLinkInput   = document.getElementById('joinLinkInput');
const copyLinkBtn     = document.getElementById('copyLinkBtn');
const hostLinkInput   = document.getElementById('hostLinkInput');
const copyHostLinkBtn = document.getElementById('copyHostLinkBtn');
const playerCountPill = document.getElementById('playerCountPill');
const roundPill       = document.getElementById('roundPill');
const lockPill        = document.getElementById('lockPill');
const lockBtn         = document.getElementById('lockBtn');
const resetBtn        = document.getElementById('resetBtn');
const buzzList        = document.getElementById('buzzList');
const buzzCount       = document.getElementById('buzzCount');
const emptyState      = document.getElementById('emptyState');
const playerTags      = document.getElementById('playerTags');
const playerListCount = document.getElementById('playerListCount');
const playerEmptyState= document.getElementById('playerEmptyState');
const downloadBtn     = document.getElementById('downloadBtn');
const brandIcon       = document.getElementById('brandIcon');
const brandTitle      = document.getElementById('brandTitle');

/* ══ 탭 ══ */
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('tab-' + btn.dataset.tab).classList.add('active');
  });
});

/* ══ 색상 헬퍼 ══ */
function hexToRgb(hex){ const h=hex.replace('#',''); return [parseInt(h.slice(0,2),16),parseInt(h.slice(2,4),16),parseInt(h.slice(4,6),16)]; }
function rgbToHex(r,g,b){ return '#'+[r,g,b].map(v=>Math.max(0,Math.min(255,Math.round(v))).toString(16).padStart(2,'0')).join(''); }
function darken(hex,amt){ try{const[r,g,b]=hexToRgb(hex);return rgbToHex(r*(1-amt),g*(1-amt),b*(1-amt));}catch{return hex;} }
function lighten(hex,amt){ try{const[r,g,b]=hexToRgb(hex);return rgbToHex(r+(255-r)*amt,g+(255-g)*amt,b+(255-b)*amt);}catch{return hex;} }

/* ══ 이미지 하단 색상 추출 ══ */
function extractBottomColor(url) {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const sampleH = Math.min(20, img.height);
        canvas.width = Math.min(img.width, 200);
        canvas.height = sampleH;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, img.height - sampleH, img.width, sampleH, 0, 0, canvas.width, sampleH);
        const data = ctx.getImageData(0, 0, canvas.width, sampleH).data;
        let r=0, g=0, b=0, count=0;
        for (let i=0; i<data.length; i+=4) { r+=data[i]; g+=data[i+1]; b+=data[i+2]; count++; }
        resolve(`rgb(${Math.round(r/count)},${Math.round(g/count)},${Math.round(b/count)})`);
      } catch { resolve(''); }
    };
    img.onerror = () => resolve('');
    img.src = url;
  });
}

/* ══ 디자인 기본값 ══ */
const DEFAULTS = {
  accent:        '#ff4655',
  bg:            '#11121c',
  surface:       '#1c1e2e',
  text:          '#f2f2f7',
  logoText:      '#f2f2f7',
  cardOpacity:   100,
  shape:         'circle',
  buzzerText:    'BUZZ',
  title:         'QUIZ BUZZER',
  iconUrl:       '',
  logoUrl:       '',
  bgUrlPc:       '',
  bgUrlMobile:   '',
  bgColorPc:     '',
  bgColorMobile: '',
};

function loadDesign(){
  try{ const s=localStorage.getItem('quizbuzz_design'); return s?{...DEFAULTS,...JSON.parse(s)}:{...DEFAULTS}; }
  catch{ return {...DEFAULTS}; }
}
function saveDesign(d){
  try{ localStorage.setItem('quizbuzz_design', JSON.stringify(d)); }
  catch(e){ console.warn('디자인 저장 실패', e); }
}

/* ══ 배경 이미지 적용 ══ */
function applyBgImage(d){
  const isMobile = window.innerWidth <= 768;
  const url = isMobile ? (d.bgUrlMobile || d.bgUrlPc || '') : (d.bgUrlPc || d.bgUrlMobile || '');
  const bgColor = isMobile ? (d.bgColorMobile || d.bgColorPc || '') : (d.bgColorPc || d.bgColorMobile || '');
  if(url){
    document.body.style.backgroundImage    = `url(${url})`;
    document.body.style.backgroundSize     = 'cover';
    document.body.style.backgroundPosition = 'top center';
    document.body.style.backgroundRepeat   = 'no-repeat';
    document.body.style.backgroundAttachment = isMobile ? 'scroll' : 'fixed';
    document.body.style.backgroundColor   = bgColor || '';
    if(isMobile){
      document.documentElement.style.minHeight = '100%';
      document.body.style.minHeight = '100vh';
    }
  } else {
    document.body.style.backgroundImage   = '';
    document.body.style.backgroundAttachment = '';
    document.body.style.backgroundColor  = bgColor || '';
  }
}
window.addEventListener('resize', () => applyBgImage(loadDesign()));

/* ══ 디자인 전체 적용 ══ */
function applyDesign(d){
  if(!d) return;
  const root = document.documentElement;
  root.style.setProperty('--accent',    d.accent);
  root.style.setProperty('--accent-dim', darken(d.accent, 0.25));
  root.style.setProperty('--bg',        d.bg);
  root.style.setProperty('--surface',   d.surface);
  root.style.setProperty('--surface-2', lighten(d.surface, 0.06));
  root.style.setProperty('--text',      d.text);
  root.style.setProperty('--card-opacity', (d.cardOpacity ?? 100) / 100);

  applyBgImage(d);

  // 브랜드 아이콘
  if(d.iconUrl){
    brandIcon.innerHTML = `<img src="${d.iconUrl}" style="height:24px;width:24px;object-fit:contain;vertical-align:middle;" />`;
  } else {
    brandIcon.innerHTML = `<span class="dot" style="background:${d.accent};box-shadow:0 0 14px ${d.accent};"></span>`;
  }
  // 브랜드 타이틀
  if(d.logoUrl){
    brandTitle.innerHTML = `<img src="${d.logoUrl}" style="height:28px;object-fit:contain;vertical-align:middle;" alt="로고" />`;
  } else {
    brandTitle.textContent = d.title || 'QUIZ BUZZER';
    brandTitle.style.color = d.logoText || d.text;
  }

  updatePreviewBuzzer(d);
  syncForm(d);
}

function syncForm(d){
  const set = (id,v) => { const el=document.getElementById(id); if(el) el.value=v; };
  const setTxt = (id,v) => { const el=document.getElementById(id); if(el) el.textContent=v; };
  set('colorAccent',d.accent);     setTxt('colorAccentHex',d.accent);
  set('colorBg',d.bg);             setTxt('colorBgHex',d.bg);
  set('colorSurface',d.surface);   setTxt('colorSurfaceHex',d.surface);
  set('colorText',d.text);         setTxt('colorTextHex',d.text);
  set('colorLogoText',d.logoText||d.text); setTxt('colorLogoTextHex',d.logoText||d.text);
  set('siteTitle',d.title||'');
  set('buzzerText',d.buzzerText||'BUZZ');
  const op = d.cardOpacity ?? 100;
  set('cardOpacity', op); setTxt('cardOpacityVal', op+'%');
  set('bgUrlPc',     d.bgUrlPc     || '');
  set('bgUrlMobile', d.bgUrlMobile || '');
  set('iconUrl',     d.iconUrl     || '');
  set('logoUrl',     d.logoUrl     || '');
  document.querySelectorAll('.shape-btn').forEach(b => b.classList.toggle('active', b.dataset.shape === d.shape));

  // 배경 미리보기
  const bgPcEl = document.getElementById('bgPreviewPc');
  if(bgPcEl) bgPcEl.innerHTML = d.bgUrlPc ? `<img src="${d.bgUrlPc}" />` : '<span>미리보기</span>';
  const bgMobEl = document.getElementById('bgPreviewMobile');
  if(bgMobEl) bgMobEl.innerHTML = d.bgUrlMobile ? `<img src="${d.bgUrlMobile}" />` : '<span>미리보기</span>';
  const lp = document.getElementById('logoPreview');
  if(lp) lp.innerHTML = d.logoUrl ? `<img src="${d.logoUrl}" style="max-height:60px;max-width:100%;object-fit:contain;" />` : '<span>로고 URL 입력 후 미리보기</span>';
  const ip = document.getElementById('iconPreview');
  if(ip) ip.innerHTML = d.iconUrl
    ? `<img src="${d.iconUrl}" style="height:40px;width:40px;object-fit:contain;border-radius:8px;" /><span style="font-size:13px;color:var(--text-muted);margin-left:8px;">브랜드 앞에 표시됩니다</span>`
    : '<span style="font-size:13px;color:var(--text-muted);">URL 입력 후 저장하면 브랜드 앞에 표시돼요</span>';
}

function updatePreviewBuzzer(d){
  const pb = document.getElementById('previewBuzzer');
  if(!pb) return;
  const m = {circle:'50%', rounded:'24px', square:'8px'};
  pb.style.background   = `radial-gradient(circle at 35% 30%, ${lighten(d.accent,0.15)} 0%, ${d.accent} 55%, ${darken(d.accent,0.2)} 100%)`;
  pb.style.borderRadius = m[d.shape] || '50%';
  pb.style.boxShadow    = `0 6px 0 ${darken(d.accent,0.25)}, 0 10px 20px ${d.accent}55`;
  pb.textContent = d.buzzerText || 'BUZZ';
}

/* ══ URL 입력 → 즉시 미리보기 ══ */
function bindUrlPreview(inputId, previewId, onLoad) {
  const input = document.getElementById(inputId);
  if(!input) return;
  let timer;
  input.addEventListener('input', () => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      const url = input.value.trim();
      const preview = document.getElementById(previewId);
      if(!preview) return;
      if(url) {
        preview.innerHTML = `<img src="${url}" onerror="this.parentElement.innerHTML='<span style=color:var(--accent)>이미지를 불러올 수 없어요. URL을 확인해주세요.</span>'" />`;
        if(onLoad) onLoad(url);
      } else {
        preview.innerHTML = '<span>미리보기</span>';
      }
    }, 600);
  });
}

// PC 배경 URL 미리보기 + 하단색 추출
bindUrlPreview('bgUrlPc', 'bgPreviewPc', async (url) => {
  if(window.innerWidth > 768){
    document.body.style.backgroundImage = `url(${url})`;
    document.body.style.backgroundSize = 'cover';
    document.body.style.backgroundPosition = 'top center';
    document.body.style.backgroundAttachment = 'fixed';
  }
  const color = await extractBottomColor(url);
  if(color) {
    document.getElementById('bgUrlPc').dataset.bgColor = color;
    document.body.style.backgroundColor = color;
  }
});

// 모바일 배경 URL 미리보기 + 하단색 추출
bindUrlPreview('bgUrlMobile', 'bgPreviewMobile', async (url) => {
  if(window.innerWidth <= 768){
    document.body.style.backgroundImage = `url(${url})`;
    document.body.style.backgroundSize = 'cover';
    document.body.style.backgroundPosition = 'top center';
    document.body.style.backgroundAttachment = 'scroll';
    document.body.style.backgroundColor = '';
    document.documentElement.style.minHeight = '100%';
    document.body.style.minHeight = '100vh';
  }
  const color = await extractBottomColor(url);
  if(color) {
    document.getElementById('bgUrlMobile').dataset.bgColor = color;
    if(window.innerWidth <= 768) document.body.style.backgroundColor = color;
  }
});

bindUrlPreview('logoUrl', 'logoPreview');
bindUrlPreview('iconUrl', 'iconPreview');

// 제거 버튼
document.getElementById('bgRemovePcBtn').addEventListener('click', () => {
  const el = document.getElementById('bgUrlPc');
  el.value = ''; delete el.dataset.bgColor;
  document.getElementById('bgPreviewPc').innerHTML = '<span>미리보기</span>';
  if(window.innerWidth > 768) { document.body.style.backgroundImage=''; document.body.style.backgroundColor=''; }
});
document.getElementById('bgRemoveMobileBtn').addEventListener('click', () => {
  const el = document.getElementById('bgUrlMobile');
  el.value = ''; delete el.dataset.bgColor;
  document.getElementById('bgPreviewMobile').innerHTML = '<span>미리보기</span>';
  if(window.innerWidth <= 768) { document.body.style.backgroundImage=''; document.body.style.backgroundColor=''; }
});
document.getElementById('logoRemoveBtn').addEventListener('click', () => {
  document.getElementById('logoUrl').value = '';
  document.getElementById('logoPreview').innerHTML = '<span>로고 URL 입력 후 미리보기</span>';
  brandTitle.textContent = document.getElementById('siteTitle').value || 'QUIZ BUZZER';
});
document.getElementById('iconRemoveBtn').addEventListener('click', () => {
  document.getElementById('iconUrl').value = '';
  document.getElementById('iconPreview').innerHTML = '<span style="font-size:13px;color:var(--text-muted);">URL 입력 후 저장하면 브랜드 앞에 표시돼요</span>';
  const acc = document.getElementById('colorAccent').value;
  brandIcon.innerHTML = `<span class="dot" style="background:${acc};box-shadow:0 0 14px ${acc};"></span>`;
});

/* ══ 실시간 반영 ══ */
['colorAccent','colorBg','colorSurface','colorText','colorLogoText'].forEach(id => {
  const el = document.getElementById(id); if(!el) return;
  el.addEventListener('input', e => {
    document.getElementById(id+'Hex').textContent = e.target.value;
    applyDesign(collectFormDesign());
  });
});
document.getElementById('cardOpacity').addEventListener('input', e => {
  document.getElementById('cardOpacityVal').textContent = e.target.value + '%';
  document.documentElement.style.setProperty('--card-opacity', e.target.value / 100);
});
document.getElementById('buzzerText').addEventListener('input', () => updatePreviewBuzzer(collectFormDesign()));
document.querySelectorAll('.shape-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.shape-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    updatePreviewBuzzer(collectFormDesign());
  });
});

/* ══ 디자인 수집 ══ */
function collectFormDesign(){
  const activeShape = document.querySelector('.shape-btn.active');
  const pcEl  = document.getElementById('bgUrlPc');
  const mobEl = document.getElementById('bgUrlMobile');
  return {
    accent:        document.getElementById('colorAccent').value,
    bg:            document.getElementById('colorBg').value,
    surface:       document.getElementById('colorSurface').value,
    text:          document.getElementById('colorText').value,
    logoText:      document.getElementById('colorLogoText').value,
    cardOpacity:   parseInt(document.getElementById('cardOpacity').value, 10),
    shape:         activeShape ? activeShape.dataset.shape : 'circle',
    buzzerText:    document.getElementById('buzzerText').value.trim() || 'BUZZ',
    title:         document.getElementById('siteTitle').value.trim() || 'QUIZ BUZZER',
    iconUrl:       document.getElementById('iconUrl').value.trim(),
    logoUrl:       document.getElementById('logoUrl').value.trim(),
    bgUrlPc:       pcEl.value.trim(),
    bgUrlMobile:   mobEl.value.trim(),
    bgColorPc:     pcEl.dataset.bgColor || '',
    bgColorMobile: mobEl.dataset.bgColor || '',
  };
}

/* ══ 저장 / 초기화 ══ */
document.getElementById('saveDesignBtn').addEventListener('click', async () => {
  const btn = document.getElementById('saveDesignBtn');
  btn.textContent = '⏳ 색상 추출 중...';
  btn.disabled = true;

  const d = collectFormDesign();

  // URL이 있고 bgColor가 없으면 지금 추출
  if(d.bgUrlPc && !d.bgColorPc) {
    d.bgColorPc = await extractBottomColor(d.bgUrlPc);
    document.getElementById('bgUrlPc').dataset.bgColor = d.bgColorPc;
  }
  if(d.bgUrlMobile && !d.bgColorMobile) {
    d.bgColorMobile = await extractBottomColor(d.bgUrlMobile);
    document.getElementById('bgUrlMobile').dataset.bgColor = d.bgColorMobile;
  }

  saveDesign(d);
  applyDesign(d);
  socket.emit('designUpdate', d);

  btn.disabled = false;
  btn.textContent = '✅ 저장됨!';
  setTimeout(() => { btn.textContent = '💾 설정 저장 및 적용'; }, 2000);
});

document.getElementById('resetDesignBtn').addEventListener('click', () => {
  if(!confirm('기본값으로 초기화할까요?')) return;
  saveDesign(DEFAULTS);
  applyDesign(DEFAULTS);
  socket.emit('designUpdate', DEFAULTS);
});

window.addEventListener('DOMContentLoaded', () => {
  applyDesign(loadDesign());
  try { const s=localStorage.getItem('quizbuzz_host_code'); if(s) reconnectCode.value=s; } catch{}
});

/* ══ 방 관리 탭 ══ */
const roomListEl      = document.getElementById('roomList');
const roomEmptyState  = document.getElementById('roomEmptyState');
const refreshRoomsBtn = document.getElementById('refreshRoomsBtn');
refreshRoomsBtn.addEventListener('click', () => socket.emit('getRoomList'));

socket.on('roomList', (list) => {
  if(!list || list.length === 0){ roomListEl.innerHTML=''; roomEmptyState.style.display='block'; return; }
  roomEmptyState.style.display = 'none';
  roomListEl.innerHTML = list.map(r => {
    const created = new Date(r.createdAt).toLocaleString('ko-KR', {month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit'});
    const isCurrent = r.code === currentCode;
    return `<li class="buzz-item" style="${isCurrent?'border-color:var(--gold);':''}">
      <div class="buzz-info">
        <div class="buzz-nickname" style="font-size:18px;letter-spacing:3px;">${escapeHtml(r.code)}${isCurrent?' <span style="font-size:12px;color:var(--gold);">현재 방</span>':''}</div>
        <div class="buzz-answer">참가자 ${r.playerCount}명 · 라운드 ${r.round} · ${created} · ${r.locked?'🔒 잠김':'🟢 활성화'}</div>
      </div>
      ${!isCurrent?`<button class="buzz-remove" style="color:var(--accent);font-size:13px;padding:6px 10px;border-radius:8px;border:1px solid var(--accent);background:transparent;cursor:pointer;" data-code="${escapeHtml(r.code)}">삭제</button>`:''}
    </li>`;
  }).join('');
  roomListEl.querySelectorAll('[data-code]').forEach(btn => {
    btn.addEventListener('click', () => {
      if(confirm(`"${btn.dataset.code}" 방을 삭제할까요?`)) socket.emit('deleteRoom', { code: btn.dataset.code });
    });
  });
});

/* ══ 방 만들기 ══ */
let currentCode = null;

function showHostPanel(code){
  currentCode = code;
  roomCodeDisplay.textContent = code;
  setupCard.style.display = 'none';
  hostPanel.style.display = 'block';
  try { localStorage.setItem('quizbuzz_host_code', code); } catch{}

  joinLinkInput.value = `${location.origin}/join?code=${code}`;
  hostLinkInput.value = `${location.origin}/host.html?hostcode=${code}`;
  downloadBtn.href = `/export/${code}`;
  downloadBtn.removeAttribute('download');

  // 디자인 브로드캐스트 (이미지 없는 설정만)
  const d = loadDesign();
  socket.emit('designUpdate', d);
}

function makeCopy(inputId, btnId){
  const btn = document.getElementById(btnId);
  const input = document.getElementById(inputId);
  if(!btn || !input) return;
  btn.addEventListener('click', () => {
    navigator.clipboard.writeText(input.value).then(() => {
      btn.textContent = '복사됨!';
      setTimeout(() => { btn.textContent = '복사'; }, 2000);
    });
  });
  input.addEventListener('click', () => input.select());
}
makeCopy('joinLinkInput', 'copyLinkBtn');
makeCopy('hostLinkInput', 'copyHostLinkBtn');

createBtn.addEventListener('click', () => {
  createError.textContent = '';
  const code = customCode.value.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
  socket.emit('createRoom', { customCode: code });
});
customCode.addEventListener('keydown', e => { if(e.key==='Enter') createBtn.click(); });

reconnectBtn.addEventListener('click', () => {
  const code = reconnectCode.value.trim().toUpperCase();
  if(!code){ setupError.textContent='코드를 입력해주세요.'; return; }
  setupError.textContent = '';
  socket.emit('hostReconnect', { code });
});

window.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(location.search);
  const hc = params.get('hostcode');
  if(hc){ reconnectCode.value=hc.toUpperCase(); socket.emit('hostReconnect', { code: hc.toUpperCase() }); }
});

socket.on('roomCreated',        ({ code }) => showHostPanel(code));
socket.on('roomCreateError',    ({ error }) => { createError.textContent = error; });
socket.on('hostReconnectResult', res => {
  if(res.success) showHostPanel(res.code);
  else setupError.textContent = res.error || '방을 찾을 수 없습니다.';
});

/* ══ 참가자 ══ */
socket.on('playerListUpdate', ({ players, count }) => {
  playerCountPill.textContent = `참가자 ${count}명`;
  playerListCount.textContent = count;
  if(!players || players.length===0){ playerTags.innerHTML=''; playerEmptyState.style.display='block'; return; }
  playerEmptyState.style.display = 'none';
  playerTags.innerHTML = players.map(name => `
    <div class="player-tag">
      <span>${escapeHtml(name)}</span>
      <button class="player-kick" data-name="${escapeHtml(name)}">✕</button>
    </div>`).join('');
  playerTags.querySelectorAll('.player-kick').forEach(btn => {
    btn.addEventListener('click', () => {
      if(confirm(`${btn.dataset.name} 님을 내보낼까요?`)) socket.emit('kickPlayer', { nickname: btn.dataset.name });
    });
  });
});

socket.on('roundUpdate', ({ round }) => { roundPill.textContent = `라운드 ${round}`; });

/* ══ 잠금 / 초기화 ══ */
lockBtn.addEventListener('click', () => socket.emit('toggleLock'));
socket.on('lockUpdate', ({ locked }) => {
  if(locked){ lockPill.textContent='버저 잠김'; lockPill.className='pill locked'; lockBtn.textContent='버저 열기'; }
  else      { lockPill.textContent='버저 활성화됨'; lockPill.className='pill unlocked'; lockBtn.textContent='버저 잠그기'; }
});
resetBtn.addEventListener('click', () => socket.emit('resetBuzzes'));

/* ══ 버저 목록 ══ */
socket.on('buzzUpdate', ({ buzzes }) => {
  buzzCount.textContent = buzzes.length;
  if(buzzes.length===0){ buzzList.innerHTML=''; emptyState.style.display='block'; return; }
  emptyState.style.display = 'none';
  buzzList.innerHTML = buzzes.map((b,idx) => {
    const t = new Date(b.time).toLocaleTimeString('ko-KR',{hour:'2-digit',minute:'2-digit',second:'2-digit'});
    const ans = b.answer ? escapeHtml(b.answer) : '<span style="opacity:0.5;">(답안 미입력)</span>';
    return `<li class="buzz-item">
      <div class="buzz-rank">${b.order}</div>
      <div class="buzz-info">
        <div class="buzz-nickname">${escapeHtml(b.nickname)}</div>
        <div class="buzz-answer">${ans}</div>
      </div>
      <div class="buzz-time">${t}</div>
      <button class="buzz-remove" data-idx="${idx}">✕</button>
    </li>`;
  }).join('');
  buzzList.querySelectorAll('.buzz-remove').forEach(btn => {
    btn.addEventListener('click', () => socket.emit('removeBuzz', { index: parseInt(btn.dataset.idx,10) }));
  });
});

function escapeHtml(str){ const d=document.createElement('div'); d.textContent=str; return d.innerHTML; }
