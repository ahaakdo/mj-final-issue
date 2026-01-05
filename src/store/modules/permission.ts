// src/store/modules/permission.ts - 完整修正版
import { defineStore } from "pinia";
import {
  type cacheType,
  store,
  ascending,
  getKeyList,
  filterTree,
  constantMenus,
  filterNoPermissionTree,
  formatFlatteningRoutes
} from "../utils";
import { useMultiTagsStoreHook } from "./multiTags";
import { useUserStoreHook } from "./user";

// 导出类型定义
export interface PermissionState {
  constantMenus: any[];
  wholeMenus: any[];
  filteredMenus: any[];
  flatteningRoutes: any[];
  cachePageList: string[];
  menusLoaded: boolean;
}

export const usePermissionStore = defineStore("pure-permission", {
  state: (): PermissionState => ({
    // 静态路由生成的菜单
    constantMenus,
    // 整体路由生成的菜单（静态、动态）
    wholeMenus: [],
    // 过滤后的菜单（根据角色）
    filteredMenus: [],
    // 整体路由（一维数组格式）
    flatteningRoutes: [],
    // 缓存页面keepAlive
    cachePageList: [],
    // 菜单是否已加载完成
    menusLoaded: false
  }),
  actions: {
    /** 组装整体路由生成的菜单 */
    handleWholeMenus(routes: any[]) {
      console.log("组装菜单，路由数量:", routes.length);

      const allMenus = filterNoPermissionTree(
        filterTree(ascending(this.constantMenus.concat(routes)))
      );

      // 原始菜单数据
      this.wholeMenus = allMenus;
      this.menusLoaded = true;

      console.log("菜单组装完成，总数:", allMenus.length);

      // 立即过滤菜单
      setTimeout(() => {
        this.filterMenusByRole();
      }, 50);

      this.flatteningRoutes = formatFlatteningRoutes(
        this.constantMenus.concat(routes) as any
      );
    },

    /** 根据用户角色过滤菜单 */
    // 在 permission.ts 中，修改 filterMenusByRole 方法：
    filterMenusByRole() {
      if (!this.menusLoaded) {
        console.log("菜单未加载，跳过过滤");
        return;
      }

      try {
        const userStore = useUserStoreHook();
        const userType = userStore.user_type;

        console.log("=== 开始权限过滤 ===");
        console.log("用户名:", userStore.username);
        console.log("用户类型:", userType);

        // 重要：根据 user_type 过滤，不是根据用户名
        if (userType === 'teacher') {
          console.log("教师用户，开始过滤...");

          // 教师能看到的基础菜单
          const teacherBasePaths = ['/', '/dashboard', '/welcome'];

          // 教师菜单
          const teacherPaths = ['/teacher'];

          const filterMenu = (menus: any[]): any[] => {
            return menus
              .filter(menu => {
                const menuPath = menu.path || '';
                const menuTitle = menu.meta?.title || '';
                const menuRoles = menu.meta?.roles || [];

                // 1. 检查角色权限
                if (menuRoles.length > 0) {
                  return menuRoles.includes('teacher');
                }

                // 2. 检查是否是基础菜单
                const isBaseMenu = teacherBasePaths.some(basePath =>
                  menuPath === basePath
                );

                // 3. 检查是否是教师菜单
                const isTeacherMenu = teacherPaths.some(teacherPath =>
                  menuPath.startsWith(teacherPath)
                );

                // 4. 检查标题是否包含教师关键词
                const isTeacherByTitle = menuTitle.includes('教师') ||
                  menuTitle.includes('teacher') ||
                  menuTitle.includes('Teacher');

                return isBaseMenu || isTeacherMenu || isTeacherByTitle;
              })
              .map(menu => {
                const newMenu = { ...menu };
                if (newMenu.children && newMenu.children.length > 0) {
                  newMenu.children = filterMenu(newMenu.children);
                }
                return newMenu;
              });
          };

          this.filteredMenus = filterMenu(this.wholeMenus);

        } else if (userType === 'admin') {
          console.log("管理员用户，显示所有菜单");
          this.filteredMenus = [...this.wholeMenus];

        } else if (userType === 'student') {
          console.log("学生用户，显示学生菜单");
          // 学生过滤逻辑类似
          this.filteredMenus = [...this.wholeMenus];

        } else {
          console.log("未知用户类型，显示基础菜单");
          this.filteredMenus = this.wholeMenus.filter(menu => {
            const menuRoles = menu.meta?.roles || [];
            return menuRoles.length === 0;
          });
        }

        console.log("过滤后菜单数量:", this.filteredMenus?.length || 0);
        console.log("菜单标题:", this.filteredMenus?.map(m => m.meta?.title) || []);

      } catch (error) {
        console.error("菜单过滤出错:", error);
        this.filteredMenus = [...this.wholeMenus];
      }
    },

    /** 获取过滤后的菜单 */
    getFilteredMenus() {
      if (
        (!this.filteredMenus || this.filteredMenus.length === 0) &&
        this.menusLoaded
      ) {
        const userStore = useUserStoreHook();
        if (userStore.user_type) {
          console.log("过滤菜单为空，但用户已登录，重新过滤");
          this.filterMenusByRole();
        }
      }

      if (!this.filteredMenus || this.filteredMenus.length === 0) {
        return this.wholeMenus.filter(menu => {
          if (!menu.meta?.roles || menu.meta.roles.length === 0) {
            return true;
          }
          return false;
        });
      }

      return this.filteredMenus;
    },

    /** 监听缓存页面是否存在于标签页，不存在则删除 */
    clearCache() {
      let cacheLength = this.cachePageList.length;
      const nameList = getKeyList(useMultiTagsStoreHook().multiTags, "name");
      while (cacheLength > 0) {
        nameList.findIndex(v => v === this.cachePageList[cacheLength - 1]) ===
          -1 &&
          this.cachePageList.splice(
            this.cachePageList.indexOf(this.cachePageList[cacheLength - 1]),
            1
          );
        cacheLength--;
      }
    },

    cacheOperate({ mode, name }: cacheType) {
      const delIndex = this.cachePageList.findIndex(v => v === name);
      switch (mode) {
        case "refresh":
          this.cachePageList = this.cachePageList.filter(v => v !== name);
          this.clearCache();
          break;
        case "add":
          this.cachePageList.push(name);
          break;
        case "delete":
          delIndex !== -1 && this.cachePageList.splice(delIndex, 1);
          this.clearCache();
          break;
      }
    },

    /** 清空缓存页面 */
    clearAllCachePage() {
      this.wholeMenus = [];
      this.filteredMenus = [];
      this.cachePageList = [];
      this.menusLoaded = false;
    }
  }
});

// 导出 hook 函数 - 这是关键！
export function usePermissionStoreHook() {
  return usePermissionStore(store);
}
