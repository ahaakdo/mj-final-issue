<template>
  <div class="course-browser-container">
    <!-- 顶部横幅 -->
    <div class="banner-section">
      <div class="banner-content">
        <h1 class="banner-title">
          <i class="fas fa-volleyball-ball" /> 排球训练课程
        </h1>
        <p class="banner-description">
          专业排球技巧训练，系统提升你的发球、接球和扣球能力
        </p>
      </div>
    </div>

    <!-- 课程分类导航 -->
    <div class="category-navigation">
      <div class="category-tabs">
        <div
          v-for="item in courseCategories"
          :key="item.id"
          class="category-tab"
          :class="{ active: activeCategory === item.id }"
          @click="switchCategory(item.id)"
        >
          <i class="fas fa-bolt" />
          <span>{{ item.name }}</span>
          <span class="course-count">{{ caculateCourseSum(item.id) }}</span>
        </div>
      </div>
    </div>

    <!-- 当前分类信息 -->
    <div v-if="activeCategoryData" class="category-info">
      <div class="info-content">
        <div class="info-icon">
          <i :class="getCategoryIcon(activeCategory)" />
        </div>
        <div class="info-text">
          <h2>{{ getCategoryTitle(activeCategory) }}</h2>
          <p>{{ getCategoryDescription(activeCategory) }}</p>
        </div>
      </div>
      <div class="info-stats">
        <div class="stat-item">
          <span class="stat-value">{{ getActiveCourses().course }}</span>
          <span class="stat-label">个课程</span>
        </div>
        <div class="stat-item">
          <span class="stat-value">{{ getActiveCourses().people }}</span>
          <span class="stat-label">人学习</span>
        </div>
        <div class="stat-item">
          <span class="stat-value">{{ getActiveCourses().sum }}</span>
          <span class="stat-label">个名额</span>
        </div>
      </div>
    </div>

    <!-- 筛选条件 -->
    <div class="filter-section">
      <div class="filter-container">
        <el-form :inline="true" :model="filterForm" class="filter-form">
          <el-form-item label="难度等级">
            <el-select
              v-model="filterForm.difficulty"
              placeholder="全部难度"
              filterable
              clearable
            >
              <el-option label="初级" value="1" />
              <el-option label="中级" value="2" />
              <el-option label="高级" value="3" />
            </el-select>
          </el-form-item>

          <el-form-item label="课程状态">
            <el-select
              v-model="filterForm.status"
              placeholder="全部状态"
              clearable
              filterable
            >
              <el-option label="未开始报名" value="未开始报名" />
              <el-option label="开始报名" value="开始报名" />
              <el-option label="结束报名" value="结束报名" />
              <el-option label="已开课" value="已开课" />
              <el-option label="已结课" value="已结课" />
            </el-select>
          </el-form-item>

          <el-form-item label="开课时间">
            <el-date-picker
              v-model="filterForm.dateRange"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
            />
          </el-form-item>

          <el-form-item label="授课教师">
            <el-select
              v-model="filterForm.teacherId"
              placeholder="选择教师"
              clearable
              filterable
            >
              <el-option
                v-for="teacher in getCurrentTeachers()"
                :key="teacher.id"
                :label="teacher.real_name"
                :value="teacher.id"
              />
            </el-select>
          </el-form-item>

          <el-form-item label="关键词">
            <el-input
              v-model="filterForm.keyword"
              placeholder="课程名称、描述等"
              clearable
            >
              <template #prefix>
                <i class="fas fa-search" />
              </template>
            </el-input>
          </el-form-item>

          <el-form-item>
            <el-button type="primary" @click="applyFilters">
              <i class="fas fa-filter" /> 筛选
            </el-button>
            <el-button @click="resetFilters">
              <i class="fas fa-redo" /> 重置
            </el-button>
          </el-form-item>
        </el-form>
      </div>
    </div>

    <!-- 课程统计卡片 -->
    <div v-if="filteredCourses.length > 0" class="stats-cards">
      <div class="stats-card">
        <div class="card-icon beginner">
          <i class="fas fa-seedling" />
        </div>
        <div class="card-content">
          <span class="card-value">{{ getDifficultyCount(1) }}</span>
          <span class="card-label">初级课程</span>
        </div>
      </div>
      <div class="stats-card">
        <div class="card-icon enrolling">
          <i class="fas fa-user-plus" />
        </div>
        <div class="card-content">
          <span class="card-value">{{ getStatusCount("开始报名") }}</span>
          <span class="card-label">可报名课程</span>
        </div>
      </div>
      <div class="stats-card">
        <div class="card-icon teacher">
          <i class="fas fa-chalkboard-teacher" />
        </div>
        <div class="card-content">
          <span class="card-value">{{ getUniqueTeacherCount() }}</span>
          <span class="card-label">授课教师</span>
        </div>
      </div>
      <div class="stats-card">
        <div class="card-icon seats">
          <i class="fas fa-chair" />
        </div>
        <div class="card-content">
          <span class="card-value">{{ getAvailableSeatsCount() }}</span>
          <span class="card-label">剩余名额</span>
        </div>
      </div>
    </div>

    <!-- 课程网格 -->
    <div class="courses-grid-section">
      <div class="section-header">
        <h2 class="section-title">
          <i :class="getCategoryIcon(activeCategory)" />
          {{ getCategoryTitle(activeCategory) }}课程
          <span class="courses-count">({{ filteredCourses.length }})</span>
        </h2>
        <!--        <div class="sort-controls">-->
        <!--          <el-select-->
        <!--            v-model="sortOption"-->
        <!--            placeholder="排序方式"-->
        <!--            size="small"-->
        <!--            @change="sortCourses"-->
        <!--          >-->
        <!--            <el-option label="最新课程" value="newest" />-->
        <!--            <el-option label="最早上课" value="earliest" />-->
        <!--            <el-option label="评分最高" value="rating" />-->
        <!--            <el-option label="剩余名额" value="seats" />-->
        <!--            <el-option label="课程热度" value="popularity" />-->
        <!--          </el-select>-->
        <!--        </div>-->
      </div>
      <div v-if="loading" class="loading-spinner">
        <i class="fas fa-spinner fa-spin" />
        加载中...
      </div>
      <div v-else-if="filteredCourses.length === 0" class="empty-state">
        <i class="fas fa-search" />
        <h3>未找到相关课程</h3>
        <p>请尝试调整筛选条件或查看其他分类</p>
        <el-button type="primary" @click="resetFilters">
          重置筛选条件
        </el-button>
      </div>
      <div v-else class="courses-grid">
        <div
          v-for="course in paginatedCourses"
          :key="course.id"
          class="course-card"
          :class="{ featured: course.is_featured }"
        >
          <!-- 课程角标 -->
          <div class="course-badges">
            <el-tag
              v-if="course.recommend >= 4"
              type="danger"
              size="small"
              effect="dark"
            >
              推荐
            </el-tag>
            <el-tag
              :type="getDifficultyTagType(course.difficulty)"
              size="small"
            >
              {{ getDifficultyText(course.difficulty) }}
            </el-tag>
            <el-tag :type="getStatusTagType(course.status)" size="small">
              {{ getStatusText(course.status) }}
            </el-tag>
          </div>
          <!-- 课程封面 -->
          <div class="course-cover" @click="viewCourseDetail(course.id)">
            <div class="cover-overlay">
              <div class="cover-info">
                <span class="course-code">{{ course.id }}-X2026</span>
                <span class="course-credits">
                  <i class="fas fa-star" /> {{ course.credits }}学分
                </span>
              </div>
            </div>
            <div class="cover-image" :class="activeCategory">
              <i :class="getCourseTypeIcon(course.course_type)" />
            </div>
          </div>
          <!-- 课程内容 -->
          <div class="course-content">
            <h3 class="course-title" @click="viewCourseDetail(course.id)">
              {{ course.course_name }}
            </h3>
            <p class="course-description">
              {{ truncateText(course.description, 60) }}
            </p>
            <!-- 课程评分 -->
            <div v-if="course.recommend" class="course-rating">
              <div class="rating-stars">
                <i
                  v-for="n in 5"
                  :key="n"
                  class="fas fa-star"
                  :class="{ active: n <= Math.round(course.recommend) }"
                />
              </div>
              <span class="rating-value">{{ course.recommend }}</span>
              <span class="rating-count">({{ course.review_count }}评价)</span>
            </div>
            <!-- 教师信息 -->
            <div class="course-teacher">
              <div class="teacher-avatar">
                <img
                  v-if="course.teacher_avatar"
                  :src="course.teacher_avatar"
                  alt="教师头像"
                />
                <i v-else class="fas fa-user-circle" />
              </div>
              <div class="teacher-info">
                <div class="teacher-name">{{ course.teacher_real_name }}</div>
                <div class="teacher-title">{{ course.teacher_position }}</div>
                <div v-if="course.teaching_year" class="teacher-experience">
                  教龄{{ course.teaching_year }}年
                </div>
              </div>
            </div>
            <!-- 课程详情 -->
            <div class="course-details">
              <div class="detail-item">
                <i class="fas fa-calendar-alt" />
                <span>{{ formatDate(course.study_date) }} 开课</span>
              </div>
              <div class="detail-item">
                <i class="fas fa-clock" />
                <span>{{ course.schedule }}</span>
              </div>
              <div class="detail-item">
                <i class="fas fa-map-marker-alt" />
                <span>{{ course.location }}</span>
              </div>
              <div class="detail-item">
                <i class="fas fa-users" />
                <div style="width: 100%">
                  {{ course.current_students }}/{{ course.capacity }}人
                  <el-progress
                    :percentage="getCapacityPercentage(course)"
                    :show-text="false"
                    :stroke-width="6"
                    :color="getCapacityColor(course)"
                  />
                </div>
              </div>
            </div>
            <!-- 课程标签 -->
            <div class="course-tags">
              <el-tag
                v-for="tag in course.tags?.split(',')"
                :key="tag"
                size="small"
                type="primary"
              >
                {{ tag }}
              </el-tag>
            </div>
            <!-- 操作按钮 -->
            <div class="course-actions">
              <el-button
                v-if="course.status === '开始报名'"
                type="primary"
                size="small"
                :disabled="course.current_students >= course.capacity"
                @click="applyCourse(course)"
              >
                <i class="fas fa-plus" />
                {{
                  course.current_students >= course.capacity
                    ? "已满员"
                    : "立即报名"
                }}
              </el-button>
              <el-button v-else type="info" size="small" disabled>
                {{ course.status }}
              </el-button>
              <el-button
                type="default"
                size="small"
                @click="viewCourseDetail(course.id)"
              >
                查看详情
              </el-button>
              <el-button
                type="text"
                size="small"
                @click="toggleFavorite(course)"
              >
                <i
                  class="fas fa-heart"
                  :class="{ favorite: course.is_favorite }"
                />
              </el-button>
            </div>
          </div>
        </div>
      </div>

      <!-- 分页 -->
      <div v-if="filteredCourses.length > 0" class="pagination-section">
        <el-pagination
          v-model:current-page="pagination.currentPage"
          v-model:page-size="pagination.pageSize"
          :total="filteredCourses.length"
          :page-sizes="[8, 12, 24, 48]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handlePageSizeChange"
          @current-change="handlePageChange"
        />
      </div>
    </div>

    <!-- 推荐课程 -->
    <div v-if="featuredCourses.length > 0" class="recommended-section">
      <div class="section-header">
        <h2 class="section-title">
          <i class="fas fa-crown" />
          {{ getCategoryTitle(activeCategory) }}热门课程
        </h2>
        <el-button type="text" @click="viewAllFeatured">
          查看全部 <i class="fas fa-arrow-right" />
        </el-button>
      </div>

      <div class="recommended-courses">
        <div
          v-for="course in featuredCourses.slice(0, 3)"
          :key="course.id"
          class="recommended-card"
          @click="viewCourseDetail(course.id)"
        >
          <div
            v-if="featuredCourses.indexOf(course) < 3"
            class="recommended-rank"
          >
            <span class="rank-number">{{
              featuredCourses.indexOf(course) + 1
            }}</span>
          </div>
          <div class="recommended-content">
            <h3 class="recommended-title">{{ course.course_name }}</h3>
            <div class="recommended-meta">
              <span class="meta-item">
                <i :class="getCategoryIcon(activeCategory)" />
                {{ getCourseTypeText(course.course_type) }}
              </span>
              <span class="meta-item">
                <i class="fas fa-user-circle" />
                {{ course.teacher_name }}
              </span>
              <span class="meta-item">
                <i class="fas fa-star" />
                {{ course.recommend }}(评价)
              </span>
            </div>
            <p class="recommended-description">
              {{ truncateText(course.description, 80) }}
            </p>
            <div class="recommended-stats">
              <span class="stat">
                <i class="fas fa-users" />
                {{ course.current_students }}人学习
              </span>
              <span class="stat">
                <i class="fas fa-calendar" />
                {{ formatDate(course.start_date) }}开课
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { getCourseCategory, getCourses } from "@/api/courses";

// ---------------------- 类型定义 ----------------------
interface Teacher {
  id: number;
  name: string;
  title: string;
  avatar?: string;
  experience: number;
  department: string;
}

interface Course {
  id: number;
  course_code: string;
  course_name: string;
  course_type: "spike" | "receive" | "serve";
  description: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  status: "pending" | "enrolling" | "ongoing" | "ended";
  category_id: number;
  teacher_id: number;
  teacher_name: string;
  teacher_title: string;
  teacher_avatar?: string;
  teacher_experience: number;
  teacher_department: string;
  credits: number;
  capacity: number;
  current_students: number;
  location: string;
  schedule: string;
  start_date: string;
  end_date: string;
  rating: number;
  review_count: number;
  tags: string[];
  is_featured: boolean;
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
}

// ---------------------- 数据状态 ----------------------
const activeCategory = ref<any>(1);
const loading = ref(false);

// ---------------------- 筛选表单 ----------------------
const filterForm = reactive({
  difficulty: null as null | "beginner" | "intermediate" | "advanced",
  status: null as null | "enrolling" | "ongoing" | "ended",
  dateRange: [] as string[],
  teacherId: null as number | null,
  keyword: ""
});

// ---------------------- 排序选项 ----------------------
const sortOption = ref("newest");

// ---------------------- 分页配置 ----------------------
const pagination = reactive({
  currentPage: 1,
  pageSize: 8,
  total: 0
});

const courseCategories = ref<any>([]);
const courseItem = ref([]);
const initCourses = async () => {
  const cate = await getCourseCategory();
  const res = await getCourses();
  courseCategories.value = cate.data;
  courseItem.value = res.data;
  console.log(res, cate.data);
};
initCourses();

// ---------------------- 计算属性 ----------------------
// 当前激活的分类数据
const activeCategoryData = computed(() => {
  return courseCategories.value[activeCategory.value - 1];
});

// 获取当前分类的课程
const getActiveCourses = () => {
  const courseDetail = {
    course: 0,
    people: 0,
    sum: 0,
    courseList: [],
    teacherList: []
  };
  courseItem.value.forEach(item => {
    if (item.category.id === activeCategory.value) {
      courseDetail.course++;
      courseDetail.people += item.course.current_students;
      courseDetail.sum += item.course.capacity;
      courseDetail.courseList.push(item.course);
      courseDetail.courseList[
        courseDetail.courseList.length - 1
      ].teacher_real_name = item.teacher.real_name;
      courseDetail.courseList[
        courseDetail.courseList.length - 1
      ].teacher_position = item.teacher.teacher_position;
      courseDetail.courseList[
        courseDetail.courseList.length - 1
      ].teaching_year = item.teacher.teaching_year;
      courseDetail.courseList[
        courseDetail.courseList.length - 1
      ].teacher_avatar = item.teacher.teacher_avatar;
      courseDetail.courseList[
        courseDetail.courseList.length - 1
      ].teacher_introduction = item.teacher.teacher_introduction;
      courseDetail.courseList[courseDetail.courseList.length - 1].teacher_id =
        item.teacher.id;
      courseDetail.courseList[courseDetail.courseList.length - 1].course_type =
        item.category.id;
    }
  });
  return courseDetail;
};

// 获取当前分类的特色课程
const featuredCourses = computed(() => {
  return filteredCourses.value.filter(
    course => Number(course.recommend) >= 4 && course.status === "开始报名"
  );
});

// 获取当前分类的教师列表
const getCurrentTeachers = () => {
  return [
    ...new Set(
      courseItem.value
        .filter(item => item.category.id === activeCategory.value)
        .map(item => item.teacher)
    )
  ];
};

// 筛选后的课程
const filteredCourses = computed(() => {
  let filtered = [...getActiveCourses().courseList];
  // 按难度筛选
  if (filterForm.difficulty) {
    filtered = filtered.filter(
      course => course.difficulty == filterForm.difficulty
    );
  }

  // 按状态筛选
  if (filterForm.status) {
    filtered = filtered.filter(course => course.status === filterForm.status);
  }

  // 按日期筛选
  if (filterForm.dateRange && filterForm.dateRange.length === 2) {
    filtered = filtered.filter(course => {
      const startDate = new Date(course.study_date);
      const rangeStart = new Date(filterForm.dateRange[0]);
      const rangeEnd = new Date(filterForm.dateRange[1]);
      return startDate >= rangeStart && startDate <= rangeEnd;
    });
  }

  // 按教师筛选
  if (filterForm.teacherId) {
    filtered = filtered.filter(
      course => course.teacher_id === filterForm.teacherId
    );
  }

  // 按关键词筛选
  if (filterForm.keyword) {
    const keyword = filterForm.keyword.toLowerCase();
    filtered = filtered.filter(
      course =>
        course.course_name.toLowerCase().includes(keyword) ||
        course.description.toLowerCase().includes(keyword) ||
        course.tags?.toLowerCase().includes(keyword)
    );
  }
  return filtered;
});

const caculateCourseSum = (id: any) => {
  let sum = 0;
  courseItem.value.forEach(item => {
    if (item.category.id === id) {
      sum++;
    }
  });
  return sum;
};

// 分页后的课程
const paginatedCourses = computed(() => {
  const start = (pagination.currentPage - 1) * pagination.pageSize;
  const end = start + pagination.pageSize;
  return filteredCourses.value.slice(start, end);
});

// ---------------------- 辅助函数 ----------------------
const getCategoryIcon = (category: string) => {
  const icons: Record<string, string> = {
    spike: "fas fa-bolt",
    receive: "fas fa-hands",
    serve: "fas fa-baseball-ball"
  };
  return icons[category] || "fas fa-volleyball-ball";
};

const getCategoryTitle = (category: number) => {
  return courseCategories.value[category - 1]?.name || "课程";
};

const getCategoryDescription = (category: number) => {
  return courseCategories.value[category - 1].description || "排球训练课程";
};

const getCourseTypeIcon = (type: string) => {
  return getCategoryIcon(type);
};

const getCourseTypeText = (type: string) => {
  return getCategoryTitle(type);
};

const getDifficultyText = (difficulty: string) => {
  const map: Record<string, string> = {
    1: "初级",
    2: "中级",
    3: "高级"
  };
  return map[difficulty] || difficulty;
};

const getDifficultyTagType = (difficulty: string) => {
  const map: Record<string, string> = {
    1: "success",
    2: "warning",
    3: "danger"
  };
  return map[difficulty] || "info";
};

const getStatusText = (status: string) => {
  const map: Record<string, string> = {
    pending: "待开始",
    enrolling: "报名中",
    ongoing: "进行中",
    ended: "已结束"
  };
  return map[status] || status;
};

const getStatusTagType = (status: string) => {
  const map: any = {
    开始报名: "success",
    已开课: "primary",
    已结课: "danger"
  };
  return map[status] || "info";
};

const truncateText = (text: string, maxLength: number) => {
  if (!text) return "";
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + "...";
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return `${date.getMonth() + 1}月${date.getDate()}日`;
};

const getCapacityPercentage = (course: Course) => {
  return Math.round((course.current_students / course.capacity) * 100);
};

const getCapacityColor = (course: Course) => {
  const percentage = getCapacityPercentage(course);
  if (percentage >= 90) return "#f56c6c";
  if (percentage >= 70) return "#e6a23c";
  return "#67c23a";
};

const getDifficultyCount = (difficulty: number) => {
  console.log(filteredCourses.value);
  return filteredCourses.value.filter(
    course => course.difficulty === difficulty
  ).length;
};

const getStatusCount = (status: string) => {
  return filteredCourses.value.filter(course => course.status === status)
    .length;
};

const getUniqueTeacherCount = () => {
  const teacherIds = new Set(
    filteredCourses.value.map(course => course.teacher_id)
  );
  return teacherIds.size;
};

const getAvailableSeatsCount = () => {
  return filteredCourses.value
    .filter(item => item.status === "开始报名")
    .reduce(
      (sum, course) => sum + (course.capacity - course.current_students),
      0
    );
};

// ---------------------- 事件处理函数 ----------------------
const switchCategory = (category: any) => {
  activeCategory.value = category;
  resetFilters();
  pagination.currentPage = 1;
  ElMessage.success(`已切换到${getCategoryTitle(category)}课程`);
};

const applyFilters = () => {
  pagination.currentPage = 1;
  ElMessage.success(`筛选成功`);
};

const resetFilters = () => {
  Object.assign(filterForm, {
    difficulty: null,
    status: null,
    dateRange: [],
    teacherId: null,
    keyword: ""
  });
  sortOption.value = "newest";
  pagination.currentPage = 1;
};

const sortCourses = (option: string) => {
  // 这里可以实现具体的排序逻辑

  ElMessage.info(
    `已按${option === "newest" ? "最新课程" : option === "rating" ? "评分最高" : option}排序`
  );
};

const viewCourseDetail = (courseId: number) => {
  ElMessage.info(`查看课程详情: ${courseId}`);
  // 实际项目中跳转到课程详情页
};

const applyCourse = async (course: Course) => {
  if (course.current_students >= course.capacity) {
    ElMessage.warning("该课程已满员");
    return;
  }

  try {
    await ElMessageBox.confirm(
      `确认报名 "${course.course_name}" 课程？`,
      "确认报名",
      {
        confirmButtonText: "确认报名",
        cancelButtonText: "取消",
        type: "success"
      }
    );

    // 模拟报名成功
    course.current_students++;
    ElMessage.success("报名成功！请等待审核");
  } catch {
    // 用户取消
  }
};

const toggleFavorite = (course: Course) => {
  course.is_favorite = !course.is_favorite;
  const action = course.is_favorite ? "收藏" : "取消收藏";
  ElMessage.success(`已${action} "${course.course_name}"`);
};

const viewAllFeatured = () => {
  filterForm.status = "enrolling";
  applyFilters();
};

const handlePageSizeChange = (size: number) => {
  pagination.pageSize = size;
  pagination.currentPage = 1;
};

const handlePageChange = (page: number) => {
  pagination.currentPage = page;
  window.scrollTo({ top: 0, behavior: "smooth" });
};

// ---------------------- 生命周期 ----------------------
onMounted(() => {
  console.log("课程浏览模块加载完成");
});
</script>

<style scoped lang="scss">
.course-browser-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 20px 40px;
}

/* 顶部横幅 */
.banner-section {
  background: linear-gradient(135deg, #3498db 0%, #2c3e50 100%);
  border-radius: 16px;
  padding: 40px;
  margin-bottom: 30px;
  color: white;
  position: relative;
  overflow: hidden;

  &::before {
    content: "";
    position: absolute;
    top: -50%;
    right: -50%;
    width: 200px;
    height: 200px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 50%;
  }

  &::after {
    content: "";
    position: absolute;
    bottom: -30%;
    left: -20%;
    width: 150px;
    height: 150px;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 50%;
  }
}

.banner-content {
  position: relative;
  z-index: 1;
}

.banner-title {
  font-size: 32px;
  font-weight: 700;
  margin-bottom: 15px;
  display: flex;
  align-items: center;
  gap: 15px;

  i {
    font-size: 36px;
    color: #e74c3c;
  }
}

.banner-description {
  font-size: 18px;
  opacity: 0.9;
  max-width: 600px;
  line-height: 1.6;
}

/* 分类导航 */
.category-navigation {
  background: white;
  border-radius: 16px;
  padding: 0;
  margin-bottom: 30px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.category-tabs {
  display: flex;
  border-radius: 16px;
  overflow: hidden;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
}

.category-tab {
  flex: 1;
  text-align: center;
  padding: 20px;
  color: #495057;
  font-weight: 500;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  position: relative;
  cursor: pointer;

  &:hover {
    background: rgba(52, 152, 219, 0.1);
    color: #3498db;
  }

  &.active {
    background: white;
    color: #3498db;
    font-weight: 600;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

    &::after {
      content: "";
      position: absolute;
      bottom: 0;
      left: 20%;
      right: 20%;
      height: 3px;
      background: #3498db;
      border-radius: 2px 2px 0 0;
    }
  }

  i {
    font-size: 20px;
  }
}

.course-count {
  background: #3498db;
  color: white;
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 10px;
  margin-left: 5px;
}

/* 分类信息 */
.category-info {
  background: white;
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 30px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.info-content {
  display: flex;
  align-items: center;
  gap: 20px;
}

.info-icon {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  background: linear-gradient(135deg, #3498db 0%, #2c3e50 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  color: white;
}

.info-text {
  h2 {
    font-size: 24px;
    font-weight: 600;
    color: #2c3e50;
    margin-bottom: 8px;
  }

  p {
    color: #7f8c8d;
    font-size: 16px;
  }
}

.info-stats {
  display: flex;
  gap: 30px;
}

.stat-item {
  text-align: center;
}

.stat-value {
  display: block;
  font-size: 28px;
  font-weight: 700;
  color: #3498db;
  line-height: 1;
  margin-bottom: 5px;
}

.stat-label {
  font-size: 14px;
  color: #7f8c8d;
}

/* 筛选区域 */
.filter-section {
  background: white;
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 30px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.filter-container {
  .filter-form {
    display: flex;
    flex-wrap: wrap;
    gap: 20px;
    align-items: flex-end;

    :deep(.el-form-item) {
      margin-bottom: 0;
    }
  }
}

/* 统计卡片 */
.stats-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-bottom: 30px;
}

.stats-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  transition: transform 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
}

.card-icon {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: white;

  &.beginner {
    background: linear-gradient(135deg, #2ecc71 0%, #27ae60 100%);
  }

  &.enrolling {
    background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
  }

  &.teacher {
    background: linear-gradient(135deg, #9b59b6 0%, #8e44ad 100%);
  }

  &.seats {
    background: linear-gradient(135deg, #f39c12 0%, #d35400 100%);
  }
}

.card-content {
  flex: 1;
}

.card-value {
  display: block;
  font-size: 28px;
  font-weight: 700;
  color: #2c3e50;
  line-height: 1;
  margin-bottom: 5px;
}

.card-label {
  font-size: 14px;
  color: #7f8c8d;
}

/* 课程网格区域 */
.courses-grid-section {
  background: white;
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 40px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.section-title {
  font-size: 20px;
  font-weight: 600;
  color: #2c3e50;
  display: flex;
  align-items: center;
  gap: 10px;

  i {
    color: #e74c3c;
  }
}

.courses-count {
  font-size: 16px;
  color: #7f8c8d;
  font-weight: normal;
}

.sort-controls {
  :deep(.el-select) {
    width: 140px;
  }
}

/* 加载状态 */
.loading-spinner {
  text-align: center;
  padding: 60px;
  color: #3498db;
  font-size: 16px;

  i {
    margin-right: 10px;
    font-size: 24px;
  }
}

/* 空状态 */
.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #95a5a6;

  i {
    font-size: 48px;
    margin-bottom: 20px;
    opacity: 0.5;
  }

  h3 {
    font-size: 20px;
    margin-bottom: 10px;
    color: #7f8c8d;
  }

  p {
    margin-bottom: 20px;
  }

  .el-button {
    margin: 0 10px;
  }
}

/* 课程网格 */
.courses-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 24px;
}

/* 课程卡片 */
.course-card {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
  position: relative;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  }

  &.featured {
    border: 2px solid #e74c3c;
  }
}

.course-badges {
  position: absolute;
  top: 12px;
  right: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  z-index: 10;
}

/* 课程封面 */
.course-cover {
  height: 120px;
  background: linear-gradient(135deg, #3498db 0%, #2c3e50 100%);
  position: relative;
  cursor: pointer;
  overflow: hidden;

  &.spike {
    background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);
  }

  &.receive {
    background: linear-gradient(135deg, #2ecc71 0%, #27ae60 100%);
  }

  &.serve {
    background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
  }
}

.cover-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  padding: 10px;
}

.cover-info {
  display: flex;
  justify-content: space-between;
  color: white;
  font-size: 12px;
  opacity: 0.9;
}

.course-code {
  font-weight: 600;
  letter-spacing: 1px;
}

.course-credits {
  i {
    margin-right: 4px;
  }
}

.cover-image {
  position: absolute;
  right: 20px;
  bottom: -20px;
  width: 80px;
  height: 80px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 36px;
  color: white;

  &.spike {
    background: rgba(231, 76, 60, 0.3);
  }

  &.receive {
    background: rgba(46, 204, 113, 0.3);
  }

  &.serve {
    background: rgba(52, 152, 219, 0.3);
  }
}

/* 课程内容 */
.course-content {
  padding: 20px;
}

.course-title {
  font-size: 18px;
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 10px;
  cursor: pointer;
  transition: color 0.3s;

  &:hover {
    color: #3498db;
  }
}

.course-description {
  color: #7f8c8d;
  font-size: 14px;
  line-height: 1.5;
  margin-bottom: 15px;
  height: auto;
}

/* 课程评分 */
.course-rating {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 15px;
}

.rating-stars {
  display: flex;
  gap: 2px;

  i {
    color: #ddd;
    font-size: 14px;

    &.active {
      color: #f39c12;
    }
  }
}

.rating-value {
  font-weight: 600;
  color: #f39c12;
}

.rating-count {
  font-size: 12px;
  color: #95a5a6;
}

/* 教师信息 */
.course-teacher {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 8px;
  margin-bottom: 15px;
}

.teacher-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  overflow: hidden;
  background: #e9ecef;
  display: flex;
  align-items: center;
  justify-content: center;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  i {
    font-size: 24px;
    color: #95a5a6;
  }
}

.teacher-info {
  flex: 1;
}

.teacher-name {
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 2px;
}

.teacher-title {
  font-size: 12px;
  color: #7f8c8d;
  margin-bottom: 2px;
}

.teacher-experience {
  font-size: 11px;
  color: #3498db;
}

/* 课程详情 */
.course-details {
  margin-bottom: 15px;
}

.detail-item {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13px;
  color: #7f8c8d;
  margin-bottom: 8px;

  i {
    width: 16px;
    text-align: center;
  }

  :deep(.el-progress) {
    flex: 1;
  }
}

/* 课程标签 */
.course-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 15px;

  :deep(.el-tag) {
    height: 22px;
    line-height: 20px;
    font-size: 11px;
  }
}

/* 操作按钮 */
.course-actions {
  display: flex;
  gap: 10px;
  align-items: center;

  :deep(.el-button) {
    flex: 1;
  }

  .fa-heart {
    color: #ddd;
    font-size: 16px;
    transition: color 0.3s;

    &.favorite {
      color: #e74c3c;
    }
  }
}

/* 分页 */
.pagination-section {
  margin-top: 30px;
  text-align: center;
}

/* 推荐课程 */
.recommended-section {
  background: white;
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 40px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.recommended-courses {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}

.recommended-card {
  background: #f8f9fa;
  border-radius: 12px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;

  &:hover {
    transform: translateY(-2px);
    background: white;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
}

.recommended-rank {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: #3498db;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 14px;
}

.recommended-title {
  font-size: 16px;
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 10px;
  padding-right: 35px;
}

.recommended-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 10px;
  font-size: 12px;
  color: #7f8c8d;

  i {
    margin-right: 4px;
  }
}

.recommended-description {
  font-size: 13px;
  color: #7f8c8d;
  line-height: 1.5;
  margin-bottom: 15px;
}

.recommended-stats {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #7f8c8d;

  i {
    margin-right: 4px;
  }
}

/* 分类对比 */
.category-comparison {
  background: white;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.comparison-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}

.comparison-card {
  background: #f8f9fa;
  border-radius: 12px;
  padding: 24px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid transparent;

  &:hover {
    transform: translateY(-2px);
    background: white;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  &.active {
    border-color: #3498db;
    background: white;
    box-shadow: 0 4px 12px rgba(52, 152, 219, 0.2);
  }
}

.comparison-icon {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  margin: 0 auto 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 36px;
  color: white;

  &.spike {
    background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);
  }

  &.receive {
    background: linear-gradient(135deg, #2ecc71 0%, #27ae60 100%);
  }

  &.serve {
    background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
  }
}

.comparison-title {
  font-size: 18px;
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 15px;
}

.comparison-stats {
  display: flex;
  justify-content: space-around;
  margin-bottom: 15px;
}

.comparison-desc {
  font-size: 14px;
  color: #7f8c8d;
  line-height: 1.5;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .stats-cards {
    grid-template-columns: repeat(2, 1fr);
  }

  .courses-grid {
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  }

  .recommended-courses,
  .comparison-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .course-browser-container {
    padding: 0 15px 30px;
  }

  .banner-section {
    padding: 30px 20px;
  }

  .banner-title {
    font-size: 24px;
  }

  .category-tabs {
    flex-direction: column;
  }

  .category-tab {
    padding: 15px;
  }

  .category-info {
    flex-direction: column;
    gap: 20px;
    text-align: center;
  }

  .info-content {
    flex-direction: column;
    text-align: center;
  }

  .info-stats {
    width: 100%;
    justify-content: space-around;
  }

  .filter-form {
    flex-direction: column;
    align-items: stretch !important;
  }

  .stats-cards {
    grid-template-columns: 1fr;
  }

  .section-header {
    flex-direction: column;
    gap: 15px;
    align-items: stretch;
  }

  .courses-grid {
    grid-template-columns: 1fr;
  }

  .recommended-courses,
  .comparison-grid {
    grid-template-columns: 1fr;
  }
}
</style>
