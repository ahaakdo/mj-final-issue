const Layout = () => import("@/layout/index.vue");

export default {
  path: "/teachermyclass",
  name: "teachermyclass",
  component: Layout,
  redirect: "/teacher/myclass",
  meta: {
    icon: "ep:expand",
    title: "我的课程",
    rank: 10
  },
  children: [
    {
      path: "/teacher/myclass",
      name: "/teacher/myclass",
      component: () => import("@/views/teacher/mycalss.vue"),
      meta: {
        icon: "ep:ArrowRight",
        title: "我的课程",
        showLink: true
      }
    }
  ]
} satisfies RouteConfigsTable;
