"use client";

import { Bar, BarChart, CartesianGrid, XAxis, LabelList } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@renderer/assets/shadcn/components/ui/card";
import { ChartContainer, ChartTooltip } from "@renderer/assets/shadcn/components/ui/chart";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@renderer/assets/shadcn/components/ui/select";
import { useContext, useState } from "react";
import { capitalizeString } from "@renderer/utils/general_utils";
import { TooltipProps } from "@radix-ui/react-tooltip";
import { AppContext } from "@renderer/app/context/app_context";

export function BarChartComponent({
  title,
  description,
  unitName,
  dataSet
}: {
  title: string;
  description: string;
  unitName: string;
  dataSet: { name: string; quantity: number }[];
}) {
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

  const CustomTick = ({ x, y, payload }: any) => (
    <text
      x={x}
      y={y}
      dy={0}
      textAnchor="end"
      fill="#666"
      fontSize={10}
      style={{ whiteSpace: "pre-line" }} // Allows line breaks
    >
      {payload.value}
    </text>
  );

  const [activeItem, setActiveItem] = useState(dataSet[0].name);
  const { primaryColor } = useContext(AppContext);
  const colorizedItems = dataSet.map((e) => {
    if (e.name === activeItem) {
      return { ...e, fill: "#ffbf00" };
    } else {
      return { ...e, fill: primaryColor };
    }
  });

  return (
    <Card className="w-[400px] h-[360px]">
      <CardHeader className="flex flex-row justify-between items-start">
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
          <BarChart
            accessibilityLayer
            data={colorizedItems}
            margin={{
              top: 20
            }}
          >
            <CartesianGrid vertical={false} />

            <XAxis
              dataKey="name"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tick={<CustomTick />}
              tickFormatter={(value) => value}
            />
            <ChartTooltip cursor={false} content={<CustomTooltip />} />

            <Bar
              dataKey="quantity"
              radius={8}
              onClick={(data, index) => {
                setActiveItem(data.name);
              }}
            >
              <LabelList
                dataKey="quantity"
                position="top"
                offset={12}
                className="fill-foreground"
                fontSize={12}
                content={(props) => {
                  const { x, y, value } = props;
                  return (
                    <text x={x} y={y - 5} fill="grey" fontSize={12} textAnchor="middle">
                      {`${value}`}
                    </text>
                  );
                }}
              />
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
