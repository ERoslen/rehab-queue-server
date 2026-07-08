# 康复医学科智能排队系统 - 后端

## 一键部署到 Render（推荐，完全免费）

### 步骤1：注册 Render 账号（2分钟）
- 打开 https://render.com
- 点击 "Get Started for Free"
- 用邮箱注册（不需要信用卡）

### 步骤2：连接 GitHub 并创建服务（5分钟）
1. 登录 Render 后，点击 **"New +"** → **"Web Service"**
2. 选择 **"Build and deploy from a Git repository"**
3. 首次使用需要点击 **"Connect account"** 授权 Render 访问 GitHub
4. 在仓库列表中选择 **ERoslen/rehab-queue-server**
5. 点击 **"Connect"**

### 步骤3：填写配置（1分钟）
| 配置项 | 填写内容 |
|--------|---------|
| Name | `rehab-queue` |
| Region | `Singapore`（亚洲最近） |
| Branch | `main` |
| Runtime | `Node` |
| Build Command | `npm install` |
| Start Command | `node server.js` |
| Plan | **Free** |

点击底部 **"Create Web Service"**

### 步骤4：等待部署完成（3分钟）
- 页面会显示部署进度日志
- 看到 **"Your service is live"** 即成功
- 记录您的网址：`https://rehab-queue-xxxx.onrender.com`

### 步骤5：开始使用
- **患者取号**：打开 https://3loiznxumvgzu.ok.kimi.link 扫码
- **护士工作台**：同一网址，选择"护士工作台"
- 测试取号后，另一台设备打开护士端，确认数据同步

---

## 仓库文件说明

| 文件 | 说明 |
|------|------|
| `server.js` | 主服务器（API + WebSocket） |
| `database.js` | 数据库操作（JSON文件存储） |
| `package.json` | 依赖配置 |
| `render.yaml` | Render部署配置 |
| `dist/index.html` | 前端入口（自动跳转到已部署前端） |

---

## 常见问题

**Q: 免费套餐有什么限制？**
A: 15分钟不活跃会自动休眠，下次访问需等待3-5秒唤醒。不影响使用。

**Q: 数据会丢失吗？**
A: 不会。数据存储在 Render 的文件系统中，服务重启后保留。

**Q: 患者需要连WiFi吗？**
A: 不需要！部署后，患者用自己的手机流量就能访问。

**Q: 如何清空每日数据？**
A: 护士工作台界面有"清空所有排队信息"按钮，中午休息时点击即可。
