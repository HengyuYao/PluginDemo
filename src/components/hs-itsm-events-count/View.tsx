import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { Tooltip, message } from 'antd';
import axios from 'axios';

import { ViewProps } from '../lib/type';
import { openNewTabWithoutBubble } from '../lib/utils';
import { getCountFontSize } from '../lib/utils';
import { HS_ITSM_EVENTS_COUNT } from 'proxima-sdk/lib/Global';

import cx from '../common/CountView.less';
import buildUrlSm4 from './sm4';

export type ITSM_TODO_RESPONSE = {
  data: {
    todoNum: string;
  }
}

const View: React.FC<ViewProps> = ({ random, option, isListView, isEdit }) => {
  const id = random ? random : HS_ITSM_EVENTS_COUNT;
  const { grid = {}, itsm_url, sm4_key, itsm_api_key } = option;

  const [count, setCount] = useState<string | number>(0);

  const currentUser = useMemo(() => JSON.parse(localStorage.getItem('Parse/osc/currentUser')), []);

  useEffect(() => {
    // 当存在 itsm 系统地址时才发送请求
    if (!option?.itsm_url) {
      return;
    }

    // 请求的search参数
    const SEARCH_PARAMS = `apiKey=${itsm_api_key}&userId=${currentUser?.username}`;

    // 获取 ITSM 中当前用户待办数量
    axios(`${itsm_url}/linksystem/openapi/v1/devops/queryMyTodoCount?${SEARCH_PARAMS}`, {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': '*',
        'Access-Control-Allow-Methods': '*',
      },
    })
      .then(response => {
        const itsm_response:ITSM_TODO_RESPONSE = response.data;
        
        setCount(itsm_response?.data?.todoNum || 0);
      })
      .catch(error => {
        message.error(error?.message);
      });
  }, [option]);

  const handleRedirect = useCallback(
    event => {
      if (!option?.itsm_url) {
        return;
      }
      // 生成点击时的sign值
      const sign = buildUrlSm4(currentUser?.username, sm4_key);

      // 跳转至单点登录页面/接口
      openNewTabWithoutBubble(event, `${itsm_url}/tenant/api/v1/user/sso?sign=${sign}`);
    },
    [option],
  );

  const view = useMemo(() => {
    const { w = 2, h = 1 } = grid;
    const { fontSize } = getCountFontSize(w, h, isListView);

    return (
      <div id={id} className={cx('view', isListView ? 'list' : 'detail')}>
        <span className={cx('view-filter-data')}>
          <span className={cx('font')} style={{ fontSize }}>
            {isEdit ? (
              count
            ) : (
              <Tooltip title="点击跳转至ITSM系统">
                <a style={{ fontSize }} onClick={handleRedirect}>
                  {count}
                </a>
              </Tooltip>
            )}
          </span>
          &nbsp;条待办
        </span>
      </div>
    );
  }, [count, handleRedirect]);

  return <>{view}</>;
};

export default View;
