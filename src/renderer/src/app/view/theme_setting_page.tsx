import { ChevronRight, Palette, Printer } from "lucide-react";
import BreadcrumbContext from "./components/breadcrumb_context";
import { AnimatePresence, motion } from "framer-motion";
import { Switch } from "@renderer/assets/shadcn/components/ui/switch";
import { Button } from "@renderer/assets/shadcn/components/ui/button";
import { useContext, useState } from "react";
import { ColorPicker } from "./components/color_picker";
import { ConfirmDialog } from "./components/confirm_dialog";
import { AppContext } from "../context/app_context";
import { hslToHex, saveBackgroundColor, savePrimaryColor } from "@renderer/utils/theme_utils";
import {
  appDarkBackground,
  appLightBackground,
  appPrimaryColor
} from "@renderer/utils/app_constants";

export function ThemeSettingPage() {
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem("theme") === "dark";
  });

  const { primaryColor, backgroundColor, reloadAppConfigs } = useContext(AppContext);

  const changeDarkMode = (isDark) => {
    setDarkMode(isDark);
    if (isDark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");

      localStorage.setItem("appCustomBackgroundColor", backgroundColor);
      saveBackgroundColor(appDarkBackground);
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");

      const savedCustomBackgroundColor =
        localStorage.getItem("appCustomBackgroundColor") ?? appLightBackground;
      saveBackgroundColor(savedCustomBackgroundColor);
    }
    reloadAppConfigs();
  };

  return (
    <div className="p-5 w-[calc(100vw-180px)]">
      <BreadcrumbContext
        route={[
          { name: "Light POS", route: "/" },
          { name: "Setting", route: "/settings" },
          { name: "System Setting", route: "/settings/system-setting" },
          { name: "Theme Setting", route: "/settings/system-setting/theme-setting" }
        ]}
      />
      <p className="text-lg">Theme Setting</p>
      <div className="w-full max-w-[400px] mt-2 flex flex-col">
        <div className="h-[40px] flex items-center gap-3 justify-between  ">
          <p className="text-sm">App Color</p>

          <ColorPicker
            initColor={primaryColor}
            onPicked={(hexValue) => {
              savePrimaryColor(hexValue);
              reloadAppConfigs();
            }}
          />
        </div>
        <div className="h-[40px] flex items-center gap-3 justify-between  ">
          <p className="text-sm">Background Color</p>
          <ColorPicker
            initColor={localStorage.getItem("appBackgroundColor")}
            onPicked={(hexValue) => {
              saveBackgroundColor(hexValue);
              reloadAppConfigs();
            }}
          />
        </div>

        <div className="h-[40px] flex items-center gap-3 justify-between  ">
          <p className="text-sm">Dark Mode</p>
          <Switch
            checked={darkMode}
            onCheckedChange={(status) => {
              changeDarkMode(status);
            }}
          ></Switch>
        </div>
        <div className="h-[40px] flex items-center gap-3 justify-between  ">
          <p className="text-sm">Reset Theme</p>
          <ConfirmDialog
            actionVariant={"default"}
            title="Reset Theme"
            description="Are you sure to reset theme ?"
            actionTitle="Reset"
            onConfirm={() => {
              savePrimaryColor(appPrimaryColor);
              saveBackgroundColor(appLightBackground);
              document.documentElement.classList.remove("dark");
              localStorage.setItem("theme", "light");
              reloadAppConfigs();
            }}
          >
            <Button variant={"outline"} size={"sm"}>
              Reset
            </Button>
          </ConfirmDialog>
        </div>
      </div>
    </div>
  );
}
