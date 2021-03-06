export default [
  // user
  {
    path: '/user',
    component: '../layouts/UserLayout',
    routes: [
      { path: '/user', redirect: '/user/login' },
      { path: '/user/login', name: 'login', component: './User/Login' },
    ],
  },
  // app
  {
    path: '/',
    component: '../layouts/BasicLayout',
    Routes: ['src/pages/Authorized'],
    routes: [
      // dashboard
      { path: '/', redirect: '/dashboard/analysis' },
      {
        path: '/dashboard',
        name: 'dashboard',
        icon: 'dashboard',
        routes: [
          {
            path: '/dashboard/analysis',
            name: 'analysis',
            component: './Dashboard/Analysis',
          },
          {
            path: '/dashboard/unsales',
            name: 'analysis',
            component: './Dashboard/UnSales',
          },
          {
            path: '/dashboard/monitor',
            name: 'monitor',
            component: './Dashboard/Monitor',
          },
          {
            path: '/dashboard/workplace',
            name: 'workplace',
            component: './Dashboard/Workplace',
          },
        ],
      },
      // system
      {
        path: '/system',
        icon: 'setting',
        name: 'system',
        routes: [
          {
            path: '/system/user',
            icon: 'user',
            name: 'user',
            component: './User/User',
          },
          {
            path: '/system/role',
            icon: 'team',
            name: 'role',
            component: './Role/Role',
          },
          {
            path: '/system/permission',
            icon: 'solution',
            name: 'permission',
            component: './Permission/Permission',
          },
          {
            path: '/system/menu',
            icon: 'solution',
            name: 'menu',
            component: './SysMenu/SysMenu',
          },
          {
            path: '/system/job',
            icon: 'job',
            name: 'job',
            component: './Job/Job',
          },
          {
            path: '/system/profile',
            icon: 'user',
            name: 'profile',
            component: './MyProfile/MyProfile',
            routes: [
              {
                path: '/system/profile',
                redirect: '/system/profile/base',
              },
              {
                path: '/system/profile/base',
                component: './MyProfile/BaseView',
              },
              {
                path: '/system/profile/security',
                component: './MyProfile/SecurityView',
              },
            ],
          },
        ],
      },
      {
        name: 'monitor',
        icon: 'monitor',
        path: '/monitor',
        routes: [
          // exception
          {
            path: '/monitor/log',
            name: 'log',
            component: './Log/Log',
          },
          {
            path: '/monitor/error',
            name: 'error',
            component: './LogError/LogError',
          },
          {
            path: '/monitor/jobLog',
            name: 'jobLog',
            component: './JobLog/JobLog',
          },
          {
            path: '/monitor/redis',
            name: 'redis',
            component: './Redis/Redis',
          },
          {
            path: '/monitor/console',
            name: 'console',
            component: './Console/Console',
          },
        ],
      },
      {
        name: 'infrastructure',
        icon: 'infrastructure',
        path: '/infrastructure',
        routes: [
          {
            path: '/infrastructure/customer',
            name: 'customer',
            component: './Customer/Customer',
          },
          {
            path: '/infrastructure/warePosition',
            name: 'warePosition',
            component: './WarePosition/WarePosition',
          },
          {
            path: '/infrastructure/goodsType',
            name: 'goodsType',
            component: './GoodsType/GoodsType',
          },
          {
            path: '/infrastructure/store',
            name: 'store',
            component: './Store/Store',
          },
        ],
      },
      {
        name: 'warehouse',
        icon: 'warehouse',
        path: '/warehouse',
        routes: [
          {
            path: '/warehouse/warePosition',
            name: 'warePosition',
            component: './WarePosition/WarePosition',
          },
          {
            path: '/warehouse/wareZone',
            name: 'wareZone',
            component: './WareZone/WareZone',
          },
          {
            path: '/warehouse/auditReceiveGoods/:id',
            name: 'auditReceiveGoods',
            component: './ReceiveGoods/AuditReceiveGoods',
            hideInMenu: true,
          },
          {
            path: '/warehouse/auditUnloadReceiveGoods/:id',
            name: 'auditUnloadReceiveGoods',
            component: './ReceiveGoods/AuditUnloadReceiveGoods',
            hideInMenu: true,
          },
          {
            path: '/warehouse/viewReceiveGoods/:id',
            name: 'viewReceiveGoods',
            component: './ReceiveGoods/ViewReceiveGoods',
            hideInMenu: true,
          },
        ],
      },
      {
        name: 'order',
        icon: 'order',
        path: '/order',
        routes: [
          {
            path: '/order/order',
            name: 'order',
            component: './Order/Order',
          },
          {
            path: '/order/addOrder',
            name: 'addOrder',
            component: './Order/AddOrder',
          },
          {
            path: '/order/editOrder/:id',
            name: 'editOrder',
            component: './Order/EditOrder',
            hideInMenu: true,
          },
          {
            path: '/order/viewOrder/:id',
            name: 'viewOrder',
            component: './Order/ViewOrder',
            hideInMenu: true,
          },
          {
            path: '/order/importOrder',
            name: 'importOrder',
            component: './Order/ImportOrder',
          },
          {
            path: '/order/stockFlow',
            name: 'stockFlow',
            component: './StockFlow/OrderStockFlow',
          },
          {
            path: '/order/completeOrder',
            name: 'completeOrder',
            component: './Order/CompleteOrder',
          },
        ],
      },
      {
        name: 'transit',
        icon: 'transit',
        path: '/transit',
        routes: [
          {
            path: '/transit/confirmOrder',
            name: 'transit',
            component: './ConfirmOrder/Order',
          },
          {
            path: '/transit/viewOrder/:id',
            name: 'viewOrder',
            component: './ConfirmOrder/ViewOrder',
            hideInMenu: true,
          },
          {
            path: '/transit/pack',
            name: 'transit',
            component: './Pack/Pack',
          },
          {
            path: '/transit/addPack',
            name: 'addPack',
            component: './Pack/AddPack',
          },
          {
            path: '/transit/editPack/:id',
            name: 'editPack',
            component: './Pack/EditPack',
            hideInMenu: true,
          },
          {
            path: '/transit/assignPack/:id',
            name: 'assignPack',
            component: './Pack/AssignPack',
            hideInMenu: true,
          },
          {
            path: '/transit/viewPack/:id',
            name: 'viewPack',
            component: './Pack/ViewPack',
            hideInMenu: true,
          },
        ],
      },
      {
        name: 'exception',
        icon: 'warning',
        path: '/exception',
        routes: [
          // exception
          {
            path: '/exception/403',
            name: 'not-permission',
            component: './Exception/403',
          },
          {
            path: '/exception/404',
            name: 'not-find',
            component: './Exception/404',
          },
          {
            path: '/exception/500',
            name: 'server-error',
            component: './Exception/500',
          },
          {
            path: '/exception/trigger',
            name: 'trigger',
            hideInMenu: true,
            component: './Exception/TriggerException',
          },
        ],
      },
      {
        name: 'goods',
        path: '/goods',
        routes: [
          {
            path: '/goods/goods',
            name: 'goods',
            component: './Goods/Goods',
          },
          {
            path: '/goods/customer',
            name: 'customer',
            component: './Customer/Customer',
          },
        ],
      },
      {
        name: 'inventory',
        path: '/inventory',
        routes: [
          {
            path: '/inventory/stock',
            name: 'stock',
            component: './Stock/Stock',
          },
          {
            path: '/inventory/singleStock',
            name: 'singleStock',
            component: './Stock/SingleStock',
          },
          {
            path: '/inventory/countStock',
            name: 'countStock',
            component: './Stock/CountStock',
          },
          {
            path: '/inventory/stockFlow',
            name: 'stockFlow',
            component: './StockFlow/StockFlow',
          },
        ],
      },
      {
        name: 'aog',
        path: '/aog',
        routes: [
          {
            path: '/aog/receiveGoods',
            name: 'receiveGoods',
            component: './ReceiveGoods/ReceiveGoods',
          },
          {
            path: '/aog/addReceiveGoods',
            name: 'addReceiveGoods',
            component: './ReceiveGoods/AddReceiveGoods',
          },
          {
            path: '/aog/unloadReceiveGoods',
            name: 'unloadReceiveGoods',
            component: './ReceiveGoods/unloadReceiveGoods',
          },
          {
            path: '/aog/editReceiveGoods/:id',
            name: 'editReceiveGoods',
            component: './ReceiveGoods/EditReceiveGoods',
            hideInMenu: true,
          },
        ],
      },
      {
        name: 'logistics',
        path: '/logistics',
        routes: [
          {
            path: '/logistics/address',
            name: 'address',
            component: './Address/Address',
          },
          {
            path: '/logistics/addressType',
            name: 'addressType',
            component: './AddressType/AddressType',
          },
          {
            path: '/logistics/addressArea',
            name: 'addressArea',
            component: './AddressArea/AddressArea',
          },
        ],
      },
      {
        name: 'piece',
        path: '/piece',
        routes: [
          {
            path: '/piece/pickMatch',
            name: 'pickMatch',
            component: './PickMatch/PickMatch',
          },
          {
            path: '/piece/dispatchStatisticsAll',
            name: 'dispatchStatisticsAll',
            component: './Dispatch/DispatchStatisticsAll',
          },
          {
            path: '/piece/pickMatchStatistics',
            name: 'pickMatchStatistics',
            component: './PickMatchStatistics/PickMatchStatistics',
          },
          {
            path: '/piece/dispatch',
            name: 'dispatch',
            component: './Dispatch/Dispatch',
          },
          {
            path: '/piece/dispatchStatistics',
            name: 'dispatchStatistics',
            component: './Dispatch/DispatchStatistics',
          },
          {
            path: '/piece/dispatchSys',
            name: 'dispatchSys',
            component: './Dispatch/DispatchSys',
          },
          {
            path: '/piece/receiveGoodsPiece',
            name: 'receiveGoodsPiece',
            component: './ReceiveGoodsPiece/ReceiveGoodsPiece',
          },
          {
            path: '/piece/receiveGoodsPieceStatistics',
            name: 'receiveGoodsPieceStatistics',
            component: './ReceiveGoodsPieceStatistics/ReceiveGoodsPieceStatistics',
          },
          {
            path: '/piece/viewReceiveGoodsPieceSta',
            name: 'viewReceiveGoodsPieceSta',
            component: './ReceiveGoodsPieceStatistics/ViewReceiveGoodsPieceSta',
          },
        ],
      },
      {
        name: 'fixedEstate',
        path: '/fixedEstate',
        routes: [
          {
            path: '/fixedEstate/fixedEstate',
            name: 'fixedEstate',
            component: './FixedEstate/FixedEstate',
          },
        ],
      },
      {
        name: 'carBasic',
        path: '/carBasic',
        routes: [
          {
            path: '/carBasic/carBasic',
            name: 'carBasic',
            component: './Car/CarBasic',
          },
          {
            path: '/carBasic/carCost',
            name: 'carCost',
            component: './Car/CarCost',
          },
        ],
      },
      {
        name: 'logisticses',
        path: '/logisticses',
        routes: [
          {
            path: '/logisticses/logisticsDetail',
            name: 'logisticsDetail',
            component: './Logistics/LogisticsDetail',
          },
          {
            path: '/logisticses/logisticsTemplate',
            name: 'logisticsTemplate',
            component: './Logistics/LogisticsTemplate',
          },
          {
            path: '/logisticses/logisticsStatistics',
            name: 'logisticsStatistics',
            component: './Logistics/LogisticsStatistics',
          },
        ],
      },
      {
        component: '404',
      },
    ],
  },
];
