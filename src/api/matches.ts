import { http } from "@/utils/http";

export type Result = {
  success: boolean;
  data?: any;
  message?: string;
  code?: number;
};

/** 获取比赛列表接口 */
export const getMatches = () => {
  return http.get<Result, any>("http://localhost:3000/api/matches");
};
