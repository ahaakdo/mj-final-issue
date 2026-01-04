const Layout = () => import("@/layout/index.vue");

export default {
  path: "/teacherclassmanage",
  name: "teacherclassmanage",
  component: Layout,
  redirect: "/teacher/classmanage",
  meta: {
    icon: "ep:expand",
    title: "课程管理",
    rank: 10
  },
  children: [
    {
      path: "/teacher/classmanage",
      name: "/teacher/classmanage",
      component: () => import("@/views/teacher/classmanage.vue"),
      meta: {
        icon: "ep:ArrowRight",
        title: "课程管理",
        showLink: true
      }
    }
  ]
} satisfies RouteConfigsTable;
