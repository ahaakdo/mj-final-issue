<template>
  <div class="selection-management-container">
    <!-- 顶部统计卡片 -->
    <div class="stats-cards">
      <div class="stats-card pending">
        <div class="card-icon">
          <el-icon><Clock /></el-icon>
        </div>
        <div class="card-content">
          <span class="card-label">待审批申请</span>
          <span class="card-value">{{ stats.pendingCount }}</span>
          <span class="card-tip">较昨日+{{ stats.pendingIncrease }}%</span>
        </div>
      </div>

      <div class="stats-card capacity">
        <div class="card-icon">
          <el-icon><PieChart /></el-icon>
        </div>
        <div class="card-content">
          <span class="card-label">满员课程</span>
          <span class="card-value">{{ stats.fullCourseCount }}</span>
          <span class="card-tip">{{ stats.capacityRate }}%饱和度</span>
        </div>
      </div>

      <div class="stats-card students">
        <div class="card-icon">
          <el-icon><User /></el-icon>
        </div>
        <div class="card-content">
          <span class="card-label">总选课人数</span>
          <span class="card-value">{{ stats.totalStudents }}</span>
          <span class="card-tip">今日新增{{ stats.todayNew }}人</span>
        </div>
      </div>

      <div class="stats-card courses">
        <div class="card-icon">
          <el-icon><Notebook /></el-icon>
        </div>
        <div class="card-content">
          <span class="card-label">管理课程数</span>
          <span class="card-value">{{ stats.courseCount }}</span>
          <span class="card-tip">{{ stats.activeCourseCount }}门进行中</span>
        </div>
      </div>
    </div>

    <!-- 筛选条件 -->
    <div class="filter-container">
      <el-form :inline="true" :model="filterForm" class="filter-form">
        <el-form-item label="课程类型">
          <el-select
            v-model="filterForm.courseType"
            placeholder="全部类型"
            clearable
          >
            <el-option label="扣球训练" value="spike" />
            <el-option label="接球训练" value="receive" />
            <el-option label="发球训练" value="serve" />
          </el-select>
        </el-form-item>

        <el-form-item label="申请类型">
          <el-select
            v-model="filterForm.applyType"
            placeholder="全部类型"
            clearable
          >
            <el-option label="选课申请" value="select" />
            <el-option label="退课申请" value="withdraw" />
            <el-option label="课程调整" value="adjust" />
          </el-select>
        </el-form-item>

        <el-form-item label="申请状态">
          <el-select
            v-model="filterForm.status"
            placeholder="全部状态"
            clearable
          >
            <el-option label="待审批" value="pending" />
            <el-option label="已通过" value="approved" />
            <el-option label="已驳回" value="rejected" />
          </el-select>
        </el-form-item>

        <el-form-item label="学生姓名">
          <el-input
            v-model="filterForm.studentName"
            placeholder="请输入学生姓名"
            clearable
          />
        </el-form-item>

        <el-form-item label="课程名称">
          <el-input
            v-model="filterForm.courseName"
            placeholder="请输入课程名称"
            clearable
          />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" :loading="loading" @click="handleSearch"
            >查询</el-button
          >
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 功能操作栏 -->
    <div class="action-bar">
      <div class="action-left">
        <el-button type="primary" @click="handleBatchApprove">
          <el-icon><Check /></el-icon>批量通过
        </el-button>
        <el-button type="warning" @click="handleBatchReject">
          <el-icon><Close /></el-icon>批量驳回
        </el-button>
        <el-button type="info" @click="handleCapacityControl">
          <el-icon><PieChart /></el-icon>容量调整
        </el-button>
        <el-button type="success" @click="handleAdjustStudents">
          <el-icon><User /></el-icon>名单调整
        </el-button>
      </div>

      <div class="action-right">
        <el-button type="success" plain @click="handleExport">
          <el-icon><Download /></el-icon>导出申请
        </el-button>
      </div>
    </div>

    <!-- 选课申请表格 -->
    <div class="table-container">
      <data-table
        :table-data="tableData"
        :columns="tableColumns"
        :show-action-column="true"
        :action-column-config="actionColumnConfig"
        :loading="loading"
        border
        stripe
        @action-click="handleActionClick"
      >
        <!-- 自定义列：课程类型 -->
        <template #cell-courseType="{ row }">
          <el-tag :type="getCourseTypeTag(row.courseType)" size="small">
            {{ getCourseTypeText(row.courseType) }}
          </el-tag>
        </template>

        <!-- 自定义列：申请类型 -->
        <template #cell-applyType="{ row }">
          <el-tag :type="getApplyTypeTag(row.applyType)" size="small">
            {{ getApplyTypeText(row.applyType) }}
          </el-tag>
        </template>

        <!-- 自定义列：申请状态 -->
        <template #cell-status="{ row }">
          <el-tag :type="getStatusTag(row.status)" size="small">
            {{ getStatusText(row.status) }}
          </el-tag>
        </template>

        <!-- 自定义列：申请时间 -->
        <template #cell-applyTime="{ row }">
          {{ formatTime(row.applyTime) }}
        </template>

        <!-- 自定义操作列扩展 -->
        <template #action="{ row }">
          <el-button
            v-if="row.status === 'pending'"
            type="text"
            size="small"
            @click="handleQuickApprove(row)"
          >
            快速通过
          </el-button>
        </template>
      </data-table>

      <!-- 分页 -->
      <div class="pagination">
        <el-pagination
          v-model:current-page="pagination.currentPage"
          v-model:page-size="pagination.pageSize"
          :total="pagination.total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </div>

    <!-- 容量调整弹窗 -->
    <el-dialog
      v-model="capacityDialogVisible"
      title="课程容量调整"
      width="500px"
      @close="resetCapacityForm"
    >
      <el-form ref="capacityFormRef" :model="capacityForm" label-width="100px">
        <el-form-item label="选择课程">
          <el-select
            v-model="capacityForm.courseId"
            placeholder="请选择课程"
            style="width: 100%"
          >
            <el-option
              v-for="course in selectableCourses"
              :key="course.id"
              :label="course.name"
              :value="course.id"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="当前容量">
          <el-input :value="getCurrentCapacity()" disabled />
        </el-form-item>

        <el-form-item label="当前人数">
          <el-input :value="getCurrentStudents()" disabled />
        </el-form-item>

        <el-form-item label="调整后容量" required>
          <el-input-number
            v-model="capacityForm.newCapacity"
            :min="getCurrentStudents()"
            :max="200"
            style="width: 100%"
            placeholder="请输入新容量"
          />
        </el-form-item>

        <el-form-item label="调整原因">
          <el-input
            v-model="capacityForm.reason"
            type="textarea"
            rows="3"
            placeholder="请输入容量调整原因"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="capacityDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitCapacityChange">
          确认调整
        </el-button>
      </template>
    </el-dialog>

    <!-- 名单调整弹窗 -->
    <el-dialog
      v-model="adjustDialogVisible"
      title="学生名单调整"
      width="600px"
      @close="resetAdjustForm"
    >
      <el-form ref="adjustFormRef" :model="adjustForm" label-width="100px">
        <el-form-item label="选择课程">
          <el-select
            v-model="adjustForm.courseId"
            placeholder="请选择课程"
            style="width: 100%"
            @change="handleCourseChange"
          >
            <el-option
              v-for="course in selectableCourses"
              :key="course.id"
              :label="course.name"
              :value="course.id"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="操作类型">
          <el-radio-group v-model="adjustForm.operation">
            <el-radio label="add">添加学生</el-radio>
            <el-radio label="remove">移除学生</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item v-if="adjustForm.operation === 'add'" label="选择学生">
          <el-select
            v-model="adjustForm.studentIds"
            multiple
            filterable
            placeholder="请选择要添加的学生"
            style="width: 100%"
          >
            <el-option
              v-for="student in availableStudents"
              :key="student.id"
              :label="`${student.name} (${student.number})`"
              :value="student.id"
            />
          </el-select>
        </el-form-item>

        <el-form-item v-else label="选择学生">
          <el-select
            v-model="adjustForm.studentIds"
            multiple
            filterable
            placeholder="请选择要移除的学生"
            style="width: 100%"
          >
            <el-option
              v-for="student in enrolledStudents"
              :key="student.id"
              :label="`${student.name} (${student.number})`"
              :value="student.id"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="调整原因">
          <el-input
            v-model="adjustForm.reason"
            type="textarea"
            rows="3"
            placeholder="请输入调整原因"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="adjustDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitAdjustStudents">
          确认调整
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import type { FormInstance } from "element-plus";
import {
  Clock,
  PieChart,
  User,
  Notebook,
  Check,
  Close,
  Download
} from "@element-plus/icons-vue";
import DataTable from "@/components/DataTable/index.vue";

// ---------------------- 类型定义 ----------------------
type CourseType = "spike" | "receive" | "serve";
type ApplyType = "select" | "withdraw" | "adjust";
type ApplyStatus = "pending" | "approved" | "rejected";

interface Application {
  id: number;
  studentName: string;
  studentNumber: string;
  courseName: string;
  courseType: CourseType;
  applyType: ApplyType;
  applyTime: string;
  reason: string;
  status: ApplyStatus;
  currentCapacity: number;
  currentStudents: number;
  capacityRate: number;
}

// ---------------------- 统计数据 ----------------------
const stats = reactive({
  pendingCount: 12,
  pendingIncrease: 5,
  fullCourseCount: 3,
  capacityRate: 78,
  totalStudents: 324,
  todayNew: 8,
  courseCount: 8,
  activeCourseCount: 5
});

const isSearching = ref(false); // 添加搜索状态标记
// ---------------------- 筛选表单 ----------------------
const filterForm = reactive({
  courseType: "" as CourseType | "",
  applyType: "" as ApplyType | "",
  status: "" as ApplyStatus | "",
  studentName: "",
  courseName: ""
});

// ---------------------- 表格数据 ----------------------
const loading = ref(false);

const rawTableData = ref<Application[]>([
  {
    id: 1,
    studentName: "张三",
    studentNumber: "20230001",
    courseName: "基础扣球入门",
    courseType: "spike",
    applyType: "select",
    applyTime: "2024-01-10 14:30:25",
    reason: "提升扣球技术",
    status: "pending",
    currentCapacity: 20,
    currentStudents: 18,
    capacityRate: 90
  },
  {
    id: 2,
    studentName: "李四",
    studentNumber: "20230002",
    courseName: "强力跳发球训练",
    courseType: "serve",
    applyType: "withdraw",
    applyTime: "2024-01-10 09:15:42",
    reason: "时间冲突，无法参加",
    status: "pending",
    currentCapacity: 15,
    currentStudents: 15,
    capacityRate: 100
  },
  {
    id: 3,
    studentName: "王五",
    studentNumber: "20230003",
    courseName: "一传稳定性训练",
    courseType: "receive",
    applyType: "select",
    applyTime: "2024-01-09 16:20:18",
    reason: "需要提高防守能力",
    status: "approved",
    currentCapacity: 25,
    currentStudents: 22,
    capacityRate: 88
  },
  {
    id: 4,
    studentName: "赵六",
    studentNumber: "20230004",
    courseName: "战术扣球提高班",
    courseType: "spike",
    applyType: "adjust",
    applyTime: "2024-01-09 11:05:33",
    reason: "课程时间调整申请",
    status: "rejected",
    currentCapacity: 12,
    currentStudents: 12,
    capacityRate: 100
  },
  {
    id: 5,
    studentName: "钱七",
    studentNumber: "20230005",
    courseName: "飘球与旋转发球",
    courseType: "serve",
    applyType: "select",
    applyTime: "2024-01-08 15:40:59",
    reason: "学习发球技巧",
    status: "pending",
    currentCapacity: 18,
    currentStudents: 10,
    capacityRate: 56
  }
]);
const tableData = ref<Application[]>([]);
// ---------------------- 表格列配置 ----------------------
const tableColumns = ref([
  { prop: "id", label: "申请ID", width: 80, align: "center" },
  { prop: "studentName", label: "学生姓名", width: 100 },
  { prop: "studentNumber", label: "学号", width: 120 },
  { prop: "courseName", label: "课程名称", minWidth: 150 },
  { prop: "courseType", label: "课程类型", width: 100 },
  { prop: "applyType", label: "申请类型", width: 100 },
  { prop: "applyTime", label: "申请时间", width: 160 },
  { prop: "reason", label: "申请原因", minWidth: 200 },
  { prop: "currentStudents", label: "当前人数", width: 100 },
  { prop: "currentCapacity", label: "课程容量", width: 100 },
  { prop: "capacityRate", label: "饱和度", width: 100 },
  { prop: "status", label: "申请状态", width: 100 }
]);

// ---------------------- 操作列配置 ----------------------
const actionColumnConfig = ref({
  label: "操作",
  width: 260,
  align: "center",
  fixed: "right",
  buttons: [
    {
      label: "详情",
      action: "view",
      type: "primary",
      size: "small",
      icon: "el-icon-view"
    },
    {
      label: "通过",
      action: "approve",
      type: "success",
      size: "small",
      icon: "el-icon-check",
      hidden: (row: Application) => row.status !== "pending"
    },
    {
      label: "驳回",
      action: "reject",
      type: "danger",
      size: "small",
      icon: "el-icon-close",
      hidden: (row: Application) => row.status !== "pending"
    },
    {
      label: "调整",
      action: "adjust",
      type: "warning",
      size: "small",
      icon: "el-icon-edit",
      hidden: (row: Application) => row.status !== "pending"
    }
  ]
});

// ---------------------- 辅助函数 ----------------------
const getCourseTypeText = (type: CourseType) => {
  const map = { spike: "扣球训练", receive: "接球训练", serve: "发球训练" };
  return map[type] || type;
};

const getCourseTypeTag = (type: CourseType) => {
  const map = { spike: "danger", receive: "success", serve: "primary" };
  return map[type] || "info";
};

const getApplyTypeText = (type: ApplyType) => {
  const map = { select: "选课申请", withdraw: "退课申请", adjust: "课程调整" };
  return map[type] || type;
};

const getApplyTypeTag = (type: ApplyType) => {
  const map = { select: "primary", withdraw: "warning", adjust: "info" };
  return map[type] || "info";
};

const getStatusText = (status: ApplyStatus) => {
  const map = { pending: "待审批", approved: "已通过", rejected: "已驳回" };
  return map[status] || status;
};

const getStatusTag = (status: ApplyStatus) => {
  const map = { pending: "warning", approved: "success", rejected: "danger" };
  return map[status] || "info";
};

const formatTime = (time: string) => {
  return time; // 实际项目中可以使用dayjs格式化
};

// ---------------------- 分页 ----------------------
const pagination = reactive({
  currentPage: 1,
  pageSize: 10,
  total: 50
});

// ---------------------- 容量调整弹窗 ----------------------
const capacityDialogVisible = ref(false);
const capacityFormRef = ref<FormInstance>();
const capacityForm = reactive({
  courseId: "",
  newCapacity: 0,
  reason: ""
});

const selectableCourses = ref([
  { id: 1, name: "基础扣球入门", capacity: 20, students: 18 },
  { id: 2, name: "强力跳发球训练", capacity: 15, students: 15 },
  { id: 3, name: "一传稳定性训练", capacity: 25, students: 22 }
]);

const getCurrentCapacity = () => {
  const course = selectableCourses.value.find(
    c => c.id === capacityForm.courseId
  );
  return course ? `${course.capacity}人` : "--";
};

const getCurrentStudents = () => {
  const course = selectableCourses.value.find(
    c => c.id === capacityForm.courseId
  );
  return course ? `${course.students}人` : "--";
};

const resetCapacityForm = () => {
  capacityForm.courseId = "";
  capacityForm.newCapacity = 0;
  capacityForm.reason = "";
};

// ---------------------- 名单调整弹窗 ----------------------
const adjustDialogVisible = ref(false);
const adjustFormRef = ref<FormInstance>();
const adjustForm = reactive({
  courseId: "",
  operation: "add" as "add" | "remove",
  studentIds: [] as string[],
  reason: ""
});

const availableStudents = ref([
  { id: "1001", name: "张三", number: "20230001" },
  { id: "1002", name: "李四", number: "20230002" },
  { id: "1003", name: "王五", number: "20230003" },
  { id: "1004", name: "赵六", number: "20230004" }
]);

const enrolledStudents = ref([
  { id: "1005", name: "钱七", number: "20230005" },
  { id: "1006", name: "孙八", number: "20230006" },
  { id: "1007", name: "周九", number: "20230007" }
]);

const handleCourseChange = () => {
  // 根据选择的课程加载已选学生
  adjustForm.studentIds = [];
};

const resetAdjustForm = () => {
  adjustForm.courseId = "";
  adjustForm.operation = "add";
  adjustForm.studentIds = [];
  adjustForm.reason = "";
};

// ---------------------- 事件处理 ----------------------
const handleActionClick = (action: string, row: Application) => {
  switch (action) {
    case "view":
      handleViewDetail(row);
      break;
    case "approve":
      handleApprove(row);
      break;
    case "reject":
      handleReject(row);
      break;
    case "adjust":
      handleAdjust(row);
      break;
  }
};

const handleViewDetail = (row: Application) => {
  ElMessageBox.alert(
    `
      <div style="text-align: left; line-height: 1.8;">
        <p><strong>申请ID：</strong>${row.id}</p>
        <p><strong>学生：</strong>${row.studentName} (${row.studentNumber})</p>
        <p><strong>课程：</strong>${row.courseName} [${getCourseTypeText(row.courseType)}]</p>
        <p><strong>申请类型：</strong>${getApplyTypeText(row.applyType)}</p>
        <p><strong>申请时间：</strong>${row.applyTime}</p>
        <p><strong>申请原因：</strong>${row.reason}</p>
        <p><strong>当前状态：</strong>${getStatusText(row.status)}</p>
        <p><strong>课程容量：</strong>${row.currentStudents}/${row.currentCapacity} (${row.capacityRate}%)</p>
      </div>
    `,
    "申请详情",
    {
      dangerouslyUseHTMLString: true,
      confirmButtonText: "关闭",
      customClass: "detail-dialog"
    }
  );
};

const handleApprove = (row: Application) => {
  ElMessageBox.confirm(`确认通过 "${row.studentName}" 的申请？`, "提示", {
    confirmButtonText: "确认通过",
    cancelButtonText: "取消",
    type: "success"
  }).then(() => {
    row.status = "approved";
    ElMessage.success("申请已通过");
  });
};

const handleReject = (row: Application) => {
  ElMessageBox.prompt("请输入驳回原因", "驳回申请", {
    confirmButtonText: "确认驳回",
    cancelButtonText: "取消",
    inputPlaceholder: "请输入驳回原因",
    inputValidator: value => {
      if (!value) return "驳回原因不能为空";
      return true;
    }
  }).then(({ value }) => {
    row.status = "rejected";
    ElMessage.success(`已驳回：${value}`);
  });
};

const handleAdjust = (row: Application) => {
  adjustForm.courseId = row.id.toString();
  adjustDialogVisible.value = true;
};

// 批量操作
const handleBatchApprove = () => {
  const pendingCount = tableData.value.filter(
    row => row.status === "pending"
  ).length;
  if (pendingCount === 0) {
    ElMessage.warning("暂无待审批申请");
    return;
  }

  ElMessageBox.confirm(`批量通过 ${pendingCount} 条待审批申请？`, "批量操作", {
    confirmButtonText: "确认通过",
    cancelButtonText: "取消",
    type: "warning"
  }).then(() => {
    tableData.value.forEach(row => {
      if (row.status === "pending") {
        row.status = "approved";
      }
    });
    ElMessage.success(`已通过 ${pendingCount} 条申请`);
  });
};

const handleBatchReject = () => {
  const pendingCount = tableData.value.filter(
    row => row.status === "pending"
  ).length;
  if (pendingCount === 0) {
    ElMessage.warning("暂无待审批申请");
    return;
  }

  ElMessageBox.prompt("请输入批量驳回的通用原因", "批量驳回", {
    confirmButtonText: "确认驳回",
    cancelButtonText: "取消",
    inputPlaceholder: "请输入驳回原因",
    inputValidator: value => {
      if (!value) return "驳回原因不能为空";
      return true;
    }
  }).then(({ value }) => {
    tableData.value.forEach(row => {
      if (row.status === "pending") {
        row.status = "rejected";
      }
    });
    ElMessage.success(`已驳回 ${pendingCount} 条申请`);
  });
};

// 容量控制
const handleCapacityControl = () => {
  capacityDialogVisible.value = true;
};

const submitCapacityChange = async () => {
  if (!capacityForm.courseId) {
    ElMessage.warning("请选择课程");
    return;
  }

  if (capacityForm.newCapacity <= 0) {
    ElMessage.warning("请输入有效的容量数值");
    return;
  }

  loading.value = true;
  try {
    await new Promise(resolve => setTimeout(resolve, 800));
    ElMessage.success("课程容量已更新");
    capacityDialogVisible.value = false;
    resetCapacityForm();
  } finally {
    loading.value = false;
  }
};

// 名单调整
const handleAdjustStudents = () => {
  adjustDialogVisible.value = true;
};

const submitAdjustStudents = async () => {
  if (!adjustForm.courseId) {
    ElMessage.warning("请选择课程");
    return;
  }

  if (adjustForm.studentIds.length === 0) {
    ElMessage.warning("请选择要操作的学生");
    return;
  }

  if (!adjustForm.reason.trim()) {
    ElMessage.warning("请输入调整原因");
    return;
  }

  loading.value = true;
  try {
    await new Promise(resolve => setTimeout(resolve, 800));
    const operationText = adjustForm.operation === "add" ? "添加" : "移除";
    ElMessage.success(
      `已${operationText} ${adjustForm.studentIds.length} 名学生`
    );
    adjustDialogVisible.value = false;
    resetAdjustForm();
  } finally {
    loading.value = false;
  }
};

// 快速通过
const handleQuickApprove = (row: Application) => {
  row.status = "approved";
  ElMessage.success("申请已快速通过");
};
// 应用筛选条件
const applyFilters = () => {
  loading.value = true;

  // 筛选数据
  const filtered = rawTableData.value.filter(item => {
    if (filterForm.courseType && item.courseType !== filterForm.courseType)
      return false;
    if (filterForm.applyType && item.applyType !== filterForm.applyType)
      return false;
    if (filterForm.status && item.status !== filterForm.status) return false;
    if (
      filterForm.studentName &&
      !item.studentName.includes(filterForm.studentName)
    )
      return false;
    if (
      filterForm.courseName &&
      !item.courseName.includes(filterForm.courseName)
    )
      return false;
    return true;
  });

  tableData.value = filtered;
  pagination.total = filtered.length;
  pagination.currentPage = 1;

  setTimeout(() => {
    loading.value = false;
    ElMessage.success(`查询到 ${filtered.length} 条记录`);
  }, 300);
};
// 搜索/分页/导出
const handleSearch = () => {
  applyFilters(); // 调用筛选函数
};

const handleReset = () => {
  Object.assign(filterForm, {
    studentName: "",
    courseName: "",
    status: "",
    courseType: "",
    applyType: ""
  });

  tableData.value = [...rawTableData.value]; // 恢复原始数据
  pagination.total = rawTableData.value.length;
  pagination.currentPage = 1;

  ElMessage.success("已重置");
};

const handleExport = () => {
  ElMessage.info("导出功能开发中...");
};

const handleSizeChange = (val: number) => {
  pagination.pageSize = val;
  handleSearch();
};

const handleCurrentChange = (val: number) => {
  pagination.currentPage = val;
  handleSearch();
};

onMounted(() => {
  tableData.value = [...rawTableData.value]; // 初始化显示所有数据
  pagination.total = rawTableData.value.length;
});
</script>

<style scoped>
.selection-management-container {
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto;
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

.stats-card.pending .card-icon {
  background: linear-gradient(135deg, #ff9a9e 0%, #fad0c4 100%);
}

.stats-card.capacity .card-icon {
  background: linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%);
}

.stats-card.students .card-icon {
  background: linear-gradient(135deg, #fad0c4 0%, #ffd1ff 100%);
}

.stats-card.courses .card-icon {
  background: linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%);
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

.card-tip {
  display: block;
  font-size: 12px;
  color: #909399;
}

/* 筛选容器 */
.filter-container {
  background: white;
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  border: 1px solid #f0f2f5;
}

.filter-form {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
}

.filter-form .el-form-item {
  margin-bottom: 0;
}

/* 操作栏 */
.action-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 20px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  border: 1px solid #f0f2f5;
}

.action-left {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.action-right {
  display: flex;
  gap: 12px;
}

/* 表格容器 */
.table-container {
  background: white;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  border: 1px solid #f0f2f5;
}

.pagination {
  margin-top: 24px;
  display: flex;
  justify-content: center;
}

/* 响应式 */
@media (max-width: 1200px) {
  .stats-cards {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .selection-management-container {
    padding: 16px;
  }

  .stats-cards {
    grid-template-columns: 1fr;
  }

  .action-bar {
    flex-direction: column;
    gap: 15px;
    align-items: stretch;
  }

  .action-left {
    justify-content: center;
  }

  .filter-form {
    flex-direction: column;
    gap: 15px;
  }
}
</style>
