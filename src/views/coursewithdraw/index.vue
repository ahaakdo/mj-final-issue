<template>
  <div class="withdraw-course-container">
    <!-- 操作栏：查询/重置/导出 -->
    <div class="table-toolbar">
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="学生姓名">
          <el-input v-model="searchForm.studentName" placeholder="请输入学生姓名" clearable />
        </el-form-item>
        <el-form-item label="课程名称">
          <el-input v-model="searchForm.courseName" placeholder="请输入课程名称" clearable />
        </el-form-item>
        <el-form-item label="申请状态">
          <el-select v-model="searchForm.status" placeholder="请选择状态" clearable>
            <el-option label="待审核" value="pending" />
            <el-option label="审核通过" value="approved" />
            <el-option label="审核驳回" value="rejected" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
      <el-button type="success" icon="el-icon-download" @click="handleExport">导出数据</el-button>
    </div>
    <div class="table-main">
      <!-- 通用退课申请表格 -->
      <data-table
        :table-data="tableData"
        :columns="tableColumns"
        :show-action-column="true"
        :action-column-config="actionColumnConfig"
        :loading="tableLoading"
        size="small"
        @action-click="handleActionClick"
      >
        <!-- 自定义列：申请状态（格式化显示） -->
        <template #cell-status="{ row }">
          <el-tag :type="getStatusTagType(row.status)">{{ getStatusText(row.status) }}</el-tag>
        </template>

        <!-- 自定义列：申请时间（格式化） -->
        <template #cell-applyTime="{ row }">
          {{ row.applyTime }}
        </template>

        <!-- 自定义操作列扩展：批量审核按钮（可选） -->
        <template #action="{ row }">
          <el-popconfirm
            v-if="row.status === 'pending'"
            title="确认批量通过该申请？"
            @confirm="handleBatchApprove(row.id)"
          >
            <el-button type="warning" size="small" icon="el-icon-check-double">
              批量通过
            </el-button>
          </el-popconfirm>
        </template>
      </data-table>

      <!-- 分页组件 -->
      <div class="pagination">
        <el-pagination
          v-model:current-page="pagination.currentPage"
          v-model:page-size="pagination.pageSize"
          :total="pagination.total"
          layout="prev, pager, next, jumper, ->, total, sizes"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </div>
    <!-- 审核驳回弹窗 -->
    <el-dialog
      v-model="rejectDialogVisible"
      title="驳回退课申请"
      width="400px"
      @close="resetRejectForm"
    >
      <el-form :model="rejectForm" :rules="rejectRules" ref="rejectFormRef" label-width="80px">
        <el-form-item label="驳回原因" prop="reason">
          <el-input
            v-model="rejectForm.reason"
            type="textarea"
            rows="4"
            placeholder="请输入驳回原因（必填）"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="rejectDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleRejectSubmit">确认驳回</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox, ElDialog } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
// 引入通用表格组件
import DataTable from '@/components/DataTable/index.vue'
// // 引入时间格式化工具（可自行实现，或用dayjs）
// import { formatTime } from '@/utils/date'

// ---------------------- 状态枚举与工具函数 ----------------------
// 申请状态枚举
type ApplyStatus = 'pending' | 'approved' | 'rejected'

// 状态文本映射
const statusTextMap = {
  pending: '待审核',
  approved: '审核通过',
  rejected: '审核驳回'
}

// 状态标签类型映射
const statusTagTypeMap = {
  pending: 'warning',
  approved: 'success',
  rejected: 'danger'
}

// 获取状态文本
const getStatusText = (status: ApplyStatus) => statusTextMap[status] || '未知状态'

// 获取状态标签类型
const getStatusTagType = (status: ApplyStatus) => statusTagTypeMap[status] || 'info'

// ---------------------- 表格数据与分页 ----------------------
// 加载状态
const tableLoading = ref(false)

// 搜索表单
const searchForm = reactive({
  studentName: '',
  courseName: '',
  status: '' as ApplyStatus | ''
})

// 分页配置
const pagination = reactive({
  currentPage: 1,
  pageSize: 10,
  total: 0
})

// 模拟退课申请数据（实际项目中替换为接口请求）
const tableData = ref([
  {
    id: 1,
    studentName: '张三',
    studentNo: '2023001',
    courseName: 'Vue3 实战开发',
    courseNo: 'COURSE2023001',
    applyTime: '2026-01-01 10:20:30',
    reason: '个人时间冲突，无法继续学习',
    status: 'pending' as ApplyStatus,
    reviewer: '',
    reviewTime: ''
  },
  {
    id: 2,
    studentName: '李四',
    studentNo: '2023002',
    courseName: 'Element Plus 组件封装',
    courseNo: 'COURSE2023002',
    applyTime: '2026-01-02 14:15:20',
    reason: '课程难度超出预期',
    status: 'approved' as ApplyStatus,
    reviewer: '管理员',
    reviewTime: '2026-01-02 16:30:00'
  },
  {
    id: 3,
    studentName: '王五',
    studentNo: '2023003',
    courseName: 'TypeScript 进阶',
    courseNo: 'COURSE2023003',
    applyTime: '2026-01-03 09:05:10',
    reason: '转学需要退课',
    status: 'rejected' as ApplyStatus,
    reviewer: '管理员',
    reviewTime: '2026-01-03 10:20:00',
    rejectReason: '转学证明未提交，暂不处理'
  }
])

// 初始化分页总数
onMounted(() => {
  pagination.total = tableData.value.length
})

// ---------------------- 列配置 ----------------------
const tableColumns = ref([
  { prop: 'id', label: '申请ID', width: 80, fixed: 'left' },
  { prop: 'studentName', label: '学生姓名', minWidth: 100 },
  { prop: 'studentNo', label: '学号', minWidth: 120 },
  { prop: 'courseName', label: '课程名称', minWidth: 180 },
  { prop: 'courseNo', label: '课程编号', minWidth: 120 },
  { prop: 'applyTime', label: '申请时间', minWidth: 180 },
  { prop: 'reason', label: '退课原因', minWidth: 200 },
  { prop: 'status', label: '申请状态', minWidth: 100 },
  { prop: 'reviewer', label: '审核人', minWidth: 100 },
  { prop: 'reviewTime', label: '审核时间', minWidth: 180 }
])

// ---------------------- 操作列配置 ----------------------
const actionColumnConfig = ref({
  label: '操作',
  width: 280,
  buttons: [
    // 查看详情按钮（所有状态都显示）
    {
      label: '查看详情',
      action: 'view',
      type: 'primary',
      icon: 'el-icon-view'
    },
    // 审核通过按钮（仅待审核状态显示）
    {
      label: '审核通过',
      action: 'approve',
      type: 'success',
      icon: 'el-icon-check',
      hidden: (row: any) => row.status !== 'pending'
    },
    // 审核驳回按钮（仅待审核状态显示）
    {
      label: '审核驳回',
      action: 'reject',
      type: 'danger',
      icon: 'el-icon-close',
      hidden: (row: any) => row.status !== 'pending'
    },
    // 编辑申请按钮（仅未审核状态显示，可选）
    {
      label: '编辑申请',
      action: 'edit',
      type: 'info',
      icon: 'el-icon-edit',
      hidden: (row: any) => row.status !== 'pending'
    }
  ]
})

// ---------------------- 审核驳回弹窗 ----------------------
const rejectDialogVisible = ref(false)
const rejectFormRef = ref<FormInstance>()
const rejectForm = reactive({
  reason: '',
  applyId: '' // 存储当前驳回的申请ID
})

// 驳回表单校验规则
const rejectRules = ref<FormRules>({
  reason: [{ required: true, message: '请输入驳回原因', trigger: 'blur' }]
})

// 重置驳回表单
const resetRejectForm = () => {
  rejectFormRef.value?.resetFields()
  rejectForm.reason = ''
  rejectForm.applyId = ''
}

// ---------------------- 事件处理 ----------------------
// 操作按钮点击事件
const handleActionClick = (action: string, row: any) => {
  switch (action) {
    case 'view':
      handleViewDetail(row)
      break
    case 'approve':
      handleApprove(row.id)
      break
    case 'reject':
      handleReject(row.id)
      break
    case 'edit':
      handleEdit(row)
      break
  }
}

// 查看详情
const handleViewDetail = (row: any) => {
  // 可打开详情弹窗，展示完整的退课申请信息
  ElMessageBox.alert(
    `
      <div style="text-align: left;">
        <p>申请ID：${row.id}</p>
        <p>学生姓名：${row.studentName}</p>
        <p>学号：${row.studentNo}</p>
        <p>课程名称：${row.courseName}</p>
        <p>申请时间：${row.applyTime}</p>
        <p>退课原因：${row.reason}</p>
        <p>申请状态：${getStatusText(row.status)}</p>
        ${row.reviewTime ? `<p>审核时间：${row.reviewTime}</p>` : ''}
        ${row.reviewer ? `<p>审核人：${row.reviewer}</p>` : ''}
        ${row.rejectReason ? `<p>驳回原因：${row.rejectReason}</p>` : ''}
      </div>
    `,
    '退课申请详情',
    {
      dangerouslyUseHTMLString: true,
      confirmButtonText: '关闭'
    }
  )
}

// 审核通过
const handleApprove = (applyId: number) => {
  ElMessageBox.confirm('确认审核通过该退课申请？', '提示', {
    confirmButtonText: '确认',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    tableLoading.value = true
    try {
      // 模拟接口请求：实际项目中替换为真实接口
      await new Promise(resolve => setTimeout(resolve, 500))
      // 更新表格数据
      const targetRow = tableData.value.find(item => item.id === applyId)
      if (targetRow) {
        targetRow.status = 'approved'
        targetRow.reviewer = '管理员'
        targetRow.reviewTime = new Date().toLocaleString()
      }
      ElMessage.success('审核通过成功！')
    } catch (error) {
      ElMessage.error('审核通过失败！')
    } finally {
      tableLoading.value = false
    }
  })
}

// 审核驳回（打开弹窗）
const handleReject = (applyId: number) => {
  rejectForm.applyId = applyId
  rejectDialogVisible.value = true
}

// 提交驳回原因
const handleRejectSubmit = async () => {
  if (!rejectFormRef.value) return
  try {
    await rejectFormRef.value.validate()
    tableLoading.value = true
    // 模拟接口请求
    await new Promise(resolve => setTimeout(resolve, 500))
    // 更新表格数据
    const targetRow = tableData.value.find(item => item.id === rejectForm.applyId)
    if (targetRow) {
      targetRow.status = 'rejected'
      targetRow.reviewer = '管理员'
      targetRow.reviewTime = new Date().toLocaleString()
      targetRow.rejectReason = rejectForm.reason
    }
    ElMessage.success('驳回申请成功！')
    rejectDialogVisible.value = false
    resetRejectForm()
  } catch (error) {
    ElMessage.error('请填写驳回原因！')
  } finally {
    tableLoading.value = false
  }
}

// 编辑申请（示例：可打开编辑弹窗）
const handleEdit = (row: any) => {
  ElMessage.info(`编辑申请ID：${row.id}（可扩展编辑弹窗逻辑）`)
}

// 批量通过（自定义操作列扩展按钮）
const handleBatchApprove = (applyId: number) => {
  ElMessage.success(`批量通过申请ID：${applyId}`)
  // 实现批量审核逻辑
}

// ---------------------- 搜索/分页/导出 ----------------------
// 查询
const handleSearch = () => {
  tableLoading.value = true
  // 模拟接口查询：实际项目中根据searchForm参数请求接口
  setTimeout(() => {
    // 这里仅做前端过滤示例
    const filteredData = tableData.value.filter(item => {
      if (searchForm.studentName && !item.studentName.includes(searchForm.studentName)) return false
      if (searchForm.courseName && !item.courseName.includes(searchForm.courseName)) return false
      if (searchForm.status && item.status !== searchForm.status) return false
      return true
    })
    tableData.value = filteredData
    pagination.total = filteredData.length
    pagination.currentPage = 1
    tableLoading.value = false
    ElMessage.success('查询成功！')
  }, 500)
}

// 重置搜索
const handleReset = () => {
  Object.assign(searchForm, {
    studentName: '',
    courseName: '',
    status: ''
  })
  handleSearch() // 重置后重新查询
}

// 导出数据
const handleExport = () => {
  ElMessage.info('导出退课申请数据（可扩展Excel导出逻辑）')
  // 可结合xlsx库实现Excel导出
}

// 分页-每页条数变化
const handleSizeChange = (val: number) => {
  pagination.pageSize = val
  // 实际项目中重新请求接口
}

// 分页-当前页变化
const handleSizeChange_2 = (val: number) => {
  pagination.currentPage = val
  // 实际项目中重新请求接口
}
const handleCurrentChange = handleSizeChange_2
</script>

<style scoped>
.withdraw-course-container {
  padding: 20px;
  background: #fff;
}

.table-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.pagination {
  margin-top: 20px;
  text-align: right;
}

:deep(.el-form-item) {
  margin-bottom: 0;
}
</style>