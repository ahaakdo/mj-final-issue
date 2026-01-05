// src/utils/auth.ts - 完整修正版
import Cookies from "js-cookie";
import { useUserStoreHook } from "@/store/modules/user";
import { storageLocal, isString, isIncludeAllChildren } from "@pureadmin/utils";

export interface DataInfo<T> {
  /** token */
  accessToken: string;
  /** `accessToken`的过期时间（时间戳） */
  expires: T;
  /** 用于调用刷新accessToken的接口时所需的token */
  refreshToken: string;
  /** 头像 */
  avatar?: string;
  /** 用户名 */
  username?: string;
  /** 昵称 */
  nickname?: string;
  /** 用户类型（新增） */
  user_type?: string;
  /** 当前登录用户的角色 */
  roles?: Array<string>;
  /** 当前登录用户的按钮级别权限 */
  permissions?: Array<string>;
}

export const userKey = "user-info";
export const TokenKey = "authorized-token";
export const multipleTabsKey = "multiple-tabs";

/** 获取`token` */
export function getToken(): DataInfo<number> {
  return Cookies.get(TokenKey)
    ? JSON.parse(Cookies.get(TokenKey))
    : storageLocal().getItem(userKey);
}

/**
 * @description 设置`token`以及一些必要信息
 */
export function setToken(data: DataInfo<Date>) {
  let expires = 0;
  const { accessToken, refreshToken } = data;
  const { isRemembered, loginDay } = useUserStoreHook();
  expires = new Date(data.expires).getTime();
  const cookieString = JSON.stringify({ accessToken, expires, refreshToken });

  expires > 0
    ? Cookies.set(TokenKey, cookieString, {
      expires: (expires - Date.now()) / 86400000
    })
    : Cookies.set(TokenKey, cookieString);

  Cookies.set(
    multipleTabsKey,
    "true",
    isRemembered
      ? {
        expires: loginDay
      }
      : {}
  );

  // 修改后的 setUserKey 函数，添加 user_type 处理
  function setUserKey({
    avatar,
    username,
    nickname,
    user_type = "", // 添加默认值
    roles,
    permissions
  }) {
    const userStore = useUserStoreHook();
    userStore.SET_AVATAR(avatar);
    userStore.SET_USERNAME(username);
    userStore.SET_NICKNAME(nickname);
    userStore.SET_USER_TYPE(user_type); // 新增
    userStore.SET_ROLES(roles);
    userStore.SET_PERMS(permissions);

    // 存储到 localStorage，包含 user_type
    storageLocal().setItem(userKey, {
      refreshToken,
      expires,
      avatar,
      username,
      nickname,
      user_type, // 新增
      roles,
      permissions
    });

    console.log("setToken: 用户信息已存储，user_type =", user_type);
  }

  if (data.username && data.roles) {
    const { username, roles } = data;
    setUserKey({
      avatar: data?.avatar ?? "",
      username,
      nickname: data?.nickname ?? "",
      user_type: data?.user_type ?? "", // 确保传递
      roles,
      permissions: data?.permissions ?? []
    });
  } else {
    const stored = storageLocal().getItem<DataInfo<number>>(userKey);
    const avatar = stored?.avatar ?? "";
    const username = stored?.username ?? "";
    const nickname = stored?.nickname ?? "";
    const user_type = stored?.user_type ?? ""; // 新增
    const roles = stored?.roles ?? [];
    const permissions = stored?.permissions ?? [];
    setUserKey({
      avatar,
      username,
      nickname,
      user_type, // 新增
      roles,
      permissions
    });
  }
}

/** 删除`token`以及key值为`user-info`的localStorage信息 */
export function removeToken() {
  Cookies.remove(TokenKey);
  Cookies.remove(multipleTabsKey);
  storageLocal().removeItem(userKey);
}

/** 格式化token（jwt格式） */
export const formatToken = (token: string): string => {
  return "Bearer " + token;
};

/** 是否有按钮级别的权限 */
export const hasPerms = (value: string | Array<string>): boolean => {
  if (!value) return false;
  const allPerms = "*:*:*";
  const { permissions } = useUserStoreHook();
  if (!permissions) return false;
  if (permissions.length === 1 && permissions[0] === allPerms) return true;
  const isAuths = isString(value)
    ? permissions.includes(value)
    : isIncludeAllChildren(value, permissions);
  return isAuths ? true : false;
};
