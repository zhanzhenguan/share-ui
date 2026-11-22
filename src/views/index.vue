<template>
  <div class="dashboard app-container">
    <header class="dashboard-header reveal">
      <div>
        <p class="eyebrow">OPERATIONS OVERVIEW</p>
        <h1>运营概览</h1>
        <p class="header-description">欢迎回来，{{ userName }}。这里汇总了平台的核心业务数据。</p>
      </div>
      <div class="header-actions">
        <div class="date-block">
          <span>{{ currentDate }}</span>
          <small v-if="lastUpdated">更新于 {{ lastUpdated }}</small>
        </div>
        <el-button
          class="refresh-button"
          :icon="Refresh"
          :loading="isRefreshing"
          @click="loadDashboard"
        >刷新数据</el-button>
      </div>
    </header>

    <section class="metric-strip reveal delay-1" v-loading="summaryLoading" aria-label="核心业务指标">
      <div v-for="metric in metrics" :key="metric.label" class="metric-item">
        <div class="metric-icon">
          <el-icon :size="22"><component :is="metric.icon" /></el-icon>
        </div>
        <div class="metric-content">
          <span class="metric-label">{{ metric.label }}</span>
          <strong class="metric-value">{{ formatMetric(metric.value) }}</strong>
          <span class="metric-note">{{ metric.note }}</span>
        </div>
      </div>
    </section>

    <div class="workspace-grid">
      <section class="panel trend-panel reveal delay-2">
        <div class="panel-header">
          <div>
            <h2>订单趋势</h2>
            <p>订单量与订单金额的周期变化</p>
          </div>
          <el-radio-group v-model="period" class="period-control" size="small" @change="loadTrend">
            <el-radio-button :label="7">近 7 天</el-radio-button>
            <el-radio-button :label="30">近 30 天</el-radio-button>
          </el-radio-group>
        </div>
        <div class="trend-summary">
          <span>周期订单 <strong>{{ hasTrendData ? formatNumber(trendTotalCount) : '--' }}</strong> 笔</span>
          <i></i>
          <span>订单金额 <strong>¥{{ hasTrendData ? formatMoney(trendTotalAmount) : '--' }}</strong></span>
        </div>
        <div class="chart-container" v-loading="trendLoading">
          <div v-show="hasTrendData" ref="trendChartRef" class="trend-chart"></div>
          <el-empty
            v-if="!trendLoading && !hasTrendData"
            :image-size="88"
            description="当前周期暂无订单统计数据"
          />
        </div>
      </section>

      <aside class="panel quick-panel reveal delay-2">
        <div class="panel-header">
          <div>
            <h2>快捷入口</h2>
            <p>进入常用业务管理功能</p>
          </div>
        </div>
        <nav class="quick-links" aria-label="常用业务功能">
          <button
            v-for="link in quickLinks"
            :key="link.path"
            type="button"
            class="quick-link"
            @click="goTo(link.path)"
          >
            <span class="quick-link-icon">
              <el-icon :size="20"><component :is="link.icon" /></el-icon>
            </span>
            <span class="quick-link-copy">
              <strong>{{ link.title }}</strong>
              <small>{{ link.description }}</small>
            </span>
            <el-icon class="quick-link-arrow"><ArrowRight /></el-icon>
          </button>
        </nav>
        <div class="quick-footer">
          <span class="status-dot"></span>
          业务数据通过统一网关实时获取
        </div>
      </aside>
    </div>

    <section class="panel orders-panel reveal delay-3" v-loading="summaryLoading">
      <div class="panel-header">
        <div>
          <h2>最新订单</h2>
          <p>快速了解最近的借还与支付状态</p>
        </div>
        <el-button link class="more-button" @click="goTo('/order/orderInfo')">
          查看全部
          <el-icon><ArrowRight /></el-icon>
        </el-button>
      </div>
      <el-table :data="recentOrders" class="order-table">
        <el-table-column label="订单号" min-width="160">
          <template #default="{ row }">
            <span class="order-number">{{ row.orderNo || '--' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="用户" min-width="110">
          <template #default="{ row }">{{ row.userInfoVo?.nickname || '匿名用户' }}</template>
        </el-table-column>
        <el-table-column label="借用站点" prop="startStationName" min-width="150" show-overflow-tooltip>
          <template #default="{ row }">{{ row.startStationName || '--' }}</template>
        </el-table-column>
        <el-table-column label="金额" width="110" align="right">
          <template #default="{ row }">
            <span class="order-amount">¥{{ formatMoney(row.totalAmount) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="110">
          <template #default="{ row }">
            <span class="order-status" :class="statusMeta(row.status).type">
              <i></i>{{ statusMeta(row.status).label }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="创建时间" width="150" align="right">
          <template #default="{ row }">{{ formatOrderTime(row.createTime || row.startTime) }}</template>
        </el-table-column>
        <template #empty>
          <el-empty :image-size="88" description="暂无订单数据" />
        </template>
      </el-table>
    </section>
  </div>
</template>

<script setup name="Dashboard">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import * as echarts from 'echarts'
import {
  ArrowRight,
  Cellphone,
  DataAnalysis,
  MapLocation,
  OfficeBuilding,
  Refresh,
  Tickets,
  User
} from '@element-plus/icons-vue'
import { getOrderStatisticsData, listOrderInfo } from '@/api/order/orderInfo'
import { listUserInfo } from '@/api/user/userInfo'
import { listCabinet } from '@/api/device/cabinet'
import { listPowerBank } from '@/api/device/powerBank'
import { parseTime } from '@/utils/ruoyi'
import useUserStore from '@/store/modules/user'

const router = useRouter()
const userStore = useUserStore()
const summaryLoading = ref(false)
const trendLoading = ref(false)
const period = ref(7)
const lastUpdated = ref('')
const recentOrders = ref([])
const trendChartRef = ref(null)
const trendDates = ref([])
const trendCounts = ref([])
const trendAmounts = ref([])
let trendChart = null

const userName = computed(() => userStore.name || '管理员')
const isRefreshing = computed(() => summaryLoading.value || trendLoading.value)
const hasTrendData = computed(() => trendDates.value.length > 0)
const trendTotalCount = computed(() => trendCounts.value.reduce((sum, value) => sum + Number(value || 0), 0))
const trendTotalAmount = computed(() => trendAmounts.value.reduce((sum, value) => sum + Number(value || 0), 0))
const currentDate = new Intl.DateTimeFormat('zh-CN', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  weekday: 'long'
}).format(new Date())

const metrics = ref([
  { label: '累计订单', value: null, note: '平台全部租借订单', icon: Tickets },
  { label: '注册用户', value: null, note: '已注册 C 端用户', icon: User },
  { label: '机柜总数', value: null, note: '已录入机柜档案', icon: OfficeBuilding },
  { label: '充电宝总数', value: null, note: '已录入充电宝档案', icon: Cellphone }
])

const quickLinks = [
  { title: '站点管理', description: '维护站点与位置信息', path: '/device/station', icon: MapLocation },
  { title: '机柜管理', description: '查看机柜与槽位状态', path: '/device/cabinet', icon: OfficeBuilding },
  { title: '订单查询', description: '检索订单与账单详情', path: '/order/orderInfo', icon: Tickets },
  { title: '数据统计', description: '分析区域订单表现', path: '/statistics/region', icon: DataAnalysis }
]

function formatNumber(value) {
  return Number(value || 0).toLocaleString('zh-CN')
}

function formatMetric(value) {
  return value === null ? '--' : formatNumber(value)
}

function formatMoney(value) {
  return Number(value || 0).toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
}

function formatOrderTime(value) {
  return value ? parseTime(value, '{m}-{d} {h}:{i}') : '--'
}

function statusMeta(status) {
  if (String(status) === '0') return { label: '充电中', type: 'processing' }
  if (String(status) === '1') return { label: '待支付', type: 'pending' }
  return { label: '已完成', type: 'completed' }
}

function goTo(path) {
  router.push(path)
}

async function loadDashboard() {
  if (summaryLoading.value) return
  summaryLoading.value = true
  const [orders, users, cabinets, powerBanks] = await Promise.allSettled([
    listOrderInfo({ pageNum: 1, pageSize: 6 }),
    listUserInfo({ pageNum: 1, pageSize: 1 }),
    listCabinet({ pageNum: 1, pageSize: 1 }),
    listPowerBank({ pageNum: 1, pageSize: 1 })
  ])

  if (orders.status === 'fulfilled') {
    metrics.value[0].value = Number(orders.value.total || 0)
    recentOrders.value = orders.value.rows || []
  }
  if (users.status === 'fulfilled') {
    metrics.value[1].value = Number(users.value.total || 0)
  }
  if (cabinets.status === 'fulfilled') {
    metrics.value[2].value = Number(cabinets.value.total || 0)
  }
  if (powerBanks.status === 'fulfilled') {
    metrics.value[3].value = Number(powerBanks.value.total || 0)
  }

  lastUpdated.value = parseTime(new Date(), '{h}:{i}:{s}')
  summaryLoading.value = false
  await loadTrend()
}

function dateParam(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

async function loadTrend() {
  if (trendLoading.value) return
  trendLoading.value = true
  const end = new Date()
  const start = new Date()
  start.setDate(end.getDate() - period.value + 1)

  try {
    const response = await getOrderStatisticsData({
      orderDateBegin: dateParam(start),
      orderDateEnd: dateParam(end),
      provinceCode: '',
      cityCode: '',
      districtCode: ''
    })
    const countData = response.data?.orderDateToNumData || {}
    const amountData = response.data?.orderDateToAmountData || {}
    trendDates.value = countData.orderDateList || amountData.orderDateList || []
    trendCounts.value = countData.orderDateNumList || []
    trendAmounts.value = amountData.orderDateAmountList || []
    await nextTick()
    renderTrendChart()
  } catch (error) {
    trendDates.value = []
    trendCounts.value = []
    trendAmounts.value = []
    trendChart?.clear()
  } finally {
    trendLoading.value = false
  }
}

function renderTrendChart() {
  if (!trendChartRef.value || !hasTrendData.value) return
  if (!trendChart) {
    trendChart = echarts.init(trendChartRef.value)
  }
  trendChart.setOption({
    animationDuration: 500,
    animationEasing: 'cubicOut',
    color: ['#94a3b8', '#0f766e'],
    grid: { left: 12, right: 12, top: 48, bottom: 8, containLabel: true },
    legend: {
      top: 0,
      right: 0,
      itemWidth: 10,
      itemHeight: 10,
      textStyle: { color: '#64748b' }
    },
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(15, 23, 42, 0.94)',
      borderWidth: 0,
      padding: [10, 14],
      textStyle: { color: '#fff' },
      axisPointer: { type: 'line', lineStyle: { color: '#cbd5e1' } }
    },
    xAxis: {
      type: 'category',
      data: trendDates.value,
      boundaryGap: true,
      axisLine: { lineStyle: { color: '#e2e8f0' } },
      axisTick: { show: false },
      axisLabel: { color: '#94a3b8', margin: 14 }
    },
    yAxis: [
      {
        type: 'value',
        name: '订单 / 笔',
        minInterval: 1,
        nameTextStyle: { color: '#94a3b8', padding: [0, 0, 0, 8] },
        axisLabel: { color: '#94a3b8' },
        splitLine: { lineStyle: { color: '#eef2f7', type: 'dashed' } }
      },
      {
        type: 'value',
        name: '金额 / 元',
        nameTextStyle: { color: '#94a3b8', padding: [0, 8, 0, 0] },
        axisLabel: { color: '#94a3b8' },
        splitLine: { show: false }
      }
    ],
    series: [
      {
        name: '订单金额',
        type: 'bar',
        yAxisIndex: 1,
        data: trendAmounts.value,
        barMaxWidth: 18,
        itemStyle: { color: 'rgba(148, 163, 184, 0.22)', borderRadius: [4, 4, 0, 0] }
      },
      {
        name: '订单量',
        type: 'line',
        data: trendCounts.value,
        smooth: 0.35,
        symbol: 'circle',
        symbolSize: 7,
        lineStyle: { width: 3, color: '#0f766e' },
        itemStyle: { color: '#fff', borderColor: '#0f766e', borderWidth: 2 },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(15, 118, 110, 0.18)' },
            { offset: 1, color: 'rgba(15, 118, 110, 0)' }
          ])
        }
      }
    ]
  }, true)
}

function resizeChart() {
  trendChart?.resize()
}

onMounted(() => {
  loadDashboard()
  window.addEventListener('resize', resizeChart)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', resizeChart)
  trendChart?.dispose()
  trendChart = null
})
</script>

<style scoped>
.dashboard {
  --dashboard-accent: #0f766e;
  --dashboard-accent-soft: #ecf8f6;
  --dashboard-text: #172033;
  --dashboard-muted: #7b8798;
  max-width: 1680px;
  margin: 0 auto;
  padding: 28px;
  color: var(--dashboard-text);
}

.dashboard-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 26px;
}

.eyebrow {
  margin: 0 0 7px;
  color: var(--dashboard-accent);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.16em;
}

.dashboard-header h1 {
  margin: 0;
  font-size: 28px;
  font-weight: 650;
  letter-spacing: -0.03em;
}

.header-description {
  margin: 8px 0 0;
  color: var(--dashboard-muted);
  font-size: 14px;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 20px;
}

.date-block {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 5px;
  color: #526075;
  font-size: 13px;
}

.date-block small {
  color: #9aa5b4;
  font-size: 12px;
}

.refresh-button {
  height: 38px;
  padding: 0 17px;
  border-color: #dce4eb;
  border-radius: 8px;
  color: #3f4c60;
}

.refresh-button:hover,
.refresh-button:focus {
  border-color: var(--dashboard-accent);
  color: var(--dashboard-accent);
  background: var(--dashboard-accent-soft);
}

.metric-strip {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  min-height: 138px;
  padding: 26px 0;
  overflow: hidden;
  background: #fff;
  border: 1px solid #e7ecf1;
  border-radius: 12px;
}

.metric-item {
  display: flex;
  align-items: center;
  gap: 16px;
  min-width: 0;
  padding: 0 26px;
  border-right: 1px solid #edf1f5;
  transition: background-color 180ms ease;
}

.metric-item:last-child {
  border-right: 0;
}

.metric-item:hover {
  background: #fbfdfd;
}

.metric-icon {
  display: grid;
  flex: 0 0 46px;
  width: 46px;
  height: 46px;
  place-items: center;
  border-radius: 10px;
  color: var(--dashboard-accent);
  background: var(--dashboard-accent-soft);
  transition: transform 180ms ease;
}

.metric-item:hover .metric-icon {
  transform: translateY(-2px);
}

.metric-content {
  display: flex;
  min-width: 0;
  flex-direction: column;
}

.metric-label {
  margin-bottom: 4px;
  color: #6e7b8e;
  font-size: 13px;
}

.metric-value {
  overflow: hidden;
  font-size: 28px;
  font-weight: 650;
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.03em;
  line-height: 1.25;
  text-overflow: ellipsis;
}

.metric-note {
  margin-top: 4px;
  overflow: hidden;
  color: #a0aab8;
  font-size: 12px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.workspace-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.9fr) minmax(280px, 0.8fr);
  gap: 20px;
  margin-top: 20px;
}

.panel {
  min-width: 0;
  padding: 24px;
  background: #fff;
  border: 1px solid #e7ecf1;
  border-radius: 12px;
}

.panel-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.panel-header h2 {
  margin: 0;
  font-size: 17px;
  font-weight: 650;
  letter-spacing: -0.01em;
}

.panel-header p {
  margin: 6px 0 0;
  color: var(--dashboard-muted);
  font-size: 12px;
}

.period-control {
  flex-shrink: 0;
}

.period-control :deep(.el-radio-button__inner) {
  color: #748196;
  box-shadow: none !important;
}

.period-control :deep(.el-radio-button__original-radio:checked + .el-radio-button__inner) {
  border-color: var(--dashboard-accent);
  color: #fff;
  background: var(--dashboard-accent);
}

.trend-summary {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-top: 22px;
  color: #8490a2;
  font-size: 12px;
}

.trend-summary strong {
  margin-left: 5px;
  color: #354158;
  font-size: 15px;
  font-weight: 650;
  font-variant-numeric: tabular-nums;
}

.trend-summary i {
  width: 1px;
  height: 14px;
  background: #e3e8ee;
}

.chart-container {
  min-height: 306px;
  margin-top: 4px;
}

.trend-chart {
  width: 100%;
  height: 306px;
}

.chart-container :deep(.el-empty) {
  height: 306px;
  padding: 40px 0;
}

.quick-panel {
  display: flex;
  flex-direction: column;
}

.quick-links {
  margin-top: 15px;
}

.quick-link {
  display: flex;
  width: 100%;
  align-items: center;
  gap: 13px;
  padding: 16px 4px;
  border: 0;
  border-bottom: 1px solid #edf1f5;
  color: inherit;
  text-align: left;
  background: transparent;
  cursor: pointer;
  transition: padding 180ms ease, background-color 180ms ease;
}

.quick-link:hover,
.quick-link:focus-visible {
  padding-right: 9px;
  padding-left: 9px;
  outline: none;
  background: #f7fbfa;
}

.quick-link-icon {
  display: grid;
  flex: 0 0 38px;
  width: 38px;
  height: 38px;
  place-items: center;
  border-radius: 8px;
  color: var(--dashboard-accent);
  background: var(--dashboard-accent-soft);
}

.quick-link-copy {
  display: flex;
  min-width: 0;
  flex: 1;
  flex-direction: column;
  gap: 4px;
}

.quick-link-copy strong {
  font-size: 14px;
  font-weight: 600;
}

.quick-link-copy small {
  overflow: hidden;
  color: #929dad;
  font-size: 12px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.quick-link-arrow {
  color: #b2bcc8;
  transition: color 180ms ease, transform 180ms ease;
}

.quick-link:hover .quick-link-arrow {
  color: var(--dashboard-accent);
  transform: translateX(3px);
}

.quick-footer {
  display: flex;
  align-items: center;
  gap: 7px;
  margin-top: auto;
  padding-top: 20px;
  color: #98a3b2;
  font-size: 11px;
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #20a486;
  box-shadow: 0 0 0 3px rgba(32, 164, 134, 0.12);
}

.orders-panel {
  margin-top: 20px;
}

.more-button {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  color: var(--dashboard-accent);
  font-size: 13px;
}

.order-table {
  width: 100%;
  margin-top: 15px;
}

.order-table :deep(.el-table__inner-wrapper::before) {
  display: none;
}

.order-table :deep(th.el-table__cell) {
  padding: 11px 0;
  color: #8a96a7;
  font-size: 12px;
  font-weight: 500;
  background: #fafbfc;
}

.order-table :deep(td.el-table__cell) {
  padding: 14px 0;
  border-bottom-color: #edf1f5;
  color: #526075;
  font-size: 13px;
}

.order-table :deep(.el-table__row) {
  transition: background-color 160ms ease;
}

.order-table :deep(.el-table__row:hover > td.el-table__cell) {
  background: #f8fbfa;
}

.order-number {
  color: #26344a;
  font-family: Consolas, Monaco, monospace;
  font-size: 12px;
}

.order-amount {
  color: #26344a;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.order-status {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
}

.order-status i {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
}

.order-status.processing {
  color: #3b82f6;
}

.order-status.pending {
  color: #d97706;
}

.order-status.completed {
  color: var(--dashboard-accent);
}

.reveal {
  animation: rise-in 420ms both;
}

.delay-1 {
  animation-delay: 60ms;
}

.delay-2 {
  animation-delay: 120ms;
}

.delay-3 {
  animation-delay: 180ms;
}

@keyframes rise-in {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 1200px) {
  .metric-strip {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .metric-item {
    min-height: 104px;
  }

  .metric-item:nth-child(2) {
    border-right: 0;
  }

  .metric-item:nth-child(-n + 2) {
    border-bottom: 1px solid #edf1f5;
  }

  .workspace-grid {
    grid-template-columns: minmax(0, 1.5fr) minmax(270px, 0.8fr);
  }
}

@media (max-width: 900px) {
  .dashboard {
    padding: 20px;
  }

  .workspace-grid {
    grid-template-columns: 1fr;
  }

  .quick-footer {
    margin-top: 0;
  }
}

@media (max-width: 640px) {
  .dashboard {
    padding: 16px;
  }

  .dashboard-header {
    align-items: flex-start;
    flex-direction: column;
    margin-bottom: 20px;
  }

  .dashboard-header h1 {
    font-size: 25px;
  }

  .header-actions {
    width: 100%;
    justify-content: space-between;
  }

  .date-block {
    align-items: flex-start;
  }

  .metric-strip {
    grid-template-columns: 1fr;
    padding: 0 20px;
  }

  .metric-item {
    min-height: 112px;
    padding: 0;
    border-right: 0;
    border-bottom: 1px solid #edf1f5;
  }

  .metric-item:nth-child(3) {
    border-bottom: 1px solid #edf1f5;
  }

  .metric-item:last-child {
    border-bottom: 0;
  }

  .panel {
    padding: 19px;
  }

  .trend-panel .panel-header {
    flex-direction: column;
  }

  .trend-summary {
    align-items: flex-start;
    flex-direction: column;
    gap: 7px;
  }

  .trend-summary i {
    display: none;
  }

  .trend-chart,
  .chart-container,
  .chart-container :deep(.el-empty) {
    height: 270px;
    min-height: 270px;
  }

  .orders-panel {
    overflow: hidden;
  }
}

@media (prefers-reduced-motion: reduce) {
  .reveal {
    animation: none;
  }

  .metric-icon,
  .quick-link,
  .quick-link-arrow {
    transition: none;
  }
}
</style>
