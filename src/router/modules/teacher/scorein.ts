const Layout = () => import("@/layout/index.vue");

export default {
  path: "/teacherscorein",
  name: "teacherscorein",
  component: Layout,
  redirect: "/teacher/scorein",
  meta: {
    icon: "ep:expand",
    title: "成绩录入",
    rank: 10
  },
  children: [
    {
      path: "/teacher/scorein",
      name: "/teacher/scorein",
      component: () => import("@/views/teacher/scorein.vue"),
      meta: {
        icon: "ep:ArrowRight",
        title: "成绩录入",
        showLink: true
      }
    }
  ]
} satisfies RouteConfigsTable;
