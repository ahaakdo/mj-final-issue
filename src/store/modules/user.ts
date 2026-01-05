// src/store/modules/user.ts - 完整修正版
import { defineStore } from "pinia";
import {
  type userType,
  store,
  router,
  resetRouter,
  routerArrays,
  storageLocal
} from "../utils";
import {
  type UserResult,
  type RefreshTokenResult,
  getLogin,
  refreshTokenApi,
  getMockLogin
} from "@/api/user";
import { useMultiTagsStoreHook } from "./multiTags";
import { type DataInfo, setToken, removeToken, userKey } from "@/utils/auth";

// 扩展用户类型，添加user_type字段
interface ExtendedUserType extends userType {
  user_type: string;
}

export const useUserStore = defineStore("pure-user", {
  state: (): ExtendedUserType => ({
    // 头像
    avatar: storageLocal().getItem<DataInfo<number>>(userKey)?.avatar ?? "",
    // 用户名
    username: storageLocal().getItem<DataInfo<number>>(userKey)?.username ?? "",
    // 昵称
    nickname: storageLocal().getItem<DataInfo<number>>(userKey)?.nickname ?? "",
    // 用户类型（新增）
    user_type:
      storageLocal().getItem<DataInfo<number>>(userKey)?.user_type ?? "",
    // 页面级别权限
    roles: storageLocal().getItem<DataInfo<number>>(userKey)?.roles ?? [],
    // 按钮级别权限
    permissions:
      storageLocal().getItem<DataInfo<number>>(userKey)?.permissions ?? [],
    // 是否勾选了登录页的免登录
    isRemembered: false,
    // 登录页的免登录存储几天，默认7天
    loginDay: 7
  }),
  actions: {
    /** 存储头像 */
    SET_AVATAR(avatar: string) {
      this.avatar = avatar;
    },
    /** 存储用户名 */
    SET_USERNAME(username: string) {
      this.username = username;
    },
    /** 存储昵称 */
    SET_NICKNAME(nickname: string) {
      this.nickname = nickname;
    },
    /** 存储用户类型（新增） */
    SET_USER_TYPE(user_type: string) {
      this.user_type = user_type;
    },
    /** 存储角色 */
    SET_ROLES(roles: Array<string>) {
      this.roles = roles;
    },
    /** 存储按钮级别权限 */
    SET_PERMS(permissions: Array<string>) {
      this.permissions = permissions;
    },
    /** 存储是否勾选了登录页的免登录 */
    SET_ISREMEMBERED(bool: boolean) {
      this.isRemembered = bool;
    },
    /** 设置登录页的免登录存储几天 */
    SET_LOGINDAY(value: number) {
      this.loginDay = Number(value);
    },
    /** 登入 - 支持用户类型 */
    async loginByUsername(data: {
      username: string;
      password: string;
      user_type: string;
    }) {
      return new Promise<UserResult>((resolve, reject) => {
        // 使用虚拟登录
        getMockLogin(data)
          .then(data => {
            if (data?.success) {
              const userData = data.data;

              // 确保roles包含user_type
              if (
                userData.user_type &&
                !userData.roles.includes(userData.user_type)
              ) {
                userData.roles = [...userData.roles, userData.user_type];
              }

              // 存储到本地
              storageLocal().setItem<DataInfo<number>>(userKey, userData);

              // 更新store状态
              this.username = userData.username;
              this.nickname = userData.nickname;
              this.user_type = userData.user_type;
              this.roles = userData.roles;
              this.avatar = userData.avatar;
              this.permissions = userData.permissions;

              // 设置token
              setToken(userData);
            }
            resolve(data);
          })
          .catch(error => {
            reject(error);
          });
      });
    },
    /** 前端登出（不调用接口） */
    logOut() {
      this.username = "";
      this.nickname = "";
      this.user_type = ""; // 清空用户类型
      this.roles = [];
      this.permissions = [];
      this.avatar = "";
      removeToken();
      useMultiTagsStoreHook().handleTags("equal", [...routerArrays]);
      resetRouter();
      router.push("/login");
    },
    /** 刷新`token` */
    async handRefreshToken(data) {
      return new Promise<RefreshTokenResult>((resolve, reject) => {
        refreshTokenApi(data)
          .then(data => {
            if (data) {
              setToken(data.data);
              resolve(data);
            }
          })
          .catch(error => {
            reject(error);
          });
      });
    },
    /** 简易登录方法（修正版） */
    async simpleLogin(data: {
      username: string;
      password: string;
      user_type: string;
    }) {
      return new Promise<any>(resolve => {
        setTimeout(() => {
          // 关键修改：即使用户名是 admin，也使用传入的 user_type
          const userData = {
            avatar: "",
            username: data.username,
            nickname:
              data.user_type === "teacher"
                ? "教师"
                : data.user_type === "student"
                  ? "学生"
                  : "管理员",
            user_type: data.user_type, // 使用传入的用户类型，不是根据用户名
            roles: [data.user_type],
            permissions: [],
            accessToken: "mock-token-" + Date.now(),
            refreshToken: "mock-refresh-token-" + Date.now(),
            expires: new Date(Date.now() + 24 * 60 * 60 * 1000)
          };

          console.log("登录成功，存储用户数据:", userData);
          console.log("用户名:", data.username, "用户类型:", data.user_type);

          // 设置token
          setToken(userData);

          // 立即更新store状态
          this.username = data.username;
          this.nickname =
            data.user_type === "teacher"
              ? "教师"
              : data.user_type === "student"
                ? "学生"
                : "管理员";
          this.user_type = data.user_type; // 确保这个设置
          this.roles = [data.user_type];
          this.avatar = "";
          this.permissions = [];

          console.log("store状态已更新:", {
            username: this.username,
            user_type: this.user_type,
            roles: this.roles
          });

          resolve({
            success: true,
            data: userData,
            user_type: data.user_type
          });
        }, 100);
      });
    }
  }
});

export function useUserStoreHook() {
  return useUserStore(store);
}
