import { defineAsyncComponent } from "vue";
import { useRenderIcon as originalUseRenderIcon } from "@/components/ReIcon/src/hooks";

/**
 * 增强的图标渲染函数，支持 Element Plus 图标
 * @param icon 图标名称或组件
 * @returns 图标组件
 */
export function useEnhancedRenderIcon(icon: any) {
  // 如果是 ep: 前缀，使用 Element Plus 图标
  if (typeof icon === "string" && icon.startsWith("ep:")) {
    const iconName = icon.replace("ep:", "");
    return defineAsyncComponent(() =>
      import("@element-plus/icons-vue").then(module => {
        if (!module[iconName]) {
          console.warn(`Element Plus 图标 ${iconName} 不存在`);
          return null;
        }
        return module[iconName];
      })
    );
  }

  // 否则使用原来的逻辑
  return originalUseRenderIcon(icon);
}
