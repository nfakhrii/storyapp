import HomePage from '../pages/home/home-page';
import AboutPage from '../pages/about/about-page';
import LoginPage from '../pages/auth/login-page';
import RegisterPage from '../pages/auth/register-page';
import StoryDetailPage from '../pages/story-detail/story-detail-page';
import AddStoryPage from '../pages/story-add/add-story-page';
import SavedPage from '../pages/saved/saved-page';

const routes = {
  '/': new HomePage(),
  '/about': new AboutPage(),
  '/login': new LoginPage(),
  '/register': new RegisterPage(),
  '/stories/:id': new StoryDetailPage(),
  '/add-story': new AddStoryPage(),
  '/saved': new SavedPage(),
  '/logout': null,
};

export default routes;
