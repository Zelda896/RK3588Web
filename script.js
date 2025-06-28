// 配置参数
const CONFIG = {
    UPDATE_INTERVAL: 10000, // 更新间隔(毫秒) - 改为10秒
    TEMP_MIN: 0,           // 温度最小值
    TEMP_MAX: 50,          // 温度最大值
    HUMIDITY_MIN: 0,       // 湿度最小值
    HUMIDITY_MAX: 100,     // 湿度最大值
    LIGHT_MIN: 0,          // 光感最小值
    LIGHT_MAX: 1000,       // 光感最大值
    PWM_MIN: 0,            // PWM最小值
    PWM_MAX: 100           // PWM最大值
};

// 传感器数据类
class SensorData {
    constructor() {
        this.temperature = 25.6;
        this.humidity = 65.2;
        this.light = 750;
        this.pwm = 85;
    }

    // 模拟数据更新
    updateData() {
        this.temperature = this.generateRandomValue(this.temperature, 15, 35, 1.5); // 增加变化幅度
        this.humidity = this.generateRandomValue(this.humidity, 40, 80, 3);         // 增加变化幅度
        this.light = this.generateRandomValue(this.light, 200, 1000, 50);          // 增加变化幅度
        this.pwm = this.generateRandomValue(this.pwm, 0, 100, 5);                  // 增加变化幅度
    }

    // 生成随机变化值
    generateRandomValue(current, min, max, variance) {
        const change = (Math.random() - 0.5) * variance * 2;
        let newValue = current + change;
        return Math.max(min, Math.min(max, newValue));
    }
}

// 显示控制类
class DisplayController {
    constructor() {
        this.elements = {
            temperature: document.getElementById('temperature'),
            humidity: document.getElementById('humidity'),
            light: document.getElementById('light'),
            pwm: document.getElementById('pwm'),
            tempProgress: document.getElementById('temp-progress'),
            humidityProgress: document.getElementById('humidity-progress'),
            lightProgress: document.getElementById('light-progress'),
            pwmProgress: document.getElementById('pwm-progress'),
            lastUpdate: document.getElementById('last-update')
        };
    }

    // 更新显示
    updateDisplay(data) {
        this.updateValue('temperature', data.temperature, '°C', 1);
        this.updateValue('humidity', data.humidity, '%', 1);
        this.updateValue('light', Math.round(data.light), 'lux', 0);
        this.updateValue('pwm', Math.round(data.pwm), '%', 0);

        this.updateProgress('temp-progress', data.temperature, CONFIG.TEMP_MIN, CONFIG.TEMP_MAX);
        this.updateProgress('humidity-progress', data.humidity, CONFIG.HUMIDITY_MIN, CONFIG.HUMIDITY_MAX);
        this.updateProgress('light-progress', data.light, CONFIG.LIGHT_MIN, CONFIG.LIGHT_MAX);
        this.updateProgress('pwm-progress', data.pwm, CONFIG.PWM_MIN, CONFIG.PWM_MAX);

        this.updateTimestamp();
    }

    // 更新数值显示
    updateValue(type, value, unit, decimals) {
        const element = this.elements[type];
        if (element) {
            element.textContent = value.toFixed(decimals);
            this.animateValue(element);
        }
    }

    // 更新进度条
    updateProgress(progressId, value, min, max) {
        const element = this.elements[progressId];
        if (element) {
            const percentage = ((value - min) / (max - min)) * 100;
            element.style.width = `${Math.max(0, Math.min(100, percentage))}%`;
        }
    }

    // 数值变化动画
    animateValue(element) {
        element.style.transform = 'scale(1.1)';
        element.style.transition = 'transform 0.2s ease';
        setTimeout(() => {
            element.style.transform = 'scale(1)';
        }, 200);
    }

    // 更新时间戳
    updateTimestamp() {
        const now = new Date();
        const timeString = now.toLocaleTimeString('zh-CN');
        this.elements.lastUpdate.textContent = timeString;
    }
}

// 主应用类
class SensorApp {
    constructor() {
        this.sensorData = new SensorData();
        this.displayController = new DisplayController();
        this.dataHistory = new DataHistory();
        this.chartModal = new ChartModal(this.dataHistory);
        this.mqttClient = null;
        this.isRunning = false;
        this.useRealData = false; // 是否使用真实MQTT数据
    }

    // 启动应用
    start() {
        if (this.isRunning) return;

        this.isRunning = true;
        this.displayController.updateDisplay(this.sensorData);

        // 记录初始数据
        this.recordHistoryData();
        console.log('📊 记录初始数据');

        // 添加测试数据以便立即查看图表
        this.addTestData();

        // 初始化MQTT客户端
        this.initMqttClient();

        this.intervalId = setInterval(() => {
            // 如果没有使用真实数据，则使用模拟数据
            if (!this.useRealData) {
                this.sensorData.updateData();
                this.displayController.updateDisplay(this.sensorData);
                console.log('🔄 模拟数据已更新 (10秒间隔)');
            }
            // 记录历史数据
            this.recordHistoryData();
        }, CONFIG.UPDATE_INTERVAL);

        console.log('传感器监控已启动');
    }

    // 停止应用
    stop() {
        if (!this.isRunning) return;

        this.isRunning = false;
        if (this.intervalId) {
            clearInterval(this.intervalId);
        }

        console.log('传感器监控已停止');
    }

    // 手动更新数据
    manualUpdate() {
        if (!this.useRealData) {
            this.sensorData.updateData();
            this.displayController.updateDisplay(this.sensorData);
        }
        // 记录历史数据
        this.recordHistoryData();
    }

    // 记录历史数据
    recordHistoryData() {
        const timestamp = Date.now();
        this.dataHistory.addDataPoint('temperature', this.sensorData.temperature, timestamp);
        this.dataHistory.addDataPoint('humidity', this.sensorData.humidity, timestamp);
        this.dataHistory.addDataPoint('light', this.sensorData.light, timestamp);
        this.dataHistory.addDataPoint('pwm', this.sensorData.pwm, timestamp);
    }

    // 初始化MQTT客户端
    initMqttClient() {
        try {
            // 检查配置是否存在
            if (typeof ALIYUN_CONFIG === 'undefined') {
                console.warn('阿里云配置未找到，使用模拟数据模式');
                return;
            }

            // 检查三元组是否已配置
            if (ALIYUN_CONFIG.PRODUCT_KEY === 'YOUR_PRODUCT_KEY' ||
                ALIYUN_CONFIG.DEVICE_NAME === 'YOUR_DEVICE_NAME' ||
                ALIYUN_CONFIG.DEVICE_SECRET === 'YOUR_DEVICE_SECRET') {
                console.warn('请先配置阿里云三元组参数');
                this.updateMqttStatus('请配置三元组');
                return;
            }

            // 创建MQTT客户端
            this.mqttClient = new AliyunMqttClient(ALIYUN_CONFIG);

            // 设置数据接收回调
            this.mqttClient.setDataReceivedCallback((topic, data) => {
                this.handleMqttData(topic, data);
            });

            // 设置状态变化回调
            this.mqttClient.setStatusChangedCallback((status) => {
                this.updateMqttStatus(status);
            });

            console.log('MQTT客户端初始化完成');
        } catch (error) {
            console.error('MQTT客户端初始化失败:', error);
            this.updateMqttStatus('初始化失败');
        }
    }

    // 处理MQTT数据
    handleMqttData(topic, data) {
        if (topic === 'sensor_data' && data) {
            // 更新传感器数据
            if (data.temperature !== null) this.sensorData.temperature = data.temperature;
            if (data.humidity !== null) this.sensorData.humidity = data.humidity;
            if (data.light !== null) this.sensorData.light = data.light;
            if (data.pwm !== null) this.sensorData.pwm = data.pwm;

            // 更新显示
            this.displayController.updateDisplay(this.sensorData);
            this.useRealData = true;

            // 记录历史数据
            this.recordHistoryData();

            console.log('收到真实传感器数据:', data);
        }
    }

    // 连接MQTT
    async connectMqtt() {
        if (!this.mqttClient) {
            console.warn('MQTT客户端未初始化');
            return false;
        }

        try {
            const success = await this.mqttClient.connect();
            if (success) {
                this.useRealData = true;
                console.log('MQTT连接成功，切换到真实数据模式');
            }
            return success;
        } catch (error) {
            console.error('MQTT连接失败:', error);
            return false;
        }
    }

    // 断开MQTT连接
    disconnectMqtt() {
        if (this.mqttClient) {
            this.mqttClient.disconnect();
            this.useRealData = false;
            console.log('MQTT连接已断开，切换到模拟数据模式');
        }
    }

    // 更新MQTT状态显示
    updateMqttStatus(status) {
        const statusElement = document.getElementById('mqtt-status');
        const connectBtn = document.getElementById('connect-btn');

        if (statusElement) {
            statusElement.textContent = status;
        }

        if (connectBtn) {
            if (status === '已连接') {
                connectBtn.textContent = '断开连接';
                connectBtn.disabled = false;
            } else if (status === '连接中...') {
                connectBtn.textContent = '连接中...';
                connectBtn.disabled = true;
            } else {
                connectBtn.textContent = '连接阿里云';
                connectBtn.disabled = false;
            }
        }
    }

    // 获取连接状态
    getMqttStatus() {
        return this.mqttClient ? this.mqttClient.getConnectionStatus() : null;
    }

    // 显示传感器图表
    showSensorChart(sensorType) {
        this.chartModal.showChart(sensorType);
    }

    // 获取数据历史概览
    getDataOverview() {
        return this.dataHistory.getOverview();
    }

    // 调试函数：添加测试数据
    addTestData() {
        const now = Date.now();

        // 添加24小时的测试数据（每10分钟一个点，共144个点）
        for (let i = 0; i < 144; i++) {
            const timestamp = now - (i * 10 * 60 * 1000); // 每10分钟一个数据点
            this.dataHistory.addDataPoint('temperature', 20 + Math.random() * 15, timestamp);
            this.dataHistory.addDataPoint('humidity', 40 + Math.random() * 40, timestamp);
            this.dataHistory.addDataPoint('light', 300 + Math.random() * 500, timestamp);
            this.dataHistory.addDataPoint('pwm', 30 + Math.random() * 40, timestamp);
        }

        // 添加1小时的密集数据（每1分钟一个点，共60个点）
        for (let i = 0; i < 60; i++) {
            const timestamp = now - (i * 60 * 1000); // 每1分钟一个数据点
            this.dataHistory.addDataPoint('temperature', 22 + Math.random() * 8, timestamp);
            this.dataHistory.addDataPoint('humidity', 50 + Math.random() * 20, timestamp);
            this.dataHistory.addDataPoint('light', 400 + Math.random() * 300, timestamp);
            this.dataHistory.addDataPoint('pwm', 40 + Math.random() * 30, timestamp);
        }

        // 添加10分钟的高密度数据（每10秒一个点，共60个点）
        for (let i = 0; i < 60; i++) {
            const timestamp = now - (i * 10 * 1000); // 每10秒一个数据点
            this.dataHistory.addDataPoint('temperature', 24 + Math.random() * 4, timestamp);
            this.dataHistory.addDataPoint('humidity', 55 + Math.random() * 10, timestamp);
            this.dataHistory.addDataPoint('light', 500 + Math.random() * 200, timestamp);
            this.dataHistory.addDataPoint('pwm', 50 + Math.random() * 20, timestamp);
        }

        console.log('🧪 已添加多层次测试数据（24小时、1小时、10分钟）');
    }
}

// 页面加载完成后启动应用
document.addEventListener('DOMContentLoaded', () => {
    const app = new SensorApp();
    app.start();

    // 连接按钮事件处理
    const connectBtn = document.getElementById('connect-btn');
    if (connectBtn) {
        connectBtn.addEventListener('click', async () => {
            const mqttStatus = app.getMqttStatus();

            if (mqttStatus && mqttStatus.connected) {
                // 如果已连接，则断开
                app.disconnectMqtt();
            } else {
                // 如果未连接，则连接
                await app.connectMqtt();
            }
        });
    }

    // 卡片点击事件处理
    const cards = document.querySelectorAll('.card[data-sensor]');
    console.log('🎯 找到卡片数量:', cards.length);

    cards.forEach(card => {
        card.addEventListener('click', () => {
            const sensorType = card.getAttribute('data-sensor');
            console.log('🖱️ 点击了卡片:', sensorType);
            app.showSensorChart(sensorType);
        });
    });

    // 添加键盘快捷键
    document.addEventListener('keydown', (event) => {
        if (event.key === ' ') { // 空格键手动更新
            event.preventDefault();
            app.manualUpdate();
        }
    });

    // 页面可见性变化时控制更新
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            app.stop();
        } else {
            app.start();
        }
    });

    // 全局暴露app实例，方便调试
    window.sensorApp = app;

    // 全局调试函数
    window.debugChart = function(sensorType = 'temperature') {
        console.log('🔧 调试图表功能');
        console.log('Chart.js状态:', typeof Chart !== 'undefined' ? '✅ 已加载' : '❌ 未加载');
        console.log('数据历史状态:', app.dataHistory ? '✅ 已初始化' : '❌ 未初始化');

        if (app.dataHistory) {
            console.log('📊 不同时间范围的数据点数量:');
            console.log('  1分钟:', app.dataHistory.getDataInRange(sensorType, 1).length, '个点');
            console.log('  10分钟:', app.dataHistory.getDataInRange(sensorType, 10).length, '个点');
            console.log('  1小时:', app.dataHistory.getDataInRange(sensorType, 60).length, '个点');
            console.log('  24小时:', app.dataHistory.getDataInRange(sensorType, 1440).length, '个点');
        }

        // 强制显示图表
        app.showSensorChart(sensorType);
    };

    // 验证时间范围过滤
    window.testTimeRanges = function(sensorType = 'temperature') {
        console.log('🧪 测试时间范围过滤');
        const ranges = [1, 10, 60, 1440];
        ranges.forEach(minutes => {
            const data = app.dataHistory.getDataInRange(sensorType, minutes);
            const rangeText = minutes === 1 ? '1分钟' :
                            minutes === 10 ? '10分钟' :
                            minutes === 60 ? '1小时' : '24小时';
            console.log(`${rangeText}: ${data.length}个数据点`);

            if (data.length > 0) {
                const oldest = new Date(data[0].timestamp);
                const newest = new Date(data[data.length - 1].timestamp);
                const actualMinutes = (newest - oldest) / (1000 * 60);
                console.log(`  实际时间跨度: ${actualMinutes.toFixed(1)}分钟`);
            }
        });
    };

    console.log('💡 提示：在控制台输入 debugChart() 来测试图表功能');
    console.log('💡 提示：在控制台输入 testTimeRanges() 来验证时间范围过滤');
});
