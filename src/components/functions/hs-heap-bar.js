/**
 * 新增、留存的堆积统计。
 * 接收参数：
 *   method-方法：aggsAdaptor | formater | exporter
 *   body: ReportBody 报表请求参数
 *   src: ESResult[] es统计结果
 * 统计方式：
 *   将事项按年分组，今年的都是新增，之前的都是留存。
 *
 * 注：事项类型条件写在IQL中，此处无需处理。
 * 需要的条件：事项类型 = '需求条目|用户事故'
 */

const args = [method, body, src]; // 接收的参数，仅用于增加可读性，无意义
const DEFAULT_TOP = 9999; // 默认取 top 9999
const FIELD_TYPE = {
  workspace: 'BindWorkspace',
  department: 'r_remote_field_remote_department_field_type.keyword',
};

const methodMap = {
  /**
   * 生成 es 统计语句
   * @param {*} body
   */
  async aggsAdaptor(body) {
    if (body?.group?.length !== 1 || body?.value?.length !== 1) {
      throw new Error('统计参数有误');
    }
    const group = body.group[0];
    const value = body.value[0];

    if (value.compute !== 'count') {
      throw new Error('统计方式只能是count');
    }

    let esKey;
    // 判断统计字段，取值： Workspace, department
    switch (group.fieldType) {
      case FIELD_TYPE.workspace:
        esKey = 'workspaceKey'; // 由于插件 apis 不支持使用 objectId 一次查询多条数据，但是支持查询多条 workspaceKey
        break;
      case FIELD_TYPE.department:
        esKey = group.key + '#' + group.fieldType;
        break;
      default:
        throw new Error(`不支持的字段类型:${group.key}[${group.fieldType}]`);
    }

    // es 统计语句
    const aggs = {
      createdAt: {
        date_histogram: {
          field: 'createdAt',
          interval: 'year',
        },
        aggs: {
          group: {
            terms: {
              field: esKey,
              size: 9999,
            },
            aggs: {
              statusName: {
                terms: {
                  field: 'statusName.keyword',
                  size: 9999,
                },
                aggs: {
                  finishAt: {
                    terms: {
                      field: 'finishAt#Date',
                      size: 9999,
                    },
                  },
                },
              },
            },
          },
        },
      },
    };
    return [aggs];
  },

  /**
   * 将es统计结果格式化为图表需要的类型
   * @param {*} body
   * @param {*} src
   */
  async formater(body, src) {
    if (!src[0]?.aggregations?.createdAt?.buckets?.length) {
      return {
        xAxis: [],
        data: [],
      };
    }
    const group = body.group[0];
    const orderBy = body.orderBy || { type: 'desc' }; // 排序字段
    // 保存中间数据，格式：key='部门|团队 key', value={ name: '部门|团队名', key: '部门|团队 key', oldData: 留存数, newData: 新增数  }
    const dataTmp = {};
    const thisYear = new Date(new Date().getFullYear() + '-01-01').getTime();
    const yearBuckets = src[0].aggregations.createdAt.buckets; // es结果，年份
    for (let year of yearBuckets) {
      for (let _group of year.group.buckets) {
        // gb.key为 部门|团队 key
        const groupData = dataTmp[_group.key] || {
          key: _group.key,
          name: _group.key,
          oldData: 0,
          newData: 0,
        };
        dataTmp[_group.key] = groupData;
        for (let statusName of _group.statusName.buckets) {
          if (year.key >= thisYear) {
            // 新增的情况，所有状态累加
            groupData.newData += statusName.doc_count;
          } else {
            // 留存的情况，只记录：1. 提出部门，状态不等于 “全部上线” 2. 其他，状态不等于 “已上线”
            const finishAt = statusName.finishAt.buckets?.[0]?.key;
            const currentYear = new Date().getFullYear();
            const finishYear = finishAt && new Date(finishAt).getFullYear();
            if (group.fieldType === FIELD_TYPE.department) {
              if (!['部分上线', '全部上线'].includes(statusName.key)) {
                groupData.oldData += statusName.doc_count;
              } else {
                if (finishYear && currentYear === finishYear) {
                  groupData.oldData += statusName.doc_count;
                }
              }
            } else {
              if (statusName.key !== '已上线') {
                groupData.oldData += statusName.doc_count;
              } else {
                if (finishYear && currentYear === finishYear) {
                  groupData.oldData += statusName.doc_count;
                }
              }
            }
          }
        }
      }
    }

    // 处理 value -> label
    if (group.fieldType === FIELD_TYPE.workspace) {
      // 处理空间
      const ws = await apis.getWorkspaceByKeys(Object.keys(dataTmp));
      ws.forEach(w => (dataTmp[w.get('key')].name = w.get('name')));
    } else {
      // 处理dropdown
      const field = await apis.getData(false, 'CustomField', { key: group.key });
      field?.get('data')?.customData?.forEach(d => dataTmp[d.value] && (dataTmp[d.value].name = d.label));
    }

    // 处理排序
    const dataArray = Object.values(dataTmp)
      .sort((a, b) => {
        if (orderBy.type === 'desc') {
          return b.oldData + b.newData - a.oldData - a.newData;
        } else {
          return a.oldData + a.newData - b.oldData - b.newData;
        }
      })
      // 处理 size
      .slice(0, group.size ?? DEFAULT_TOP);

    // 转为最终格式
    return {
      xAxis: dataArray.map(v => ({ key: v.key, value: v.name })),
      data: [
        {
          data: dataArray.map(v => v.newData),
          name: '本年',
        },
        {
          data: dataArray.map(v => v.oldData),
          name: '存量',
        },
      ],
    };
  },

  /**
   * 将es统计结果格式化为 xlsx-node 需要的类型
   * @param {*} body
   * @param {*} src
   */
  async exporter(body, [src]) {
    throw new Error('不支持导出!');
  },
};

// 执行
if (methodMap[method]) {
  return await methodMap[method].bind(this)(...args.slice(1));
} else {
  throw new Error('无效的 method');
}
