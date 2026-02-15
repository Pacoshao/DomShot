# DomShot - 浏览器网页元素截图插件

DomShot 是一个功能强大的浏览器插件，允许用户选择网页中的任意 HTML 元素，并将其直接保存为高质量的图片（PNG/JPEG）或矢量格式（SVG）。

## 功能特点

- **自选元素**：鼠标悬停自动高亮，点击即可锁定元素。
- **矢量导出**：支持导出 SVG 格式，无限放大不失真。
- **超高清截图**：支持 2x、4x 缩放倍数，生成视网膜级别的高清图片。
- **原汁原味**：基于 `html-to-image` 技术，通过 `foreignObject` 将 DOM 渲染为图像，保持原始 HTML/CSS 样式。

## 使用方法

1. **加载插件**：
   - 打开 Chrome 浏览器，访问 `chrome://extensions/`。
   - 开启右上角的“开发者模式”。
   - 点击“加载已解压的扩展程序”，选择 `DomShot` 文件夹。

2. **进行截图**：
   - 在任意网页上点击插件图标。
   - 在弹出菜单中选择导出格式和缩放倍数。
   - 点击“选择网页元素”按钮。
   - 移动鼠标到目标元素上（会有蓝色高亮），点击左键。
   - 等待几秒钟，截图将自动下载。

## 技术栈

- Chrome Extension Manifest V3
- [html-to-image](https://github.com/bubkoo/html-to-image)
- JavaScript (Vanilla JS)

## 注意事项

- 由于安全限制，某些受保护的网页（如 Chrome 商店页面）可能无法运行插件。
- 复杂的 WebGL 元素或某些 iframe 可能无法完全还原。
Creat any shot of any element in html!
