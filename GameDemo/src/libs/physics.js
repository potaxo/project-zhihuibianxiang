// src/libs/physics.js (升级版！)

const Physics = {
  GRAVITY: 0.2,
   // 定义两种弹跳模式！
  DESCENDING_JUMP_VELOCITY: -4, // 下落阶段的普通弹跳
  ASCENDING_JUMP_VELOCITY: -14,  // 上升阶段的超级弹跳！(绝对值更大，跳得更高) 

  updatePlayer(player, platforms, screenWidth, gamePhase) {
    // 应用重力
    player.vy += this.GRAVITY;
    
    // --- 升级点 1: 在更新位置前，记住“上一帧”的垂直位置 ---
    const previousY = player.y;

    // 更新位置
    player.x += player.vx;
    player.y += player.vy;
    
    // 左右边界检测
    if (player.x < 0) {
        player.x = 0;
        player.vx = 0;
    }
    if (player.x + player.width > screenWidth) {
        player.x = screenWidth - player.width;
        player.vx = 0;
    }

    // --- 使用全新的“连续碰撞检测”逻辑 ---
    if (player.vy > 0) { // 只在下落时检测
        platforms.forEach(p => {
            if (
                player.x < p.x + p.width &&
                player.x + player.width > p.x
            ) {
                if (
                    previousY + player.height <= p.y &&
                    player.y + player.height > p.y
                ) {
                    //  根据指令，决定使用哪种弹跳力！
                    if (gamePhase === 'ascending') {
                        player.vy = this.ASCENDING_JUMP_VELOCITY;
                    } else {
                        player.vy = this.DESCENDING_JUMP_VELOCITY;
                    }
                    player.y = p.y - player.height;
                }
            }
        });
    }
  }
};

export default Physics;