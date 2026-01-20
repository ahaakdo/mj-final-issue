import { http } from "@/utils/http";

export type Result = {
  success: boolean;
  data?: any;
  message?: string;
  code?: number;
};

/** 获取玩家课程接口 */
export const getCourses = () => {
  // 注意：这里使用的是 get 请求
  return http.get<Result, any>("http://localhost:3000/api/courses");
};

// 获取课程分类接口
export const getCourseCategory = () => {
  return http.get<Result, any>("http://localhost:3000/api/courses/categories");
};
