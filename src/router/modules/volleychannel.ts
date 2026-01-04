import { tr } from "element-plus/es/locale/index.mjs";

const Layout = () => import("@/layout/index.vue");

export default {
  path: "/volleychannel",
  name: "VolleyChannel",
  component: Layout,
  redirect: "/volleychannel/athlete",
  meta: {
    icon: "ep:view",
    title: "女排专栏",
    rank: 10,
    showLink: true
  },
  children: [
    {
      path: "/volleychannel/athlete",
      name: "volleyChannelathlete",
      component: () => import("@/views/volleychannel/index.vue"),
      meta: {
        icon: "ep:ArrowRight",
        title: "女排运动员",
        showLink: true
      }
    },
    {
      path: "/volleychannel/matches",
      name: "VolleyMatches",
      component: () => import("@/views/volleychannel/matches.vue"),
      meta: {
        icon: "ep:ArrowRight",
        title: "经典赛事",
        showLink: true
      }
    }
  ]
} satisfies RouteConfigsTable;
