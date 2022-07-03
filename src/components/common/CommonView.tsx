// @ts-nocheck
import React, { useEffect, useState } from 'react';
import * as echarts from 'echarts';

import { NoData } from 'proxima-sdk/components/Components/Chart';

import { CommonViewProp } from '../lib/type';

const CommonView: React.FC<CommonViewProp> = props => {
  const { echartData, id, option, isListView, isNoData } = props;
  const [echart, setEChart] = useState(null);

  useEffect(() => {
    const dom = document.getElementById(id);
    if (dom) {
      const echart = echarts.init(dom);
      setEChart(echart);
    }
    return () => {
      document.getElementById(id)?.remove();
    };
    // 只有一次渲染触发
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!isNoData) {
      echart && echart.setOption(echartData, true);
    }
  }, [echart, echartData, isNoData]);

  // 尺寸变化需要重新resize echarts
  useEffect(() => {
    echart && echart.resize();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [echart, option?.w]);

  return (
    <>
      {isNoData ? <NoData title="暂无数据，请修改图表数据配置" isListView={isListView} /> : null}
      <div id={id} className={'view echarts-view'} />
    </>
  );
};

export default CommonView;
