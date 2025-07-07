import {
  LucideProps,
  LayoutGrid,
  ClipboardList,
  ChevronDown,
  Bolt,
  BarChartBig
} from "lucide-react";

import { useContext, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import UserContext from "@renderer/auth/context/user_context";
import { AppRoles } from "@renderer/auth/interface/roles";

export default function SideMenuBar() {
  const { currentUser } = useContext(UserContext);
  const isCasher = currentUser.role === AppRoles.casher;
  return (
    <div className={`w-[180px] h-screen overflow-y-auto border border-t-transparent p-2 stick top`}>
      <ul className="flex flex-col">
        {/* <SideMenuBarItem title={"Test"} to={"/test"} Icon={LayoutGrid} key="1" /> */}
        <SideMenuBarItem title={"Shop"} to={"/"} Icon={LayoutGrid} key="2" />
        <SideMenuBarItem title={"Order"} to={"/order-active"} Icon={ClipboardList} key="3" />
        {!isCasher &&
        <SideMenuBarItem
          title="Dashboard"
          to="/dashboard"
          Icon={BarChartBig}
          subMenu={null}
          key="1"
        />
}
        <SideMenuBarItem title={"Menu"} to={"/settings"} Icon={Bolt} key="4" />
      </ul>
    </div>
  );
}

function SideMenuBarItem({
  title,
  to,
  Icon,
  subMenu = null
}: {
  title: string;
  to: string;
  Icon: React.ForwardRefExoticComponent<
    Omit<LucideProps, "ref"> & React.RefAttributes<SVGSVGElement>
  >;
  subMenu?: React.ReactElement[] | null;
}) {
  const { pathname } = useLocation();
  const isPathActive = pathname === to;
  const containSubMenu = subMenu !== null;
  const [collapsed, setCollapse] = useState(!isPathActive);

  return (
    <div>
      <NavLink
        to={to}
        className={
          isPathActive
            ? "w-full bg-primary px-3 text-white py-[7px] rounded-lg border border-primary font-normal text-sm mb-1 hover:bg-primary flex gap-x-2 items-center transition-all duration-300"
            : "w-full hover:bg-primary/10 text-black dark:text-white px-3 py-[7px] rounded-lg hover:border  font-normal text-sm mb-1 flex gap-x-2 items-center  transition-all duration-300"
        }
      >
        <Icon size={20} strokeWidth={2.2} /> {title}
        {subMenu !== null && (
          <span
            className="ml-auto"
            onClick={() => {
              setCollapse(!collapsed);
            }}
          >
            <motion.div
              animate={{
                transform: collapsed ? "rotate(0deg)" : "rotate(-180deg)"
              }}
            >
              <ChevronDown />
            </motion.div>
          </span>
        )}
      </NavLink>

      <motion.div
        animate={{
          height: collapsed ? "0" : "auto"
        }}
        initial={{ overflow: "hidden", height: "0" }}
      >
        {subMenu !== null && (
          <ul className="list-inside ml-2">
            {subMenu.map((E) => (
              <li>{E}</li>
            ))}
          </ul>
        )}
      </motion.div>
    </div>
  );
}
