// src/router/modules/teacher.ts
const Layout = () => import("@/layout/index.vue");

export default {
  path: "/teacher",
  name: "Teacher",
  component: Layout,
  redirect: "/teacher/classmanage",
  meta: {
    icon: "ep:user",
    title: "教师中心",
    rank: 10,
    roles: ["teacher"],
    showLink: true
  },
  children: [
    {
      path: "/teacher/classmanage",
      name: "teacher-classmanage",
      component: () => import("@/views/teacher/classmanage.vue"),
      meta: {
        title: "课程管理",
        showLink: true,
        roles: ["teacher"]
      }
    },
    {
      path: "/teacher/myclass",
      name: "teacher-myclass",
      component: () => import("@/views/teacher/myclass.vue"),
      meta: {
        title: "我的课程",
        showLink: true,
        roles: ["teacher"]
      }
    },
    {
      path: "/teacher/scorein",
      name: "teacher-scorein",
      component: () => import("@/views/teacher/scorein.vue"),
      meta: {
        title: "成绩录入",
        showLink: true,
        roles: ["teacher"]
      }
    }
  ]
};
