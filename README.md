# 伸手接福气 (AI Hand Catch) 🧧

一个基于 AI 视觉识别的网页手势交互游戏。通过摄像头实时捕捉手部动作，在屏幕上“接住”掉落的福气礼物！

![版本](https://img.shields.io/badge/Version-1.0.0-red)
![技术](https://img.shields.io/badge/Tech-MediaPipe%20|%20JS%20|%20CSS3-gold)

## ✨ 项目特色

- **AI 视觉交互**：利用 MediaPipe Hands 引擎，实现毫秒级的手部关键点追踪，无需额外外设，只需一个摄像头。
- **极致视觉表现**：
  - **15层叠加渲染**：解决了浏览器渲染 Emoji 时的半透明顽疾，礼物色彩饱满、实心。
  - **捕获反馈**：接住礼物时具备“放大 + 闪光 + 渐隐”的动态回馈效果。
  - **玻璃拟态 UI**：采用现代 Glassmorphism 设计风格，界面优雅灵动。
- **高度定制化**：
  - **福气盒配置**：内置 Emoji 选择器，玩家可自由定义掉落的元素。
  - **艺术字体**：支持 4 种风格各异的艺术字体实时切换。
  - **本地 BGM**：支持玩家上传本地音频作为游戏背景音乐。
- **净化模式**：内置自动化脚本，自动清理宿主环境注入的调试按钮，提供沉浸式游戏体验。

## 🎮 如何开始

1. **直接运行**：克隆仓库后，使用现代浏览器（Chrome/Edge/Safari）直接打开 `gesture_control.html`。
2. **授权摄像头**：首次进入游戏需允许浏览器访问摄像头，以便 AI 引擎进行手部追踪。
3. **设置中心**：点击左下角 ⚙️ 按钮，可以调整时长、模式（普通/无尽）、字体及自定义礼物内容。
4. **开始接福**：点击“开启福运”，挥动双手接住掉落的红包、礼盒吧！

## 🛠️ 技术栈

- **Core**: HTML5, CSS3, JavaScript (ES6+)
- **AI Engine**: [Google MediaPipe Hands](https://google.github.io/mediapipe/solutions/hands.html)
- **Typography**: Google Fonts (ZCOOL KuaiLe, Outfit, etc.)
- **Icons**: Emoji & System Fonts

## 📂 文件结构

- `gesture_control.html`: 游戏主页面结构
- `gesture_control.css`: 样式设计与交互动画逻辑
- `gesture_control.js`: 核心游戏引擎、AI 初始化及物理碰撞逻辑

## 🚀 部署建议

本项目为纯前端应用，非常适合使用 **GitHub Pages** 进行一键部署：
1. 在 GitHub 仓库设置中找到 `Pages`。
2. 选择 `main` 分支根目录并保存。
3. 即可通过 `https://<your-username>.github.io/<repo-name>/` 在线访问。

---
祝您福气盈门，接福愉快！🧧
