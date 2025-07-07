import { ChevronRight, CircleHelp, Delete, Palette, Printer, Trash } from "lucide-react";
import BreadcrumbContext from "./components/breadcrumb_context";
import { AnimatePresence, motion } from "framer-motion";
import { useRouteContext } from "@renderer/router";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@renderer/assets/shadcn/components/ui/select";
import { ValueInputDialog } from "./components/value_input_dialog";
import { Button } from "@renderer/assets/shadcn/components/ui/button";
import { toast } from "@renderer/assets/shadcn/components/ui/use-toast";
import { saveCurrency } from "@renderer/utils/theme_utils";
import { AppContext } from "../context/app_context";
import { useContext } from "react";
import { companyFacebookPage, tutorialWebUrl } from "@renderer/utils/app_constants";
import { ConfirmDialog } from "./components/confirm_dialog";
import { useTranslation } from "react-i18next";
import { Switch } from "@renderer/assets/shadcn/components/ui/switch";
import UserContext from "@renderer/auth/context/user_context";
import { AppRoles } from "@renderer/auth/interface/roles";

export function SystemSettingPage() {
  const { push } = useRouteContext();
  const { currency, reloadAppConfigs, isBackUpData } = useContext(AppContext);

  const { t, i18n } = useTranslation();

  const changeLanguage = (lang: string) => {
    i18n.changeLanguage(lang);
    localStorage.setItem("appLanguage", lang);
  };

  const { currentUser } = useContext(UserContext);
  const isCasher = currentUser.role === AppRoles.casher;

  return (
    <div className="p-5 w-[calc(100vw-180px)]">
      <BreadcrumbContext
        route={[
          { name: "Light POS", route: "/" },
          { name: "Setting", route: "/settings" },
          { name: "System Setting", route: "/settings/system-setting" }
        ]}
      />
      <p className="text-lg">System Setting</p>
      <div className="w-full max-w-[400px] mt-2 flex flex-col">
        <div
          className="h-[40px] flex items-center gap-3 justify-between cursor-pointer hover:text-primary "
          onClick={() => push("/settings/system-setting/printer-setting")}
        >
          <p className="text-sm">Printer Setting</p>
          <Printer className="size-5" />
        </div>
        <div
          className="h-[40px] flex items-center gap-3 justify-between cursor-pointer hover:text-primary "
          onClick={() => push("/settings/system-setting/theme-setting")}
        >
          <p className="text-sm">Theme Setting</p>
          <Palette className="size-5" />
        </div>
      {/* <div className="h-[40px] flex items-center gap-3 justify-between cursor-pointer">
          <p className="text-sm">Langauge</p>
          <Select
            onValueChange={(value) => {
              changeLanguage(value);
            }}
            value={i18n.language}
          >
            <SelectTrigger className="ml-auto h-8 w-28 rounded-lg pl-2.5">
              <SelectValue placeholder="Select month" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="my">Myanmar</SelectItem>
              <SelectItem value="en">English</SelectItem>
            </SelectContent>
          </Select>
        </div> */}
        <div className="h-[40px] flex items-center gap-3 justify-between cursor-pointer">
          <p className="text-sm">Currency Unit</p>
          <ValueInputDialog
            title="Currency"
            description="Enter currency name"
            actionTitle="Save"
            onSubmit={(value) => {
              saveCurrency(value);
              reloadAppConfigs();
            }}
          >
            <Button variant={"outline"} size={"sm"}>
              {currency}
            </Button>
          </ValueInputDialog>
        </div>

        <div className="h-[40px] flex items-center gap-3 justify-between  ">
          <p className="text-sm">Back Up Data</p>
          <Switch
            checked={isBackUpData}
            onCheckedChange={(value) => {
              localStorage.setItem("backupData", value ? "true" : "false");
              reloadAppConfigs();
            }}
          ></Switch>
        </div>

        {!isCasher && (
          <div
            className="h-[40px] flex items-center gap-3 justify-between cursor-pointer hover:text-destructive "
            onClick={() => push("/settings/system-setting/clear-data")}
          >
            <p className="text-sm">Clear Data</p>
            <Trash className="size-5" />
          </div>
        )}

        <ConfirmDialog
          actionVariant={"default"}
          title="How To Use App"
          description="This action will take you toward official website page. Do you confirm ?"
          actionTitle="Learn"
          onConfirm={() => {
            window.open(tutorialWebUrl);
          }}
        >
          <div className="h-[40px] flex items-center gap-3 justify-between cursor-pointer hover:text-primary ">
            <p className="text-sm">How to use</p>
            <CircleHelp className="size-5" />
          </div>
        </ConfirmDialog>
      </div>
    </div>
  );
}
