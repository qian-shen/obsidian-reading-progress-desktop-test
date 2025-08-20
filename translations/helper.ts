// Code from https://github.com/valentine195/obsidian-admonition/blob/master/src/lang/helpers.ts

import { moment } from 'obsidian';
import zhCN from "translations/locale/zh-cn";
import en from "translations/locale/en";

const localeMap: { [k: string]: Partial<typeof en> } = {
    en,
    "zh-cn": zhCN
}

const locale = localeMap[moment.locale()];

export function t(str: keyof typeof en): string {
  return (locale && locale[str]) || en[str];
}