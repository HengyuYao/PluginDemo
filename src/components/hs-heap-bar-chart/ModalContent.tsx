import React, { useMemo, useState, useEffect, useCallback } from 'react';
import * as echarts from 'echarts';
import { HeapModalProps } from '../lib/type';
import { COLOR, REQUEST_METHOD } from '../lib/global';
import cx from './ModalContent.less';
import fetch from 'proxima-sdk/lib/Fetch';
import { cloneDeep } from 'lodash';
import useItemStatus from '../lib/hooks/useItemStatus';
import { EmptyData } from '../icons';
import { setDataCode } from '../lib/utils';

const ModalContent: React.FC<HeapModalProps> = ({
  echartParams,
  isListView,
  totalCount,
  xData: _xData,
  tenant,
  option,
}) => {
  const { result: chartData = [] } = useItemStatus(option, _xData);
  const [lineChartData, setLineChartData] = useState([]);
  const [lineXData, setLineXData] = useState([]);
  const echartData = useMemo(() => {
    const legend = [];
    if (!lineChartData?.length) {
      return;
    }
    lineChartData.forEach(item => {
      legend.push(item.name);
    });
    const xyData = {
      xAxis: {
        data: lineXData,
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
      color: COLOR,
      series: lineChartData,
      legend: {
        data: legend,
        show: !isListView,
        origin: 'vertical',
        right: 0,
        textStyle: {
          padding: [10, 0, 0, 0],
        },
        formatter: '{name}',
        label: {
          show: true,
          formatter: '{b}: {d}%',
        },
      },
    };
    return {
      ...xyData,
      tooltip: {
        axisPointer: {
          type: 'cross',
        },
      },
    };
  }, [echartParams, lineChartData, lineXData]);

  useEffect(() => {
    if (echartData) {
      const modalEchart = echarts.init(document.getElementById('hs-heap-bar-line'));
      modalEchart && modalEchart.setOption(echartData, true);
    }
  }, [echartData]);

  const searchDataResult = useCallback(async () => {
    let data = cloneDeep(REQUEST_METHOD);
    const date = new Date();
    data.whereList[0].value = [`${date.getFullYear()}`];
    data.whereList[1].value = [`${tenant}`];
    if (!_xData) {
      return;
    }
    data.whereList.push({
      column: 'group_id',
      symbol: 'eq',
      value: [_xData?.key],
    });
    // 下钻接口，使用时修改code与whereList
    data.code = setDataCode(option?.group[0]?.name);
    const dataResultUrl = `${globalThis.env.PROXIMA_GATEWAY}/parse/api/report/data-set/result`;
    const _data = await fetch.$post(dataResultUrl, data);
    let seriesData = [
      {
        data: [],
        type: 'line',
        name: '卡片总数',
      },
      {
        data: [],
        type: 'line',
        name: '上线卡片总数',
      },
    ];
    // insight请求回来的数据封装成折线图使用的格式
    const xData = [];
    const { records } = _data?.payload?.content;
    if (records?.length) {
      records.forEach(item => {
        seriesData[0].data.push(item?.total_count);
        seriesData[1].data.push(item?.online_count);
        xData.push(item?.statistics_time);
      });
    }

    setLineChartData(seriesData);
    setLineXData(xData);
  }, [tenant, _xData, option]);

  useEffect(() => {
    searchDataResult();
  }, [searchDataResult]);

  return (
    <>
      <div className={cx('data')}>
        <span className={cx('title')}>
          <span>{totalCount}</span>
          <span>总数</span>
        </span>
        {chartData?.map(item => {
          return (
            <span className={cx('title')}>
              <span>{item.value}</span>
              <span>{item.name}</span>
            </span>
          );
        })}
      </div>
      <div className={cx('chart')}>
        {/* 暂无数据样式 */}
        {!lineXData?.length ? (
          <div className={cx('no-data')}>
            <div className={cx('no-data-inner')}>
              <EmptyData />
              <p className={cx('title')}>暂无数据</p>
            </div>
          </div>
        ) : null}
        <div className={cx('line-wrap')}>
          <div id={'hs-heap-bar-line'} className={cx('line')} />
        </div>
      </div>
    </>
  );
};

export default ModalContent;
