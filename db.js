/* ============================================================
   db.js — Appwrite + Cloudinary Connection
   Central file used by all pages
============================================================ */

/* ── Config ───────────────────────────────────────────── */
const APPWRITE_ENDPOINT   = 'https://nyc.cloud.appwrite.io/v1';
const APPWRITE_PROJECT_ID = '69bfd37d001379ea4815';
const APPWRITE_DB_ID      = 'matpaper-db-001';
const APPWRITE_COL_ID     = 'matpaper-col-001';

const CLOUDINARY_CLOUD    = 'dd0zzul9w';
const CLOUDINARY_PRESET   = 'matpaper_upload';
const CLOUDINARY_BASE     = `https://res.cloudinary.com/${CLOUDINARY_CLOUD}`;

/* ── Appwrite SDK Setup ───────────────────────────────── */
let _client, _databases;

function getClient() {
  if (_client) return _client;
  _client = new Appwrite.Client()
    .setEndpoint(APPWRITE_ENDPOINT)
    .setProject(APPWRITE_PROJECT_ID);
  return _client;
}

function getDatabases() {
  if (_databases) return _databases;
  _databases = new Appwrite.Databases(getClient());
  return _databases;
}

/* ── Cloudinary URL Helpers ───────────────────────────── */
const Cloudinary = {
  // Full quality image
  url(publicId) {
    return `${CLOUDINARY_BASE}/image/upload/${publicId}`;
  },

  // Thumbnail — auto resized
  thumbnail(publicId, w = 400, h = 600) {
    return `${CLOUDINARY_BASE}/image/upload/w_${w},h_${h},c_fill,q_auto,f_auto/${publicId}`;
  },

  // Mobile optimised (9:16)
  mobile(publicId) {
    return `${CLOUDINARY_BASE}/image/upload/w_600,h_1067,c_fill,q_auto,f_auto/${publicId}`;
  },

  // Desktop optimised (16:9)
  desktop(publicId) {
    return `${CLOUDINARY_BASE}/image/upload/w_1920,h_1080,c_fill,q_auto,f_auto/${publicId}`;
  },

  // Profile (1:1)
  profile(publicId) {
    return `${CLOUDINARY_BASE}/image/upload/w_400,h_400,c_fill,q_auto,f_auto/${publicId}`;
  },

  // Upload image directly from browser
  async upload(file, folder = 'matpaper') {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_PRESET);
    formData.append('folder', folder);

    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/image/upload`,
      { method: 'POST', body: formData }
    );

    if (!res.ok) throw new Error('Cloudinary upload failed');
    return await res.json();
  },
};

/* ── Appwrite Database Helpers ────────────────────────── */
const DB = {

  // Fetch wallpapers with optional filters
  async getWallpapers({ category, tags, limit = 20, offset = 0, search } = {}) {
    try {
      const db      = getDatabases();
      const queries = [
        Appwrite.Query.limit(limit),
        Appwrite.Query.offset(offset),
        Appwrite.Query.orderDesc('$createdAt'),
      ];

      if (category && category !== 'all') {
        queries.push(Appwrite.Query.equal('Category', category));
      }

      if (search) {
        queries.push(Appwrite.Query.search('Title', search));
      }

      const res = await db.listDocuments(
        APPWRITE_DB_ID,
        APPWRITE_COL_ID,
        queries
      );

      return res;
    } catch (err) {
      console.error('DB.getWallpapers error:', err);
      return { documents: [], total: 0 };
    }
  },

  // Fetch single wallpaper by ID
  async getWallpaper(id) {
    try {
      const db  = getDatabases();
      const doc = await db.getDocument(APPWRITE_DB_ID, APPWRITE_COL_ID, id);
      return doc;
    } catch (err) {
      console.error('DB.getWallpaper error:', err);
      return null;
    }
  },

  // Create a new wallpaper record
  async createWallpaper(data) {
    try {
      const db  = getDatabases();
      const doc = await db.createDocument(
        APPWRITE_DB_ID,
        APPWRITE_COL_ID,
        Appwrite.ID.unique(),
        data
      );
      return doc;
    } catch (err) {
      console.error('DB.createWallpaper error:', err);
      throw err;
    }
  },

  // Update a wallpaper document
  async updateWallpaper(id, data) {
    try {
      const db = getDatabases();
      return await db.updateDocument(APPWRITE_DB_ID, APPWRITE_COL_ID, id, data);
    } catch (err) {
      console.error('DB.updateWallpaper error:', err);
      throw err;
    }
  },

  // Get featured wallpapers (tagged 'featured')
  async getFeatured({ limit = 12 } = {}) {
    try {
      const db      = getDatabases();
      const res     = await db.listDocuments(APPWRITE_DB_ID, APPWRITE_COL_ID, [
        Appwrite.Query.limit(limit),
        Appwrite.Query.orderDesc('$createdAt'),
      ]);
      // Filter client-side for 'featured' tag since search is full-text
      const featured = res.documents.filter(function(d) {
        return d.Tag && d.Tag.toLowerCase().includes('featured');
      });
      return { documents: featured.length ? featured : res.documents.slice(0, limit), total: featured.length };
    } catch (err) {
      return { documents: [], total: 0 };
    }
  },

  // Get trending wallpapers (most views)
  async getTrending({ limit = 12 } = {}) {
    try {
      const db  = getDatabases();
      const res = await db.listDocuments(APPWRITE_DB_ID, APPWRITE_COL_ID, [
        Appwrite.Query.limit(limit),
        Appwrite.Query.orderDesc('Views'),
      ]);
      return res;
    } catch (err) {
      return { documents: [], total: 0 };
    }
  },

  // Get real total stats
  async getStats() {
    try {
      const db  = getDatabases();
      const res = await db.listDocuments(APPWRITE_DB_ID, APPWRITE_COL_ID, [
        Appwrite.Query.limit(1),
      ]);
      return { total: res.total || 0 };
    } catch (err) {
      return { total: 0 };
    }
  },

  // Increment a numeric field (views, downloads, likes)
  async increment(id, field, current) {
    try {
      const db  = getDatabases();
      await db.updateDocument(
        APPWRITE_DB_ID,
        APPWRITE_COL_ID,
        id,
        { [field]: (parseInt(current) || 0) + 1 }
      );
    } catch (err) {
      console.error(`DB.increment(${field}) error:`, err);
    }
  },
};

/* ── Local Storage Helpers ────────────────────────────── */
const LocalData = {
  getLiked()   { return new Set(JSON.parse(localStorage.getItem('mp_liked') || '[]')); },
  getSaved()   { return new Set(JSON.parse(localStorage.getItem('mp_saved') || '[]')); },

  toggleLike(id) {
    const set = this.getLiked();
    set.has(id) ? set.delete(id) : set.add(id);
    localStorage.setItem('mp_liked', JSON.stringify([...set]));
    return set.has(id);
  },

  toggleSave(id) {
    const set = this.getSaved();
    set.has(id) ? set.delete(id) : set.add(id);
    localStorage.setItem('mp_saved', JSON.stringify([...set]));
    return set.has(id);
  },

  isLiked(id) { return this.getLiked().has(id); },
  isSaved(id) { return this.getSaved().has(id); },
};

/* ── Parse tags string to array ───────────────────────── */
function parseTags(tagsStr) {
  if (!tagsStr) return [];
  return tagsStr.split(',').map(t => t.trim()).filter(Boolean);
}

/* ── Format numbers ───────────────────────────────────── */
function formatNum(n) {
  if (!n) return '0';
  return n >= 1000 ? (n / 1000).toFixed(1) + 'K' : String(n);
}
