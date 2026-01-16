import { http } from "@/utils/http";

export type Result = {
  success: boolean;
  data?: any;
  message?: string;
  code?: number;
};

/** 获取玩家列表接口 */
export const getPlayers = () => {
  // 注意：这里使用的是 get 请求
  return http.get<Result, any>("http://localhost:3000/api/players");
};
