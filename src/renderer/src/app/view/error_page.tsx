import { ClipboardCheck, Cog, Copy, Info, MountainIcon, ServerCrash } from "lucide-react";
import { useRouteError } from "react-router-dom";
import { motion } from "framer-motion";
import { useState } from "react";
import { Button } from "@renderer/assets/shadcn/components/ui/button";
import { toast } from "@renderer/assets/shadcn/components/ui/use-toast";
import { Toaster } from "@renderer/assets/shadcn/components/ui/toaster";
import { companyFacebookPage } from "@renderer/utils/app_constants";
import { useRouteContext } from "@renderer/router";
import NavBar from "./components/nav_bar";

export default function ErrorPage() {
  const error = useRouteError();
  const [showDetail, setShowDetail] = useState(false);
  const [copied, setCopied] = useState(false);
  const { push, pop } = useRouteContext();
  return (
    <div className=" min-h-screen w-full">
      <NavBar />
      <div className="p-20 flex flex-col items-start">
        {showDetail ? (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
          >
            <Cog className="size-20 text-amber-600" />
          </motion.div>
        ) : (
          <ServerCrash className={`size-20 text-amber-600`} />
        )}

        <p className="text-xl mt-3 font-medium ">Something Went Wrong !</p>
        <div className="mt-3  flex gap-x-3 items-center ">
          <Button
            className="bg-black hover:bg-black/90 active:bg-black"
            size={"sm"}
            onClick={() => push("/")}
          >
            Go Home
          </Button>
          <Button
            variant={"outline"}
            className="flex gap-x-2 group"
            size={"sm"}
            onClick={() => window.open(companyFacebookPage)}
          >
            Contact Us
          </Button>
          <Button
            variant={"outline"}
            className="flex gap-x-2 group"
            size={"sm"}
            onClick={() => {
              setShowDetail(!showDetail);
              setCopied(false);
            }}
          >
            {showDetail ? "Hide" : "More"} Detail{" "}
            <Info className="size-4 group-hover:text-amber-500" />
          </Button>
        </div>

        <motion.div
          animate={{
            height: showDetail ? "auto" : 0,
            scaleY: showDetail ? 1 : 0,
            translateY: showDetail ? 0 : "-70%",
            opacity: showDetail ? 1 : 0
          }}
          className="max-w-fit"
        >
          <div className="p-3  border-2 border-amber-500 max-w-xl min-w-96 rounded-xl mt-7 z-[1000] relative">
            <p className="whitespace-pre-line font-mono text-gray-600 text-sm">
              <p className="font-sans mb-3 font-medium text-black text-base">More Detail</p>
              Name - {error.statusText}
              <br></br>
              Code - {error.status}
              <br></br>
              Message - {error.data}
              <br></br>
              More - {JSON.stringify(error.error)}
            </p>
            {copied ? (
              <ClipboardCheck className="size-4 absolute top-2 right-2 text-green-700" />
            ) : (
              <Copy
                className="size-4 absolute top-2 right-2"
                onClick={() => {
                  const errorMessage = `Name : ${error.statusText}\nCode : ${error.status}\nMessage : "${error.data}"\nMore : ${JSON.stringify(error.error)}`;
                  window.navigator.clipboard.writeText(errorMessage);
                  setCopied(true);
                  toast({
                    title: "Error Text Copied",
                    description:
                      "We are ready to serve the problem at all cost. Have a good day. Thank For Your Patience ❤️"
                  });
                }}
              />
            )}
          </div>
        </motion.div>
      </div>
      <Toaster />
    </div>
  );
}
