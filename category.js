/* ============================================================
   category.js — Category Browse Page (Appwrite + Cloudinary)
============================================================ */

const CAT_CONFIG = {
  anime:      { label:'ANIME',       subs:['All','Solo Leveling','Jujutsu Kaisen','Naruto','Bleach','One Piece','Attack on Titan','Demon Slayer','More...'] },
  manhwa:     { label:'MANHWA',      subs:['All','Solo Leveling','Tower of God','TBATE','Omniscient Reader','Lore Olympus','More...'] },
  games:      { label:'GAMES',       subs:['All','Genshin Impact','Elden Ring','Final Fantasy','Zelda','Cyberpunk','More...'] },
  nature:     { label:'NATURE',      subs:['All','Forest','Ocean','Mountain','Sky','Desert','More...'] },
  minimalist: { label:'MINIMALIST',  subs:['All','Black & White','Pastel','Geometric','Abstract','More...'] },
  dark:       { label:'DARK THEME',  subs:['All','Neon','Cyberpunk','Gothic','Space','More...'] },
  hot:        { label:'HOT',         subs:['All','Today','This Week','This Month'] },
  desktop:    { label:'DESKTOP',     subs:['All','4K','2K','1080p','Ultrawide'] },
  profile:    { label:'PROFILE PICS',subs:['All','Anime','Manhwa','Games','Art'] },
};

const ITEMS_PER_PAGE = 20;

/* ── State ────────────────────────────────────────────── */
let currentCat  = 'anime';
let currentSub  = 'all';
let currentPage = 1;
let totalItems  = 0;
let totalPages  = 1;
let filterOpen  = false;
let filterState = { type:'all', res:'all', sort:'popular' };
let searchQuery = '';

/* ── Init ─────────────────────────────────────────────── */
function init() {
  const params   = new URLSearchParams(window.location.search);
  currentCat     = params.get('cat')    || 'anime';
  currentSub     = params.get('sub')    || 'all';
  currentPage    = parseInt(params.get('page') || '1', 10);
  searchQuery    = params.get('search') || '';

  const config   = CAT_CONFIG[currentCat] || CAT_CONFIG.anime;
  document.title = `MATPAPER — ${config.label}`;
  document.getElementById('catTitle').textContent = config.label;

  if (searchQuery) {
    document.getElementById('catSearch').value = searchQuery;
  }

  renderSubFilters(config.subs);
  loadGrid();

  document.getElementById('catSearch').addEventListener('keydown', e => {
    if (e.key === 'Enter') handleCatSearch();
  });
}

/* ── Sub-filter Tags ──────────────────────────────────── */
function renderSubFilters(subs) {
  const row = document.getElementById('subFilters');
  row.innerHTML = '';
  subs.forEach(label => {
    const id  = label.toLowerCase().replace(/\s+/g,'-').replace(/\./g,'');
    const btn = document.createElement('button');
    btn.className   = 'sub-tag' + (id === currentSub || (currentSub === 'all' && label === 'All') ? ' active' : '');
    btn.textContent = label;
    btn.dataset.id  = id;
    btn.addEventListener('click', () => {
      if (label === 'More...') { toast('More filters coming soon!', 'fa-ellipsis'); return; }
      currentSub  = id;
      currentPage = 1;
      row.querySelectorAll('.sub-tag').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      loadGrid();
    });
    row.appendChild(btn);
  });
}

/* ── Load Grid ────────────────────────────────────────── */
async function loadGrid() {
  const grid   = document.getElementById('masonryGrid');
  const loader = document.getElementById('gridLoader');

  grid.innerHTML     = '';
  grid.style.display = 'none';
  loader.classList.add('active');

  try {
    const offset = (currentPage - 1) * ITEMS_PER_PAGE;
    const cat    = currentCat === 'all' ? null : currentCat;
    const search = searchQuery || null;

    // Build sort query
    const queries = [
      Appwrite.Query.limit(ITEMS_PER_PAGE),
      Appwrite.Query.offset(offset),
    ];
    if (filterState.sort === 'downloads') {
      queries.push(Appwrite.Query.orderDesc('Downloads'));
    } else if (filterState.sort === 'newest') {
      queries.push(Appwrite.Query.orderDesc('$createdAt'));
    } else {
      // popular = most views
      queries.push(Appwrite.Query.orderDesc('Views'));
    }
    if (cat) queries.push(Appwrite.Query.equal('Category', cat));
    if (search) queries.push(Appwrite.Query.search('Title', search));

    const db  = getDatabases();
    const res = await db.listDocuments(APPWRITE_DB_ID, APPWRITE_COL_ID, queries);
    let docs  = res.documents || [];
    totalItems = res.total || docs.length;

    // Client-side platform filter
    if (filterState.type && filterState.type !== 'all') {
      docs = docs.filter(function(d) {
        var tag = (d.Tag||'').toLowerCase();
        if (filterState.type === 'mobile')  return !tag.includes('desktop') && !tag.includes('profile');
        if (filterState.type === 'desktop') return tag.includes('desktop');
        if (filterState.type === 'profile') return tag.includes('profile') || d.Category === 'profile';
        return true;
      });
    }

    // Resolution filter
    if (filterState.res && filterState.res !== 'all') {
      docs = docs.filter(function(d){ return d.Resolution === filterState.res; });
    }

    totalPages = Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE));

    loader.classList.remove('active');
    grid.style.display = '';

    if (!docs.length) {
      grid.innerHTML = `
        <div style="grid-column:1/-1;text-align:center;padding:60px 20px;color:var(--text-muted);">
          <i class="fas fa-image" style="font-size:40px;margin-bottom:12px;display:block;color:var(--text-dim);"></i>
          No wallpapers found. Try a different filter.
        </div>`;
    } else {
      docs.forEach((doc, i) => grid.appendChild(makeMasonryItem(doc, i)));
    }

    renderPagination();
    updateMeta();
    window.scrollTo({ top: 0, behavior: 'smooth' });

  } catch(err) {
    loader.classList.remove('active');
    grid.style.display = '';
    grid.innerHTML = `
      <div style="grid-column:1/-1;text-align:center;padding:60px 20px;color:var(--text-muted);">
        <i class="fas fa-wifi-slash" style="font-size:40px;margin-bottom:12px;display:block;color:var(--text-dim);"></i>
        Could not load wallpapers. Check your connection.
      </div>`;
    console.error('loadGrid error:', err);
  }
}

/* ── Masonry Item ─────────────────────────────────────── */
function makeMasonryItem(doc, index) {
  const id    = doc.$id;
  const title = doc.Title       || 'Wallpaper';
  const res   = doc.Resolution  || '';
  const isNew = doc.Is_new      || false;
  const cat   = doc.Category    || currentCat;

  // Alternate heights for masonry feel
  const heights = [180,240,200,280,220,260,190,300,210,250];
  const h = heights[index % heights.length];
  const w = 300;

  const pubId  = (doc.Cloudinary_url || doc.cloudinary_url || '').trim();
  const imgSrc = pubId
    ? Cloudinary.thumbnail(pubId, w, h)
    : 'https://picsum.photos/seed/' + id + '/' + w + '/' + h;

  const item = document.createElement('div');
  item.className = 'masonry-item';
  item.style.animationDelay = `${(index % 8) * 0.05}s`;
  item.innerHTML = `
    ${isNew ? '<span class="masonry-new">New</span>' : ''}
    ${res   ? `<span class="masonry-res">${res}</span>` : ''}
    <img src="${imgSrc}" alt="${title}" loading="lazy" style="height:${h}px;">
    <div class="masonry-overlay">
      <span class="masonry-title">${title}</span>
      <div class="masonry-actions">
        <button class="masonry-btn ${LocalData.isLiked(id)?'liked':''}" onclick="toggleLikeItem(event,'${id}',this)"><i class="fas fa-heart"></i></button>
        <button class="masonry-btn ${LocalData.isSaved(id)?'saved':''}" onclick="toggleSaveItem(event,'${id}',this)"><i class="fas fa-bookmark"></i></button>
      </div>
    </div>
  `;
  item.addEventListener('click', () => {
    location.href = `wallpaper.html?id=${id}&cat=${cat}&title=${encodeURIComponent(title)}&res=${res}`;
  });
  return item;
}

/* ── Like / Save ──────────────────────────────────────── */
function toggleLikeItem(e, id, btn) {
  e.stopPropagation();
  const nowLiked = LocalData.toggleLike(id);
  btn.classList.toggle('liked', nowLiked);
  toast(nowLiked ? 'Liked! ❤️' : 'Removed like', 'fa-heart');
}
function toggleSaveItem(e, id, btn) {
  e.stopPropagation();
  const nowSaved = LocalData.toggleSave(id);
  btn.classList.toggle('saved', nowSaved);
  toast(nowSaved ? 'Saved! 🔖' : 'Removed from saved', 'fa-bookmark');
}

/* ── Pagination ───────────────────────────────────────── */
function renderPagination() {
  const container = document.getElementById('pagination');
  container.innerHTML = '';

  if (totalPages <= 1) return;

  const prev = document.createElement('button');
  prev.className = 'page-btn';
  prev.innerHTML = '<i class="fas fa-chevron-left"></i>';
  prev.disabled  = currentPage === 1;
  prev.onclick   = () => goToPage(currentPage - 1);
  container.appendChild(prev);

  getPageRange(currentPage, totalPages).forEach(p => {
    if (p === '...') {
      const dots = document.createElement('span');
      dots.className   = 'page-dots';
      dots.textContent = '···';
      container.appendChild(dots);
    } else {
      const btn = document.createElement('button');
      btn.className   = 'page-btn' + (p === currentPage ? ' active' : '');
      btn.textContent = p;
      btn.onclick     = () => goToPage(p);
      container.appendChild(btn);
    }
  });

  const next = document.createElement('button');
  next.className = 'page-btn';
  next.innerHTML = '<i class="fas fa-chevron-right"></i>';
  next.disabled  = currentPage === totalPages;
  next.onclick   = () => goToPage(currentPage + 1);
  container.appendChild(next);
}

function getPageRange(cur, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  if (cur <= 4)          return [1,2,3,4,5,'...',total];
  if (cur >= total - 3)  return [1,'...',total-4,total-3,total-2,total-1,total];
  return [1,'...',cur-1,cur,cur+1,'...',total];
}

function goToPage(p) {
  if (p < 1 || p > totalPages) return;
  currentPage = p;
  loadGrid();
}

/* ── Meta ─────────────────────────────────────────────── */
function updateMeta() {
  const start = totalItems === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1;
  const end   = Math.min(currentPage * ITEMS_PER_PAGE, totalItems);
  document.getElementById('resultsCount').textContent =
    totalItems === 0 ? 'No wallpapers yet' : `Showing ${start}–${end} of ${totalItems}`;
  document.getElementById('resultsPage').textContent =
    totalPages > 1 ? `Page ${currentPage} of ${totalPages}` : '';
}

/* ── Search ───────────────────────────────────────────── */
function handleCatSearch() {
  const q = document.getElementById('catSearch').value.trim();
  searchQuery = q;
  currentPage = 1;
  if (q) toast(`Searching: "${q}"`, 'fa-search');
  loadGrid();
}

/* ── Filter Panel ─────────────────────────────────────── */
function toggleFilter() {
  filterOpen = !filterOpen;
  document.getElementById('filterPanel').classList.toggle('open', filterOpen);
  document.getElementById('filterBtn').classList.toggle('active', filterOpen);
}

document.addEventListener('click', e => {
  const btn = e.target.closest('.filter-opt');
  if (!btn) return;
  const type = btn.dataset.filterType;
  document.querySelectorAll(`.filter-opt[data-filter-type="${type}"]`).forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  filterState[type] = btn.dataset.val;
});

function applyFilters() {
  toggleFilter();
  currentPage = 1;
  toast('Filters applied', 'fa-sliders');
  loadGrid();
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
function toggleFavPanel() {
  const count = LocalData.getSaved().size;
  toast(`${count} saved wallpaper${count !== 1 ? 's' : ''}`, 'fa-heart');
}

/* ── Back to top ──────────────────────────────────────── */
window.addEventListener('scroll', () => {
  const btn = document.getElementById('backTop');
  if (btn) btn.classList.toggle('visible', window.scrollY > 300);
});

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

/* ── Bootstrap ────────────────────────────────────────── */
init();
