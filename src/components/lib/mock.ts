export const X_DATA = {
    'story': [
        { value: "普惠金融", key: 1 },
        { value: "零售银行", key: 2 },
        { value: "基金托管", key: 3 },
        { value: "金融同业", key: 4 },
        { value: "资产管理", key: 5 },
        { value: "电子银行", key: 6 },
    ],
    'requirement': [
        { value: "公司金融", key: 1 },
        { value: "零售金融", key: 2 },
        { value: "风险业务", key: 3 },
        { value: "核心开发", key: 4 },
        { value: "渠道开发", key: 5 },
        { value: "基础平台", key: 6 },
    ],
}

export const DATA = {
    'story': [
        { data: [42, 33, 21, 20, 17, 15], type: "bar" },
        {
            data: [22, 18, 9, 9, 7, 6],
            name: "本年",
            type: "bar",
        },
        {
            data: [20, 15, 12, 11, 10, 9],
            name: "存量",
            type: "bar",
        },
    ],
    'requirement': [
        { data: [20, 29, 40, 26, 26, 17], type: "bar" },
        {
            data: [10, 9, 20, 22, 18, 7],
            name: "本年",
            type: "bar",
        },
        {
            data: [10, 20, 20, 4, 8, 10],
            name: "存量",
            type: "bar",
        },
    ],
};

export const TOTAL_DATA = {
    'story': {
        data: DATA['story'][0].data,
        type: DATA['story'][0].type,
        // stack: 'x',
        barGap: "-100%", //偏移，不在同一柱子上叠加
        itemStyle: {
            normal: {
                color: "rgba(128, 128, 128, 0)",
                label: {
                    show: true,
                    position: "top",
                    formatter: "{c}",
                },
            },
        },
    },
    'requirement': {
        data: DATA['requirement'][0].data,
        type: DATA['requirement'][0].type,
        // stack: 'x',
        barGap: "-100%", //偏移，不在同一柱子上叠加
        itemStyle: {
            normal: {
                color: "rgba(128, 128, 128, 0)",
                label: {
                    show: true,
                    position: "top",
                    formatter: "{c}",
                },
            },
        },
    }
}
