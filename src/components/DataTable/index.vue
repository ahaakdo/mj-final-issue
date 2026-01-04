<template>
  <el-table
    :data="tableData"
    :border="border"
    :stripe="stripe"
    :loading="loading"
    style="width: 100%"
    v-bind="$attrs"
  >
    <!-- 渲染自定义列 -->
    <template v-for="(col, index) in columns" :key="index">
      <!-- 基础列渲染 -->
      <el-table-column
        :prop="col.prop"
        :label="col.label"
        :width="col.width"
        :min-width="col.minWidth"
        :align="col.align || 'center'"
        :fixed="col.fixed"
        :sortable="col.sortable"
      >
        <!-- 列内容自定义插槽（支持自定义单元格内容） -->
        <template #default="scope">
          <slot
            :name="`cell-${col.prop}`"
            :row="scope.row"
            :index="scope.$index"
          >
            {{ scope.row[col.prop] }}
            <!-- 默认显示字段值 -->
          </slot>
        </template>
      </el-table-column>
    </template>

    <!-- 操作列（按需显示） -->
    <el-table-column
      v-if="showActionColumn"
      :label="actionColumnConfig.label || '操作'"
      :width="actionColumnConfig.width || 280"
      :align="actionColumnConfig.align || 'center'"
      :fixed="actionColumnConfig.fixed || 'right'"
    >
      <template #default="scope">
        <!-- 渲染操作按钮 -->
        <template v-for="(btn, idx) in actionColumnConfig.buttons" :key="idx">
          <el-button
            :type="btn.type || 'primary'"
            :size="btn.size || 'small'"
            :icon="btn.icon"
            :disabled="btn.disabled?.(scope.row)"
            :hidden="btn.hidden?.(scope.row)"
            style="margin-right: 4px"
            @click="handleAction(btn.action, scope.row, scope.$index)"
          >
            {{ btn.label }}
          </el-button>
        </template>
        <!-- 操作列自定义插槽（扩展更多操作） -->
        <slot name="action" :row="scope.row" :index="scope.$index" />
      </template>
    </el-table-column>
  </el-table>
</template>

<script setup lang="ts">
import { defineProps, defineEmits, withDefaults } from "vue";
import { ElTableColumn, ElTable, ElButton } from "element-plus";

// 定义列配置类型
interface ColumnConfig {
  prop: string; // 字段名
  label: string; // 列标题
  width?: number | string; // 列宽
  minWidth?: number | string; // 最小列宽
  align?: "left" | "center" | "right"; // 对齐方式
  fixed?: boolean | "left" | "right"; // 是否固定列
  sortable?: boolean | "custom"; // 是否排序
}

// 定义操作按钮类型
interface ActionButton {
  label: string; // 按钮文字
  action: string; // 按钮标识（用于区分点击事件）
  type?: "primary" | "success" | "warning" | "danger" | "info" | "text"; // 按钮类型
  size?: "large" | "default" | "small"; // 按钮大小
  icon?: string; // 按钮图标（Element Plus图标名）
  disabled?: (row: any) => boolean; // 按钮禁用条件
  hidden?: (row: any) => boolean; // 按钮隐藏条件
}

// 定义操作列配置类型
interface ActionColumnConfig {
  label?: string; // 操作列标题
  width?: number | string; // 操作列宽度
  align?: "left" | "center" | "right"; // 对齐方式
  fixed?: boolean | "left" | "right"; // 是否固定
  buttons: ActionButton[]; // 操作按钮列表
}

// 定义组件Props
const props = withDefaults(
  defineProps<{
    tableData: any[]; // 表格数据
    columns: ColumnConfig[]; // 列配置
    showActionColumn?: boolean; // 是否显示操作列
    actionColumnConfig?: ActionColumnConfig; // 操作列配置
    border?: boolean; // 是否显示边框
    stripe?: boolean; // 是否斑马纹
    loading?: boolean; // 是否加载中
  }>(),
  {
    showActionColumn: false,
    border: true,
    stripe: true,
    loading: false,
    // 操作列默认配置
    actionColumnConfig: () => ({
      label: "操作",
      width: 180,
      align: "center",
      fixed: "right",
      buttons: []
    })
  }
);

// 定义事件：操作按钮点击、自定义事件透传
const emit = defineEmits<{
  (e: "action-click", action: string, row: any, index: number): void;
  (e: string, ...args: any[]): void; // 透传其他事件
}>();

// 处理操作按钮点击
const handleAction = (action: string, row: any, index: number) => {
  emit("action-click", action, row, index);
};
</script>

<style scoped>
/* 可选：自定义表格样式 */
:deep(.el-table) {
  --el-table-header-text-color: #303133;
  --el-table-row-hover-bg-color: #f5f7fa;
}
</style>
