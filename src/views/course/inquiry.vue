<template>
  <div class="grade-query-container">
    <!-- 顶部横幅 -->
    <div class="banner-section">
      <div class="banner-content">
        <h1 class="banner-title"><i class="fas fa-chart-line" /> 成绩查询</h1>
        <p class="banner-description">
          查询课程成绩、绩点统计，支持成绩单下载和导出
        </p>
      </div>
    </div>

    <!-- 成绩概览 -->
    <div class="overview-section">
      <div class="overview-cards">
        <div class="overview-card">
          <div class="card-icon gpa">
            <i class="fas fa-star" />
          </div>
          <div class="card-content">
            <div class="card-value">{{ overview.currentGPA }}</div>
            <div class="card-label">当前GPA</div>
            <div
              class="card-change"
              :class="overview.gpaChange >= 0 ? 'positive' : 'negative'"
            >
              <i
                :class="
                  overview.gpaChange >= 0
                    ? 'fas fa-arrow-up'
                    : 'fas fa-arrow-down'
                "
              />
              {{ Math.abs(overview.gpaChange).toFixed(2) }}
            </div>
          </div>
        </div>

        <div class="overview-card">
          <div class="card-icon courses">
            <i class="fas fa-book" />
          </div>
          <div class="card-content">
            <div class="card-value">{{ overview.completedCourses }}</div>
            <div class="card-label">已完成课程</div>
            <div class="card-detail">
              <span class="detail-item">
                <i class="fas fa-check-circle" />
                {{ overview.excellentCount }}门优秀
              </span>
            </div>
          </div>
        </div>

        <div class="overview-card">
          <div class="card-icon credits">
            <i class="fas fa-graduation-cap" />
          </div>
          <div class="card-content">
            <div class="card-value">{{ overview.totalCredits }}</div>
            <div class="card-label">已获总学分</div>
            <div class="card-progress">
              <el-progress
                :percentage="
                  Math.min(
                    100,
                    (overview.totalCredits / overview.targetCredits) * 100
                  )
                "
                :stroke-width="6"
                :show-text="false"
              />
              <span class="progress-text">
                目标{{ overview.targetCredits }}学分
              </span>
            </div>
          </div>
        </div>

        <div class="overview-card">
          <div class="card-icon ranking">
            <i class="fas fa-trophy" />
          </div>
          <div class="card-content">
            <div class="card-value">{{ overview.averageRanking }}</div>
            <div class="card-label">平均排名</div>
            <div class="card-trend">
              <span v-if="overview.rankingImprovement > 0" class="trend-up">
                <i class="fas fa-arrow-up" /> 进步{{
                  overview.rankingImprovement
                }}名
              </span>
              <span
                v-else-if="overview.rankingImprovement < 0"
                class="trend-down"
              >
                <i class="fas fa-arrow-down" /> 退步{{
                  Math.abs(overview.rankingImprovement)
                }}名
              </span>
              <span v-else class="trend-stable">保持稳定</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 筛选和操作 -->
    <div class="filter-section">
      <div class="filter-container">
        <div class="filter-left">
          <el-form :inline="true" :model="filterForm" class="filter-form">
            <el-form-item label="学年学期">
              <el-select
                v-model="filterForm.academicYear"
                placeholder="请选择学年"
                clearable
                @change="handleFilter"
              >
                <el-option label="全部学年" value="" />
                <el-option
                  v-for="year in academicYears"
                  :key="year"
                  :label="year"
                  :value="year"
                />
              </el-select>
            </el-form-item>

            <el-form-item label="学期">
              <el-select
                v-model="filterForm.semester"
                placeholder="请选择学期"
                clearable
                @change="handleFilter"
              >
                <el-option label="全部学期" value="" />
                <el-option label="春季学期" value="spring" />
                <el-option label="秋季学期" value="autumn" />
              </el-select>
            </el-form-item>

            <el-form-item label="课程类型">
              <el-select
                v-model="filterForm.courseType"
                placeholder="请选择课程类型"
                clearable
                @change="handleFilter"
              >
                <el-option label="全部类型" value="" />
                <el-option label="扣球训练" value="spike" />
                <el-option label="接球训练" value="receive" />
                <el-option label="发球训练" value="serve" />
              </el-select>
            </el-form-item>

            <el-form-item label="成绩等级">
              <el-select
                v-model="filterForm.gradeLevel"
                placeholder="请选择等级"
                clearable
                @change="handleFilter"
              >
                <el-option label="全部等级" value="" />
                <el-option label="优秀(A)" value="A" />
                <el-option label="良好(B)" value="B" />
                <el-option label="中等(C)" value="C" />
                <el-option label="及格(D)" value="D" />
                <el-option label="不及格(F)" value="F" />
              </el-select>
            </el-form-item>
          </el-form>
        </div>

        <div class="filter-right">
          <el-input
            v-model="searchKeyword"
            placeholder="搜索课程名称、教师"
            clearable
            style="width: 200px"
            @input="handleSearch"
          >
            <template #prefix>
              <i class="fas fa-search" />
            </template>
          </el-input>

          <el-button type="primary" @click="handleBatchDownload">
            <i class="fas fa-download" /> 批量下载
          </el-button>

          <el-button @click="handleExport">
            <i class="fas fa-file-export" /> 导出Excel
          </el-button>

          <el-button @click="resetFilters">
            <i class="fas fa-redo" /> 重置
          </el-button>
        </div>
      </div>

      <!-- 快速筛选 -->
      <div class="quick-filter">
        <div class="quick-filter-title">
          <i class="fas fa-bolt" /> 快速筛选：
        </div>
        <div class="quick-filter-items">
          <el-tag
            v-for="item in quickFilters"
            :key="item.key"
            :type="item.active ? 'primary' : 'info'"
            class="quick-filter-tag"
            @click="toggleQuickFilter(item)"
          >
            {{ item.label }}
          </el-tag>
        </div>
      </div>
    </div>

    <!-- 成绩列表 -->
    <div class="grades-section">
      <div class="section-header">
        <h2 class="section-title">
          <i class="fas fa-table" />
          成绩详情列表
          <span class="grades-count">({{ filteredGrades.length }}条记录)</span>
        </h2>
        <div class="section-actions">
          <el-button
            type="success"
            :loading="generatingTranscript"
            @click="generateTranscript"
          >
            <i class="fas fa-file-pdf" /> 生成成绩单
          </el-button>
        </div>
      </div>

      <div v-if="loading" class="loading-spinner">
        <i class="fas fa-spinner fa-spin" /> 加载中...
      </div>

      <div v-else-if="filteredGrades.length === 0" class="empty-state">
        <i class="fas fa-chart-bar" />
        <h3>暂无成绩记录</h3>
        <p>当前没有可查询的成绩记录</p>
      </div>

      <div v-else class="grades-list">
        <div
          v-for="grade in paginatedGrades"
          :key="grade.id"
          class="grade-item"
          :class="`grade-${grade.grade_level}`"
        >
          <div class="grade-header">
            <div class="course-info">
              <div class="course-name">{{ grade.course_name }}</div>
              <div class="course-details">
                <span class="detail-item">
                  <i class="fas fa-chalkboard-teacher" />
                  {{ grade.teacher_name }}
                </span>
                <span class="detail-item">
                  <i class="fas fa-calendar" />
                  {{ grade.academic_year }}
                  {{ getSemesterText(grade.semester) }}
                </span>
                <span class="detail-item">
                  <i class="fas fa-star" />
                  {{ grade.credits }}学分
                </span>
              </div>
            </div>
            <div class="grade-main">
              <div
                class="total-score"
                :class="getScoreClass(grade.total_score)"
              >
                {{ grade.total_score }}分
              </div>
              <div class="grade-level">
                <span class="level-badge" :class="`level-${grade.grade_level}`">
                  {{ grade.grade_level }}
                </span>
              </div>
            </div>
          </div>

          <div class="grade-details">
            <div class="score-breakdown">
              <div class="score-item">
                <span class="score-label">平时成绩</span>
                <span class="score-value">{{ grade.normal_score }}分</span>
              </div>
              <div class="score-item">
                <span class="score-label">期末成绩</span>
                <span class="score-value">{{ grade.final_score }}分</span>
              </div>
              <div class="score-item">
                <span class="score-label">绩点</span>
                <span class="score-value gpa">{{ grade.gpa.toFixed(2) }}</span>
              </div>
              <div class="score-item">
                <span class="score-label">班级排名</span>
                <span class="score-value ranking">
                  第{{ grade.ranking }}名 / {{ grade.class_size }}人
                </span>
              </div>
            </div>
          </div>

          <div class="grade-footer">
            <div class="status-info">
              <span class="status-item">
                <i class="fas fa-check-circle" />
                成绩状态：{{ getGradeStatusText(grade.grade_status) }}
              </span>
              <span class="status-item">
                <i class="fas fa-calendar-alt" />
                发布时间：{{ formatDate(grade.published_at) }}
              </span>
            </div>

            <div class="grade-actions">
              <el-button
                type="primary"
                size="small"
                @click="viewGradeDetail(grade)"
              >
                <i class="fas fa-eye" /> 查看详情
              </el-button>

              <el-button
                type="success"
                size="small"
                :loading="downloadingId === grade.id"
                @click="downloadTranscript(grade)"
              >
                <i class="fas fa-download" /> 下载成绩单
              </el-button>

              <el-button
                v-if="grade.grade_status === 'published'"
                type="warning"
                size="small"
                @click="applyRecheck(grade)"
              >
                <i class="fas fa-redo" /> 申请复核
              </el-button>
            </div>
          </div>
        </div>
      </div>

      <!-- 分页 -->
      <div v-if="filteredGrades.length > 0" class="pagination-section">
        <el-pagination
          v-model:current-page="pagination.currentPage"
          v-model:page-size="pagination.pageSize"
          :total="filteredGrades.length"
          :page-sizes="[5, 10, 20, 50]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handlePageSizeChange"
          @current-change="handlePageChange"
        />
      </div>
    </div>

    <!-- 成绩单下载历史 -->
    <div class="download-history-section">
      <div class="section-header">
        <h2 class="section-title">
          <i class="fas fa-history" />
          成绩单下载历史
        </h2>
        <el-button type="text" @click="refreshHistory">
          <i class="fas fa-sync-alt" /> 刷新
        </el-button>
      </div>

      <div v-if="loadingHistory" class="loading-spinner">
        <i class="fas fa-spinner fa-spin" /> 加载中...
      </div>

      <div v-else-if="downloadHistory.length === 0" class="empty-state">
        <i class="fas fa-download" />
        <h3>暂无下载记录</h3>
        <p>您还没有下载过成绩单</p>
      </div>

      <div v-else class="history-list">
        <div
          v-for="record in downloadHistory"
          :key="record.id"
          class="history-item"
        >
          <div class="history-content">
            <div class="history-info">
              <div class="file-name">
                <i class="fas fa-file-pdf" />
                <span>{{ record.file_name }}</span>
              </div>
              <div class="download-details">
                <span class="detail-item">
                  <i class="fas fa-calendar-alt" />
                  下载时间：{{ formatDateTime(record.download_time) }}
                </span>
                <span class="detail-item">
                  <i class="fas fa-file-size" />
                  文件大小：{{ formatFileSize(record.file_size) }}
                </span>
                <span class="detail-item">
                  <i class="fas fa-download" />
                  下载次数：{{ record.download_count }}
                </span>
              </div>
            </div>
            <div class="history-actions">
              <el-button
                type="primary"
                size="small"
                @click="redownloadTranscript(record)"
              >
                <i class="fas fa-redownload" /> 重新下载
              </el-button>
              <el-button
                type="default"
                size="small"
                @click="deleteHistory(record)"
              >
                <i class="fas fa-trash-alt" /> 删除记录
              </el-button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 弹窗：成绩详情 -->
    <el-dialog
      v-model="gradeDetailVisible"
      :title="selectedGrade?.course_name + ' - 成绩详情'"
      width="600px"
    >
      <div v-if="selectedGrade" class="grade-detail-modal">
        <div class="detail-section">
          <h3><i class="fas fa-info-circle" /> 课程信息</h3>
          <div class="detail-grid">
            <div class="detail-item">
              <span class="detail-label">课程编号：</span>
              <span class="detail-value">{{ selectedGrade.course_code }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">课程类型：</span>
              <span class="detail-value">{{
                getCourseTypeText(selectedGrade.course_type)
              }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">授课教师：</span>
              <span class="detail-value">{{ selectedGrade.teacher_name }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">学分：</span>
              <span class="detail-value">{{ selectedGrade.credits }}学分</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">学年学期：</span>
              <span class="detail-value"
                >{{ selectedGrade.academic_year }}
                {{ getSemesterText(selectedGrade.semester) }}</span
              >
            </div>
          </div>
        </div>

        <div class="detail-section">
          <h3><i class="fas fa-chart-bar" /> 成绩详情</h3>
          <div class="score-breakdown-detail">
            <div class="score-row">
              <span class="score-label">平时成绩：</span>
              <span class="score-value"
                >{{ selectedGrade.normal_score }}分</span
              >
              <span class="score-percent"
                >(占比{{ selectedGrade.normal_percent }}%)</span
              >
            </div>
            <div class="score-row">
              <span class="score-label">期末成绩：</span>
              <span class="score-value">{{ selectedGrade.final_score }}分</span>
              <span class="score-percent"
                >(占比{{ selectedGrade.final_percent }}%)</span
              >
            </div>
            <div class="score-row total">
              <span class="score-label">总成绩：</span>
              <span class="score-value">{{ selectedGrade.total_score }}分</span>
              <span
                class="grade-level-badge"
                :class="`level-${selectedGrade.grade_level}`"
              >
                {{ selectedGrade.grade_level }}
              </span>
            </div>
            <div class="score-row">
              <span class="score-label">绩点：</span>
              <span class="score-value">{{
                selectedGrade.gpa.toFixed(2)
              }}</span>
            </div>
            <div class="score-row">
              <span class="score-label">班级排名：</span>
              <span class="score-value"
                >第{{ selectedGrade.ranking }}名 /
                {{ selectedGrade.class_size }}人</span
              >
            </div>
          </div>
        </div>

        <div v-if="selectedGrade.comment" class="detail-section">
          <h3><i class="fas fa-comment" /> 教师评语</h3>
          <div class="teacher-comment">
            {{ selectedGrade.comment }}
          </div>
        </div>

        <div class="detail-section">
          <h3><i class="fas fa-history" /> 状态信息</h3>
          <div class="status-grid">
            <div class="status-item">
              <span class="status-label">成绩状态：</span>
              <el-tag
                :type="getGradeStatusTag(selectedGrade.grade_status)"
                size="small"
              >
                {{ getGradeStatusText(selectedGrade.grade_status) }}
              </el-tag>
            </div>
            <div class="status-item">
              <span class="status-label">发布时间：</span>
              <span class="status-value">{{
                formatDateTime(selectedGrade.published_at)
              }}</span>
            </div>
            <div class="status-item">
              <span class="status-label">提交教师：</span>
              <span class="status-value">{{
                selectedGrade.submitter_name || "系统"
              }}</span>
            </div>
          </div>
        </div>
      </div>
      <template #footer>
        <el-button @click="gradeDetailVisible = false">关闭</el-button>
        <el-button type="primary" @click="downloadSelectedGrade">
          <i class="fas fa-download" /> 下载成绩单
        </el-button>
      </template>
    </el-dialog>

    <!-- 弹窗：生成成绩单选项 -->
    <el-dialog
      v-model="transcriptOptionsVisible"
      title="生成成绩单"
      width="500px"
    >
      <el-form :model="transcriptForm" label-width="100px">
        <el-form-item label="成绩单类型">
          <el-radio-group v-model="transcriptForm.type">
            <el-radio label="official">官方成绩单</el-radio>
            <el-radio label="unofficial">非官方成绩单</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="包含课程">
          <el-checkbox-group v-model="transcriptForm.courseTypes">
            <el-checkbox label="spike">扣球训练</el-checkbox>
            <el-checkbox label="receive">接球训练</el-checkbox>
            <el-checkbox label="serve">发球训练</el-checkbox>
          </el-checkbox-group>
        </el-form-item>

        <el-form-item label="时间范围">
          <el-select
            v-model="transcriptForm.timeRange"
            placeholder="请选择时间范围"
            style="width: 100%"
          >
            <el-option label="全部成绩" value="all" />
            <el-option label="近一年" value="1year" />
            <el-option label="近两年" value="2years" />
            <el-option label="自定义" value="custom" />
          </el-select>
        </el-form-item>

        <el-form-item label="包含GPA">
          <el-switch v-model="transcriptForm.includeGPA" />
        </el-form-item>

        <el-form-item label="包含排名">
          <el-switch v-model="transcriptForm.includeRanking" />
        </el-form-item>

        <el-form-item label="文件格式">
          <el-radio-group v-model="transcriptForm.format">
            <el-radio label="pdf">PDF格式</el-radio>
            <el-radio label="excel">Excel格式</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="使用场景">
          <el-input
            v-model="transcriptForm.purpose"
            type="textarea"
            :rows="2"
            placeholder="请输入成绩单使用场景，如：申请奖学金、求职等"
            maxlength="100"
            show-word-limit
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="transcriptOptionsVisible = false">取消</el-button>
        <el-button
          type="primary"
          :loading="generatingTranscript"
          @click="confirmGenerateTranscript"
        >
          生成并下载
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from "vue";
import { ElMessage, ElMessageBox, type UploadFile } from "element-plus";

// ---------------------- 类型定义 ----------------------
interface Grade {
  id: number;
  course_id: number;
  course_code: string;
  course_name: string;
  course_type: "spike" | "receive" | "serve";
  teacher_name: string;
  academic_year: string;
  semester: "spring" | "autumn";
  credits: number;
  normal_score: number;
  final_score: number;
  total_score: number;
  grade_level: "A" | "B" | "C" | "D" | "F";
  gpa: number;
  ranking: number;
  class_size: number;
  grade_status: "ungraded" | "grading" | "published";
  published_at: string;
  submitter_name?: string;
  normal_percent: number;
  final_percent: number;
  comment?: string;
}

interface DownloadHistory {
  id: number;
  file_name: string;
  download_time: string;
  file_size: number;
  download_count: number;
  format: "pdf" | "excel";
}

interface QuickFilter {
  key: string;
  label: string;
  active: boolean;
}

// ---------------------- 状态管理 ----------------------
const loading = ref(false);
const loadingHistory = ref(false);
const generatingTranscript = ref(false);
const downloadingId = ref<number | null>(null);
const gradeDetailVisible = ref(false);
const transcriptOptionsVisible = ref(false);
const selectedGrade = ref<Grade | null>(null);
const searchKeyword = ref("");

// ---------------------- 概览数据 ----------------------
const overview = reactive({
  currentGPA: 3.45,
  gpaChange: 0.12,
  completedCourses: 8,
  excellentCount: 3,
  totalCredits: 18,
  targetCredits: 24,
  averageRanking: 15.5,
  rankingImprovement: 3
});

// ---------------------- 筛选条件 ----------------------
const filterForm = reactive({
  academicYear: "",
  semester: "",
  courseType: "",
  gradeLevel: ""
});

const academicYears = computed(() => {
  const years = new Set(grades.value.map(grade => grade.academic_year));
  return Array.from(years).sort((a, b) => b.localeCompare(a));
});

// ---------------------- 快速筛选 ----------------------
const quickFilters = ref<QuickFilter[]>([
  { key: "excellent", label: "优秀课程", active: false },
  { key: "failed", label: "不及格课程", active: false },
  { key: "recent", label: "本学期成绩", active: false },
  { key: "spike", label: "扣球训练", active: false },
  { key: "receive", label: "接球训练", active: false },
  { key: "serve", label: "发球训练", active: false }
]);

// ---------------------- 分页配置 ----------------------
const pagination = reactive({
  currentPage: 1,
  pageSize: 10,
  total: 0
});

// ---------------------- 表单数据 ----------------------
const transcriptForm = reactive({
  type: "official",
  courseTypes: ["spike", "receive", "serve"],
  timeRange: "all",
  includeGPA: true,
  includeRanking: true,
  format: "pdf",
  purpose: ""
});

// ---------------------- 模拟数据 ----------------------
const grades = ref<Grade[]>([
  {
    id: 1,
    course_id: 1,
    course_code: "SV101",
    course_name: "基础发球入门",
    course_type: "serve",
    teacher_name: "李教练",
    academic_year: "2023-2024",
    semester: "spring",
    credits: 1,
    normal_score: 90,
    final_score: 94,
    total_score: 92,
    grade_level: "A",
    gpa: 4.0,
    ranking: 5,
    class_size: 25,
    grade_status: "published",
    published_at: "2024-01-20 14:30:00",
    submitter_name: "张老师",
    normal_percent: 40,
    final_percent: 60,
    comment: "学习认真，发球技巧掌握良好"
  },
  {
    id: 2,
    course_id: 2,
    course_code: "RC201",
    course_name: "一传稳定性训练",
    course_type: "receive",
    teacher_name: "王教练",
    academic_year: "2023-2024",
    semester: "spring",
    credits: 2,
    normal_score: 82,
    final_score: 84,
    total_score: 83,
    grade_level: "B",
    gpa: 3.3,
    ranking: 12,
    class_size: 20,
    grade_status: "published",
    published_at: "2024-01-22 10:15:00",
    submitter_name: "王老师",
    normal_percent: 40,
    final_percent: 60
  },
  {
    id: 3,
    course_id: 3,
    course_code: "SP301",
    course_name: "战术扣球与线路变化",
    course_type: "spike",
    teacher_name: "张教练",
    academic_year: "2023-2024",
    semester: "autumn",
    credits: 3,
    normal_score: 78,
    final_score: 82,
    total_score: 80,
    grade_level: "B",
    gpa: 3.0,
    ranking: 15,
    class_size: 18,
    grade_status: "published",
    published_at: "2024-01-18 16:20:00",
    submitter_name: "李老师",
    normal_percent: 40,
    final_percent: 60,
    comment: "战术理解能力有待提高"
  },
  {
    id: 4,
    course_id: 4,
    course_code: "SV201",
    course_name: "强力跳发球训练",
    course_type: "serve",
    teacher_name: "王教练",
    academic_year: "2023-2024",
    semester: "autumn",
    credits: 2,
    normal_score: 85,
    final_score: 88,
    total_score: 87,
    grade_level: "B",
    gpa: 3.7,
    ranking: 8,
    class_size: 20,
    grade_status: "published",
    published_at: "2024-01-19 11:30:00",
    submitter_name: "王老师",
    normal_percent: 40,
    final_percent: 60
  },
  {
    id: 5,
    course_id: 5,
    course_code: "RC101",
    course_name: "基础接球入门",
    course_type: "receive",
    teacher_name: "刘教练",
    academic_year: "2022-2023",
    semester: "spring",
    credits: 1,
    normal_score: 92,
    final_score: 98,
    total_score: 95,
    grade_level: "A",
    gpa: 4.0,
    ranking: 3,
    class_size: 30,
    grade_status: "published",
    published_at: "2023-01-25 09:45:00",
    submitter_name: "刘老师",
    normal_percent: 40,
    final_percent: 60,
    comment: "表现优秀，基础扎实"
  },
  {
    id: 6,
    course_id: 6,
    course_code: "SP101",
    course_name: "基础扣球入门",
    course_type: "spike",
    teacher_name: "王教练",
    academic_year: "2022-2023",
    semester: "autumn",
    credits: 1,
    normal_score: 65,
    final_score: 70,
    total_score: 68,
    grade_level: "D",
    gpa: 1.0,
    ranking: 25,
    class_size: 28,
    grade_status: "published",
    published_at: "2023-01-28 14:15:00",
    submitter_name: "王老师",
    normal_percent: 40,
    final_percent: 60
  }
]);

const downloadHistory = ref<DownloadHistory[]>([
  {
    id: 1,
    file_name: "2023-2024学年成绩单.pdf",
    download_time: "2024-01-25 10:30:00",
    file_size: 2048576,
    download_count: 2,
    format: "pdf"
  },
  {
    id: 2,
    file_name: "2022-2023学年成绩汇总.xlsx",
    download_time: "2023-12-15 16:45:00",
    file_size: 1024576,
    download_count: 1,
    format: "excel"
  },
  {
    id: 3,
    file_name: "完整成绩单.pdf",
    download_time: "2023-11-20 09:15:00",
    file_size: 3072256,
    download_count: 3,
    format: "pdf"
  }
]);

// ---------------------- 计算属性 ----------------------
// 过滤后的成绩
const filteredGrades = computed(() => {
  let filtered = [...grades.value];

  // 应用表单筛选
  if (filterForm.academicYear) {
    filtered = filtered.filter(
      grade => grade.academic_year === filterForm.academicYear
    );
  }

  if (filterForm.semester) {
    filtered = filtered.filter(grade => grade.semester === filterForm.semester);
  }

  if (filterForm.courseType) {
    filtered = filtered.filter(
      grade => grade.course_type === filterForm.courseType
    );
  }

  if (filterForm.gradeLevel) {
    filtered = filtered.filter(
      grade => grade.grade_level === filterForm.gradeLevel
    );
  }

  // 应用快速筛选
  const activeQuickFilters = quickFilters.value.filter(filter => filter.active);
  if (activeQuickFilters.length > 0) {
    filtered = filtered.filter(grade => {
      return activeQuickFilters.some(filter => {
        switch (filter.key) {
          case "excellent":
            return grade.grade_level === "A";
          case "failed":
            return grade.grade_level === "F";
          case "recent":
            return (
              grade.academic_year === "2023-2024" && grade.semester === "spring"
            );
          case "spike":
            return grade.course_type === "spike";
          case "receive":
            return grade.course_type === "receive";
          case "serve":
            return grade.course_type === "serve";
          default:
            return true;
        }
      });
    });
  }

  // 应用关键词搜索
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase();
    filtered = filtered.filter(
      grade =>
        grade.course_name.toLowerCase().includes(keyword) ||
        grade.teacher_name.toLowerCase().includes(keyword) ||
        grade.course_code.toLowerCase().includes(keyword)
    );
  }

  // 只显示已发布的成绩
  filtered = filtered.filter(grade => grade.grade_status === "published");

  // 按发布时间倒序排序
  filtered.sort(
    (a, b) =>
      new Date(b.published_at).getTime() - new Date(a.published_at).getTime()
  );

  // 更新分页总数
  pagination.total = filtered.length;

  return filtered;
});

// 分页后的成绩
const paginatedGrades = computed(() => {
  const start = (pagination.currentPage - 1) * pagination.pageSize;
  const end = start + pagination.pageSize;
  return filteredGrades.value.slice(start, end);
});

// ---------------------- 辅助函数 ----------------------
const getCourseTypeText = (type: string) => {
  const map: Record<string, string> = {
    spike: "扣球训练",
    receive: "接球训练",
    serve: "发球训练"
  };
  return map[type] || type;
};

const getSemesterText = (semester: string) => {
  const map: Record<string, string> = {
    spring: "春季学期",
    autumn: "秋季学期"
  };
  return map[semester] || semester;
};

const getGradeStatusText = (status: string) => {
  const map: Record<string, string> = {
    ungraded: "未录入",
    grading: "录入中",
    published: "已发布"
  };
  return map[status] || status;
};

const getGradeStatusTag = (status: string) => {
  const map: Record<string, string> = {
    ungraded: "info",
    grading: "warning",
    published: "success"
  };
  return map[status] || "info";
};

const getScoreClass = (score: number) => {
  if (score >= 90) return "score-excellent";
  if (score >= 80) return "score-good";
  if (score >= 70) return "score-medium";
  if (score >= 60) return "score-pass";
  return "score-fail";
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return `${date.getMonth() + 1}月${date.getDate()}日`;
};

const formatDateTime = (dateString: string) => {
  const date = new Date(dateString);
  return date
    .toLocaleString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    })
    .replace(/\//g, "-");
};

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
};

// ---------------------- 事件处理函数 ----------------------
// 筛选处理
const handleFilter = () => {
  pagination.currentPage = 1;
};

const handleSearch = () => {
  pagination.currentPage = 1;
};

const toggleQuickFilter = (filter: QuickFilter) => {
  filter.active = !filter.active;
  pagination.currentPage = 1;
};

const resetFilters = () => {
  Object.assign(filterForm, {
    academicYear: "",
    semester: "",
    courseType: "",
    gradeLevel: ""
  });

  quickFilters.value.forEach(filter => {
    filter.active = false;
  });

  searchKeyword.value = "";
  pagination.currentPage = 1;

  ElMessage.success("筛选条件已重置");
};

// 分页处理
const handlePageSizeChange = (size: number) => {
  pagination.pageSize = size;
  pagination.currentPage = 1;
};

const handlePageChange = (page: number) => {
  pagination.currentPage = page;
};

// 成绩详情
const viewGradeDetail = (grade: Grade) => {
  selectedGrade.value = grade;
  gradeDetailVisible.value = true;
};

// 下载成绩单
const downloadTranscript = async (grade: Grade) => {
  downloadingId.value = grade.id;

  try {
    // 模拟下载过程
    await new Promise(resolve => setTimeout(resolve, 1500));

    // 添加到下载历史
    const historyRecord: DownloadHistory = {
      id: downloadHistory.value.length + 1,
      file_name: `${grade.academic_year}_${grade.semester}_${grade.course_name}_成绩单.pdf`,
      download_time: new Date().toISOString(),
      file_size: 1024576,
      download_count: 1,
      format: "pdf"
    };

    downloadHistory.value.unshift(historyRecord);

    ElMessage.success("成绩单下载成功");

    // 模拟文件下载
    const blob = new Blob(["成绩单内容"], { type: "application/pdf" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = historyRecord.file_name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    ElMessage.error("下载失败，请重试");
  } finally {
    downloadingId.value = null;
  }
};

const downloadSelectedGrade = () => {
  if (selectedGrade.value) {
    downloadTranscript(selectedGrade.value);
    gradeDetailVisible.value = false;
  }
};

// 生成成绩单
const generateTranscript = () => {
  transcriptOptionsVisible.value = true;
};

const confirmGenerateTranscript = async () => {
  generatingTranscript.value = true;

  try {
    // 模拟生成过程
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 添加到下载历史
    const historyRecord: DownloadHistory = {
      id: downloadHistory.value.length + 1,
      file_name: `成绩单_${new Date().getFullYear()}${(new Date().getMonth() + 1).toString().padStart(2, "0")}${new Date().getDate().toString().padStart(2, "0")}.${transcriptForm.format}`,
      download_time: new Date().toISOString(),
      file_size: transcriptForm.format === "pdf" ? 2048576 : 1048576,
      download_count: 1,
      format: transcriptForm.format as "pdf" | "excel"
    };

    downloadHistory.value.unshift(historyRecord);

    ElMessage.success("成绩单生成成功，开始下载...");

    // 模拟文件下载
    const mimeType =
      transcriptForm.format === "pdf"
        ? "application/pdf"
        : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    const blob = new Blob(["成绩单内容"], { type: mimeType });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = historyRecord.file_name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    transcriptOptionsVisible.value = false;
  } catch (error) {
    ElMessage.error("生成失败，请重试");
  } finally {
    generatingTranscript.value = false;
  }
};

// 批量下载
const handleBatchDownload = () => {
  if (filteredGrades.value.length === 0) {
    ElMessage.warning("没有可下载的成绩记录");
    return;
  }

  ElMessageBox.confirm(
    `确定要批量下载${filteredGrades.value.length}门课程的成绩单吗？`,
    "批量下载确认",
    {
      confirmButtonText: "确定下载",
      cancelButtonText: "取消",
      type: "warning"
    }
  ).then(async () => {
    generatingTranscript.value = true;

    try {
      await new Promise(resolve => setTimeout(resolve, 2000));

      const historyRecord: DownloadHistory = {
        id: downloadHistory.value.length + 1,
        file_name: `批量成绩单_${new Date().getTime()}.zip`,
        download_time: new Date().toISOString(),
        file_size: 5242880,
        download_count: 1,
        format: "pdf"
      };

      downloadHistory.value.unshift(historyRecord);
      ElMessage.success("批量下载任务已开始，请稍后查看下载历史");
    } catch (error) {
      ElMessage.error("批量下载失败");
    } finally {
      generatingTranscript.value = false;
    }
  });
};

// 导出Excel
const handleExport = () => {
  if (filteredGrades.value.length === 0) {
    ElMessage.warning("没有可导出的成绩记录");
    return;
  }

  generatingTranscript.value = true;

  try {
    // 模拟导出过程
    setTimeout(() => {
      // 创建Excel数据
      const headers = [
        "课程名称",
        "课程编号",
        "教师",
        "学分",
        "平时成绩",
        "期末成绩",
        "总成绩",
        "等级",
        "绩点",
        "排名",
        "学年学期"
      ];
      const data = filteredGrades.value.map(grade => [
        grade.course_name,
        grade.course_code,
        grade.teacher_name,
        grade.credits,
        grade.normal_score,
        grade.final_score,
        grade.total_score,
        grade.grade_level,
        grade.gpa.toFixed(2),
        grade.ranking,
        `${grade.academic_year} ${getSemesterText(grade.semester)}`
      ]);

      // 将数据转换为CSV格式
      const csvContent = [
        headers.join(","),
        ...data.map(row => row.join(","))
      ].join("\n");

      // 创建Blob并下载
      const blob = new Blob(["\ufeff" + csvContent], {
        type: "text/csv;charset=utf-8;"
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `成绩导出_${new Date().getTime()}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      ElMessage.success("导出成功");
      generatingTranscript.value = false;
    }, 1500);
  } catch (error) {
    ElMessage.error("导出失败");
    generatingTranscript.value = false;
  }
};

// 申请复核
const applyRecheck = (grade: Grade) => {
  ElMessageBox.prompt("请输入复核申请原因", "申请成绩复核", {
    confirmButtonText: "提交申请",
    cancelButtonText: "取消",
    inputPlaceholder: "请说明申请复核的具体原因",
    inputValidator: value => {
      if (!value) return "请输入复核原因";
      if (value.length < 10) return "复核原因至少10个字符";
      return true;
    }
  }).then(({ value }) => {
    ElMessage.success("复核申请已提交，请等待处理");
  });
};

// 下载历史管理
const refreshHistory = async () => {
  loadingHistory.value = true;
  try {
    await new Promise(resolve => setTimeout(resolve, 800));
    ElMessage.success("下载历史已刷新");
  } finally {
    loadingHistory.value = false;
  }
};

const redownloadTranscript = (record: DownloadHistory) => {
  // 模拟重新下载
  const blob = new Blob(["成绩单内容"], {
    type:
      record.format === "pdf"
        ? "application/pdf"
        : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = record.file_name;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);

  // 更新下载次数
  record.download_count++;
  record.download_time = new Date().toISOString();

  ElMessage.success("文件已重新下载");
};

const deleteHistory = async (record: DownloadHistory) => {
  try {
    await ElMessageBox.confirm(
      "确定要删除这条下载记录吗？删除后不可恢复。",
      "确认删除",
      {
        confirmButtonText: "确定删除",
        cancelButtonText: "取消",
        type: "warning"
      }
    );

    downloadHistory.value = downloadHistory.value.filter(
      item => item.id !== record.id
    );
    ElMessage.success("下载记录已删除");
  } catch {
    // 用户取消
  }
};

// ---------------------- 生命周期 ----------------------
onMounted(() => {
  console.log("成绩查询页面加载完成");
});
</script>

<style scoped lang="scss">
.grade-query-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px 40px;
}

/* 顶部横幅 */
.banner-section {
  background: linear-gradient(135deg, #2ecc71 0%, #27ae60 100%);
  border-radius: 12px;
  padding: 30px;
  margin-bottom: 30px;
  color: white;
  position: relative;
  overflow: hidden;

  &::before {
    content: "";
    position: absolute;
    top: -50%;
    right: -50%;
    width: 150px;
    height: 150px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 50%;
  }
}

.banner-content {
  position: relative;
  z-index: 1;
}

.banner-title {
  font-size: 28px;
  font-weight: 700;
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  gap: 15px;

  i {
    font-size: 32px;
    color: #ffd700;
  }
}

.banner-description {
  font-size: 16px;
  opacity: 0.9;
  max-width: 600px;
}

/* 概览卡片 */
.overview-section {
  margin-bottom: 30px;
}

.overview-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
}

.overview-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  transition: transform 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.1);
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

  &.gpa {
    background: linear-gradient(135deg, #9b59b6 0%, #8e44ad 100%);
  }

  &.courses {
    background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
  }

  &.credits {
    background: linear-gradient(135deg, #f39c12 0%, #d35400 100%);
  }

  &.ranking {
    background: linear-gradient(135deg, #2ecc71 0%, #27ae60 100%);
  }
}

.card-content {
  flex: 1;
}

.card-value {
  font-size: 28px;
  font-weight: 700;
  color: #2c3e50;
  line-height: 1;
  margin-bottom: 5px;
}

.card-label {
  font-size: 14px;
  color: #7f8c8d;
  margin-bottom: 8px;
}

.card-change {
  font-size: 12px;

  &.positive {
    color: #2ecc71;
  }

  &.negative {
    color: #e74c3c;
  }
}

.card-detail {
  .detail-item {
    font-size: 12px;
    color: #7f8c8d;
    display: flex;
    align-items: center;
    gap: 4px;
  }
}

.card-progress {
  .progress-text {
    display: block;
    font-size: 12px;
    color: #7f8c8d;
    margin-top: 5px;
  }
}

.card-trend {
  font-size: 12px;

  .trend-up {
    color: #2ecc71;
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .trend-down {
    color: #e74c3c;
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .trend-stable {
    color: #7f8c8d;
  }
}

/* 筛选区域 */
.filter-section {
  background: white;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 30px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.filter-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.filter-left {
  flex: 1;
}

.filter-form {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  align-items: center;

  :deep(.el-form-item) {
    margin-bottom: 0;
  }
}

.filter-right {
  display: flex;
  gap: 10px;
  align-items: center;
}

.quick-filter {
  display: flex;
  align-items: center;
  gap: 15px;
  padding-top: 15px;
  border-top: 1px solid #e9ecef;
}

.quick-filter-title {
  font-weight: 600;
  color: #2c3e50;
  display: flex;
  align-items: center;
  gap: 8px;
}

.quick-filter-items {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.quick-filter-tag {
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-1px);
  }
}

/* 成绩列表 */
.grades-section {
  background: white;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 30px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.section-title {
  font-size: 18px;
  font-weight: 600;
  color: #2c3e50;
  display: flex;
  align-items: center;
  gap: 10px;

  i {
    color: #2ecc71;
  }
}

.grades-count {
  font-size: 14px;
  color: #7f8c8d;
  font-weight: normal;
  margin-left: 5px;
}

.grades-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.grade-item {
  background: #f8f9fa;
  border-radius: 10px;
  padding: 20px;
  border: 1px solid #e9ecef;
  transition: all 0.3s ease;

  &:hover {
    border-color: #3498db;
    box-shadow: 0 4px 12px rgba(52, 152, 219, 0.1);
  }

  &.grade-A {
    border-left: 4px solid #2ecc71;
  }

  &.grade-B {
    border-left: 4px solid #3498db;
  }

  &.grade-C {
    border-left: 4px solid #f39c12;
  }

  &.grade-D {
    border-left: 4px solid #e74c3c;
  }

  &.grade-F {
    border-left: 4px solid #c0392b;
  }
}

.grade-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 15px;
}

.course-info {
  flex: 1;
}

.course-name {
  font-size: 16px;
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 8px;
}

.course-details {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
}

.detail-item {
  font-size: 13px;
  color: #7f8c8d;
  display: flex;
  align-items: center;
  gap: 5px;

  i {
    font-size: 12px;
  }
}

.grade-main {
  text-align: right;
  min-width: 120px;
}

.total-score {
  font-size: 24px;
  font-weight: 700;
  margin-bottom: 5px;

  &.score-excellent {
    color: #2ecc71;
  }

  &.score-good {
    color: #3498db;
  }

  &.score-medium {
    color: #f39c12;
  }

  &.score-pass {
    color: #e74c3c;
  }

  &.score-fail {
    color: #c0392b;
  }
}

.level-badge {
  display: inline-block;
  padding: 2px 12px;
  border-radius: 20px;
  font-weight: 700;
  font-size: 14px;
  color: white;

  &.level-A {
    background: #2ecc71;
  }

  &.level-B {
    background: #3498db;
  }

  &.level-C {
    background: #f39c12;
  }

  &.level-D {
    background: #e74c3c;
  }

  &.level-F {
    background: #c0392b;
  }
}

.grade-details {
  margin-bottom: 15px;
}

.score-breakdown {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 15px;
}

.score-item {
  background: white;
  border-radius: 8px;
  padding: 10px;
  text-align: center;
  border: 1px solid #e9ecef;
}

.score-label {
  display: block;
  font-size: 12px;
  color: #7f8c8d;
  margin-bottom: 5px;
}

.score-value {
  display: block;
  font-size: 16px;
  font-weight: 600;
  color: #2c3e50;

  &.gpa {
    color: #9b59b6;
  }

  &.ranking {
    color: #3498db;
  }
}

.grade-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 15px;
  border-top: 1px solid #e9ecef;
}

.status-info {
  display: flex;
  gap: 20px;
}

.status-item {
  font-size: 13px;
  color: #7f8c8d;
  display: flex;
  align-items: center;
  gap: 5px;

  i {
    font-size: 12px;
  }
}

.grade-actions {
  display: flex;
  gap: 10px;
}

/* 下载历史 */
.download-history-section {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.history-item {
  background: #f8f9fa;
  border-radius: 10px;
  padding: 15px;
  border: 1px solid #e9ecef;
  transition: all 0.3s ease;

  &:hover {
    border-color: #3498db;
    box-shadow: 0 2px 8px rgba(52, 152, 219, 0.1);
  }
}

.history-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.history-info {
  flex: 1;
}

.file-name {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;

  i {
    color: #e74c3c;
    font-size: 18px;
  }

  span {
    font-weight: 600;
    color: #2c3e50;
  }
}

.download-details {
  display: flex;
  gap: 20px;
}

.history-actions {
  display: flex;
  gap: 10px;
}

/* 弹窗样式 */
.grade-detail-modal {
  .detail-section {
    margin-bottom: 20px;

    h3 {
      font-size: 16px;
      font-weight: 600;
      color: #2c3e50;
      margin-bottom: 15px;
      display: flex;
      align-items: center;
      gap: 10px;

      i {
        color: #3498db;
      }
    }
  }

  .detail-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 15px;
  }

  .detail-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 0;
    border-bottom: 1px solid #f0f0f0;

    &:last-child {
      border-bottom: none;
    }
  }

  .detail-label {
    color: #7f8c8d;
    font-size: 14px;
  }

  .detail-value {
    color: #2c3e50;
    font-weight: 500;
    font-size: 14px;
  }

  .score-breakdown-detail {
    .score-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px 0;
      border-bottom: 1px solid #f0f0f0;

      &.total {
        background: #f8f9fa;
        padding: 15px;
        border-radius: 8px;
        border-bottom: none;
        margin-top: 10px;
      }
    }

    .score-label {
      color: #7f8c8d;
      font-size: 14px;
    }

    .score-value {
      color: #2c3e50;
      font-weight: 600;
      font-size: 16px;
    }

    .score-percent {
      color: #95a5a6;
      font-size: 12px;
    }

    .grade-level-badge {
      display: inline-block;
      padding: 2px 10px;
      border-radius: 12px;
      font-weight: 700;
      font-size: 12px;
      color: white;
      margin-left: 10px;

      &.level-A {
        background: #2ecc71;
      }

      &.level-B {
        background: #3498db;
      }

      &.level-C {
        background: #f39c12;
      }

      &.level-D {
        background: #e74c3c;
      }

      &.level-F {
        background: #c0392b;
      }
    }
  }

  .teacher-comment {
    background: #fff9e6;
    border: 1px solid #ffe58f;
    border-radius: 8px;
    padding: 15px;
    font-size: 14px;
    color: #7f8c8d;
    line-height: 1.6;
  }

  .status-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 15px;
  }

  .status-item {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .status-label {
    color: #7f8c8d;
    font-size: 14px;
  }
}

/* 加载状态 */
.loading-spinner {
  text-align: center;
  padding: 40px;
  color: #3498db;
  font-size: 14px;

  i {
    margin-right: 10px;
    font-size: 18px;
  }
}

/* 空状态 */
.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: #95a5a6;

  i {
    font-size: 36px;
    margin-bottom: 15px;
    opacity: 0.5;
  }

  h3 {
    font-size: 16px;
    margin-bottom: 10px;
    color: #7f8c8d;
  }

  p {
    margin-bottom: 0;
  }
}

/* 分页 */
.pagination-section {
  text-align: center;
  margin-top: 20px;
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .overview-cards {
    grid-template-columns: repeat(2, 1fr);
  }

  .score-breakdown {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .grade-query-container {
    padding: 0 15px 30px;
  }

  .banner-section {
    padding: 20px;
  }

  .banner-title {
    font-size: 24px;
  }

  .overview-cards {
    grid-template-columns: 1fr;
  }

  .filter-container {
    flex-direction: column;
    gap: 15px;
    align-items: stretch;
  }

  .filter-form {
    flex-direction: column;
    align-items: stretch;
  }

  .filter-right {
    flex-direction: column;
    align-items: stretch;

    .el-input {
      width: 100% !important;
    }
  }

  .section-header {
    flex-direction: column;
    gap: 15px;
    align-items: stretch;
  }

  .grade-header {
    flex-direction: column;
    gap: 15px;
  }

  .grade-main {
    text-align: left;
    width: 100%;
  }

  .score-breakdown {
    grid-template-columns: 1fr;
  }

  .grade-footer {
    flex-direction: column;
    gap: 15px;
  }

  .grade-actions {
    width: 100%;
    justify-content: flex-end;
  }

  .history-content {
    flex-direction: column;
    gap: 15px;
    align-items: stretch;
  }

  .download-details {
    flex-direction: column;
    gap: 8px;
  }

  .history-actions {
    justify-content: flex-end;
  }

  .detail-grid,
  .status-grid {
    grid-template-columns: 1fr;
  }
}
</style>
