import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@renderer/assets/shadcn/components/ui/dropdown-menu";
import { useRouteContext } from "@renderer/router";
import { pushNotifications } from "electron";
import personIcon from "../../../assets/images/person.png";
import UserContext from "@renderer/auth/context/user_context";
import { useContext, useEffect, useState } from "react";
import { SignOutDialog } from "@renderer/auth/view/profile_page";
import AuthService from "@renderer/auth/service/auth_service";
import { toLocalISOString } from "@renderer/utils/general_utils";
import lightLogo from "../../../assets/images/app_icon.png";
import { Button } from "@renderer/assets/shadcn/components/ui/button";
import { Copy, Minus, Square, User, WifiOff, X } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@renderer/assets/shadcn/components/ui/tooltip";
import { offlineMode } from "@renderer/utils/app_constants";

export default function NavBar() {
  const { push, pushAndForgetPast } = useRouteContext();
  const { currentUser, setCurrentUser } = useContext(UserContext);
  const [isWindowFullScreen, setIsWindowFullScreen] = useState(false);

  useEffect(
    function () {
      window.electron.ipcRenderer.on("window-full-screen", (event, isFull) => {
        setIsWindowFullScreen(isFull);
      });
    },
    [isWindowFullScreen]
  );

  return (
    <nav
      className={`h-[30px] bg-background border border-b border-r-0 border-r-transparent flex flex-row justify-between items-center pl-2 sticky top-0 z-10 `}
    >
      <span
        className="w-[300px] flex items-center gap-2 select-none non-draggableRegion"
        onDoubleClick={async () => {
          window.electron.ipcRenderer.send("window-toggle-maximize");
        }}
      >
        <img
          src={lightLogo}
          alt="Light App Studio"
          height={18}
          width={18}
          className="rounded border border-slate-200"
        />
        <span className="text-sm font-semibold">Light POS</span>
      </span>
      <div className=" w-[90%] h-full draggableRegion">
        <div></div>
      </div>
      <div className="flex items-center non-draggableRegion ">
        {!navigator.onLine && !offlineMode && (
          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger>
                <WifiOff
                  className="size-4 transition-all hover:scale-110 text-slate-600 hover:text-destructive "
                  onClick={() => window.electron.ipcRenderer.invoke("openInternetSetting")}
                />
              </TooltipTrigger>
              <TooltipContent className="bg-popover border text-foreground">
                <p>Open Internet Setting</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}

        <div className="mr-3"></div>
        {!offlineMode && (
          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger>
                <DropdownMenu>
                  <DropdownMenuTrigger>
                    <User className="size-4 mt-1 transition-all hover:scale-110 hover:text-primary" />
                  </DropdownMenuTrigger>

                  <DropdownMenuContent
                    className="mr-5"
                    onClick={(event) => {
                      event.preventDefault();
                    }}
                  >
                    <DropdownMenuItem onClick={() => push("/profile")}>Profile</DropdownMenuItem>

                    <SignOutDialog
                      onConfirmed={async () => {
                        await AuthService.signOut();
                        setCurrentUser(undefined);
                        pushAndForgetPast("/sign-in");
                      }}
                    >
                      <DropdownMenuItem
                        className="text-destructive"
                        onSelect={(event) => event.preventDefault()}
                      >
                        Log Out
                      </DropdownMenuItem>
                    </SignOutDialog>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TooltipTrigger>
              <TooltipContent className="bg-popover border text-foreground">
                <p>Account Setting</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
        <div className="mr-2"></div>
        <Button
          variant={"ghost"}
          className={`h-[33px] w-[40px] p-0  rounded-none`}
          onClick={async () => {
            window.electron.ipcRenderer.send("window-minimize");
          }}
        >
          <Minus strokeWidth={1.1} className="size-5" />
        </Button>
        <Button
          variant={"ghost"}
          className={`h-[33px] w-[40px] p-0  rounded-none`}
          onClick={async (event) => {
            (event.target as HTMLButtonElement).blur();
            window.electron.ipcRenderer.send("window-toggle-maximize");
          }}
        >
          {isWindowFullScreen ? (
            <Copy strokeWidth={1.5} className="-scale-x-100 size-4" />
          ) : (
            <Square strokeWidth={1.1} className="size-4" />
          )}
        </Button>
        <Button
          variant={"ghost"}
          className={`h-[33px] w-[40px] p-0  rounded-none hover:bg-red-500 hover:text-white`}
          onClick={async () => {
            window.electron.ipcRenderer.send("window-close");
          }}
        >
          <X strokeWidth={1.1} className="size-5" />
        </Button>
      </div>
    </nav>
  );
}
