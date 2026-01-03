const Layout = () => import("@/layout/index.vue");

export default {
  path: "/volleychannel",
  name: "VolleyChannel",
  component: Layout,
  redirect: "/volleychannel/inquiry",
  //只有一个页面不用重定向
  meta: {
    icon: "ep:Expand",
    title: "女排专栏",
    rank: 10
  },
  children: [
    {
      path: "/volleychannel/intro",
      name: "volleyChannelIntro",
      component: () => import("@/views/welcome/index.vue"),
      meta: {
        title: "女排专栏",
        showLink: true
      }
    }
  ]
} satisfies RouteConfigsTable;
