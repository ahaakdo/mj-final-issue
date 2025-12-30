const Layout = () => import("@/layout/index.vue");

export default {
  path: "/course",
  name: "Course",
  component: Layout,
  redirect: "course",
  meta: {
    icon: "ep/home-filled",
    title: "课程管理",
    rank: 0
  },
  children: [
    {
      path: "/course",
      name: "CourseManager",
      component: () => import("@/views/welcome/index.vue"),
      meta: {
        title: "课程管理",
        showLink: true
      }
    }
  ]
} satisfies RouteConfigsTable;
