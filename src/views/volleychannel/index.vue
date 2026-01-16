<template>
  <div class="volleychannel-container">
    <!-- 圆形头像轮播区 -->
    <div class="avatar-slider-container">
      <div class="avatar-slider-wrapper">
        <div ref="sliderRef" class="avatar-slider">
          <div
            v-for="(athlete, index) in athletes"
            :key="athlete.id"
            class="avatar-item"
            :class="{ active: activeIndex === index }"
            @click="selectAthlete(index)"
          >
            <div class="avatar-image-wrapper">
              <div class="avatar-frame">
                <div class="avatar-decoration" />
                <img
                  :src="athlete.avatar"
                  :alt="athlete.name"
                  class="avatar-image"
                  @error="handleAvatarError"
                />
                <!-- 号码显示 -->
                <div v-if="athlete.number" class="avatar-number">
                  {{ athlete.number }}
                </div>
                <!-- 队长徽章 -->
                <div v-if="athlete.isCaptain" class="avatar-badge">
                  <el-icon><StarFilled /></el-icon>
                </div>
                <!-- 装饰点 -->
                <div class="avatar-dots">
                  <span class="dot dot-1" />
                  <span class="dot dot-2" />
                  <span class="dot dot-3" />
                  <span class="dot dot-4" />
                </div>
              </div>
            </div>
            <span class="avatar-name">{{ athlete.name }}</span>
            <span class="avatar-position">{{ athlete.position }}</span>
          </div>
        </div>
      </div>

      <!-- 导航箭头 -->
      <div class="slider-nav">
        <el-button
          circle
          class="nav-button prev-button"
          :disabled="activeIndex === 0"
          @click="scrollSlider('prev')"
        >
          <el-icon><ArrowLeft /></el-icon>
        </el-button>
        <el-button
          circle
          class="nav-button next-button"
          :disabled="activeIndex === athletes.length - 1"
          @click="scrollSlider('next')"
        >
          <el-icon><ArrowRight /></el-icon>
        </el-button>
      </div>
    </div>

    <!-- 运动员详细信息区域 -->
    <div v-if="activeAthlete" class="athlete-detail-section">
      <div class="detail-header">
        <div class="athlete-title">
          <h2 class="athlete-name">{{ activeAthlete.name }}</h2>
          <div class="athlete-tags">
            <el-tag type="success" size="small">{{
              activeAthlete.position
            }}</el-tag>
            <el-tag v-if="activeAthlete.number" type="warning" size="small">
              号码：{{ activeAthlete.number }}
            </el-tag>
            <el-tag v-if="activeAthlete.isCaptain" type="info" size="small">
              <el-icon><StarFilled /></el-icon>
              队长
            </el-tag>
          </div>
        </div>
        <div class="athlete-stats">
          <div class="stat-item">
            <span class="stat-label">身高</span>
            <span class="stat-value">{{ activeAthlete.height }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">体重</span>
            <span class="stat-value">{{ activeAthlete.weight }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">年龄</span>
            <span class="stat-value">{{ activeAthlete.age }}岁</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">扣高</span>
            <span class="stat-value">{{ activeAthlete.spike_height }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">摸高</span>
            <span class="stat-value">{{ activeAthlete.jump_height }}</span>
          </div>
        </div>
      </div>

      <div class="detail-content">
        <div class="detail-left">
          <div class="detail-image-container">
            <img
              :src="activeAthlete.image"
              :alt="activeAthlete.name"
              class="detail-image"
              @error="handleImageError"
            />
          </div>
          <div class="basic-info">
            <h3 class="info-title">基本信息</h3>
            <div class="info-item">
              <span class="info-label">出生地：</span>
              <span class="info-value">{{ activeAthlete.birthplace }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">入队时间：</span>
              <span class="info-value">{{ activeAthlete.join_date }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">主要荣誉：</span>
              <span class="info-value">{{ activeAthlete.major_honors }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">技术特点：</span>
              <span class="info-value">{{ activeAthlete.highlight }}</span>
            </div>
          </div>
        </div>

        <div class="detail-right">
          <div class="achievements-section">
            <h3 class="section-title">
              <el-icon><Trophy /></el-icon>
              主要成就
            </h3>
            <div class="achievements-list">
              <div
                v-for="(achievement, index) in activeAthlete.achievements"
                :key="index"
                class="achievement-item"
              >
                <el-icon class="achievement-icon"><Medal /></el-icon>
                <span class="achievement-text">{{ achievement }}</span>
              </div>
            </div>
          </div>

          <div v-if="activeAthlete.careerHighlights" class="career-section">
            <h3 class="section-title">
              <el-icon><Histogram /></el-icon>
              职业生涯亮点
            </h3>
            <div class="career-content">
              <p>{{ activeAthlete.careerHighlights }}</p>
            </div>
          </div>

          <div class="action-buttons">
            <el-button type="primary" @click="viewFullProfile">
              <el-icon><View /></el-icon>
              查看完整资料
            </el-button>
            <el-button type="success" @click="shareAthlete">
              <el-icon><Share /></el-icon>
              分享
            </el-button>
          </div>
        </div>
      </div>
    </div>

    <!-- 如果没有选中运动员 -->
    <div v-else class="no-athlete-selected">
      <el-empty description="请选择一位运动员查看详细信息" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, nextTick } from "vue";
import { useRouter } from "vue-router";
import {
  StarFilled,
  ArrowLeft,
  ArrowRight,
  Trophy,
  Medal,
  Histogram,
  View,
  Share,
  User,
  Top,
  Grid
} from "@element-plus/icons-vue";
import { getPlayers } from "@/api/volleyChannel";
import { almostWhole } from "chart.js/helpers";

const router = useRouter();
const sliderRef = ref<HTMLElement>();
const activeIndex = ref(0);
const currentPage = ref(0);
const visibleCount = ref(6); // 可见的头像数量

// 运动员数据
const athletes = ref([]);

// 初始化运动员
const initAthletes = async () => {
  const res = await getPlayers();
  console.log(res);
  athletes.value = res.data;
};
initAthletes();
// 当前选中的运动员
const activeAthlete = computed(() => {
  return athletes.value[activeIndex.value];
});

// 选择运动员
const selectAthlete = (index: number) => {
  activeIndex.value = index;
  // 计算当前页
  currentPage.value = Math.floor(index / visibleCount.value);
  scrollToActive();
};

// 滑动轮播
const scrollSlider = (direction: "prev" | "next") => {
  if (direction === "prev" && activeIndex.value > 0) {
    activeIndex.value--;
  } else if (
    direction === "next" &&
    activeIndex.value < athletes.value.length - 1
  ) {
    activeIndex.value++;
  }

  // 如果超出当前页，切换到上一页或下一页
  const pageIndex = Math.floor(activeIndex.value / visibleCount.value);
  if (pageIndex !== currentPage.value) {
    currentPage.value = pageIndex;
  }

  scrollToActive();
};

// 滚动到选中项
const scrollToActive = () => {
  nextTick(() => {
    if (!sliderRef.value) return;

    const activeItem = sliderRef.value.querySelector(
      ".avatar-item.active"
    ) as HTMLElement;
    if (activeItem) {
      sliderRef.value.scrollTo({
        left:
          activeItem.offsetLeft -
          sliderRef.value.clientWidth / 2 +
          activeItem.clientWidth / 2,
        behavior: "smooth"
      });
    }
  });
};

// 跳转到指定页
const goToPage = (page: number) => {
  currentPage.value = page;
  activeIndex.value = page * visibleCount.value;
  scrollToActive();
};

// 初始化
onMounted(() => {
  // 默认选中第一个
  if (athletes.value.length > 0) {
    selectAthlete(0);
  }

  // 添加拖动功能
  if (sliderRef.value) {
    let isDragging = false;
    let startX = 0;
    let scrollLeft = 0;

    sliderRef.value.addEventListener("mousedown", e => {
      isDragging = true;
      startX = e.pageX - sliderRef.value!.offsetLeft;
      scrollLeft = sliderRef.value!.scrollLeft;
    });

    sliderRef.value.addEventListener("mousemove", e => {
      if (!isDragging) return;
      e.preventDefault();
      const x = e.pageX - sliderRef.value!.offsetLeft;
      const walk = (x - startX) * 2;
      sliderRef.value!.scrollLeft = scrollLeft - walk;
    });

    sliderRef.value.addEventListener("mouseup", () => {
      isDragging = false;
    });

    sliderRef.value.addEventListener("mouseleave", () => {
      isDragging = false;
    });

    // 触摸屏支持
    sliderRef.value.addEventListener("touchstart", e => {
      isDragging = true;
      startX = e.touches[0].pageX - sliderRef.value!.offsetLeft;
      scrollLeft = sliderRef.value!.scrollLeft;
    });

    sliderRef.value.addEventListener("touchmove", e => {
      if (!isDragging) return;
      const x = e.touches[0].pageX - sliderRef.value!.offsetLeft;
      const walk = (x - startX) * 2;
      sliderRef.value!.scrollLeft = scrollLeft - walk;
    });

    sliderRef.value.addEventListener("touchend", () => {
      isDragging = false;
    });
  }
});

// 查看完整资料
const viewFullProfile = () => {
  router.push({
    name: "AthleteDetail",
    params: {
      athlete: JSON.stringify(activeAthlete.value)
    }
  });
};

// 分享运动员
const shareAthlete = () => {
  // 这里可以添加分享逻辑
  console.log("分享:", activeAthlete.value.name);
};

// 处理头像图片错误
const handleAvatarError = (event: Event) => {
  const img = event.target as HTMLImageElement;
  img.src = "https://via.placeholder.com/120/CCCCCC/666666?text=头像";
};

// 处理详情图片错误
const handleImageError = (event: Event) => {
  const img = event.target as HTMLImageElement;
  img.src = "https://via.placeholder.com/400x500/CCCCCC/666666?text=运动员";
};
</script>

<style scoped>
.volleychannel-container {
  padding: 20px 40px; /* 左右留空 */
  max-width: 1400px; /* 限制最大宽度 */
  margin: 0 auto; /* 居中 */
}

.page-header {
  text-align: center;
  margin-bottom: 30px;
  padding: 0 20px; /* 标题两边留空 */
}

.page-title {
  font-size: 28px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 8px;
}

.page-subtitle {
  font-size: 16px;
  color: #909399;
}

/* 头像轮播容器 - 两边留空 */
.avatar-slider-container {
  position: relative;
  width: 100%;
  padding: 20px 30px; /* 左右留空 */
  background: linear-gradient(to bottom, #f8fafc, #ffffff);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border-radius: 20px;
  margin-bottom: 30px;
  border: 1px solid #f0f2f5;
}

.avatar-slider-wrapper {
  width: 100%;
  overflow: hidden;
  padding: 10px 0;
}

/* 头像轮播 */
.avatar-slider {
  display: flex;
  gap: 20px;
  overflow-x: auto;
  scroll-behavior: smooth;
  padding: 10px 5px; /* 减少内边距 */
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  cursor: grab;
}

.avatar-slider::-webkit-scrollbar {
  display: none;
}

.avatar-slider:active {
  cursor: grabbing;
}

/* 头像项样式 */
.avatar-item {
  flex: 0 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  transition: all 0.3s ease;
  width: 100px;
}

.avatar-item:hover {
  transform: translateY(-3px);
}

/* 头像容器 */
.avatar-image-wrapper {
  position: relative;
  width: 90px;
  height: 90px;
  border-radius: 50%;
  overflow: visible;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 8px;
}

/* 头像框 */
.avatar-frame {
  position: relative;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  padding: 6px;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.4s ease;
}

.avatar-item.active .avatar-frame {
  box-shadow: 0 6px 20px rgba(64, 158, 255, 0.3);
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%,
  100% {
    box-shadow: 0 6px 20px rgba(64, 158, 255, 0.3);
  }
  50% {
    box-shadow: 0 8px 25px rgba(64, 158, 255, 0.4);
  }
}

/* 装饰圈 */
.avatar-decoration {
  position: absolute;
  width: calc(100% + 12px);
  height: calc(100% + 12px);
  border-radius: 50%;
  border: 1.5px dashed rgba(255, 255, 255, 0.4);
  animation: rotate 20s linear infinite;
  z-index: 1;
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* 头像图片 */
.avatar-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
  border: 3px solid white;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.1);
  position: relative;
  z-index: 2;
}

.avatar-item.active .avatar-image {
  border-color: #409eff;
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.2);
}

/* 运动员号码 */
.avatar-number {
  position: absolute;
  top: -5px;
  right: -5px;
  background: linear-gradient(135deg, #ff6b6b 0%, #ff8e8e 100%);
  color: white;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: bold;
  border: 2px solid white;
  box-shadow: 0 2px 6px rgba(255, 107, 107, 0.3);
  z-index: 3;
}

/* 队长徽章 */
.avatar-badge {
  position: absolute;
  bottom: -5px;
  right: -5px;
  background: linear-gradient(135deg, #e6a23c 0%, #f0c78a 100%);
  color: white;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid white;
  box-shadow: 0 2px 6px rgba(230, 162, 60, 0.3);
  z-index: 3;
}

.avatar-badge .el-icon {
  font-size: 14px;
}

/* 装饰点 */
.avatar-dots {
  position: absolute;
  width: 100%;
  height: 100%;
  z-index: 1;
}

.dot {
  position: absolute;
  width: 6px;
  height: 6px;
  background: white;
  border-radius: 50%;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  animation: dotPulse 2s infinite;
}

@keyframes dotPulse {
  0%,
  100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.2);
  }
}

.dot-1 {
  top: -3px;
  left: 50%;
  transform: translateX(-50%);
  animation-delay: 0s;
}
.dot-2 {
  top: 50%;
  right: -3px;
  transform: translateY(-50%);
  animation-delay: 0.5s;
}
.dot-3 {
  bottom: -3px;
  left: 50%;
  transform: translateX(-50%);
  animation-delay: 1s;
}
.dot-4 {
  top: 50%;
  left: -3px;
  transform: translateY(-50%);
  animation-delay: 1.5s;
}

/* 为每个运动员添加不同的背景色 */
.avatar-item:nth-child(6n + 1) .avatar-frame {
  background: linear-gradient(135deg, #ff6b6b 0%, #ff8e8e 100%);
}
.avatar-item:nth-child(6n + 2) .avatar-frame {
  background: linear-gradient(135deg, #4ecdc4 0%, #6ce6de 100%);
}
.avatar-item:nth-child(6n + 3) .avatar-frame {
  background: linear-gradient(135deg, #45b7d1 0%, #68d9f1 100%);
}
.avatar-item:nth-child(6n + 4) .avatar-frame {
  background: linear-gradient(135deg, #96ceb4 0%, #bae8d0 100%);
}
.avatar-item:nth-child(6n + 5) .avatar-frame {
  background: linear-gradient(135deg, #feca57 0%, #ffe08a 100%);
}
.avatar-item:nth-child(6n + 6) .avatar-frame {
  background: linear-gradient(135deg, #ff9ff3 0%, #ffc2f8 100%);
}

/* 当选中时统一使用蓝色 */
.avatar-item.active .avatar-frame {
  background: linear-gradient(135deg, #409eff 0%, #66b1ff 100%) !important;
}

/* 运动员姓名和位置 */
.avatar-name {
  margin-top: 6px;
  font-size: 13px;
  font-weight: 600;
  color: #303133;
  text-align: center;
  transition: color 0.3s ease;
}

.avatar-item.active .avatar-name {
  color: #409eff;
  font-weight: 700;
}

.avatar-position {
  font-size: 11px;
  color: #909399;
  margin-top: 2px;
  padding: 2px 8px;
  background: #f0f2f5;
  border-radius: 10px;
  font-weight: 500;
}

.avatar-item.active .avatar-position {
  background: #e8f4ff;
  color: #409eff;
}

/* 导航按钮 */
.slider-nav {
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  transform: translateY(-50%);
  display: flex;
  justify-content: space-between;
  pointer-events: none;
  z-index: 2;
  padding: 0 10px;
}

.nav-button {
  pointer-events: auto;
  background: white;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.15);
  width: 30px;
  height: 30px;
  border: none;
}

.nav-button:hover {
  background: #f5f7fa;
  transform: scale(1.1);
}

.nav-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 指示器 */
.slider-indicators {
  display: flex;
  justify-content: center;
  gap: 8px;
  margin-top: 15px;
}

.indicator {
  width: 25px;
  height: 4px;
  background: #dcdfe6;
  border-radius: 2px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.indicator.active {
  background: #409eff;
  width: 35px;
}

.indicator:hover {
  background: #c0c4cc;
}

/* 运动员详细信息区域 - 两边留空 */
.athlete-detail-section {
  background: white;
  border-radius: 20px;
  padding: 40px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.1);
  animation: fadeIn 0.5s ease;
  margin-top: 20px;
  border: 1px solid #f0f2f5;
  max-width: 100%; /* 限制最大宽度 */
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 40px;
  padding-bottom: 25px;
  border-bottom: 3px solid #f0f2f5;
}

.athlete-title {
  flex: 1;
  padding-right: 20px; /* 右边留空 */
}

.athlete-title h2 {
  font-size: 28px;
  font-weight: bold;
  color: #303133;
  margin: 0 0 20px 0;
  background: linear-gradient(135deg, #409eff, #66b1ff);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.athlete-tags {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.athlete-stats {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
  padding-left: 10px; /* 左边留空 */
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 85px;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 12px;
  border: 1px solid #ebeef5;
}

.stat-label {
  font-size: 13px;
  color: #909399;
  margin-bottom: 8px;
  font-weight: 500;
}

.stat-value {
  font-size: 18px;
  font-weight: bold;
  color: #303133;
}

/* 详情内容 - 两边留空 */
.detail-content {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 40px;
  padding: 10px 0; /* 上下留空 */
}

@media (max-width: 1200px) {
  .detail-content {
    gap: 30px;
  }
}

@media (max-width: 992px) {
  .detail-content {
    grid-template-columns: 1fr;
    gap: 35px;
  }
}

.detail-left {
  display: flex;
  flex-direction: column;
  gap: 30px;
}

.detail-image-container {
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.12);
  border: 1px solid #ebeef5;
}

.detail-image {
  width: 100%;
  height: auto;
  display: block;
}

.basic-info {
  background: #f8f9fa;
  border-radius: 16px;
  padding: 25px;
  border: 1px solid #ebeef5;
}

.info-title {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 20px 0;
  padding-bottom: 12px;
  border-bottom: 3px solid #409eff;
  display: flex;
  align-items: center;
  gap: 8px;
}

.info-item {
  margin-bottom: 18px;
  display: flex;
  padding: 10px 0;
  border-bottom: 1px solid #f0f0f0;
}

.info-item:last-child {
  margin-bottom: 0;
  border-bottom: none;
}

.info-label {
  font-size: 14px;
  color: #606266;
  font-weight: 600;
  min-width: 95px;
}

.info-value {
  font-size: 14px;
  color: #303133;
  flex: 1;
  line-height: 1.6;
}

.detail-right {
  display: flex;
  flex-direction: column;
  gap: 30px;
}

.achievements-section,
.career-section {
  background: #fff;
  border-radius: 16px;
  padding: 30px;
  border: 1px solid #ebeef5;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
}

.section-title {
  font-size: 20px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 25px 0;
  display: flex;
  align-items: center;
  gap: 10px;
}

.achievements-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.achievement-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px;
  background: linear-gradient(to right, #f0f9ff, #ffffff);
  border-radius: 12px;
  border-left: 5px solid #409eff;
  transition: all 0.3s ease;
}

.achievement-item:hover {
  transform: translateX(5px);
  box-shadow: 0 4px 15px rgba(64, 158, 255, 0.1);
}

.achievement-icon {
  color: #409eff;
  margin-top: 2px;
  flex-shrink: 0;
  font-size: 18px;
}

.achievement-text {
  font-size: 14px;
  color: #303133;
  line-height: 1.6;
}

.career-section {
  background: linear-gradient(to bottom, #f6ffed, #ffffff);
}

.career-content p {
  margin: 0;
  font-size: 14px;
  color: #606266;
  line-height: 1.7;
  text-align: justify;
}

.action-buttons {
  display: flex;
  gap: 20px;
  margin-top: 30px;
  padding: 10px 0; /* 上下留空 */
}

.action-buttons .el-button {
  padding: 12px 28px;
  font-size: 15px;
  font-weight: 500;
  border-radius: 10px;
  box-shadow: 0 4px 15px rgba(64, 158, 255, 0.15);
  transition: all 0.3s ease;
}

.action-buttons .el-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(64, 158, 255, 0.25);
}

.no-athlete-selected {
  padding: 80px 0;
  text-align: center;
  background: #f8f9fa;
  border-radius: 20px;
  margin-top: 20px;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .volleychannel-container {
    padding: 20px 30px;
  }

  .avatar-slider-container {
    padding: 20px 25px;
  }
}

@media (max-width: 992px) {
  .volleychannel-container {
    padding: 20px;
  }

  .avatar-slider-container {
    padding: 20px;
  }

  .athlete-detail-section {
    padding: 30px;
  }

  .detail-header {
    flex-direction: column;
    gap: 25px;
  }

  .athlete-stats {
    padding-left: 0;
    justify-content: flex-start;
  }

  .athlete-title {
    padding-right: 0;
  }
}

@media (max-width: 768px) {
  .volleychannel-container {
    padding: 15px;
  }

  .page-header {
    padding: 0 10px;
  }

  .avatar-slider-container {
    padding: 15px;
  }

  .avatar-slider {
    padding: 10px 2px;
    gap: 15px;
  }

  .avatar-image-wrapper {
    width: 75px;
    height: 75px;
  }

  .avatar-item {
    width: 85px;
  }

  .avatar-number {
    width: 20px;
    height: 20px;
    font-size: 10px;
    top: -4px;
    right: -4px;
  }

  .avatar-badge {
    width: 22px;
    height: 22px;
    bottom: -4px;
    right: -4px;
  }

  .avatar-name {
    font-size: 12px;
  }

  .avatar-position {
    font-size: 10px;
    padding: 2px 6px;
  }

  .slider-nav {
    display: none;
  }

  .athlete-detail-section {
    padding: 20px;
  }

  .detail-content {
    gap: 25px;
  }

  .athlete-title h2 {
    font-size: 24px;
  }

  .achievements-section,
  .career-section {
    padding: 20px;
  }

  .basic-info {
    padding: 20px;
  }
}

@media (max-width: 576px) {
  .volleychannel-container {
    padding: 12px;
  }

  .page-title {
    font-size: 22px;
  }

  .avatar-slider {
    gap: 12px;
  }

  .avatar-image-wrapper {
    width: 65px;
    height: 65px;
  }

  .avatar-item {
    width: 75px;
  }

  .action-buttons {
    flex-direction: column;
  }

  .action-buttons .el-button {
    width: 100%;
  }

  .stat-item {
    min-width: 70px;
    padding: 12px;
  }

  .stat-label {
    font-size: 12px;
  }

  .stat-value {
    font-size: 16px;
  }

  .athlete-detail-section {
    padding: 16px;
  }
}
</style>
