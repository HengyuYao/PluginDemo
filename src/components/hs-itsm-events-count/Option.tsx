import React, { useEffect, useMemo, useRef } from 'react';
import { HS_ITSM_EVENTS_COUNT } from 'proxima-sdk/lib/Global';

import { OptionProps } from '../lib/type';
import { FormField } from 'proxima-sdk/components/Components/Common';
import { Input } from 'antd';
import { Formik } from 'formik';

const ITSM_INITIAL_KEY = ['itsm_url', 'sm4_key', 'itsm_api_key'];

const ITSM_INITIAL_VALUE = {
  type: HS_ITSM_EVENTS_COUNT,
  itsm_url: 'http://38.63.171.80:7508',
  sm4_key: '86C63180C2806ED1F47B859DE501215B',
  itsm_api_key: '51f9f11aef8211eb9e1c0050569f4800',
};

const Option: React.FC<OptionProps> = ({ setOption, option }) => {
  useEffect(() => {
    setOption({ ...ITSM_INITIAL_VALUE, ...option });
  }, []);

  const initialValues = useMemo(() => {
    const handleValues = { ...ITSM_INITIAL_VALUE, ...option };
    return ITSM_INITIAL_KEY.reduce((prev, cur) => ({
      ...prev,
      [cur]: handleValues[cur],
    }), {});
  }, [option])
  
  const ref = useRef(null);

  return (
    <div>
      <h2>查询ITSM待办数量插件</h2>
      <Formik innerRef={ref} initialValues={initialValues} onSubmit={() => {}}>
        {({ setFieldValue }) => (
          <>
            <FormField label={'ITSM 系统地址'} name="itsm_url">
              {({ field }) => (
                <Input
                  {...field}
                  onChange={event => {
                    const val = event.target.value;
                    setFieldValue('itsm_url', val);
                    setOption({ ...option, itsm_url: val });
                  }}
                />
              )}
            </FormField>
            <FormField label={'ITSM ApiKey'} name="itsm_api_key">
              {({ field }) => (
                <Input
                  {...field}
                  onChange={event => {
                    const val = event.target.value;
                    setFieldValue('itsm_api_key', val);
                    setOption({ ...option, itsm_api_key: val });
                  }}
                />
              )}
            </FormField>
            <FormField label={'SM4 加密密钥'} name="sm4_key">
              {({ field }) => (
                <Input
                  {...field}
                  onChange={event => {
                    const val = event.target.value;
                    setFieldValue('sm4_key', val);
                    setOption({ ...option, sm4_key: val });
                  }}
                />
              )}
            </FormField>
          </>
        )}
      </Formik>
    </div>
  );
};

export default Option;
