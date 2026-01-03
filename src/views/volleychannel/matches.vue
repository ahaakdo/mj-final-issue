<template>
  <div class="matches-container">
    <div class="page-header">
      <h1 class="page-title">女排经典赛事</h1>
      <p class="page-subtitle">回顾历届重要比赛，重温经典瞬间</p>
    </div>

    <div class="matches-content">
      <!-- 左侧年份导航 -->
      <div class="year-nav-sidebar">
        <div class="year-nav-header">
          <h3>赛事年份</h3>
          <el-icon><Calendar /></el-icon>
        </div>
        <div class="year-list">
          <div
            v-for="year in years"
            :key="year"
            class="year-item"
            :class="{ active: selectedYear === year }"
            @click="selectYear(year)"
          >
            <span class="year-text">{{ year }}年</span>
            <span class="match-count">
              {{ getYearMatchCount(year) }}
            </span>
          </div>
        </div>
      </div>

      <!-- 右侧视频区域 -->
      <div class="video-main-content">
        <div class="year-header">
          <h2 class="selected-year-title">{{ selectedYear }}年经典赛事</h2>
          <div class="year-stats">
            <el-tag type="info" size="small">
              <el-icon><VideoPlay /></el-icon>
              共 {{ filteredMatches.length }} 场比赛
            </el-tag>
          </div>
        </div>

        <!-- 视频网格 - 一行三个 -->
        <div class="video-grid">
          <div
            v-for="match in filteredMatches"
            :key="match.id"
            class="video-card"
          >
            <div class="video-thumbnail">
              <!-- 使用写死的占位图 -->
              <img
                :src="match.thumbnail"
                :alt="match.title"
                class="thumbnail-image"
              />
              <div class="video-duration">
                {{ match.duration }}
              </div>
              <div class="play-button-overlay">
                <el-icon class="play-icon"><VideoPlay /></el-icon>
              </div>
              <div class="video-badge">
                <el-tag size="small" :type="match.tagType">
                  {{ match.type }}
                </el-tag>
              </div>
            </div>

            <div class="video-info">
              <h3 class="video-title">{{ match.title }}</h3>
              <div class="video-meta">
                <span class="meta-item">
                  <el-icon><Clock /></el-icon>
                  {{ match.date }}
                </span>
                <span class="meta-item">
                  <el-icon><Location /></el-icon>
                  {{ match.location }}
                </span>
              </div>
              <p class="video-description">{{ match.description }}</p>

              <div class="match-result">
                <span class="result-label">比赛结果：</span>
                <span
                  class="result-value"
                  :class="{
                    win: match.resultType === 'win',
                    lose: match.resultType === 'lose'
                  }"
                >
                  {{ match.result }}
                </span>
              </div>

              <div class="video-actions">
                <el-button
                  type="primary"
                  size="small"
                  @click="playVideo(match)"
                >
                  <el-icon><VideoPlay /></el-icon>
                  播放视频
                </el-button>
                <el-button
                  type="success"
                  size="small"
                  @click="viewDetails(match)"
                >
                  <el-icon><View /></el-icon>
                  查看详情
                </el-button>
              </div>
            </div>
          </div>
        </div>

        <!-- 无数据提示 -->
        <div v-if="filteredMatches.length === 0" class="empty-matches">
          <el-empty description="该年份暂无赛事数据" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import {
  Calendar,
  VideoPlay,
  Clock,
  Location,
  View,
  Trophy,
  Flag
} from "@element-plus/icons-vue";
import { ElMessage } from "element-plus";

// 定义赛事接口
interface Match {
  id: number;
  title: string;
  date: string;
  location: string;
  description: string;
  thumbnail: string;
  duration: string;
  type: string;
  tagType: "success" | "info" | "warning" | "danger" | "";
  result: string;
  resultType: "win" | "lose" | "draw";
  year: number;
}

// 年份列表
const years = ref([
  2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025
]);
const selectedYear = ref(2016);

// 写死的赛事数据
const allMatches = ref<Match[]>([
  // 2016年赛事 - 里约奥运会金牌
  {
    id: 1,
    title: "2016里约奥运会决赛",
    date: "2016-08-20",
    location: "巴西里约热内卢",
    description:
      "中国女排在里约奥运会决赛中逆转塞尔维亚，时隔12年再夺奥运金牌。",
    thumbnail:
      "https://via.placeholder.com/350x200/FF6B6B/FFFFFF?text=2016+奥运决赛",
    duration: "02:18:45",
    type: "奥运会",
    tagType: "danger",
    result: "中国 3-1 塞尔维亚",
    resultType: "win",
    year: 2016
  },
  {
    id: 2,
    title: "2016里约奥运会1/4决赛",
    date: "2016-08-16",
    location: "巴西里约热内卢",
    description: "对阵东道主巴西，惊天逆转晋级四强。",
    thumbnail:
      "https://via.placeholder.com/350x200/4ECDC4/FFFFFF?text=2016+奥运1/4决赛",
    duration: "02:05:30",
    type: "奥运会",
    tagType: "danger",
    result: "中国 3-2 巴西",
    resultType: "win",
    year: 2016
  },
  {
    id: 3,
    title: "2016里约奥运会小组赛",
    date: "2016-08-12",
    location: "巴西里约热内卢",
    description: "小组赛关键战，力克美国女排。",
    thumbnail:
      "https://via.placeholder.com/350x200/45B7D1/FFFFFF?text=2016+奥运小组赛",
    duration: "01:52:15",
    type: "奥运会",
    tagType: "danger",
    result: "中国 3-1 美国",
    resultType: "win",
    year: 2016
  },
  // 2019年赛事 - 世界杯全胜夺冠
  {
    id: 4,
    title: "2019世界杯决赛",
    date: "2019-09-28",
    location: "日本大阪",
    description: "全胜战绩卫冕世界杯冠军，11连胜完美收官。",
    thumbnail:
      "https://via.placeholder.com/350x200/96CEB4/FFFFFF?text=2019+世界杯决赛",
    duration: "01:48:20",
    type: "世界杯",
    tagType: "success",
    result: "中国 3-0 阿根廷",
    resultType: "win",
    year: 2019
  },
  {
    id: 5,
    title: "2019世界杯中美大战",
    date: "2019-09-23",
    location: "日本札幌",
    description: "关键之战，零封卫冕冠军美国队。",
    thumbnail:
      "https://via.placeholder.com/350x200/FECA57/FFFFFF?text=2019+世界杯中美战",
    duration: "01:35:45",
    type: "世界杯",
    tagType: "success",
    result: "中国 3-0 美国",
    resultType: "win",
    year: 2019
  },
  {
    id: 6,
    title: "2019世界杯日中对决",
    date: "2019-09-19",
    location: "日本横滨",
    description: "客场作战，直落三局击败日本队。",
    thumbnail:
      "https://via.placeholder.com/350x200/FF9FF3/FFFFFF?text=2019+世界杯中日战",
    duration: "01:42:10",
    type: "世界杯",
    tagType: "success",
    result: "中国 3-0 日本",
    resultType: "win",
    year: 2019
  },
  // 2015年赛事 - 世界杯夺冠
  {
    id: 7,
    title: "2015世界杯决赛",
    date: "2015-09-06",
    location: "日本名古屋",
    description: "战胜日本队，时隔11年再夺世界杯冠军。",
    thumbnail:
      "https://via.placeholder.com/350x200/54A0FF/FFFFFF?text=2015+世界杯决赛",
    duration: "01:55:30",
    type: "世界杯",
    tagType: "success",
    result: "中国 3-1 日本",
    resultType: "win",
    year: 2015
  },
  // 2021年赛事 - 东京奥运会
  {
    id: 8,
    title: "2021东京奥运会小组赛",
    date: "2021-07-29",
    location: "日本东京",
    description: "东京奥运会小组赛关键战役。",
    thumbnail:
      "https://via.placeholder.com/350x200/5F27CD/FFFFFF?text=2021+东京奥运",
    duration: "01:58:20",
    type: "奥运会",
    tagType: "danger",
    result: "中国 2-3 俄罗斯",
    resultType: "lose",
    year: 2021
  },
  {
    id: 9,
    title: "2021东京奥运会中意之战",
    date: "2021-07-31",
    location: "日本东京",
    description: "小组赛对阵意大利女排。",
    thumbnail:
      "https://via.placeholder.com/350x200/FF9FF3/FFFFFF?text=2021+奥运中意战",
    duration: "02:05:15",
    type: "奥运会",
    tagType: "danger",
    result: "中国 3-0 意大利",
    resultType: "win",
    year: 2021
  },
  // 2018年赛事 - 亚运会
  {
    id: 10,
    title: "2018亚运会决赛",
    date: "2018-09-01",
    location: "印尼雅加达",
    description: "雅加达亚运会决赛，成功卫冕金牌。",
    thumbnail:
      "https://via.placeholder.com/350x200/00D2D3/FFFFFF?text=2018+亚运会决赛",
    duration: "01:32:45",
    type: "亚运会",
    tagType: "warning",
    result: "中国 3-0 泰国",
    resultType: "win",
    year: 2018
  },
  // 2022年赛事 - 世锦赛
  {
    id: 11,
    title: "2022世锦赛1/4决赛",
    date: "2022-10-11",
    location: "荷兰阿纳姆",
    description: "世锦赛淘汰赛阶段关键比赛。",
    thumbnail:
      "https://via.placeholder.com/350x200/FF6B6B/FFFFFF?text=2022+世锦赛",
    duration: "02:12:30",
    type: "世锦赛",
    tagType: "info",
    result: "中国 1-3 意大利",
    resultType: "lose",
    year: 2022
  },
  {
    id: 12,
    title: "2022世锦赛小组赛",
    date: "2022-10-05",
    location: "荷兰阿纳姆",
    description: "小组赛对阵日本女排。",
    thumbnail:
      "https://via.placeholder.com/350x200/4ECDC4/FFFFFF?text=2022+世锦赛中日",
    duration: "01:45:20",
    type: "世锦赛",
    tagType: "info",
    result: "中国 3-0 日本",
    resultType: "win",
    year: 2022
  },
  // 2023年赛事
  {
    id: 13,
    title: "2023亚运会决赛",
    date: "2023-10-07",
    location: "中国杭州",
    description: "杭州亚运会主场卫冕成功。",
    thumbnail:
      "https://via.placeholder.com/350x200/96CEB4/FFFFFF?text=2023+亚运会决赛",
    duration: "01:38:15",
    type: "亚运会",
    tagType: "warning",
    result: "中国 3-0 日本",
    resultType: "win",
    year: 2023
  },
  // 2024年赛事（未来赛事占位）
  {
    id: 14,
    title: "2024巴黎奥运会小组赛",
    date: "2024-07-28",
    location: "法国巴黎",
    description: "巴黎奥运会首场比赛，对阵强敌。",
    thumbnail:
      "https://via.placeholder.com/350x200/54A0FF/FFFFFF?text=2024+巴黎奥运",
    duration: "待定",
    type: "奥运会",
    tagType: "danger",
    result: "比赛未开始",
    resultType: "draw",
    year: 2024
  },
  {
    id: 15,
    title: "2024世界联赛总决赛",
    date: "2024-07-15",
    location: "待定",
    description: "世界女排联赛年度总决赛。",
    thumbnail:
      "https://via.placeholder.com/350x200/FECA57/FFFFFF?text=2024+世界联赛",
    duration: "待定",
    type: "世界联赛",
    tagType: "success",
    result: "比赛未开始",
    resultType: "draw",
    year: 2024
  },
  // 2025年赛事（未来赛事占位）
  {
    id: 16,
    title: "2025世锦赛小组赛",
    date: "2025-09-15",
    location: "待定",
    description: "新一轮世锦赛征程开始。",
    thumbnail:
      "https://via.placeholder.com/350x200/5F27CD/FFFFFF?text=2025+世锦赛",
    duration: "待定",
    type: "世锦赛",
    tagType: "info",
    result: "比赛未开始",
    resultType: "draw",
    year: 2025
  }
]);

// 计算每个年份的比赛数量
const getYearMatchCount = (year: number) => {
  return allMatches.value.filter(match => match.year === year).length;
};

// 选择年份
const selectYear = (year: number) => {
  selectedYear.value = year;
};

// 获取当前年份的赛事
const filteredMatches = computed(() => {
  return allMatches.value.filter(match => match.year === selectedYear.value);
});

// 播放视频（模拟）
const playVideo = (match: Match) => {
  ElMessage.info(`开始播放：${match.title}`);
  // 这里可以添加实际的视频播放逻辑
  console.log("播放视频:", match);
};

// 查看详情（模拟）
const viewDetails = (match: Match) => {
  ElMessage.success(`查看 ${match.title} 的详细信息`);
  console.log("查看详情:", match);
};

// 处理图片错误
const handleImageError = (event: Event) => {
  const img = event.target as HTMLImageElement;
  img.src =
    "https://via.placeholder.com/350x200/CCCCCC/666666?text=图片加载失败";
};
</script>

<style scoped>
.matches-container {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
  background: #f8f9fa;
  min-height: 100vh;
}

.page-header {
  text-align: center;
  margin-bottom: 30px;
  padding: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  color: white;
}

.page-title {
  font-size: 32px;
  font-weight: bold;
  margin-bottom: 8px;
}

.page-subtitle {
  font-size: 16px;
  opacity: 0.9;
}

.matches-content {
  display: flex;
  gap: 30px;
  margin-top: 20px;
}

/* 左侧年份导航 */
.year-nav-sidebar {
  flex: 0 0 240px;
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  height: fit-content;
}

.year-nav-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 2px solid #f0f2f5;
}

.year-nav-header h3 {
  margin: 0;
  font-size: 18px;
  color: #303133;
}

.year-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.year-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid transparent;
}

.year-item:hover {
  background: #f5f7fa;
  transform: translateX(5px);
}

.year-item.active {
  background: #409eff;
  color: white;
  border-color: #409eff;
}

.year-item.active .match-count {
  background: white;
  color: #409eff;
}

.year-text {
  font-size: 15px;
  font-weight: 500;
}

.match-count {
  background: #f0f2f5;
  color: #606266;
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 10px;
  min-width: 24px;
  text-align: center;
}

/* 右侧视频区域 */
.video-main-content {
  flex: 1;
  background: white;
  border-radius: 12px;
  padding: 25px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.year-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 2px solid #f0f2f5;
}

.selected-year-title {
  margin: 0;
  font-size: 24px;
  color: #303133;
  display: flex;
  align-items: center;
  gap: 10px;
}

.year-stats {
  display: flex;
  gap: 10px;
}

/* 视频网格 - 一行三个 */
.video-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 25px;
}

@media (max-width: 1200px) {
  .video-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .video-grid {
    grid-template-columns: 1fr;
  }

  .matches-content {
    flex-direction: column;
  }

  .year-nav-sidebar {
    flex: none;
  }
}

/* 视频卡片样式 */
.video-card {
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 3px 15px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  border: 1px solid #ebeef5;
}

.video-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.video-thumbnail {
  position: relative;
  height: 200px;
  overflow: hidden;
}

.thumbnail-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.5s ease;
}

.video-card:hover .thumbnail-image {
  transform: scale(1.05);
}

.video-duration {
  position: absolute;
  bottom: 10px;
  right: 10px;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.play-button-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.3);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.video-card:hover .play-button-overlay {
  opacity: 1;
}

.play-icon {
  font-size: 48px;
  color: white;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
}

.video-badge {
  position: absolute;
  top: 10px;
  left: 10px;
}

.video-info {
  padding: 20px;
}

.video-title {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 12px 0;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.video-meta {
  display: flex;
  gap: 15px;
  margin-bottom: 12px;
  font-size: 13px;
  color: #909399;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.video-description {
  font-size: 14px;
  color: #606266;
  line-height: 1.5;
  margin-bottom: 15px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.match-result {
  padding: 10px;
  background: #f8f9fa;
  border-radius: 6px;
  margin-bottom: 15px;
}

.result-label {
  font-size: 13px;
  color: #909399;
}

.result-value {
  font-size: 14px;
  font-weight: 600;
  margin-left: 8px;
}

.result-value.win {
  color: #67c23a;
}

.result-value.lose {
  color: #f56c6c;
}

.result-value.draw {
  color: #909399;
}

.video-actions {
  display: flex;
  gap: 10px;
  margin-top: 15px;
}

/* 空状态 */
.empty-matches {
  padding: 60px 0;
  text-align: center;
  color: #909399;
}
</style>
