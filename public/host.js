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
const brandDot        = document.getElementById('brandDot');
const brandTitle      = document.getElementById('brandTitle');
const brandIcon       = document.getElementById('brandIcon');

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

/* ══ 디자인 기본값 ══ */
const DEFAULTS = {
  accent:      '#ff4655',
  bg:          '#11121c',
  surface:     '#1c1e2e',
  text:        '#f2f2f7',
  logoText:    '#f2f2f7',   // 로고 텍스트 색상 (독립)
  cardOpacity: 100,
  shape:       'circle',
  buzzerText:  'BUZZ',
  title:       'QUIZ BUZZER',
  icon:        null,
  logo:        null,
  bgImagePc:   null,   // PC 배경
  bgImageMobile: null, // 모바일 배경
};

function loadDesign(){
  try{ const s=localStorage.getItem('quizbuzz_design'); return s?{...DEFAULTS,...JSON.parse(s)}:{...DEFAULTS}; }catch{return{...DEFAULTS};}
}
function saveDesign(d){
  try{ localStorage.setItem('quizbuzz_design',JSON.stringify(d)); }catch(e){
    const slim={...d,logo:null,icon:null,bgImagePc:null,bgImageMobile:null};
    try{localStorage.setItem('quizbuzz_design',JSON.stringify(slim));}catch{}
  }
}

function applyDesign(d){
  if(!d)return;
  const root=document.documentElement;
  root.style.setProperty('--accent',d.accent);
  root.style.setProperty('--accent-dim',darken(d.accent,0.25));
  root.style.setProperty('--bg',d.bg);
  root.style.setProperty('--surface',d.surface);
  root.style.setProperty('--surface-2',lighten(d.surface,0.06));
  root.style.setProperty('--text',d.text);
  root.style.setProperty('--card-opacity',(d.cardOpacity??100)/100);

  // 배경 이미지 (PC/모바일 분기)
  applyBgImage(d);

  // 브랜드 아이콘
  if(d.icon){
    brandIcon.innerHTML=`<img src="${d.icon}" style="height:24px;width:24px;object-fit:contain;vertical-align:middle;" />`;
  } else {
    brandIcon.innerHTML=`<span class="dot" id="brandDot" style="background:${d.accent};box-shadow:0 0 14px ${d.accent};"></span>`;
  }
  // 브랜드 타이틀
  if(d.logo){
    brandTitle.innerHTML=`<img src="${d.logo}" style="height:28px;object-fit:contain;vertical-align:middle;" alt="로고" />`;
  } else {
    brandTitle.textContent=d.title||'QUIZ BUZZER';
    brandTitle.style.color=d.logoText||d.text;
  }

  updatePreviewBuzzer(d);

  // 폼 동기화
  const set=(id,v)=>{const el=document.getElementById(id);if(el)el.value=v;};
  const setTxt=(id,v)=>{const el=document.getElementById(id);if(el)el.textContent=v;};
  set('colorAccent',d.accent);   setTxt('colorAccentHex',d.accent);
  set('colorBg',d.bg);           setTxt('colorBgHex',d.bg);
  set('colorSurface',d.surface); setTxt('colorSurfaceHex',d.surface);
  set('colorText',d.text);       setTxt('colorTextHex',d.text);
  set('colorLogoText',d.logoText||d.text); setTxt('colorLogoTextHex',d.logoText||d.text);
  set('siteTitle',d.title||'');
  set('buzzerText',d.buzzerText||'BUZZ');
  const opacity=d.cardOpacity??100;
  set('cardOpacity',opacity); setTxt('cardOpacityVal',opacity+'%');

  document.querySelectorAll('.shape-btn').forEach(b=>b.classList.toggle('active',b.dataset.shape===d.shape));

  // 배경 미리보기
  const bgPcEl=document.getElementById('bgPreviewPc');
  if(bgPcEl) bgPcEl.innerHTML=d.bgImagePc?`<img src="${d.bgImagePc}" />`:'<span>PC 배경 이미지 없음</span>';
  const bgMobEl=document.getElementById('bgPreviewMobile');
  if(bgMobEl) bgMobEl.innerHTML=d.bgImageMobile?`<img src="${d.bgImageMobile}" />`:'<span>모바일 배경 이미지 없음</span>';

  // 로고 미리보기
  const lp=document.getElementById('logoPreview');
  if(lp) lp.innerHTML=d.logo?`<img src="${d.logo}" style="max-height:60px;max-width:100%;object-fit:contain;" />`:'<span>로고 이미지 없음</span>';

  // 아이콘 미리보기
  const ip=document.getElementById('iconPreview');
  if(ip) ip.innerHTML=d.icon
    ?`<img src="${d.icon}" style="height:40px;width:40px;object-fit:contain;border-radius:8px;" /><span style="font-size:13px;color:var(--text-muted);">브랜드 앞에 표시됩니다</span>`
    :'<span style="font-size:13px;color:var(--text-muted);">업로드하면 브랜드 이름 앞에 표시돼요</span>';
}

// PC/모바일 배경 분기 적용
function applyBgImage(d){
  const isMobile = window.innerWidth <= 768;
  const img = isMobile ? (d.bgImageMobile || d.bgImagePc) : (d.bgImagePc || d.bgImageMobile);
  if(img){
    document.body.style.backgroundImage=`url(${img})`;
    document.body.style.backgroundSize='cover';
    document.body.style.backgroundPosition='top center';
    document.body.style.backgroundRepeat='no-repeat';
    document.body.style.backgroundAttachment= isMobile ? 'scroll' : 'fixed';
    if(isMobile){
      document.documentElement.style.minHeight='100%';
      document.body.style.minHeight='100vh';
    }
  } else {
    document.body.style.backgroundImage='';
    document.body.style.backgroundAttachment='';
  }
}
window.addEventListener('resize', ()=>{ applyBgImage(loadDesign()); });

function updatePreviewBuzzer(d){
  const pb=document.getElementById('previewBuzzer');
  if(!pb)return;
  const m={circle:'50%',rounded:'24px',square:'8px'};
  pb.style.background=`radial-gradient(circle at 35% 30%, ${lighten(d.accent,0.15)} 0%, ${d.accent} 55%, ${darken(d.accent,0.2)} 100%)`;
  pb.style.borderRadius=m[d.shape]||'50%';
  pb.style.boxShadow=`0 6px 0 ${darken(d.accent,0.25)}, 0 10px 20px ${d.accent}55`;
  pb.textContent=d.buzzerText||'BUZZ';
}

// 색상 피커 실시간
['colorAccent','colorBg','colorSurface','colorText','colorLogoText'].forEach(id=>{
  const el=document.getElementById(id); if(!el)return;
  el.addEventListener('input',e=>{
    document.getElementById(id+'Hex').textContent=e.target.value;
    applyDesign(collectFormDesign());
  });
});

// 투명도 슬라이더
document.getElementById('cardOpacity').addEventListener('input',e=>{
  document.getElementById('cardOpacityVal').textContent=e.target.value+'%';
  document.documentElement.style.setProperty('--card-opacity',e.target.value/100);
});

// 버저 텍스트
document.getElementById('buzzerText').addEventListener('input',()=>updatePreviewBuzzer(collectFormDesign()));

// 버저 모양
document.querySelectorAll('.shape-btn').forEach(btn=>{
  btn.addEventListener('click',()=>{
    document.querySelectorAll('.shape-btn').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    updatePreviewBuzzer(collectFormDesign());
  });
});

// 파일 업로드 헬퍼
function handleFile(inputId, onLoad){
  document.getElementById(inputId).addEventListener('change',e=>{
    const f=e.target.files[0]; if(!f)return;
    const r=new FileReader();
    r.onload=ev=>onLoad(ev.target.result);
    r.readAsDataURL(f);
  });
}

// PC 배경
handleFile('bgFilePc', url=>{
  document.getElementById('bgPreviewPc').innerHTML=`<img src="${url}" />`;
  document.getElementById('bgFilePc').dataset.dataUrl=url;
  // PC에서 즉시 미리보기 (호스트는 보통 PC)
  if(window.innerWidth > 768){
    document.body.style.backgroundImage=`url(${url})`;
    document.body.style.backgroundSize='cover';
    document.body.style.backgroundPosition='top center';
    document.body.style.backgroundRepeat='no-repeat';
    document.body.style.backgroundAttachment='fixed';
  }
});
document.getElementById('bgRemovePcBtn').addEventListener('click',()=>{
  document.getElementById('bgPreviewPc').innerHTML='<span>PC 배경 이미지 없음</span>';
  document.getElementById('bgFilePc').value='';
  delete document.getElementById('bgFilePc').dataset.dataUrl;
  applyBgImage(collectFormDesign());
});

// 모바일 배경
handleFile('bgFileMobile', url=>{
  document.getElementById('bgPreviewMobile').innerHTML=`<img src="${url}" />`;
  document.getElementById('bgFileMobile').dataset.dataUrl=url;
  if(window.innerWidth<=768){
    document.body.style.backgroundImage=`url(${url})`;
    document.body.style.backgroundSize='cover';
    document.body.style.backgroundPosition='top center';
    document.body.style.backgroundRepeat='no-repeat';
    document.body.style.backgroundAttachment='scroll';
    document.documentElement.style.minHeight='100%';
    document.body.style.minHeight='100vh';
  }
});
document.getElementById('bgRemoveMobileBtn').addEventListener('click',()=>{
  document.getElementById('bgPreviewMobile').innerHTML='<span>모바일 배경 이미지 없음</span>';
  document.getElementById('bgFileMobile').value='';
  delete document.getElementById('bgFileMobile').dataset.dataUrl;
  applyBgImage(collectFormDesign());
});

// 로고
handleFile('logoFile', url=>{
  document.getElementById('logoPreview').innerHTML=`<img src="${url}" style="max-height:60px;max-width:100%;object-fit:contain;" />`;
  document.getElementById('logoFile').dataset.dataUrl=url;
  brandTitle.innerHTML=`<img src="${url}" style="height:28px;object-fit:contain;vertical-align:middle;" alt="로고" />`;
});
document.getElementById('logoRemoveBtn').addEventListener('click',()=>{
  document.getElementById('logoPreview').innerHTML='<span>로고 이미지 없음</span>';
  document.getElementById('logoFile').value='';
  delete document.getElementById('logoFile').dataset.dataUrl;
  brandTitle.textContent=document.getElementById('siteTitle').value||'QUIZ BUZZER';
});

// 아이콘
handleFile('iconFile', url=>{
  document.getElementById('iconPreview').innerHTML=`<img src="${url}" style="height:40px;width:40px;object-fit:contain;border-radius:8px;" /><span style="font-size:13px;color:var(--text-muted);">브랜드 앞에 표시됩니다</span>`;
  document.getElementById('iconFile').dataset.dataUrl=url;
  brandIcon.innerHTML=`<img src="${url}" style="height:24px;width:24px;object-fit:contain;vertical-align:middle;" />`;
});
document.getElementById('iconRemoveBtn').addEventListener('click',()=>{
  document.getElementById('iconPreview').innerHTML='<span style="font-size:13px;color:var(--text-muted);">업로드하면 브랜드 이름 앞에 표시돼요</span>';
  document.getElementById('iconFile').value='';
  delete document.getElementById('iconFile').dataset.dataUrl;
  const acc=document.getElementById('colorAccent').value;
  brandIcon.innerHTML=`<span class="dot" style="background:${acc};box-shadow:0 0 14px ${acc};"></span>`;
});

function getFileUrl(id, previewSelector){
  const el=document.getElementById(id);
  if(el.dataset.dataUrl) return el.dataset.dataUrl;
  const img=document.querySelector(previewSelector);
  return img?img.src:null;
}

function collectFormDesign(){
  const activeShape=document.querySelector('.shape-btn.active');
  return {
    accent:       document.getElementById('colorAccent').value,
    bg:           document.getElementById('colorBg').value,
    surface:      document.getElementById('colorSurface').value,
    text:         document.getElementById('colorText').value,
    logoText:     document.getElementById('colorLogoText').value,
    cardOpacity:  parseInt(document.getElementById('cardOpacity').value,10),
    shape:        activeShape?activeShape.dataset.shape:'circle',
    buzzerText:   document.getElementById('buzzerText').value.trim()||'BUZZ',
    title:        document.getElementById('siteTitle').value.trim()||'QUIZ BUZZER',
    logo:         getFileUrl('logoFile','#logoPreview img'),
    icon:         getFileUrl('iconFile','#iconPreview img'),
    bgImagePc:    getFileUrl('bgFilePc','#bgPreviewPc img'),
    bgImageMobile:getFileUrl('bgFileMobile','#bgPreviewMobile img'),
  };
}

// 저장
document.getElementById('saveDesignBtn').addEventListener('click',()=>{
  const d=collectFormDesign();
  saveDesign(d);
  applyDesign(d);
  socket.emit('designUpdate',d);
  const btn=document.getElementById('saveDesignBtn');
  btn.textContent='✅ 저장됨!';
  setTimeout(()=>{btn.textContent='💾 설정 저장 및 적용';},2000);
});

// 초기화
document.getElementById('resetDesignBtn').addEventListener('click',()=>{
  if(!confirm('기본값으로 초기화할까요?'))return;
  ['bgFilePc','bgFileMobile','logoFile','iconFile'].forEach(id=>{
    const el=document.getElementById(id);
    if(el){el.value='';delete el.dataset.dataUrl;}
  });
  saveDesign(DEFAULTS);
  applyDesign(DEFAULTS);
  socket.emit('designUpdate',DEFAULTS);
});

window.addEventListener('DOMContentLoaded',()=>{
  applyDesign(loadDesign());
  try{const s=localStorage.getItem('quizbuzz_host_code');if(s)reconnectCode.value=s;}catch{}
});

/* ══ 방 관리 탭 ══ */
const roomListEl     = document.getElementById('roomList');
const roomEmptyState = document.getElementById('roomEmptyState');
const refreshRoomsBtn= document.getElementById('refreshRoomsBtn');
refreshRoomsBtn.addEventListener('click',()=>socket.emit('getRoomList'));

socket.on('roomList',(list)=>{
  if(!list||list.length===0){roomListEl.innerHTML='';roomEmptyState.style.display='block';return;}
  roomEmptyState.style.display='none';
  roomListEl.innerHTML=list.map(r=>{
    const created=new Date(r.createdAt).toLocaleString('ko-KR',{month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit'});
    const isCurrent=r.code===currentCode;
    return `<li class="buzz-item" style="${isCurrent?'border-color:var(--gold);':''}">
      <div class="buzz-info">
        <div class="buzz-nickname" style="font-size:18px;letter-spacing:3px;">${escapeHtml(r.code)}${isCurrent?' <span style="font-size:12px;color:var(--gold);">현재 방</span>':''}</div>
        <div class="buzz-answer">참가자 ${r.playerCount}명 · 라운드 ${r.round} · 생성: ${created} · ${r.locked?'🔒 잠김':'🟢 활성화'}</div>
      </div>
      ${!isCurrent?`<button class="buzz-remove" style="color:var(--accent);font-size:13px;padding:6px 10px;border-radius:8px;border:1px solid var(--accent);background:transparent;cursor:pointer;white-space:nowrap;" data-code="${escapeHtml(r.code)}">삭제</button>`:''}
    </li>`;
  }).join('');
  roomListEl.querySelectorAll('[data-code]').forEach(btn=>{
    btn.addEventListener('click',()=>{
      if(confirm(`"${btn.dataset.code}" 방을 삭제할까요? 해당 방 참가자가 모두 퇴장됩니다.`))
        socket.emit('deleteRoom',{code:btn.dataset.code});
    });
  });
});

/* ══ 방 만들기 ══ */
let currentCode=null;

function showHostPanel(code){
  currentCode=code;
  roomCodeDisplay.textContent=code;
  setupCard.style.display='none';
  hostPanel.style.display='block';
  try{localStorage.setItem('quizbuzz_host_code',code);}catch{}

  const joinUrl=`${location.origin}/join?code=${code}`;
  joinLinkInput.value=joinUrl;
  downloadBtn.href=`/export/${code}`;
  downloadBtn.removeAttribute('download');

  // 호스트 관리 링크
  const hostUrl=`${location.origin}/host.html?hostcode=${code}`;
  hostLinkInput.value=hostUrl;

  socket.emit('designUpdate',loadDesign());
}

// 링크 복사
function makeCopy(inputId, btnId){
  document.getElementById(btnId).addEventListener('click',()=>{
    navigator.clipboard.writeText(document.getElementById(inputId).value).then(()=>{
      const btn=document.getElementById(btnId);
      btn.textContent='복사됨!';
      setTimeout(()=>{btn.textContent='복사';},2000);
    });
  });
  document.getElementById(inputId).addEventListener('click',()=>document.getElementById(inputId).select());
}
makeCopy('joinLinkInput','copyLinkBtn');
makeCopy('hostLinkInput','copyHostLinkBtn');

createBtn.addEventListener('click',()=>{
  createError.textContent='';
  const code=customCode.value.trim().toUpperCase().replace(/[^A-Z0-9]/g,'');
  socket.emit('createRoom',{customCode:code});
});
customCode.addEventListener('keydown',e=>{if(e.key==='Enter')createBtn.click();});

reconnectBtn.addEventListener('click',()=>{
  const code=reconnectCode.value.trim().toUpperCase();
  if(!code){setupError.textContent='코드를 입력해주세요.';return;}
  setupError.textContent='';
  socket.emit('hostReconnect',{code});
});

// URL ?hostcode= 파라미터로 자동 재접속
window.addEventListener('DOMContentLoaded',()=>{
  const params=new URLSearchParams(location.search);
  const hc=params.get('hostcode');
  if(hc){
    reconnectCode.value=hc.toUpperCase();
    socket.emit('hostReconnect',{code:hc.toUpperCase()});
  }
});

socket.on('roomCreated',({code})=>showHostPanel(code));
socket.on('roomCreateError',({error})=>{createError.textContent=error;});
socket.on('hostReconnectResult',res=>{
  if(res.success)showHostPanel(res.code);
  else setupError.textContent=res.error||'방을 찾을 수 없습니다.';
});

/* ══ 참가자 ══ */
socket.on('playerListUpdate',({players,count})=>{
  playerCountPill.textContent=`참가자 ${count}명`;
  playerListCount.textContent=count;
  if(!players||players.length===0){playerTags.innerHTML='';playerEmptyState.style.display='block';return;}
  playerEmptyState.style.display='none';
  playerTags.innerHTML=players.map(name=>`
    <div class="player-tag">
      <span>${escapeHtml(name)}</span>
      <button class="player-kick" title="내쫓기" data-name="${escapeHtml(name)}">✕</button>
    </div>`).join('');
  playerTags.querySelectorAll('.player-kick').forEach(btn=>{
    btn.addEventListener('click',()=>{
      if(confirm(`${btn.dataset.name} 님을 방에서 내보낼까요?`))
        socket.emit('kickPlayer',{nickname:btn.dataset.name});
    });
  });
});

socket.on('roundUpdate',({round})=>{roundPill.textContent=`라운드 ${round}`;});

/* ══ 잠금/초기화 ══ */
lockBtn.addEventListener('click',()=>socket.emit('toggleLock'));
socket.on('lockUpdate',({locked})=>{
  if(locked){lockPill.textContent='버저 잠김';lockPill.className='pill locked';lockBtn.textContent='버저 열기';}
  else{lockPill.textContent='버저 활성화됨';lockPill.className='pill unlocked';lockBtn.textContent='버저 잠그기';}
});
resetBtn.addEventListener('click',()=>socket.emit('resetBuzzes'));

/* ══ 버저 목록 ══ */
socket.on('buzzUpdate',({buzzes})=>{
  buzzCount.textContent=buzzes.length;
  if(buzzes.length===0){buzzList.innerHTML='';emptyState.style.display='block';return;}
  emptyState.style.display='none';
  buzzList.innerHTML=buzzes.map((b,idx)=>{
    const t=new Date(b.time).toLocaleTimeString('ko-KR',{hour:'2-digit',minute:'2-digit',second:'2-digit'});
    const ans=b.answer?escapeHtml(b.answer):'<span style="opacity:0.5;">(답안 미입력)</span>';
    return `<li class="buzz-item">
      <div class="buzz-rank">${b.order}</div>
      <div class="buzz-info">
        <div class="buzz-nickname">${escapeHtml(b.nickname)}</div>
        <div class="buzz-answer">${ans}</div>
      </div>
      <div class="buzz-time">${t}</div>
      <button class="buzz-remove" title="삭제" data-idx="${idx}">✕</button>
    </li>`;
  }).join('');
  buzzList.querySelectorAll('.buzz-remove').forEach(btn=>{
    btn.addEventListener('click',()=>socket.emit('removeBuzz',{index:parseInt(btn.dataset.idx,10)}));
  });
});

function escapeHtml(str){const d=document.createElement('div');d.textContent=str;return d.innerHTML;}
