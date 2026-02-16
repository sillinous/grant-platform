
// import netlifyIdentity from "netlify-identity-widget"; 
// ^^^ CAUSES VITE BUILD ISSUES (global is not defined)
// We use the CDN script in index.html, which exposes window.netlifyIdentity
const netlifyIdentity = window.netlifyIdentity;

export const auth = {
  user: null, // Current user object
  
  init(callback) {
    netlifyIdentity.init();
    
    // Set initial user
    this.user = netlifyIdentity.currentUser();

    // Bind events
    netlifyIdentity.on("login", (user) => {
      this.user = user;
      netlifyIdentity.close();
      if (callback) callback(user);
    });

    netlifyIdentity.on("logout", () => {
      this.user = null;
      if (callback) callback(null);
    });
  },

  login() {
    netlifyIdentity.open("login");
  },

  signup() {
    netlifyIdentity.open("signup");
  },

  logout() {
    netlifyIdentity.logout();
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
