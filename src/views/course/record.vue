<template>
  <div class="selection-records-container">
    <!-- 顶部横幅 -->
    <div class="banner-section">
      <div class="banner-content">
        <h1 class="banner-title"><i class="fas fa-history" /> 选课记录管理</h1>
        <p class="banner-description">
          查看选课历史记录、统计分析和课程学习进度跟踪
        </p>
      </div>
    </div>

    <!-- 统计概览 -->
    <div class="overview-section">
      <div class="overview-cards">
        <div class="overview-card total">
          <div class="card-icon">
            <i class="fas fa-book" />
          </div>
          <div class="card-content">
            <div class="card-value">{{ stats.totalSelections }}</div>
            <div class="card-label">总选课数</div>
          </div>
          <div class="card-trend">
            <span class="trend-up">+{{ stats.selectionIncrease }}%</span>
            <span class="trend-label">较上学期</span>
          </div>
        </div>

        <div class="overview-card current">
          <div class="card-icon">
            <i class="fas fa-play-circle" />
          </div>
          <div class="card-content">
            <div class="card-value">{{ stats.currentCourses }}</div>
            <div class="card-label">进行中课程</div>
          </div>
          <div class="card-progress">
            <el-progress
              :percentage="stats.courseProgress"
              :stroke-width="8"
              :show-text="false"
            />
            <span class="progress-label">{{ stats.courseProgress }}%进度</span>
          </div>
        </div>

        <div class="overview-card credits">
          <div class="card-icon">
            <i class="fas fa-star" />
          </div>
          <div class="card-content">
            <div class="card-value">{{ stats.totalCredits }}</div>
            <div class="card-label">已获学分</div>
          </div>
          <div class="card-target">
            <span class="target-label"
              >目标学分：{{ stats.targetCredits }}</span
            >
            <el-progress
              :percentage="
                Math.min(100, (stats.totalCredits / stats.targetCredits) * 100)
              "
              :stroke-width="6"
              :color="getCreditsProgressColor"
            />
          </div>
        </div>

        <div class="overview-card gpa">
          <div class="card-icon">
            <i class="fas fa-chart-line" />
          </div>
          <div class="card-content">
            <div class="card-value">{{ stats.currentGPA }}</div>
            <div class="card-label">当前GPA</div>
          </div>
          <div class="card-change">
            <span :class="stats.gpaChange >= 0 ? 'change-up' : 'change-down'">
              <i
                :class="
                  stats.gpaChange >= 0 ? 'fas fa-arrow-up' : 'fas fa-arrow-down'
                "
              />
              {{ Math.abs(stats.gpaChange).toFixed(2) }}
            </span>
            <span class="change-label">较上学期</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 筛选和操作栏 -->
    <div class="filter-section">
      <div class="filter-container">
        <div class="filter-left">
          <el-form :inline="true" :model="filterForm" class="filter-form">
            <el-form-item label="学年学期">
              <el-select
                v-model="filterForm.academicYear"
                placeholder="请选择学年"
                clearable
                @change="handleFilterChange"
              >
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
                @change="handleFilterChange"
              >
                <el-option label="春季学期" value="spring" />
                <el-option label="秋季学期" value="autumn" />
              </el-select>
            </el-form-item>

            <el-form-item label="课程类型">
              <el-select
                v-model="filterForm.courseType"
                placeholder="请选择课程类型"
                clearable
                @change="handleFilterChange"
              >
                <el-option label="扣球训练" value="spike" />
                <el-option label="接球训练" value="receive" />
                <el-option label="发球训练" value="serve" />
              </el-select>
            </el-form-item>

            <el-form-item label="选课状态">
              <el-select
                v-model="filterForm.selectionStatus"
                placeholder="请选择状态"
                clearable
                @change="handleFilterChange"
              >
                <el-option label="已选" value="selected" />
                <el-option label="已退" value="withdrawn" />
                <el-option label="已完成" value="completed" />
              </el-select>
            </el-form-item>

            <el-form-item label="成绩状态">
              <el-select
                v-model="filterForm.gradeStatus"
                placeholder="请选择成绩状态"
                clearable
                @change="handleFilterChange"
              >
                <el-option label="已录入" value="graded" />
                <el-option label="未录入" value="ungraded" />
                <el-option label="已发布" value="published" />
              </el-select>
            </el-form-item>
          </el-form>
        </div>

        <div class="filter-right">
          <el-button type="primary" @click="handleExport">
            <i class="fas fa-download" /> 导出记录
          </el-button>
          <el-button @click="handlePrint">
            <i class="fas fa-print" /> 打印
          </el-button>
          <el-button @click="resetFilters">
            <i class="fas fa-redo" /> 重置筛选
          </el-button>
        </div>
      </div>

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

    <!-- 统计图表 -->
    <div class="charts-section">
      <div class="chart-row">
        <div class="chart-card">
          <div class="chart-header">
            <h3><i class="fas fa-chart-pie" /> 课程类型分布</h3>
            <el-select
              v-model="chartData.courseTypeYear"
              placeholder="选择学年"
              size="small"
              @change="updateCourseTypeChart"
            >
              <el-option label="全部学年" value="all" />
              <el-option
                v-for="year in academicYears"
                :key="year"
                :label="year"
                :value="year"
              />
            </el-select>
          </div>
          <div class="chart-content">
            <div ref="courseTypeChart" class="chart-container" />
          </div>
        </div>

        <div class="chart-card">
          <div class="chart-header">
            <h3><i class="fas fa-chart-bar" /> 学期学分趋势</h3>
            <el-select
              v-model="chartData.creditsRange"
              placeholder="时间范围"
              size="small"
              @change="updateCreditsChart"
            >
              <el-option label="近一年" value="1year" />
              <el-option label="近两年" value="2years" />
              <el-option label="全部时间" value="all" />
            </el-select>
          </div>
          <div class="chart-content">
            <div ref="creditsChart" class="chart-container" />
          </div>
        </div>
      </div>

      <div class="chart-row">
        <div class="chart-card">
          <div class="chart-header">
            <h3><i class="fas fa-chart-line" /> GPA变化趋势</h3>
            <el-select
              v-model="chartData.gpaRange"
              placeholder="时间范围"
              size="small"
              @change="updateGPAChart"
            >
              <el-option label="近一年" value="1year" />
              <el-option label="近两年" value="2years" />
              <el-option label="全部时间" value="all" />
            </el-select>
          </div>
          <div class="chart-content">
            <div ref="gpaChart" class="chart-container" />
          </div>
        </div>

        <div class="chart-card">
          <div class="chart-header">
            <h3><i class="fas fa-calendar-alt" /> 选课时间分布</h3>
            <el-select
              v-model="chartData.timeRange"
              placeholder="时间范围"
              size="small"
              @change="updateTimeChart"
            >
              <el-option label="本学期" value="current" />
              <el-option label="本学年" value="year" />
              <el-option label="全部时间" value="all" />
            </el-select>
          </div>
          <div class="chart-content">
            <div ref="timeChart" class="chart-container" />
          </div>
        </div>
      </div>
    </div>

    <!-- 选课记录表格 -->
    <div class="records-section">
      <div class="section-header">
        <h2 class="section-title">
          <i class="fas fa-table" />
          选课记录详情
          <span class="records-count">({{ pagination.total }}条记录)</span>
        </h2>
        <div class="section-actions">
          <el-input
            v-model="searchKeyword"
            placeholder="搜索课程名称、教师、课程编号..."
            clearable
            style="width: 300px"
            @input="handleSearch"
          >
            <template #prefix>
              <i class="fas fa-search" />
            </template>
          </el-input>
        </div>
      </div>

      <div class="records-table">
        <el-table
          :data="paginatedRecords"
          :loading="loading"
          border
          stripe
          style="width: 100%"
          @sort-change="handleSortChange"
        >
          <!-- 序号列 -->
          <el-table-column
            type="index"
            label="序号"
            width="60"
            align="center"
            :index="indexMethod"
          />

          <!-- 基本信息列 -->
          <el-table-column
            prop="course_code"
            label="课程编号"
            width="120"
            sortable="custom"
          >
            <template #default="{ row }">
              <div class="course-code-cell">
                <span class="code-value">{{ row.course_code }}</span>
                <el-tag
                  v-if="row.is_featured"
                  type="danger"
                  size="mini"
                  effect="dark"
                >
                  推荐
                </el-tag>
              </div>
            </template>
          </el-table-column>

          <el-table-column
            prop="course_name"
            label="课程名称"
            min-width="180"
            sortable="custom"
          >
            <template #default="{ row }">
              <div class="course-name-cell">
                <div class="course-name">{{ row.course_name }}</div>
                <div class="course-type">
                  <el-tag :type="getCourseTypeTag(row.course_type)" size="mini">
                    {{ getCourseTypeText(row.course_type) }}
                  </el-tag>
                  <el-tag :type="getDifficultyTag(row.difficulty)" size="mini">
                    {{ getDifficultyText(row.difficulty) }}
                  </el-tag>
                </div>
              </div>
            </template>
          </el-table-column>

          <el-table-column
            prop="teacher_name"
            label="授课教师"
            width="120"
            sortable="custom"
          />

          <!-- 选课信息列 -->
          <el-table-column
            prop="selection_time"
            label="选课时间"
            width="160"
            sortable="custom"
          >
            <template #default="{ row }">
              {{ formatDateTime(row.selection_time) }}
            </template>
          </el-table-column>

          <el-table-column
            prop="selection_type"
            label="选课方式"
            width="100"
            sortable="custom"
          >
            <template #default="{ row }">
              <el-tag
                :type="getSelectionTypeTag(row.selection_type)"
                size="small"
              >
                {{ getSelectionTypeText(row.selection_type) }}
              </el-tag>
            </template>
          </el-table-column>

          <el-table-column
            prop="selection_status"
            label="选课状态"
            width="100"
            sortable="custom"
          >
            <template #default="{ row }">
              <el-tag
                :type="getSelectionStatusTag(row.selection_status)"
                size="small"
              >
                {{ getSelectionStatusText(row.selection_status) }}
              </el-tag>
            </template>
          </el-table-column>

          <!-- 课程信息列 -->
          <el-table-column
            prop="credits"
            label="学分"
            width="80"
            sortable="custom"
            align="center"
          />

          <el-table-column
            prop="academic_year"
            label="学年"
            width="100"
            sortable="custom"
          />

          <el-table-column
            prop="semester"
            label="学期"
            width="100"
            sortable="custom"
          >
            <template #default="{ row }">
              {{ getSemesterText(row.semester) }}
            </template>
          </el-table-column>

          <!-- 成绩信息列 -->
          <el-table-column
            prop="grade_level"
            label="成绩等级"
            width="100"
            sortable="custom"
          >
            <template #default="{ row }">
              <div v-if="row.grade_level" class="grade-cell">
                <span
                  class="grade-level"
                  :class="getGradeLevelClass(row.grade_level)"
                >
                  {{ row.grade_level }}
                </span>
                <span v-if="row.total_score" class="grade-score">
                  ({{ row.total_score }}分)
                </span>
              </div>
              <span v-else class="no-grade">--</span>
            </template>
          </el-table-column>

          <el-table-column
            prop="gpa"
            label="绩点"
            width="80"
            sortable="custom"
            align="center"
          >
            <template #default="{ row }">
              <span v-if="row.gpa" class="gpa-value">{{
                row.gpa.toFixed(2)
              }}</span>
              <span v-else>--</span>
            </template>
          </el-table-column>

          <el-table-column
            prop="ranking"
            label="班级排名"
            width="100"
            sortable="custom"
            align="center"
          >
            <template #default="{ row }">
              <span v-if="row.ranking" class="ranking">
                第{{ row.ranking }}名
              </span>
              <span v-else>--</span>
            </template>
          </el-table-column>

          <!-- 操作列 -->
          <el-table-column
            label="操作"
            width="220"
            fixed="right"
            align="center"
          >
            <template #default="{ row }">
              <div class="action-buttons">
                <el-button
                  type="primary"
                  size="small"
                  @click="viewCourseDetail(row)"
                >
                  <i class="fas fa-eye" /> 详情
                </el-button>

                <el-button
                  v-if="row.selection_status === 'selected'"
                  type="warning"
                  size="small"
                  @click="handleWithdraw(row)"
                >
                  <i class="fas fa-sign-out-alt" /> 退课
                </el-button>

                <el-button
                  v-if="row.grade_status === 'published'"
                  type="success"
                  size="small"
                  @click="downloadTranscript(row)"
                >
                  <i class="fas fa-download" /> 成绩单
                </el-button>

                <el-dropdown
                  v-if="
                    row.selection_status === 'selected' ||
                    row.selection_status === 'withdrawn'
                  "
                  @command="handleDropdownCommand"
                >
                  <el-button type="text" size="small">
                    <i class="fas fa-ellipsis-v" />
                  </el-button>
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item
                        v-if="row.selection_status === 'selected'"
                        command="adjust"
                        :data-row="row"
                      >
                        <i class="fas fa-exchange-alt" /> 申请调课
                      </el-dropdown-item>
                      <el-dropdown-item command="complaint" :data-row="row">
                        <i class="fas fa-exclamation-circle" /> 申诉反馈
                      </el-dropdown-item>
                      <el-dropdown-item
                        v-if="row.selection_status === 'withdrawn'"
                        command="reapply"
                        :data-row="row"
                      >
                        <i class="fas fa-redo" /> 重新申请
                      </el-dropdown-item>
                      <el-dropdown-item
                        v-if="row.selection_status === 'withdrawn'"
                        command="delete"
                        :data-row="row"
                        divided
                      >
                        <i class="fas fa-trash-alt" /> 删除记录
                      </el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>
              </div>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <!-- 分页 -->
      <div class="pagination-section">
        <el-pagination
          v-model:current-page="pagination.currentPage"
          v-model:page-size="pagination.pageSize"
          :total="pagination.total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handlePageSizeChange"
          @current-change="handlePageChange"
        />
      </div>

      <!-- 空状态 -->
      <div v-if="filteredRecords.length === 0 && !loading" class="empty-state">
        <i class="fas fa-clipboard-list" />
        <h3>暂无选课记录</h3>
        <p>您还没有选课记录，快去选课吧！</p>
        <el-button type="primary" @click="goToSelection">
          <i class="fas fa-plus" /> 立即选课
        </el-button>
      </div>
    </div>

    <!-- 学习进度 -->
    <div class="progress-section">
      <div class="section-header">
        <h2 class="section-title">
          <i class="fas fa-tasks" />
          课程学习进度
        </h2>
        <el-button type="text" @click="refreshProgress">
          <i class="fas fa-sync-alt" /> 刷新进度
        </el-button>
      </div>

      <div class="progress-cards">
        <div
          v-for="course in progressCourses"
          :key="course.id"
          class="progress-card"
        >
          <div class="progress-header">
            <h3 class="progress-title">{{ course.course_name }}</h3>
            <div class="progress-status">
              <el-tag
                :type="getProgressStatusTag(course.progress_status)"
                size="small"
              >
                {{ getProgressStatusText(course.progress_status) }}
              </el-tag>
            </div>
          </div>

          <div class="progress-info">
            <div class="info-item">
              <i class="fas fa-chalkboard-teacher" />
              <span>{{ course.teacher_name }}</span>
            </div>
            <div class="info-item">
              <i class="fas fa-clock" />
              <span>{{ course.schedule }}</span>
            </div>
            <div class="info-item">
              <i class="fas fa-calendar" />
              <span>{{ formatDate(course.end_date) }} 结束</span>
            </div>
          </div>

          <div class="progress-content">
            <div class="progress-bar">
              <div class="progress-label">
                <span>课程进度</span>
                <span class="progress-percent">{{ course.progress }}%</span>
              </div>
              <el-progress
                :percentage="course.progress"
                :color="getProgressColor(course.progress)"
                :stroke-width="10"
                :show-text="false"
              />
            </div>

            <div class="progress-details">
              <div class="detail-item">
                <span class="detail-label">出勤率</span>
                <span class="detail-value">{{ course.attendance_rate }}%</span>
                <el-progress
                  :percentage="course.attendance_rate"
                  :stroke-width="6"
                  :show-text="false"
                  color="#3498db"
                />
              </div>

              <div class="detail-item">
                <span class="detail-label">作业完成</span>
                <span class="detail-value"
                  >{{ course.homework_completion }}%</span
                >
                <el-progress
                  :percentage="course.homework_completion"
                  :stroke-width="6"
                  :show-text="false"
                  color="#2ecc71"
                />
              </div>

              <div class="detail-item">
                <span class="detail-label">测验平均分</span>
                <span class="detail-value">{{ course.quiz_average }}分</span>
                <el-progress
                  :percentage="(course.quiz_average / 100) * 100"
                  :stroke-width="6"
                  :show-text="false"
                  color="#9b59b6"
                />
              </div>
            </div>
          </div>

          <div class="progress-actions">
            <el-button type="primary" size="small" @click="goToCourse(course)">
              <i class="fas fa-external-link-alt" /> 进入课程
            </el-button>
            <el-button
              type="default"
              size="small"
              @click="viewCourseMaterials(course)"
            >
              <i class="fas fa-file-download" /> 资料下载
            </el-button>
          </div>
        </div>
      </div>
    </div>

    <!-- 弹窗：课程详情 -->
    <el-dialog
      v-model="courseDetailVisible"
      :title="selectedRecord?.course_name"
      width="700px"
      @close="closeCourseDetail"
    >
      <div v-if="selectedRecord" class="course-detail-modal">
        <!-- 课程详情内容 -->
      </div>
    </el-dialog>

    <!-- 弹窗：退课申请 -->
    <el-dialog
      v-model="withdrawDialogVisible"
      title="申请退课"
      width="500px"
      @close="closeWithdrawDialog"
    >
      <el-form
        ref="withdrawFormRef"
        :model="withdrawForm"
        :rules="withdrawRules"
        label-width="100px"
      >
        <el-form-item label="退课课程">
          <el-input :value="withdrawCourse?.course_name" disabled />
        </el-form-item>

        <el-form-item label="退课原因" prop="reason">
          <el-input
            v-model="withdrawForm.reason"
            type="textarea"
            :rows="4"
            placeholder="请详细说明退课原因"
            maxlength="200"
            show-word-limit
          />
        </el-form-item>

        <el-form-item label="证明材料" prop="attachments">
          <el-upload
            class="upload-demo"
            action="#"
            :on-change="handleWithdrawAttachmentChange"
            :on-remove="handleWithdrawAttachmentRemove"
            :file-list="withdrawForm.attachments"
            :auto-upload="false"
            multiple
            :limit="3"
            accept=".pdf,.doc,.docx,.jpg,.png"
          >
            <el-button type="primary">
              <i class="fas fa-paperclip" /> 上传附件
            </el-button>
            <template #tip>
              <div class="upload-tip">
                <i class="fas fa-info-circle" />
                支持上传PDF、Word、图片格式，单个文件不超过5MB
              </div>
            </template>
          </el-upload>
        </el-form-item>

        <el-form-item label="紧急程度" prop="urgency">
          <el-rate
            v-model="withdrawForm.urgency"
            :max="3"
            :texts="['一般', '紧急', '非常紧急']"
            show-text
          />
        </el-form-item>

        <el-form-item>
          <div class="withdraw-tips">
            <h4><i class="fas fa-exclamation-triangle" /> 退课须知：</h4>
            <ul>
              <li>退课申请需要授课教师审批</li>
              <li>退课成功后，课程将不再计入成绩单</li>
              <li>请谨慎考虑退课决定</li>
            </ul>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="closeWithdrawDialog">取消</el-button>
        <el-button
          type="primary"
          :loading="submittingWithdraw"
          @click="submitWithdraw"
        >
          提交退课申请
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, nextTick } from "vue";
import {
  ElMessage,
  ElMessageBox,
  type FormInstance,
  type UploadFile,
  type UploadFiles
} from "element-plus";
import type { FormRules } from "element-plus";
import * as echarts from "echarts";

// ---------------------- 类型定义 ----------------------
interface SelectionRecord {
  id: number;
  course_id: number;
  course_code: string;
  course_name: string;
  course_type: "spike" | "receive" | "serve";
  difficulty: "beginner" | "intermediate" | "advanced";
  teacher_id: number;
  teacher_name: string;
  teacher_title: string;
  credits: number;
  selection_time: string;
  selection_type: "normal" | "approved" | "manual";
  selection_status: "selected" | "withdrawn" | "completed";
  withdraw_time?: string;
  withdraw_reason?: string;
  academic_year: string;
  semester: "spring" | "autumn";
  grade_level?: "A" | "B" | "C" | "D" | "F";
  total_score?: number;
  gpa?: number;
  ranking?: number;
  grade_status: "ungraded" | "grading" | "published";
  is_featured: boolean;
  location: string;
  schedule: string;
  start_date: string;
  end_date: string;
  current_students: number;
  capacity: number;
}

interface ProgressCourse {
  id: number;
  course_name: string;
  teacher_name: string;
  schedule: string;
  end_date: string;
  progress: number;
  progress_status: "normal" | "warning" | "danger" | "completed";
  attendance_rate: number;
  homework_completion: number;
  quiz_average: number;
}

interface QuickFilter {
  key: string;
  label: string;
  active: boolean;
}

// ---------------------- 状态管理 ----------------------
const loading = ref(false);
const searchKeyword = ref("");
const courseDetailVisible = ref(false);
const withdrawDialogVisible = ref(false);
const submittingWithdraw = ref(false);
const selectedRecord = ref<SelectionRecord | null>(null);
const withdrawCourse = ref<SelectionRecord | null>(null);

// 图表引用
const courseTypeChart = ref<HTMLElement>();
const creditsChart = ref<HTMLElement>();
const gpaChart = ref<HTMLElement>();
const timeChart = ref<HTMLElement>();

// ---------------------- 统计数据 ----------------------
const stats = reactive({
  totalSelections: 24,
  selectionIncrease: 12,
  currentCourses: 3,
  courseProgress: 65,
  totalCredits: 18,
  targetCredits: 24,
  currentGPA: 3.45,
  gpaChange: 0.12
});

// ---------------------- 筛选条件 ----------------------
const filterForm = reactive({
  academicYear: "",
  semester: "",
  courseType: "",
  selectionStatus: "",
  gradeStatus: ""
});

const academicYears = computed(() => {
  const years = new Set(
    selectionRecords.value.map(record => record.academic_year)
  );
  return Array.from(years).sort((a, b) => b.localeCompare(a));
});

// ---------------------- 快速筛选 ----------------------
const quickFilters = ref<QuickFilter[]>([
  { key: "current_semester", label: "本学期课程", active: false },
  { key: "with_grade", label: "已出成绩", active: false },
  { key: "no_grade", label: "未出成绩", active: false },
  { key: "spike_courses", label: "扣球训练", active: false },
  { key: "receive_courses", label: "接球训练", active: false },
  { key: "serve_courses", label: "发球训练", active: false }
]);

// ---------------------- 图表数据 ----------------------
const chartData = reactive({
  courseTypeYear: "all",
  creditsRange: "1year",
  gpaRange: "1year",
  timeRange: "current"
});

// ---------------------- 分页配置 ----------------------
const pagination = reactive({
  currentPage: 1,
  pageSize: 10,
  total: 0
});

// ---------------------- 排序配置 ----------------------
const sortConfig = reactive({
  prop: "selection_time",
  order: "descending" as "ascending" | "descending" | null
});

// ---------------------- 表单 ----------------------
const withdrawFormRef = ref<FormInstance>();
const withdrawForm = reactive({
  reason: "",
  attachments: [] as UploadFile[],
  urgency: 1
});

const withdrawRules: FormRules = {
  reason: [
    { required: true, message: "请填写退课原因", trigger: "blur" },
    { min: 10, message: "退课原因至少10个字符", trigger: "blur" }
  ]
};

// ---------------------- 模拟数据 ----------------------
const selectionRecords = ref<SelectionRecord[]>([
  {
    id: 1,
    course_id: 1,
    course_code: "SV101",
    course_name: "基础发球入门",
    course_type: "serve",
    difficulty: "beginner",
    teacher_id: 1,
    teacher_name: "李教练",
    teacher_title: "国家级教练",
    credits: 1,
    selection_time: "2024-01-10 14:30:25",
    selection_type: "approved",
    selection_status: "selected",
    academic_year: "2023-2024",
    semester: "spring",
    grade_level: "A",
    total_score: 92,
    gpa: 4.0,
    ranking: 5,
    grade_status: "published",
    is_featured: true,
    location: "排球馆A区",
    schedule: "每周一、三 14:00-16:00",
    start_date: "2024-02-15",
    end_date: "2024-06-15",
    current_students: 12,
    capacity: 20
  },
  {
    id: 2,
    course_id: 2,
    course_code: "RC201",
    course_name: "一传稳定性训练",
    course_type: "receive",
    difficulty: "intermediate",
    teacher_id: 2,
    teacher_name: "王教练",
    teacher_title: "高级教练",
    credits: 2,
    selection_time: "2024-01-12 09:15:42",
    selection_type: "normal",
    selection_status: "selected",
    academic_year: "2023-2024",
    semester: "spring",
    grade_status: "ungraded",
    is_featured: false,
    location: "排球馆B区",
    schedule: "每周二、四 16:00-18:00",
    start_date: "2024-03-01",
    end_date: "2024-07-01",
    current_students: 10,
    capacity: 15
  },
  {
    id: 3,
    course_id: 3,
    course_code: "SP301",
    course_name: "战术扣球与线路变化",
    course_type: "spike",
    difficulty: "advanced",
    teacher_id: 3,
    teacher_name: "张教练",
    teacher_title: "特级教练",
    credits: 3,
    selection_time: "2023-09-05 10:20:18",
    selection_type: "approved",
    selection_status: "completed",
    withdraw_time: "2023-12-20 15:30:00",
    withdraw_reason: "时间冲突",
    academic_year: "2023-2024",
    semester: "autumn",
    grade_level: "B",
    total_score: 85,
    gpa: 3.5,
    ranking: 12,
    grade_status: "published",
    is_featured: true,
    location: "专业训练馆",
    schedule: "每周五 14:00-16:00",
    start_date: "2023-09-10",
    end_date: "2024-01-10",
    current_students: 9,
    capacity: 10
  },
  {
    id: 4,
    course_id: 4,
    course_code: "SV201",
    course_name: "强力跳发球训练",
    course_type: "serve",
    difficulty: "intermediate",
    teacher_id: 2,
    teacher_name: "王教练",
    teacher_title: "高级教练",
    credits: 2,
    selection_time: "2023-09-08 11:05:33",
    selection_type: "manual",
    selection_status: "withdrawn",
    withdraw_time: "2023-10-15 09:40:59",
    withdraw_reason: "个人原因退课",
    academic_year: "2023-2024",
    semester: "autumn",
    grade_status: "ungraded",
    is_featured: false,
    location: "排球馆C区",
    schedule: "每周二、四 16:00-18:00",
    start_date: "2023-09-15",
    end_date: "2024-01-15",
    current_students: 15,
    capacity: 15
  },
  {
    id: 5,
    course_id: 5,
    course_code: "RC101",
    course_name: "基础接球入门",
    course_type: "receive",
    difficulty: "beginner",
    teacher_id: 4,
    teacher_name: "刘教练",
    teacher_title: "中级教练",
    credits: 1,
    selection_time: "2022-09-12 13:45:22",
    selection_type: "normal",
    selection_status: "completed",
    academic_year: "2022-2023",
    semester: "autumn",
    grade_level: "A",
    total_score: 95,
    gpa: 4.0,
    ranking: 3,
    grade_status: "published",
    is_featured: true,
    location: "排球馆D区",
    schedule: "每周一、四 09:00-11:00",
    start_date: "2022-09-20",
    end_date: "2023-01-20",
    current_students: 18,
    capacity: 25
  },
  {
    id: 6,
    course_id: 6,
    course_code: "SP101",
    course_name: "基础扣球入门",
    course_type: "spike",
    difficulty: "beginner",
    teacher_id: 2,
    teacher_name: "王教练",
    teacher_title: "高级教练",
    credits: 1,
    selection_time: "2022-03-05 15:20:45",
    selection_type: "approved",
    selection_status: "completed",
    academic_year: "2021-2022",
    semester: "spring",
    grade_level: "B",
    total_score: 88,
    gpa: 3.7,
    ranking: 8,
    grade_status: "published",
    is_featured: false,
    location: "排球馆E区",
    schedule: "每周二、四 10:00-12:00",
    start_date: "2022-03-10",
    end_date: "2022-07-10",
    current_students: 16,
    capacity: 20
  }
]);

const progressCourses = ref<ProgressCourse[]>([
  {
    id: 1,
    course_name: "基础发球入门",
    teacher_name: "李教练",
    schedule: "每周一、三 14:00-16:00",
    end_date: "2024-06-15",
    progress: 65,
    progress_status: "normal",
    attendance_rate: 92,
    homework_completion: 85,
    quiz_average: 88
  },
  {
    id: 2,
    course_name: "一传稳定性训练",
    teacher_name: "王教练",
    schedule: "每周二、四 16:00-18:00",
    end_date: "2024-07-01",
    progress: 45,
    progress_status: "warning",
    attendance_rate: 78,
    homework_completion: 65,
    quiz_average: 72
  },
  {
    id: 3,
    course_name: "战术扣球与线路变化",
    teacher_name: "张教练",
    schedule: "每周五 14:00-16:00",
    end_date: "2024-05-30",
    progress: 80,
    progress_status: "completed",
    attendance_rate: 100,
    homework_completion: 95,
    quiz_average: 92
  }
]);

// ---------------------- 计算属性 ----------------------
// 过滤后的记录
const filteredRecords = computed(() => {
  let filtered = [...selectionRecords.value];

  // 应用表单筛选
  if (filterForm.academicYear) {
    filtered = filtered.filter(
      record => record.academic_year === filterForm.academicYear
    );
  }

  if (filterForm.semester) {
    filtered = filtered.filter(
      record => record.semester === filterForm.semester
    );
  }

  if (filterForm.courseType) {
    filtered = filtered.filter(
      record => record.course_type === filterForm.courseType
    );
  }

  if (filterForm.selectionStatus) {
    filtered = filtered.filter(
      record => record.selection_status === filterForm.selectionStatus
    );
  }

  if (filterForm.gradeStatus) {
    if (filterForm.gradeStatus === "graded") {
      filtered = filtered.filter(record => record.grade_level);
    } else if (filterForm.gradeStatus === "ungraded") {
      filtered = filtered.filter(
        record => !record.grade_level && record.selection_status === "completed"
      );
    } else if (filterForm.gradeStatus === "published") {
      filtered = filtered.filter(record => record.grade_status === "published");
    }
  }

  // 应用快速筛选
  const activeQuickFilters = quickFilters.value.filter(filter => filter.active);
  if (activeQuickFilters.length > 0) {
    filtered = filtered.filter(record => {
      return activeQuickFilters.some(filter => {
        switch (filter.key) {
          case "current_semester":
            return (
              record.academic_year === "2023-2024" &&
              record.semester === "spring"
            );
          case "with_grade":
            return record.grade_level !== undefined;
          case "no_grade":
            return (
              record.grade_level === undefined &&
              record.selection_status === "completed"
            );
          case "spike_courses":
            return record.course_type === "spike";
          case "receive_courses":
            return record.course_type === "receive";
          case "serve_courses":
            return record.course_type === "serve";
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
      record =>
        record.course_name.toLowerCase().includes(keyword) ||
        record.course_code.toLowerCase().includes(keyword) ||
        record.teacher_name.toLowerCase().includes(keyword) ||
        record.course_type.toLowerCase().includes(keyword)
    );
  }

  // 应用排序
  if (sortConfig.prop && sortConfig.order) {
    filtered.sort((a, b) => {
      const aValue = a[sortConfig.prop as keyof SelectionRecord];
      const bValue = b[sortConfig.prop as keyof SelectionRecord];

      if (aValue == null) return sortConfig.order === "ascending" ? -1 : 1;
      if (bValue == null) return sortConfig.order === "ascending" ? 1 : -1;

      if (typeof aValue === "string" && typeof bValue === "string") {
        return sortConfig.order === "ascending"
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      if (typeof aValue === "number" && typeof bValue === "number") {
        return sortConfig.order === "ascending"
          ? aValue - bValue
          : bValue - aValue;
      }

      return 0;
    });
  }

  // 更新分页总数
  pagination.total = filtered.length;

  return filtered;
});

// 分页后的记录
const paginatedRecords = computed(() => {
  const start = (pagination.currentPage - 1) * pagination.pageSize;
  const end = start + pagination.pageSize;
  return filteredRecords.value.slice(start, end);
});

// 学分进度颜色
const getCreditsProgressColor = computed(() => {
  const progress = (stats.totalCredits / stats.targetCredits) * 100;
  if (progress >= 100) return "#2ecc71";
  if (progress >= 75) return "#3498db";
  if (progress >= 50) return "#f39c12";
  return "#e74c3c";
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

const getCourseTypeTag = (type: string) => {
  const map: Record<string, string> = {
    spike: "danger",
    receive: "success",
    serve: "primary"
  };
  return map[type] || "info";
};

const getDifficultyText = (difficulty: string) => {
  const map: Record<string, string> = {
    beginner: "初级",
    intermediate: "中级",
    advanced: "高级"
  };
  return map[difficulty] || difficulty;
};

const getDifficultyTag = (difficulty: string) => {
  const map: Record<string, string> = {
    beginner: "success",
    intermediate: "warning",
    advanced: "danger"
  };
  return map[difficulty] || "info";
};

const getSelectionTypeText = (type: string) => {
  const map: Record<string, string> = {
    normal: "正常选课",
    approved: "审批通过",
    manual: "手动添加"
  };
  return map[type] || type;
};

const getSelectionTypeTag = (type: string) => {
  const map: Record<string, string> = {
    normal: "primary",
    approved: "success",
    manual: "warning"
  };
  return map[type] || "info";
};

const getSelectionStatusText = (status: string) => {
  const map: Record<string, string> = {
    selected: "已选",
    withdrawn: "已退",
    completed: "已完成"
  };
  return map[status] || status;
};

const getSelectionStatusTag = (status: string) => {
  const map: Record<string, string> = {
    selected: "success",
    withdrawn: "warning",
    completed: "info"
  };
  return map[status] || "info";
};

const getSemesterText = (semester: string) => {
  const map: Record<string, string> = {
    spring: "春季学期",
    autumn: "秋季学期"
  };
  return map[semester] || semester;
};

const getGradeLevelClass = (grade: string) => {
  const map: Record<string, string> = {
    A: "grade-a",
    B: "grade-b",
    C: "grade-c",
    D: "grade-d",
    F: "grade-f"
  };
  return map[grade] || "";
};

const getProgressStatusText = (status: string) => {
  const map: Record<string, string> = {
    normal: "进行中",
    warning: "需关注",
    danger: "落后",
    completed: "已完成"
  };
  return map[status] || status;
};

const getProgressStatusTag = (status: string) => {
  const map: Record<string, string> = {
    normal: "primary",
    warning: "warning",
    danger: "danger",
    completed: "success"
  };
  return map[status] || "info";
};

const getProgressColor = (progress: number) => {
  if (progress >= 80) return "#2ecc71";
  if (progress >= 60) return "#3498db";
  if (progress >= 40) return "#f39c12";
  return "#e74c3c";
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

const indexMethod = (index: number) => {
  return (pagination.currentPage - 1) * pagination.pageSize + index + 1;
};

// ---------------------- 事件处理函数 ----------------------
// 筛选处理
const handleFilterChange = () => {
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
    selectionStatus: "",
    gradeStatus: ""
  });

  quickFilters.value.forEach(filter => {
    filter.active = false;
  });

  searchKeyword.value = "";
  pagination.currentPage = 1;

  ElMessage.success("筛选条件已重置");
};

const handleSearch = () => {
  pagination.currentPage = 1;
};

// 排序处理
const handleSortChange = ({
  prop,
  order
}: {
  prop: string;
  order: "ascending" | "descending" | null;
}) => {
  sortConfig.prop = prop;
  sortConfig.order = order;
};

// 分页处理
const handlePageSizeChange = (size: number) => {
  pagination.pageSize = size;
  pagination.currentPage = 1;
};

const handlePageChange = (page: number) => {
  pagination.currentPage = page;
};

// 课程详情
const viewCourseDetail = (record: SelectionRecord) => {
  selectedRecord.value = record;
  courseDetailVisible.value = true;
};

const closeCourseDetail = () => {
  courseDetailVisible.value = false;
  selectedRecord.value = null;
};

// 退课处理
const handleWithdraw = (record: SelectionRecord) => {
  withdrawCourse.value = record;
  withdrawDialogVisible.value = true;
};

const closeWithdrawDialog = () => {
  withdrawDialogVisible.value = false;
  withdrawCourse.value = null;
  if (withdrawFormRef.value) {
    withdrawFormRef.value.resetFields();
  }
  withdrawForm.attachments = [];
  withdrawForm.urgency = 1;
};

const handleWithdrawAttachmentChange = (
  file: UploadFile,
  fileList: UploadFiles
) => {
  withdrawForm.attachments = fileList;
};

const handleWithdrawAttachmentRemove = (
  file: UploadFile,
  fileList: UploadFiles
) => {
  withdrawForm.attachments = fileList;
};

const submitWithdraw = async () => {
  if (!withdrawFormRef.value || !withdrawCourse.value) return;

  try {
    await withdrawFormRef.value.validate();

    submittingWithdraw.value = true;

    // 模拟提交过程
    await new Promise(resolve => setTimeout(resolve, 1500));

    // 更新选课记录状态
    const record = selectionRecords.value.find(
      r => r.id === withdrawCourse.value?.id
    );
    if (record) {
      record.selection_status = "withdrawn";
      record.withdraw_time = new Date().toISOString();
      record.withdraw_reason = withdrawForm.reason;
    }

    ElMessage.success("退课申请提交成功！");
    closeWithdrawDialog();
  } catch (error) {
    console.error("表单验证失败:", error);
    ElMessage.warning("请完善退课申请信息");
  } finally {
    submittingWithdraw.value = false;
  }
};

// 下拉菜单命令处理
const handleDropdownCommand = (
  command: string,
  { row }: { row: SelectionRecord }
) => {
  switch (command) {
    case "adjust":
      ElMessage.info("调课申请功能开发中...");
      break;
    case "complaint":
      ElMessage.info("申诉反馈功能开发中...");
      break;
    case "reapply":
      ElMessage.info("重新申请功能开发中...");
      break;
    case "delete":
      handleDeleteRecord(row);
      break;
  }
};

const handleDeleteRecord = async (record: SelectionRecord) => {
  try {
    await ElMessageBox.confirm(
      "确定要删除这条选课记录吗？删除后无法恢复。",
      "确认删除",
      {
        confirmButtonText: "确定删除",
        cancelButtonText: "取消",
        type: "warning"
      }
    );

    selectionRecords.value = selectionRecords.value.filter(
      r => r.id !== record.id
    );
    ElMessage.success("选课记录已删除");
  } catch {
    // 用户取消
  }
};

// 其他操作
const downloadTranscript = (record: SelectionRecord) => {
  ElMessage.info("下载成绩单功能开发中...");
};

const viewCourseMaterials = (course: ProgressCourse) => {
  ElMessage.info("查看课程资料功能开发中...");
};

const goToCourse = (course: ProgressCourse) => {
  ElMessage.info("进入课程功能开发中...");
};

const goToSelection = () => {
  ElMessage.info("跳转到选课页面...");
};

const refreshProgress = () => {
  ElMessage.success("学习进度已刷新");
};

const handleExport = () => {
  ElMessage.info("导出记录功能开发中...");
};

const handlePrint = () => {
  ElMessage.info("打印功能开发中...");
};

// ---------------------- 图表函数 ----------------------
let courseTypeChartInstance: echarts.ECharts | null = null;
let creditsChartInstance: echarts.ECharts | null = null;
let gpaChartInstance: echarts.ECharts | null = null;
let timeChartInstance: echarts.ECharts | null = null;

const initCharts = () => {
  // 初始化图表
  nextTick(() => {
    if (courseTypeChart.value) {
      courseTypeChartInstance = echarts.init(courseTypeChart.value);
      updateCourseTypeChart();
    }

    if (creditsChart.value) {
      creditsChartInstance = echarts.init(creditsChart.value);
      updateCreditsChart();
    }

    if (gpaChart.value) {
      gpaChartInstance = echarts.init(gpaChart.value);
      updateGPAChart();
    }

    if (timeChart.value) {
      timeChartInstance = echarts.init(timeChart.value);
      updateTimeChart();
    }
  });
};

const updateCourseTypeChart = () => {
  if (!courseTypeChartInstance) return;

  const data = [
    { value: 8, name: "扣球训练" },
    { value: 7, name: "接球训练" },
    { value: 9, name: "发球训练" }
  ];

  const option = {
    tooltip: {
      trigger: "item",
      formatter: "{a} <br/>{b}: {c} ({d}%)"
    },
    legend: {
      orient: "vertical",
      right: 10,
      top: "center",
      data: data.map(item => item.name)
    },
    series: [
      {
        name: "课程类型分布",
        type: "pie",
        radius: ["40%", "70%"],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: "#fff",
          borderWidth: 2
        },
        label: {
          show: false,
          position: "center"
        },
        emphasis: {
          label: {
            show: true,
            fontSize: "18",
            fontWeight: "bold"
          }
        },
        labelLine: {
          show: false
        },
        data: data
      }
    ]
  };

  courseTypeChartInstance.setOption(option);
};

const updateCreditsChart = () => {
  if (!creditsChartInstance) return;

  const option = {
    tooltip: {
      trigger: "axis",
      axisPointer: {
        type: "shadow"
      }
    },
    grid: {
      left: "3%",
      right: "4%",
      bottom: "3%",
      containLabel: true
    },
    xAxis: {
      type: "category",
      data: ["2022春", "2022秋", "2023春", "2023秋", "2024春"],
      axisLabel: {
        rotate: 45
      }
    },
    yAxis: {
      type: "value",
      name: "学分"
    },
    series: [
      {
        name: "学分",
        type: "bar",
        data: [4, 6, 5, 7, 6],
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: "#83bff6" },
            { offset: 0.5, color: "#188df0" },
            { offset: 1, color: "#188df0" }
          ])
        },
        emphasis: {
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: "#2378f7" },
              { offset: 0.7, color: "#2378f7" },
              { offset: 1, color: "#83bff6" }
            ])
          }
        }
      }
    ]
  };

  creditsChartInstance.setOption(option);
};

const updateGPAChart = () => {
  if (!gpaChartInstance) return;

  const option = {
    tooltip: {
      trigger: "axis"
    },
    grid: {
      left: "3%",
      right: "4%",
      bottom: "3%",
      containLabel: true
    },
    xAxis: {
      type: "category",
      boundaryGap: false,
      data: ["2022春", "2022秋", "2023春", "2023秋", "2024春"]
    },
    yAxis: {
      type: "value",
      min: 3.0,
      max: 4.0
    },
    series: [
      {
        name: "GPA",
        type: "line",
        smooth: true,
        data: [3.2, 3.5, 3.3, 3.6, 3.45],
        itemStyle: {
          color: "#2ecc71"
        },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            {
              offset: 0,
              color: "rgba(46, 204, 113, 0.3)"
            },
            {
              offset: 1,
              color: "rgba(46, 204, 113, 0.05)"
            }
          ])
        }
      }
    ]
  };

  gpaChartInstance.setOption(option);
};

const updateTimeChart = () => {
  if (!timeChartInstance) return;

  const option = {
    tooltip: {
      trigger: "axis",
      axisPointer: {
        type: "cross",
        label: {
          backgroundColor: "#6a7985"
        }
      }
    },
    legend: {
      data: ["选课数量", "退课数量"]
    },
    grid: {
      left: "3%",
      right: "4%",
      bottom: "3%",
      containLabel: true
    },
    xAxis: [
      {
        type: "category",
        boundaryGap: false,
        data: [
          "1月",
          "2月",
          "3月",
          "4月",
          "5月",
          "6月",
          "7月",
          "8月",
          "9月",
          "10月",
          "11月",
          "12月"
        ]
      }
    ],
    yAxis: [
      {
        type: "value"
      }
    ],
    series: [
      {
        name: "选课数量",
        type: "line",
        stack: "Total",
        smooth: true,
        lineStyle: {
          width: 0
        },
        showSymbol: false,
        areaStyle: {
          opacity: 0.8,
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            {
              offset: 0,
              color: "rgba(58,77,233,0.8)"
            },
            {
              offset: 1,
              color: "rgba(58,77,233,0.3)"
            }
          ])
        },
        emphasis: {
          focus: "series"
        },
        data: [12, 18, 15, 8, 6, 5, 4, 3, 25, 18, 12, 10]
      },
      {
        name: "退课数量",
        type: "line",
        stack: "Total",
        smooth: true,
        lineStyle: {
          width: 0
        },
        showSymbol: false,
        areaStyle: {
          opacity: 0.8,
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            {
              offset: 0,
              color: "rgba(231,76,60,0.8)"
            },
            {
              offset: 1,
              color: "rgba(231,76,60,0.3)"
            }
          ])
        },
        emphasis: {
          focus: "series"
        },
        data: [2, 3, 4, 1, 0, 1, 2, 1, 5, 3, 2, 1]
      }
    ]
  };

  timeChartInstance.setOption(option);
};

// 窗口大小变化时重绘图表
const handleResize = () => {
  courseTypeChartInstance?.resize();
  creditsChartInstance?.resize();
  gpaChartInstance?.resize();
  timeChartInstance?.resize();
};

// ---------------------- 生命周期 ----------------------
onMounted(() => {
  initCharts();
  window.addEventListener("resize", handleResize);
});

// 清理
// onUnmounted(() => {
//   window.removeEventListener('resize', handleResize)
//   courseTypeChartInstance?.dispose()
//   creditsChartInstance?.dispose()
//   gpaChartInstance?.dispose()
//   timeChartInstance?.dispose()
// })
</script>

<style scoped lang="scss">
.selection-records-container {
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
    color: #ffd700;
  }
}

.banner-description {
  font-size: 18px;
  opacity: 0.9;
  max-width: 600px;
  line-height: 1.6;
}

/* 统计概览 */
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
  padding: 24px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  transition: transform 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.1);
  }

  &.total {
    border-top: 4px solid #3498db;
  }

  &.current {
    border-top: 4px solid #2ecc71;
  }

  &.credits {
    border-top: 4px solid #f39c12;
  }

  &.gpa {
    border-top: 4px solid #9b59b6;
  }
}

.card-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 15px;
  font-size: 20px;
  color: white;

  .total & {
    background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
  }

  .current & {
    background: linear-gradient(135deg, #2ecc71 0%, #27ae60 100%);
  }

  .credits & {
    background: linear-gradient(135deg, #f39c12 0%, #d35400 100%);
  }

  .gpa & {
    background: linear-gradient(135deg, #9b59b6 0%, #8e44ad 100%);
  }
}

.card-content {
  flex: 1;
}

.card-value {
  font-size: 32px;
  font-weight: 700;
  color: #2c3e50;
  line-height: 1;
  margin-bottom: 8px;
}

.card-label {
  font-size: 14px;
  color: #7f8c8d;
  margin-bottom: 15px;
}

.card-trend {
  .trend-up {
    color: #2ecc71;
    font-weight: 600;
    margin-right: 8px;
  }

  .trend-label {
    color: #95a5a6;
    font-size: 12px;
  }
}

.card-progress,
.card-target,
.card-change {
  border-top: 1px solid #e9ecef;
  padding-top: 15px;

  :deep(.el-progress) {
    margin-bottom: 8px;
  }

  .progress-label {
    font-size: 12px;
    color: #7f8c8d;
  }

  .target-label {
    display: block;
    font-size: 12px;
    color: #7f8c8d;
    margin-bottom: 5px;
  }

  .change-up {
    color: #2ecc71;
    font-weight: 600;
    margin-right: 8px;
  }

  .change-down {
    color: #e74c3c;
    font-weight: 600;
    margin-right: 8px;
  }

  .change-label {
    color: #95a5a6;
    font-size: 12px;
  }
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
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
}

.filter-left {
  flex: 1;
}

.filter-form {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  align-items: center;

  :deep(.el-form-item) {
    margin-bottom: 0;
  }
}

.quick-filter {
  display: flex;
  align-items: center;
  gap: 15px;
  padding-top: 20px;
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

/* 图表区域 */
.charts-section {
  margin-bottom: 30px;
}

.chart-row {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
  margin-bottom: 20px;
}

.chart-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;

  h3 {
    font-size: 16px;
    font-weight: 600;
    color: #2c3e50;
    display: flex;
    align-items: center;
    gap: 10px;

    i {
      color: #3498db;
    }
  }

  :deep(.el-select) {
    width: 120px;
  }
}

.chart-content {
  height: 300px;
}

.chart-container {
  width: 100%;
  height: 100%;
}

/* 选课记录表格 */
.records-section {
  background: white;
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 30px;
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
    color: #3498db;
  }
}

.records-count {
  font-size: 16px;
  color: #7f8c8d;
  font-weight: normal;
}

.records-table {
  margin-bottom: 24px;
}

.course-code-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.code-value {
  font-family: "Courier New", monospace;
  font-weight: 600;
  color: #3498db;
}

.course-name-cell {
  .course-name {
    font-weight: 600;
    color: #2c3e50;
    margin-bottom: 4px;
  }

  .course-type {
    display: flex;
    gap: 5px;
  }
}

.grade-cell {
  display: flex;
  align-items: center;
  gap: 5px;
}

.grade-level {
  font-weight: 600;

  &.grade-a {
    color: #2ecc71;
  }

  &.grade-b {
    color: #3498db;
  }

  &.grade-c {
    color: #f39c12;
  }

  &.grade-d {
    color: #e74c3c;
  }

  &.grade-f {
    color: #c0392b;
  }
}

.grade-score {
  font-size: 12px;
  color: #7f8c8d;
}

.no-grade {
  color: #95a5a6;
  font-style: italic;
}

.gpa-value {
  font-weight: 600;
  color: #9b59b6;
}

.ranking {
  color: #3498db;
  font-weight: 500;
}

.action-buttons {
  display: flex;
  gap: 8px;
  align-items: center;
}

/* 学习进度 */
.progress-section {
  background: white;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.progress-cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}

.progress-card {
  background: #f8f9fa;
  border-radius: 12px;
  padding: 20px;
  border: 1px solid #e9ecef;
  transition: all 0.3s ease;

  &:hover {
    border-color: #3498db;
    box-shadow: 0 4px 12px rgba(52, 152, 219, 0.1);
  }
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 15px;
}

.progress-title {
  font-size: 16px;
  font-weight: 600;
  color: #2c3e50;
  flex: 1;
  margin-right: 10px;
}

.progress-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 20px;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #7f8c8d;

  i {
    width: 14px;
    text-align: center;
  }
}

.progress-content {
  margin-bottom: 20px;
}

.progress-bar {
  margin-bottom: 15px;
}

.progress-label {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  font-size: 14px;

  .progress-percent {
    font-weight: 600;
    color: #3498db;
  }
}

.progress-details {
  .detail-item {
    margin-bottom: 10px;

    &:last-child {
      margin-bottom: 0;
    }
  }

  .detail-label {
    display: block;
    font-size: 12px;
    color: #7f8c8d;
    margin-bottom: 4px;
  }

  .detail-value {
    float: right;
    font-size: 12px;
    font-weight: 600;
    color: #2c3e50;
  }

  :deep(.el-progress) {
    margin-top: 4px;
  }
}

.progress-actions {
  display: flex;
  gap: 10px;
}

/* 弹窗 */
.upload-tip {
  font-size: 12px;
  color: #7f8c8d;
  margin-top: 5px;
  display: flex;
  align-items: center;
  gap: 5px;

  i {
    font-size: 12px;
  }
}

.withdraw-tips {
  background: #fff9e6;
  border: 1px solid #ffe58f;
  border-radius: 8px;
  padding: 12px;

  h4 {
    font-size: 14px;
    font-weight: 600;
    color: #2c3e50;
    margin-bottom: 8px;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  ul {
    margin: 0;
    padding-left: 20px;
    font-size: 13px;
    color: #7f8c8d;

    li {
      margin-bottom: 4px;
      line-height: 1.4;

      &:last-child {
        margin-bottom: 0;
      }
    }
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
}

/* 分页 */
.pagination-section {
  text-align: center;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .overview-cards {
    grid-template-columns: repeat(2, 1fr);
  }

  .chart-row {
    grid-template-columns: 1fr;
  }

  .progress-cards {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .selection-records-container {
    padding: 0 15px 30px;
  }

  .banner-section {
    padding: 30px 20px;
  }

  .banner-title {
    font-size: 24px;
  }

  .overview-cards {
    grid-template-columns: 1fr;
  }

  .filter-container {
    flex-direction: column;
    gap: 20px;
  }

  .filter-form {
    flex-direction: column;
    align-items: stretch;
  }

  .quick-filter {
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
  }

  .section-header {
    flex-direction: column;
    gap: 15px;
    align-items: stretch;
  }

  .records-table {
    overflow-x: auto;
  }

  .progress-cards {
    grid-template-columns: 1fr;
  }
}
</style>
