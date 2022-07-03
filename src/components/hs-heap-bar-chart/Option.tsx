import React, { useMemo } from 'react';
import { Button, Select, Switch, InputNumber } from 'antd';
import { Formik } from 'formik';

import { FormField } from 'proxima-sdk/components/Components/Common';
import { HS_HEAP_BAR_CHART } from 'proxima-sdk/lib/Global';

import { CustomField as CustomFieldProps } from 'proxima-sdk/schema/types/models';
import { FilterQuery } from 'proxima-sdk/components/Components/Chart';

import { OptionProps, OrderByProps, OptionValue } from '../lib/type';
import cx from './Option.less';

import { cloneDeep } from 'lodash';
import { TM, XQ } from '../lib/global';

const X_AXIS_DATA = [
  {
    key: 'r_remote_field_dep',
    fieldType: 'r_remote_field_remote_department_field_type.keyword',
    name: '提出部门',
  },
  {
    key: 'bind_system',
    fieldType: 'BindWorkspace',
    name: '所属系统',
  },
  {
    key: 'pg_emp_team',
    fieldType: 'BindWorkspace',
    name: '所属团队',
  },
];

const Y_AXIS_DATA = [
  {
    key: XQ,
    fieldType: 'ItemType',
    name: '业务需求',
  },
  {
    key: TM,
    fieldType: 'ItemType',
    name: '需求条目',
  },
];

const Config: React.FC<OptionProps> = ({ allManifest, option, setOption, setSearchOption, handleChangeType }) => {
  const { group, value, iql, checked, num, orderBy } = option;

  const initialValues = {
    type: HS_HEAP_BAR_CHART,
    group: group?.length ? group[0]?.key : '',
    value: value?.length ? value[0]?.key : '',
    iql: iql,
    checked: checked === undefined ? false : checked,
    num: num === undefined ? null : num,
    orderBy: orderBy === undefined ? null : orderBy,
  };

  const typeOptions = useMemo(() => {
    return allManifest.map(item => (
      <Select.Option value={item.originalKey} key={item.originalKey} option={item.option}>
        {item.name}
      </Select.Option>
    ));
  }, [allManifest]);

  // X轴提出部门 Y轴业务需求
  // X轴所属系统 Y轴需求条目
  // X轴所属团队 Y轴需求条目
  const groupOptions = useMemo(() => {
    return X_AXIS_DATA.map(item => (
      <Select.Option value={item.key} key={item.key} fieldType={item.fieldType} name={item.name}>
        {item.name}
      </Select.Option>
    ));
  }, [X_AXIS_DATA]);

  const valueOptions = useMemo(() => {
    if (group?.length) {
      const item = group[0].name === '提出部门' ? Y_AXIS_DATA[0] : Y_AXIS_DATA[1];
      return [
        <Select.Option value={item.key} key={item.key} fieldType={item.fieldType} name={item.name}>
          {item.name}
        </Select.Option>,
      ];
    }
    return Y_AXIS_DATA.map(item => (
      <Select.Option value={item.key} key={item.key} fieldType={item.fieldType} name={item.name}>
        {item.name}
      </Select.Option>
    ));
  }, [Y_AXIS_DATA, group]);

  const handleSubmit = () => {
    setSearchOption(option);
  };

  return (
    <Formik initialValues={initialValues} onSubmit={handleSubmit}>
      {({ handleSubmit, setFieldValue }) => (
        <>
          <div className={'form-main-title'}>
            <strong className={'info-title'}>图表信息</strong>
            <span
              className={'option-reset'}
              onClick={() => {
                setOption({ ...option, group: [], value: [] });
                setFieldValue('group', undefined);
                setFieldValue('value', undefined);
              }}
            >
              重置图表
            </span>
          </div>
          <FormField label={'图表展示类型'} name="type">
            {({ field }) => (
              <>
                <Select
                  {...field}
                  optionFilterProp="children"
                  onChange={(val: string, option: { option: OptionValue }) => {
                    handleChangeType(val);
                    setOption(option?.option);
                    setSearchOption(option?.option);
                    setFieldValue('type', val);
                  }}
                >
                  {typeOptions}
                </Select>
              </>
            )}
          </FormField>
          <div className={cx('group')}>
            <FormField label="x轴" name="group">
              {({ field }) => (
                <Select
                  {...field}
                  value={field.value}
                  showSearch={true}
                  placeholder="请选择"
                  onChange={(val, opt) => {
                    const { key, name, fieldType } = opt as CustomFieldProps;
                    const value = name === '提出部门' ? Y_AXIS_DATA[0] : Y_AXIS_DATA[1];
                    setOption({
                      ...option,
                      group: [
                        {
                          key,
                          name,
                          fieldType,
                          size: group?.[0]?.size,
                        },
                      ],
                      value: [value],
                    });
                    setFieldValue('group', val);
                    setFieldValue('value', value.key);
                  }}
                  optionFilterProp="children"
                >
                  {groupOptions}
                </Select>
              )}
            </FormField>
          </div>
          <FormField label="y轴" name="value">
            {({ field }) => (
              <Select
                {...field}
                placeholder="请选择"
                onChange={(val, opt) => {
                  const { key, name, fieldType } = opt as CustomFieldProps;
                  setOption({
                    ...option,
                    value: [
                      {
                        key,
                        name,
                        fieldType,
                      },
                    ],
                  });
                  setFieldValue('value', val);
                }}
                optionFilterProp="children"
              >
                {valueOptions}
              </Select>
            )}
          </FormField>
          <div className={cx('setdata')}>
            <FormField name="num">
              {({ field }) => (
                <div className={cx('displays')}>
                  <span>显示数量</span>
                  <InputNumber
                    {...field}
                    parser={value => `$ ${value}`.replace(/[^\d]/g, '')}
                    formatter={value => `$ ${value}`.replace(/[^\d]/g, '')}
                    placeholder="请输入显示数量"
                    value={num}
                    className={cx('input')}
                    onChange={value => {
                      setFieldValue('num', value);
                      const _group = cloneDeep(group);
                      _group?.[0] && (_group[0].size = value);
                      setOption({ ...option, num: value, group: _group });
                    }}
                  />
                </div>
              )}
            </FormField>
            <FormField name="sort">
              {({ field }) => (
                <div className={cx('displays')}>
                  <span>显示排序</span>
                  <Select
                    {...field}
                    allowClear
                    className={cx('sort')}
                    placeholder="请选择排序方式"
                    value={orderBy?.value}
                    optionFilterProp="children"
                    onChange={(value, opt) => {
                      const orderBy = opt as OrderByProps;
                      if (group?.length > 0) {
                        orderBy.key = group[0]?.key;
                      }
                      setFieldValue('orderBy', orderBy);
                      setOption({ ...option, orderBy: orderBy });
                    }}
                  >
                    <Select.Option value="desc" type="desc" key="desc">
                      降序
                    </Select.Option>
                    <Select.Option value="asc" type="asc" key="asc">
                      升序
                    </Select.Option>
                  </Select>
                </div>
              )}
            </FormField>
          </div>
          <FormField name="checked">
            {({ field }) => (
              <div className={cx('displays')}>
                <span>显示数据标签</span>
                <Switch
                  {...field}
                  checked={checked}
                  onChange={checked => {
                    setOption({ ...option, checked });
                    setFieldValue('checked', checked);
                  }}
                />
              </div>
            )}
          </FormField>

          <div className={'form-main-title'}>
            <strong className={'info-title'}>数据筛选</strong>
            <span
              className={'option-reset'}
              onClick={() => {
                setFieldValue('iql', '');
                setOption({ ...option, iql: '', selectors: {} });
              }}
            >
              重置筛选
            </span>
          </div>
          <FilterQuery setOption={setOption} option={option} />
          <Button type="primary" className="chart-search" onClick={() => handleSubmit()}>
            查询
          </Button>
        </>
      )}
    </Formik>
  );
};

export default Config;
