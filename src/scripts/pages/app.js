import routes from '../routes/routes';
import { getActiveRoute } from '../routes/url-parser';
import AuthModel from '../data/auth-model';

class App {
  #content = null;
  #drawerButton = null;
  #navigationDrawer = null;
  _currentPage = null;
  _skipLinkUsed = false;
  _previousRoute = null;

  constructor({ navigationDrawer, drawerButton, content }) {
    this.#content = content;
    this.#drawerButton = drawerButton;
    this.#navigationDrawer = navigationDrawer;

    this._setupDrawer();
    this._setupSkipLink();
    this._setupViewTransitions();
  }

  _setupDrawer() {
    this.#drawerButton.addEventListener('click', () => {
      this.#navigationDrawer.classList.toggle('open');
    });

    document.body.addEventListener('click', (event) => {
      if (
        !this.#navigationDrawer.contains(event.target) &&
        !this.#drawerButton.contains(event.target)
      ) {
        this.#navigationDrawer.classList.remove('open');
      }

      this.#navigationDrawer.querySelectorAll('a').forEach((link) => {
        if (link.contains(event.target)) {
          this.#navigationDrawer.classList.remove('open');
        }
      });
    });
  }

  _setupSkipLink() {
    const skipLink = document.querySelector('.skip-to-content');
    const mainContent = document.querySelector('#main-content');

    if (skipLink && mainContent) {
      if (!mainContent.hasAttribute('tabindex')) {
        mainContent.setAttribute('tabindex', '-1');
      }

      skipLink.addEventListener('click', (event) => {
        event.preventDefault();
        mainContent.scrollIntoView({ behavior: 'smooth', block: 'start' });
        mainContent.focus();
        this._skipLinkUsed = true;

        const sr = document.createElement('div');
        sr.setAttribute('aria-live', 'polite');
        sr.setAttribute('aria-atomic', 'true');
        sr.className = 'sr-only';
        sr.textContent = 'Navigated to main content';
        document.body.appendChild(sr);

        setTimeout(() => {
          document.body.removeChild(sr);
          this._skipLinkUsed = false;
        }, 1000);
      });
    }
  }

  _setupViewTransitions() {
    if (!document.startViewTransition) {
      console.log('View Transitions API not supported, using fallback animations');
    }
  }

  async renderPage() {
    const url = getActiveRoute();
    const isBackNavigation = this._isBackNavigation(url);

    if (url === '/logout') {
      if (typeof AuthModel.logout === 'function') AuthModel.logout();
      else if (typeof AuthModel.clearToken === 'function') AuthModel.clearToken();
      window.location.hash = '/login';
      this._toggleAuthLinks();
      return;
    }

    if (this._currentPage && typeof this._currentPage.destroy === 'function') {
      try { 
        this._currentPage.destroy(); 
      } catch (e) { 
        console.warn('[App] destroy error:', e); 
      }
      this._currentPage = null;
    }

    const page = routes[url];
    if (!page) {
      this.#content.innerHTML = '<section class="container"><h1>404 - Page not found</h1></section>';
      return;
    }
    this._currentPage = page;

    const html = await page.render();

    if (document.startViewTransition) {
      await this._renderWithViewTransition(html, page, isBackNavigation);
    } else {
      await this._renderWithFallback(html, page);
    }

    this._previousRoute = url;
  }

  async _renderWithViewTransition(html, page, isBackNavigation) {
    if (isBackNavigation) {
      document.documentElement.classList.add('back-transition');
    }

    const transition = document.startViewTransition(async () => {
      await this._updateDOM(html, page);
    });

    try {
      await transition.finished;
    } finally {
      document.documentElement.classList.remove('back-transition');
    }
  }

  async _renderWithFallback(html, page) {
    await this._updateDOM(html, page);
  }

  async _updateDOM(html, page) {
    const routeHasMap = (this._previousRoute === '/') || 
                       (this._previousRoute === '/add-story') || 
                       (this._previousRoute === '/stories/:id');

    const wrapper = document.createElement('div');
    
    if (!document.startViewTransition) {
      wrapper.classList.add(routeHasMap ? 'page-fade' : 'page-transition');
    }
    
    this.#content.innerHTML = '';
    wrapper.innerHTML = html;
    this.#content.appendChild(wrapper);

    if (!document.startViewTransition) {
      requestAnimationFrame(() => {
        wrapper.classList.add(routeHasMap ? 'page-fade-active' : 'page-transition-active');
      });
    }

    if (typeof page.afterRender === 'function') {
      await page.afterRender();
    }

    if (!this._skipLinkUsed) {
      const mainHeading = this.#content.querySelector('h1') || this.#content.querySelector('h2');
      if (mainHeading) {
        mainHeading.setAttribute('tabindex', '-1');
        mainHeading.focus();
        
        if (document.startViewTransition) {
          mainHeading.style.animation = 'none';
          requestAnimationFrame(() => {
            mainHeading.style.animation = 'slideInFromRight 0.6s ease forwards';
          });
        }
      }
    }

    this._toggleAuthLinks();
  }

  _isBackNavigation(newRoute) {
    if (!this._previousRoute) return false;
    
    const fromDetailToList = this._previousRoute.startsWith('/stories/') && (newRoute === '/' || newRoute === '/saved');
    const fromAddToHome = this._previousRoute === '/add-story' && newRoute === '/';
    
    return fromDetailToList || fromAddToHome;
  }

  _toggleAuthLinks() {
    const isLoggedIn = AuthModel.isLoggedIn ? AuthModel.isLoggedIn() : !!AuthModel.getToken();
    const loginLink = document.querySelector('#login-link');
    const logoutLink = document.querySelector('#logout-link');
    const addLink = document.querySelector('#add-story-link');

    if (loginLink && logoutLink) {
      if (isLoggedIn) {
        loginLink.style.display = 'none';
        logoutLink.style.display = 'block';
        if (addLink) addLink.style.display = 'block';
      } else {
        loginLink.style.display = 'block';
        logoutLink.style.display = 'none';
        if (addLink) addLink.style.display = 'none';
      }
    }
  }
}

export default App;