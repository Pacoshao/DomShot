document.getElementById('start-picker').addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
  const format = document.getElementById('format').value;
  const pixelRatio = document.getElementById('pixel-ratio').value;

  // Save settings
  await chrome.storage.local.set({ 
    domshotSettings: { format, pixelRatio } 
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
