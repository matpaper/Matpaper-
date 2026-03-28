/* ============================================================
   site-settings.js
   Loads on every page — fetches admin settings from Appwrite
   and applies them: colors, fonts, hero text, ads, announcements
============================================================ */
(function() {
  const AW_EP  = 'https://nyc.cloud.appwrite.io/v1';
  const AW_PID = '69bfd37d001379ea4815';
  const AW_DB  = 'matpaper-db-001';
  const ST_COL = 'site-settings-001';
  const ST_DOC = 'global';

  /* ── Fetch settings from Appwrite ── */
  async function loadSettings() {
    try {
      const client = new Appwrite.Client().setEndpoint(AW_EP).setProject(AW_PID);
      const db     = new Appwrite.Databases(client);
      const doc    = await db.getDocument(AW_DB, ST_COL, ST_DOC);
      applySettings(doc);
    } catch(e) {
      /* Settings doc doesn't exist yet — use defaults */
      applySettings({});
    }
  }

  function applySettings(s) {
    const root = document.documentElement;

    /* ── Colors ── */
    if (s.colorAccent)    root.style.setProperty('--accent',      s.colorAccent);
    if (s.colorHot)       root.style.setProperty('--accent-hot',  s.colorHot);
    if (s.colorGlow)      root.style.setProperty('--accent-glow', s.colorGlow);
    if (s.colorTeal)      root.style.setProperty('--accent-teal', s.colorTeal);
    if (s.colorBg)        root.style.setProperty('--bg-deep',     s.colorBg);
    if (s.colorSurface)   root.style.setProperty('--bg-surface',  s.colorSurface);
    if (s.colorText)      root.style.setProperty('--text-primary',s.colorText);

    /* ── Typography ── */
    if (s.fontSize)    document.body.style.fontSize   = s.fontSize + 'px';
    if (s.fontFamily)  document.body.style.fontFamily = s.fontFamily + ', sans-serif';
    if (s.lineHeight)  document.body.style.lineHeight = s.lineHeight;

    /* ── Hero section (index.html only) ── */
    var heroH1 = document.querySelector('.hero h1');
    if (heroH1 && s.heroTitle) {
      /* Keep the <span> tag for gradient text */
      var span = heroH1.querySelector('span');
      if (span && s.heroTitleSpan) {
        heroH1.childNodes[0].textContent = s.heroTitle + ' ';
        span.textContent = s.heroTitleSpan;
      } else if (!span) {
        heroH1.textContent = s.heroTitle;
      }
    }
    var heroP = document.querySelector('.hero p');
    if (heroP && s.heroSub) heroP.textContent = s.heroSub;

    var heroLabel = document.querySelector('.hero-label');
    if (heroLabel && s.heroLabel) heroLabel.textContent = s.heroLabel;

    /* ── Announcement bar ── */
    if (s.announcementEnabled && s.announcementText) {
      var existing = document.getElementById('mp-announcement');
      if (!existing) {
        var bar = document.createElement('div');
        bar.id = 'mp-announcement';
        bar.style.cssText =
          'background:' + (s.announcementColor || 'var(--accent)') + ';' +
          'color:white;text-align:center;padding:10px 16px;font-size:14px;' +
          'font-family:Barlow Condensed,sans-serif;font-weight:600;letter-spacing:0.5px;' +
          'position:relative;z-index:900;';
        /* XSS-safe: use textContent for user-supplied text */
        if (s.announcementIcon && /^fa-[a-z0-9-]+$/.test(s.announcementIcon)) {
          var ico = document.createElement('i');
          ico.className = 'fas ' + s.announcementIcon;
          ico.style.marginRight = '8px';
          bar.appendChild(ico);
        }
        bar.appendChild(document.createTextNode(s.announcementText));
        var closeBtn = document.createElement('button');
        closeBtn.style.cssText = 'position:absolute;right:12px;top:50%;transform:translateY(-50%);background:none;border:none;color:white;font-size:16px;cursor:pointer;opacity:0.7;';
        closeBtn.textContent = '×';
        closeBtn.addEventListener('click', function() { bar.remove(); });
        bar.appendChild(closeBtn);
        /* Insert after header */
        var header = document.querySelector('header');
        if (header && header.nextSibling) {
          header.parentNode.insertBefore(bar, header.nextSibling);
        } else {
          document.body.prepend(bar);
        }
      }
    }

    /* ── Maintenance mode ── */
    if (s.maintenanceMode) {
      /* Only show maintenance if user is not admin */
      var isAdminPage = window.location.pathname.includes('admin.html') ||
                        window.location.pathname.includes('team.html');
      if (!isAdminPage) {
        document.body.innerHTML =
          '<div style="display:flex;align-items:center;justify-content:center;min-height:100vh;' +
          'background:#07000f;color:#f0e6ff;text-align:center;padding:40px;font-family:Barlow,sans-serif;">' +
          '<div>' +
          '<img src="logo.png" style="width:80px;height:80px;border-radius:50%;object-fit:cover;margin:0 auto 20px;display:block;">' +
          '<div style="font-family:Audiowide,sans-serif;font-size:24px;background:linear-gradient(135deg,#a855f7,#00e5c3);-webkit-background-clip:text;-webkit-text-fill-color:transparent;margin-bottom:12px;">MATPAPER</div>' +
          '<div style="font-size:32px;font-weight:700;margin-bottom:12px;">🔧 Under Maintenance</div>' +
          '<div style="font-size:16px;color:#8b7aa0;max-width:400px;">' +
          (s.maintenanceMessage || 'We are currently performing maintenance. We\'ll be back shortly!') +
          '</div>' +
          '</div></div>';
        return;
      }
    }

    /* ── Google AdSense ── */
    if (s.adsEnabled && s.adsPublisherId) {
      if (!document.getElementById('mp-adsense')) {
        var adScript = document.createElement('script');
        adScript.id  = 'mp-adsense';
        adScript.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=' + s.adsPublisherId;
        adScript.async       = true;
        adScript.crossOrigin = 'anonymous';
        document.head.appendChild(adScript);
      }
      /* Show ad slots on wallpaper and category pages */
      document.querySelectorAll('.mp-ad-slot').forEach(function(slot) {
        slot.style.display = 'block';
        try {
          (window.adsbygoogle = window.adsbygoogle || []).push({});
        } catch(e) {}
      });
    }

    /* ── Download limits ── */
    window.MP_DOWNLOAD_LIMIT   = s.downloadLimitsEnabled ? (s.dailyDownloadLimit  || 10) : null;
    window.MP_PREMIUM_ENABLED  = !!s.premiumEnabled;

    /* ── Custom CSS ── */
    if (s.customCss) {
      var styleTag = document.getElementById('mp-custom-css');
      if (!styleTag) {
        styleTag = document.createElement('style');
        styleTag.id = 'mp-custom-css';
        document.head.appendChild(styleTag);
      }
      styleTag.textContent = s.customCss;
    }
  }

  /* ── Run after Appwrite SDK is ready ── */
  if (typeof Appwrite !== 'undefined') {
    loadSettings();
  } else {
    document.addEventListener('DOMContentLoaded', loadSettings);
  }

})();

/* ============================================================
   Download limit helper — call this on every download
============================================================ */
function checkDownloadLimit() {
  if (!window.MP_DOWNLOAD_LIMIT) return true; /* no limit */

  var today    = new Date().toDateString();
  var key      = 'mp_dl_' + today;
  var count    = parseInt(localStorage.getItem(key) || '0', 10);
  var isPremium = localStorage.getItem('mp_premium') === 'true';

  if (isPremium) return true;

  if (count >= window.MP_DOWNLOAD_LIMIT) {
    alert('You have reached your daily download limit of ' + window.MP_DOWNLOAD_LIMIT + '. Upgrade to premium for unlimited downloads!');
    return false;
  }

  localStorage.setItem(key, count + 1);
  return true;
}

/* ============================================================
   Cookie Consent Banner
============================================================ */
(function() {
  if (localStorage.getItem('mp_cookie_consent')) return;
  var isAdminPage = window.location.pathname.includes('admin.html') || window.location.pathname.includes('team.html');
  if (isAdminPage) return;

  function showConsent() {
    if (document.getElementById('mp-cookie-banner')) return;
    var banner = document.createElement('div');
    banner.id = 'mp-cookie-banner';
    banner.style.cssText = 'position:fixed;bottom:0;left:0;right:0;z-index:9998;background:#160030;border-top:1px solid rgba(124,58,237,0.3);padding:14px 16px;display:flex;align-items:center;gap:12px;flex-wrap:wrap;justify-content:space-between;font-family:Barlow,sans-serif;font-size:13px;color:#b09cc5;';
    var text = document.createElement('span');
    text.textContent = '🍪 We use cookies to store your preferences and saved wallpapers. No tracking without consent.';
    var btnWrap = document.createElement('div');
    btnWrap.style.cssText = 'display:flex;gap:8px;flex-shrink:0;';
    var acceptBtn = document.createElement('button');
    acceptBtn.textContent = 'Accept';
    acceptBtn.style.cssText = 'padding:8px 18px;background:linear-gradient(135deg,#7c3aed,#5b21b6);border:none;border-radius:8px;color:white;font-size:13px;font-weight:700;font-family:Barlow Condensed,sans-serif;letter-spacing:1px;cursor:pointer;';
    acceptBtn.addEventListener('click', function() {
      localStorage.setItem('mp_cookie_consent', 'accepted');
      banner.remove();
    });
    var declineBtn = document.createElement('button');
    declineBtn.textContent = 'Decline';
    declineBtn.style.cssText = 'padding:8px 14px;background:none;border:1px solid rgba(124,58,237,0.3);border-radius:8px;color:#8b7aa0;font-size:13px;font-family:Barlow Condensed,sans-serif;cursor:pointer;';
    declineBtn.addEventListener('click', function() {
      localStorage.setItem('mp_cookie_consent', 'declined');
      banner.remove();
    });
    var privacyLink = document.createElement('a');
    privacyLink.href = 'privacy.html';
    privacyLink.textContent = 'Privacy Policy';
    privacyLink.style.cssText = 'color:#00e5c3;text-decoration:underline;font-size:12px;';
    btnWrap.appendChild(acceptBtn);
    btnWrap.appendChild(declineBtn);
    banner.appendChild(text);
    banner.appendChild(privacyLink);
    banner.appendChild(btnWrap);
    document.body.appendChild(banner);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', showConsent);
  } else {
    setTimeout(showConsent, 1500);
  }
})();

/* ============================================================
   PWA Service Worker Registration
============================================================ */
if ('serviceWorker' in navigator) {
  window.addEventListener('load', function() {
    navigator.serviceWorker.register('/sw.js').catch(function() {});
  });
}
