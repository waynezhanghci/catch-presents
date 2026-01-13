/**
 * AI Hand Catch Game - Robust Implementation
 */

// 1. 核心状态与配置
const CONFIG = {
    ITEM_SPAWN_RATE: 0.038,
    COMBO_TIMEOUT: 1200,
    ACCEL_INTERVAL: 30,
    HIT_RADIUS_MULT: 0.72,
    FONTS: { KUAILE: "'ZCOOL KuaiLe', sans-serif" }
};

const STATE = {
    mode: 'START',
    score: 0,
    timer: 30,
    elapsed: 0,
    isEndless: false,
    combo: 0,
    lastCatch: 0,
    items: [],
    effects: [],
    handData: null,
    emojis: ['🧧', '💰', '🎁', '🏮', '🍊'],
    currentFont: CONFIG.FONTS.KUAILE
};

// 2. DOM 映射
const DOM = {
    app: document.getElementById('app'),
    video: document.getElementById('input-video'),
    canvas: document.getElementById('output-canvas'),
    ctx: document.getElementById('output-canvas').getContext('2d'),
    score: document.getElementById('score-value'),
    timer: document.getElementById('timer-value'),
    timerLabel: document.getElementById('timer-label'),
    comboTag: document.getElementById('combo-tag'),
    comboCount: document.getElementById('combo-count'),
    overlay: document.getElementById('game-overlay'),
    startScreen: document.getElementById('start-screen'),
    endScreen: document.getElementById('end-screen'),
    loading: document.getElementById('loading-overlay'),
    finalScore: document.getElementById('final-score'),
    settingsTrigger: document.getElementById('settings-trigger'),
    panel: document.getElementById('control-panel'),
    closePanel: document.getElementById('close-panel'),
    fontSelect: document.getElementById('font-select'),
    bgmUpload: document.getElementById('bgm-upload'),
    bgmPlayer: document.getElementById('game-bgm'),
    emojiPicker: document.getElementById('emoji-picker'),
    closeEmoji: document.getElementById('close-picker'),
    emojiGrid: document.querySelector('.emoji-grid'),
    startBtn: document.getElementById('start-btn'),
    restartBtn: document.getElementById('restart-btn'),
    durationInput: document.getElementById('duration-input'),
    endlessMode: document.getElementById('endless-mode'),
    giftGrid: document.getElementById('gift-box-container')
};

// 3. 终极净化：Shadow DOM 递归切除
function sanitizeInjections() {
    const targets = ['error', 'send', 'debug', 'issue'];
    const recurseAndKill = (root) => {
        if (!root) return;
        const nodes = root.querySelectorAll ? root.querySelectorAll('*') : [];
        nodes.forEach(node => {
            if (node === DOM.app || (DOM.app && DOM.app.contains(node))) return;
            const text = (node.innerText || node.textContent || "").toLowerCase();
            const hasTarget = targets.some(t => text.includes(t));
            const rect = node.getBoundingClientRect();
            const isInZone = rect.bottom > window.innerHeight - 100 && rect.right > window.innerWidth - 200;
            if (hasTarget || (isInZone && node.tagName === 'BUTTON')) {
                node.remove();
            }
            if (node.shadowRoot) recurseAndKill(node.shadowRoot);
        });
    };
    recurseAndKill(document.documentElement);
}
setInterval(sanitizeInjections, 100);

// 4. AI 视觉引擎初始化
let hands, camera;
async function initAI() {
    const forceHide = setTimeout(() => {
        console.warn("AI Boot slow, bypass loading...");
        hideLoading();
    }, 4000);

    try {
        if (typeof Hands !== 'undefined') {
            hands = new Hands({ locateFile: (f) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${f}` });
            hands.setOptions({ maxNumHands: 2, modelComplexity: 1, minDetectionConfidence: 0.7, minTrackingConfidence: 0.7 });
            hands.onResults((res) => { STATE.handData = res.multiHandLandmarks; });

            if (typeof Camera !== 'undefined') {
                camera = new Camera(DOM.video, {
                    onFrame: async () => { if (hands) await hands.send({ image: DOM.video }); },
                    width: 1280, height: 720
                });
                await camera.start().catch(e => console.error("Camera fail", e));
            }
        }
    } catch (e) {
        console.error("AI engine error:", e);
    } finally {
        clearTimeout(forceHide);
        hideLoading();
    }
}

function hideLoading() {
    if (DOM.loading) {
        DOM.loading.style.opacity = '0';
        setTimeout(() => DOM.loading.classList.add('hidden'), 500);
    }
}

// 5. 游戏物理逻辑
class FallingItem {
    constructor(w) {
        this.emoji = STATE.emojis[Math.floor(Math.random() * STATE.emojis.length)];
        this.size = 60 + Math.random() * 30;
        this.x = Math.random() * (w - this.size * 2) + this.size;
        this.y = -this.size;
        const accel = STATE.isEndless ? (1 + Math.floor(STATE.elapsed / 30) * 0.4) : 1;
        this.speed = (5 + Math.random() * 4) * accel;
        this.rotation = Math.random() * Math.PI * 2;
        this.rotSpeed = (Math.random() - 0.5) * 0.12;
        this.isCaught = false; 
        this.catchTime = 0;
    }
    update(h) { 
        if (this.isCaught) {
            this.catchTime += 16; 
            return this.catchTime > 300; 
        }
        this.y += this.speed; 
        this.rotation += this.rotSpeed; 
        return this.y > h + 100; 
    }
    draw(ctx) {
        if (!ctx) return;
        ctx.save();
        
        let displaySize = this.size;
        let opacity = 1.0;
        
        if (this.isCaught) {
            const progress = Math.min(this.catchTime / 300, 1);
            displaySize = this.size * (1 + progress * 0.2); // 放大 20%
            opacity = 1 - progress; // 逐渐消失
            ctx.filter = `brightness(${1 + (1 - progress) * 3}) blur(${progress * 2}px)`; // 闪光 + 模糊
            ctx.shadowBlur = 40 * (1 - progress);
            ctx.shadowColor = '#fff';
        } else {
            ctx.globalAlpha = 1.0;
            ctx.globalCompositeOperation = 'source-over';
            ctx.shadowBlur = 0;
            ctx.filter = 'none';
        }
        
        ctx.globalAlpha = opacity;
        ctx.translate(this.x, this.y); 
        ctx.rotate(this.rotation);
        
        ctx.textAlign = 'center'; 
        ctx.textBaseline = 'middle';
        ctx.font = `bold ${displaySize}px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif`;
        
        for(let i = 0; i < 15; i++) {
            ctx.fillText(this.emoji, 0, 0);
        }
        
        ctx.restore();
    }
}

function startGame() {
    STATE.mode = 'PLAYING';
    STATE.score = 0; STATE.elapsed = 0; STATE.combo = 0;
    STATE.items = []; STATE.isEndless = DOM.endlessMode.checked;
    
    if (STATE.isEndless) {
        STATE.timer = 0; DOM.timer.textContent = 'Forever'; DOM.timerLabel.textContent = '接福状态';
    } else {
        STATE.timer = parseInt(DOM.durationInput.value) || 30;
        DOM.timer.textContent = STATE.timer + 's'; DOM.timerLabel.textContent = '剩余时间';
    }

    DOM.score.textContent = '0';
    DOM.overlay.classList.add('hidden');
    DOM.settingsTrigger.classList.add('hidden');

    const ticker = setInterval(() => {
        if (STATE.mode !== 'PLAYING') { clearInterval(ticker); return; }
        STATE.elapsed++;
        if (STATE.isEndless) {
            STATE.timer++;
            if (STATE.timer % 30 === 0) showNotice('加速！⚡');
        } else {
            STATE.timer--;
            DOM.timer.textContent = STATE.timer + 's';
            if (STATE.timer <= 0) { clearInterval(ticker); endGame(); }
        }
    }, 1000);

    requestAnimationFrame(gameLoop);
}

function endGame() {
    STATE.mode = 'END';
    DOM.finalScore.textContent = STATE.score;
    DOM.overlay.classList.remove('hidden');
    DOM.endScreen.classList.remove('hidden');
    DOM.startScreen.classList.add('hidden');
    DOM.settingsTrigger.classList.remove('hidden');
}

function gameLoop() {
    if (STATE.mode !== 'PLAYING') return;
    if (DOM.canvas.width !== window.innerWidth) {
        DOM.canvas.width = window.innerWidth; DOM.canvas.height = window.innerHeight;
    }
    
    // 1. 清理画布并设置基础状态
    DOM.ctx.clearRect(0, 0, DOM.canvas.width, DOM.canvas.height);
    DOM.ctx.globalAlpha = 1.0;
    DOM.ctx.globalCompositeOperation = 'source-over';

    // 2. 生成新物品
    if (Math.random() < CONFIG.ITEM_SPAWN_RATE) STATE.items.push(new FallingItem(DOM.canvas.width));

    // 3. 先绘制手部数据（作为背景层）
    if (STATE.handData) {
        DOM.ctx.save();
        DOM.ctx.globalAlpha = 0.6;
        DOM.ctx.fillStyle = '#ffcf33';
        STATE.handData.forEach(hand => {
            hand.forEach(point => {
                DOM.ctx.beginPath();
                DOM.ctx.arc((1 - point.x) * DOM.canvas.width, point.y * DOM.canvas.height, 5, 0, Math.PI * 2);
                DOM.ctx.fill();
            });
        });
        DOM.ctx.restore();
    }

    // 4. 更新并绘制物品（作为顶层，确保不透明）
    for (let i = STATE.items.length - 1; i >= 0; i--) {
        const item = STATE.items[i];
        if (item.update(DOM.canvas.height)) { 
            STATE.items.splice(i, 1); 
            continue; 
        }

        // 绘制礼物
        item.draw(DOM.ctx);

        // 碰撞检测（仅对未接住的物品）
        if (STATE.handData && !item.isCaught) {
            for (const hand of STATE.handData) {
                const joints = [hand[8], hand[4], hand[12], hand[0], hand[9], hand[16], hand[20]]; 
                const hit = joints.some(j => {
                    const jx = (1 - j.x) * DOM.canvas.width;
                    const jy = j.y * DOM.canvas.height;
                    return Math.hypot(jx - item.x, jy - item.y) < item.size * 0.8;
                });
                if (hit) { 
                    handleCatch(item); 
                    item.isCaught = true; // 标记为接住，触发动画，不再立即 splice
                    item.catchTime = 0;
                    break; 
                }
            }
        }
    }

    requestAnimationFrame(gameLoop);
}

function handleCatch(item) {
    const now = Date.now();
    STATE.combo = (now - STATE.lastCatch < 1200) ? STATE.combo + 1 : 1;
    STATE.lastCatch = now;
    STATE.score += Math.round(20 * (1 + Math.floor(STATE.combo / 5) * 0.5));
    DOM.score.textContent = STATE.score;
    DOM.score.classList.remove('score-pop');
    void DOM.score.offsetWidth;
    DOM.score.classList.add('score-pop');
    if (STATE.combo >= 3) {
        DOM.comboCount.textContent = STATE.combo; DOM.comboTag.classList.remove('hidden');
        clearTimeout(window.comboTimer);
        window.comboTimer = setTimeout(() => DOM.comboTag.classList.add('hidden'), 1200);
    }
}

function showNotice(t) {
    const n = document.createElement('div'); n.className = 'speed-up-notice'; n.textContent = t;
    document.body.appendChild(n); setTimeout(() => n.remove(), 1200);
}

function renderGiftConfig() {
    if (!DOM.giftGrid) return;
    DOM.giftGrid.innerHTML = '';
    STATE.emojis.forEach((e, i) => {
        const div = document.createElement('div'); div.className = 'gift-item'; div.textContent = e;
        const del = document.createElement('div'); del.className = 'remove-btn'; del.textContent = '×';
        del.onclick = (ev) => { ev.stopPropagation(); if (STATE.emojis.length > 1) { STATE.emojis.splice(i, 1); renderGiftConfig(); } };
        div.appendChild(del); DOM.giftGrid.appendChild(div);
    });
    if (STATE.emojis.length < 10) {
        const addBtn = document.createElement('div');
        addBtn.className = 'gift-item add-item';
        addBtn.textContent = '+';
        addBtn.onclick = () => DOM.emojiPicker && DOM.emojiPicker.classList.remove('hidden');
        DOM.giftGrid.appendChild(addBtn);
    }
}

// 6. 初始化
function init() {
    // 拦截层
    const interceptor = document.createElement('div');
    interceptor.id = 'click-interceptor';
    document.body.appendChild(interceptor);

    // 绑定事件
    if (DOM.startBtn) DOM.startBtn.onclick = startGame;
    if (DOM.restartBtn) DOM.restartBtn.onclick = () => {
        DOM.endScreen.classList.add('hidden');
        DOM.startScreen.classList.remove('hidden');
        startGame();
    };

    if (DOM.settingsTrigger) DOM.settingsTrigger.onclick = (e) => { 
        e.stopPropagation(); 
        DOM.panel && DOM.panel.classList.toggle('hidden'); 
    };
    if (DOM.closePanel) DOM.closePanel.onclick = () => DOM.panel && DOM.panel.classList.add('hidden');

    if (DOM.fontSelect) DOM.fontSelect.onchange = (e) => {
        STATE.currentFont = e.target.value;
        document.body.style.fontFamily = STATE.currentFont;
    };

    if (DOM.bgmUpload) DOM.bgmUpload.onchange = (e) => {
        const file = e.target.files[0];
        if (file && DOM.bgmPlayer) {
            const url = URL.createObjectURL(file);
            DOM.bgmPlayer.src = url;
            DOM.bgmPlayer.play().catch(err => console.error("Audio play failed", err));
        }
    };

    if (DOM.endlessMode) DOM.endlessMode.onchange = () => { 
        if (DOM.durationInput) {
            DOM.durationInput.disabled = DOM.endlessMode.checked; 
            DOM.durationInput.style.opacity = DOM.endlessMode.checked ? '0.3' : '1'; 
        }
    };

    if (DOM.emojiGrid) DOM.emojiGrid.onclick = (e) => {
        if (e.target.tagName === 'SPAN' && STATE.emojis.length < 10) {
            STATE.emojis.push(e.target.textContent);
            renderGiftConfig();
            DOM.emojiPicker && DOM.emojiPicker.classList.add('hidden');
        }
    };
    if (DOM.closeEmoji) DOM.closeEmoji.onclick = () => DOM.emojiPicker && DOM.emojiPicker.classList.add('hidden');

    window.onclick = (e) => {
        if (DOM.panel && !DOM.panel.contains(e.target) && e.target !== DOM.settingsTrigger) {
            DOM.panel.classList.add('hidden');
        }
        if (DOM.emojiPicker && !DOM.emojiPicker.contains(e.target) && !e.target.classList.contains('add-item')) {
            DOM.emojiPicker.classList.add('hidden');
        }
    };

    initAI();
    renderGiftConfig();
}

// 确保 DOM 加载后运行
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
