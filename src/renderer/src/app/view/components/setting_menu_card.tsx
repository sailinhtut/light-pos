import { Card, CardContent } from "@renderer/assets/shadcn/components/ui/card";
import { useRouteContext } from "@renderer/router";
import { LucideProps } from "lucide-react";

export default function SettingCard({
  name,
  route,
  Icon
}: {
  name: string;
  route: string;
  Icon: JSX.Element;
}) {
  const { push } = useRouteContext();
  return (
    <Card
      className="transition-all duration-300 active:scale-95 hover:-translate-y-1 p-0 group  mr-3 mb-3 dark:hover:border-primary"
      onClick={() => push(route,{
        
      })}
    >
      <CardContent className="p-0 h-[100px] w-[120px] flex flex-col items-center justify-center">
        <div className="">{Icon}</div>
        <p className="text-sm mt-2 line-clamp-1 select-none">{name}</p>
      </CardContent>
    </Card>
  );
}
