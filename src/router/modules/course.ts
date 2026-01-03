const Layout = () => import("@/layout/index.vue");

export default {
  path: "/course",
  name: "Course",
  component: Layout,
  redirect: "course",
  meta: {
    icon: "ep:view",
    title: "课程浏览",
    rank: 0
  },
  children: [
    {
      path: "/course/category",
      name: "CourseCategory",
      component: () => import("@/views/welcome/index.vue"),
      meta: {
        icon: "ep:arrow-right",
        title: "课程分类",
        showLink: true
      },
      children: [
        {
          path: "/course/category/serve",
          name: "CourseCategoryServe",
          component: () => import("@/views/welcome/index.vue"),
          meta: {
            icon: "ep:CaretRight",
            title: "发球",
            showLink: true
          }
        },
        {
          path: "/course/category/receive",
          name: "CourseCategoryReceive",
          component: () => import("@/views/welcome/index.vue"),
          meta: {
            icon: "ep:CaretRight",
            title: "接球",
            showLink: true
          }
        },
        {
          path: "/course/category/spike",
          name: "CourseCategorySpike",
          component: () => import("@/views/welcome/index.vue"),
          meta: {
            icon: "ep:CaretRight",
            title: "扣球",
            showLink: true
          }
        }
      ]
    },
    {
      path: "/course/teacher",
      name: "CourseTeacher",
      component: () => import("@/views/welcome/index.vue"),
      meta: {
        icon: "ep:ArrowRight",
        title: "课程老师",
        showLink: true
      }
    },
    {
      path: "/course/score",
      name: "CourseScore",
      component: () => import("@/views/welcome/index.vue"),
      meta: {
        icon: "ep:ArrowRight",
        title: "课程评分",
        showLink: true
      }
    }
  ]
} satisfies RouteConfigsTable;
