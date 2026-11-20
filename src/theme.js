let preference = matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
let forceLight = true;

export function setTheme(theme) {
  preference = theme === 'dark' ? 'dark' : 'light';
  applyTheme(forceLight);
}
export function getTheme() { return preference; }
export function applyTheme(authScreen = forceLight) {
  forceLight = authScreen;
  const mode = forceLight ? 'light' : preference;
  document.documentElement.dataset.theme = mode;
  const button = document.querySelector('[data-action="theme"]');
  if (button) {
    button.setAttribute('aria-label', mode === 'dark' ? 'Ativar tema claro' : 'Ativar tema escuro');
    button.setAttribute('aria-pressed', String(mode === 'dark'));
  }
}
export function toggleTheme() {
  preference = preference === 'dark' ? 'light' : 'dark';
  applyTheme();
  return preference;
}
