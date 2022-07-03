import useSWR from 'swr';
import fetch from 'proxima-sdk/lib/Fetch';
import { useToken } from 'proxima-sdk/hooks/Hooks';
import { BASIC_PIE_CHART } from '../global';

enum GroupName {
  department = '提出部门',
  system = '所属系统',
  team = '所属团队',
}

const useItemStatus = (option, xData) => {
  const { sessionToken } = useToken();
  const { data, isValidating } = useSWR(isValid(option, xData) && sessionToken && [option, xData], async () => {
    const url = `${globalThis.env.PROXIMA_GATEWAY}/parse/api/report/${BASIC_PIE_CHART}/search`;

    // 请求下钻状态参数
    const dsl = getDSL(option, xData);
    if (!dsl) return null;

    const params = {
      group: [{ key: 'status', name: '状态', fieldType: 'Status' }],
      value: [{ key: 'count', name: '事项数', compute: 'count', fieldType: 'count' }],
      dsl,
    };

    try {
      const data = await fetch.$post(url, params);
      const enableSave = true;

      const result = getStatisticalResult(option.group[0].name, data?.payload?.value);

      return { data: result, enableSave };
    } catch {
      const data = [];
      const enableSave = false;
      return { data, enableSave };
    }
  });

  const result = data?.data;

  return {
    result,
    isLoading: isValidating,
  };
};

function isValid(option, xData) {
  const groupName = option?.group?.[0].name;
  const valueName = option?.value?.[0].name;
  const key = xData?.key;
  const systems = xData?.systems;

  if (!groupName || !valueName || !key) return false;
  if (groupName === GroupName.team && !systems) return false;
  return true;
}

// 拼接 DSL 语句
function getDSL(option, xData) {
  const name = option.group[0].name;
  const valueName = option.value[0].name;
  const key = xData.key;
  const systems = xData?.systems;
  const firstDayOfCurrentYear = new Date(new Date().getFullYear(), 0, 1);
  const finishStatusName = name === GroupName.department ? ['部分上线', '全部上线'] : ['已上线'];

  const shouldCondition = {
    should: [
      {
        range: {
          createdAt: {
            gte: firstDayOfCurrentYear,
          },
        },
      },
      {
        bool: {
          must: [
            {
              range: {
                createdAt: {
                  lt: firstDayOfCurrentYear,
                },
              },
            },
          ],
          should: [
            {
              range: {
                'finishAt#Date': {
                  gte: firstDayOfCurrentYear,
                },
              },
            },
            {
              bool: {
                must_not: [
                  {
                    terms: {
                      'statusName.keyword': finishStatusName,
                    },
                  },
                ],
              },
            },
          ],
          minimum_should_match: 1,
        },
      },
    ],
    minimum_should_match: 1,
  };

  switch (name) {
    case GroupName.department:
      return {
        query: {
          bool: {
            must: [
              {
                term: {
                  'r_remote_field_dep#r_remote_field_remote_department_field_type.keyword': key,
                },
              },
              {
                term: {
                  'itemTypeName.keyword': valueName,
                },
              },
            ],
            ...shouldCondition,
          },
        },
      };
    case GroupName.system:
      return {
        query: {
          bool: {
            must: [
              {
                term: {
                  workspaceKey: key,
                },
              },
              {
                term: {
                  'itemTypeName.keyword': valueName,
                },
              },
            ],
            ...shouldCondition,
          },
        },
      };
    case GroupName.team:
      return {
        query: {
          bool: {
            must: [
              {
                terms: {
                  workspaceKey: systems,
                },
              },
              {
                term: {
                  'itemTypeName.keyword': valueName,
                },
              },
            ],
            ...shouldCondition,
          },
        },
      };
  }
}

// 最终统计结果
function getStatisticalResult(name: string, value = []) {
  switch (name) {
    case GroupName.department: {
      const result = [
        {
          name: '待提交',
          value: 0,
        },
        {
          name: '待分析',
          value: 0,
        },
        {
          name: '开发中',
          value: 0,
        },
        {
          name: '已上线',
          value: 0,
        },
      ];
      value.forEach(status => {
        if (['待提交', '待分析', '需求审核中', '待创建分析任务'].includes(status.name)) {
          result[0].value += status.value;
        } else if (['分析中', '需求团队确认', '待业务确认', '待导出审批单', '待业务审批'].includes(status.name)) {
          result[1].value += status.value;
        } else if (
          ['需求设计中', '牵头人确认', '需求开发中', '系统集成测试', '用户验收测试', '待投产'].includes(status.name)
        ) {
          result[2].value += status.value;
        } else if (['部分上线', '全部上线'].includes(status.name)) {
          result[3].value += status.value;
        }
      });
      return result;
    }
    case GroupName.system:
    case GroupName.team: {
      const result = [
        {
          name: '待开发',
          value: 0,
        },
        {
          name: '开发中',
          value: 0,
        },
        {
          name: '已上线',
          value: 0,
        },
      ];
      value.forEach(status => {
        if (['待开发'].includes(status.name)) {
          result[0].value += status.value;
        } else if (['开发中', '开发单测完成'].includes(status.name)) {
          result[1].value += status.value;
        } else if (['已上线'].includes(status.name)) {
          result[2].value += status.value;
        }
      });
      return result;
    }
  }
}
export default useItemStatus;
