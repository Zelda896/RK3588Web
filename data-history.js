// 传感器数据历史管理类
class DataHistory {
    constructor() {
        this.history = {
            temperature: [], // 温度历史数据
            humidity: [],    // 湿度历史数据
            light: [],       // 光感历史数据
            pwm: []          // PWM历史数据
        };
        
        // 数据保留时间配置(分钟)
        this.retentionTime = {
            max: 24 * 60,    // 最大保留24小时
            cleanup: 30 * 60 // 每30分钟清理一次过期数据
        };
        
        // 启动定期清理
        this.startCleanupTimer();
    }

    // 添加数据点
    addDataPoint(sensorType, value, timestamp = null) {
        if (!this.history.hasOwnProperty(sensorType)) {
            console.warn(`未知的传感器类型: ${sensorType}`);
            return;
        }

        if (value === null || value === undefined || isNaN(value)) {
            return; // 忽略无效数据
        }

        const dataPoint = {
            timestamp: timestamp || Date.now(),
            value: Number(value)
        };

        this.history[sensorType].push(dataPoint);
        
        // 限制数组长度，避免内存溢出
        if (this.history[sensorType].length > 10000) {
            this.history[sensorType] = this.history[sensorType].slice(-8000);
        }

        console.log(`📊 添加${sensorType}数据: ${value} (${new Date(dataPoint.timestamp).toLocaleTimeString()})`);
    }

    // 获取指定时间范围的数据
    getDataInRange(sensorType, minutes) {
        if (!this.history.hasOwnProperty(sensorType)) {
            return [];
        }

        const now = Date.now();
        const startTime = now - (minutes * 60 * 1000);
        
        return this.history[sensorType]
            .filter(point => point.timestamp >= startTime)
            .sort((a, b) => a.timestamp - b.timestamp);
    }

    // 获取最新数据点
    getLatestData(sensorType) {
        if (!this.history.hasOwnProperty(sensorType) || this.history[sensorType].length === 0) {
            return null;
        }

        return this.history[sensorType][this.history[sensorType].length - 1];
    }

    // 获取数据统计信息
    getStatistics(sensorType, minutes) {
        const data = this.getDataInRange(sensorType, minutes);
        
        if (data.length === 0) {
            return {
                count: 0,
                min: null,
                max: null,
                avg: null,
                latest: null
            };
        }

        const values = data.map(point => point.value);
        const min = Math.min(...values);
        const max = Math.max(...values);
        const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
        const latest = data[data.length - 1].value;

        return {
            count: data.length,
            min: Number(min.toFixed(2)),
            max: Number(max.toFixed(2)),
            avg: Number(avg.toFixed(2)),
            latest: Number(latest.toFixed(2))
        };
    }

    // 清理过期数据
    cleanupExpiredData() {
        const cutoffTime = Date.now() - (this.retentionTime.max * 60 * 1000);
        let totalCleaned = 0;

        Object.keys(this.history).forEach(sensorType => {
            const originalLength = this.history[sensorType].length;
            this.history[sensorType] = this.history[sensorType]
                .filter(point => point.timestamp >= cutoffTime);
            
            const cleaned = originalLength - this.history[sensorType].length;
            totalCleaned += cleaned;
        });

        if (totalCleaned > 0) {
            console.log(`🧹 清理了 ${totalCleaned} 条过期数据`);
        }
    }

    // 启动定期清理定时器
    startCleanupTimer() {
        setInterval(() => {
            this.cleanupExpiredData();
        }, this.retentionTime.cleanup * 60 * 1000);
    }

    // 获取所有传感器的数据概览
    getOverview() {
        const overview = {};
        
        Object.keys(this.history).forEach(sensorType => {
            const stats = this.getStatistics(sensorType, 60); // 最近1小时
            overview[sensorType] = {
                totalPoints: this.history[sensorType].length,
                recentStats: stats
            };
        });

        return overview;
    }

    // 导出数据(用于调试)
    exportData(sensorType = null, minutes = 60) {
        if (sensorType) {
            return this.getDataInRange(sensorType, minutes);
        }
        
        const exported = {};
        Object.keys(this.history).forEach(type => {
            exported[type] = this.getDataInRange(type, minutes);
        });
        
        return exported;
    }

    // 清空所有历史数据
    clearAllData() {
        Object.keys(this.history).forEach(sensorType => {
            this.history[sensorType] = [];
        });
        console.log('🗑️ 已清空所有历史数据');
    }

    // 获取传感器配置信息
    getSensorConfig() {
        return {
            temperature: { name: '温度', unit: '°C', color: '#ff6b6b' },
            humidity: { name: '湿度', unit: '%', color: '#4ecdc4' },
            light: { name: '光感', unit: 'lux', color: '#ffe66d' },
            pwm: { name: 'PWM', unit: '%', color: '#a8e6cf' }
        };
    }
}
