const Layout = () => import("@/layout/index.vue");

export default {
  path: "/coursechoose",
  name: "Coursechoose",
  component: Layout,
  redirect: "/coursechoose/record",
  //只有一个页面不用重定向
  meta: {
    icon: "ep:CircleCheckFilled",
    title: "在线选课",
    rank: 2
  },
  children: [
    {
      path: "/coursechoose/record",
      name: "courseChoose",
      component: () => import("@/views/course/choose.vue"),
      meta: {
        title: "在线选课",
        showLink: true
      }
    }
  ]
} satisfies RouteConfigsTable;
