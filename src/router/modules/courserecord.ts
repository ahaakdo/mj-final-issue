const Layout = () => import("@/layout/index.vue");

export default {
  path: "/courserecord",
  name: "Courserecord",
  component: Layout,
  redirect: "/courserecord/record",
  //只有一个页面不用重定向
  meta: {
    icon: "ep:Clock",
    title: "选课记录",
    rank: 3
  },
  children: [
    {
      path: "/courserecord/record",
      name: "courseRecord",
      component: () => import("@/views/course/record.vue"),
      meta: {
        title: "选课记录",
        showLink: true
      }
    }
  ]
} satisfies RouteConfigsTable;
