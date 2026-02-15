const formatSelect = document.getElementById('format');
const pixelRatioContainer = document.getElementById('pixel-ratio-container');

// Handle format change to hide/show scale options
formatSelect.addEventListener('change', () => {
  if (formatSelect.value === 'svg') {
    pixelRatioContainer.style.display = 'none';
  } else {
    pixelRatioContainer.style.display = 'block';
  }
});

document.getElementById('start-picker').addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
  const format = document.getElementById('format').value;
  const pixelRatio = document.getElementById('pixel-ratio').value;
  const action = document.getElementById('action').value;
  const transparent = document.getElementById('transparent').value;

  // Save settings
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
