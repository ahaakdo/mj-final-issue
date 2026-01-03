const Layout = () => import("@/layout/index.vue");

export default {
  path: "/coursewithdraw",
  name: "CourseWithdraw",
  component: Layout,
  redirect: "/coursewithdraw/withdraw",
  //只有一个页面不用重定向
  meta: {
    icon: "ep:CircleCloseFilled",
    title: "退课申请",
    rank: 4
  },
  children: [
    {
      path: "/coursewithdraw/withdraw",
      name: "courseWithdraw",
      component: () => import("@/views/welcome/index.vue"),
      meta: {
        title: "退课申请",
        showLink: true
      }
    }
  ]
} satisfies RouteConfigsTable;
