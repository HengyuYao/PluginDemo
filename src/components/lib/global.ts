export const COLOR = [
  '#3683FF',
  '#B0D6FF',
  '#FFC400',
  '#36B37E',
  '#4B8BFF',
  '#2EC7C9',
  '#B6A2DE',
  '#5AB1EF',
  '#FFB980',
  '#D87A80',
  '#8D98B3',
  '#E5CF0D',
  '#97B552',
  '#95706D',
  '#91B6F8',
  '#DC69AA',
  '#07A2A4',
  '#9A7FD1',
  '#588DD5',
  '#F5994E',
  '#FF95AD',
  '#9096BB',
  '#D5B394',
];

export const LABEL_TYPE = [
  {
    type: 'pie',
    label2: '维度',
    label3: '值',
  },
  {
    type: 'line',
    label2: 'X轴',
    label3: 'Y轴',
  },
  {
    type: 'bar',
    label2: 'X轴',
    label3: 'Y轴',
  },
];

export const INSIGHT_DRILL_DOWN_DATA = [
  {
    code: 'wb_card_userStoryDepartmentStatistics',
    name: '业务需求按提出部门',
    isEnable: 1,
    context: [
      {
        name: '主键',
        column: 'id',
        storeType: 'Number',
        businessType: 'Dimension',
      },
      {
        name: '事项类型id',
        column: 'itemType',
        storeType: 'String',
        businessType: 'Dimension',
      },
      {
        name: '系统ID',
        column: 'group_id',
        storeType: 'String',
        businessType: 'Dimension',
      },
      {
        name: '统计年份',
        column: 'statistics_year',
        storeType: 'Number',
        businessType: 'Dimension',
      },
      {
        name: '统计时间（格式 2022-01）',
        column: 'statistics_time',
        storeType: 'String',
        businessType: 'Dimension',
      },
      {
        name: '卡片总数',
        column: 'total_count',
        storeType: 'Number',
        businessType: 'Dimension',
      },
      {
        name: '上线卡片总数',
        column: 'online_count',
        storeType: 'Number',
        businessType: 'Dimension',
      },
      {
        name: '租户',
        column: 'tenant',
        storeType: 'String',
        businessType: 'Dimension',
      },
    ],
  },
  {
    code: 'wb_card_demand_workspace_statistics',
    name: '需求条目按所属系统',
    isEnable: 1,
    context: [
      {
        name: '主键',
        column: 'id',
        storeType: 'Number',
        businessType: 'Dimension',
      },
      {
        name: '事项类型id',
        column: 'itemType',
        storeType: 'String',
        businessType: 'Dimension',
      },
      {
        name: '空间ID',
        column: 'group_id',
        storeType: 'String',
        businessType: 'Dimension',
      },
      {
        name: '统计年份',
        column: 'statistics_year',
        storeType: 'Number',
        businessType: 'Dimension',
      },
      {
        name: '统计时间（格式 2022-01）',
        column: 'statistics_time',
        storeType: 'String',
        businessType: 'Dimension',
      },
      {
        name: '卡片总数',
        column: 'total_count',
        storeType: 'Number',
        businessType: 'Dimension',
      },
      {
        name: '上线卡片总数',
        column: 'online_count',
        storeType: 'Number',
        businessType: 'Dimension',
      },
      {
        name: '租户',
        column: 'tenant',
        storeType: 'String',
        businessType: 'Dimension',
      },
    ],
  },
  {
    code: 'wb_card_demand_system_statistics',
    name: '需求条目按所属团队',
    isEnable: 1,
    context: [
      {
        name: '主键',
        column: 'id',
        storeType: 'Number',
        businessType: 'Dimension',
      },
      {
        name: '事项类型id',
        column: 'itemType',
        storeType: 'String',
        businessType: 'Dimension',
      },
      {
        name: '部门ID',
        column: 'group_id',
        storeType: 'String',
        businessType: 'Dimension',
      },
      {
        name: '统计年份',
        column: 'statistics_year',
        storeType: 'Number',
        businessType: 'Dimension',
      },
      {
        name: '统计时间（格式 2022-01）',
        column: 'statistics_time',
        storeType: 'String',
        businessType: 'Dimension',
      },
      {
        name: '卡片总数',
        column: 'total_count',
        storeType: 'Number',
        businessType: 'Dimension',
      },
      {
        name: '上线卡片总数',
        column: 'online_count',
        storeType: 'Number',
        businessType: 'Dimension',
      },
      {
        name: '租户',
        column: 'tenant',
        storeType: 'String',
        businessType: 'Dimension',
      },
    ],
  },
];

// 查询数据集接口参数
export const REQUEST_METHOD = {
  code: 'wb_card_demand_workspace_statistics',
  dimensions: [
    {
      column: 'statistics_time',
    },
    {
      column: 'total_count',
    },
    {
      column: 'online_count',
    },
  ],
  whereList: [
    {
      column: 'statistics_year',
      symbol: 'eq',
      value: ['2021'],
    },
    {
      column: 'tenant',
      symbol: 'eq',
      value: ['9di2FDbScG'],
    },
  ],
  orderList: [
    {
      column: 'statistics_time',
      order: 'ASC',
    },
  ],
};

// 默认值
export const INIT_VALUE = {
  group: [{ key: 'r_remote_field_dep', name: '提出部门', fieldType: 'Dropdown', value: 'r_remote_field_dep' }],
  value: [{ key: 'XQ', name: '业务需求', fieldType: 'ItemType' }],
  type: 'hs-heap-bar-chart',
};

// 业务需求
export const XQ = 'XQ';
// 需求条目
export const TM = 'TM';
// 柱状图
export const BASIC_PIE_CHART = 'basic-pie-chart';

export const HS_ITSM_EVENTS_COUNT = 'hs-itsm-events-count';
// 全局图表图例设置
export const GLOBAL_CHART_LEGEND = {
  origin: 'vertical',
  x: 'right',
  padding: [30, 50, 0, 0],
  textStyle: {
    padding: [10, 0, 0, 0],
  },
  formatter: '{name}',
  label: {
    show: true,
    formatter: '{b}: {d}%',
  },
};
