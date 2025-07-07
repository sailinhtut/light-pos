// Cashflow
//     - cashflowId
//     - date - ISO8601
//     - records - Timeline[]
//
// Timeline
//     - timelineId - string
//     - name : string
//     - amount : number
//     - note : string
//     - date : ISO8601
//     - recordDate : parsedDate

import { getTodayParsedID, toLocalISOString } from "@renderer/utils/general_utils";

export interface Cashflow {
  cashflowId: string;
  date: Date;
  records: Timeline[];
}

export interface Timeline {
  timelineId: string;
  name: string;
  amount: number;
  note: string;
  date: Date;
  recordDate: string;
}

export function encodeCashflowJson(cash: Cashflow) {
  return {
    cashflowId: cash.cashflowId,
    date: toLocalISOString(cash.date),
    records: cash.records.map((element) => encodeTimelineJson(element))
  };
}

function encodeTimelineJson(timeline: Timeline) {
  return {
    timelineId: timeline.timelineId,
    name: timeline.name,
    amount: timeline.amount,
    note: timeline.note,
    date: toLocalISOString(timeline.date),
    recordDate: getTodayParsedID(timeline.date)
  };
}

export function decodeCashflowJson(cash: object): Cashflow {
  const data = cash as Cashflow;
  return {
    cashflowId: data.cashflowId,
    date: new Date(data.date),
    records: data.records.map((element) => decodeTimelineJson(element))
  };
}

function decodeTimelineJson(timeline: object): Timeline {
  const data = timeline as Timeline;
  return {
    timelineId: data.timelineId,
    name: data.name,
    amount: data.amount,
    note: data.note,
    date: new Date(data.date),
    recordDate: data.recordDate
  };
}
