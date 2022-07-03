export type GroupValue = {
  key?: string;
  fieldType?: string;
  name?: string;
  value?: string;
  size?: number;
};

export type TargetValue = {
  id?: string;
  iql?: IQL;
  selectors?: Selectors;
  targetName?: string;
  value?: GroupValue[];
};

export type ColumnsValue = {
  cellType?: string;
  data?: any;
  dataIndex?: string;
  key?: string;
  objectId?: string;
  property: any;
  title: string;
  validation: any;
};

export type Selectors = Record<FieldId, SelectCase>;

export type QueryType = 'expression' | 'selector' | 'search';

export type OptionValue = {
  type?: string;
  group?: GroupValue[];
  value?: GroupValue[];
  cluster?: GroupValue[];
  iql?: string;
  w?: number;
  selectors?: Selectors;
  queryType?: QueryType;
  // count使用
  target?: TargetValue[];
  formula?: string;
  unit?: string;
  unitName?: string;
  precision?: number;
  // item-list使用
  dataNumber?: number;
  selectedColumns?: ColumnsValue[];
  pageSize?: number;
  orderBy?: OrderByProps;
  // 堆积柱状图使用
  screen?: Selectors;
  checked?: boolean;
  num?: number | string;
  sort?: string;
  orderBy?: OrderByProps;
  // 徽商itsm待办事项插件
  itsm_url?: string;
  sm4_key?: string;
  itsm_api_key?: string;
  isEdit?: boolean;
  grid?: {
    x?: number;
    y?: number;
    w?: number;
    h?: number;
    minW?: number;
    maxW?: number;
    minH?: number;
    maxH?: number;
  }
};

export type CommonOption = {
  setOption?: React.Dispatch<OptionValue>;
  view?: string;
  option: OptionValue;
  handleChangeType?: (type: string) => void;
  setAddTarget?: React.Dispatch<any>;
  addTarget?: any;
};

export type OrderByProps = {
  children?: string;
  key?: string;
  type?: string;
  value?: string;
};

export type OptionProps = {
  view?: string;
  option: OptionValue;
  allManifest: PluginManifestChart[];
  setOption?: React.Dispatch<OptionValue>;
  setSearchOption?: React.Dispatch<OptionValue>;
  setAddTarget?: React.Dispatch<any>;
  handleChangeType?: (type: string) => void;
  showOptVisible?: boolean;
};

export type ViewProps = {
  random?: string;
  option?: OptionValue;
  view?: string;
  workspace?: Workspace;
  // chartData?: { legendData: []; dataValue: [] };
  sessionToken?: string;
  isListView?: boolean;
  setEnableSave?: React.Dispatch<boolean>;
  name?: string;
  isEdit?: boolean;
};

export type CommonViewProp = {
  id?: string;
  echartData?: any;
  option?: OptionValue;
  isListView?: boolean;
  isNoData?: boolean;
};

export type ScreenModalProps = {
  option?: OptionValue;
  setOption?: React.Dispatch<any>;
};

export type ListDataProps = {
  value: number;
  name: string;
  key?: string;
  systems?: string[];
};

export type HeapModalProps = {
  echartParams?: string;
  isListView?: boolean;
  name?: string;
  dataTotal?: number;
  xData?: ListDataProps;
  listData?: ListDataProps[];
  value?: GroupValue;
  visible?: boolean;
  tenant?: Tenant;
  option?: OptionValue;
  workspace?: Workspace;
  sessionToken?: string;
  totalCount?: number;
};
export type XDataProps = {
  key?: string;
  value?: string;
};

export type LabelProps = {
  formatter: string;
  position: string;
  show: boolean | undefined;
};

export type NormalProps = {
  label: LabelProps;
};

export type ItemStyleProps = {
  normal: NormalProps;
};

export type SeriesProps = {
  data: Array<number>;
  name: string;
  stack: string;
  type: string;
  itemStyle: ItemStyleProps;
};

export type CommonViewProps = {
  echartData: any;
  id: string;
  option: OptionValue;
  isListView: boolean;
  isNoData: boolean;
  name: string;
  xData: XDataProps[];
  series: SeriesProps[];
  value?: GroupValue[];
  tenant?: Tenant;
  workspace?: Workspace;
  sessionToken?: string;
};

export type xAxisProps = {
  key?: string;
  value?: string;
};

export type PayloadValueProps = {
  name?: string;
  value?: number;
};

export type PayloadDataProps = {
  data?: number[];
  name?: string;
};

export type PayloadProps = {
  data?: PayloadDataProps[];
  xAxis?: xAxisProps[];
  value?: PayloadValueProps[];
  type?: string[];
};

export type ChartDataProps = {
  payload: PayloadProps;
};
