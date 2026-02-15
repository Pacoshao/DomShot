(function() {
  let isSelecting = false;
  let hoveredElement = null;
  let toolbar = null;

  function createToolbar() {
    if (toolbar) return;
    toolbar = document.createElement('div');
    toolbar.id = 'domshot-toolbar';
    toolbar.innerHTML = `
      <span style="font-size: 14px; color: #333;">选择要截图的元素...</span>
      <button class="cancel">退出</button>
    `;
    document.body.appendChild(toolbar);
    toolbar.querySelector('.cancel').onclick = stopSelection;
  }

  function removeToolbar() {
    if (toolbar) {
      toolbar.remove();
      toolbar = null;
    }
  }

  function onMouseOver(e) {
    if (!isSelecting) return;
    e.stopPropagation();
    if (hoveredElement) {
      hoveredElement.classList.remove('domshot-highlight');
    }
    hoveredElement = e.target;
    // Don't highlight the toolbar itself
    if (toolbar && (toolbar.contains(hoveredElement) || hoveredElement === toolbar)) {
      hoveredElement = null;
      return;
    }
    hoveredElement.classList.add('domshot-highlight');
  }

  function onClick(e) {
    if (!isSelecting) return;
    e.preventDefault();
    e.stopPropagation();
    
    const target = hoveredElement;
    if (target) {
      // Immediately stop tracking but keep the toolbar
      isSelecting = false;
      document.removeEventListener('mouseover', onMouseOver, true);
      document.removeEventListener('click', onClick, true);
      
      // Remove highlight before capture
      if (hoveredElement) {
        hoveredElement.classList.remove('domshot-highlight');
      }
      
      captureElement(target);
    }
  }

  async function captureElement(element) {
    const settings = (await chrome.storage.local.get('domshotSettings')).domshotSettings || { format: 'png', pixelRatio: 2 };
    
    // Show loading state
    const originalText = toolbar ? toolbar.querySelector('span').innerText : '选择要截图的元素...';
    if (toolbar) {
      toolbar.querySelector('span').innerText = '正在生成并下载...';
    }
    
    try {
      const options = {
        pixelRatio: parseFloat(settings.pixelRatio),
        backgroundColor: '#ffffff', // Default white background if transparent
        style: {
          // Fix some common issues with capturing
          'margin': '0'
        }
      };

      let dataUrl;
      let filename = `domshot-${Date.now()}`;

      if (settings.format === 'svg') {
        dataUrl = await htmlToImage.toSvg(element, options);
        filename += '.svg';
      } else if (settings.format === 'jpeg') {
        dataUrl = await htmlToImage.toJpeg(element, options);
        filename += '.jpg';
      } else {
        dataUrl = await htmlToImage.toPng(element, options);
        filename += '.png';
      }

      const link = document.createElement('a');
      link.download = filename;
      link.href = dataUrl;
      link.click();
      
      if (toolbar) {
        toolbar.querySelector('span').innerText = '保存成功！';
      }
      setTimeout(() => stopSelection(), 1500);
    } catch (error) {
      console.error('DomShot capture error:', error);
      if (toolbar) {
        toolbar.querySelector('span').innerText = '生成失败，请重试。';
        setTimeout(() => {
          if (toolbar) {
            toolbar.querySelector('span').innerText = originalText;
          }
          startSelection(); // resume selection
        }, 3000);
      }
    }
  }

  function startSelection() {
    if (isSelecting) return;
    isSelecting = true;
    createToolbar();
    document.addEventListener('mouseover', onMouseOver, true);
    document.addEventListener('click', onClick, true);
  }

  function stopSelection() {
    isSelecting = false;
    removeToolbar();
    if (hoveredElement) {
      hoveredElement.classList.remove('domshot-highlight');
      hoveredElement = null;
    }
    document.removeEventListener('mouseover', onMouseOver, true);
    document.removeEventListener('click', onClick, true);
  }

  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'START_SELECTION') {
      startSelection();
      sendResponse({ status: 'started' });
    }
    return true;
  });
})();
