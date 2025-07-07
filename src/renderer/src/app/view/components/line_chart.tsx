"use client";

import { TrendingUp } from "lucide-react";
import { CartesianGrid, Line, LineChart, XAxis } from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "@renderer/assets/shadcn/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent
} from "@renderer/assets/shadcn/components/ui/chart";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@renderer/assets/shadcn/components/ui/select";
import { useContext, useMemo, useState } from "react";
import { capitalizeString, formatNumberWithCommas } from "@renderer/utils/general_utils";
import { AppContext } from "@renderer/app/context/app_context";

export function LineChartComponent({
  title,
  description,
  unitName,
  dataSet,
  totalOrderNo,
  totalAmount
}: {
  title: string;
  description: string;
  unitName: string;
  totalOrderNo: number;
  totalAmount: number;
  dataSet: { name: string; quantity: number }[];
}) {
  const [activeItem, setActiveItem] = useState(dataSet[0].name);

  const colorizedItems = dataSet.map((e) => {
    return { ...e, fill: localStorage.getItem("appPrimaryColor") };
  });

  const { currency } = useContext(AppContext);

  const CustomTooltip = ({ active, payload, label }: TooltipProps) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border p-2 rounded-lg">
          <p className="label">{`${label} - ${payload[0].value} ${unitName}`}</p>
        </div>
      );
    }
    return null;
  };

  const CustomDot = (props: DotProps) => {
    const { cx, cy, value, isActive, stroke, strokeWidth, payload, onClick } = props;

    const isActiveDot = payload.name === activeItem;
    const dotColor = isActiveDot ? "#ffbf00" : localStorage.getItem("appPrimaryColor");
    if (!isActiveDot) return null;

    return (
      <circle
        cx={cx}
        cy={cy}
        r={4}
        fill={dotColor}
        strokeWidth={strokeWidth}
        onClick={() => {
          setActiveItem(payload.name);
          payload.name;
        }}
        style={{ cursor: "pointer" }}
      >
        <text>Hello</text>
      </circle>
    );
  };

  return (
    <Card className="flex flex-col w-[400px] h-[360px]">
      <CardHeader className="flex-row justify-between item-start">
        <div>
          <CardTitle className="mb-1">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
        <Select value={activeItem} onValueChange={setActiveItem}>
          <SelectTrigger className="w-32 h-8">
            <SelectValue placeholder="Select" />
          </SelectTrigger>
          <SelectContent>
            {dataSet
              .sort((a, b) => b.quantity - a.quantity)
              .map((e) => e.name)
              .map((name, index) => {
                return name.length === 0 ? (
                  <SelectItem key={index} value={uniqueId()}>
                    Unknown
                  </SelectItem>
                ) : (
                  <SelectItem key={index} value={name}>
                    {capitalizeString(name)}
                  </SelectItem>
                );
              })}
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        <ChartContainer config={{}}>
          <LineChart
            accessibilityLayer
            data={colorizedItems}
            margin={{
              left: 12,
              right: 12,
              top: 12
            }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="name"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => value.slice(0, 3)}
            />
            <ChartTooltip cursor={false} content={<CustomTooltip />} />
            <Line
              dataKey="quantity"
              type="natural"
              stroke={localStorage.getItem("appPrimaryColor")}
              strokeWidth={2}
              dot={<CustomDot />}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
      <CardFooter>
        <div className="flex flex-col h-full w-full gap-1 text-sm text-slate-500">
          <p>Total Order - {totalOrderNo}</p>
          <p>
            Total Amount - {formatNumberWithCommas(totalAmount)} {currency}
          </p>
        </div>
      </CardFooter>
    </Card>
  );
}
