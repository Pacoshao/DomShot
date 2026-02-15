const formatSelect = document.getElementById('format');
const pixelRatioSelect = document.getElementById('pixel-ratio');
const actionSelect = document.getElementById('action');
const transparentSelect = document.getElementById('transparent');
const pixelRatioContainer = document.getElementById('pixel-ratio-container');

// Load saved settings
async function loadSettings() {
  const result = await chrome.storage.local.get('domshotSettings');
  if (result.domshotSettings) {
    const s = result.domshotSettings;
    if (s.format) formatSelect.value = s.format;
    if (s.pixelRatio) pixelRatioSelect.value = s.pixelRatio;
    if (s.action) actionSelect.value = s.action;
    if (s.transparent) transparentSelect.value = s.transparent;
    
    // Trigger format change visibility
    updateVisibility();
  }
}

function updateVisibility() {
  if (formatSelect.value === 'svg') {
    pixelRatioContainer.style.display = 'none';
  } else {
    pixelRatioContainer.style.display = 'block';
  }
}

// Handle format change to hide/show scale options
formatSelect.addEventListener('change', updateVisibility);

// Save settings whenever they change
[formatSelect, pixelRatioSelect, actionSelect, transparentSelect].forEach(el => {
  el.addEventListener('change', async () => {
    await chrome.storage.local.set({ 
      domshotSettings: { 
        format: formatSelect.value, 
        pixelRatio: pixelRatioSelect.value, 
        action: actionSelect.value, 
        transparent: transparentSelect.value 
      } 
    });
  });
});

// Initialize
loadSettings();

document.getElementById('start-picker').addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
  // Settings are already saved via 'change' listeners, but we can ensure they are up to date
  const format = formatSelect.value;
  const pixelRatio = pixelRatioSelect.value;
  const action = actionSelect.value;
  const transparent = transparentSelect.value;

  await chrome.storage.local.set({ 
    domshotSettings: { format, pixelRatio, action, transparent } 
  });

  // Inject content script if not already there (though manifest handles it)
  // But we need to make sure the tab is ready
  chrome.tabs.sendMessage(tab.id, { type: 'START_SELECTION' }, (response) => {
    if (chrome.runtime.lastError) {
      console.error(chrome.runtime.lastError);
      alert('无法在当前页面启动选择器（请刷新页面或尝试其他页面）。');
    } else {
      window.close(); // Close popup to let user select
    }
  });
});
