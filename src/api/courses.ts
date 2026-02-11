import { http } from "@/utils/http";
import { builders } from "prettier/doc";
import cursor = builders.cursor;

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

// 报名
export const applyCourse = (data: any) => {
  return http.post<Result, any>("http://localhost:3000/api/courses/apply", {
    data
  });
};
//退课
export const withdrawCourses = (data: any) => {
  return http.post<Result, any>("http://localhost:3000/api/courses/withdraw", {
    data
  });
};
