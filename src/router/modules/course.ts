const Layout = () => import("@/layout/index.vue");

export default {
  path: "/course",
  name: "Course",
  component: Layout,
  redirect: "/course/category",
  meta: {
    icon: "ep:View",
    title: "课程浏览",
    rank: 0
  },
  children: [
    {
      path: "/course/category",
      name: "CourseCategory",
      component: () => import("@/views/course/view.vue"),
      meta: {
        // icon: "ep:view",
        title: "课程分类",
        showLink: true
      }
    }
    // {
    //   path: "/course/teacher",
    //   name: "CourseTeacher",
    //   component: () => import("@/views/welcome/index.vue"),
    //   meta: {
    //     icon: "ep:ArrowRight",
    //     title: "课程老师",
    //     showLink: true
    //   }
    // },
    // {
    //   path: "/course/score",
    //   name: "CourseScore",
    //   component: () => import("@/views/welcome/index.vue"),
    //   meta: {
    //     icon: "ep:ArrowRight",
    //     title: "课程评分",
    //     showLink: true
    //   }
    // }
  ]
} satisfies RouteConfigsTable;
