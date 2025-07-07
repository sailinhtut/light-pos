import { appCurrency, appLightBackground, appPrimaryColor } from "@renderer/utils/app_constants";
import { parseNumber } from "@renderer/utils/general_utils";
import {
  loadBackgroundColor,
  loadCurrency,
  loadPrimaryColor,
  loadTheme
} from "@renderer/utils/theme_utils";
import { createContext, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

export const AppContext = createContext<{
  isDarkMode: boolean;
  primaryColor: string;
  backgroundColor: string;
  currency: string;
  isBackUpData: boolean;
  isMinimumStockAlarm: boolean;
  minimumStockQuantity: number;
  minimumStockColor: string;
  autoCheckOut: boolean;
  customCheckOut: boolean;
  autoCheckOutSecond: number;
  reloadAppConfigs: () => void;
}>({
  isDarkMode: false,
  primaryColor: appPrimaryColor,
  backgroundColor: appLightBackground,
  currency: appCurrency,
  isBackUpData: true,
  isMinimumStockAlarm: true,
  minimumStockQuantity: 25,
  minimumStockColor: "red",
  autoCheckOut: true,
  customCheckOut: true,
  autoCheckOutSecond: 30,
  reloadAppConfigs: () => {}
});

export default function AppContextProvider({ children }: { children: JSX.Element }) {
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [primaryColor, setPrimaryColor] = useState<string>("");
  const [backgroundColor, setBackgroundColor] = useState<string>("");
  const [currency, setCurrency] = useState<string>("");
  const [isBackUpData, setBackUpData] = useState(true);
  const [isMinimumStockAlarm, setMinimumStockAlarm] = useState(true);
  const [minimumStockQuantity, setMinimumStockQuantity] = useState(25);
  const [minimumStockColor, setminimumStockColor] = useState("red");

  const [autoCheckOut, setAutoCheckOut] = useState(false);
  const [customCheckOut, setCustomCheckOut] = useState(false);
  const [autoCheckOutSecond, setAutoCheckOutSecond] = useState(30);

  const { i18n } = useTranslation();

  useEffect(function () {
    reloadAppConfigs();
  }, []);

  const reloadAppConfigs = () => {
    loadTheme();
    loadPrimaryColor();
    loadBackgroundColor();
    loadCurrency();
    setIsDarkMode(localStorage.getItem("theme") === "dark");
    setPrimaryColor(localStorage.getItem("appPrimaryColor") ?? appPrimaryColor);
    setBackgroundColor(localStorage.getItem("appBackgroundColor") ?? appLightBackground);
    setCurrency(localStorage.getItem("appCurrency") ?? "");
    setBackUpData(localStorage.getItem("backupData") === "true");
    setMinimumStockAlarm(localStorage.getItem("minimumStockAlarm") === "true");
    setMinimumStockQuantity(parseNumber(localStorage.getItem("minimumStockQuantity") ?? "") ?? 25);
    setminimumStockColor(localStorage.getItem("minimumStockColor") ?? "red");
    setCustomCheckOut(localStorage.getItem("customCheckOut") === "true");
    setAutoCheckOut(localStorage.getItem("autoCheckOut") === "true");
    setAutoCheckOutSecond(parseNumber(localStorage.getItem("autoCheckOutSecond") ?? "") ?? 30);
    loadAppLanguge();
  
  };

  const loadAppLanguge = () => {
    const savedLanguage = localStorage.getItem("appLanguage") ?? "en";
    i18n.changeLanguage(savedLanguage);
  };

  return (
    <AppContext.Provider
      value={{
        isDarkMode: isDarkMode,
        primaryColor: primaryColor,
        backgroundColor: backgroundColor,
        currency: currency,
        isBackUpData: isBackUpData,
        isMinimumStockAlarm: isMinimumStockAlarm,
        minimumStockQuantity: minimumStockQuantity,
        minimumStockColor: minimumStockColor,
        autoCheckOut: autoCheckOut,
        customCheckOut: customCheckOut,
        autoCheckOutSecond: autoCheckOutSecond,
        reloadAppConfigs: reloadAppConfigs
      }}
    >
      {children}
    </AppContext.Provider>
  );
}
