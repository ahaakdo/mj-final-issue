<script setup lang="ts">
import { useRoute } from "vue-router";
import { emitter } from "@/utils/mitt";
import { useNav } from "@/layout/hooks/useNav";
import { responsiveStorageNameSpace } from "@/config";
import { storageLocal, isAllEmpty } from "@pureadmin/utils";
import { findRouteByPath, getParentPaths } from "@/router/utils";
import { usePermissionStoreHook } from "@/store/modules/permission";
import { ref, computed, watch, onMounted, onBeforeUnmount } from "vue";
import LaySidebarLogo from "../lay-sidebar/components/SidebarLogo.vue";
import LaySidebarItem from "../lay-sidebar/components/SidebarItem.vue";
import LaySidebarLeftCollapse from "../lay-sidebar/components/SidebarLeftCollapse.vue";
import LaySidebarCenterCollapse from "../lay-sidebar/components/SidebarCenterCollapse.vue";

const route = useRoute();
const isShow = ref(false);
const showLogo = ref(
  storageLocal().getItem<StorageConfigs>(
    `${responsiveStorageNameSpace()}configure`
  )?.showLogo ?? true
);

const {
  device,
  pureApp,
  isCollapse,
  tooltipEffect,
  menuSelect,
  toggleSideBar,
  menus, // 新增：使用过滤后的菜单
  refreshMenus // 新增：刷新菜单方法
} = useNav();

const subMenuData = ref([]);

// 修改点1：使用过滤后的菜单
const menuData = computed(() => {
  if (pureApp.layout === "mix" && device.value !== "mobile") {
    return subMenuData.value;
  }

  // 使用过滤后的菜单而不是 wholeMenus
  return menus.value;
});

const loading = computed(() =>
  pureApp.layout === "mix" ? false : menuData.value.length === 0 ? true : false
);

const defaultActive = computed(() =>
  !isAllEmpty(route.meta?.activePath) ? route.meta.activePath : route.path
);

function getSubMenuData() {
  let path = "";
  path = defaultActive.value;
  subMenuData.value = [];

  // 修改点2：使用过滤后的菜单获取父路径
  const parentPathArr = getParentPaths(path, menus.value);

  // 当前路由的父级路由信息
  const parentRoute = findRouteByPath(parentPathArr[0] || path, menus.value);

  if (!parentRoute?.children) return;
  subMenuData.value = parentRoute?.children;
}

watch(
  () => [route.path, menus.value], // 修改点3：监听 menus.value 而不是 wholeMenus
  () => {
    if (route.path.includes("/redirect")) return;
    getSubMenuData();
    menuSelect(route.path);
  }
);

onMounted(() => {
  getSubMenuData();

  emitter.on("logoChange", key => {
    showLogo.value = key;
  });

  // 新增：监听菜单刷新事件
  emitter.on("menu-refresh", () => {
    console.log("接收到菜单刷新事件");
    // 重新获取子菜单数据
    setTimeout(() => {
      getSubMenuData();
    }, 100);
  });
});

onBeforeUnmount(() => {
  // 解绑事件
  emitter.off("logoChange");
  emitter.off("menu-refresh"); // 新增：解绑菜单刷新事件
});
</script>

<template>
  <div
    v-loading="loading"
    :class="['sidebar-container', showLogo ? 'has-logo' : 'no-logo']"
    @mouseenter.prevent="isShow = true"
    @mouseleave.prevent="isShow = false"
  >
    <LaySidebarLogo v-if="showLogo" :collapse="isCollapse" />
    <el-scrollbar
      wrap-class="scrollbar-wrapper"
      :class="[device === 'mobile' ? 'mobile' : 'pc']"
    >
      <el-menu
        unique-opened
        mode="vertical"
        popper-class="pure-scrollbar"
        class="outer-most select-none"
        :collapse="isCollapse"
        :collapse-transition="false"
        :popper-effect="tooltipEffect"
        :default-active="defaultActive"
        @select="menuSelect"
      >
        >
        <LaySidebarItem
          v-for="routes in menuData"
          :key="routes.path"
          :item="routes"
          :base-path="routes.path"
          class="outer-most select-none"
        />
      </el-menu>
    </el-scrollbar>
    <LaySidebarCenterCollapse
      v-if="device !== 'mobile' && (isShow || isCollapse)"
      :is-active="pureApp.sidebar.opened"
      @toggleClick="toggleSideBar"
    />
    <LaySidebarLeftCollapse
      v-if="device !== 'mobile'"
      :is-active="pureApp.sidebar.opened"
      @toggleClick="toggleSideBar"
    />
  </div>
</template>

<style scoped>
:deep(.el-loading-mask) {
  opacity: 0.45;
}
</style>
