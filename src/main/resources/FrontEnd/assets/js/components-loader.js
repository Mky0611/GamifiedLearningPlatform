let __componentsLoaded = false;

async function loadHtmlComponents() {
  const targets = document.querySelectorAll('[data-include]');
  for (const target of targets) {
    const filePath = target.getAttribute('data-include');
    if (!filePath) continue;

    try {
      const response = await fetch(filePath);
      if (!response.ok) {
        target.innerHTML = `<div class="small-text">Không tải được component: ${filePath}</div>`;
        continue;
      }
      target.innerHTML = await response.text();
    } catch (error) {
      target.innerHTML = `<div class="small-text">Không tải được component: ${filePath}</div>`;
    }
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  await loadHtmlComponents();
  __componentsLoaded = true;
  document.dispatchEvent(new CustomEvent('components:loaded'));
});

window.areComponentsReady = function () {
  return __componentsLoaded;
};
