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
      }
    ]
  }
]

export default routes;
