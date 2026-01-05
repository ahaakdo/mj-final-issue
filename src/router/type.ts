// src/router/types.ts
import type { RouteRecordRaw } from "vue-router";

// 1. 首先定义自己的 RouteMeta 类型
export interface RouteMeta {
  title: string;
  icon?: string;
  rank?: number;
  roles?: string[];
  showLink?: boolean;
  [key: string]: any;
}

// 2. 扩展 Vue Router 的类型声明
declare module "vue-router" {
  // 覆盖 Vue Router 的 RouteMeta 接口
  interface RouteMeta {
    title: string;
    icon?: string;
    rank?: number;
    roles?: string[];
    showLink?: boolean;
    [key: string]: any;
  }
}

// 3. 定义路由配置表类型
export interface RouteConfigsTable {
  path: string;
  name?: string;
  redirect?: string;
  component?: any;
  meta?: RouteMeta;
  children?: RouteConfigsTable[];
}

// 4. 定义带 meta 的路由记录类型
export type RouteRecordRawWithMeta = RouteRecordRaw & {
  meta?: RouteMeta;
  children?: RouteRecordRawWithMeta[];
};
