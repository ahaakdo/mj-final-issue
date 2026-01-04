<template>
  <div class="course-selection-container">
    <!-- 顶部横幅 -->
    <div class="banner-section">
      <div class="banner-content">
        <h1 class="banner-title">
          <i class="fas fa-clipboard-list" /> 在线选课系统
        </h1>
        <p class="banner-description">
          在线申请、审核、选课一站式服务，轻松管理你的课程安排
        </p>
      </div>
    </div>

    <!-- 选课进度状态 -->
    <div class="selection-progress">
      <div class="progress-steps">
        <div
          v-for="(step, index) in progressSteps"
          :key="step.id"
          class="progress-step"
          :class="{
            active: currentStep >= step.id,
            completed: currentStep > step.id
          }"
          @click="switchStep(step.id)"
        >
          <div class="step-icon">
            <i :class="step.icon" />
            <span class="step-number">{{ step.id }}</span>
          </div>
          <div class="step-info">
            <div class="step-title">{{ step.title }}</div>
            <div class="step-desc">{{ step.description }}</div>
          </div>
          <div v-if="index < progressSteps.length - 1" class="step-arrow">
            <i class="fas fa-chevron-right" />
          </div>
        </div>
      </div>
    </div>

    <!-- 步骤1：课程浏览与选择 -->
    <div v-show="currentStep === 1" class="step-content step-1">
      <div class="section-header">
        <h2 class="section-title">
          <i class="fas fa-search" />
          课程浏览与选择
        </h2>
        <div class="selection-stats">
          <span class="stat-item">
            <i class="fas fa-book" />
            可选课程：<strong>{{ availableCourses.length }}</strong
            >门
          </span>
          <span class="stat-item">
            <i class="fas fa-clock" />
            已选课程：<strong>{{ selectedCourses.length }}</strong
            >门
          </span>
          <span class="stat-item">
            <i class="fas fa-star" />
            可选学分：<strong>{{ maxCredits - selectedCredits }}</strong
            >分
          </span>
        </div>
      </div>

      <!-- 课程筛选 -->
      <div class="course-filter">
        <el-form :inline="true" :model="selectionFilter" class="filter-form">
          <el-form-item label="课程分类">
            <el-select
              v-model="selectionFilter.category"
              placeholder="全部分类"
              clearable
              @change="filterAvailableCourses"
            >
              <el-option label="扣球训练" value="spike" />
              <el-option label="接球训练" value="receive" />
              <el-option label="发球训练" value="serve" />
            </el-select>
          </el-form-item>

          <el-form-item label="课程状态">
            <el-select
              v-model="selectionFilter.status"
              placeholder="全部状态"
              clearable
              @change="filterAvailableCourses"
            >
              <el-option label="报名中" value="enrolling" />
              <el-option label="即将开始" value="pending" />
            </el-select>
          </el-form-item>

          <el-form-item label="上课时间">
            <el-select
              v-model="selectionFilter.timeSlot"
              placeholder="时间偏好"
              clearable
              @change="filterAvailableCourses"
            >
              <el-option label="上午" value="morning" />
              <el-option label="下午" value="afternoon" />
              <el-option label="晚上" value="evening" />
            </el-select>
          </el-form-item>

          <el-form-item label="难度等级">
            <el-select
              v-model="selectionFilter.difficulty"
              placeholder="全部难度"
              clearable
              @change="filterAvailableCourses"
            >
              <el-option label="初级" value="beginner" />
              <el-option label="中级" value="intermediate" />
              <el-option label="高级" value="advanced" />
            </el-select>
          </el-form-item>

          <el-form-item>
            <el-input
              v-model="selectionFilter.keyword"
              placeholder="搜索课程名称、教师"
              clearable
              @input="filterAvailableCourses"
            >
              <template #prefix>
                <i class="fas fa-search" />
              </template>
            </el-input>
          </el-form-item>
        </el-form>
      </div>

      <!-- 已选课程预览 -->
      <div v-if="selectedCourses.length > 0" class="selected-preview">
        <div class="preview-header">
          <h3><i class="fas fa-check-circle" /> 已选课程预览</h3>
          <el-button type="text" @click="clearSelection">
            <i class="fas fa-trash-alt" /> 清空选择
          </el-button>
        </div>
        <div class="selected-courses-list">
          <div
            v-for="course in selectedCourses"
            :key="course.id"
            class="selected-course-item"
          >
            <div class="course-info">
              <div class="course-name">{{ course.course_name }}</div>
              <div class="course-details">
                <span class="detail">
                  <i class="fas fa-chalkboard-teacher" />
                  {{ course.teacher_name }}
                </span>
                <span class="detail">
                  <i class="fas fa-clock" />
                  {{ course.schedule }}
                </span>
                <span class="detail">
                  <i class="fas fa-star" />
                  {{ course.credits }}学分
                </span>
              </div>
            </div>
            <div class="course-actions">
              <el-button
                type="danger"
                size="small"
                @click="removeFromSelection(course)"
              >
                <i class="fas fa-times" /> 移除
              </el-button>
            </div>
          </div>
        </div>
        <div class="selection-summary">
          <div class="summary-item">
            <span class="label">已选课程数：</span>
            <span class="value">{{ selectedCourses.length }}门</span>
          </div>
          <div class="summary-item">
            <span class="label">已选总学分：</span>
            <span class="value">{{ selectedCredits }}分</span>
          </div>
          <div class="summary-item">
            <span class="label">剩余可选学分：</span>
            <span class="value">{{ maxCredits - selectedCredits }}分</span>
          </div>
        </div>
      </div>

      <!-- 可选课程列表 -->
      <div class="available-courses-section">
        <div class="courses-list">
          <div
            v-for="course in filteredAvailableCourses"
            :key="course.id"
            class="course-selection-item"
            :class="{ selected: isCourseSelected(course.id) }"
          >
            <div class="selection-checkbox">
              <el-checkbox
                :model-value="isCourseSelected(course.id)"
                :disabled="!canSelectCourse(course)"
                @change="toggleCourseSelection(course, $event)"
              >
                <span class="checkbox-label">选择</span>
              </el-checkbox>
            </div>

            <div class="course-main-info" @click="viewCourseDetail(course)">
              <div class="course-header">
                <span class="course-code">{{ course.course_code }}</span>
                <el-tag
                  :type="getCourseTypeTag(course.course_type)"
                  size="small"
                >
                  {{ getCourseTypeText(course.course_type) }}
                </el-tag>
                <el-tag
                  :type="getDifficultyTag(course.difficulty)"
                  size="small"
                >
                  {{ getDifficultyText(course.difficulty) }}
                </el-tag>
              </div>

              <h3 class="course-title">{{ course.course_name }}</h3>

              <div class="course-teacher">
                <i class="fas fa-user-circle" />
                <span class="teacher-name">{{ course.teacher_name }}</span>
                <span class="teacher-title">{{ course.teacher_title }}</span>
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

              <div class="course-capacity">
                <span class="capacity-text">
                  {{ course.current_students }}/{{ course.capacity }}人
                </span>
                <el-progress
                  :percentage="getCapacityPercentage(course)"
                  :color="getCapacityColor(course)"
                  :show-text="false"
                  :stroke-width="8"
                />
              </div>
            </div>

            <div class="course-actions">
              <div class="course-credits">
                <i class="fas fa-star" />
                <span class="credits-value">{{ course.credits }}学分</span>
              </div>

              <div class="action-buttons">
                <el-button
                  type="primary"
                  size="small"
                  :disabled="!canSelectCourse(course)"
                  @click="
                    toggleCourseSelection(course, !isCourseSelected(course.id))
                  "
                >
                  <template v-if="isCourseSelected(course.id)">
                    <i class="fas fa-check" /> 已选
                  </template>
                  <template v-else> <i class="fas fa-plus" /> 选择 </template>
                </el-button>

                <el-button
                  type="default"
                  size="small"
                  @click="viewCourseDetail(course)"
                >
                  <i class="fas fa-info-circle" /> 详情
                </el-button>
              </div>

              <div v-if="!canSelectCourse(course)" class="selection-hint">
                <span class="hint-text">
                  <i class="fas fa-exclamation-circle" />
                  {{ getSelectionHint(course) }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div v-if="filteredAvailableCourses.length === 0" class="empty-state">
          <i class="fas fa-search" />
          <h3>未找到可用课程</h3>
          <p>请尝试调整筛选条件或稍后再试</p>
          <el-button type="primary" @click="resetSelectionFilter">
            重置筛选条件
          </el-button>
        </div>

        <div class="selection-controls">
          <el-button
            type="primary"
            :disabled="selectedCourses.length === 0"
            @click="goToNextStep"
          >
            <i class="fas fa-arrow-right" />
            下一步：填写申请信息
            <span class="selected-count"
              >({{ selectedCourses.length }}门课程)</span
            >
          </el-button>

          <el-button @click="resetSelection">
            <i class="fas fa-redo" />
            重置选择
          </el-button>
        </div>
      </div>
    </div>

    <!-- 步骤2：填写申请信息 -->
    <div v-show="currentStep === 2" class="step-content step-2">
      <div class="section-header">
        <h2 class="section-title">
          <i class="fas fa-edit" />
          填写申请信息
        </h2>
        <el-button type="text" @click="goToPrevStep">
          <i class="fas fa-arrow-left" /> 返回上一步
        </el-button>
      </div>

      <div class="application-form-container">
        <div class="selected-courses-review">
          <h3><i class="fas fa-clipboard-check" /> 申请课程清单</h3>
          <div class="courses-review-list">
            <div
              v-for="(course, index) in selectedCourses"
              :key="course.id"
              class="review-course-item"
            >
              <div class="review-index">{{ index + 1 }}</div>
              <div class="review-course-info">
                <div class="review-course-name">{{ course.course_name }}</div>
                <div class="review-course-details">
                  <span>{{ course.teacher_name }}</span>
                  <span>{{ course.schedule }}</span>
                  <span>{{ course.credits }}学分</span>
                </div>
              </div>
              <div class="review-course-status">
                <el-tag type="info" size="small"> 待申请 </el-tag>
              </div>
            </div>
          </div>
        </div>

        <div class="application-form">
          <el-form
            ref="applicationFormRef"
            :model="applicationForm"
            :rules="applicationRules"
            label-width="120px"
            class="application-form-content"
          >
            <el-form-item label="申请类型" prop="apply_type">
              <el-radio-group v-model="applicationForm.apply_type">
                <el-radio label="select">选课申请</el-radio>
                <el-radio label="adjust">课程调整</el-radio>
                <el-radio label="withdraw">退课申请</el-radio>
              </el-radio-group>
            </el-form-item>

            <el-form-item label="申请原因" prop="apply_reason">
              <el-input
                v-model="applicationForm.apply_reason"
                type="textarea"
                :rows="4"
                placeholder="请详细说明申请选课的原因，如：专业需求、兴趣培养、学分补充等"
                maxlength="500"
                show-word-limit
              />
            </el-form-item>

            <el-form-item label="申请优先级" prop="priority">
              <el-rate
                v-model="applicationForm.priority"
                :max="3"
                :texts="['一般', '重要', '非常重要']"
                show-text
              />
              <div class="priority-hint">
                <i class="fas fa-info-circle" />
                优先级会影响课程的审批顺序
              </div>
            </el-form-item>

            <el-form-item label="期望上课时间" prop="preferred_time">
              <el-checkbox-group v-model="applicationForm.preferred_time">
                <el-checkbox label="morning">上午</el-checkbox>
                <el-checkbox label="afternoon">下午</el-checkbox>
                <el-checkbox label="evening">晚上</el-checkbox>
              </el-checkbox-group>
            </el-form-item>

            <el-form-item label="特殊要求" prop="special_requirements">
              <el-input
                v-model="applicationForm.special_requirements"
                type="textarea"
                :rows="2"
                placeholder="如有特殊要求请说明，如：身体特殊情况、时间冲突等"
                maxlength="200"
                show-word-limit
              />
            </el-form-item>

            <el-form-item label="紧急联系人" prop="emergency_contact">
              <el-input
                v-model="applicationForm.emergency_contact"
                placeholder="请输入紧急联系人姓名"
              />
            </el-form-item>

            <el-form-item label="联系电话" prop="emergency_phone">
              <el-input
                v-model="applicationForm.emergency_phone"
                placeholder="请输入紧急联系电话"
              />
            </el-form-item>

            <el-form-item label="附件材料" prop="attachments">
              <el-upload
                class="upload-demo"
                action="#"
                :on-change="handleAttachmentChange"
                :on-remove="handleAttachmentRemove"
                :file-list="applicationForm.attachments"
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

            <el-form-item>
              <el-button
                type="primary"
                :loading="submittingApplication"
                @click="submitApplication"
              >
                <i class="fas fa-paper-plane" />
                提交申请
              </el-button>
              <el-button @click="saveAsDraft">
                <i class="fas fa-save" />
                保存草稿
              </el-button>
              <el-button @click="resetApplicationForm">
                <i class="fas fa-redo" />
                重置表单
              </el-button>
            </el-form-item>
          </el-form>
        </div>
      </div>
    </div>

    <!-- 步骤3：申请提交确认 -->
    <div v-show="currentStep === 3" class="step-content step-3">
      <div class="confirmation-container">
        <div class="confirmation-icon success">
          <i class="fas fa-check-circle" />
        </div>

        <h2 class="confirmation-title">申请提交成功！</h2>

        <div class="confirmation-details">
          <div class="detail-card">
            <div class="detail-header">
              <i class="fas fa-clipboard-check" />
              <span>申请信息</span>
            </div>
            <div class="detail-content">
              <div class="detail-item">
                <span class="label">申请编号：</span>
                <span class="value">{{ lastApplicationId }}</span>
              </div>
              <div class="detail-item">
                <span class="label">申请时间：</span>
                <span class="value">{{ formatDateTime(new Date()) }}</span>
              </div>
              <div class="detail-item">
                <span class="label">申请类型：</span>
                <span class="value">{{
                  getApplyTypeText(applicationForm.apply_type)
                }}</span>
              </div>
              <div class="detail-item">
                <span class="label">申请课程数：</span>
                <span class="value">{{ selectedCourses.length }}门</span>
              </div>
            </div>
          </div>

          <div class="detail-card">
            <div class="detail-header">
              <i class="fas fa-clock" />
              <span>处理流程</span>
            </div>
            <div class="detail-content">
              <div class="process-timeline">
                <div class="process-step active">
                  <div class="step-marker">
                    <i class="fas fa-paper-plane" />
                  </div>
                  <div class="step-info">
                    <div class="step-title">申请已提交</div>
                    <div class="step-time">
                      {{ formatDateTime(new Date()) }}
                    </div>
                  </div>
                </div>
                <div class="process-step">
                  <div class="step-marker">
                    <i class="fas fa-user-check" />
                  </div>
                  <div class="step-info">
                    <div class="step-title">教师审核</div>
                    <div class="step-time">预计1-3个工作日</div>
                  </div>
                </div>
                <div class="process-step">
                  <div class="step-marker">
                    <i class="fas fa-check-double" />
                  </div>
                  <div class="step-info">
                    <div class="step-title">系统确认</div>
                    <div class="step-time">预计1个工作日</div>
                  </div>
                </div>
                <div class="process-step">
                  <div class="step-marker">
                    <i class="fas fa-bell" />
                  </div>
                  <div class="step-info">
                    <div class="step-title">结果通知</div>
                    <div class="step-time">将通过系统消息通知</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="confirmation-actions">
          <el-button type="primary" @click="viewApplicationDetail">
            <i class="fas fa-eye" /> 查看申请详情
          </el-button>
          <el-button @click="goToApplicationList">
            <i class="fas fa-list" /> 查看所有申请
          </el-button>
          <el-button @click="startNewSelection">
            <i class="fas fa-plus" /> 继续选课
          </el-button>
        </div>

        <div class="confirmation-tips">
          <div class="tip-item">
            <i class="fas fa-envelope" />
            <span>申请进度将通过系统消息通知，请及时查收</span>
          </div>
          <div class="tip-item">
            <i class="fas fa-history" />
            <span>可在"我的申请"中查看申请状态和修改申请</span>
          </div>
          <div class="tip-item">
            <i class="fas fa-question-circle" />
            <span>如有疑问，请联系教务处或授课教师</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 步骤4：我的申请列表 -->
    <div v-show="currentStep === 4" class="step-content step-4">
      <div class="section-header">
        <h2 class="section-title">
          <i class="fas fa-history" />
          我的申请记录
        </h2>
        <el-button type="primary" @click="startNewSelection">
          <i class="fas fa-plus" /> 新建申请
        </el-button>
      </div>

      <!-- 申请状态统计 -->
      <div class="application-stats">
        <div class="stat-card" @click="filterApplicationsByStatus('pending')">
          <div class="stat-icon pending">
            <i class="fas fa-clock" />
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ getApplicationCount("pending") }}</div>
            <div class="stat-label">待审批</div>
          </div>
        </div>

        <div class="stat-card" @click="filterApplicationsByStatus('approved')">
          <div class="stat-icon approved">
            <i class="fas fa-check-circle" />
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ getApplicationCount("approved") }}</div>
            <div class="stat-label">已通过</div>
          </div>
        </div>

        <div class="stat-card" @click="filterApplicationsByStatus('rejected')">
          <div class="stat-icon rejected">
            <i class="fas fa-times-circle" />
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ getApplicationCount("rejected") }}</div>
            <div class="stat-label">已驳回</div>
          </div>
        </div>

        <div class="stat-card" @click="filterApplicationsByStatus('all')">
          <div class="stat-icon total">
            <i class="fas fa-list-alt" />
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ myApplications.length }}</div>
            <div class="stat-label">总申请数</div>
          </div>
        </div>
      </div>

      <!-- 申请列表 -->
      <div class="applications-section">
        <div class="applications-filter">
          <el-form
            :inline="true"
            :model="applicationFilter"
            class="filter-form"
          >
            <el-form-item label="申请状态">
              <el-select
                v-model="applicationFilter.status"
                placeholder="全部状态"
                clearable
                @change="filterMyApplications"
              >
                <el-option label="待审批" value="pending" />
                <el-option label="已通过" value="approved" />
                <el-option label="已驳回" value="rejected" />
              </el-select>
            </el-form-item>

            <el-form-item label="申请类型">
              <el-select
                v-model="applicationFilter.apply_type"
                placeholder="全部类型"
                clearable
                @change="filterMyApplications"
              >
                <el-option label="选课申请" value="select" />
                <el-option label="退课申请" value="withdraw" />
                <el-option label="课程调整" value="adjust" />
              </el-select>
            </el-form-item>

            <el-form-item label="申请时间">
              <el-date-picker
                v-model="applicationFilter.dateRange"
                type="daterange"
                range-separator="至"
                start-placeholder="开始日期"
                end-placeholder="结束日期"
                @change="filterMyApplications"
              />
            </el-form-item>

            <el-form-item>
              <el-button type="primary" @click="filterMyApplications">
                <i class="fas fa-search" /> 搜索
              </el-button>
              <el-button @click="resetApplicationFilter">
                <i class="fas fa-redo" /> 重置
              </el-button>
            </el-form-item>
          </el-form>
        </div>

        <div class="applications-list">
          <div
            v-for="application in filteredApplications"
            :key="application.id"
            class="application-item"
            :class="`status-${application.status}`"
          >
            <div class="application-header">
              <div class="application-id">
                <span class="id-label">申请编号：</span>
                <span class="id-value">{{ application.id }}</span>
              </div>
              <div class="application-status">
                <el-tag
                  :type="getStatusTagType(application.status)"
                  size="small"
                >
                  {{ getStatusText(application.status) }}
                </el-tag>
              </div>
            </div>

            <div class="application-content">
              <div class="application-info">
                <div class="info-item">
                  <i class="fas fa-book" />
                  <span class="info-label">申请课程：</span>
                  <span class="info-value">{{ application.course_name }}</span>
                </div>
                <div class="info-item">
                  <i class="fas fa-user-check" />
                  <span class="info-label">授课教师：</span>
                  <span class="info-value">{{ application.teacher_name }}</span>
                </div>
                <div class="info-item">
                  <i class="fas fa-calendar-alt" />
                  <span class="info-label">申请时间：</span>
                  <span class="info-value">{{
                    formatDateTime(application.apply_time)
                  }}</span>
                </div>
                <div class="info-item">
                  <i class="fas fa-clipboard" />
                  <span class="info-label">申请原因：</span>
                  <span class="info-value reason-text">{{
                    application.apply_reason
                  }}</span>
                </div>
              </div>

              <div class="application-actions">
                <el-button
                  type="primary"
                  size="small"
                  @click="viewApplicationDetail(application)"
                >
                  <i class="fas fa-eye" /> 查看详情
                </el-button>

                <el-button
                  v-if="application.status === 'pending'"
                  type="warning"
                  size="small"
                  @click="editApplication(application)"
                >
                  <i class="fas fa-edit" /> 修改
                </el-button>

                <el-button
                  v-if="application.status === 'pending'"
                  type="danger"
                  size="small"
                  @click="cancelApplication(application)"
                >
                  <i class="fas fa-trash-alt" /> 撤销
                </el-button>

                <el-button
                  v-if="application.status === 'approved'"
                  type="success"
                  size="small"
                  @click="downloadApproval(application)"
                >
                  <i class="fas fa-download" /> 下载凭证
                </el-button>
              </div>
            </div>

            <div
              v-if="application.status !== 'pending'"
              class="application-footer"
            >
              <div class="review-info">
                <span class="reviewer">
                  <i class="fas fa-user-tie" />
                  审批人：{{ application.reviewer_name || "系统自动审批" }}
                </span>
                <span class="review-time">
                  <i class="fas fa-clock" />
                  审批时间：{{ formatDateTime(application.review_time) }}
                </span>
              </div>
              <div v-if="application.review_notes" class="review-notes">
                <i class="fas fa-comment" />
                审批意见：{{ application.review_notes }}
              </div>
              <div
                v-if="
                  application.status === 'rejected' && application.reject_reason
                "
                class="reject-reason"
              >
                <i class="fas fa-exclamation-triangle" />
                驳回原因：{{ application.reject_reason }}
              </div>
            </div>
          </div>
        </div>

        <div v-if="filteredApplications.length === 0" class="empty-state">
          <i class="fas fa-clipboard-list" />
          <h3>暂无申请记录</h3>
          <p>立即开始你的第一次选课申请吧！</p>
          <el-button type="primary" @click="startNewSelection">
            <i class="fas fa-plus" /> 新建申请
          </el-button>
        </div>

        <!-- 分页 -->
        <div v-if="filteredApplications.length > 0" class="pagination-section">
          <el-pagination
            v-model:current-page="applicationsPagination.currentPage"
            v-model:page-size="applicationsPagination.pageSize"
            :total="filteredApplications.length"
            :page-sizes="[5, 10, 20, 50]"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="handleApplicationsPageSizeChange"
            @current-change="handleApplicationsPageChange"
          />
        </div>
      </div>
    </div>

    <!-- 课程详情弹窗 -->
    <el-dialog
      v-model="courseDetailVisible"
      :title="selectedCourse?.course_name"
      width="600px"
      @close="closeCourseDetail"
    >
      <div v-if="selectedCourse" class="course-detail-modal">
        <div class="course-basic-info">
          <div class="info-row">
            <span class="info-label">课程编号：</span>
            <span class="info-value">{{ selectedCourse.course_code }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">课程类型：</span>
            <el-tag
              :type="getCourseTypeTag(selectedCourse.course_type)"
              size="small"
            >
              {{ getCourseTypeText(selectedCourse.course_type) }}
            </el-tag>
          </div>
          <div class="info-row">
            <span class="info-label">学分：</span>
            <span class="info-value">{{ selectedCourse.credits }}学分</span>
          </div>
          <div class="info-row">
            <span class="info-label">难度等级：</span>
            <el-tag
              :type="getDifficultyTag(selectedCourse.difficulty)"
              size="small"
            >
              {{ getDifficultyText(selectedCourse.difficulty) }}
            </el-tag>
          </div>
        </div>

        <div class="course-teacher-info">
          <h4><i class="fas fa-chalkboard-teacher" /> 授课教师</h4>
          <div class="teacher-details">
            <div class="teacher-name">{{ selectedCourse.teacher_name }}</div>
            <div class="teacher-title">{{ selectedCourse.teacher_title }}</div>
            <div class="teacher-experience">
              教龄：{{ selectedCourse.teacher_experience }}年
            </div>
          </div>
        </div>

        <div class="course-schedule-info">
          <h4><i class="fas fa-calendar-alt" /> 课程安排</h4>
          <div class="schedule-details">
            <div class="schedule-item">
              <i class="fas fa-clock" />
              <span>{{ selectedCourse.schedule }}</span>
            </div>
            <div class="schedule-item">
              <i class="fas fa-map-marker-alt" />
              <span>{{ selectedCourse.location }}</span>
            </div>
            <div class="schedule-item">
              <i class="fas fa-calendar" />
              <span
                >{{ formatDate(selectedCourse.start_date) }} -
                {{ formatDate(selectedCourse.end_date) }}</span
              >
            </div>
          </div>
        </div>

        <div class="course-description">
          <h4><i class="fas fa-info-circle" /> 课程描述</h4>
          <p>{{ selectedCourse.description }}</p>
        </div>

        <div class="course-capacity-info">
          <h4><i class="fas fa-users" /> 课程容量</h4>
          <div class="capacity-details">
            <div class="capacity-progress">
              <span class="capacity-text">
                已选 {{ selectedCourse.current_students }} 人 / 容量
                {{ selectedCourse.capacity }} 人
              </span>
              <el-progress
                :percentage="getCapacityPercentage(selectedCourse)"
                :color="getCapacityColor(selectedCourse)"
                :stroke-width="10"
              />
            </div>
            <div
              v-if="selectedCourse.current_students >= selectedCourse.capacity"
              class="capacity-hint"
            >
              <i class="fas fa-exclamation-triangle" />
              该课程已满员，请选择其他课程或等待名额释放
            </div>
          </div>
        </div>
      </div>

      <template #footer>
        <el-button @click="closeCourseDetail">关闭</el-button>
        <el-button
          type="primary"
          :disabled="!canSelectCourse(selectedCourse!)"
          @click="selectCourseFromDetail"
        >
          {{ isCourseSelected(selectedCourse?.id) ? "取消选择" : "选择课程" }}
        </el-button>
      </template>
    </el-dialog>

    <!-- 申请详情弹窗 -->
    <el-dialog
      v-model="applicationDetailVisible"
      :title="`申请详情 - ${selectedApplication?.id}`"
      width="700px"
    >
      <div v-if="selectedApplication" class="application-detail-modal">
        <!-- 弹窗内容省略，可扩展显示更详细的信息 -->
      </div>
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

// ---------------------- 类型定义 ----------------------
interface Course {
  id: number;
  course_code: string;
  course_name: string;
  course_type: "spike" | "receive" | "serve";
  description: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  status: "pending" | "enrolling" | "ongoing" | "ended";
  teacher_id: number;
  teacher_name: string;
  teacher_title: string;
  teacher_experience: number;
  credits: number;
  capacity: number;
  current_students: number;
  location: string;
  schedule: string;
  start_date: string;
  end_date: string;
  is_featured: boolean;
}

interface Application {
  id: number;
  student_id: number;
  student_number: string;
  student_name: string;
  course_id: number;
  course_name: string;
  course_type: string;
  apply_type: "select" | "withdraw" | "adjust";
  apply_time: string;
  apply_reason: string;
  status: "pending" | "approved" | "rejected";
  reviewer_id?: number;
  reviewer_name?: string;
  review_time?: string;
  review_notes?: string;
  reject_reason?: string;
  attachments?: UploadFile[];
}

interface ProgressStep {
  id: number;
  title: string;
  description: string;
  icon: string;
}

// ---------------------- 状态管理 ----------------------
const currentStep = ref(1); // 当前步骤
const submittingApplication = ref(false);
const courseDetailVisible = ref(false);
const applicationDetailVisible = ref(false);
const selectedCourse = ref<Course | null>(null);
const selectedApplication = ref<Application | null>(null);
const lastApplicationId = ref("APP20240115001");

// ---------------------- 选课限制 ----------------------
const maxCredits = 10; // 最大可选学分
const maxCourses = 5; // 最大可选课程数

// ---------------------- 进度步骤 ----------------------
const progressSteps = ref<ProgressStep[]>([
  {
    id: 1,
    title: "课程选择",
    description: "浏览并选择感兴趣的课程",
    icon: "fas fa-search"
  },
  {
    id: 2,
    title: "填写申请",
    description: "填写申请信息和原因",
    icon: "fas fa-edit"
  },
  {
    id: 3,
    title: "提交确认",
    description: "确认并提交申请",
    icon: "fas fa-check-circle"
  },
  {
    id: 4,
    title: "我的申请",
    description: "查看申请进度和历史",
    icon: "fas fa-history"
  }
]);

// ---------------------- 模拟数据 ----------------------
// 可选课程数据
const availableCourses = ref<Course[]>([
  {
    id: 1,
    course_code: "SV101",
    course_name: "基础发球入门",
    course_type: "serve",
    description: "学习发球的基本姿势、手型和用力技巧",
    difficulty: "beginner",
    status: "enrolling",
    teacher_id: 1,
    teacher_name: "李教练",
    teacher_title: "国家级教练",
    teacher_experience: 15,
    credits: 1,
    capacity: 20,
    current_students: 12,
    location: "排球馆A区",
    schedule: "每周一、三 14:00-16:00",
    start_date: "2024-02-15",
    end_date: "2024-06-15",
    is_featured: true
  },
  {
    id: 2,
    course_code: "RC201",
    course_name: "一传稳定性训练",
    course_type: "receive",
    description: "提高一传成功率，培养稳定的接发球能力",
    difficulty: "intermediate",
    status: "enrolling",
    teacher_id: 2,
    teacher_name: "王教练",
    teacher_title: "高级教练",
    teacher_experience: 10,
    credits: 2,
    capacity: 15,
    current_students: 10,
    location: "排球馆B区",
    schedule: "每周二、四 16:00-18:00",
    start_date: "2024-03-01",
    end_date: "2024-07-01",
    is_featured: false
  },
  {
    id: 3,
    course_code: "SP301",
    course_name: "战术扣球与线路变化",
    course_type: "spike",
    description: "高级扣球技巧训练，学习战术配合和线路变化",
    difficulty: "advanced",
    status: "enrolling",
    teacher_id: 3,
    teacher_name: "张教练",
    teacher_title: "特级教练",
    teacher_experience: 20,
    credits: 3,
    capacity: 10,
    current_students: 8,
    location: "专业训练馆",
    schedule: "每周五 14:00-16:00",
    start_date: "2024-01-30",
    end_date: "2024-05-30",
    is_featured: true
  },
  {
    id: 4,
    course_code: "SV201",
    course_name: "强力跳发球训练",
    course_type: "serve",
    description: "掌握跳发球的起跳时机、击球点和力量控制",
    difficulty: "intermediate",
    status: "enrolling",
    teacher_id: 2,
    teacher_name: "王教练",
    teacher_title: "高级教练",
    teacher_experience: 10,
    credits: 2,
    capacity: 15,
    current_students: 15,
    location: "排球馆C区",
    schedule: "每周二、四 16:00-18:00",
    start_date: "2024-03-10",
    end_date: "2024-07-10",
    is_featured: false
  },
  {
    id: 5,
    course_code: "RC101",
    course_name: "基础接球入门",
    course_type: "receive",
    description: "学习接球的基本姿势、手型和移动步法",
    difficulty: "beginner",
    status: "enrolling",
    teacher_id: 4,
    teacher_name: "刘教练",
    teacher_title: "中级教练",
    teacher_experience: 8,
    credits: 1,
    capacity: 25,
    current_students: 18,
    location: "排球馆D区",
    schedule: "每周一、四 09:00-11:00",
    start_date: "2024-02-20",
    end_date: "2024-06-20",
    is_featured: true
  },
  {
    id: 6,
    course_code: "SP101",
    course_name: "基础扣球入门",
    course_type: "spike",
    description: "学习扣球的基本姿势、起跳时机和击球点",
    difficulty: "beginner",
    status: "pending",
    teacher_id: 2,
    teacher_name: "王教练",
    teacher_title: "高级教练",
    teacher_experience: 10,
    credits: 1,
    capacity: 20,
    current_students: 0,
    location: "排球馆E区",
    schedule: "每周二、四 10:00-12:00",
    start_date: "2024-02-25",
    end_date: "2024-06-25",
    is_featured: false
  }
]);

// 已选课程
const selectedCourses = ref<Course[]>([]);

// 我的申请记录
const myApplications = ref<Application[]>([
  {
    id: 1,
    student_id: 1001,
    student_number: "20230001",
    student_name: "张三",
    course_id: 1,
    course_name: "基础发球入门",
    course_type: "serve",
    apply_type: "select",
    apply_time: "2024-01-15 10:30:00",
    apply_reason: "希望提升发球技术，为比赛做准备",
    status: "approved",
    reviewer_id: 100,
    reviewer_name: "李老师",
    review_time: "2024-01-16 14:20:00",
    review_notes: "申请合理，符合课程要求"
  },
  {
    id: 2,
    student_id: 1001,
    student_number: "20230001",
    student_name: "张三",
    course_id: 2,
    course_name: "一传稳定性训练",
    course_type: "receive",
    apply_type: "select",
    apply_time: "2024-01-16 09:15:00",
    apply_reason: "需要提高防守稳定性，完善技术体系",
    status: "pending"
  },
  {
    id: 3,
    student_id: 1001,
    student_number: "20230001",
    student_name: "张三",
    course_id: 4,
    course_name: "强力跳发球训练",
    course_type: "serve",
    apply_type: "withdraw",
    apply_time: "2024-01-14 16:45:00",
    apply_reason: "时间冲突，无法按时上课",
    status: "rejected",
    reviewer_id: 100,
    reviewer_name: "李老师",
    review_time: "2024-01-15 11:10:00",
    reject_reason: "退课时间已过截止日期"
  }
]);

// ---------------------- 筛选条件 ----------------------
const selectionFilter = reactive({
  category: "" as "" | "spike" | "receive" | "serve",
  status: "" as "" | "enrolling" | "pending",
  timeSlot: "" as "" | "morning" | "afternoon" | "evening",
  difficulty: "" as "" | "beginner" | "intermediate" | "advanced",
  keyword: ""
});

const applicationFilter = reactive({
  status: "" as "" | "pending" | "approved" | "rejected",
  apply_type: "" as "" | "select" | "withdraw" | "adjust",
  dateRange: [] as string[]
});

// ---------------------- 表单 ----------------------
const applicationFormRef = ref<FormInstance>();
const applicationForm = reactive({
  apply_type: "select" as "select" | "withdraw" | "adjust",
  apply_reason: "",
  priority: 1,
  preferred_time: [] as string[],
  special_requirements: "",
  emergency_contact: "",
  emergency_phone: "",
  attachments: [] as UploadFile[]
});

const applicationRules: FormRules = {
  apply_reason: [
    { required: true, message: "请填写申请原因", trigger: "blur" },
    { min: 10, message: "申请原因至少10个字符", trigger: "blur" },
    { max: 500, message: "申请原因最多500个字符", trigger: "blur" }
  ],
  priority: [
    { required: true, message: "请选择申请优先级", trigger: "change" }
  ],
  emergency_contact: [
    { required: true, message: "请填写紧急联系人", trigger: "blur" }
  ],
  emergency_phone: [
    { required: true, message: "请填写紧急联系电话", trigger: "blur" },
    {
      pattern: /^1[3-9]\d{9}$/,
      message: "请输入正确的手机号码",
      trigger: "blur"
    }
  ]
};

// ---------------------- 分页 ----------------------
const applicationsPagination = reactive({
  currentPage: 1,
  pageSize: 10,
  total: 0
});

// ---------------------- 计算属性 ----------------------
// 已选总学分
const selectedCredits = computed(() => {
  return selectedCourses.value.reduce((sum, course) => sum + course.credits, 0);
});

// 过滤后的可选课程
const filteredAvailableCourses = computed(() => {
  let filtered = availableCourses.value.filter(
    course => course.status === "enrolling" || course.status === "pending"
  );

  // 按分类筛选
  if (selectionFilter.category) {
    filtered = filtered.filter(
      course => course.course_type === selectionFilter.category
    );
  }

  // 按状态筛选
  if (selectionFilter.status) {
    filtered = filtered.filter(
      course => course.status === selectionFilter.status
    );
  }

  // 按时间偏好筛选
  if (selectionFilter.timeSlot) {
    filtered = filtered.filter(course => {
      const schedule = course.schedule.toLowerCase();
      if (selectionFilter.timeSlot === "morning") {
        return (
          schedule.includes("上午") ||
          schedule.includes("9") ||
          schedule.includes("10") ||
          schedule.includes("11")
        );
      } else if (selectionFilter.timeSlot === "afternoon") {
        return (
          schedule.includes("下午") ||
          schedule.includes("14") ||
          schedule.includes("15") ||
          schedule.includes("16")
        );
      } else if (selectionFilter.timeSlot === "evening") {
        return (
          schedule.includes("晚上") ||
          schedule.includes("19") ||
          schedule.includes("20") ||
          schedule.includes("21")
        );
      }
      return true;
    });
  }

  // 按难度筛选
  if (selectionFilter.difficulty) {
    filtered = filtered.filter(
      course => course.difficulty === selectionFilter.difficulty
    );
  }

  // 按关键词筛选
  if (selectionFilter.keyword) {
    const keyword = selectionFilter.keyword.toLowerCase();
    filtered = filtered.filter(
      course =>
        course.course_name.toLowerCase().includes(keyword) ||
        course.description.toLowerCase().includes(keyword) ||
        course.teacher_name.toLowerCase().includes(keyword) ||
        course.course_code.toLowerCase().includes(keyword)
    );
  }

  return filtered;
});

// 过滤后的申请记录
const filteredApplications = computed(() => {
  let filtered = [...myApplications.value];

  // 按状态筛选
  if (applicationFilter.status) {
    if (applicationFilter.status === "all") {
      // 显示全部
    } else {
      filtered = filtered.filter(
        app => app.status === applicationFilter.status
      );
    }
  }

  // 按申请类型筛选
  if (applicationFilter.apply_type) {
    filtered = filtered.filter(
      app => app.apply_type === applicationFilter.apply_type
    );
  }

  // 按日期筛选
  if (applicationFilter.dateRange && applicationFilter.dateRange.length === 2) {
    filtered = filtered.filter(app => {
      const applyDate = new Date(app.apply_time);
      const startDate = new Date(applicationFilter.dateRange[0]);
      const endDate = new Date(applicationFilter.dateRange[1]);
      return applyDate >= startDate && applyDate <= endDate;
    });
  }

  // 分页
  const start =
    (applicationsPagination.currentPage - 1) * applicationsPagination.pageSize;
  const end = start + applicationsPagination.pageSize;
  return filtered.slice(start, end);
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

const getStatusText = (status: string) => {
  const map: Record<string, string> = {
    pending: "待审批",
    approved: "已通过",
    rejected: "已驳回"
  };
  return map[status] || status;
};

const getStatusTagType = (status: string) => {
  const map: Record<string, string> = {
    pending: "warning",
    approved: "success",
    rejected: "danger"
  };
  return map[status] || "info";
};

const getApplyTypeText = (type: string) => {
  const map: Record<string, string> = {
    select: "选课申请",
    withdraw: "退课申请",
    adjust: "课程调整"
  };
  return map[type] || type;
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return `${date.getMonth() + 1}月${date.getDate()}日`;
};

const formatDateTime = (date: Date) => {
  return date
    .toLocaleString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false
    })
    .replace(/\//g, "-");
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

const isCourseSelected = (courseId?: number) => {
  if (!courseId) return false;
  return selectedCourses.value.some(course => course.id === courseId);
};

const canSelectCourse = (course: Course) => {
  // 检查课程状态
  if (course.status !== "enrolling" && course.status !== "pending") {
    return false;
  }

  // 检查是否已选满
  if (course.current_students >= course.capacity) {
    return false;
  }

  // 检查是否已达到最大课程数
  if (selectedCourses.value.length >= maxCourses) {
    return false;
  }

  // 检查是否已达到最大学分
  if (selectedCredits.value + course.credits > maxCredits) {
    return false;
  }

  // 检查是否已选择该课程
  if (isCourseSelected(course.id)) {
    return false;
  }

  // 检查时间冲突
  const hasTimeConflict = selectedCourses.value.some(selectedCourse => {
    // 这里可以添加时间冲突检查逻辑
    // 例如：检查上课时间是否重叠
    return false;
  });

  return !hasTimeConflict;
};

const getSelectionHint = (course: Course) => {
  if (course.status !== "enrolling" && course.status !== "pending") {
    return "课程不可选";
  }

  if (course.current_students >= course.capacity) {
    return "课程已满员";
  }

  if (selectedCourses.value.length >= maxCourses) {
    return "已达到最大可选课程数";
  }

  if (selectedCredits.value + course.credits > maxCredits) {
    return "学分已超限";
  }

  if (isCourseSelected(course.id)) {
    return "已选择该课程";
  }

  return "可选";
};

const getApplicationCount = (status: string) => {
  if (status === "all") {
    return myApplications.value.length;
  }
  return myApplications.value.filter(app => app.status === status).length;
};

// ---------------------- 事件处理函数 ----------------------
// 步骤切换
const switchStep = (stepId: number) => {
  if (stepId === 2 && selectedCourses.value.length === 0) {
    ElMessage.warning("请先选择至少一门课程");
    return;
  }
  currentStep.value = stepId;
};

const goToNextStep = () => {
  if (currentStep.value < 4) {
    currentStep.value++;
  }
};

const goToPrevStep = () => {
  if (currentStep.value > 1) {
    currentStep.value--;
  }
};

// 课程选择相关
const toggleCourseSelection = (course: Course, selected: boolean) => {
  if (selected) {
    if (!canSelectCourse(course)) {
      ElMessage.warning(getSelectionHint(course));
      return;
    }
    selectedCourses.value.push(course);
    ElMessage.success(`已选择课程：${course.course_name}`);
  } else {
    selectedCourses.value = selectedCourses.value.filter(
      c => c.id !== course.id
    );
    ElMessage.info(`已取消选择课程：${course.course_name}`);
  }
};

const removeFromSelection = (course: Course) => {
  selectedCourses.value = selectedCourses.value.filter(c => c.id !== course.id);
  ElMessage.info(`已移除课程：${course.course_name}`);
};

const clearSelection = () => {
  if (selectedCourses.value.length === 0) return;

  ElMessageBox.confirm("确定要清空所有已选课程吗？", "确认清空", {
    confirmButtonText: "确定清空",
    cancelButtonText: "取消",
    type: "warning"
  }).then(() => {
    selectedCourses.value = [];
    ElMessage.success("已清空所有已选课程");
  });
};

const resetSelection = () => {
  selectedCourses.value = [];
  resetSelectionFilter();
};

const filterAvailableCourses = () => {
  // 筛选逻辑已在计算属性中实现
  ElMessage.success("筛选条件已应用");
};

const resetSelectionFilter = () => {
  Object.assign(selectionFilter, {
    category: "",
    status: "",
    timeSlot: "",
    difficulty: "",
    keyword: ""
  });
  ElMessage.success("筛选条件已重置");
};

// 课程详情
const viewCourseDetail = (course: Course) => {
  selectedCourse.value = course;
  courseDetailVisible.value = true;
};

const closeCourseDetail = () => {
  courseDetailVisible.value = false;
  selectedCourse.value = null;
};

const selectCourseFromDetail = () => {
  if (!selectedCourse.value) return;

  const isSelected = isCourseSelected(selectedCourse.value.id);
  toggleCourseSelection(selectedCourse.value, !isSelected);

  if (!isSelected) {
    closeCourseDetail();
  }
};

// 申请表单相关
const handleAttachmentChange = (file: UploadFile, fileList: UploadFiles) => {
  applicationForm.attachments = fileList;
};

const handleAttachmentRemove = (file: UploadFile, fileList: UploadFiles) => {
  applicationForm.attachments = fileList;
};

const submitApplication = async () => {
  if (!applicationFormRef.value) return;

  try {
    await applicationFormRef.value.validate();

    submittingApplication.value = true;

    // 模拟提交过程
    await new Promise(resolve => setTimeout(resolve, 1500));

    // 生成新的申请记录
    const newApplication: Application = {
      id: myApplications.value.length + 1,
      student_id: 1001,
      student_number: "20230001",
      student_name: "张三",
      course_id: selectedCourses.value[0]?.id || 0,
      course_name: selectedCourses.value.map(c => c.course_name).join(", "),
      course_type: selectedCourses.value[0]?.course_type || "serve",
      apply_type: applicationForm.apply_type,
      apply_time: formatDateTime(new Date()),
      apply_reason: applicationForm.apply_reason,
      status: "pending",
      attachments: [...applicationForm.attachments]
    };

    myApplications.value.unshift(newApplication);

    // 更新最后申请ID
    lastApplicationId.value = `APP${new Date().getFullYear()}${(new Date().getMonth() + 1).toString().padStart(2, "0")}${new Date().getDate().toString().padStart(2, "0")}${(myApplications.value.length + 1000).toString().slice(1)}`;

    ElMessage.success("申请提交成功！");

    // 重置表单并跳转到确认页面
    resetApplicationForm();
    currentStep.value = 3;
  } catch (error) {
    console.error("表单验证失败:", error);
    ElMessage.warning("请完善申请信息");
  } finally {
    submittingApplication.value = false;
  }
};

const saveAsDraft = () => {
  ElMessage.info('草稿已保存，可在"我的申请"中查看');
  // 这里可以添加保存草稿的逻辑
};

const resetApplicationForm = () => {
  if (applicationFormRef.value) {
    applicationFormRef.value.resetFields();
  }
  applicationForm.attachments = [];
  applicationForm.priority = 1;
  applicationForm.preferred_time = [];
};

// 申请管理相关
const filterMyApplications = () => {
  applicationsPagination.currentPage = 1;
};

const resetApplicationFilter = () => {
  Object.assign(applicationFilter, {
    status: "",
    apply_type: "",
    dateRange: []
  });
  filterMyApplications();
  ElMessage.success("筛选条件已重置");
};

const viewApplicationDetail = (application: Application) => {
  selectedApplication.value = application;
  applicationDetailVisible.value = true;
};

const editApplication = (application: Application) => {
  ElMessage.info("修改申请功能开发中...");
  // 这里可以跳转到编辑页面或打开编辑弹窗
};

const cancelApplication = async (application: Application) => {
  try {
    await ElMessageBox.confirm(
      "确定要撤销此申请吗？撤销后不可恢复。",
      "确认撤销",
      {
        confirmButtonText: "确定撤销",
        cancelButtonText: "取消",
        type: "warning"
      }
    );

    // 更新申请状态为已撤销
    application.status = "rejected";
    application.reject_reason = "用户主动撤销";
    application.review_time = formatDateTime(new Date());

    ElMessage.success("申请已成功撤销");
  } catch {
    // 用户取消
  }
};

const downloadApproval = (application: Application) => {
  ElMessage.info("下载凭证功能开发中...");
  // 这里可以生成并下载PDF凭证
};

const filterApplicationsByStatus = (status: string) => {
  applicationFilter.status = status;
  filterMyApplications();
};

const startNewSelection = () => {
  currentStep.value = 1;
  selectedCourses.value = [];
  resetApplicationForm();
  resetSelectionFilter();
};

const goToApplicationList = () => {
  currentStep.value = 4;
};

const handleApplicationsPageSizeChange = (size: number) => {
  applicationsPagination.pageSize = size;
  applicationsPagination.currentPage = 1;
};

const handleApplicationsPageChange = (page: number) => {
  applicationsPagination.currentPage = page;
};

// ---------------------- 生命周期 ----------------------
onMounted(() => {
  console.log("在线选课系统加载完成");
});
</script>

<style scoped lang="scss">
.course-selection-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 20px 40px;
}

/* 顶部横幅 */
.banner-section {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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

/* 选课进度 */
.selection-progress {
  background: white;
  border-radius: 16px;
  padding: 30px;
  margin-bottom: 30px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.progress-steps {
  display: flex;
  justify-content: space-between;
  position: relative;

  &::before {
    content: "";
    position: absolute;
    top: 30px;
    left: 40px;
    right: 40px;
    height: 3px;
    background: #e9ecef;
    z-index: 1;
  }
}

.progress-step {
  display: flex;
  align-items: center;
  gap: 15px;
  position: relative;
  z-index: 2;
  cursor: pointer;
  padding: 10px;
  border-radius: 12px;
  transition: all 0.3s ease;
  flex: 1;

  &:hover {
    background: #f8f9fa;
  }

  &.active {
    .step-icon {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      transform: scale(1.1);
    }

    .step-title {
      color: #667eea;
      font-weight: 600;
    }
  }

  &.completed {
    .step-icon {
      background: #2ecc71;
      color: white;

      .step-number {
        display: none;
      }

      &::after {
        content: "✓";
        font-size: 14px;
      }
    }
  }
}

.step-icon {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: #e9ecef;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  color: #6c757d;
  position: relative;
  transition: all 0.3s ease;
}

.step-number {
  font-size: 18px;
  font-weight: bold;
}

.step-info {
  flex: 1;
}

.step-title {
  font-size: 16px;
  font-weight: 500;
  color: #2c3e50;
  margin-bottom: 5px;
}

.step-desc {
  font-size: 12px;
  color: #95a5a6;
}

.step-arrow {
  color: #dee2e6;
  font-size: 14px;
  margin-left: auto;
}

/* 步骤内容通用样式 */
.step-content {
  background: white;
  border-radius: 16px;
  padding: 30px;
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
    color: #667eea;
  }
}

.selection-stats {
  display: flex;
  gap: 30px;

  .stat-item {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    color: #7f8c8d;

    i {
      color: #667eea;
    }

    strong {
      color: #2c3e50;
      font-size: 16px;
    }
  }
}

/* 步骤1：课程筛选 */
.course-filter {
  margin-bottom: 24px;

  .filter-form {
    display: flex;
    flex-wrap: wrap;
    gap: 15px;
    align-items: center;

    :deep(.el-form-item) {
      margin-bottom: 0;
    }
  }
}

/* 已选课程预览 */
.selected-preview {
  background: #f8f9fa;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 24px;
  border: 1px solid #e9ecef;
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;

  h3 {
    font-size: 16px;
    font-weight: 600;
    color: #2c3e50;
    display: flex;
    align-items: center;
    gap: 8px;

    i {
      color: #2ecc71;
    }
  }
}

.selected-courses-list {
  margin-bottom: 15px;
}

.selected-course-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 15px;
  background: white;
  border-radius: 8px;
  margin-bottom: 10px;
  border: 1px solid #e9ecef;
  transition: all 0.3s ease;

  &:hover {
    border-color: #667eea;
    box-shadow: 0 2px 8px rgba(102, 126, 234, 0.1);
  }
}

.course-info {
  flex: 1;
}

.course-name {
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 5px;
}

.course-details {
  display: flex;
  gap: 20px;
  font-size: 12px;
  color: #7f8c8d;

  .detail {
    display: flex;
    align-items: center;
    gap: 4px;

    i {
      font-size: 10px;
    }
  }
}

.selection-summary {
  display: flex;
  justify-content: space-around;
  padding-top: 15px;
  border-top: 1px solid #e9ecef;

  .summary-item {
    text-align: center;

    .label {
      display: block;
      font-size: 12px;
      color: #7f8c8d;
      margin-bottom: 4px;
    }

    .value {
      display: block;
      font-size: 18px;
      font-weight: 700;
      color: #667eea;
    }
  }
}

/* 可选课程列表 */
.available-courses-section {
  .courses-list {
    margin-bottom: 24px;
  }
}

.course-selection-item {
  display: flex;
  gap: 20px;
  padding: 20px;
  border: 2px solid #e9ecef;
  border-radius: 12px;
  margin-bottom: 15px;
  transition: all 0.3s ease;
  background: white;

  &:hover {
    border-color: #667eea;
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.1);
  }

  &.selected {
    border-color: #2ecc71;
    background: linear-gradient(
      135deg,
      rgba(46, 204, 113, 0.05) 0%,
      rgba(46, 204, 113, 0.02) 100%
    );
  }
}

.selection-checkbox {
  display: flex;
  align-items: flex-start;
  padding-top: 5px;

  .checkbox-label {
    font-size: 12px;
    color: #7f8c8d;
  }
}

.course-main-info {
  flex: 1;
  cursor: pointer;
}

.course-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.course-code {
  font-family: "Courier New", monospace;
  font-weight: 600;
  color: #667eea;
  font-size: 14px;
}

.course-title {
  font-size: 16px;
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 8px;
}

.course-teacher {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
  font-size: 14px;
  color: #7f8c8d;

  i {
    font-size: 14px;
  }

  .teacher-name {
    font-weight: 500;
    color: #2c3e50;
  }

  .teacher-title {
    font-size: 12px;
  }
}

.course-details {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 10px;
}

.detail-item {
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

.course-capacity {
  .capacity-text {
    display: block;
    font-size: 12px;
    color: #7f8c8d;
    margin-bottom: 4px;
  }
}

.course-actions {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 10px;
  min-width: 180px;
}

.course-credits {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 14px;
  color: #f39c12;

  i {
    font-size: 14px;
  }

  .credits-value {
    font-weight: 600;
  }
}

.action-buttons {
  display: flex;
  gap: 8px;
}

.selection-hint {
  .hint-text {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 12px;
    color: #e74c3c;

    i {
      font-size: 10px;
    }
  }
}

.selection-controls {
  display: flex;
  justify-content: center;
  gap: 15px;
  padding-top: 20px;
  border-top: 1px solid #e9ecef;

  .selected-count {
    font-size: 12px;
    opacity: 0.8;
    margin-left: 5px;
  }
}

/* 步骤2：申请表单 */
.application-form-container {
  display: grid;
  grid-template-columns: 300px 1fr;
  gap: 30px;
}

.selected-courses-review {
  h3 {
    font-size: 16px;
    font-weight: 600;
    color: #2c3e50;
    margin-bottom: 15px;
    display: flex;
    align-items: center;
    gap: 8px;

    i {
      color: #2ecc71;
    }
  }
}

.courses-review-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.review-course-item {
  display: flex;
  gap: 12px;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e9ecef;
}

.review-index {
  width: 24px;
  height: 24px;
  background: #667eea;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
}

.review-course-info {
  flex: 1;
}

.review-course-name {
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 4px;
  font-size: 14px;
}

.review-course-details {
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-size: 12px;
  color: #7f8c8d;
}

.application-form {
  .application-form-content {
    :deep(.el-form-item) {
      margin-bottom: 20px;
    }
  }
}

.priority-hint {
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

/* 步骤3：确认页面 */
.confirmation-container {
  text-align: center;
  padding: 40px 0;
}

.confirmation-icon {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  margin: 0 auto 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 48px;

  &.success {
    background: linear-gradient(135deg, #2ecc71 0%, #27ae60 100%);
    color: white;
  }
}

.confirmation-title {
  font-size: 28px;
  font-weight: 700;
  color: #2c3e50;
  margin-bottom: 30px;
}

.confirmation-details {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
  margin-bottom: 30px;
}

.detail-card {
  background: #f8f9fa;
  border-radius: 12px;
  padding: 20px;
  text-align: left;
  border: 1px solid #e9ecef;
}

.detail-header {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 16px;
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 1px solid #e9ecef;

  i {
    color: #667eea;
  }
}

.detail-content {
  .detail-item {
    display: flex;
    justify-content: space-between;
    margin-bottom: 10px;
    font-size: 14px;

    .label {
      color: #7f8c8d;
    }

    .value {
      color: #2c3e50;
      font-weight: 500;
    }
  }
}

.process-timeline {
  position: relative;
  padding-left: 30px;

  &::before {
    content: "";
    position: absolute;
    left: 10px;
    top: 0;
    bottom: 0;
    width: 2px;
    background: #e9ecef;
  }
}

.process-step {
  position: relative;
  margin-bottom: 20px;
  display: flex;
  align-items: center;

  &.active {
    .step-marker {
      background: #667eea;
      color: white;
    }

    .step-title {
      color: #667eea;
      font-weight: 600;
    }
  }
}

.step-marker {
  position: absolute;
  left: -30px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #e9ecef;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  color: #7f8c8d;
}

.step-info {
  flex: 1;
}

.step-title {
  font-size: 14px;
  color: #2c3e50;
  margin-bottom: 4px;
}

.step-time {
  font-size: 12px;
  color: #7f8c8d;
}

.confirmation-actions {
  display: flex;
  justify-content: center;
  gap: 15px;
  margin-bottom: 30px;
}

.confirmation-tips {
  max-width: 600px;
  margin: 0 auto;
  background: #fff9e6;
  border: 1px solid #ffe58f;
  border-radius: 8px;
  padding: 15px;
}

.tip-item {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
  font-size: 14px;
  color: #7f8c8d;

  &:last-child {
    margin-bottom: 0;
  }

  i {
    color: #f39c12;
  }
}

/* 步骤4：我的申请 */
.application-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-bottom: 30px;
}

.stat-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 20px;
  cursor: pointer;
  border: 2px solid transparent;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  &:active {
    border-color: #667eea;
  }
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: white;

  &.pending {
    background: linear-gradient(135deg, #f39c12 0%, #e67e22 100%);
  }

  &.approved {
    background: linear-gradient(135deg, #2ecc71 0%, #27ae60 100%);
  }

  &.rejected {
    background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);
  }

  &.total {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  }
}

.stat-content {
  flex: 1;
}

.stat-value {
  display: block;
  font-size: 28px;
  font-weight: 700;
  color: #2c3e50;
  line-height: 1;
  margin-bottom: 5px;
}

.stat-label {
  font-size: 14px;
  color: #7f8c8d;
}

.applications-section {
  .applications-filter {
    margin-bottom: 24px;

    .filter-form {
      display: flex;
      flex-wrap: wrap;
      gap: 15px;
      align-items: center;

      :deep(.el-form-item) {
        margin-bottom: 0;
      }
    }
  }
}

.applications-list {
  margin-bottom: 24px;
}

.application-item {
  background: white;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 15px;
  border: 1px solid #e9ecef;
  transition: all 0.3s ease;

  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
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
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 1px solid #e9ecef;
}

.application-id {
  .id-label {
    font-size: 12px;
    color: #7f8c8d;
  }

  .id-value {
    font-family: "Courier New", monospace;
    font-weight: 600;
    color: #667eea;
  }
}

.application-content {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 15px;
}

.application-info {
  flex: 1;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
  font-size: 14px;

  i {
    width: 14px;
    text-align: center;
    color: #667eea;
  }

  .info-label {
    color: #7f8c8d;
    min-width: 80px;
  }

  .info-value {
    color: #2c3e50;

    &.reason-text {
      color: #7f8c8d;
      max-width: 400px;
      line-height: 1.4;
    }
  }
}

.application-actions {
  display: flex;
  gap: 8px;
}

.application-footer {
  padding-top: 15px;
  border-top: 1px solid #e9ecef;
  font-size: 12px;
  color: #7f8c8d;

  .review-info {
    display: flex;
    gap: 20px;
    margin-bottom: 5px;

    i {
      margin-right: 4px;
    }
  }

  .review-notes,
  .reject-reason {
    display: flex;
    align-items: flex-start;
    gap: 5px;
    margin-top: 5px;

    i {
      margin-top: 2px;
    }
  }

  .reject-reason {
    color: #e74c3c;
  }
}

/* 弹窗样式 */
.course-detail-modal,
.application-detail-modal {
  .info-row {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 10px;
    font-size: 14px;

    .info-label {
      color: #7f8c8d;
      min-width: 80px;
    }

    .info-value {
      color: #2c3e50;
    }
  }
}

.course-teacher-info,
.course-schedule-info,
.course-description,
.course-capacity-info {
  margin-bottom: 20px;

  h4 {
    font-size: 16px;
    font-weight: 600;
    color: #2c3e50;
    margin-bottom: 10px;
    display: flex;
    align-items: center;
    gap: 8px;

    i {
      color: #667eea;
    }
  }
}

.teacher-details {
  padding-left: 26px;

  .teacher-name {
    font-weight: 600;
    color: #2c3e50;
    margin-bottom: 4px;
  }

  .teacher-title,
  .teacher-experience {
    font-size: 14px;
    color: #7f8c8d;
    margin-bottom: 2px;
  }
}

.schedule-details {
  padding-left: 26px;

  .schedule-item {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 8px;
    font-size: 14px;
    color: #7f8c8d;

    i {
      width: 16px;
      text-align: center;
    }
  }
}

.course-description p {
  font-size: 14px;
  color: #7f8c8d;
  line-height: 1.6;
}

.capacity-details {
  padding-left: 26px;

  .capacity-progress {
    margin-bottom: 10px;
  }

  .capacity-text {
    display: block;
    font-size: 14px;
    color: #7f8c8d;
    margin-bottom: 8px;
  }

  .capacity-hint {
    font-size: 12px;
    color: #e74c3c;
    display: flex;
    align-items: center;
    gap: 5px;
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
  .application-form-container {
    grid-template-columns: 1fr;
  }

  .confirmation-details {
    grid-template-columns: 1fr;
  }

  .application-stats {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .course-selection-container {
    padding: 0 15px 30px;
  }

  .banner-section {
    padding: 30px 20px;
  }

  .banner-title {
    font-size: 24px;
  }

  .progress-steps {
    flex-direction: column;
    gap: 20px;

    &::before {
      display: none;
    }
  }

  .progress-step {
    padding: 15px;
    background: #f8f9fa;
    border-radius: 12px;
  }

  .step-arrow {
    display: none;
  }

  .section-header {
    flex-direction: column;
    gap: 15px;
    align-items: stretch;
  }

  .selection-stats {
    justify-content: space-around;
  }

  .course-filter .filter-form {
    flex-direction: column;
    align-items: stretch;
  }

  .course-selection-item {
    flex-direction: column;
    gap: 15px;
  }

  .course-actions {
    align-items: stretch;
  }

  .selected-course-item {
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
  }

  .course-actions {
    align-self: flex-end;
  }

  .confirmation-details {
    grid-template-columns: 1fr;
  }

  .confirmation-actions {
    flex-direction: column;
  }

  .application-stats {
    grid-template-columns: 1fr;
  }

  .application-content {
    flex-direction: column;
    gap: 15px;
  }

  .application-actions {
    align-self: flex-end;
  }

  .application-footer .review-info {
    flex-direction: column;
    gap: 5px;
  }
}
</style>
