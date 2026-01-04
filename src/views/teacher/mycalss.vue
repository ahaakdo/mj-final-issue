<template>
  <div class="volleyball-courses-container">
    <!-- 课程类型卡片 -->
    <div class="course-type-cards">
      <div
        v-for="type in courseTypes"
        :key="type.value"
        class="type-card"
        :class="{ active: activeType === type.value }"
        @click="toggleTypeFilter(type.value)"
      >
        <div class="type-icon" :style="{ background: type.color }">
          <el-icon size="28">
            <component :is="type.icon" />
          </el-icon>
        </div>
        <div class="type-info">
          <h3>{{ type.label }}</h3>
          <div class="type-stats">
            <span class="stat-number">{{ getTypeCount(type.value) }}</span>
            <span class="stat-label">门课程</span>
          </div>
          <div class="type-students">
            <el-icon><User /></el-icon>
            {{ getTypeStudents(type.value) }}人报名
          </div>
        </div>
      </div>
    </div>

    <!-- 快速操作栏 -->
    <div class="quick-actions">
      <el-button type="primary" class="create-btn" @click="createCourse">
        <el-icon><Plus /></el-icon> 开设新课
      </el-button>

      <div class="action-filters">
        <el-select v-model="statusFilter" placeholder="课程状态" size="large">
          <el-option label="全部状态" value="all" />
          <el-option label="报名中" value="enrolling" />
          <el-option label="进行中" value="ongoing" />
          <el-option label="已结束" value="ended" />
        </el-select>

        <el-input
          v-model="searchText"
          placeholder="搜索课程名称"
          size="large"
          style="width: 200px"
          :prefix-icon="Search"
        />
      </div>
    </div>

    <!-- 课程列表 -->
    <div class="courses-grid">
      <div
        v-for="course in filteredCourses"
        :key="course.id"
        class="course-card"
        :class="course.type"
      >
        <!-- 课程卡片头部 -->
        <div class="card-header">
          <div
            class="course-badge"
            :style="{ background: getTypeColor(course.type) }"
          >
            {{ getTypeLabel(course.type) }}
          </div>
          <div class="course-status" :class="course.status">
            {{ getStatusText(course.status) }}
          </div>
        </div>

        <!-- 课程内容 -->
        <div class="card-content">
          <h3 class="course-title">{{ course.name }}</h3>
          <p class="course-description">{{ course.description }}</p>

          <div class="course-details">
            <div class="detail-item">
              <el-icon><Calendar /></el-icon>
              <span>{{ course.time }}</span>
            </div>
            <div class="detail-item">
              <el-icon><Location /></el-icon>
              <span>{{ course.location }}</span>
            </div>
            <div class="detail-item">
              <el-icon><User /></el-icon>
              <span>{{ course.students }}/{{ course.capacity }}人</span>
            </div>
            <div class="detail-item">
              <el-icon><Star /></el-icon>
              <span>{{ course.difficulty }}级难度</span>
            </div>
          </div>

          <!-- 进度条 -->
          <div class="capacity-progress">
            <div class="progress-info">
              <span>报名进度</span>
              <span
                >{{
                  Math.round((course.students / course.capacity) * 100)
                }}%</span
              >
            </div>
            <el-progress
              :percentage="(course.students / course.capacity) * 100"
              :color="
                course.students >= course.capacity ? '#f56c6c' : '#409eff'
              "
              :show-text="false"
              :stroke-width="6"
            />
          </div>
        </div>

        <!-- 卡片底部操作 -->
        <div class="card-actions">
          <el-button type="primary" plain @click="viewStudents(course)">
            <el-icon><List /></el-icon>
            查看学员
          </el-button>
          <el-button
            v-if="course.status !== 'ended'"
            @click="editCourse(course)"
          >
            <el-icon><Edit /></el-icon>
            编辑
          </el-button>
          <el-dropdown v-if="course.status === 'enrolling'">
            <el-button type="success">
              <el-icon><More /></el-icon>
              更多
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item @click="closeEnrollment(course)">
                  <el-icon><Close /></el-icon>关闭报名
                </el-dropdown-item>
                <el-dropdown-item @click="exportList(course)">
                  <el-icon><Download /></el-icon>导出名单
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </div>
    </div>

    <!-- 空状态 -->
    <div v-if="filteredCourses.length === 0" class="empty-courses">
      <el-empty
        :description="`暂无${activeType === 'all' ? '' : getTypeLabel(activeType)}课程`"
      >
        <el-button type="primary" @click="createCourse">
          开设第一门课程
        </el-button>
      </el-empty>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import {
  Plus,
  Search,
  User,
  Calendar,
  Location,
  Star,
  List,
  Edit,
  More,
  Close,
  Download,
  Top,
  Grid,
  Connection
} from "@element-plus/icons-vue";

// 课程类型定义
const courseTypes = [
  { label: "扣球训练", value: "spike", icon: Top, color: "#ff6b6b" },
  { label: "接球训练", value: "receive", icon: Grid, color: "#4ecdc4" },
  { label: "发球训练", value: "serve", icon: Connection, color: "#45b7d1" }
];

// 当前选中的课程类型
const activeType = ref("all");
const statusFilter = ref("all");
const searchText = ref("");

// 课程数据
const courses = ref([
  {
    id: 1,
    name: "基础扣球入门",
    type: "spike",
    description: "学习基本扣球动作和起跳时机",
    time: "周一、周三 14:00-16:00",
    location: "1号球场",
    capacity: 20,
    students: 18,
    difficulty: 1,
    status: "enrolling"
  },
  {
    id: 2,
    name: "强力跳发球训练",
    type: "serve",
    description: "掌握跳发球技巧和力量控制",
    time: "周二、周四 15:00-17:00",
    location: "3号球场",
    capacity: 15,
    students: 15,
    difficulty: 3,
    status: "ongoing"
  },
  {
    id: 3,
    name: "一传稳定性训练",
    type: "receive",
    description: "提高一传到位率和稳定性",
    time: "周五 10:00-12:00",
    location: "2号球场",
    capacity: 25,
    students: 22,
    difficulty: 2,
    status: "enrolling"
  },
  {
    id: 4,
    name: "战术扣球提高班",
    type: "spike",
    description: "学习线路选择和吊球技巧",
    time: "周六 09:00-11:00",
    location: "1号球场",
    capacity: 12,
    students: 12,
    difficulty: 3,
    status: "ended"
  },
  {
    id: 5,
    name: "飘球与旋转发球",
    type: "serve",
    description: "掌握不同发球技术和落点控制",
    time: "周日 14:00-16:00",
    location: "3号球场",
    capacity: 18,
    students: 10,
    difficulty: 2,
    status: "enrolling"
  },
  {
    id: 6,
    name: "防守接球强化",
    type: "receive",
    description: "针对防守位置的接球训练",
    time: "周三 19:00-21:00",
    location: "4号球场",
    capacity: 20,
    students: 16,
    difficulty: 2,
    status: "ongoing"
  }
]);

// 计算过滤后的课程
const filteredCourses = computed(() => {
  return courses.value.filter(course => {
    // 按类型过滤
    if (activeType.value !== "all" && course.type !== activeType.value) {
      return false;
    }

    // 按状态过滤
    if (statusFilter.value !== "all" && course.status !== statusFilter.value) {
      return false;
    }

    // 按搜索文本过滤
    if (searchText.value && !course.name.includes(searchText.value)) {
      return false;
    }

    return true;
  });
});

// 获取类型统计
const getTypeCount = (type: string) => {
  return courses.value.filter(c => c.type === type).length;
};

const getTypeStudents = (type: string) => {
  return courses.value
    .filter(c => c.type === type)
    .reduce((sum, c) => sum + c.students, 0);
};

// 辅助函数
const getTypeColor = (type: string) => {
  const typeObj = courseTypes.find(t => t.value === type);
  return typeObj ? typeObj.color : "#409eff";
};

const getTypeLabel = (type: string) => {
  const typeObj = courseTypes.find(t => t.value === type);
  return typeObj ? typeObj.label : "排球课程";
};
const toggleTypeFilter = (type: string) => {
  if (activeType.value === type) {
    // 再次点击已选中的类型 → 取消选择 → 显示全部
    activeType.value = "all";
  } else {
    // 点击其他类型 → 选择该类型
    activeType.value = type;
  }
};
const getStatusText = (status: string) => {
  const map: Record<string, string> = {
    enrolling: "报名中",
    ongoing: "进行中",
    ended: "已结束"
  };
  return map[status] || status;
};

// 操作函数
const createCourse = () => {
  console.log("创建新课程");
};

const viewStudents = (course: any) => {
  console.log("查看学员:", course.name);
};

const editCourse = (course: any) => {
  console.log("编辑课程:", course.name);
};

const closeEnrollment = (course: any) => {
  console.log("关闭报名:", course.name);
};

const exportList = (course: any) => {
  console.log("导出名单:", course.name);
};
</script>

<style scoped>
.volleyball-courses-container {
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto;
}

/* 课程类型卡片 */
.course-type-cards {
  display: flex;
  gap: 20px;
  margin-bottom: 30px;
}

.type-card {
  flex: 1;
  background: white;
  border-radius: 16px;
  padding: 24px;
  display: flex;
  align-items: center;
  gap: 20px;
  cursor: pointer;
  border: 2px solid transparent;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.type-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.1);
}

.type-card.active {
  border-color: #409eff;
  background: linear-gradient(135deg, #f0f9ff, #ffffff);
}

.type-icon {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.type-info h3 {
  margin: 0 0 8px 0;
  font-size: 18px;
  color: #303133;
}

.type-stats {
  display: flex;
  align-items: baseline;
  gap: 6px;
  margin-bottom: 8px;
}

.stat-number {
  font-size: 24px;
  font-weight: bold;
  color: #303133;
}

.stat-label {
  font-size: 14px;
  color: #909399;
}

.type-students {
  font-size: 14px;
  color: #606266;
  display: flex;
  align-items: center;
  gap: 6px;
}

/* 快速操作栏 */
.quick-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  padding: 0 10px;
}

.create-btn {
  padding: 12px 28px;
  font-size: 15px;
  font-weight: 500;
  border-radius: 10px;
}

.action-filters {
  display: flex;
  gap: 15px;
  align-items: center;
}

/* 课程网格 */
.courses-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
  gap: 24px;
}

.course-card {
  background: white;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: 1px solid #f0f2f5;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
}

.course-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
}

/* 卡片头部 */
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px 0;
  margin-bottom: 16px;
}

.course-badge {
  padding: 6px 14px;
  border-radius: 20px;
  color: white;
  font-size: 13px;
  font-weight: 600;
}

.course-status {
  font-size: 12px;
  padding: 4px 12px;
  border-radius: 12px;
  font-weight: 500;
}

.course-status.enrolling {
  background: #f0f9ff;
  color: #409eff;
}

.course-status.ongoing {
  background: #f6ffed;
  color: #67c23a;
}

.course-status.ended {
  background: #fef0f0;
  color: #f56c6c;
}

/* 卡片内容 */
.card-content {
  padding: 0 24px;
  flex: 1;
}

.course-title {
  margin: 0 0 12px 0;
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  line-height: 1.4;
}

.course-description {
  margin: 0 0 20px 0;
  font-size: 14px;
  color: #606266;
  line-height: 1.6;
}

.course-details {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 20px;
}

.detail-item {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
  color: #606266;
}

.detail-item .el-icon {
  color: #909399;
  width: 16px;
}

/* 进度条 */
.capacity-progress {
  margin: 20px 0;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 13px;
  color: #909399;
}

/* 卡片操作 */
.card-actions {
  display: flex;
  gap: 12px;
  padding: 20px 24px;
  border-top: 1px solid #f0f2f5;
  margin-top: auto;
}

.card-actions .el-button {
  flex: 1;
  padding: 10px;
}

/* 空状态 */
.empty-courses {
  padding: 80px 0;
  text-align: center;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .courses-grid {
    grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  }
}

@media (max-width: 992px) {
  .course-type-cards {
    flex-direction: column;
  }

  .type-card {
    width: 100%;
  }
}

@media (max-width: 768px) {
  .volleyball-courses-container {
    padding: 16px;
  }

  .courses-grid {
    grid-template-columns: 1fr;
  }

  .quick-actions {
    flex-direction: column;
    gap: 15px;
    align-items: stretch;
  }

  .action-filters {
    flex-direction: column;
    width: 100%;
  }

  .action-filters .el-select,
  .action-filters .el-input {
    width: 100% !important;
  }
}

@media (max-width: 576px) {
  .type-card {
    flex-direction: column;
    text-align: center;
    padding: 20px;
  }

  .card-actions {
    flex-direction: column;
  }
}
</style>
