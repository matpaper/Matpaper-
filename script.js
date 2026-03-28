/* ============================================================
   script.js — Homepage Logic (Appwrite + Cloudinary)
============================================================ */

/* ── Fallback data while DB is empty ─────────────────── */
const FALLBACK_HOT = [
  { $id:'sl1',  Title:'Sung Jin-Woo',   Category:'solo',     Tag:'anime,solo,dark',     Resolution:'1080p', cloudinary_url:'', Is_new:true  },
  { $id:'tog1', Title:'Bam',             Category:'tog',      Tag:'manhwa,tog,fantasy',  Resolution:'4K',    cloudinary_url:'', Is_new:false },
  { $id:'tb1',  Title:'Aron Lyght',      Category:'tbate',    Tag:'manhwa,tbate,magic',  Resolution:'1440p', cloudinary_url:'', Is_new:true  },
  { $id:'nar1', Title:'Naruto Uzumaki',  Category:'naruto',   Tag:'anime,naruto,action', Resolution:'4K',    cloudinary_url:'', Is_new:false },
  { $id:'bl1',  Title:'Ichigo Kurosaki', Category:'bleach',   Tag:'anime,bleach,action', Resolution:'1080p', cloudinary_url:'', Is_new:false },
  { $id:'jjk1', Title:'Gojo Satoru',     Category:'jjk',      Tag:'anime,jjk,cursed',    Resolution:'4K',    cloudinary_url:'', Is_new:true  },
  { $id:'op1',  Title:'Monkey D. Luffy', Category:'onepiece', Tag:'anime,onepiece,sea',  Resolution:'1080p', cloudinary_url:'', Is_new:false },
  { $id:'aot1', Title:'Eren Yeager',     Category:'aot',      Tag:'anime,aot,titan',     Resolution:'1440p', cloudinary_url:'', Is_new:false },
];

const FALLBACK_DESKTOP = [
  { $id:'d1', Title:'Solo Leveling Gate',  Category:'solo',     Tag:'anime,solo',    Resolution:'4K',    cloudinary_url:'', Is_new:true  },
  { $id:'d2', Title:'Hidden Floor',         Category:'tog',      Tag:'manhwa,tog',    Resolution:'2K',    cloudinary_url:'', Is_new:false },
  { $id:'d3', Title:'Magic Continent',      Category:'tbate',    Tag:'manhwa,tbate',  Resolution:'4K',    cloudinary_url:'', Is_new:false },
  { $id:'d4', Title:'Hidden Leaf Village',  Category:'naruto',   Tag:'anime,naruto',  Resolution:'1440p', cloudinary_url:'', Is_new:false },
  { $id:'d5', Title:'Soul Society',         Category:'bleach',   Tag:'anime,bleach',  Resolution:'4K',    cloudinary_url:'', Is_new:true  },
  { $id:'d6', Title:'Shibuya Incident',     Category:'jjk',      Tag:'anime,jjk',     Resolution:'2K',    cloudinary_url:'', Is_new:false },
];

const FALLBACK_PROFILE = [
  { $id:'p1', Title:'Shadow Monarch', Category:'solo',    Tag:'anime,solo',     Resolution:'1080p', cloudinary_url:'' },
  { $id:'p2', Title:'Bam',            Category:'tog',     Tag:'manhwa,tog',     Resolution:'1080p', cloudinary_url:'' },
  { $id:'p3', Title:'Naruto',         Category:'naruto',  Tag:'anime,naruto',   Resolution:'1080p', cloudinary_url:'' },
  { $id:'p4', Title:'Ichigo',         Category:'bleach',  Tag:'anime,bleach',   Resolution:'1080p', cloudinary_url:'' },
  { $id:'p5', Title:'Gojo',           Category:'jjk',     Tag:'anime,jjk',      Resolution:'1080p', cloudinary_url:'' },
  { $id:'p6', Title:'Luffy',          Category:'onepiece',Tag:'anime,onepiece', Resolution:'1080p', cloudinary_url:'' },
  { $id:'p7', Title:'Eren',           Category:'aot',     Tag:'anime,aot',      Resolution:'1080p', cloudinary_url:'' },
];

/* SEO-optimised categories — display name is clean, seo name used in page title/meta */
const CATEGORIES = [
  { name:'Anime',        seo:'Anime Wallpapers HD',          count:'4.2K walls', seeds:['c1','c2','c3'],   key:'anime'      },
  { name:'Manhwa',       seo:'Manhwa Wallpapers 4K',         count:'1.8K walls', seeds:['c4','c5','c6'],   key:'manhwa'     },
  { name:'Games',        seo:'Game Wallpapers 4K',           count:'2.1K walls', seeds:['c7','c8','c9'],   key:'games'      },
  { name:'Abstract',     seo:'Abstract Wallpapers 4K',       count:'980 walls',  seeds:['ca1','ca2','ca3'],key:'abstract'   },
  { name:'Aesthetic',    seo:'Aesthetic Wallpapers HD',      count:'760 walls',  seeds:['cb1','cb2','cb3'],key:'aesthetic'  },
  { name:'AI Art',       seo:'AI Art Wallpapers 4K',         count:'540 walls',  seeds:['cc1','cc2','cc3'],key:'ai-art'     },
  { name:'Cyberpunk',    seo:'Cyberpunk Wallpapers HD',      count:'430 walls',  seeds:['cd1','cd2','cd3'],key:'cyberpunk'  },
  { name:'Dark AMOLED',  seo:'Dark AMOLED Wallpapers 4K',   count:'620 walls',  seeds:['ce1','ce2','ce3'],key:'dark-amoled'},
  { name:'Desktop',      seo:'Desktop Wallpapers 4K',        count:'1.2K walls', seeds:['cf1','cf2','cf3'],key:'desktop'    },
  { name:'Minimalist',   seo:'Minimalist Wallpapers 4K',     count:'380 walls',  seeds:['cg1','cg2','cg3'],key:'minimalist' },
  { name:'Nature',       seo:'Nature Wallpapers 4K',         count:'720 walls',  seeds:['ch1','ch2','ch3'],key:'nature'     },
  { name:'Neon',         seo:'Neon Wallpapers 4K',           count:'290 walls',  seeds:['ci1','ci2','ci3'],key:'neon'       },
  { name:'Sci-Fi',       seo:'Sci-Fi Wallpapers HD',         count:'410 walls',  seeds:['cj1','cj2','cj3'],key:'sci-fi'     },
  { name:'Space',        seo:'Space Galaxy Wallpapers 4K',   count:'560 walls',  seeds:['ck1','ck2','ck3'],key:'space'      },
  { name:'Vaporwave',    seo:'Vaporwave Wallpapers HD',      count:'230 walls',  seeds:['cl1','cl2','cl3'],key:'vaporwave'  },
  { name:'Profile Pics', seo:'Profile Picture Wallpapers HD',count:'890 walls',  seeds:['cm1','cm2','cm3'],key:'profile'    },
];

const SAMPLE_COMMENTS = [
  { name:'KaelMist',    text:'The Solo Leveling collection is insane 🔥 downloaded every single one.', date:'2 hours ago' },
  { name:'TowerRunner', text:'Finally a site that has decent Tower of God art. Bookmarked!',            date:'5 hours ago' },
  { name:'VoidWalker',  text:'Desktop walls are 🔑. The 4K quality is legit, no blurry stretching.',   date:'1 day ago'   },
];

/* ── Image URL ────────────────────────────────────────── */
function getImageUrl(doc, type) {
  const pubId = (doc.Cloudinary_url || doc.cloudinary_url || '').trim();
  const seed  = doc.$id || 'wall';
  if (pubId) {
    if (type === 'desktop') return Cloudinary.desktop(pubId);
    if (type === 'profile') return Cloudinary.profile(pubId);
    return Cloudinary.thumbnail(pubId, 300, 533);
  }
  if (type === 'desktop') return 'https://picsum.photos/seed/' + seed + '/560/315';
  if (type === 'profile') return 'https://picsum.photos/seed/' + seed + '/200/200';
  return 'https://picsum.photos/seed/' + seed + '/300/533';
}

/* ── Card Builders ────────────────────────────────────── */
function makePortraitCard(doc) {
  const id    = doc.$id;
  const title = doc.Title || 'Wallpaper';
  const res   = doc.Resolution || '';
  const isNew = doc.Is_new || false;
  const cat   = doc.Category || 'anime';

  const div = document.createElement('div');
  div.className = 'card';
  div.innerHTML = `
    ${isNew ? '<span class="new-badge">New</span>' : ''}
    ${res ? `<span class="res-badge">${res}</span>` : ''}
    <img src="${getImageUrl(doc,'mobile')}" alt="${title}" loading="lazy">
    <div class="card-overlay">
      <span class="card-title">${title}</span>
      <div class="card-actions">
        <button class="card-btn ${LocalData.isLiked(id)?'liked':''}" onclick="toggleLike(event,'${id}',this)"><i class="fas fa-heart"></i></button>
        <button class="card-btn ${LocalData.isSaved(id)?'saved':''}" onclick="toggleFav(event,'${id}',this)"><i class="fas fa-bookmark"></i></button>
        <button class="card-btn dl" onclick="handleDownload(event,'${title}')"><i class="fas fa-download"></i></button>
      </div>
    </div>
  `;
  div.addEventListener('click', e => {
    if (e.target.closest('.card-btn')) return;
    location.href = `wallpaper.html?id=${id}&cat=${cat}&title=${encodeURIComponent(title)}&res=${res}`;
  });
  return div;
}

function makeLandscapeCard(doc) {
  const id    = doc.$id;
  const title = doc.Title || 'Wallpaper';
  const res   = doc.Resolution || '';
  const isNew = doc.Is_new || false;
  const cat   = doc.Category || 'anime';

  const div = document.createElement('div');
  div.className = 'card';
  div.innerHTML = `
    ${isNew ? '<span class="new-badge">New</span>' : ''}
    ${res ? `<span class="res-badge">${res}</span>` : ''}
    <img src="${getImageUrl(doc,'desktop')}" alt="${title}" loading="lazy">
    <div class="card-overlay">
      <span class="card-title">${title}</span>
      <div class="card-actions">
        <button class="card-btn ${LocalData.isLiked(id)?'liked':''}" onclick="toggleLike(event,'${id}',this)"><i class="fas fa-heart"></i></button>
        <button class="card-btn ${LocalData.isSaved(id)?'saved':''}" onclick="toggleFav(event,'${id}',this)"><i class="fas fa-bookmark"></i></button>
        <button class="card-btn dl" onclick="handleDownload(event,'${title}')"><i class="fas fa-download"></i></button>
      </div>
    </div>
  `;
  div.addEventListener('click', e => {
    if (e.target.closest('.card-btn')) return;
    location.href = `wallpaper.html?id=${id}&cat=${cat}&title=${encodeURIComponent(title)}&res=${res}`;
  });
  return div;
}

function makeProfileCard(doc) {
  const id    = doc.$id;
  const title = doc.Title || 'Profile';
  const res   = doc.Resolution || '1080p';
  const cat   = doc.Category || 'profile';

  const div = document.createElement('div');
  div.className = 'card';
  div.innerHTML = `
    <img src="${getImageUrl(doc,'profile')}" alt="${title}" loading="lazy">
    <div class="card-overlay">
      <span class="card-title" style="font-size:11px;">${title}</span>
      <div class="card-actions">
        <button class="card-btn dl" onclick="handleDownload(event,'${title}')"><i class="fas fa-download"></i></button>
      </div>
    </div>
  `;
  div.addEventListener('click', e => {
    if (e.target.closest('.card-btn')) return;
    location.href = `wallpaper.html?id=${id}&cat=${cat}&title=${encodeURIComponent(title)}&res=${res}`;
  });
  return div;
}

/* ── Render Sections ──────────────────────────────────── */
async function renderHot(filter) {
  const row = document.getElementById('hotRow');
  row.innerHTML = '<div style="color:var(--text-dim);font-size:13px;padding:10px 0;font-family:Barlow Condensed,sans-serif;letter-spacing:1px;">Loading...</div>';
  try {
    const res  = await DB.getWallpapers({ category: filter === 'all' ? null : filter, limit: 10 });
    const docs = res.documents && res.documents.length ? res.documents
      : FALLBACK_HOT.filter(w => filter === 'all' || w.Category === filter);
    row.innerHTML = '';
    if (!docs.length) { row.innerHTML = '<p style="color:var(--text-dim);font-size:14px;padding:10px 0;">No wallpapers found.</p>'; return; }
    docs.forEach(d => row.appendChild(makePortraitCard(d)));
  } catch(e) {
    row.innerHTML = '';
    FALLBACK_HOT.filter(w => filter === 'all' || w.Category === filter).forEach(d => row.appendChild(makePortraitCard(d)));
  }
}

async function renderDesktop(filter) {
  const row = document.getElementById('desktopRow');
  row.innerHTML = '<div style="color:var(--text-dim);font-size:13px;padding:10px 0;font-family:Barlow Condensed,sans-serif;letter-spacing:1px;">Loading...</div>';
  try {
    const res  = await DB.getWallpapers({ category: filter === 'all' ? null : filter, limit: 8 });
    const docs = res.documents && res.documents.length ? res.documents
      : FALLBACK_DESKTOP.filter(w => filter === 'all' || w.Category === filter);
    row.innerHTML = '';
    if (!docs.length) { row.innerHTML = '<p style="color:var(--text-dim);font-size:14px;padding:10px 0;">No wallpapers found.</p>'; return; }
    docs.forEach(d => row.appendChild(makeLandscapeCard(d)));
  } catch(e) {
    row.innerHTML = '';
    FALLBACK_DESKTOP.filter(w => filter === 'all' || w.Category === filter).forEach(d => row.appendChild(makeLandscapeCard(d)));
  }
}

async function renderProfiles() {
  const row = document.getElementById('profileRow');
  row.innerHTML = '';
  try {
    const res  = await DB.getWallpapers({ category: 'profile', limit: 8 });
    const docs = res.documents && res.documents.length ? res.documents : FALLBACK_PROFILE;
    docs.forEach(d => row.appendChild(makeProfileCard(d)));
  } catch(e) {
    FALLBACK_PROFILE.forEach(d => row.appendChild(makeProfileCard(d)));
  }
}

function renderCategories() {
  const grid = document.getElementById('categoryGrid');
  if (!grid) return;
  grid.innerHTML = '';
  CATEGORIES.forEach(cat => {
    const el = document.createElement('div');
    el.className = 'category-card';
    el.innerHTML = `
      <div class="category-info">
        <div class="category-name">${cat.name}</div>
        <div class="category-count">${cat.count}</div>
      </div>
      <div class="category-previews">
        ${cat.seeds.map(s => `<img src="https://picsum.photos/seed/${s}/80/80" alt="" loading="lazy">`).join('')}
      </div>
      <i class="fas fa-chevron-right category-arrow"></i>
    `;
    el.addEventListener('click', () => { location.href = `category.html?cat=${cat.key}`; });
    grid.appendChild(el);
  });
}

function renderComments() {
  const list = document.getElementById('commentList');
  if (!list) return;
  SAMPLE_COMMENTS.forEach(c => addCommentToDOM(c.name, c.text, c.date, list, false));
}

function addCommentToDOM(name, text, date, container, prepend) {
  const el = document.createElement('div');
  el.className = 'comment-item';
  el.innerHTML = `
    <div class="comment-avatar">${escHtml(name)[0].toUpperCase()}</div>
    <div class="comment-body">
      <div class="comment-meta">
        <span class="comment-name">${escHtml(name)}</span>
        <span class="comment-date">${date}</span>
      </div>
      <div class="comment-text">${escHtml(text)}</div>
    </div>
  `;
  prepend ? container.prepend(el) : container.appendChild(el);
}

/* ── Tag Filter ───────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  const tagRow = document.getElementById('tagRow');
  if (tagRow) {
    tagRow.addEventListener('click', function(e) {
      const tag = e.target.closest('.tag');
      if (!tag) return;
      this.querySelectorAll('.tag').forEach(t => t.classList.remove('active'));
      tag.classList.add('active');
      const filter = tag.dataset.tag || 'all';
      renderHot(filter);
      renderDesktop(filter);
    });
  }
  const input = document.getElementById('searchInput');
  if (input) input.addEventListener('keydown', e => { if (e.key === 'Enter') handleSearch(); });
});

/* ── Search ───────────────────────────────────────────── */
function handleSearch() {
  const q = document.getElementById('searchInput').value.trim();
  if (!q) return;
  location.href = `search.html?q=${encodeURIComponent(q)}`;
}

/* ── Actions ──────────────────────────────────────────── */
function toggleLike(e, id, btn) {
  e.stopPropagation();
  const nowLiked = LocalData.toggleLike(id);
  btn.classList.toggle('liked', nowLiked);
  toast(nowLiked ? 'Liked! ❤️' : 'Removed like', 'fa-heart');
}
function toggleFav(e, id, btn) {
  e.stopPropagation();
  const nowSaved = LocalData.toggleSave(id);
  btn.classList.toggle('saved', nowSaved);
  toast(nowSaved ? 'Saved! 🔖' : 'Removed from saved', 'fa-bookmark');
}
function handleDownload(e, title) {
  e.stopPropagation();
  toast(`Downloading: ${title}`, 'fa-download');
}
function toggleFavPanel() {
  const count = LocalData.getSaved().size;
  toast(`${count} saved wallpaper${count !== 1 ? 's' : ''}`, 'fa-heart');
}

/* ── Sidebar ──────────────────────────────────────────── */
function openSidebar() {
  document.getElementById('sidebar').classList.add('active');
  document.getElementById('overlay').classList.add('active');
  document.body.style.overflow = 'hidden';
}
function closeSidebar() {
  document.getElementById('sidebar').classList.remove('active');
  document.getElementById('overlay').classList.remove('active');
  document.body.style.overflow = '';
}

/* ── Comment Submit ───────────────────────────────────── */
function submitComment() {
  const name = document.getElementById('cName').value.trim();
  const text = document.getElementById('cText').value.trim();
  if (!name || !text) { toast('Please fill in your name and comment', 'fa-triangle-exclamation'); return; }
  addCommentToDOM(name, text, 'Just now', document.getElementById('commentList'), true);
  document.getElementById('cName').value  = '';
  document.getElementById('cEmail').value = '';
  document.getElementById('cText').value  = '';
  toast('Comment posted!', 'fa-paper-plane');
}

/* ── Toast ────────────────────────────────────────────── */
function toast(msg, icon) {
  icon = icon || 'fa-check';
  const container = document.getElementById('toastContainer');
  if (!container) return;
  const t = document.createElement('div');
  t.className = 'toast';
  t.innerHTML = `<i class="fas ${icon}"></i> ${msg}`;
  container.appendChild(t);
  requestAnimationFrame(() => requestAnimationFrame(() => t.classList.add('show')));
  setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 350); }, 2800);
}

/* ── Back to top ──────────────────────────────────────── */
window.addEventListener('scroll', () => {
  const btn = document.getElementById('backTop');
  if (btn) btn.classList.toggle('visible', window.scrollY > 300);
});

/* ── Escape HTML ──────────────────────────────────────── */
function escHtml(str) {
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

/* ── Init ─────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', function() {
  renderHot('all');
  renderDesktop('all');
  renderProfiles();
  renderCategories();
  renderComments();
  renderTrending();
  renderFeatured();
  loadRealStats();
});

/* ── Real Stats ───────────────────────────────────────── */
async function loadRealStats() {
  try {
    var stats = await DB.getStats();
    var total = stats.total || 0;
    if (!total) return;
    var fmtNum = function(n){ return n >= 1000 ? (n/1000).toFixed(1)+'K+' : String(n); };
    document.querySelectorAll('.hero-stat-num').forEach(function(el,i){ if(i===0) el.textContent = fmtNum(total); });
    document.querySelectorAll('.stat-num').forEach(function(el,i){ if(i===0) el.textContent = fmtNum(total); });
  } catch(e) {}
}

/* ── Trending Section ─────────────────────────────────── */
async function renderTrending() {
  var row = document.getElementById('trendingRow');
  if (!row) return;
  try {
    var res = await DB.getTrending({ limit: 10 });
    var docs = res.documents || [];
    row.innerHTML = '';
    if (!docs.length) { var sec=row.closest('.section'); if(sec) sec.style.display='none'; return; }
    docs.forEach(function(d){ row.appendChild(makePortraitCard(d)); });
  } catch(e) { var sec=document.getElementById('trendingRow'); if(sec&&sec.closest) { var s=sec.closest('.section'); if(s) s.style.display='none'; } }
}

/* ── Featured Section ─────────────────────────────────── */
async function renderFeatured() {
  var row = document.getElementById('featuredRow');
  if (!row) return;
  try {
    var res = await DB.getFeatured({ limit: 10 });
    var docs = res.documents || [];
    row.innerHTML = '';
    if (!docs.length) { var sec=row.closest('.section'); if(sec) sec.style.display='none'; return; }
    docs.forEach(function(d){ row.appendChild(makePortraitCard(d)); });
  } catch(e) { var sec=document.getElementById('featuredRow'); if(sec&&sec.closest) { var s=sec.closest('.section'); if(s) s.style.display='none'; } }
}

/* ── Add to Recently Viewed ───────────────────────────── */
function addToRecent(id) {
  try {
    var recent = JSON.parse(localStorage.getItem('mp_recent')||'[]');
    recent = recent.filter(function(i){return i!==id;});
    recent.unshift(id);
    if (recent.length > 50) recent = recent.slice(0,50);
    localStorage.setItem('mp_recent', JSON.stringify(recent));
  } catch(e) {}
}
