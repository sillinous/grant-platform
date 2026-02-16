
// We use the CDN script in index.html, which exposes window.netlifyIdentity
// Access it lazily to avoid race conditions during module evaluation.

export const auth = {
  user: null, // Current user object
  
  _getParams: () => window.netlifyIdentity,

  init(callback) {
    const NIST = this._getParams();
    if (!NIST) {
      console.warn("Netlify Identity script not loaded. Auth disabled.");
      return;
    }

    NIST.init();
    
    // Set initial user
    this.user = NIST.currentUser();

    // Bind events
    NIST.on("login", (user) => {
      this.user = user;
      NIST.close();
      if (callback) callback(user);
    });

    NIST.on("logout", () => {
      this.user = null;
      if (callback) callback(null);
    });
  },

  login() {
    const NIST = this._getParams();
    if (NIST) NIST.open("login");
  },

  signup() {
    const NIST = this._getParams();
    if (NIST) NIST.open("signup");
  },

  logout() {
    const NIST = this._getParams();
    if (NIST) NIST.logout();
  },

  // Get the JWT token for API requests
  async getToken() {
    if (!this.user) return null;
    // Refresh token if needed
    try {
      const token = await this.user.jwt(); 
      return token;
    } catch (e) {
      console.error("Error getting token", e);
      return null;
    }
  }
};
