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
    
    // Don't highlight the toolbar itself
    if (toolbar && (toolbar.contains(e.target) || e.target === toolbar)) {
      return;
    }

    updateHighlight(e.target);
  }

  function updateHighlight(element) {
    if (hoveredElement) {
      hoveredElement.classList.remove('domshot-highlight');
    }
    hoveredElement = element;
    if (hoveredElement) {
      hoveredElement.classList.add('domshot-highlight');
      updateToolbarInfo(hoveredElement);
    }
  }

  function updateToolbarInfo(element) {
    if (!toolbar) return;
    const tagName = element.tagName.toLowerCase();
    const className = element.className && typeof element.className === 'string' 
      ? '.' + element.className.split(' ').filter(c => !c.includes('domshot')).join('.')
      : '';
    const id = element.id ? '#' + element.id : '';
    
    const infoSpan = toolbar.querySelector('.element-info');
    if (infoSpan) {
      infoSpan.innerText = `${tagName}${id}${className.length > 20 ? className.substring(0, 20) + '...' : className}`;
    }
  }

  function onKeyDown(e) {
    if (!isSelecting) return;

    if (e.key === 'Escape') {
      stopSelection();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (hoveredElement && hoveredElement.parentElement && hoveredElement.parentElement !== document.body) {
        updateHighlight(hoveredElement.parentElement);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      // Try to pick first child
      if (hoveredElement && hoveredElement.firstElementChild) {
        updateHighlight(hoveredElement.firstElementChild);
      }
    }
  }

  function onClick(e) {
    if (!isSelecting) return;
    e.preventDefault();
    e.stopPropagation();
    
    const target = hoveredElement;
    if (target) {
      captureElement(target);
    }
  }

  function createToolbar() {
    if (toolbar) return;
    toolbar = document.createElement('div');
    toolbar.id = 'domshot-toolbar';
    toolbar.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 4px;">
        <span class="status" style="font-size: 12px; color: #666;">鼠标单击目标元素进行截图</span>
        <span class="element-info" style="font-size: 14px; color: #007bff; font-family: monospace; font-weight: bold;">等待选择...</span>
        <div style="font-size: 10px; color: #999; margin-top: 2px;">
          Esc 退出 | ↑ 选父级 | ↓ 选子级
        </div>
      </div>
      <button class="cancel">退出</button>
    `;
    document.body.appendChild(toolbar);
    toolbar.querySelector('.cancel').onclick = (e) => {
      e.stopPropagation();
      stopSelection();
    };
  }

  function removeToolbar() {
    if (toolbar) {
      toolbar.remove();
      toolbar = null;
    }
  }

  async function captureElement(element) {
    const settings = (await chrome.storage.local.get('domshotSettings')).domshotSettings || { format: 'png', pixelRatio: 2, action: 'download' };
    
    // Immediately stop tracking but keep the toolbar
    isSelecting = false;
    document.removeEventListener('mouseover', onMouseOver, true);
    document.removeEventListener('click', onClick, true);
    document.removeEventListener('keydown', onKeyDown, true);
    
    if (hoveredElement) {
      hoveredElement.classList.remove('domshot-highlight');
    }

    if (toolbar) {
      toolbar.querySelector('.status').innerText = '正在生成并处理...';
      toolbar.querySelector('.element-info').innerText = '请稍等';
    }
    
    try {
      const options = {
        pixelRatio: parseFloat(settings.pixelRatio),
        backgroundColor: settings.transparent === 'true' ? null : '#ffffff',
        style: { 'margin': '0' }
      };

      let dataUrl;
      let filename = `domshot-${document.title.substring(0, 20)}-${Date.now()}`;

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

      if (settings.action === 'clipboard' && settings.format !== 'svg') {
        const response = await fetch(dataUrl);
        const blob = await response.blob();
        await navigator.clipboard.write([
          new ClipboardItem({ [blob.type]: blob })
        ]);
        if (toolbar) toolbar.querySelector('.status').innerText = '已成功复制到剪贴板！';
      } else {
        const link = document.createElement('a');
        link.download = filename;
        link.href = dataUrl;
        link.click();
        if (toolbar) toolbar.querySelector('.status').innerText = '保存成功！';
      }
      
      setTimeout(() => stopSelection(), 1500);
    } catch (error) {
      console.error('DomShot capture error:', error);
      if (toolbar) toolbar.querySelector('.status').innerText = '生成失败';
      setTimeout(() => stopSelection(), 3000);
    }
  }

  function startSelection() {
    if (isSelecting) return;
    isSelecting = true;
    createToolbar();
    document.addEventListener('mouseover', onMouseOver, true);
    document.addEventListener('click', onClick, true);
    document.addEventListener('keydown', onKeyDown, true);
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
    document.removeEventListener('keydown', onKeyDown, true);
  }

  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'START_SELECTION') {
      startSelection();
      sendResponse({ status: 'started' });
    }
    return true;
  });
})();
