<template>
  <div class="withdraw-application-container">
    <!-- 顶部横幅 -->
    <div class="banner-section">
      <div class="banner-content">
        <h1 class="banner-title"><i class="fas fa-sign-out-alt" /> 退课申请</h1>
        <p class="banner-description">
          在线提交退课申请，请详细说明退课原因并上传相关证明材料
        </p>
      </div>
    </div>

    <!-- 当前已选课程 -->
    <div class="current-courses-section">
      <div class="section-header">
        <h2 class="section-title">
          <i class="fas fa-list-alt" />
          当前已选课程
          <span class="courses-count">({{ currentCourses.length }})</span>
        </h2>
        <el-button type="text" @click="refreshCourses">
          <i class="fas fa-sync-alt" /> 刷新
        </el-button>
      </div>

      <div v-if="loadingCourses" class="loading-spinner">
        <i class="fas fa-spinner fa-spin" /> 加载中...
      </div>

      <div v-else-if="currentCourses.length === 0" class="empty-state">
        <i class="fas fa-book" />
        <h3>暂无已选课程</h3>
        <p>当前没有可以申请退课的课程</p>
      </div>

      <div v-else class="courses-grid">
        <div
          v-for="course in currentCourses"
          :key="course.id"
          class="course-card"
          :class="{ selected: selectedCourse?.id === course.id }"
          @click="selectCourse(course)"
        >
          <div class="course-header">
            <div class="course-code">{{ course.course_code }}</div>
            <div class="course-type">
              <el-tag :type="getCourseTypeTag(course.course_type)" size="mini">
                {{ getCourseTypeText(course.course_type) }}
              </el-tag>
            </div>
          </div>

          <h3 class="course-title">{{ course.course_name }}</h3>

          <div class="course-teacher">
            <i class="fas fa-user-circle" />
            <span>{{ course.teacher_name }}</span>
          </div>

          <div class="course-details">
            <div class="detail-item">
              <i class="fas fa-clock" />
              <span>{{ course.schedule }}</span>
            </div>
            <div class="detail-item">
              <i class="fas fa-map-marker-alt" />
              <span>{{ course.location }}</span>
            </div>
            <div class="detail-item">
              <i class="fas fa-calendar-alt" />
              <span
                >{{ formatDate(course.start_date) }} -
                {{ formatDate(course.end_date) }}</span
              >
            </div>
          </div>

          <div class="course-status">
            <el-tag type="success" size="small">
              已选课
              {{
                course.selection_time ? formatDate(course.selection_time) : ""
              }}
            </el-tag>
          </div>

          <div class="select-button" @click.stop="selectCourse(course)">
            <el-button
              :type="selectedCourse?.id === course.id ? 'primary' : 'default'"
              size="small"
            >
              {{ selectedCourse?.id === course.id ? "已选中" : "选择此课程" }}
            </el-button>
          </div>
        </div>
      </div>
    </div>

    <!-- 退课申请表单 -->
    <div v-if="selectedCourse" class="withdraw-form-section">
      <div class="section-header">
        <h2 class="section-title">
          <i class="fas fa-edit" />
          退课申请表单
        </h2>
        <div class="selected-course-info">
          <span>当前选中：</span>
          <strong>{{ selectedCourse.course_name }}</strong>
          <span class="course-code">{{ selectedCourse.course_code }}</span>
        </div>
      </div>

      <el-form
        ref="withdrawFormRef"
        :model="withdrawForm"
        :rules="withdrawRules"
        label-width="120px"
        class="withdraw-form"
      >
        <!-- 课程信息 -->
        <el-form-item label="课程信息">
          <div class="course-summary">
            <div class="summary-item">
              <span class="label">课程名称：</span>
              <span class="value">{{ selectedCourse.course_name }}</span>
            </div>
            <div class="summary-item">
              <span class="label">授课教师：</span>
              <span class="value">{{ selectedCourse.teacher_name }}</span>
            </div>
            <div class="summary-item">
              <span class="label">上课时间：</span>
              <span class="value">{{ selectedCourse.schedule }}</span>
            </div>
            <div class="summary-item">
              <span class="label">上课地点：</span>
              <span class="value">{{ selectedCourse.location }}</span>
            </div>
          </div>
        </el-form-item>

        <!-- 退课原因 -->
        <el-form-item label="退课原因" prop="reason" required>
          <el-input
            v-model="withdrawForm.reason"
            type="textarea"
            :rows="4"
            placeholder="请详细说明退课原因，例如：时间冲突、身体原因、课程难度等"
            maxlength="500"
            show-word-limit
          />
          <div class="form-tips">
            <i class="fas fa-lightbulb" />
            请提供详细的退课理由，这将有助于教师审批
          </div>
        </el-form-item>

        <!-- 退课类型 -->
        <el-form-item label="退课类型" prop="type">
          <el-radio-group v-model="withdrawForm.type">
            <el-radio label="time_conflict">时间冲突</el-radio>
            <el-radio label="personal_reason">个人原因</el-radio>
            <el-radio label="course_difficulty">课程难度</el-radio>
            <el-radio label="other">其他原因</el-radio>
          </el-radio-group>
        </el-form-item>

        <!-- 证明材料 -->
        <el-form-item label="证明材料" prop="attachments">
          <el-upload
            class="upload-demo"
            action="#"
            :on-change="handleAttachmentChange"
            :on-remove="handleAttachmentRemove"
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
                支持上传PDF、Word、图片格式，单个文件不超过5MB，最多3个文件
              </div>
            </template>
          </el-upload>
        </el-form-item>

        <!-- 紧急程度 -->
        <el-form-item label="紧急程度" prop="urgency">
          <el-rate
            v-model="withdrawForm.urgency"
            :max="3"
            :texts="['一般', '紧急', '非常紧急']"
            show-text
          />
          <div class="form-tips">
            <i class="fas fa-exclamation-circle" />
            紧急程度会影响审批优先级
          </div>
        </el-form-item>

        <!-- 期望处理时间 -->
        <el-form-item label="期望处理时间" prop="expected_time">
          <el-date-picker
            v-model="withdrawForm.expected_time"
            type="date"
            placeholder="选择期望处理日期"
            :disabled-date="disabledDate"
          />
        </el-form-item>

        <!-- 联系方式 -->
        <el-form-item label="联系电话" prop="phone">
          <el-input
            v-model="withdrawForm.phone"
            placeholder="请输入联系电话"
            maxlength="11"
          />
        </el-form-item>

        <el-form-item label="电子邮箱" prop="email">
          <el-input v-model="withdrawForm.email" placeholder="请输入电子邮箱" />
        </el-form-item>

        <!-- 操作按钮 -->
        <el-form-item>
          <el-button
            type="primary"
            :loading="submitting"
            @click="submitWithdraw"
          >
            <i class="fas fa-paper-plane" />
            提交申请
          </el-button>
          <el-button @click="saveAsDraft">
            <i class="fas fa-save" />
            保存草稿
          </el-button>
          <el-button @click="resetForm">
            <i class="fas fa-redo" />
            重置表单
          </el-button>
          <el-button @click="clearSelection">
            <i class="fas fa-times" />
            取消选择
          </el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 申请须知 -->
    <div class="notice-section">
      <div class="notice-header">
        <i class="fas fa-exclamation-triangle" />
        <h3>退课申请须知</h3>
      </div>
      <div class="notice-content">
        <div class="notice-item">
          <i class="fas fa-clock" />
          <div>
            <h4>申请时间</h4>
            <p>请在课程开始前2周内提交申请，超过截止时间可能无法退课</p>
          </div>
        </div>
        <div class="notice-item">
          <i class="fas fa-user-check" />
          <div>
            <h4>审批流程</h4>
            <p>退课申请需授课教师审批，审批时间通常为1-3个工作日</p>
          </div>
        </div>
        <div class="notice-item">
          <i class="fas fa-file-contract" />
          <div>
            <h4>退课后果</h4>
            <p>退课成功后，课程将不再计入成绩单，已交费用按学校规定处理</p>
          </div>
        </div>
        <div class="notice-item">
          <i class="fas fa-undo-alt" />
          <div>
            <h4>撤销申请</h4>
            <p>在教师审批前，可以随时撤销退课申请</p>
          </div>
        </div>
      </div>
    </div>

    <!-- 最近申请记录 -->
    <div class="recent-applications-section">
      <div class="section-header">
        <h2 class="section-title">
          <i class="fas fa-history" />
          最近退课申请
        </h2>
        <el-button type="text" @click="viewAllApplications">
          查看全部 <i class="fas fa-arrow-right" />
        </el-button>
      </div>

      <div v-if="loadingApplications" class="loading-spinner">
        <i class="fas fa-spinner fa-spin" /> 加载中...
      </div>

      <div v-else-if="recentApplications.length === 0" class="empty-state">
        <i class="fas fa-clipboard-list" />
        <h3>暂无退课申请记录</h3>
        <p>您还没有提交过退课申请</p>
      </div>

      <div v-else class="applications-list">
        <div
          v-for="application in recentApplications"
          :key="application.id"
          class="application-item"
          :class="`status-${application.status}`"
        >
          <div class="application-header">
            <div class="course-name">{{ application.course_name }}</div>
            <div class="application-status">
              <el-tag :type="getStatusTag(application.status)" size="small">
                {{ getStatusText(application.status) }}
              </el-tag>
            </div>
          </div>

          <div class="application-details">
            <div class="detail">
              <i class="fas fa-calendar-alt" />
              <span
                >申请时间：{{ formatDateTime(application.apply_time) }}</span
              >
            </div>
            <div class="detail">
              <i class="fas fa-comment" />
              <span>申请原因：{{ truncateText(application.reason, 30) }}</span>
            </div>
          </div>

          <div class="application-actions">
            <el-button
              v-if="application.status === 'pending'"
              type="warning"
              size="small"
              @click="cancelApplication(application)"
            >
              <i class="fas fa-times" /> 撤销申请
            </el-button>
            <el-button
              type="primary"
              size="small"
              @click="viewApplicationDetail(application)"
            >
              <i class="fas fa-eye" /> 查看详情
            </el-button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import {
  ElMessage,
  ElMessageBox,
  type FormInstance,
  type UploadFile,
  type UploadFiles
} from "element-plus";
import type { FormRules } from "element-plus";

// ---------------------- 类型定义 ----------------------
interface Course {
  id: number;
  course_code: string;
  course_name: string;
  course_type: "spike" | "receive" | "serve";
  teacher_name: string;
  schedule: string;
  location: string;
  start_date: string;
  end_date: string;
  selection_time: string;
  credits: number;
}

interface WithdrawApplication {
  id: number;
  course_id: number;
  course_name: string;
  apply_time: string;
  reason: string;
  type: string;
  status: "pending" | "approved" | "rejected";
  review_time?: string;
  review_notes?: string;
}

// ---------------------- 状态管理 ----------------------
const loadingCourses = ref(false);
const loadingApplications = ref(false);
const submitting = ref(false);
const selectedCourse = ref<Course | null>(null);

// ---------------------- 表单 ----------------------
const withdrawFormRef = ref<FormInstance>();
const withdrawForm = reactive({
  reason: "",
  type: "time_conflict",
  attachments: [] as UploadFile[],
  urgency: 1,
  expected_time: "",
  phone: "",
  email: ""
});

const withdrawRules: FormRules = {
  reason: [
    { required: true, message: "请填写退课原因", trigger: "blur" },
    { min: 10, message: "退课原因至少10个字符", trigger: "blur" }
  ],
  phone: [
    { required: true, message: "请输入联系电话", trigger: "blur" },
    {
      pattern: /^1[3-9]\d{9}$/,
      message: "请输入正确的手机号码",
      trigger: "blur"
    }
  ],
  email: [
    { required: true, message: "请输入电子邮箱", trigger: "blur" },
    { type: "email", message: "请输入正确的邮箱格式", trigger: "blur" }
  ]
};

// ---------------------- 模拟数据 ----------------------
const currentCourses = ref<Course[]>([
  {
    id: 1,
    course_code: "SV101",
    course_name: "基础发球入门",
    course_type: "serve",
    teacher_name: "李教练",
    schedule: "每周一、三 14:00-16:00",
    location: "排球馆A区",
    start_date: "2024-02-15",
    end_date: "2024-06-15",
    selection_time: "2024-01-10",
    credits: 1
  },
  {
    id: 2,
    course_code: "RC201",
    course_name: "一传稳定性训练",
    course_type: "receive",
    teacher_name: "王教练",
    schedule: "每周二、四 16:00-18:00",
    location: "排球馆B区",
    start_date: "2024-03-01",
    end_date: "2024-07-01",
    selection_time: "2024-01-12",
    credits: 2
  },
  {
    id: 3,
    course_code: "SP301",
    course_name: "战术扣球与线路变化",
    course_type: "spike",
    teacher_name: "张教练",
    schedule: "每周五 14:00-16:00",
    location: "专业训练馆",
    start_date: "2024-01-30",
    end_date: "2024-05-30",
    selection_time: "2024-01-15",
    credits: 3
  }
]);

const recentApplications = ref<WithdrawApplication[]>([
  {
    id: 1,
    course_id: 4,
    course_name: "强力跳发球训练",
    apply_time: "2024-01-14 16:45:00",
    reason: "时间冲突，无法按时上课",
    type: "time_conflict",
    status: "rejected",
    review_time: "2024-01-15 11:10:00",
    review_notes: "退课时间已过截止日期"
  },
  {
    id: 2,
    course_id: 5,
    course_name: "基础接球入门",
    apply_time: "2023-12-20 09:30:00",
    reason: "个人身体原因，需要休养",
    type: "personal_reason",
    status: "approved",
    review_time: "2023-12-21 14:20:00",
    review_notes: "申请理由充分，同意退课"
  }
]);

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

const getStatusText = (status: string) => {
  const map: Record<string, string> = {
    pending: "待审批",
    approved: "已通过",
    rejected: "已驳回"
  };
  return map[status] || status;
};

const getStatusTag = (status: string) => {
  const map: Record<string, string> = {
    pending: "warning",
    approved: "success",
    rejected: "danger"
  };
  return map[status] || "info";
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return `${date.getMonth() + 1}月${date.getDate()}日`;
};

const formatDateTime = (dateString: string) => {
  const date = new Date(dateString);
  return date
    .toLocaleString("zh-CN", {
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    })
    .replace(/\//g, "-");
};

const truncateText = (text: string, maxLength: number) => {
  if (!text) return "";
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + "...";
};

const disabledDate = (time: Date) => {
  // 禁止选择今天之前的日期
  return time.getTime() < Date.now() - 24 * 60 * 60 * 1000;
};

// ---------------------- 事件处理函数 ----------------------
// 课程选择
const selectCourse = (course: Course) => {
  selectedCourse.value = course;
};

const clearSelection = () => {
  selectedCourse.value = null;
  resetForm();
};

const refreshCourses = async () => {
  loadingCourses.value = true;
  try {
    // 模拟加载延迟
    await new Promise(resolve => setTimeout(resolve, 800));
    ElMessage.success("课程列表已刷新");
  } finally {
    loadingCourses.value = false;
  }
};

// 附件处理
const handleAttachmentChange = (file: UploadFile, fileList: UploadFiles) => {
  withdrawForm.attachments = fileList;
};

const handleAttachmentRemove = (file: UploadFile, fileList: UploadFiles) => {
  withdrawForm.attachments = fileList;
};

// 表单处理
const submitWithdraw = async () => {
  if (!withdrawFormRef.value || !selectedCourse.value) return;

  try {
    await withdrawFormRef.value.validate();

    submitting.value = true;

    // 模拟提交过程
    await new Promise(resolve => setTimeout(resolve, 1500));

    // 创建新的申请记录
    const newApplication: WithdrawApplication = {
      id: recentApplications.value.length + 1,
      course_id: selectedCourse.value.id,
      course_name: selectedCourse.value.course_name,
      apply_time: new Date().toISOString(),
      reason: withdrawForm.reason,
      type: withdrawForm.type,
      status: "pending"
    };

    // 添加到申请记录
    recentApplications.value.unshift(newApplication);

    // 从当前课程列表中移除
    currentCourses.value = currentCourses.value.filter(
      course => course.id !== selectedCourse.value?.id
    );

    // 重置表单
    resetForm();
    selectedCourse.value = null;

    ElMessage.success("退课申请提交成功！请等待教师审批");
  } catch (error) {
    console.error("表单验证失败:", error);
    ElMessage.warning("请完善退课申请信息");
  } finally {
    submitting.value = false;
  }
};

const saveAsDraft = () => {
  ElMessage.info("草稿已保存");
  // 这里可以添加保存草稿的逻辑
};

const resetForm = () => {
  if (withdrawFormRef.value) {
    withdrawFormRef.value.resetFields();
  }
  withdrawForm.attachments = [];
  withdrawForm.urgency = 1;
  withdrawForm.expected_time = "";
};

// 申请记录处理
const cancelApplication = async (application: WithdrawApplication) => {
  try {
    await ElMessageBox.confirm(
      "确定要撤销此退课申请吗？撤销后不可恢复。",
      "确认撤销",
      {
        confirmButtonText: "确定撤销",
        cancelButtonText: "取消",
        type: "warning"
      }
    );

    // 更新申请状态为已撤销
    application.status = "rejected";
    application.review_notes = "用户主动撤销";
    application.review_time = new Date().toISOString();

    // 重新加入当前课程列表
    const originalCourse = {
      id: application.course_id,
      course_code: "SV201",
      course_name: application.course_name,
      course_type: "serve" as const,
      teacher_name: "王教练",
      schedule: "每周二、四 16:00-18:00",
      location: "排球馆C区",
      start_date: "2024-03-10",
      end_date: "2024-07-10",
      selection_time: new Date().toISOString(),
      credits: 2
    };

    currentCourses.value.push(originalCourse);

    ElMessage.success("申请已成功撤销");
  } catch {
    // 用户取消
  }
};

const viewApplicationDetail = (application: WithdrawApplication) => {
  ElMessageBox.alert(
    `
      <div style="text-align: left; line-height: 1.8;">
        <p><strong>课程名称：</strong>${application.course_name}</p>
        <p><strong>申请时间：</strong>${formatDateTime(application.apply_time)}</p>
        <p><strong>申请原因：</strong>${application.reason}</p>
        <p><strong>申请类型：</strong>${application.type}</p>
        <p><strong>当前状态：</strong>${getStatusText(application.status)}</p>
        ${application.review_time ? `<p><strong>审批时间：</strong>${formatDateTime(application.review_time)}</p>` : ""}
        ${application.review_notes ? `<p><strong>审批意见：</strong>${application.review_notes}</p>` : ""}
      </div>
    `,
    "申请详情",
    {
      dangerouslyUseHTMLString: true,
      confirmButtonText: "关闭"
    }
  );
};

const viewAllApplications = () => {
  ElMessage.info("查看全部申请功能开发中...");
};

// ---------------------- 生命周期 ----------------------
onMounted(() => {
  console.log("退课申请页面加载完成");
});
</script>

<style scoped lang="scss">
.withdraw-application-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px 40px;
}

/* 顶部横幅 */
.banner-section {
  background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);
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

/* 通用样式 */
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
    color: #e74c3c;
  }
}

.courses-count {
  font-size: 14px;
  color: #7f8c8d;
  font-weight: normal;
  margin-left: 5px;
}

/* 当前课程 */
.current-courses-section {
  background: white;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 30px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.courses-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.course-card {
  background: white;
  border: 2px solid #e9ecef;
  border-radius: 10px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    border-color: #3498db;
    box-shadow: 0 4px 12px rgba(52, 152, 219, 0.1);
  }

  &.selected {
    border-color: #e74c3c;
    background: linear-gradient(
      135deg,
      rgba(231, 76, 60, 0.05) 0%,
      rgba(231, 76, 60, 0.02) 100%
    );
  }
}

.course-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.course-code {
  font-family: "Courier New", monospace;
  font-weight: 600;
  color: #3498db;
  font-size: 14px;
}

.course-title {
  font-size: 16px;
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 10px;
  line-height: 1.4;
}

.course-teacher {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #7f8c8d;
  margin-bottom: 15px;

  i {
    font-size: 14px;
  }
}

.course-details {
  margin-bottom: 15px;
}

.detail-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #7f8c8d;
  margin-bottom: 6px;

  i {
    width: 14px;
    text-align: center;
  }
}

.course-status {
  margin-bottom: 15px;
}

.select-button {
  text-align: center;
}

/* 退课表单 */
.withdraw-form-section {
  background: white;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 30px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.selected-course-info {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
  color: #7f8c8d;

  strong {
    color: #2c3e50;
  }

  .course-code {
    background: #f8f9fa;
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 12px;
  }
}

.withdraw-form {
  :deep(.el-form-item) {
    margin-bottom: 20px;
  }
}

.course-summary {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 15px;
  border: 1px solid #e9ecef;
}

.summary-item {
  display: flex;
  margin-bottom: 8px;
  font-size: 14px;

  &:last-child {
    margin-bottom: 0;
  }

  .label {
    color: #7f8c8d;
    min-width: 80px;
  }

  .value {
    color: #2c3e50;
    flex: 1;
  }
}

.form-tips {
  font-size: 12px;
  color: #7f8c8d;
  margin-top: 8px;
  display: flex;
  align-items: center;
  gap: 5px;

  i {
    font-size: 12px;
  }
}

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

/* 申请须知 */
.notice-section {
  background: white;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 30px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  border: 1px solid #ffe58f;
  background: #fff9e6;
}

.notice-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 20px;

  i {
    color: #f39c12;
    font-size: 20px;
  }

  h3 {
    font-size: 18px;
    font-weight: 600;
    color: #2c3e50;
    margin: 0;
  }
}

.notice-content {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
}

.notice-item {
  display: flex;
  gap: 15px;

  i {
    color: #3498db;
    font-size: 20px;
    margin-top: 3px;
  }

  h4 {
    font-size: 14px;
    font-weight: 600;
    color: #2c3e50;
    margin: 0 0 5px 0;
  }

  p {
    font-size: 13px;
    color: #7f8c8d;
    margin: 0;
    line-height: 1.5;
  }
}

/* 最近申请 */
.recent-applications-section {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.applications-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.application-item {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 20px;
  border: 1px solid #e9ecef;
  transition: all 0.3s ease;

  &:hover {
    border-color: #3498db;
    box-shadow: 0 2px 8px rgba(52, 152, 219, 0.1);
  }

  &.status-pending {
    border-left: 4px solid #f39c12;
  }

  &.status-approved {
    border-left: 4px solid #2ecc71;
  }

  &.status-rejected {
    border-left: 4px solid #e74c3c;
  }
}

.application-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.course-name {
  font-weight: 600;
  color: #2c3e50;
  font-size: 16px;
  flex: 1;
  margin-right: 15px;
}

.application-details {
  margin-bottom: 15px;
}

.detail {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #7f8c8d;
  margin-bottom: 8px;

  i {
    width: 14px;
    text-align: center;
  }
}

.application-actions {
  display: flex;
  gap: 10px;
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

/* 响应式设计 */
@media (max-width: 768px) {
  .withdraw-application-container {
    padding: 0 15px 30px;
  }

  .banner-section {
    padding: 20px;
  }

  .banner-title {
    font-size: 24px;
  }

  .section-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }

  .courses-grid {
    grid-template-columns: 1fr;
  }

  .notice-content {
    grid-template-columns: 1fr;
  }

  .application-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }

  .application-details .detail {
    flex-direction: column;
    align-items: flex-start;
    gap: 5px;
  }

  .application-actions {
    flex-direction: column;
  }
}
</style>
