"use client";
import { Label, Pie, PieChart, Sector } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "@renderer/assets/shadcn/components/ui/card";
import {
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
import {
  capitalizeString,
  formatNumberWithCommas,
  randomElement,
  uniqueId
} from "@renderer/utils/general_utils";
import { AppContext } from "@renderer/app/context/app_context";
import { toast } from "@renderer/assets/shadcn/components/ui/use-toast";
import { Button } from "@renderer/assets/shadcn/components/ui/button";

export function PieChartComponent({
  title,
  description,
  unitName,
  dataSet,
  onSelected
}: {
  title: string;
  description: string | undefined;
  unitName: string | undefined;
  onSelected?: (value: string | undefined) => void;
  dataSet: { id: string; name: string; quantity: number; amount: number }[];
}) {
  dataSet.sort((a, b) => b.quantity - a.quantity);
  const randomColors = useMemo(
    () => generateColorsWithRandomOpacity(localStorage.getItem("appPrimaryColor"), dataSet.length),
    []
  );

  const [activeItem, setActiveItem] = useState<string | undefined>(undefined);
  const colorizedItems = dataSet.map((e) => {
    return { ...e, fill: randomElement(randomColors) };
  });

  const { currency } = useContext(AppContext);

  const totalQuantity = activeItem
    ? dataSet.find((e) => e.id === activeItem)?.quantity ?? 0
    : dataSet.length === 0
      ? 0
      : dataSet.map((e) => e.quantity).reduce((a, b) => a + b);

  const totalAmount = activeItem
    ? dataSet.find((e) => e.id === activeItem)?.amount ?? 0
    : dataSet.length === 0
      ? 0
      : dataSet.map((e) => e.amount).reduce((a, b) => a + b);

  const renderActiveShape = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    startAngle,
    endAngle,
    fill,
    value,
    name
  }) => {
    const RADIAN = Math.PI / 180;
    const sin = Math.sin(-RADIAN * midAngle);
    const cos = Math.cos(-RADIAN * midAngle);
    const sx = cx + (outerRadius + 10) * cos;
    const sy = cy + (outerRadius + 10) * sin;
    const mx = cx + (outerRadius / 2) * cos;
    const my = cy + (outerRadius / 2) * sin;
    const ex = cx + (outerRadius + 10) * cos;
    const ey = cy + (outerRadius + 10) * sin;
    const textAnchor = cos >= 0 ? "start" : "end";

    return (
      <g>
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius}
          outerRadius={outerRadius + 10}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={"#ffbf00"}
        />
        <text x={mx} y={my} textAnchor={textAnchor} fill="grey" fontSize="14px" className="z-50">
          {name}
        </text>
      </g>
    );
  };

  return (
    <Card className="flex flex-col w-[400px] h-[360px]">
      <CardHeader className="flex-row justify-between items-start">
        <div>
          <CardTitle className="mb-1">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
        <Select
          value={activeItem}
          onValueChange={(value) => {
            setActiveItem(value);
            onSelected?.(value);
          }}
        >
          <SelectTrigger className="w-32 h-8 ">
            <SelectValue> {dataSet.find((e) => e.id === activeItem)?.name ?? "Select"}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {dataSet.map((value, index) => {
              return value.name.length === 0 ? (
                <SelectItem key={index} value={uniqueId()}>
                  Unknown
                </SelectItem>
              ) : (
                <SelectItem key={index} value={value.id}>
                  {capitalizeString(value.name)}
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="flex justify-center flex-1">
        <ChartContainer config={{}}>
          <PieChart>
            <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
            <Pie
              data={colorizedItems}
              dataKey="quantity"
              nameKey="name"
              innerRadius={50}
              activeIndex={dataSet.findIndex((e) => e.id === activeItem)}
              activeShape={renderActiveShape}
              onClick={(data, index) => {
                if (data.id === activeItem) {
                  setActiveItem(undefined);
                  onSelected?.(undefined);
                } else {
                  setActiveItem(data.id);
                  onSelected?.(data.id);
                }
              }}
            >
              <Label
                content={({ viewBox }) => {
                  if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                    return (
                      <text
                        x={viewBox.cx}
                        y={viewBox.cy}
                        textAnchor="middle"
                        dominantBaseline="middle"
                      >
                        <tspan
                          x={viewBox.cx}
                          y={viewBox.cy}
                          className="fill-foreground text-lg font-bold"
                        >
                          {`${dataSet.find((e) => e.id === activeItem)?.quantity ?? "Total"}`}
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 22}
                          className="fill-muted-foreground"
                        >
                          {unitName} (
                          {Math.round(
                            ((dataSet.find((e) => e.id === activeItem)?.quantity ?? 0) /
                              dataSet.map((e) => e.quantity).reduce((a, b) => a + b)) *
                              100
                          )}
                          %)
                        </tspan>
                      </text>
                    );
                  }
                }}
              />
            </Pie>
          </PieChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex flex-row justify-between items-start">
        <div className="flex flex-col gap-1 text-sm text-slate-500">
          <p>Total Quantity - {totalQuantity}</p>
          <p>
            Total Amount - {formatNumberWithCommas(totalAmount)} {currency}
          </p>
        </div>
        {activeItem && (
          <Button
            variant={"ghost"}
            size="sm"
            onClick={() => {
              setActiveItem(undefined);
              onSelected?.(undefined);
            }}
          >
            Clear
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

function generateColorsWithRandomOpacity(baseColor, numColors) {
  // Ensure the base color is in HEX format
  if (!/^#[0-9A-F]{6}$/i.test(baseColor)) {
    throw new Error("Invalid HEX color format.");
  }

  // Helper function to convert HEX to RGBA
  function hexToRgba(hex, alpha) {
    let r = parseInt(hex.substring(1, 3), 16);
    let g = parseInt(hex.substring(3, 5), 16);
    let b = parseInt(hex.substring(5, 7), 16);

    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  let colors: string[] = [];
  for (let i = 0; i < numColors; i++) {
    // Generate a random opacity between 0.3 and 1
    let alpha = (Math.random() * 0.7 + 0.4).toFixed(2); // Random opacity between 0.3 and 1
    colors.push(hexToRgba(baseColor, alpha));
  }

  return colors;
}
