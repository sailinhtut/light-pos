import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage
} from "@renderer/assets/shadcn/components/ui/breadcrumb";
import { useRouteContext } from "@renderer/router";
import { Divide } from "lucide-react";

export interface BreadcrumbRoute {
  name: string;
  route: string;
  query?: object  ;
}

export default function BreadcrumbContext({ route }: { route: BreadcrumbRoute[] }) {
  if (route.length === 0) {
    return null;
  }

  const { push } = useRouteContext();
  const rootRoute = route[0];
  const leafRoute = route.length >= 2 ? route[route.length - 1] : null;
  const restRoutes = route.length >= 3 ? route.slice(1, -1) : null;
  return (
    <Breadcrumb className="mb-3 h-[20px]">
      <BreadcrumbList>
        {rootRoute && (
          <BreadcrumbItem>
            <BreadcrumbLink
              className="cursor-pointer"
              onClick={() => push(rootRoute.route, rootRoute.query)}
            >
              {rootRoute.name}
            </BreadcrumbLink>
          </BreadcrumbItem>
        )}
        {restRoutes &&
          restRoutes.map((element) => (
            <>
              <BreadcrumbSeparator></BreadcrumbSeparator>
              <BreadcrumbItem>
                <BreadcrumbLink
                  className="cursor-pointer"
                  onClick={() => {
                    push(element.route, element.query);
                  }}
                >
                  {element.name} 
                </BreadcrumbLink>
              </BreadcrumbItem>
            </>
          ))}

        {leafRoute && (
          <>
            <BreadcrumbSeparator></BreadcrumbSeparator>
            <BreadcrumbPage>
              <BreadcrumbLink
                className="cursor-pointer"
                onClick={() => push(leafRoute.route, rootRoute.query)}
              >
                {leafRoute.name}
              </BreadcrumbLink>
            </BreadcrumbPage>
          </>
        )}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
