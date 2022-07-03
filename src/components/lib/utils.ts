import { INSIGHT_DRILL_DOWN_DATA } from './global';
import { OptionValue } from './type';

export const setDataCode = (name: string) => {
  switch (name) {
    case '提出部门': {
      return INSIGHT_DRILL_DOWN_DATA[0].code;
    }
    case '所属系统': {
      return INSIGHT_DRILL_DOWN_DATA[1].code;
    }
    case '所属团队': {
      return INSIGHT_DRILL_DOWN_DATA[2].code;
    }
  }
};

export function isOptionValid(option: OptionValue) {
  return option?.value?.length && option?.group?.length;
}

// 阻止冒泡事件并且打开新的标签页
export const openNewTabWithoutBubble = (e, url) => {
  e.stopPropagation();
  e.preventDefault();
  if(url) {
    window.open(url, '_blank');
  }
}

export const getCountFontSize = (w: number, h: number, isListView: boolean, showDetail?: boolean)
  : { fontSize: number; detailSize?: number; detailPadding?: number; unitSize: number; unitMargin: number } => {
  if (showDetail) { // 计算显示详情
    if (!isListView) {
      return { fontSize: 96, detailSize: 28, detailPadding: 22, unitSize: 48, unitMargin: 48 };
    }
    if (h == 1) {
      return { fontSize: 30, detailSize: 14, detailPadding: 6, unitSize: 16, unitMargin: 16 };
    } else if (w <= 2) {
      return { fontSize: 40, detailSize: 18, detailPadding: 8, unitSize: 20, unitMargin: 20 };
    } else if (h < 3) {
      return { fontSize: 50, detailSize: 20, detailPadding: 16, unitSize: 25, unitMargin: 25 };
    } else if (w <= 4) {
      return { fontSize: 80, detailSize: 25, detailPadding: 20, unitSize: 40, unitMargin: 40 };
    } else {
      return { fontSize: 96, detailSize: 28, detailPadding: 22, unitSize: 48, unitMargin: 48 };
    }
  } else {
    if (!isListView) {
      return { fontSize: 96, unitSize: 48, unitMargin: 48 };
    }
    if (w == 1) {
      return { fontSize: 32, unitSize: 16, unitMargin: 16 };
    } else if (h == 1) {
      return { fontSize: 50, unitSize: 25, unitMargin: 25 };
    } else if (w <= 4 && h >= 1) {
      return { fontSize: 80, unitSize: 40, unitMargin: 40 };
    } else {
      return { fontSize: 96, unitSize: 48, unitMargin: 48 };;
    }
  }
}
