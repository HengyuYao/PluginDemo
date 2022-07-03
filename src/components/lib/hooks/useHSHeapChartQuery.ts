import { isEmpty, cloneDeep, uniq } from 'lodash';
import useSWR from 'swr';

import Parse from 'proxima-sdk/lib/Parse';
import fetch from 'proxima-sdk/lib/Fetch';
import { OptionValue } from '../type';
import { useToken } from 'proxima-sdk/hooks/Hooks';
import { isOptionValid } from '../utils';
export const useHSHeapChartQuery = (
  option: OptionValue,
  teams?: {
    label: string;
    value: string;
    systems: any[];
  }[],
): {
  chartData: Record<string, unknown>;
  isNoData: boolean;
  enableSave: boolean;
  isLoading: boolean;
} => {
  const { sessionToken } = useToken();

  const { data, isValidating } = useSWR(
    isOptionValid(option) && sessionToken && teams && [option, teams],
    async option => {
      const url = `${globalThis.env.PROXIMA_GATEWAY}/parse/api/report/plugin--hs-heap-bar/search`;
      const { group, value: _value, iql: _iql, orderBy: _orderBy } = option;
      const isQueryTeams = group?.[0]?.name === '所属团队';
      let iql = _iql || '';
      // y轴所选内容写入iql进行请求
      if (_value?.length) {
        const valueIql = `'事项类型' in ['${_value[0].name}']`;
        iql = !iql ? valueIql : iql + ' and ' + valueIql;
      }
      let newTeams = [];
      // 如果是所属团队，要限定空间
      if (isQueryTeams) {
        if (!teams?.length) {
          const data = {};
          const enableSave = false;
          return { data, enableSave };
        }
        // 拿到所有空间id并去重
        const systems = teams.reduce((acc, cur) => {
          if (!cur?.systems.length) {
            return acc;
          }
          acc = cur.systems.concat(acc);
          return acc;
        }, []);
        const workspaceIds = uniq(systems);
        if (workspaceIds?.length) {
          // 根据 workspace id 获取空间名称
          const result = await new Parse.Query('Workspace').containedIn('objectId', workspaceIds).findAll();
          const workspaceNames = result.map(item => item.get('name'));
          iql = iql + ' and ' + `'所属空间' in ['${workspaceNames.join("','")}']`;
          // 获取空间 id 和 空间名称 key 对应关系并加到 teams 上
          newTeams = teams.map(team => {
            return {
              ...team,
              systems: team.systems.map(system => {
                const workspace = result.find(item => item.id === system);
                return {
                  id: system,
                  name: workspace?.get('name'),
                  key: workspace?.get('key'),
                };
              }),
            };
          });
        }
      }
      const value = cloneDeep(_value);
      const orderBy = cloneDeep(_orderBy);
      if (group?.length && value?.length) {
        value[0]['compute'] = 'count';
      }
      if (orderBy) {
        orderBy.key = value[0]?.key;
      }
      const searchData = {
        group,
        value,
        iql,
        ...(!isEmpty(orderBy) && { orderBy }),
      };

      try {
        const data = await fetch.$post(url, searchData);
        const enableSave = true;
        if (isQueryTeams) {
          // 组装数据
          data.payload = convertWokspaceToTeam(data?.payload, newTeams, _orderBy?.type, group?.[0]?.size);
        }
        return { data, enableSave };
      } catch (error) {
        const data = {};
        const enableSave = false;
        return { data, enableSave };
      }
    },
  );
  /**
   * fetchError用来判断接口报错，500等
   */
  const chartData = data?.data;
  const enableSave = data?.enableSave;

  return {
    chartData,
    isNoData: !(chartData && chartData?.payload?.xAxis?.length),
    enableSave: enableSave,
    isLoading: isValidating,
  };
};

// result 统计结果
function convertWokspaceToTeam(result, teams, orderBy = 'desc', size) {
  // size 可能传进来 null 值，不能在参数上设定默认值
  size = size ?? 9999;
  const dataTemp = [...teams];

  // 转换空间统计数据的格式
  const dataCurrent = result.data.find(item => item.name === '本年');
  const dataPast = result.data.find(item => item.name === '存量');
  if (!dataCurrent || !dataPast) return;

  const dataConverted = dataTemp.map(team => {
    const { systems } = team;
    const keys = systems.map(system => system.key);
    let newData = 0;
    let oldData = 0;
    keys.forEach(key => {
      const index = result.xAxis.findIndex(item => item.key === key);
      if (index !== -1) {
        newData += dataCurrent.data[index];
        oldData += dataPast.data[index];
      }
    });

    return {
      ...team,
      newData,
      oldData,
    };
  });
  // 处理排序和返回结果数
  const dataArray = dataConverted
    .sort((a, b) => {
      if (orderBy === 'desc') {
        return b.oldData + b.newData - a.oldData - a.newData;
      } else {
        return a.oldData + a.newData - b.oldData - b.newData;
      }
    })
    .slice(0, size);

  // 最终格式
  const resultConverted = {
    xAxis: dataArray.map(team => {
      return {
        key: team.value,
        value: team.label,
        systems: team.systems.map(system => system.key),
      };
    }),
    data: [
      {
        name: '本年',
        data: dataArray.map(item => item.newData),
      },
      {
        name: '存量',
        data: dataArray.map(item => item.oldData),
      },
    ],
  };

  return resultConverted;
}

export default useHSHeapChartQuery;
