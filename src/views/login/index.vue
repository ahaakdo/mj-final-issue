<script setup lang="ts">
import Motion from "./utils/motion";
import { useRouter } from "vue-router";
import { message } from "@/utils/message";
import { loginRules } from "./utils/rule";
import { ref, reactive, toRaw } from "vue";
import { debounce } from "@pureadmin/utils";
import { useNav } from "@/layout/hooks/useNav";
import { useEventListener } from "@vueuse/core";
import type { FormInstance } from "element-plus";
import { useLayout } from "@/layout/hooks/useLayout";
import { useUserStoreHook } from "@/store/modules/user";
import { usePermissionStoreHook } from "@/store/modules/permission"; // 新增导入
import { bg, avatar, illustration } from "./utils/static";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import { useDataThemeChange } from "@/layout/hooks/useDataThemeChange";
import { initRouter, getTopMenu } from "@/router/utils";
import dayIcon from "@/assets/svg/day.svg?component";
import darkIcon from "@/assets/svg/dark.svg?component";
import Lock from "~icons/ri/lock-fill";
import User from "~icons/ri/user-3-fill";
import { ElMessage } from "element-plus";
import { userRegister, userLogin } from "@/api/user";
import { setToken } from "@/utils/auth";

defineOptions({
  name: "Login"
});

const router = useRouter();
const loading = ref(false);
const disabled = ref(false);
const ruleFormRef = ref<FormInstance>();

// 新增：角色选择状态
const showRoleSelection = ref(true);
const selectedRole = ref<"teacher" | "student" | "">("");

const { initStorage } = useLayout();
initStorage();

const { dataTheme, overallStyle, dataThemeChange } = useDataThemeChange();
dataThemeChange(overallStyle.value);
const { title } = useNav();

const ruleForm = reactive({
  username: "",
  password: "",
  role: "" as "teacher" | "student" | ""
});

// 选择角色
const selectRole = (role: "teacher" | "student") => {
  selectedRole.value = role;
  ruleForm.role = role;
  showRoleSelection.value = false;
};

// 返回角色选择
const backToRoleSelection = () => {
  selectedRole.value = "";
  ruleForm.role = "";
  showRoleSelection.value = true;
};

// 快速登录函数（用于测试）
const quickLogin = (role: "teacher" | "student") => {
  selectRole(role);
  // 延迟执行登录，确保DOM更新完成
  setTimeout(() => {
    onLogin(ruleFormRef.value);
  }, 100);
};

// 登录验证 - 简化版本
const onLogin = async (formEl: FormInstance | undefined) => {
  if (!formEl) return;

  // 验证是否选择了角色
  if (!ruleForm.role) {
    message("请选择登录角色", { type: "warning" });
    return;
  }

  await formEl.validate(async valid => {
    if (valid) {
      loading.value = true;
      disabled.value = true;
      try {
        const res: any = await userLogin({
          ...ruleForm
        });
        console.log(res);
        if (res.code === 200 || res.success) {
          ElMessage.success("登录成功！");
          await useUserStoreHook().simpleLogin({
              username: ruleForm.username,
              password: ruleForm.password,
              user_type: ruleForm.role,
              nickname: res.user.name,
              token: res.token
            })
            .then(async (res: any) => {
              if (res.success) {
                console.log("登录成功，用户数据:", res.data);

                // 立即检查用户store
                const userStore = useUserStoreHook();
                  console.log("登录后用户store:", {
                  username: userStore.username,
                  user_type: userStore.user_type,
                  roles: userStore.roles
                });

                // 初始化路由
                await initRouter();
                console.log("路由初始化完成");

                // 等待一下，然后过滤菜单
                setTimeout(() => {
                  const permissionStore = usePermissionStoreHook();
                  // 调试信息
                  console.log("菜单加载状态:", permissionStore.menusLoaded);
                  console.log("原始菜单数量:", permissionStore.wholeMenus.length);
                  // 强制过滤菜单
                  if (permissionStore.filterMenusByRole) {
                    console.log("开始过滤菜单，用户类型:", userStore.user_type);
                    permissionStore.filterMenusByRole();
                  }
                  // 跳转到目标页面
                  const targetPath =
                    ruleForm.role === "teacher"
                      ? "/teacher/classmanage"
                      : "/welcome";
                  console.log("跳转到:", targetPath);
                  // 使用window.location确保刷新
                  window.location.href = targetPath;
                }, 300);
             }
            })
            .catch(error => {
              console.error("登录出错:", error);
              message("登录过程出错", { type: "error" });
              loading.value = false;
              disabled.value = false;
            });
          loading.value = false;
          disabled.value = false;
        } else {
          console.log(res);
          ElMessage.error(res.message || "登录失败");
          loading.value = false;
          disabled.value = false;
        }
      } catch (e) {
        ElMessage.error("账户或密码错误");
        loading.value = false;
        disabled.value = false;
      }
    } else {
      ElMessage.error("账户或密码错误");
      loading.value = false;
      disabled.value = false;
    }
  });
};

const immediateDebounce: any = debounce(
  formRef => onLogin(formRef),
  1000,
  true
);
const rules = {
  username: [
    { required: true, message: "请输入用户名", trigger: "blur" },
    { min: 3, max: 15, message: "长度在 3 到 15 个字符", trigger: "blur" }
  ],
  password: [
    { required: true, message: "请输入密码", trigger: "blur" },
    { min: 6, message: "密码长度不能少于 6 位", trigger: "blur" }
  ],
  role: [{ required: true, message: "请选择角色", trigger: "change" }],
  real_name: [{ required: true, message: "请输入真实姓名", trigger: "blur" }],
  phone: [
    { required: true, message: "请输入手机号", trigger: "blur" },
    {
      pattern: /^1[3-9]\d{9}$/,
      message: "请输入正确的手机号码格式",
      trigger: "blur"
    }
  ],
  email: [
    { required: true, message: "请输入邮箱", trigger: "blur" },
    { type: "email", message: "请输入正确的邮箱格式", trigger: "blur" }
  ]
};
// 打开注册弹窗
const registerVisible = ref(false);
const registerForm = reactive({
  username: "",
  password: "",
  role: "", // 默认学生
  real_name: "",
  phone: "",
  email: ""
});
const registerFormRef = ref(null);
const register = () => {
  registerVisible.value = true;
};
const resetForm = () => {
  if (!registerFormRef.value) return;
  registerFormRef.value.resetFields();
};
const handleRegister = async () => {
  if (!registerFormRef.value) return;

  await registerFormRef.value.validate(async valid => {
    if (valid) {
      loading.value = true;
      try {
        // 这里替换为你真实的 API 请求
        console.log("提交的数据：", registerForm);
        const res = await userRegister(registerForm);
        if (res.code === 200 || res.success) {
          ElMessage.success("注册成功！");
          registerVisible.value = false;
          resetForm(); // 注册成功后重置表单
        } else {
          ElMessage.error(res.message || "注册失败");
        }
        registerVisible.value = false;
      } catch (error) {
        ElMessage.error("注册失败，请稍后再试");
      } finally {
        loading.value = false;
      }
    } else {
      console.log("表单校验未通过");
      return false;
    }
  });
};
// 监听回车键，仅在登录表单显示时生效
useEventListener(document, "keydown", ({ code }) => {
  if (
    !showRoleSelection.value &&
    ["Enter", "NumpadEnter"].includes(code) &&
    !disabled.value &&
    !loading.value
  )
    immediateDebounce(ruleFormRef.value);
});
</script>

<template>
  <div class="select-none">
    <img :src="bg" class="wave" />
    <div class="flex-c absolute right-5 top-3">
      <!-- 主题 -->
      <el-switch
        v-model="dataTheme"
        inline-prompt
        :active-icon="dayIcon"
        :inactive-icon="darkIcon"
        @change="dataThemeChange"
      />
    </div>
    <div class="login-container">
      <div class="img">
        <component :is="toRaw(illustration)" />
      </div>
      <div class="login-box">
        <!-- 角色选择页面 -->
        <div v-if="showRoleSelection" class="login-form">
          <avatar class="avatar" />
          <Motion>
            <h2 class="outline-hidden">{{ title }}</h2>
            <p class="role-subtitle">请选择您的身份</p>
          </Motion>

          <div class="role-selection">
            <Motion :delay="100">
              <div
                class="role-card teacher-card"
                @click="selectRole('teacher')"
              >
                <div class="role-icon">
                  <i class="fas fa-chalkboard-teacher" />
                </div>
                <div class="role-content">
                  <h3>教师登录</h3>
                  <p>管理课程、录入成绩、查看学生信息</p>
                </div>
                <div class="role-arrow">
                  <i class="el-icon-arrow-right" />
                </div>
              </div>
            </Motion>

            <Motion :delay="150">
              <div
                class="role-card student-card"
                @click="selectRole('student')"
              >
                <div class="role-icon">
                  <i class="fas fa-user-graduate" />
                </div>
                <div class="role-content">
                  <h3>学生登录</h3>
                  <p>选课学习、查看成绩、管理课程</p>
                </div>
                <div class="role-arrow">
                  <i class="el-icon-arrow-right" />
                </div>
              </div>
            </Motion>
          </div>

          <Motion :delay="200">
            <div class="login-tips">
              <i class="el-icon-info" />
              <span>使用统一账号: admin / 密码: admin123</span>
            </div>
          </Motion>

          <Motion :delay="250">
            <div class="quick-login-buttons">
              <el-button
                type="warning"
                size="small"
                @click="quickLogin('teacher')"
              >
                快速教师登录
              </el-button>
              <el-button
                type="success"
                size="small"
                @click="quickLogin('student')"
              >
                快速学生登录
              </el-button>
              <el-button type="info" size="small" @click="register">
                注册
              </el-button>
            </div>
          </Motion>
        </div>

        <!-- 登录表单页面 -->
        <div v-else class="login-form">
          <div class="form-header">
            <avatar class="avatar" />
            <div class="header-content">
              <Motion>
                <h2 class="outline-hidden">
                  {{ selectedRole === "teacher" ? "教师登录" : "学生登录" }}
                </h2>
              </Motion>
              <Motion :delay="50">
                <div class="role-indicator">
                  <el-tag
                    :type="selectedRole === 'teacher' ? 'warning' : 'success'"
                    size="small"
                  >
                    {{ selectedRole === "teacher" ? "教师" : "学生" }}
                  </el-tag>
                  <el-button
                    type="text"
                    size="small"
                    @click="backToRoleSelection"
                  >
                    <i class="el-icon-back" /> 返回
                  </el-button>
                </div>
              </Motion>
            </div>
          </div>

          <Motion :delay="100">
            <div class="login-tips">
              <i class="el-icon-info" />
              <span>使用统一账号: admin / 密码: admin123</span>
            </div>
          </Motion>

          <el-form ref="ruleFormRef" :model="ruleForm" size="large">
            <Motion :delay="150">
              <el-form-item
                :rules="[
                  {
                    required: true,
                    message: '请输入账号',
                    trigger: 'blur'
                  }
                ]"
                prop="username"
              >
                <el-input
                  v-model="ruleForm.username"
                  clearable
                  placeholder="账号"
                  :prefix-icon="useRenderIcon(User)"
                />
              </el-form-item>
            </Motion>

            <Motion :delay="200">
              <el-form-item prop="password">
                <el-input
                  v-model="ruleForm.password"
                  clearable
                  show-password
                  placeholder="密码"
                  :prefix-icon="useRenderIcon(Lock)"
                />
              </el-form-item>
            </Motion>

            <Motion :delay="250">
              <el-button
                class="w-full mt-4!"
                size="default"
                type="primary"
                :loading="loading"
                :disabled="disabled"
                @click="onLogin(ruleFormRef)"
              >
                登录
              </el-button>
            </Motion>
          </el-form>
        </div>
      </div>
    </div>
  </div>
  <el-dialog
    v-model="registerVisible"
    title="用户注册"
    width="450px"
    destroy-on-close
    header-class="register-header"
    body-class="register-body"
    @close="resetForm"
  >
    <el-form
      ref="registerFormRef"
      :model="registerForm"
      :rules="rules"
      label-width="80px"
      label-position="right"
      status-icon
    >
      <el-form-item label="用户名" prop="username">
        <el-input v-model="registerForm.username" placeholder="请输入用户名" />
      </el-form-item>

      <el-form-item label="密码" prop="password">
        <el-input
          v-model="registerForm.password"
          type="password"
          show-password
          placeholder="请输入密码"
        />
      </el-form-item>

      <el-form-item label="角色" prop="role">
        <el-radio-group v-model="registerForm.role">
          <el-radio label="student">学生</el-radio>
          <el-radio label="teacher">老师</el-radio>
        </el-radio-group>
      </el-form-item>

      <el-form-item label="真实姓名" prop="real_name">
        <el-input
          v-model="registerForm.real_name"
          placeholder="请输入您的真名"
        />
      </el-form-item>

      <el-form-item label="手机号" prop="phone">
        <el-input v-model="registerForm.phone" placeholder="请输入手机号" />
      </el-form-item>

      <el-form-item label="邮箱" prop="email">
        <el-input v-model="registerForm.email" placeholder="请输入邮箱地址" />
      </el-form-item>
    </el-form>

    <template #footer>
      <span class="dialog-footer">
        <el-button @click="registerVisible = false">取消</el-button>
        <el-button type="primary" :loading="loading" @click="handleRegister">
          提交注册
        </el-button>
      </span>
    </template>
  </el-dialog>
</template>

<style scoped>
@import url("@/style/login.css");

/* 角色选择样式 */
.role-subtitle {
  text-align: center;
  color: #666;
  font-size: 14px;
  margin-top: 10px;
  margin-bottom: 30px;
}

.role-selection {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 24px;
}

.role-card {
  display: flex;
  align-items: center;
  padding: 20px;
  border: 2px solid #e4e7ed;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  background: white;
}

.role-card:hover {
  border-color: #409eff;
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.1);
  transform: translateY(-2px);
}

.teacher-card:hover {
  border-color: #e6a23c;
  box-shadow: 0 4px 12px rgba(230, 162, 60, 0.1);
}

.student-card:hover {
  border-color: #67c23a;
  box-shadow: 0 4px 12px rgba(103, 194, 58, 0.1);
}

.role-icon {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 16px;
  font-size: 20px;
  flex-shrink: 0;
}

.teacher-card .role-icon {
  background: linear-gradient(135deg, #ffd666 0%, #ffa940 100%);
  color: #d46b08;
}

.student-card .role-icon {
  background: linear-gradient(135deg, #95de64 0%, #5cdbd3 100%);
  color: #389e0d;
}

.role-content {
  flex: 1;
}

.role-content h3 {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 4px;
}

.role-content p {
  font-size: 13px;
  color: #909399;
  margin: 0;
}

.role-arrow {
  color: #c0c4cc;
  font-size: 18px;
}

/* 登录提示 */
.login-tips {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px;
  background: #f0f9ff;
  border-radius: 8px;
  color: #409eff;
  font-size: 14px;
  margin-bottom: 20px;
}

.login-tips i {
  font-size: 16px;
}

/* 快速登录按钮 */
.quick-login-buttons {
  display: flex;
  gap: 12px;
  justify-content: center;
  margin-top: 20px;
}

/* 表单头部 */
.form-header {
  display: flex;
  align-items: center;
  margin-bottom: 30px;
}

.form-header .avatar {
  margin-right: 20px;
}

.header-content {
  flex: 1;
}

.role-indicator {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 8px;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .role-card {
    padding: 16px;
  }

  .role-icon {
    width: 40px;
    height: 40px;
    margin-right: 12px;
    font-size: 16px;
  }

  .role-content h3 {
    font-size: 15px;
  }

  .role-content p {
    font-size: 12px;
  }

  .quick-login-buttons {
    flex-direction: column;
  }
}
</style>

<style lang="scss" scoped>
:deep(.el-input-group__append, .el-input-group__prepend) {
  padding: 0;
}

// 美化表单元素
:deep(.el-form-item) {
  margin-bottom: 24px;
}

:deep(.el-input) {
  .el-input__wrapper {
    border-radius: 8px;
    padding: 4px 16px;

    &:hover {
      box-shadow: 0 0 0 1px #409eff inset;
    }

    &.is-focus {
      box-shadow: 0 0 0 1px #409eff inset;
    }
  }
}

:deep(.el-button) {
  border-radius: 8px;
  height: 32px;
  font-weight: 500;
}

:deep(.el-tag) {
  font-weight: 500;
}
</style>

<style lang="scss">
/* 全局样式，不带 scoped */
.register-header {
  .el-dialog__title {
    display: block;
    text-align: center;
  }
}

/* 如果要去掉默认的右侧关闭按钮间距，确保标题居中或对齐 */
.register-header.show-close {
  padding-right: 15px !important;
}

.register-body {
  padding-top: 14px;
}
</style>
