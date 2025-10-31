const TOKEN_KEY = 'authToken';

class AuthModel {
  saveToken(token) {
    try {
      localStorage.setItem(TOKEN_KEY, token);
    } catch (error) {
      console.error('[AuthModel] Failed to save token:', error);
      this._memoryToken = token;
    }
  }

  getToken() {
    try {
      return localStorage.getItem(TOKEN_KEY) || this._memoryToken || null;
    } catch (error) {
      console.error('[AuthModel] Failed to get token:', error);
      return this._memoryToken || null;
    }
  }

  clearToken() {
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch (error) {
      console.error('[AuthModel] Failed to clear token:', error);
    }
    this._memoryToken = null;
  }

  logout() {
    this.clearToken();
  }

  isLoggedIn() {
    const token = this.getToken();
    return !!token && token.length > 0;
  }
}

export default new AuthModel();
