const Layout = () => import("@/layout/index.vue");

export default {
  path: "/gradeinquiry",
  name: "GradeInquiry",
  component: Layout,
  redirect: "/gradeinquiry/inquiry",
  //只有一个页面不用重定向
  meta: {
    icon: "ep:Search",
    title: "成绩查询",
    rank: 0
  },
  children: [
    {
      path: "/gradeinquiry/inquiry",
      name: "gradeInquiry",
      component: () => import("@/views/course/inquiry.vue"),
      meta: {
        title: "成绩查询",
        showLink: true
      }
    }
  ]
} satisfies RouteConfigsTable;
