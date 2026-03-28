/* ============================================================
   wallpaper.js — Wallpaper Detail Page (Appwrite + Cloudinary)
============================================================ */

/* ── State ────────────────────────────────────────────── */
let wpDoc          = null;
let isLiked        = false;
let isSaved        = false;
let isZoomed       = false;
let relatedFilter  = 'all';

/* ── Init ─────────────────────────────────────────────── */
async function init() {
  const params = new URLSearchParams(window.location.search);
  const id     = params.get('id');
  const cat    = params.get('cat')   || 'anime';
  const title  = params.get('title') || 'Wallpaper';
  const res    = params.get('res')   || '4K';

  isLiked = LocalData.isLiked(id);
  isSaved = LocalData.isSaved(id);

  // Show placeholder while loading
  document.getElementById('wpTitle').textContent = decodeURIComponent(title);
  document.getElementById('wpCatText').textContent = formatCatLabel(cat);

  try {
    const doc = await DB.getWallpaper(id);
    if (doc) {
      wpDoc = doc;
      renderWallpaper(doc);
      // Increment views
      DB.increment(id, 'Views', doc.Views || 0);
    } else {
      // Use URL params as fallback
      renderFromParams(id, cat, title, res);
    }
  } catch(e) {
    renderFromParams(id, cat, title, res);
  }

  renderRelatedFilters(cat);
  renderRelated(cat);

  document.getElementById('relatedSeeAll').href = `category.html?cat=${cat}`;

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') { /* nothing to close */ }
  });
}

/* ── Render from Appwrite doc ─────────────────────────── */
function renderWallpaper(doc) {
  const id    = doc.$id;
  const title = doc.Title       || 'Wallpaper';
  const cat   = doc.Category    || 'anime';
  const res   = doc.Resolution  || '4K';
  const tags  = parseTags(doc.Tag || '');

  document.title = `MATPAPER — ${title}`;

  // Image
  const imgEl = document.getElementById('wpImage');
  const pubId  = doc.Cloudinary_url || doc.cloudinary_url || '';
  if (pubId && pubId.trim()) {
    imgEl.src = Cloudinary.url(pubId);
  } else {
    imgEl.src = 'https://picsum.photos/seed/' + id + '/600/900';
  }
  imgEl.alt = title;

  // Text fields
  document.getElementById('wpTitle').textContent     = title;
  document.getElementById('wpCatText').textContent   = formatCatLabel(cat);
  document.getElementById('wpRes').textContent       = res;
  document.getElementById('wpViews').textContent     = formatNum((doc.Views     || 0) + 1);
  document.getElementById('wpDownloads').textContent = formatNum(doc.Downloads  || 0);
  document.getElementById('wpLikes').textContent     = formatNum(doc.Likes      || 0);
  document.getElementById('wpDesc').textContent      = doc.description ||
    `A stunning ${res} ${formatCatLabel(cat)} wallpaper. Download for free and set it as your background.`;

  // Breadcrumb
  const breadCat = document.getElementById('breadCat');
  breadCat.textContent = formatCatLabel(cat);
  breadCat.href        = `category.html?cat=${cat}`;
  document.getElementById('breadTitle').textContent = title;

  // Tags
  renderTags(tags.length ? tags : [formatCatLabel(cat), res, 'Wallpaper']);

  // Button states
  updateLikeBtn();
  updateSaveBtn();
}

/* ── Render from URL params (fallback) ───────────────── */
function renderFromParams(id, cat, title, res) {
  document.title = `MATPAPER — ${decodeURIComponent(title)}`;

  const imgEl  = document.getElementById('wpImage');
  imgEl.src    = `https://picsum.photos/seed/${id}/600/900`;
  imgEl.alt    = decodeURIComponent(title);

  const decodedTitle = decodeURIComponent(title);
  document.getElementById('wpTitle').textContent     = decodedTitle;
  document.getElementById('wpCatText').textContent   = formatCatLabel(cat);
  document.getElementById('wpRes').textContent       = res;
  document.getElementById('wpViews').textContent     = '—';
  document.getElementById('wpDownloads').textContent = '—';
  document.getElementById('wpLikes').textContent     = '—';
  document.getElementById('wpDesc').textContent      =
    `A stunning ${res} ${formatCatLabel(cat)} wallpaper. Download for free.`;

  const breadCat = document.getElementById('breadCat');
  breadCat.textContent = formatCatLabel(cat);
  breadCat.href        = `category.html?cat=${cat}`;
  document.getElementById('breadTitle').textContent = decodedTitle;

  renderTags([formatCatLabel(cat), res, 'Wallpaper', 'HD']);
  updateLikeBtn();
  updateSaveBtn();
}

/* ── Tags ─────────────────────────────────────────────── */
function renderTags(tags) {
  const wrap = document.getElementById('wpTags');
  wrap.innerHTML = '';
  tags.forEach(tag => {
    const pill = document.createElement('button');
    pill.className   = 'wp-tag-pill';
    pill.textContent = tag;
    pill.onclick     = () => { location.href = `category.html?cat=${tag.toLowerCase()}`; };
    wrap.appendChild(pill);
  });
}

/* ── Related Filters ──────────────────────────────────── */
function renderRelatedFilters(cat) {
  const row    = document.getElementById('relatedFilters');
  row.innerHTML = '';
  const filters = ['All', formatCatLabel(cat), 'Popular', 'New'];
  filters.forEach(label => {
    const btn = document.createElement('button');
    btn.className   = 'related-tag' + (label === 'All' ? ' active' : '');
    btn.textContent = label;
    btn.addEventListener('click', () => {
      row.querySelectorAll('.related-tag').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      relatedFilter = label.toLowerCase();
      renderRelated(cat);
    });
    row.appendChild(btn);
  });
}

/* ── Related Grid ─────────────────────────────────────── */
async function renderRelated(cat) {
  const grid = document.getElementById('relatedGrid');
  grid.innerHTML = '<div style="grid-column:1/-1;color:var(--text-dim);font-size:13px;padding:10px 0;font-family:Barlow Condensed,sans-serif;letter-spacing:1px;">Loading...</div>';

  try {
    const res  = await DB.getWallpapers({ category: cat, limit: 8 });
    const docs = res.documents || [];
    grid.innerHTML = '';

    if (!docs.length) {
      // Fallback placeholder cards
      for (let i = 0; i < 8; i++) {
        grid.appendChild(makeRelatedCard({
          $id:          `rel-${cat}-${i}`,
          Title:        ['Shadow Monarch','Gojo','Bam','Naruto','Ichigo','Luffy','Eren','Tanjiro'][i],
          Resolution:   ['4K','2K','1080p','1440p','4K','2K','1080p','4K'][i],
          Category:     cat,
          cloudinary_url: '',
        }, i));
      }
    } else {
      docs.forEach((doc, i) => grid.appendChild(makeRelatedCard(doc, i)));
    }
  } catch {
    grid.innerHTML = '';
    for (let i = 0; i < 4; i++) {
      grid.appendChild(makeRelatedCard({
        $id: `rel-${i}`, Title: 'Wallpaper', Resolution: '4K', Category: cat, cloudinary_url: '',
      }, i));
    }
  }
}

function makeRelatedCard(doc, index) {
  const id    = doc.$id;
  const title = doc.Title      || 'Wallpaper';
  const res   = doc.Resolution || '4K';
  const cat   = doc.Category   || 'anime';

  const pubId2 = (doc.Cloudinary_url || doc.cloudinary_url || '').trim();
  const imgSrc = pubId2
    ? Cloudinary.thumbnail(pubId2, 300, 400)
    : 'https://picsum.photos/seed/' + id + index + '/300/400';

  const card = document.createElement('div');
  card.className = 'related-card';
  card.style.animationDelay = `${index * 0.05}s`;
  card.innerHTML = `
    <span class="related-res">${res}</span>
    <img src="${imgSrc}" alt="${title}" loading="lazy">
    <div class="related-overlay">
      <span class="related-title">${title}</span>
      <button class="related-dl" onclick="relatedDownload(event,'${title}')"><i class="fas fa-download"></i></button>
    </div>
  `;
  card.addEventListener('click', () => {
    location.href = `wallpaper.html?id=${id}&cat=${cat}&title=${encodeURIComponent(title)}&res=${res}`;
  });
  return card;
}

function relatedDownload(e, title) {
  e.stopPropagation();
  toast(`Downloading: ${title}`, 'fa-download');
}

/* ── Action Buttons ───────────────────────────────────── */
function wpLike() {
  const params = new URLSearchParams(window.location.search);
  const id     = params.get('id');
  isLiked      = LocalData.toggleLike(id);
  if (isLiked && wpDoc) DB.increment(id, 'Likes', wpDoc.Likes || 0);
  toast(isLiked ? 'Liked! ❤️' : 'Removed like', 'fa-heart');
  updateLikeBtn();
}

function wpSave() {
  const params = new URLSearchParams(window.location.search);
  const id     = params.get('id');
  isSaved      = LocalData.toggleSave(id);
  toast(isSaved ? 'Saved to collection! 🔖' : 'Removed from saved', 'fa-bookmark');
  updateSaveBtn();
}

function wpDownload() {
  const params = new URLSearchParams(window.location.search);
  const id     = params.get('id');
  const title  = document.getElementById('wpTitle').textContent;
  const res    = document.getElementById('wpRes').textContent;

  if (wpDoc && (wpDoc.Cloudinary_url || wpDoc.cloudinary_url)) {
    const pubId = wpDoc.Cloudinary_url || wpDoc.cloudinary_url;
    const link  = document.createElement('a');
    link.href     = Cloudinary.url(pubId);
    link.download = title + '.jpg';
    link.target   = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    DB.increment(id, 'Downloads', wpDoc.Downloads || 0);
  }
  toast('Downloading: ' + title + ' (' + res + ')', 'fa-download');
}

function wpShare() {
  const url   = window.location.href;
  const title = document.getElementById('wpTitle').textContent;
  if (navigator.share) {
    navigator.share({ title, url }).catch(() => {});
  } else {
    navigator.clipboard.writeText(url).then(() => {
      toast('Link copied to clipboard!', 'fa-share-alt');
    });
  }
}

function updateLikeBtn() {
  const btn = document.getElementById('wpBtnLike');
  if (!btn) return;
  btn.classList.toggle('active', isLiked);
  btn.innerHTML = `<i class="fas fa-heart"></i> ${isLiked ? 'Liked' : 'Like'}`;
}

function updateSaveBtn() {
  const btn = document.getElementById('wpBtnSave');
  if (!btn) return;
  btn.classList.toggle('active', isSaved);
  btn.innerHTML = `<i class="fas fa-bookmark"></i> ${isSaved ? 'Saved' : 'Save'}`;
}

/* ── Zoom ─────────────────────────────────────────────── */
function toggleZoom() {
  isZoomed = !isZoomed;
  document.getElementById('wpImageWrap').classList.toggle('zoomed', isZoomed);
  document.getElementById('zoomIcon').className = isZoomed ? 'fas fa-compress' : 'fas fa-expand';
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

/* ── Helpers ──────────────────────────────────────────── */
function formatCatLabel(cat) {
  const map = {
    anime:'Anime', manhwa:'Manhwa', games:'Games', hot:'Hot',
    desktop:'Desktop', profile:'Profile', nature:'Nature',
    solo:'Solo Leveling', jjk:'Jujutsu Kaisen', naruto:'Naruto',
    bleach:'Bleach', tog:'Tower of God', tbate:'TBATE',
    onepiece:'One Piece', aot:'Attack on Titan', demon:'Demon Slayer',
  };
  return map[cat] || (cat ? cat.charAt(0).toUpperCase() + cat.slice(1) : 'Anime');
}

/* ── Bootstrap ────────────────────────────────────────── */
init();

/* ── Copy Link ────────────────────────────────────────── */
function wpCopyLink() {
  var url = window.location.href;
  navigator.clipboard.writeText(url).then(function() {
    toast('Link copied to clipboard!', 'fa-copy');
  }).catch(function() {
    // Fallback
    var ta = document.createElement('textarea');
    ta.value = url;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); toast('Link copied!', 'fa-copy'); } catch(e) {}
    document.body.removeChild(ta);
  });
}

/* ── Report Wallpaper ─────────────────────────────────── */
function wpReport() {
  var title = document.getElementById('wpTitle').textContent;
  var url   = window.location.href;
  var mailtoUrl = 'mailto:admin@matpaper.com?subject=' + encodeURIComponent('[MATPAPER] Report: ' + title) + '&body=' + encodeURIComponent('I would like to report the following wallpaper:\n\nTitle: ' + title + '\nURL: ' + url + '\n\nReason for report:\n');
  window.location.href = mailtoUrl;
  toast('Opening email to report...', 'fa-flag');
}

/* ── Phone Mockup Toggle ──────────────────────────────── */
var mockupActive = false;
function toggleMockup() {
  mockupActive = !mockupActive;
  var wrap  = document.getElementById('wpImageWrap');
  var btn   = document.getElementById('mockupBtn');
  var img   = document.getElementById('wpImage');
  if (mockupActive) {
    wrap.classList.add('mockup-mode');
    if (btn) btn.innerHTML = '<i class="fas fa-mobile-alt"></i> Exit Preview';
    // Apply portrait crop via Cloudinary
    if (window.wpDoc && (wpDoc.Cloudinary_url || wpDoc.cloudinary_url)) {
      var pubId = wpDoc.Cloudinary_url || wpDoc.cloudinary_url;
      img.src = 'https://res.cloudinary.com/dd0zzul9w/image/upload/w_390,h_844,c_fill,q_auto,f_auto/' + pubId;
    }
  } else {
    wrap.classList.remove('mockup-mode');
    if (btn) btn.innerHTML = '<i class="fas fa-mobile-alt"></i> Phone Preview';
    if (window.wpDoc && (wpDoc.Cloudinary_url || wpDoc.cloudinary_url)) {
      var pubId = wpDoc.Cloudinary_url || wpDoc.cloudinary_url;
      img.src = 'https://res.cloudinary.com/dd0zzul9w/image/upload/' + pubId;
    }
  }
}
