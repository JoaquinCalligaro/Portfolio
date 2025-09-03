import { initMobileMenu } from './mobileMenu';
import { initNavbarVisibility } from './navbarVisibility';
import { initSectionNavigation } from './sectionNavigation';

export function initNavbar() {
  initMobileMenu();
  initNavbarVisibility();
  initSectionNavigation();
}
