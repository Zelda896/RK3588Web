# 传感器数据监控网页

一个简单、大方、好看的传感器数据展示网页，实时显示温度、湿度、光感和PWM数据。

## 🌐 在线演示

访问地址：[https://你的用户名.github.io/sensor-monitor/](https://你的用户名.github.io/sensor-monitor/)

> 注意：请将上面的"你的用户名"替换为您的实际GitHub用户名

## 功能特点

- **实时数据展示**: 自动更新传感器数据
- **MQTT连接**: 支持阿里云IoT平台数据下行
- **历史数据图表**: 点击卡片显示折线图，支持多时间范围
- **响应式设计**: 适配桌面和移动设备
- **现代化界面**: 卡片式2×2网格布局，渐变背景
- **数据可视化**: 进度条显示数据范围，Chart.js折线图
- **交互功能**: 悬停效果、数值变化动画、模态框图表
- **双模式运行**: 支持模拟数据和真实MQTT数据切换
- **数据统计**: 实时统计最值、平均值等信息

## 文件结构

```
webn/
├── index.html      # 主页面
├── style.css       # 样式文件
├── script.js       # 主要JavaScript逻辑
├── config.js       # 阿里云三元组配置文件
├── mqtt-client.js  # MQTT客户端封装
├── data-history.js # 历史数据管理
├── chart-modal.js  # 图表模态框组件
└── README.md       # 说明文档
```

## 使用方法

### 基础使用（模拟数据）
1. 直接在浏览器中打开 `index.html` 文件
2. 页面会自动开始显示模拟的传感器数据
3. 数据每10秒自动更新一次
4. 按空格键可手动刷新数据
5. **点击任意传感器卡片查看历史数据图表**

### 图表功能使用
1. **查看图表**: 点击任意传感器卡片（温度、湿度、光感、PWM）
2. **时间范围选择**: 在图表窗口右上角选择时间范围
   - **1分钟**：显示最近1分钟的数据点（高密度，每10秒一个点）
   - **10分钟**：显示最近10分钟的数据点（中密度，包含1分钟的数据）
   - **1小时**：显示最近1小时的数据点（低密度，包含10分钟的数据）
   - **24小时**：显示最近24小时的数据点（最低密度，包含1小时的数据）
3. **数据层次**: 短时间范围是长时间范围的子集，数据点密度递减
4. **自动刷新**: 图表每10秒自动更新一次
5. **统计信息**: 图表下方显示数据点数、最新值、平均值、最小值、最大值
6. **关闭图表**: 点击右上角×按钮或按ESC键或点击背景区域

### 连接阿里云IoT平台（真实数据）
1. **配置三元组参数**：
   - 打开 `config.js` 文件
   - 将 `YOUR_PRODUCT_KEY`、`YOUR_DEVICE_NAME`、`YOUR_DEVICE_SECRET` 替换为您的阿里云IoT设备三元组
   - 根据需要修改 `REGION_ID`（默认：cn-shanghai）

2. **连接设备**：
   - 刷新页面
   - 点击底部的"连接阿里云"按钮
   - 连接成功后会自动切换到真实数据模式

3. **数据格式**：
   - 系统会自动订阅属性设置主题接收下行数据
   - JSON格式示例（使用阿里云标准标识符）：
   ```json
   {
     "params": {
       "temperature": 25.6,    // 温度
       "Humidity": 65.2,       // 湿度
       "LightLux": 750,        // 光照值
       "pwm": 85               // PWM占空比
     }
   }
   ```

## 数据说明

### 传感器数据范围
- **温度**: 显示范围 0-50°C，当前模拟范围 15-35°C
- **湿度**: 显示范围 0-100%，当前模拟范围 40-80%
- **光感**: 显示范围 0-1000lux，当前模拟范围 200-1000lux
- **PWM**: 显示范围 0-100%，当前模拟范围 0-100%

### 阿里云数据标识符映射
| 显示名称 | 阿里云标识符 | 数据类型 | 说明 |
|---------|-------------|---------|------|
| 温度 | `temperature` | Number | 环境温度值(°C) |
| 湿度 | `Humidity` | Number | 环境湿度百分比(%) |
| 光感 | `LightLux` | Number | 光照强度值(lux) |
| PWM占空比 | `pwm` | Number | PWM输出占空比(%) |

## 自定义配置

在 `script.js` 文件中的 `CONFIG` 对象可以调整：
- `UPDATE_INTERVAL`: 数据更新间隔（毫秒，当前为10000ms即10秒）
- 各传感器的最小值和最大值范围

## MQTT主题说明

系统使用以下阿里云IoT标准主题：

- **属性设置主题（下行）**: `/sys/${productKey}/${deviceName}/thing/service/property/set`
  - 用于接收云端下发的传感器数据
  - 自动订阅，无需手动配置

- **属性上报主题（上行）**: `/sys/${productKey}/${deviceName}/thing/event/property/post`
  - 预留用于设备上报数据（当前版本未使用）

## 故障排除

1. **连接失败**：
   - 检查三元组参数是否正确
   - 确认设备在阿里云IoT控制台中状态正常
   - 检查网络连接和防火墙设置

2. **数据不更新**：
   - 确认设备端正在发送数据到正确的主题
   - 检查JSON数据格式是否符合要求
   - 查看浏览器控制台错误信息

3. **SDK加载失败**：
   - 检查网络连接
   - 尝试刷新页面重新加载SDK

## 浏览器兼容性

支持所有现代浏览器：
- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## 技术栈

- HTML5
- CSS3 (Grid, Flexbox, 渐变, 动画)
- 原生JavaScript (ES6+)
- Chart.js (图表库)
- 阿里云IoT Device SDK
- MQTT over WebSocket
- 响应式设计

## 开发说明

- **config.js**: 三元组配置，使用宏定义方式便于修改
- **mqtt-client.js**: MQTT客户端封装，处理连接、订阅、消息解析
- **data-history.js**: 历史数据管理，自动清理过期数据，支持统计分析
- **chart-modal.js**: 图表模态框组件，基于Chart.js实现交互式折线图
- **script.js**: 主逻辑，集成模拟数据和真实数据双模式
- 支持自动重连和错误处理
- 代码采用ES6类结构，便于维护和扩展
- 数据每10秒自动更新，图表同步刷新
- 自动数据清理机制，避免内存溢出
- 模拟数据变化幅度优化，便于观察趋势
