// src/api/user.ts
import { http } from "@/utils/http";

export type UserResult = {
  success: boolean;
  data: {
    /** 头像 */
    avatar: string;
    /** 用户名 */
    username: string;
    /** 昵称 */
    nickname: string;
    /** 用户类型（新增：teacher/student） */
    user_type: string;
    /** 当前登录用户的角色 */
    roles: Array<string>;
    /** 按钮级别权限 */
    permissions: Array<string>;
    /** `token` */
    accessToken: string;
    /** 用于调用刷新`accessToken`的接口时所需的`token` */
    refreshToken: string;
    /** `accessToken`的过期时间（格式'xxxx/xx/xx xx:xx:xx'） */
    expires: Date;
  };
};

export type RefreshTokenResult = {
  success: boolean;
  data: {
    /** `token` */
    accessToken: string;
    /** 用于调用刷新`accessToken`的接口时所需的`token` */
    refreshToken: string;
    /** `accessToken`的过期时间（格式'xxxx/xx/xx xx:xx:xx'） */
    expires: Date;
  };
};

/** 登录 */
export const getLogin = (data?: object) => {
  return http.request<UserResult>("post", "/login", { data });
};

/** 刷新`token` */
export const refreshTokenApi = (data?: object) => {
  return http.request<RefreshTokenResult>("post", "/refresh-token", { data });
};

/** 虚拟登录（新增）- 用于前端模拟登录 */
export const getMockLogin = (data?: {
  username: string;
  password: string;
  user_type: string;
}) => {
  return new Promise<UserResult>(resolve => {
    setTimeout(() => {
      const result: UserResult = {
        success: true,
        data: {
          avatar: "",
          username: data?.username || "admin",
          nickname: data?.user_type === "teacher" ? "教师" : "学生",
          user_type: data?.user_type || "student",
          roles: data?.user_type ? [data.user_type] : ["student"],
          permissions: [],
          accessToken: "mock-token-" + Date.now(),
          refreshToken: "mock-refresh-token-" + Date.now(),
          expires: new Date(Date.now() + 24 * 60 * 60 * 1000)
        }
      };
      resolve(result);
    }, 500);
  });
};
