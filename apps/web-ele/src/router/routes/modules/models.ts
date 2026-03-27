import type { RouteRecordRaw } from "vue-router";

const routes: RouteRecordRaw[] = [
  {
    path: '/models',
    name: 'Models',
    meta: {icon: 'lucide:box', title: '三维模型'},
    children: [
      {
        path: '/models/manager',
        name: 'ModelManager',
        meta: {icon: 'lucide:file', title: '模型管理'},
        component: () => import('#/views/models/models_manager/index.vue')
      },
      {
        path: '/models/preview',
        name: 'Preview',
        meta: {icon: 'lucide:presentation', title: '模型预览', hideInMenu: true},
        component: () => import('#/views/models/preview/index.vue')
      },
    ]
  }
]

export default routes;
