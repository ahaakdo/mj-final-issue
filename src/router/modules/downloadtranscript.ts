const Layout = () => import("@/layout/index.vue");

export default {
  path: "/downloadtranscript",
  name: "DownloadTranscript",
  component: Layout,
  redirect: "/downloadtranscript/transcript",
  //只有一个页面不用重定向
  meta: {
    icon: "ep:Download",
    title: "下载成绩单",
    rank: 10
  },
  children: [
    {
      path: "/downloadtranscript/transcript",
      name: "downloadTranscript",
      component: () => import("@/views/welcome/index.vue"),
      meta: {
        title: "下载成绩单",
        showLink: true
      }
    }
  ]
} satisfies RouteConfigsTable;
