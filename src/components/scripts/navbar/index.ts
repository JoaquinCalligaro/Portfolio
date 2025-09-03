import { initMobileMenu } from './mobileMenu';
import { initScrollBehavior } from './scrollBehavior';
import { initGlassNavigation } from './glassNavigation';

export function initNavbar() {
  initMobileMenu();
  initScrollBehavior();
  initGlassNavigation();
}
