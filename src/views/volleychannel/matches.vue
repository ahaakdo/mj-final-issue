<template>
  <div class="matches-container">
    <div class="page-header">
      <h1 class="page-title">女排经典赛事</h1>
      <p class="page-subtitle">回顾历届重要比赛，重温经典瞬间</p>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading-container">
      <el-skeleton :rows="6" animated />
    </div>

    <!-- 错误状态 -->
    <div v-else-if="error" class="error-container">
      <el-result icon="error" title="加载失败" :sub-title="error">
        <template #extra>
          <el-button type="primary" @click="fetchMatches">重试</el-button>
        </template>
      </el-result>
    </div>

    <!-- 正常显示 -->
    <div v-else class="matches-content">
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
            <el-button type="primary" size="small" @click="refreshData">
              <el-icon><Refresh /></el-icon>
              刷新数据
            </el-button>
          </div>
        </div>

        <!-- 视频网格 - 一行三个 -->
        <div v-if="filteredMatches.length > 0" class="video-grid">
          <div
            v-for="match in filteredMatches"
            :key="match.id"
            class="video-card"
          >
            <!-- 视频缩略图 - 点击可跳转 -->
            <div class="video-thumbnail" @click="openVideo(match)">
              <!-- 缩略图加载状态 -->
              <div v-if="thumbnailLoading[match.id]" class="thumbnail-loading">
                <el-skeleton-item
                  variant="image"
                  style="width: 100%; height: 100%"
                />
              </div>

              <img
                v-else
                :src="getMatchThumbnail(match)"
                :alt="match.title"
                class="thumbnail-image"
                @load="handleThumbnailLoad(match.id)"
                @error="handleImageError(match, $event)"
              />

              <div class="video-duration">
                {{ formatDuration(match.duration) }}
              </div>
              <div class="play-button-overlay">
                <el-icon class="play-icon"><VideoPlay /></el-icon>
              </div>
              <div class="video-badge">
                <el-tag size="small" :type="match.tag_type || 'info'">
                  {{ match.type }}
                </el-tag>
              </div>
            </div>

            <div class="video-info">
              <!-- 标题点击也可跳转 -->
              <h3 class="video-title" @click="openVideo(match)">
                {{ match.title }}
              </h3>

              <div class="video-meta">
                <span class="meta-item">
                  <el-icon><Clock /></el-icon>
                  {{ formatDate(match.date) }}
                </span>
                <span class="meta-item">
                  <el-icon><Location /></el-icon>
                  {{ match.location || "未指定" }}
                </span>
              </div>

              <p class="video-description">{{ match.description }}</p>

              <div class="match-result">
                <span class="result-label">比赛结果：</span>
                <span
                  class="result-value"
                  :class="getResultClass(match.result_type)"
                >
                  {{ match.result || "未记录" }}
                </span>
              </div>

              <!-- 显示视频链接 -->
              <div v-if="match.video_url" class="video-link-preview">
                <el-tag type="success" size="small">
                  <el-icon><VideoPlay /></el-icon>
                  有视频资源
                </el-tag>
                <span class="link-text" @click="copyVideoLink(match)">
                  点击上方图片观看
                </span>
              </div>
              <div v-else class="video-link-preview">
                <el-tag type="info" size="small">
                  <el-icon><VideoCamera /></el-icon>
                  暂无视频
                </el-tag>
              </div>

              <div class="video-actions">
                <el-button
                  type="primary"
                  size="small"
                  :disabled="!match.video_url"
                  @click="openVideo(match)"
                >
                  <el-icon><VideoPlay /></el-icon>
                  {{ match.video_url ? "观看视频" : "暂无视频" }}
                </el-button>
                <el-button
                  type="success"
                  size="small"
                  @click="viewDetails(match)"
                >
                  <el-icon><View /></el-icon>
                  查看详情
                </el-button>
                <el-button type="info" size="small" @click="shareMatch(match)">
                  <el-icon><Share /></el-icon>
                  分享
                </el-button>
              </div>
            </div>
          </div>
        </div>

        <!-- 无数据提示 -->
        <div v-else class="empty-matches">
          <el-empty description="该年份暂无赛事数据" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import {
  Calendar,
  VideoPlay,
  Clock,
  Location,
  View,
  Share,
  Refresh,
  VideoCamera
} from "@element-plus/icons-vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { getMatches } from "@/api/matches";

// 定义赛事接口
interface Match {
  id: number;
  title: string;
  date: string;
  location: string;
  description: string;
  thumbnail: string;
  video_url: string;
  duration: string;
  type: string;
  tag_type: string;
  result: string;
  result_type: string;
  year: number;
  created_at: string;
  updated_at: string;
}

// 响应式数据
const loading = ref(true);
const error = ref<string | null>(null);
const allMatches = ref<Match[]>([]);
const thumbnailLoading = ref<Record<number, boolean>>({});
const thumbnailCache = ref<Record<number, string>>({});
const videoInfoCache = ref<Record<number, any>>({});

// 默认图片映射
const defaultThumbnails: Record<string, string> = {
  奥运会: "https://via.placeholder.com/350x200/FF6B6B/FFFFFF?text=奥运赛事",
  世界杯: "https://via.placeholder.com/350x200/4ECDC4/FFFFFF?text=世界杯",
  世锦赛: "https://via.placeholder.com/350x200/45B7D1/FFFFFF?text=世锦赛",
  亚运会: "https://via.placeholder.com/350x200/96CEB4/FFFFFF?text=亚运会",
  世界联赛: "https://via.placeholder.com/350x200/FECA57/FFFFFF?text=世界联赛",
  默认: "https://via.placeholder.com/350x200/CCCCCC/666666?text=排球比赛"
};

// 年份列表
const years = computed(() => {
  const yearSet = new Set<number>();
  allMatches.value.forEach(match => {
    if (match.year) {
      yearSet.add(match.year);
    }
  });
  return Array.from(yearSet).sort((a, b) => b - a);
});

// 当前选中的年份
const selectedYear = ref<number | null>(null);

// 获取比赛数据
const fetchMatches = async () => {
  loading.value = true;
  error.value = null;

  try {
    const result = await getMatches();
    console.log("API返回数据:", result);

    if (result && (result.success || result.code === 200)) {
      const data = result.data || result;
      allMatches.value = Array.isArray(data) ? data : [];

      console.log("加载的比赛数据:", allMatches.value);

      // 如果数据不为空，设置默认选中年份
      if (allMatches.value.length > 0) {
        const yearsArray = allMatches.value.map(m => m.year).filter(y => y);
        if (yearsArray.length > 0) {
          const latestYear = Math.max(...yearsArray);
          selectedYear.value = latestYear;
        }
      }

      // 预加载第一个比赛的缩略图
      if (allMatches.value.length > 0) {
        preloadThumbnails();
      }

      ElMessage.success(`成功加载 ${allMatches.value.length} 场比赛数据`);
    } else {
      error.value = result?.message || "获取数据失败";
      ElMessage.error(error.value);
    }
  } catch (err: any) {
    error.value = err.message || "网络请求失败";
    ElMessage.error(error.value);
    console.error("获取比赛数据失败:", err);
  } finally {
    loading.value = false;
  }
};

// 预加载缩略图
const preloadThumbnails = () => {
  const firstThreeMatches = allMatches.value.slice(0, 3);
  firstThreeMatches.forEach(match => {
    if (match.id && !thumbnailCache.value[match.id]) {
      getMatchThumbnail(match);
    }
  });
};

// 计算每个年份的比赛数量
const getYearMatchCount = (year: number): number => {
  return allMatches.value.filter(match => match.year === year).length;
};

// 选择年份
const selectYear = (year: number) => {
  selectedYear.value = year;
  window.scrollTo({ top: 0, behavior: "smooth" });
};

// 获取当前年份的赛事
const filteredMatches = computed(() => {
  if (!selectedYear.value) return [];
  return allMatches.value.filter(match => match.year === selectedYear.value);
});

// ==================== 视频封面处理核心逻辑 ====================

// 提取YouTube视频ID
const extractYouTubeId = (url: string): string | null => {
  const patterns = [
    /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i,
    /youtube\.com\/watch\?v=([^&]+)/i,
    /youtu\.be\/([^?]+)/i
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  return null;
};

// 提取B站视频ID (BV号)
const extractBilibiliId = (url: string): string | null => {
  const patterns = [
    /bilibili\.com\/video\/(BV[0-9A-Za-z]{10})/i,
    /b23\.tv\/[^\/]+\/(BV[0-9A-Za-z]{10})/i,
    /BV[0-9A-Za-z]{10}/i
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return match[1] || match[0];
    }
  }
  return null;
};

// 提取腾讯视频ID
const extractQQVideoId = (url: string): string | null => {
  const match = url.match(/v\.qq\.com\/x\/cover\/[^\/]+\/([^\.]+)\.html/i);
  return match ? match[1] : null;
};

// 获取YouTube视频封面
const getYouTubeThumbnail = (videoId: string): string[] => {
  // 返回不同质量的封面图片URL数组
  return [
    `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`, // 最高质量
    `https://img.youtube.com/vi/${videoId}/sddefault.jpg`, // 标准质量
    `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`, // 高质量
    `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`, // 中等质量
    `https://img.youtube.com/vi/${videoId}/default.jpg` // 默认质量
  ];
};

// 获取B站视频封面
const getBilibiliThumbnail = async (bvid: string): Promise<string | null> => {
  try {
    // 直接构造封面URL (B站封面有固定格式)
    return `https://i0.hdslb.com/bfs/archive/${bvid}.jpg`;

    // 如果需要获取更精确的信息，可以使用B站API
    // const response = await fetch(`https://api.bilibili.com/x/web-interface/view?bvid=${bvid}`);
    // if (response.ok) {
    //   const data = await response.json();
    //   return data.data?.pic || null;
    // }
  } catch (error) {
    console.error("获取B站封面失败:", error);
  }
  return null;
};

// 获取腾讯视频封面
const getQQVideoThumbnail = (vid: string): string => {
  return `https://v.qq.com/x/cover/${vid}.html`;
};

// 从视频URL获取封面
const getThumbnailFromVideoUrl = async (
  videoUrl: string,
  matchId: number
): Promise<string> => {
  // 检查缓存
  if (thumbnailCache.value[matchId]) {
    return thumbnailCache.value[matchId];
  }

  // YouTube视频
  const youtubeId = extractYouTubeId(videoUrl);
  if (youtubeId) {
    const thumbnails = getYouTubeThumbnail(youtubeId);
    // 尝试从最高质量开始加载
    for (const thumbnailUrl of thumbnails) {
      if (await testImageUrl(thumbnailUrl)) {
        thumbnailCache.value[matchId] = thumbnailUrl;
        return thumbnailUrl;
      }
    }
  }

  // B站视频
  const bilibiliId = extractBilibiliId(videoUrl);
  if (bilibiliId) {
    const thumbnail = await getBilibiliThumbnail(bilibiliId);
    if (thumbnail) {
      thumbnailCache.value[matchId] = thumbnail;
      return thumbnail;
    }
  }

  // 腾讯视频
  const qqVideoId = extractQQVideoId(videoUrl);
  if (qqVideoId) {
    const thumbnail = getQQVideoThumbnail(qqVideoId);
    thumbnailCache.value[matchId] = thumbnail;
    return thumbnail;
  }

  // 通用视频链接，尝试获取OG图片
  try {
    const ogImage = await getOpenGraphImage(videoUrl);
    if (ogImage) {
      thumbnailCache.value[matchId] = ogImage;
      return ogImage;
    }
  } catch (error) {
    console.error("获取OG图片失败:", error);
  }

  return "";
};

// 测试图片URL是否可用
const testImageUrl = (url: string): Promise<boolean> => {
  return new Promise(resolve => {
    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = url;

    // 设置超时
    setTimeout(() => resolve(false), 2000);
  });
};

// 获取Open Graph图片
const getOpenGraphImage = async (url: string): Promise<string | null> => {
  try {
    // 注意：由于CORS限制，可能需要后端代理
    const proxyUrl = `/api/proxy?url=${encodeURIComponent(url)}`;
    const response = await fetch(proxyUrl, {
      method: "GET",
      headers: {
        Accept: "text/html"
      }
    });

    if (response.ok) {
      const html = await response.text();
      const ogImageMatch = html.match(
        /<meta[^>]*property="og:image"[^>]*content="([^"]+)"/i
      );
      return ogImageMatch ? ogImageMatch[1] : null;
    }
  } catch (error) {
    console.error("获取OG图片失败:", error);
  }
  return null;
};

// 获取视频信息（标题、描述等）
const getVideoInfo = async (videoUrl: string): Promise<any> => {
  try {
    const youtubeId = extractYouTubeId(videoUrl);
    if (youtubeId) {
      // 可以使用YouTube Data API获取更多信息
      // 这里返回基本格式
      return {
        source: "youtube",
        id: youtubeId
      };
    }

    const bilibiliId = extractBilibiliId(videoUrl);
    if (bilibiliId) {
      return {
        source: "bilibili",
        id: bilibiliId
      };
    }
  } catch (error) {
    console.error("获取视频信息失败:", error);
  }
  return null;
};

// 获取缩略图（主函数）
const getMatchThumbnail = (match: Match): string => {
  // 如果有数据库中的缩略图，优先使用
  if (match.thumbnail && isValidUrl(match.thumbnail)) {
    return match.thumbnail;
  }

  // 如果有视频链接，尝试获取视频封面
  if (match.video_url && isValidUrl(match.video_url)) {
    // 设置加载状态
    thumbnailLoading.value[match.id] = true;

    // 异步获取封面
    getThumbnailFromVideoUrl(match.video_url, match.id)
      .then(thumbnail => {
        if (thumbnail) {
          thumbnailCache.value[match.id] = thumbnail;
          // 可以在这里触发组件更新
          console.log(`为比赛 ${match.id} 获取到封面:`, thumbnail);
        }
      })
      .catch(error => {
        console.error(`获取比赛 ${match.id} 封面失败:`, error);
      })
      .finally(() => {
        thumbnailLoading.value[match.id] = false;
      });

    // 返回一个占位图，等待真实封面加载
    return getDefaultThumbnailByType(match.type);
  }

  // 使用默认图片
  return getDefaultThumbnailByType(match.type);
};

// 根据比赛类型获取默认缩略图
const getDefaultThumbnailByType = (type: string): string => {
  return defaultThumbnails[type] || defaultThumbnails.默认;
};

// 验证URL格式
const isValidUrl = (urlString: string): boolean => {
  try {
    const url = new URL(urlString);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch (err) {
    return false;
  }
};

// ==================== 其他辅助函数 ====================

// 获取结果类型对应的CSS类
const getResultClass = (resultType: string): string => {
  if (resultType === "win") return "win";
  if (resultType === "lose" || resultType === "loss") return "lose";
  return "draw";
};

// 格式化日期
const formatDate = (dateStr: string): string => {
  if (!dateStr) return "日期未定";
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      return dateStr;
    }
    return date.toLocaleDateString("zh-CN", {
      year: "numeric",
      month: "long",
      day: "numeric"
    });
  } catch (e) {
    console.error("日期格式化错误:", e);
    return dateStr;
  }
};

// 格式化时长
const formatDuration = (duration: string): string => {
  if (!duration) return "时长未定";

  try {
    if (typeof duration === "string") {
      if (duration.includes(":")) {
        const parts = duration.split(":");
        if (parts.length >= 3) {
          const hours = parseInt(parts[0]) || 0;
          const minutes = parseInt(parts[1]) || 0;
          const seconds = Math.floor(parseFloat(parts[2]) || 0);

          if (hours > 0) {
            return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
          } else {
            return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
          }
        }
        return duration;
      }
    }

    const seconds = parseInt(duration);
    if (!isNaN(seconds)) {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      const secs = seconds % 60;

      if (hours > 0) {
        return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
      } else {
        return `${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
      }
    }

    return duration;
  } catch (e) {
    console.error("时长格式化错误:", e);
    return duration;
  }
};

// 缩略图加载完成处理
const handleThumbnailLoad = (matchId: number) => {
  thumbnailLoading.value[matchId] = false;
};

// 图片加载错误处理
const handleImageError = (match: Match, event: Event) => {
  const img = event.target as HTMLImageElement;
  console.warn(`图片加载失败: ${match.title}`, img.src);

  // 尝试使用备用方案
  if (match.video_url) {
    // 如果是YouTube视频，尝试低质量封面
    const youtubeId = extractYouTubeId(match.video_url);
    if (youtubeId) {
      const fallbackThumbnails = getYouTubeThumbnail(youtubeId);
      // 跳过第一个（因为第一个失败了），尝试其他质量
      for (let i = 1; i < fallbackThumbnails.length; i++) {
        img.src = fallbackThumbnails[i];
        break;
      }
    } else {
      // 使用默认图片
      img.src = getDefaultThumbnailByType(match.type);
    }
  } else {
    img.src = getDefaultThumbnailByType(match.type);
  }

  thumbnailLoading.value[match.id] = false;
};

// 打开视频链接
const openVideo = (match: Match): void => {
  if (match.video_url) {
    if (isValidUrl(match.video_url)) {
      window.open(match.video_url, "_blank");
      ElMessage.success(`正在打开: ${match.title}`);

      // 记录点击统计
      logVideoClick(match);
    } else {
      ElMessage.error("视频链接格式不正确");
    }
  } else {
    ElMessage.warning("暂无视频资源，正在查看详情...");
    viewDetails(match);
  }
};

// 记录视频点击
const logVideoClick = (match: Match) => {
  console.log("用户点击视频:", {
    id: match.id,
    title: match.title,
    url: match.video_url,
    timestamp: new Date().toISOString()
  });

  // 可以发送到后端进行统计
  // fetch('/api/analytics/video-click', {
  //   method: 'POST',
  //   body: JSON.stringify({
  //     matchId: match.id,
  //     videoUrl: match.video_url
  //   })
  // });
};

// 查看详情
const viewDetails = async (match: Match): Promise<void> => {
  try {
    await ElMessageBox.confirm(
      `比赛：${match.title}\n\n日期：${formatDate(match.date)}\n地点：${match.location}\n结果：${match.result}\n\n${match.description}`,
      "比赛详情",
      {
        confirmButtonText: "观看视频",
        cancelButtonText: "关闭",
        type: "info",
        center: true
      }
    );
    openVideo(match);
  } catch {
    console.log("用户关闭了详情弹窗");
  }
};

// 复制视频链接
const copyVideoLink = async (match: Match): Promise<void> => {
  if (match.video_url) {
    try {
      await navigator.clipboard.writeText(match.video_url);
      ElMessage.success("视频链接已复制到剪贴板");
    } catch (err) {
      const textArea = document.createElement("textarea");
      textArea.value = match.video_url;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      ElMessage.success("视频链接已复制");
    }
  } else {
    ElMessage.warning("暂无视频链接可复制");
  }
};

// 分享比赛
const shareMatch = async (match: Match): Promise<void> => {
  const shareData = {
    title: match.title,
    text: `${match.description}\n比赛结果：${match.result}`,
    url: match.video_url || window.location.href
  };

  try {
    if (navigator.share) {
      await navigator.share(shareData);
      ElMessage.success("分享成功");
    } else {
      const shareText = `${match.title}\n${match.description}\n比赛结果：${match.result}\n${match.video_url || "视频链接待更新"}`;
      await navigator.clipboard.writeText(shareText);
      ElMessage.success("分享内容已复制到剪贴板");
    }
  } catch (err) {
    console.log("分享取消或失败:", err);
  }
};

// 刷新数据
const refreshData = (): void => {
  // 清空缓存
  thumbnailCache.value = {};
  thumbnailLoading.value = {};
  videoInfoCache.value = {};

  fetchMatches();
  ElMessage.info("正在刷新数据...");
};

// 组件挂载时获取数据
onMounted(() => {
  fetchMatches();
});

// 监听年份变化，预加载新年份的缩略图
watch(selectedYear, () => {
  if (filteredMatches.value.length > 0) {
    setTimeout(() => {
      filteredMatches.value.slice(0, 3).forEach(match => {
        if (match.id && !thumbnailCache.value[match.id]) {
          getMatchThumbnail(match);
        }
      });
    }, 100);
  }
});
</script>

<style scoped>
.matches-container {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
  background: linear-gradient(to bottom, #f8f9fa, #ffffff);
  min-height: 100vh;
}

.page-header {
  text-align: center;
  margin-bottom: 30px;
  padding: 25px 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 16px;
  color: white;
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.3);
}

.page-title {
  font-size: 36px;
  font-weight: bold;
  margin-bottom: 10px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.page-subtitle {
  font-size: 18px;
  opacity: 0.9;
  font-weight: 300;
}

/* 加载状态 */
.loading-container {
  padding: 60px 40px;
  background: white;
  border-radius: 16px;
  margin-top: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

/* 错误状态 */
.error-container {
  padding: 80px 40px;
  text-align: center;
  background: white;
  border-radius: 16px;
  margin-top: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.matches-content {
  display: flex;
  gap: 30px;
  margin-top: 20px;
}

/* 左侧年份导航 */
.year-nav-sidebar {
  flex: 0 0 260px;
  background: white;
  border-radius: 16px;
  padding: 25px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  height: fit-content;
  position: sticky;
  top: 20px;
}

.year-nav-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 25px;
  padding-bottom: 20px;
  border-bottom: 2px solid #f0f2f5;
}

.year-nav-header h3 {
  margin: 0;
  font-size: 20px;
  color: #303133;
  font-weight: 600;
}

.year-nav-header .el-icon {
  font-size: 24px;
  color: #409eff;
}

.year-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.year-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 18px;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid transparent;
  background: #f8f9fa;
}

.year-item:hover {
  background: #e6f7ff;
  transform: translateX(5px);
  border-color: #bae7ff;
}

.year-item.active {
  background: linear-gradient(135deg, #409eff, #66b1ff);
  color: white;
  border-color: #409eff;
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.3);
}

.year-item.active .match-count {
  background: rgba(255, 255, 255, 0.9);
  color: #409eff;
  font-weight: bold;
}

.year-text {
  font-size: 16px;
  font-weight: 500;
}

.match-count {
  background: #e8eaed;
  color: #606266;
  font-size: 13px;
  padding: 4px 10px;
  border-radius: 20px;
  min-width: 28px;
  text-align: center;
  font-weight: 500;
  transition: all 0.3s ease;
}

/* 右侧视频区域 */
.video-main-content {
  flex: 1;
  background: white;
  border-radius: 16px;
  padding: 30px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.year-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 35px;
  padding-bottom: 25px;
  border-bottom: 3px solid #f0f2f5;
}

.selected-year-title {
  margin: 0;
  font-size: 28px;
  color: #303133;
  display: flex;
  align-items: center;
  gap: 12px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.year-stats {
  display: flex;
  gap: 12px;
  align-items: center;
}

/* 视频网格 - 一行三个 */
.video-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 30px;
}

@media (max-width: 1200px) {
  .video-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 992px) {
  .matches-content {
    flex-direction: column;
  }

  .year-nav-sidebar {
    flex: none;
    position: static;
    width: 100%;
  }

  .video-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .video-grid {
    grid-template-columns: 1fr;
  }

  .matches-container {
    padding: 15px;
  }

  .page-title {
    font-size: 28px;
  }

  .selected-year-title {
    font-size: 24px;
  }
}

/* 视频卡片样式 */
.video-card {
  background: #fff;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  transition: all 0.4s ease;
  border: 1px solid #ebeef5;
  position: relative;
}

.video-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.15);
  border-color: #409eff;
}

.video-thumbnail {
  position: relative;
  height: 220px;
  overflow: hidden;
  cursor: pointer;
  background: #f5f7fa; /* 添加背景色，避免加载时空白 */
}

.thumbnail-loading {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(90deg, #f0f2f5 25%, #e6e8eb 50%, #f0f2f5 75%);
  background-size: 200% 100%;
  animation: loading 1.5s infinite;
}

@keyframes loading {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

.thumbnail-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.6s ease;
  background: #f5f7fa; /* 图片加载失败时的背景色 */
}

.video-card:hover .thumbnail-image {
  transform: scale(1.08);
}

.video-duration {
  position: absolute;
  bottom: 12px;
  right: 12px;
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 5px 10px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  backdrop-filter: blur(4px);
  z-index: 2;
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
  background: rgba(0, 0, 0, 0.4);
  opacity: 0;
  transition: opacity 0.3s ease;
  z-index: 1;
}

.video-card:hover .play-button-overlay {
  opacity: 1;
}

.play-icon {
  font-size: 56px;
  color: white;
  filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3));
  transition: transform 0.3s ease;
}

.video-card:hover .play-icon {
  transform: scale(1.1);
}

.video-badge {
  position: absolute;
  top: 12px;
  left: 12px;
  z-index: 2;
}

.video-info {
  padding: 24px;
}

.video-title {
  font-size: 20px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 16px 0;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  cursor: pointer;
  transition: color 0.3s ease;
}

.video-title:hover {
  color: #409eff;
}

.video-meta {
  display: flex;
  gap: 20px;
  margin-bottom: 16px;
  font-size: 14px;
  color: #909399;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.meta-item .el-icon {
  font-size: 16px;
}

.video-description {
  font-size: 15px;
  color: #606266;
  line-height: 1.6;
  margin-bottom: 20px;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.match-result {
  padding: 14px;
  background: linear-gradient(to right, #f8f9fa, #ffffff);
  border-radius: 10px;
  margin-bottom: 18px;
  border-left: 4px solid #409eff;
}

.result-label {
  font-size: 14px;
  color: #909399;
  font-weight: 500;
}

.result-value {
  font-size: 16px;
  font-weight: 600;
  margin-left: 10px;
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

.video-link-preview {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
  padding: 12px;
  background: #f0f9ff;
  border-radius: 8px;
  border: 1px solid #d9ecff;
}

.link-text {
  font-size: 14px;
  color: #409eff;
  cursor: pointer;
  transition: color 0.3s ease;
}

.link-text:hover {
  color: #3375b9;
  text-decoration: underline;
}

.video-actions {
  display: flex;
  gap: 12px;
  margin-top: 20px;
}

.video-actions .el-button {
  flex: 1;
  padding: 10px 16px;
  font-size: 14px;
  font-weight: 500;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.video-actions .el-button:hover {
  transform: translateY(-2px);
}

.video-actions .el-button:first-child {
  background: linear-gradient(135deg, #409eff, #66b1ff);
  border: none;
}

/* 空状态 */
.empty-matches {
  padding: 80px 0;
  text-align: center;
  color: #909399;
  background: #f8f9fa;
  border-radius: 16px;
  margin-top: 20px;
}

/* 滚动条样式 */
.year-list::-webkit-scrollbar {
  width: 6px;
}

.year-list::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.year-list::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.year-list::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

/* 缩略图加载动画 */
.thumbnail-image {
  opacity: 1;
  transition: opacity 0.3s ease;
}

.thumbnail-image[src*="placeholder"] {
  opacity: 0.7;
}
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
  padding: 25px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 16px;
  color: white;
}
.matches-content {
  display: flex;
  gap: 30px;
}
.year-nav-sidebar {
  flex: 0 0 260px;
  background: white;
  border-radius: 16px;
  padding: 25px;
  height: fit-content;
  position: sticky;
  top: 20px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
}
.video-main-content {
  flex: 1;
  background: white;
  border-radius: 16px;
  padding: 30px;
}
.video-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}

.video-card {
  background: #fff;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
  border: 1px solid #ebeef5;
  display: flex;
  flex-direction: column;
}
.video-thumbnail {
  position: relative;
  height: 200px;
  cursor: pointer;
  background: #eee;
}
.thumbnail-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.video-info {
  padding: 15px;
  display: flex;
  flex-direction: column;
  flex-grow: 1;
}
.video-title {
  font-size: 16px;
  height: 44px;
  margin-bottom: 10px;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

/* 修复按钮不挤出样式 */
.video-actions {
  display: flex;
  gap: 4px;
  margin-top: auto;
  flex-wrap: nowrap; /* 强制一行 */
}
.video-actions .el-button {
  flex: 1;
  padding: 8px 2px !important;
  font-size: 12px;
  margin: 0 !important;
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
}

/* 其余辅助样式 */
.match-result {
  background: #f8f9fa;
  padding: 8px;
  border-radius: 8px;
  margin-bottom: 10px;
}
.result-value.win {
  color: #67c23a;
}
.play-button-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.2);
  opacity: 0;
}
.video-card:hover .play-button-overlay {
  opacity: 1;
}
.play-icon {
  font-size: 40px;
  color: white;
}
</style>
