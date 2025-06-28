// 图表模态框管理类
class ChartModal {
    constructor(dataHistory) {
        this.dataHistory = dataHistory;
        this.chart = null;
        this.currentSensor = null;
        this.currentTimeRange = 10; // 默认10分钟
        this.updateInterval = null;

        this.initModal();
    }

    // 初始化模态框
    initModal() {
        this.modal = document.getElementById('chart-modal');
        this.modalTitle = document.getElementById('modal-title');
        this.timeRangeSelect = document.getElementById('time-range-select');
        this.closeBtn = document.getElementById('close-modal');
        this.chartCanvas = document.getElementById('sensor-chart');

        // 绑定事件
        this.bindEvents();
    }

    // 绑定事件监听器
    bindEvents() {
        // 关闭按钮
        this.closeBtn.addEventListener('click', () => {
            this.closeModal();
        });

        // 点击模态框外部关闭
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.closeModal();
            }
        });

        // 时间范围选择
        this.timeRangeSelect.addEventListener('change', (e) => {
            this.currentTimeRange = parseInt(e.target.value);
            this.updateChart();
        });

        // ESC键关闭
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.modal.style.display === 'block') {
                this.closeModal();
            }
        });
    }

    // 显示指定传感器的图表
    showChart(sensorType) {
        console.log('📈 准备显示图表:', sensorType);

        this.currentSensor = sensorType;
        this.currentTimeRange = parseInt(this.timeRangeSelect.value);

        const sensorConfig = this.dataHistory.getSensorConfig();
        const config = sensorConfig[sensorType];

        if (!config) {
            console.error('未知的传感器类型:', sensorType);
            return;
        }

        // 检查是否有数据
        const dataCount = this.dataHistory.getDataInRange(sensorType, this.currentTimeRange).length;
        console.log(`📊 ${config.name}数据点数量:`, dataCount);

        // 设置标题
        this.modalTitle.textContent = `${config.name}历史数据`;

        // 显示模态框
        this.modal.style.display = 'block';
        document.body.style.overflow = 'hidden'; // 防止背景滚动

        // 创建图表
        this.createChart();

        // 启动自动更新
        this.startAutoUpdate();
    }

    // 创建图表
    createChart() {
        // 检查Chart.js是否加载
        if (typeof Chart === 'undefined') {
            console.error('❌ Chart.js未加载，无法创建图表');
            alert('图表库加载失败，请检查网络连接后刷新页面');
            return;
        }

        // 销毁现有图表
        if (this.chart) {
            this.chart.destroy();
        }

        const sensorConfig = this.dataHistory.getSensorConfig();
        const config = sensorConfig[this.currentSensor];
        const data = this.getChartData();

        console.log('🎨 创建图表，数据点数:', data.length);

        const chartConfig = {
            type: 'line',
            data: {
                datasets: [{
                    label: `${config.name} (${config.unit})`,
                    data: data,
                    borderColor: config.color,
                    backgroundColor: config.color + '20',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 3,
                    pointHoverRadius: 6,
                    pointBackgroundColor: config.color,
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    intersect: false,
                    mode: 'index'
                },
                plugins: {
                    title: {
                        display: true,
                        text: `${config.name}趋势图 - 最近${this.getTimeRangeText()}`,
                        font: {
                            size: 16,
                            weight: 'bold'
                        }
                    },
                    legend: {
                        display: true,
                        position: 'top'
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0,0,0,0.8)',
                        titleColor: '#fff',
                        bodyColor: '#fff',
                        borderColor: config.color,
                        borderWidth: 1,
                        callbacks: {
                            title: function(context) {
                                return new Date(context[0].parsed.x).toLocaleString('zh-CN');
                            },
                            label: function(context) {
                                return `${config.name}: ${context.parsed.y.toFixed(2)} ${config.unit}`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        type: 'linear',
                        position: 'bottom',
                        title: {
                            display: true,
                            text: '时间'
                        },
                        grid: {
                            color: 'rgba(0,0,0,0.1)'
                        },
                        ticks: {
                            callback: (value, index, values) => {
                                const date = new Date(value);
                                // 根据时间范围调整显示格式
                                if (this.currentTimeRange <= 1) {
                                    // 1分钟：显示秒
                                    return date.toLocaleTimeString('zh-CN', {
                                        minute: '2-digit',
                                        second: '2-digit'
                                    });
                                } else if (this.currentTimeRange <= 60) {
                                    // 10分钟到1小时：显示时分
                                    return date.toLocaleTimeString('zh-CN', {
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    });
                                } else {
                                    // 24小时：显示月日时分
                                    return date.toLocaleString('zh-CN', {
                                        month: '2-digit',
                                        day: '2-digit',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    });
                                }
                            }
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: `${config.name} (${config.unit})`
                        },
                        grid: {
                            color: 'rgba(0,0,0,0.1)'
                        },
                        beginAtZero: this.currentSensor === 'humidity' || this.currentSensor === 'pwm'
                    }
                },
                animation: {
                    duration: 750,
                    easing: 'easeInOutQuart'
                }
            }
        };

        // 创建图表
        try {
            this.chart = new Chart(this.chartCanvas, chartConfig);
            console.log('✅ 图表创建成功');
        } catch (error) {
            console.error('❌ 图表创建失败:', error);
            alert('图表创建失败: ' + error.message);
            return;
        }

        // 显示统计信息
        this.showStatistics();
    }

    // 获取图表数据
    getChartData() {
        const rawData = this.dataHistory.getDataInRange(this.currentSensor, this.currentTimeRange);

        // 转换为Chart.js需要的格式
        const chartData = rawData.map(point => ({
            x: point.timestamp,
            y: point.value
        }));

        console.log(`📊 获取${this.currentSensor}图表数据:`);
        console.log(`   时间范围: ${this.currentTimeRange}分钟`);
        console.log(`   数据点数: ${chartData.length}个`);

        if (chartData.length > 0) {
            const oldest = new Date(chartData[0].x).toLocaleString();
            const newest = new Date(chartData[chartData.length - 1].x).toLocaleString();
            console.log(`   时间跨度: ${oldest} 到 ${newest}`);
        }

        return chartData;
    }

    // 获取时间范围文本
    getTimeRangeText() {
        const ranges = {
            1: '1分钟',
            10: '10分钟',
            60: '1小时',
            1440: '24小时'
        };
        return ranges[this.currentTimeRange] || `${this.currentTimeRange}分钟`;
    }

    // 更新图表
    updateChart() {
        if (!this.chart || !this.currentSensor) return;

        const data = this.getChartData();
        const sensorConfig = this.dataHistory.getSensorConfig();
        const config = sensorConfig[this.currentSensor];

        // 更新数据
        this.chart.data.datasets[0].data = data;

        // 更新标题
        this.chart.options.plugins.title.text = `${config.name}趋势图 - 最近${this.getTimeRangeText()}`;

        // 重新渲染
        this.chart.update('none'); // 无动画更新

        // 更新统计信息
        this.showStatistics();
    }

    // 显示统计信息
    showStatistics() {
        const stats = this.dataHistory.getStatistics(this.currentSensor, this.currentTimeRange);
        const sensorConfig = this.dataHistory.getSensorConfig();
        const config = sensorConfig[this.currentSensor];

        // 在图表下方显示统计信息
        let statsDiv = document.getElementById('chart-statistics');
        if (!statsDiv) {
            statsDiv = document.createElement('div');
            statsDiv.id = 'chart-statistics';
            statsDiv.className = 'chart-statistics';
            this.chartCanvas.parentNode.appendChild(statsDiv);
        }

        if (stats.count === 0) {
            statsDiv.innerHTML = '<p class="no-data">暂无数据</p>';
            return;
        }

        statsDiv.innerHTML = `
            <div class="stats-grid">
                <div class="stat-item">
                    <span class="stat-label">数据点数</span>
                    <span class="stat-value">${stats.count}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">最新值</span>
                    <span class="stat-value">${stats.latest} ${config.unit}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">平均值</span>
                    <span class="stat-value">${stats.avg} ${config.unit}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">最小值</span>
                    <span class="stat-value">${stats.min} ${config.unit}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">最大值</span>
                    <span class="stat-value">${stats.max} ${config.unit}</span>
                </div>
            </div>
        `;
    }

    // 启动自动更新
    startAutoUpdate() {
        // 清除现有定时器
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }

        // 与数据更新频率同步，每10秒更新一次图表
        this.updateInterval = setInterval(() => {
            this.updateChart();
            console.log('📈 图表数据已更新');
        }, 10000);
    }

    // 停止自动更新
    stopAutoUpdate() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
    }

    // 关闭模态框
    closeModal() {
        this.modal.style.display = 'none';
        document.body.style.overflow = 'auto'; // 恢复背景滚动

        // 停止自动更新
        this.stopAutoUpdate();

        // 销毁图表
        if (this.chart) {
            this.chart.destroy();
            this.chart = null;
        }

        // 清理统计信息
        const statsDiv = document.getElementById('chart-statistics');
        if (statsDiv) {
            statsDiv.remove();
        }

        this.currentSensor = null;
    }

    // 导出图表数据
    exportChartData() {
        if (!this.currentSensor) return null;

        const data = this.dataHistory.getDataInRange(this.currentSensor, this.currentTimeRange);
        const stats = this.dataHistory.getStatistics(this.currentSensor, this.currentTimeRange);

        return {
            sensor: this.currentSensor,
            timeRange: this.currentTimeRange,
            data: data,
            statistics: stats,
            exportTime: new Date().toISOString()
        };
    }
}
