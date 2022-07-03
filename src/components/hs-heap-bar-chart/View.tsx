import React, { useEffect, useMemo, useState } from 'react';

import { useHSHeapChartQuery } from '../lib/hooks/useHSHeapChartQuery';
import { useToken } from 'proxima-sdk/hooks/Hooks';
import CommonView from './CommonView';
import { COLOR, GLOBAL_CHART_LEGEND } from '../lib/global';
import { ChartDataProps, ViewProps } from '../lib/type';
import { cloneDeep } from 'lodash';
import Parse from 'proxima-sdk/lib/Parse';
import useParseQuery, { FetchMethod } from 'proxima-sdk/hooks/useParseQuery';
import { CustomField } from 'proxima-sdk/schema/models';
import { useIQLSearch } from 'proxima-sdk/hooks/useParseQuery';

const View: React.FC<ViewProps> = ({ random, option, isListView, workspace, sessionToken, name }) => {
  const id = random ? random : 'hs-heap-chart';
  const { checked, value } = option;
  const { tenant } = useToken();

  // 查询所有团队
  const query = new Parse.Query(CustomField).equalTo('name', '所属团队').select('data');
  const { data: teamsResponse } = useParseQuery(query, FetchMethod.First);

  const teamsData = useMemo(() => {
    return teamsResponse?.data?.customData || [];
  }, [teamsResponse]);

  // 查询 "基础数据" 空间中的 "系统清单" 事项类型
  const iqlParams = {
    iql: `'所属空间' in ["基础数据"] and '事项类型' in ["系统清单"]`,
  };
  const { items: itemsData } = useIQLSearch(iqlParams);

  // 组合团队和绑定空间拿到映射关系
  const teams = useMemo(() => {
    if (!teamsData || !itemsData) {
      return [];
    }
    return teamsData.map(team => {
      team.systems = [];
      itemsData.forEach(item => {
        const pg_emp_team = item?.values?.pg_emp_team;
        const bind_system = item?.values?.bind_system;
        if (pg_emp_team && pg_emp_team.includes(team.value)) {
          bind_system && team.systems.push(bind_system);
        }
      });
      return team;
    });
  }, [teamsData, itemsData]);

  const { chartData: _chartData, isNoData = true } = useHSHeapChartQuery(option, teams);
  const chartData = _chartData as ChartDataProps;
  const [_echartData, setEchartData] = useState([]);

  useEffect(() => {
    const _data = cloneDeep(chartData?.payload?.data) || [];
    let dataTotal = cloneDeep(_data[0]?.data);
    // 添加总数
    _data.map((item, index) => {
      item.type = 'bar';
      if (index > 0) {
        item.data.forEach((itemData, _index) => {
          dataTotal[_index] = dataTotal[_index] + itemData;
        });
      }
    });
    const data = [{ data: dataTotal, type: 'bar' }].concat(_data);
    setEchartData(data);
  }, [chartData]);

  // echarts点击时间获取不到自定义的x轴id，
  const { echartData, series, xData } = useMemo(() => {
    const series = [];

    // 改为data
    _echartData.map((item, index) => {
      if (index > 0) {
        item.stack = 'x';
        item.itemStyle = {
          normal: {
            label: {
              show: checked,
              position: 'inside',
              formatter: params => {
                return params.value !== 0 ? params.value : '';
              },
            },
          },
        };
        series.push(item);
      }
    });

    if (checked && _echartData.length) {
      series.unshift({
        data: _echartData[0].data,
        type: _echartData[0].type,
        // stack: 'x',
        barGap: '-100%', //偏移，不在同一柱子上叠加
        itemStyle: {
          normal: {
            color: 'rgba(128, 128, 128, 0)',
            label: {
              show: true,
              position: 'top',
              formatter: '{c}',
            },
          },
        },
      });
    } else {
      series.forEach((item, index) => {
        if (item === _echartData[0]) {
          series.splice(index, 1);
        }
      });
    }

    const x_data = chartData?.payload?.xAxis || [];

    const legend = [];

    series.forEach(item => {
      legend.push(item.name);
    });
    const xyData = {
      xAxis: {
        type: 'category',
        data: x_data,
      },
      yAxis: {
        type: 'value',
        name: legend,
        position: 'left',
        axisLine: {
          show: true,
        },
        axisLabel: {
          formatter: '{value}',
        },
      },
      legend: {
        ...GLOBAL_CHART_LEGEND,
        data: legend,
        show: !isListView,
      },
      series: series,
      color: COLOR,
      barMaxWidth: 40,
      grid: {
        top: 50,
        right: 40,
        left: 50,
        bottom: 50,
      },
    };
    return {
      echartData: {
        ...xyData,
        tooltip: {
          // trigger: 'axis',
          axisPointer: {
            type: 'cross',
          },
        },
      },
      series,
      xData: x_data,
    };
  }, [checked, value, _echartData, chartData]);

  /**
   * name:报表名称，Xdata：x轴的数据，series：堆积柱状图数据
   * 将x轴数据传递，以便确定堆积柱状图点击的是哪个x轴，方便拿到x轴对应的标识符去请求数据
   */
  return (
    <CommonView
      echartData={echartData}
      id={id}
      option={option}
      isListView={isListView}
      isNoData={isNoData}
      name={name}
      xData={xData}
      series={series}
      value={value}
      tenant={tenant}
      workspace={workspace}
      sessionToken={sessionToken}
    />
  );
};

export default View;
