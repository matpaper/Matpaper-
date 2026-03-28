/* ============================================================
   auth.js — Appwrite Backend Authentication
   Passwords stored securely on Appwrite servers (bcrypt hashed)
   No plain text passwords in client code
============================================================ */

var AW_EP  = 'https://nyc.cloud.appwrite.io/v1';
var AW_PID = '69bfd37d001379ea4815';

/* ── Appwrite client for auth ── */
const authClient  = new Appwrite.Client().setEndpoint(AW_EP).setProject(AW_PID);
const authAccount = new Appwrite.Account(authClient);

/* ── Session timeout (30 minutes inactivity) ── */
const SESSION_TIMEOUT = 30 * 60 * 1000;
let activityTimer = null;

const Auth = {

  /* Login — returns user object or throws */
  async login(email, password) {
    await authAccount.createEmailPasswordSession(email, password);
    const user = await authAccount.get();
    this._startActivityTimer();
    return user;
  },

  /* Logout — destroys session on Appwrite server */
  async logout() {
    try {
      await authAccount.deleteSession('current');
    } catch(e) { /* already logged out */ }
    this._clearActivityTimer();
  },

  /* Get current logged in user — returns null if not logged in */
  async getUser() {
    try {
      return await authAccount.get();
    } catch(e) {
      return null;
    }
  },

  /* Check if user is admin */
  isAdmin(user) {
    if (!user) return false;
    return Array.isArray(user.labels) && user.labels.includes('admin');
  },

  /* Check if user is team (team or admin can access team panel) */
  isTeam(user) {
    if (!user) return false;
    return Array.isArray(user.labels) &&
      (user.labels.includes('team') || user.labels.includes('admin'));
  },

  /* Require auth — redirect to home if not logged in with correct role */
  async requireAdmin() {
    const user = await this.getUser();
    if (!user || !this.isAdmin(user)) {
      window.location.href = 'index.html';
      return null;
    }
    this._startActivityTimer();
    return user;
  },

  async requireTeam() {
    const user = await this.getUser();
    if (!user || !this.isTeam(user)) {
      window.location.href = 'index.html';
      return null;
    }
    this._startActivityTimer();
    return user;
  },

  /* Auto-logout after inactivity */
  _startActivityTimer() {
    this._clearActivityTimer();
    activityTimer = setTimeout(async () => {
      await this.logout();
      alert('Session expired due to inactivity. Please log in again.');
      window.location.reload();
    }, SESSION_TIMEOUT);

    /* Reset timer on activity */
    ['click','keydown','touchstart'].forEach(ev => {
      document.addEventListener(ev, () => {
        if (activityTimer) {
          clearTimeout(activityTimer);
          activityTimer = setTimeout(async () => {
            await this.logout();
            alert('Session expired. Please log in again.');
            window.location.reload();
          }, SESSION_TIMEOUT);
        }
      }, { passive: true });
    });
  },

  _clearActivityTimer() {
    if (activityTimer) {
      clearTimeout(activityTimer);
      activityTimer = null;
    }
  },
};
