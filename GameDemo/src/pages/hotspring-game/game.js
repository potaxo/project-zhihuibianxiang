import Physics from '../../libs/physics';

// 游戏常量配置 (全新升级版)
const PLATFORM_WIDTH = 120;
const PLATFORM_HEIGHT = 10;
const PLAYER_WIDTH = 40;
const PLAYER_HEIGHT = 40;

//  速度相关常量
const BASE_SCROLL_SPEED = 1.5;      // 初始滚动速度
const MAX_SCROLL_SPEED = 6.5;         // 滚动速度上限
const ACCELERATION_FACTOR = 0.003;  // 加速度因子：每深入1米，速度增加的值

Page({
  data: {
    depth: 0,              // 当前深度(米)
    progress: 0,           // 进度百分比
    showPopup: false,      // 是否显示知识点
    currentKnowledge: "",   // 当前知识点内容
    isGameOver: false,     // 游戏是否结束
    isGameStarted: false,// 游戏是否已开始
    isGameReady: false, 
    isGameWon: false, // 游戏是否胜利
    showKnowledgePopup: false, //  新增：控制知识弹窗的显示/隐藏
    currentKnowledge: { title: '', content: '' }, // 新增：存放当前要显示的知识
  },

  onLoad() {
    // --- 新增：建立我们的地质知识库 ---
    this.knowledgeBase = {
      'desc_200': {
        title: '第一站：深入千米',
        content: '你已成功下渗200米！这里的断裂带就像一个天然的“电梯井”，为地表水的下渗提供了绝佳的通道。',
        triggered: false,
      },
      'desc_1000': {
        title: '第二站：地心热源',
        content: '到达1000米！你感受到了来自地球深处的热量，这里就是温泉的“天然壁炉”，正在为你加热！',
        triggered: false,
      },
      'asc_2000': { // 对应上升到1000米深度
        title: '第三站：冲破盖层！',
        content: '还差最后2000米！上方的泥岩盖层就像一个巨大的“保温杯盖”，它阻止了热量散失，也为你积蓄了冲向地表的巨大能量！',
        triggered: false,
      },
      'asc_2000': { // 对应上升到2000米深度
        title: '第四站：逆流而上！',
        content: '你被成功加热，现在正沿着“昔格达断裂”这条高速通道，奋力向地表回升！',
        triggered: false,
      }
    };this.knowledgeBase = {
      'd_200': {
        title: '第一站：初探地表',
        content: '你已成功下渗200米！地表丰富的植被和疏松的土壤，为你的旅程提供了源源不断的水源补给。',
        triggered: false,
      },
      'd_1000': {
        title: '第二站：深入断裂带',
        content: '到达1000米！你正穿行在著名的“昔格达断裂带”中，它就像一个天然的“电梯井”，为你打开了通往地心的大门！',
        triggered: false,
      },
      'd_2000': {
        title: '第三站：地心热源！',
        content: '感受这股热浪！在2000米的深处，你被地幔的热量充分加热，就像坐在一个“天然壁炉”边！准备好，向上喷发！',
        triggered: false,
      },
      'a_1000': { // 对应上升到1000米深度
        title: '第四站：最后的屏障！',
        content: '还差最后1000米！上方的泥岩盖层就像一个巨大的“保温杯盖”，它为你积蓄了巨大的能量。冲破它，就是胜利！',
        triggered: false,
      }
    };

    this.gameState = {
      player: null,
      platforms: [],            // 平台数组
      scrollY: 0,            // 画面滚动偏移
      gameRunning: false,
      playerImage: null,
      touchStartX: 0,
      gamePhase: 'descending',
      isPausedForKnowledge: false,

      //  --- 皮肤管理系统 ---
      playerImage: null,          // 这个将作为“当前指针”，指向正在使用的皮肤
      playerImageDefault: null,   // 默认皮肤 (water-drop.png)
      playerImageSweat: null,     // 流汗皮肤 (waterdrop3.png)
      playerImageGasp: null,      // 喘气皮肤 (waterdrop4.png)
      playerImageHelmet: null,    // 安全帽皮肤 (waterdrop2.png)

      //  --- 背景管理系统 ---

      backgroundImage: null, //  新增：为背景图预留一个位置
      backgroundImageMagma: null, //  新增：为“岩浆”背景预留一个位置
      backgroundImageMine: null,
      backgroundImageUpper: null,
    };

    //  新增：用于追踪图片加载进度的计数器
    this.assetsLoadedCount = 0;
    this.totalAssets = 8; // 我们总共需要加载8张图片（玩家和背景）
  },

  onReady() {
    this.initGame();
  },

  // 初始化游戏
  initGame() {
    const windowInfo = wx.getWindowInfo();
    this.pixelRatio = windowInfo.pixelRatio;
    this.screenWidth = windowInfo.screenWidth;
    this.screenHeight = windowInfo.screenHeight;

    const query = wx.createSelectorQuery();
    query.select('#game-canvas').node().exec(res => {
      if (!res[0] || !res[0].node) {
        console.error("无法获取到 canvas 节点");
        return;
      }
      const canvas = res[0].node;
      this.ctx = canvas.getContext('2d');
      this.canvas = canvas;
      
      canvas.width = this.screenWidth * this.pixelRatio;
      canvas.height = this.screenHeight * this.pixelRatio;
      this.ctx.scale(this.pixelRatio, this.pixelRatio);

      const onAssetLoad = () => {
        this.assetsLoadedCount++;
        if (this.assetsLoadedCount === this.totalAssets) {
          this.setData({ isGameReady: true });
          console.log("全部游戏资源加载完毕，可以开始了！");
        }
      };

       // ---  补全所有皮肤的加载逻辑！ ---
      const playerImageDefault = canvas.createImage();
      playerImageDefault.onload = onAssetLoad;
      playerImageDefault.src = '../../assets/images/water-drop.png';
      this.gameState.playerImageDefault = playerImageDefault;

      const playerImageHelmet = canvas.createImage();
      playerImageHelmet.onload = onAssetLoad;
      playerImageHelmet.src = '../../assets/images/waterdrop2.png';
      this.gameState.playerImageHelmet = playerImageHelmet;

      const playerImageSweat = canvas.createImage();
      playerImageSweat.onload = onAssetLoad;
      playerImageSweat.src = '../../assets/images/waterdrop3.png';
      this.gameState.playerImageSweat = playerImageSweat;

      const playerImageGasp = canvas.createImage();
      playerImageGasp.onload = onAssetLoad;
      playerImageGasp.src = '../../assets/images/waterdrop4.png';
      this.gameState.playerImageGasp = playerImageGasp;

      // 加载土壤背景
      const backgroundImage = canvas.createImage();
      backgroundImage.onload = onAssetLoad;
      backgroundImage.src = '../../assets/images/soli.jpg';
      this.gameState.backgroundImage = backgroundImage;
      
      //  关键修正3：添加加载“岩浆”背景的完整逻辑！
      const backgroundImageMagma = canvas.createImage();
      backgroundImageMagma.onload = onAssetLoad;
      backgroundImageMagma.src = '../../assets/images/magma.jpg';
      this.gameState.backgroundImageMagma = backgroundImageMagma;

      //  新增：加载“矿道”背景！
      const backgroundImageMine = canvas.createImage();
      backgroundImageMine.onload = onAssetLoad;
      backgroundImageMine.src = '../../assets/images/mine.jpg';
      this.gameState.backgroundImageMine = backgroundImageMine;

      //  新增：加载最终的“盖层”背景！
      const backgroundImageUpper = canvas.createImage();
      backgroundImageUpper.onload = onAssetLoad;
      backgroundImageUpper.src = '../../assets/images/upper.jpg';
      this.gameState.backgroundImageUpper = backgroundImageUpper;
    });
  },

  // 开始游戏
  startGame() {
    this.setData({ isGameStarted: true });
    this.resetGame();
    this.startGameLoop();
  },

  // 重置游戏状态
  resetGame() {
    this.gameState.player = {
      x: this.screenWidth / 2 - PLAYER_WIDTH / 2,
      y: this.screenHeight / 4,
      vx: 0,
      vy: 0,
      width: PLAYER_WIDTH,
      height: PLAYER_HEIGHT,
    };
    
    this.generateInitialPlatforms();
    //  让小水滴穿回默认服装
    this.gameState.playerImage = this.gameState.playerImageDefault;

    this.generateInitialPlatforms();
    
    this.setData({ 
        depth: 0, 
        progress: 0, 
        isGameOver: false,
        isGameWon: false, //  在这里也要重置胜利状态
    });
    this.gameState.scrollY = 0;
    this.gameState.gameRunning = true;
    this.gameState.gamePhase = 'descending'; //  确保每次重置都回到“下渗”阶段

    //  新增：重置所有知识点的触发状态！
    for (const key in this.knowledgeBase) {
      this.knowledgeBase[key].triggered = false;
    }
  },

  // 生成初始平台
  generateInitialPlatforms() {
    this.gameState.platforms = [];
    for (let i = 0; i < 10; i++) {
        this.generatePlatform(this.screenHeight - i * 100);
    }
    // 确保玩家初始时落在平台上
    this.gameState.platforms.push({
        x: this.screenWidth / 2 - PLAYER_WIDTH / 2,
        y: this.gameState.player.y + PLAYER_HEIGHT,
        width: PLATFORM_WIDTH,
        height: PLATFORM_HEIGHT,
    });
  },

  // 生成单个平台 
  generatePlatform(yPos, type = 'soil') { // 默认类型是 'soil'
    this.gameState.platforms.push({
        x: Math.random() * (this.screenWidth - PLATFORM_WIDTH),
        y: yPos,
        width: PLATFORM_WIDTH,
        height: PLATFORM_HEIGHT,
        type: type, //  新增：为每个平台赋予一个类型！
    });
  },
  // 游戏主循环
  startGameLoop() {
    const loop = () => {
      //  只有在“运行中”且“未暂停”时，才更新游戏！
      if (this.gameState.gameRunning && !this.gameState.isPausedForKnowledge) {
        this.updateGameState();
      }
      //  渲染永远执行，以保证弹窗等UI能正常显示
      this.renderGame();
      
      if (!this.gameState.gameRunning) return;
      this.canvas.requestAnimationFrame(loop);
    };
    this.canvas.requestAnimationFrame(loop);
  }, 

  // 更新游戏状态 
  updateGameState() {
    if (this.gameState.gamePhase === 'descending') {
      this.updateDescendingPhase();
    } else if (this.gameState.gamePhase === 'ascending') {
      this.updateAscendingPhase();
    }
  },

    updateDescendingPhase() {
    const { player, platforms } = this.gameState;

    // --- 1. 动态计算当前速度 ---
    const depth = Math.floor(this.gameState.scrollY / 3);
    // ---  新增：皮肤切换逻辑 ---
    if (depth < 1000) {
      this.gameState.playerImage = this.gameState.playerImageDefault; // 0-1000米，默认形态
    } else {
      this.gameState.playerImage = this.gameState.playerImageHelmet; // 1000-2000米，戴上安全帽！
    }
    let currentScrollSpeed = BASE_SCROLL_SPEED + depth * ACCELERATION_FACTOR;
    currentScrollSpeed = Math.min(currentScrollSpeed, MAX_SCROLL_SPEED);

    // --- 2. 世界滚动 ---
    platforms.forEach(p => { p.y -= currentScrollSpeed; });
    player.y -= currentScrollSpeed;

    // --- 3. 玩家物理 ---
    Physics.updatePlayer(player, platforms, this.screenWidth, this.gameState.gamePhase); //  传达指令！  

    // --- 4. 平台管理 ---
    this.gameState.platforms = this.gameState.platforms.filter(p => p.y < this.screenHeight);
    let lowestPlatformY = -Infinity;
    this.gameState.platforms.forEach(p => { if (p.y > lowestPlatformY) { lowestPlatformY = p.y; } });
    if (lowestPlatformY < this.screenHeight) {
        const type = depth < 1000 ? 'soil' : 'magma'; //  根据深度决定类型！
        this.generatePlatform(lowestPlatformY + 120 + Math.random() * (currentScrollSpeed * 15), type);
    } 
    
    // --- 5. 更新数据与“阶段切换”判断 ---
    this.gameState.scrollY += currentScrollSpeed;
    
    //  关键改动：当深度达到2000米，切换到“上升”阶段！
    if (depth >= 2000) {
      this.switchToAscendingPhase(); //  调用新的切换函数
      return;
    }
    
    const progress = (depth / 2000) * 100;
    this.setData({ depth, progress });

   // ** 全新的知识点触发逻辑 **
    if (depth >= 200) this.triggerKnowledgePopup('d_200');
    if (depth >= 1000) this.triggerKnowledgePopup('d_1000');
    if (depth >= 1995) {
      // 先触发知识点，等玩家确认后再切换阶段
      if (!this.knowledgeBase['d_2000'].triggered) {
        this.triggerKnowledgePopup('d_2000');
      } else {
        this.switchToAscendingPhase();
      }
      return; // 在2000米处，要么弹窗，要么切换，都需要暂停当前帧的后续逻辑
    }

    if (player.y > this.screenHeight || player.y < -PLAYER_HEIGHT) {
        this.gameOver();
    }
  },

   switchToAscendingPhase() {
    console.log("到达地心！切换到上升模式！");
    this.gameState.gamePhase = 'ascending';
    this.gameState.platforms = []; // 清空所有旧平台

    // 在玩家下方创建一个初始平台，给他一个起点
    this.generatePlatform(this.screenHeight - 50);

    //  给玩家一个巨大的初始向上动力，模拟“被加热后喷发”！
    this.gameState.player.vy = -15; 
  },

  // 上升阶段的逻辑
  updateAscendingPhase() {
    const { player, platforms } = this.gameState;

    // --- 1. 物理引擎更新 (仍然有效，重力会把玩家往下拉) ---
    Physics.updatePlayer(player, platforms, this.screenWidth, this.gameState.gamePhase); //  传达指令！ 

    // --- 2. 镜头跟随与世界滚动 ---
    // 当玩家跳到屏幕上半部分时，让整个世界向下滚动，来保持玩家在屏幕中
    if (player.y < this.screenHeight / 2) {
      const scrollOffset = this.screenHeight / 2 - player.y;
      player.y += scrollOffset;
      platforms.forEach(p => { p.y += scrollOffset; });
      this.gameState.scrollY += scrollOffset; // 用 scrollY 来记录上升的距离
    }

    // --- 3. 平台管理 (逻辑反转) ---
    // 移除掉到屏幕下方的平台
    this.gameState.platforms = this.gameState.platforms.filter(p => p.y < this.screenHeight + 50);

    // 在屏幕最上方生成新的平台
    let highestPlatformY = this.screenHeight;
    platforms.forEach(p => { if (p.y < highestPlatformY) { highestPlatformY = p.y; } });
    
    if (highestPlatformY > -50) {
      const type = currentDepth > 1000 ? 'mine' : 'upper'; //  根据深度决定类型！
      this.generatePlatform(highestPlatformY - (100 + Math.random() * 80), type);
    }
    // --- 4. 更新数据与“最终胜利”判断 ---
    const ascentHeight = this.gameState.scrollY - (2000 * 3); // 减去第一阶段的滚动量
    const currentDepth = 2000 - Math.floor(ascentHeight / 3);

  // ** 修正后的知识点触发逻辑 **
    if (currentDepth <= 1000) this.triggerKnowledgePopup('a_1000'); 


    // ---  新增：皮肤切换逻辑 ---
    if (currentDepth > 1000) {
      this.gameState.playerImage = this.gameState.playerImageSweat; // 2000-1000米，紧张流汗！
    } else {
      this.gameState.playerImage = this.gameState.playerImageGasp; // 1000-0米，奋力喘气！
    }
    
    //  最终胜利！
    if (currentDepth <= 0) {
      this.setData({ depth: 0, progress: 100 });
      this.gameWon(); //  调用我们早已写好的胜利函数！
      return;
    }

    const progress = ( (2000 - currentDepth) / 2000) * 100;
    this.setData({ depth: Math.max(0, currentDepth), progress });

    // 在上升阶段，只有掉出屏幕底部才会失败
    if (player.y > this.screenHeight) {
      this.gameOver();
    }
  },


  // 渲染游戏 
  renderGame() {
    const ctx = this.ctx;
    const { player, platforms, backgroundImage, backgroundImageMagma, backgroundImageMine, backgroundImageUpper, scrollY, gamePhase } = this.gameState;

    ctx.clearRect(0, 0, this.screenWidth, this.screenHeight);
    
    // --- 1. 绘制拥有完整逻辑的动态背景 ---
    let currentBg = null;
    let sy = 0;

    const getSHeight = (img) => {
        const zoomFactor = 1.5;
        const sWidthValue = img.width / zoomFactor;
        return sWidthValue * (this.screenHeight / this.screenWidth);
    };

    if (gamePhase === 'descending') {
      const depth = Math.floor(scrollY / 3);
      if (depth < 1000) {
        currentBg = backgroundImage;
        sy = scrollY * 0.2;
      } else {
        currentBg = backgroundImageMagma;
        const relativeScrollY = scrollY - (1000 * 3);
        sy = relativeScrollY * 0.15;
      }
    } else if (gamePhase === 'ascending') {
      const ascentScrollY = scrollY - (2000 * 3);
      const currentDepthAscending = 2000 - Math.floor(ascentScrollY / 3);

      if (currentDepthAscending > 1000) {
        currentBg = backgroundImageMine;
        if (currentBg && currentBg.height > 0) {
          const sHeightValue = getSHeight(currentBg);
          const scrollableHeight = currentBg.height - sHeightValue;
          const phaseProgress = (2000 - currentDepthAscending) / 1000.0;
          sy = scrollableHeight * (1 - phaseProgress);
        }
      } else {
        currentBg = backgroundImageUpper;
        if (currentBg && currentBg.height > 0) {
          const sHeightValue = getSHeight(currentBg);
          const scrollableHeight = currentBg.height - sHeightValue;
          const phaseProgress = (1000 - currentDepthAscending) / 1000.0;
          sy = scrollableHeight * (1 - phaseProgress);
        }
      }
    }

    if (currentBg && currentBg.width > 0) {
      const zoomFactor = 1.5;
      const sWidthValue = currentBg.width / zoomFactor;
      const sHeightValue = getSHeight(currentBg);
      const sx = (currentBg.width - sWidthValue) / 2;
      ctx.drawImage(currentBg, sx, sy, sWidthValue, sHeightValue, 0, 0, this.screenWidth, this.screenHeight);
    } else {
      ctx.fillStyle = 'black';
      ctx.fillRect(0, 0, this.screenWidth, this.screenHeight);
    }

    // --- 2. 绘制拥有高级样式的平台 (已移除多余的白色方块覆盖代码) ---
    platforms.forEach(p => {
      if (p.type === 'soil') {
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(p.x, p.y, p.width, p.height);
        ctx.strokeStyle = '#D2B48C';
        ctx.lineWidth = 1;
        ctx.strokeRect(p.x, p.y, p.width, p.height);
      } else if (p.type === 'magma') {
        const gradient = ctx.createLinearGradient(p.x, p.y, p.x + p.width, p.y);
        gradient.addColorStop(0, '#FFA500');
        gradient.addColorStop(0.5, '#FF4500');
        gradient.addColorStop(1, '#FFA500');
        ctx.fillStyle = gradient;
        ctx.fillRect(p.x, p.y, p.width, p.height);
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(p.x + p.width * 0.2, p.y);
        ctx.lineTo(p.x + p.width * 0.8, p.y + p.height);
        ctx.stroke();
      } else if (p.type === 'mine') {
        ctx.fillStyle = '#A9A9A9';
        ctx.fillRect(p.x, p.y, p.width, p.height);
        ctx.fillStyle = '#D3D3D3';
        ctx.fillRect(p.x + 2, p.y + 2, 5, 5);
        ctx.fillRect(p.x + p.width - 7, p.y + 2, 5, 5);
      } else if (p.type === 'upper') {
        ctx.fillStyle = '#778899';
        ctx.fillRect(p.x, p.y, p.width, p.height);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.fillRect(p.x, p.y, p.width, p.height / 3);
      } else {
        ctx.fillStyle = 'white';
        ctx.fillRect(p.x, p.y, p.width, p.height);
      }
    });

    // --- 3. 绘制玩家 ---
    if (this.gameState.playerImage) {
        ctx.drawImage(this.gameState.playerImage, player.x, player.y, PLAYER_WIDTH, PLAYER_HEIGHT);
    }
  },
 

  gameWon() {
    this.gameState.gameRunning = false;
    this.setData({ isGameWon: true });
  },

  gameOver() {
    this.gameState.gameRunning = false;
    this.setData({ isGameOver: true });
  },

  restartGame() {
    this.setData({ 
        isGameOver: false, 
        isGameStarted: false, 
        isGameWon: false //  在这里也要重置胜利状态
    });
  },
  
  // 触控事件处理
  onTouchStart(e) {
    this.gameState.touchStartX = e.touches[0].clientX;
  },
  
  onTouchMove(e) {
    const deltaX = e.touches[0].clientX - this.gameState.touchStartX;
    this.gameState.player.vx = deltaX * 1.4;
    this.gameState.touchStartX = e.touches[0].clientX;
  },
  
  onTouchEnd() {
      this.gameState.player.vx = 0;
  },

  triggerKnowledgePopup(key) {
    if (!this.knowledgeBase[key].triggered) {
      this.gameState.isPausedForKnowledge = true; // 暂停游戏！
      this.knowledgeBase[key].triggered = true; // 标记为已触发
      this.setData({
        showKnowledgePopup: true, // 显示弹窗！
        currentKnowledge: this.knowledgeBase[key],
      });
    }
  },

  resumeGame() {
    this.setData({ showKnowledgePopup: false }); // 隐藏弹窗
    //  给一个小小的延迟，防止玩家误触导致游戏瞬间开始
    setTimeout(() => {
      this.gameState.isPausedForKnowledge = false; // 恢复游戏！
    }, 200);
  },
});
