import React, { useEffect, useState } from 'react';
import * as echarts from 'echarts';
import { NoData } from 'proxima-sdk/components/Components/Chart';
import { Modal } from 'antd';
import ModalContent from './ModalContent';
import { CommonViewProps } from '../lib/type';
import cx from './CommonView.less';

const CommonView: React.FC<CommonViewProps> = props => {
  const {
    echartData,
    id,
    option,
    isListView,
    isNoData,
    name,
    xData: _xData,
    series,
    tenant,
    workspace,
    sessionToken,
  } = props;
  const { checked } = option;
  const [echart, setEChart] = useState(null);

  // x轴名称，对应弹窗title
  const [echartParams] = useState(null);
  const [visible, setVisible] = useState(false);
  // 点击柱状图数据总和
  const [totalCount, setTotalCount] = useState(0);
  // 点击时对应的x轴的信息
  const [xData, setXData] = useState(null);
  // 点击时此柱状图的数据与名称
  const [data, setData] = useState(null);
  const [seriesData, setSeriesData] = useState([]);

  useEffect(() => {
    const dom = document.getElementById(id);
    if (dom) {
      const echart = echarts.init(dom);
      setEChart(echart);
      // 每小段柱子都有点击事件，此方法对应每个小柱子都可点击，柱子以外的白色不能点击，空白柱子(总数)此处未验证
    }

    return () => {
      dom?.remove();
    };

    // 只有一次渲染触发
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (isListView || !echart) return;

    echart.on('click', function (params) {
      let xIndex = params?.dataIndex;

      // 点击的柱子的数据，名称等
      setData(params?.name);

      // 点击的x轴数据,此处保证点击时的x轴的数据是页面显示的数据
      if (xIndex <= _xData?.length && _xData[xIndex]?.value === params?.name) {
        setXData(_xData[xIndex]);
      }

      setVisible(true);
      const seriesData = [];
      let count = 0;

      // check=true series.length=3
      series.map((ser, index) => {
        if (!(checked && index == 0)) {
          if (ser?.data?.length) {
            count += ser?.data[xIndex];
            seriesData.push({ name: ser.name, count: ser?.data[xIndex] });
          }
        }
      });
      // 当前柱子值的总和
      setTotalCount(count);
      setSeriesData(seriesData);
    });
  }, [_xData, series]);

  useEffect(() => {
    if (!isNoData) {
      echart && echart.setOption(echartData, true);
    }
  }, [echart, echartData, isNoData]);

  // 尺寸变化需要重新resize echarts
  useEffect(() => {
    echart && echart.resize();
  }, [echart, option?.w]);

  return (
    <>
      {isNoData ? <NoData title="暂无数据，请修改图表数据配置" isListView={isListView} /> : null}
      <div id={id} className={'view echarts-view'} />
      {visible && (
        <Modal
          visible={visible}
          onOk={() => {
            setVisible(false);
            setXData(null);
          }}
          onCancel={() => {
            setVisible(false);
            setXData(null);
          }}
          className={cx('modal')}
          title={data}
          width={1000}
          footer={null}
        >
          <ModalContent
            echartParams={echartParams}
            isListView={isListView}
            name={name}
            totalCount={totalCount}
            xData={xData}
            tenant={tenant}
            option={option}
            workspace={workspace}
            sessionToken={sessionToken}
          />
        </Modal>
      )}
    </>
  );
};

export default CommonView;
