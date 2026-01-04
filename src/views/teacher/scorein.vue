<template>
  <div class="grade-entry-container">
    <!-- 顶部统计卡片 -->
    <div class="stats-cards">
      <div class="stats-card total">
        <div class="card-icon">
          <el-icon><Notebook /></el-icon>
        </div>
        <div class="card-content">
          <span class="card-label">课程总数</span>
          <span class="card-value">{{ stats.totalCourses }}</span>
        </div>
      </div>

      <div class="stats-card ungraded">
        <div class="card-icon">
          <el-icon><Clock /></el-icon>
        </div>
        <div class="card-content">
          <span class="card-label">未录入课程</span>
          <span class="card-value">{{ stats.ungradedCourses }}</span>
        </div>
      </div>

      <div class="stats-card graded">
        <div class="card-icon">
          <el-icon><Check /></el-icon>
        </div>
        <div class="card-content">
          <span class="card-label">已录入课程</span>
          <span class="card-value">{{ stats.gradedCourses }}</span>
        </div>
      </div>

      <div class="stats-card submitted">
        <div class="card-icon">
          <el-icon><Upload /></el-icon>
        </div>
        <div class="card-content">
          <span class="card-label">已提交课程</span>
          <span class="card-value">{{ stats.submittedCourses }}</span>
        </div>
      </div>
    </div>

    <!-- 课程选择 -->
    <div class="course-selector">
      <el-form :inline="true">
        <el-form-item label="选择课程">
          <el-select
            v-model="selectedCourseId"
            placeholder="请选择课程"
            style="width: 300px"
            @change="handleCourseChange"
          >
            <el-option label="请选择课程" value="" />
            <el-option
              v-for="course in courses"
              :key="course.id"
              :label="`${course.name} (${getCourseTypeText(course.type)})`"
              :value="course.id.toString()"
            />
          </el-select>
        </el-form-item>
      </el-form>
    </div>

    <!-- 成绩录入区域 -->
    <div v-if="selectedCourse" class="grade-entry-main">
      <div class="course-header">
        <div class="header-left">
          <h3>{{ selectedCourse.name }} - 成绩录入</h3>
          <div class="course-subtitle">
            <el-tag :type="getCourseTypeTag(selectedCourse.type)" size="small">
              {{ getCourseTypeText(selectedCourse.type) }}
            </el-tag>
            <span class="subtitle-item">
              <el-icon><User /></el-icon> {{ students.length }}人
            </span>
            <span class="subtitle-item">
              <el-icon><PieChart /></el-icon> 比例:
              {{ gradeConfig.normalPercent }}/{{ gradeConfig.finalPercent }}
            </span>
            <el-tag
              :type="
                selectedCourse.gradeStatus === 'submitted'
                  ? 'success'
                  : 'warning'
              "
              size="small"
            >
              {{ getStatusText(selectedCourse.gradeStatus) }}
            </el-tag>
          </div>
        </div>
      </div>

      <!-- 成绩比例设置 -->
      <div class="grade-config">
        <el-form :inline="true" :model="gradeConfig">
          <el-form-item label="平时成绩比例">
            <el-input-number
              v-model="gradeConfig.normalPercent"
              :min="0"
              :max="100"
              :step="5"
              @change="updateGradeConfig"
            />
            %
          </el-form-item>

          <el-form-item label="期末成绩比例">
            <el-input-number
              v-model="gradeConfig.finalPercent"
              :min="0"
              :max="100"
              :step="5"
              disabled
            />
            %
          </el-form-item>

          <el-form-item>
            <el-button
              type="primary"
              :disabled="selectedCourse.gradeStatus === 'submitted'"
              @click="saveGrades"
            >
              保存成绩
            </el-button>
            <el-button
              type="success"
              :disabled="selectedCourse.gradeStatus === 'submitted'"
              @click="submitGrades"
            >
              提交成绩
            </el-button>
            <el-button type="warning" @click="exportGrades">
              导出成绩
            </el-button>
            <el-button type="info" @click="importGrades"> 导入成绩 </el-button>
          </el-form-item>
        </el-form>
      </div>

      <!-- 成绩表格 -->
      <div class="grade-table-container">
        <el-table
          :data="students"
          border
          stripe
          height="500"
          style="width: 100%"
        >
          <el-table-column prop="id" label="序号" width="60" align="center" />
          <el-table-column prop="studentNumber" label="学号" width="120" />
          <el-table-column prop="studentName" label="姓名" width="100" />

          <!-- 平时成绩 -->
          <el-table-column label="平时成绩" align="center">
            <el-table-column prop="attendance" label="出勤(30)" width="100">
              <template #default="{ row }">
                <el-input-number
                  v-model="row.attendance"
                  :min="0"
                  :max="30"
                  size="small"
                  @change="calculateNormalScore(row)"
                />
              </template>
            </el-table-column>

            <el-table-column prop="homework" label="作业(30)" width="100">
              <template #default="{ row }">
                <el-input-number
                  v-model="row.homework"
                  :min="0"
                  :max="30"
                  size="small"
                  @change="calculateNormalScore(row)"
                />
              </template>
            </el-table-column>

            <el-table-column prop="performance" label="表现(40)" width="100">
              <template #default="{ row }">
                <el-input-number
                  v-model="row.performance"
                  :min="0"
                  :max="40"
                  size="small"
                  @change="calculateNormalScore(row)"
                />
              </template>
            </el-table-column>

            <el-table-column
              prop="normalScore"
              label="平时总分"
              width="100"
              align="center"
            >
              <template #default="{ row }">
                <span :class="{ 'score-warning': row.normalScore < 60 }">
                  {{ row.normalScore }}
                </span>
              </template>
            </el-table-column>
          </el-table-column>

          <!-- 期末成绩 -->
          <el-table-column label="期末成绩" align="center">
            <el-table-column
              prop="finalScore"
              label="期末成绩(100)"
              width="120"
            >
              <template #default="{ row }">
                <el-input-number
                  v-model="row.finalScore"
                  :min="0"
                  :max="100"
                  size="small"
                  @change="calculateTotalScore(row)"
                />
              </template>
            </el-table-column>
          </el-table-column>

          <!-- 总成绩 -->
          <el-table-column label="总成绩" align="center">
            <el-table-column prop="totalScore" label="总分" width="100">
              <template #default="{ row }">
                <span
                  :class="{
                    'score-excellent': row.totalScore >= 90,
                    'score-good': row.totalScore >= 80 && row.totalScore < 90,
                    'score-medium': row.totalScore >= 70 && row.totalScore < 80,
                    'score-pass': row.totalScore >= 60 && row.totalScore < 70,
                    'score-fail': row.totalScore < 60
                  }"
                >
                  {{ row.totalScore.toFixed(1) }}
                </span>
              </template>
            </el-table-column>

            <el-table-column
              prop="gradeLevel"
              label="等级"
              width="80"
              align="center"
            >
              <template #default="{ row }">
                <el-tag :type="getGradeLevelTag(row.gradeLevel)" size="small">
                  {{ row.gradeLevel }}
                </el-tag>
              </template>
            </el-table-column>

            <el-table-column
              prop="ranking"
              label="排名"
              width="80"
              align="center"
            >
              <template #default="{ row }">
                {{ row.ranking }}
              </template>
            </el-table-column>
          </el-table-column>

          <el-table-column
            label="操作"
            width="150"
            fixed="right"
            align="center"
          >
            <template #default="{ row }">
              <el-button
                type="text"
                size="small"
                @click="showStudentDetail(row)"
              >
                详情
              </el-button>
              <el-button
                type="text"
                size="small"
                :disabled="selectedCourse.gradeStatus === 'submitted'"
                @click="resetStudentGrade(row)"
              >
                重置
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <!-- 成绩统计 -->
      <div class="grade-statistics">
        <el-row :gutter="20">
          <el-col :span="6">
            <div class="stat-card">
              <div class="stat-title">平均分</div>
              <div class="stat-value">{{ statistics.avgScore.toFixed(1) }}</div>
            </div>
          </el-col>

          <el-col :span="6">
            <div class="stat-card">
              <div class="stat-title">最高分</div>
              <div class="stat-value">{{ statistics.maxScore }}</div>
            </div>
          </el-col>

          <el-col :span="6">
            <div class="stat-card">
              <div class="stat-title">最低分</div>
              <div class="stat-value">{{ statistics.minScore }}</div>
            </div>
          </el-col>

          <el-col :span="6">
            <div class="stat-card">
              <div class="stat-title">及格率</div>
              <div class="stat-value">{{ statistics.passRate }}%</div>
            </div>
          </el-col>
        </el-row>

        <div class="grade-distribution">
          <h4>成绩分布</h4>
          <el-row :gutter="10">
            <el-col :span="4">
              <div class="level-distribution">
                <div class="level-label">优秀(90-100)</div>
                <div class="level-count">{{ statistics.excellentCount }}人</div>
              </div>
            </el-col>
            <el-col :span="4">
              <div class="level-distribution">
                <div class="level-label">良好(80-89)</div>
                <div class="level-count">{{ statistics.goodCount }}人</div>
              </div>
            </el-col>
            <el-col :span="4">
              <div class="level-distribution">
                <div class="level-label">中等(70-79)</div>
                <div class="level-count">{{ statistics.mediumCount }}人</div>
              </div>
            </el-col>
            <el-col :span="4">
              <div class="level-distribution">
                <div class="level-label">及格(60-69)</div>
                <div class="level-count">{{ statistics.passCount }}人</div>
              </div>
            </el-col>
            <el-col :span="4">
              <div class="level-distribution">
                <div class="level-label">不及格(0-59)</div>
                <div class="level-count">{{ statistics.failCount }}人</div>
              </div>
            </el-col>
          </el-row>
        </div>
      </div>
    </div>

    <!-- 导入成绩弹窗 -->
    <el-dialog v-model="importDialogVisible" title="导入成绩" width="400px">
      <el-upload
        class="upload-demo"
        drag
        action="#"
        :before-upload="beforeGradeUpload"
        accept=".xlsx,.xls"
      >
        <el-icon class="el-icon--upload"><upload-filled /></el-icon>
        <div class="el-upload__text">将文件拖到此处，或<em>点击上传</em></div>
        <template #tip>
          <div class="el-upload__tip">
            支持Excel文件（.xlsx, .xls），请按照模板格式填写
          </div>
        </template>
      </el-upload>
      <template #footer>
        <el-button @click="importDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="downloadTemplate">下载模板</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  Notebook,
  Clock,
  Check,
  Upload,
  UploadFilled
} from "@element-plus/icons-vue";

// 类型定义
interface Course {
  id: number;
  name: string;
  type: "spike" | "receive" | "serve";
  studentCount: number;
  gradeStatus: "ungraded" | "grading" | "submitted";
  gradeConfig: {
    normalPercent: number;
    finalPercent: number;
  };
}

interface StudentGrade {
  id: number;
  studentNumber: string;
  studentName: string;
  attendance: number; // 出勤分 0-30
  homework: number; // 作业分 0-30
  performance: number; // 课堂表现 0-40
  normalScore: number; // 平时总分 0-100
  finalScore: number; // 期末成绩 0-100
  totalScore: number; // 总成绩
  gradeLevel: string; // 等级
  ranking: number; // 排名
}

// 统计数据
const stats = reactive({
  totalCourses: 6,
  ungradedCourses: 3,
  gradedCourses: 3,
  submittedCourses: 0
});

// 可选择的课程
const courses = ref<Course[]>([
  {
    id: 1,
    name: "基础扣球入门",
    type: "spike",
    studentCount: 20,
    gradeStatus: "grading",
    gradeConfig: { normalPercent: 40, finalPercent: 60 }
  },
  {
    id: 2,
    name: "强力跳发球训练",
    type: "serve",
    studentCount: 15,
    gradeStatus: "ungraded",
    gradeConfig: { normalPercent: 30, finalPercent: 70 }
  },
  {
    id: 3,
    name: "一传稳定性训练",
    type: "receive",
    studentCount: 25,
    gradeStatus: "submitted",
    gradeConfig: { normalPercent: 50, finalPercent: 50 }
  },
  {
    id: 4,
    name: "战术扣球提高班",
    type: "spike",
    studentCount: 12,
    gradeStatus: "grading",
    gradeConfig: { normalPercent: 60, finalPercent: 40 }
  },
  {
    id: 5,
    name: "飘球与旋转发球",
    type: "serve",
    studentCount: 18,
    gradeStatus: "ungraded",
    gradeConfig: { normalPercent: 35, finalPercent: 65 }
  },
  {
    id: 6,
    name: "防守接球强化",
    type: "receive",
    studentCount: 20,
    gradeStatus: "grading",
    gradeConfig: { normalPercent: 45, finalPercent: 55 }
  }
]);
// 当前选中的课程ID
const selectedCourseId = ref("");

// 当前选中的课程
const selectedCourse = ref<Course | null>(null);

// 成绩配置
const gradeConfig = reactive({
  normalPercent: 40,
  finalPercent: 60
});

// 学生成绩数据
const students = ref<StudentGrade[]>([
  {
    id: 1,
    studentNumber: "20230001",
    studentName: "张三",
    attendance: 28,
    homework: 25,
    performance: 35,
    normalScore: 88,
    finalScore: 85,
    totalScore: 86.2,
    gradeLevel: "良好",
    ranking: 1
  },
  {
    id: 2,
    studentNumber: "20230002",
    studentName: "李四",
    attendance: 30,
    homework: 28,
    performance: 38,
    normalScore: 96,
    finalScore: 92,
    totalScore: 93.6,
    gradeLevel: "优秀",
    ranking: 2
  },
  {
    id: 3,
    studentNumber: "20230003",
    studentName: "王五",
    attendance: 25,
    homework: 22,
    performance: 30,
    normalScore: 77,
    finalScore: 70,
    totalScore: 72.8,
    gradeLevel: "中等",
    ranking: 3
  }
]);

// 成绩统计
const statistics = reactive({
  avgScore: 84.2,
  maxScore: 93.6,
  minScore: 72.8,
  passRate: 100,
  excellentCount: 1,
  goodCount: 1,
  mediumCount: 1,
  passCount: 0,
  failCount: 0
});

// 导入弹窗
const importDialogVisible = ref(false);

// 辅助函数
const getCourseTypeText = (type: string) => {
  const map = { spike: "扣球训练", receive: "接球训练", serve: "发球训练" };
  return map[type] || type;
};

const getCourseTypeTag = (type: string) => {
  const map = { spike: "danger", receive: "success", serve: "primary" };
  return map[type] || "info";
};

const getStatusText = (status: string) => {
  const map = { ungraded: "未录入", grading: "录入中", submitted: "已提交" };
  return map[status] || status;
};

// 计算平时总分
const calculateNormalScore = (student: StudentGrade) => {
  student.normalScore =
    student.attendance + student.homework + student.performance;
  calculateTotalScore(student);
  updateStatistics();
};

// 计算总成绩
const calculateTotalScore = (student: StudentGrade) => {
  student.totalScore =
    (student.normalScore * gradeConfig.normalPercent) / 100 +
    (student.finalScore * gradeConfig.finalPercent) / 100;
  student.gradeLevel = getGradeLevel(student.totalScore);
  updateRanking();
  updateStatistics();
};

// 获取成绩等级
const getGradeLevel = (score: number) => {
  if (score >= 90) return "优秀";
  if (score >= 80) return "良好";
  if (score >= 70) return "中等";
  if (score >= 60) return "及格";
  return "不及格";
};

const getGradeLevelTag = (level: string) => {
  const map = {
    优秀: "success",
    良好: "primary",
    中等: "info",
    及格: "warning",
    不及格: "danger"
  };
  return map[level] || "info";
};

// 更新排名
const updateRanking = () => {
  const sorted = [...students.value].sort(
    (a, b) => b.totalScore - a.totalScore
  );
  sorted.forEach((student, index) => {
    const target = students.value.find(s => s.id === student.id);
    if (target) target.ranking = index + 1;
  });
};

// 更新统计信息
const updateStatistics = () => {
  if (students.value.length === 0) return;

  const scores = students.value.map(s => s.totalScore);
  statistics.avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
  statistics.maxScore = Math.max(...scores);
  statistics.minScore = Math.min(...scores);
  statistics.passRate = (
    (scores.filter(s => s >= 60).length / scores.length) *
    100
  ).toFixed(1);

  statistics.excellentCount = scores.filter(s => s >= 90).length;
  statistics.goodCount = scores.filter(s => s >= 80 && s < 90).length;
  statistics.mediumCount = scores.filter(s => s >= 70 && s < 80).length;
  statistics.passCount = scores.filter(s => s >= 60 && s < 70).length;
  statistics.failCount = scores.filter(s => s < 60).length;
};

// 加载课程学生
// 课程切换处理
// 课程切换处理
const handleCourseChange = (courseId: number | string) => {
  console.log("选择的课程ID:", courseId, "类型:", typeof courseId); // 调试用

  if (!courseId) {
    selectedCourse.value = null;
    return;
  }

  // 确保courseId是number类型
  const courseIdNum =
    typeof courseId === "string" ? parseInt(courseId) : courseId;
  const course = courses.value.find(c => c.id === courseIdNum);

  if (course) {
    selectedCourse.value = course;
    gradeConfig.normalPercent = course.gradeConfig.normalPercent;
    gradeConfig.finalPercent = course.gradeConfig.finalPercent;

    // 加载该课程的学生数据
    loadCourseStudents(course);
  }
};

// 加载课程学生数据
const loadCourseStudents = (course: Course) => {
  students.value = generateStudents(course.studentCount);
  updateRanking();
  updateStatistics();
};

// 生成模拟学生数据
const generateStudents = (count: number) => {
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    studentNumber: `2023${String(i + 1).padStart(4, "0")}`,
    studentName: `学生${i + 1}`,
    attendance: Math.floor(Math.random() * 31),
    homework: Math.floor(Math.random() * 31),
    performance: Math.floor(Math.random() * 41),
    normalScore: 0,
    finalScore: Math.floor(Math.random() * 101),
    totalScore: 0,
    gradeLevel: "",
    ranking: 0
  })).map(student => {
    student.normalScore =
      student.attendance + student.homework + student.performance;
    student.totalScore =
      (student.normalScore * gradeConfig.normalPercent) / 100 +
      (student.finalScore * gradeConfig.finalPercent) / 100;
    student.gradeLevel = getGradeLevel(student.totalScore);
    return student;
  });
};

// 更新成绩配置
const updateGradeConfig = () => {
  gradeConfig.finalPercent = 100 - gradeConfig.normalPercent;
  // 重新计算所有学生的总成绩
  students.value.forEach(student => {
    calculateTotalScore(student);
  });
};

// 保存成绩
const saveGrades = () => {
  ElMessage.success("成绩保存成功");
};

// 提交成绩
const submitGrades = () => {
  ElMessageBox.confirm("提交后成绩将无法修改，确认提交吗？", "提交确认", {
    confirmButtonText: "确认提交",
    cancelButtonText: "取消",
    type: "warning"
  }).then(() => {
    if (selectedCourse.value) {
      selectedCourse.value.gradeStatus = "submitted";
    }
    ElMessage.success("成绩提交成功");
  });
};

// 导出成绩
const exportGrades = () => {
  if (!selectedCourse.value) {
    ElMessage.warning("请先选择课程");
    return;
  }

  // 这里可以调用导出Excel的功能
  ElMessage.info("导出功能开发中...");
};

// 导入成绩
const importGrades = () => {
  importDialogVisible.value = true;
};

// 下载模板
const downloadTemplate = () => {
  ElMessage.info("模板下载功能开发中...");
};

// 文件上传前处理
const beforeGradeUpload = (file: File) => {
  // 处理Excel文件上传
  ElMessage.info("导入功能开发中...");
  return false;
};

// 显示学生详情
const showStudentDetail = (student: StudentGrade) => {
  ElMessageBox.alert(
    `
    <div style="text-align: left; line-height: 1.8;">
      <p><strong>学号：</strong>${student.studentNumber}</p>
      <p><strong>姓名：</strong>${student.studentName}</p>
      <p><strong>出勤分：</strong>${student.attendance}/30</p>
      <p><strong>作业分：</strong>${student.homework}/30</p>
      <p><strong>课堂表现：</strong>${student.performance}/40</p>
      <p><strong>平时总分：</strong>${student.normalScore}/100</p>
      <p><strong>期末成绩：</strong>${student.finalScore}/100</p>
      <p><strong>总成绩：</strong>${student.totalScore.toFixed(1)}</p>
      <p><strong>等级：</strong>${student.gradeLevel}</p>
      <p><strong>排名：</strong>第${student.ranking}名</p>
    </div>
  `,
    "学生成绩详情",
    {
      dangerouslyUseHTMLString: true
    }
  );
};

// 重置学生成绩
const resetStudentGrade = (student: StudentGrade) => {
  ElMessageBox.confirm(`确认重置${student.studentName}的成绩吗？`, "重置确认", {
    confirmButtonText: "确认重置",
    cancelButtonText: "取消"
  }).then(() => {
    student.attendance = 0;
    student.homework = 0;
    student.performance = 0;
    student.finalScore = 0;
    calculateNormalScore(student);
    ElMessage.success("成绩已重置");
  });
};

onMounted(() => {
  // 默认选择第一个课程
});
</script>

<style scoped>
.grade-entry-container {
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto;
}
.header-left {
  flex: 1;
}

.course-subtitle {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-top: 8px;
}

.subtitle-item {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #606266;
  font-size: 14px;
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
  border-radius: 16px;
  padding: 24px;
  display: flex;
  align-items: center;
  gap: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  border: 1px solid #f0f2f5;
}

.stats-card:hover {
  transform: translateY(-2px);
  transition: transform 0.3s;
}

.card-icon {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 24px;
}

.total .card-icon {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}
.ungraded .card-icon {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}
.graded .card-icon {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}
.submitted .card-icon {
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
}

.card-content {
  flex: 1;
}

.card-label {
  display: block;
  font-size: 14px;
  color: #909399;
  margin-bottom: 8px;
}

.card-value {
  display: block;
  font-size: 28px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 4px;
}

/* 课程选择 */
.course-selector {
  background: white;
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  border: 1px solid #f0f2f5;
}

/* 成绩录入主区域 */
.grade-entry-main {
  background: white;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  border: 1px solid #f0f2f5;
}

.course-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #f0f2f5;
}

.course-header h3 {
  margin: 0;
  color: #303133;
}

.course-info {
  display: flex;
  align-items: center;
  gap: 15px;
  color: #606266;
}

/* 成绩配置 */
.grade-config {
  background: #f8f9fa;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
}

/* 成绩表格 */
.grade-table-container {
  margin-bottom: 30px;
}

/* 成绩样式 */
.score-excellent {
  color: #67c23a;
  font-weight: bold;
}
.score-good {
  color: #409eff;
  font-weight: bold;
}
.score-medium {
  color: #e6a23c;
  font-weight: bold;
}
.score-pass {
  color: #909399;
}
.score-fail {
  color: #f56c6c;
  font-weight: bold;
}
.score-warning {
  color: #e6a23c;
}

/* 成绩统计 */
.grade-statistics {
  background: #f8f9fa;
  border-radius: 12px;
  padding: 24px;
}

.stat-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  text-align: center;
  border: 1px solid #ebeef5;
}

.stat-title {
  font-size: 14px;
  color: #909399;
  margin-bottom: 10px;
}

.stat-value {
  font-size: 28px;
  font-weight: bold;
  color: #303133;
}

.grade-distribution {
  margin-top: 30px;
}

.grade-distribution h4 {
  margin: 0 0 15px 0;
  color: #303133;
}

.level-distribution {
  background: white;
  border-radius: 8px;
  padding: 15px;
  text-align: center;
  border: 1px solid #ebeef5;
}

.level-label {
  font-size: 12px;
  color: #909399;
  margin-bottom: 5px;
}

.level-count {
  font-size: 18px;
  font-weight: bold;
  color: #303133;
}

/* 响应式 */
@media (max-width: 1200px) {
  .stats-cards {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .stats-cards {
    grid-template-columns: 1fr;
  }

  .course-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 15px;
  }

  .grade-distribution .el-col {
    margin-bottom: 10px;
  }
}

/* 表格单元格输入框样式 */
:deep(.el-table .cell) {
  padding: 4px 8px;
}

:deep(.el-input-number) {
  width: 100%;
}
</style>
