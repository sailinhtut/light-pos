import { browserReadFileBytes } from "@renderer/utils/file_utils";
import BreadcrumbContext from "@renderer/app/view/components/breadcrumb_context";
import { Button } from "@renderer/assets/shadcn/components/ui/button";
import { Input } from "@renderer/assets/shadcn/components/ui/input";
import { Label } from "@renderer/assets/shadcn/components/ui/label";
import { useState } from "react";
import { motion } from "framer-motion";

import LoadingWidget from "@renderer/app/view/components/loading";
import * as Excel from "xlsx";

export default function OrderExportPage() {
  const [importFile, setImportFile] = useState<File | undefined>(undefined);
  const [importFileData, setImportFileData] = useState<ArrayBuffer | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("Importing...");
  const [data, setData] = useState();

  const importOrder = async () => {
    setLoading(true);
    const workbook = Excel.read(importFileData);
    const sheetOne = workbook.Sheets[workbook.SheetNames[0]];
    const json = Excel.utils.sheet_to_json(sheetOne);

    setData(json);

    setLoading(false);
  };

  return (
    <div className={`p-5`}>
      <BreadcrumbContext
        route={[
          { name: "Light POS", route: "/" },
          { name: "Setting", route: "/settings" },
          { name: "Order Menu", route: "/settings/order-menu" },
          { name: "Import & Export", route: "/settings/order-menu/order-import-export-menu" },
          { name: "Order Export", route: "/settings/order-menu/order-export" }
        ]}
      />
      <p className="text-lg">Order Export</p>
      <div className="flex flex-col mt-3">
        <div className="flex gap-x-3">
          <Input
            type="file"
            className="w-56 "
            placeholder="Select Order Excel File"
            accept=".xlsx"
            title="Select Order Excel File"
            onChange={async (event) => {
              if (event.target.files) {
                const file = event.target.files[0];
                setImportFile(file);
                const bytes = await browserReadFileBytes(file);
                setImportFileData(bytes);
              }
            }}
          ></Input>

          {loading ? (
            <LoadingWidget type="spin" height={30} width={30} />
          ) : (
            <motion.div
              className="origin-left"
              animate={{
                transform: importFileData !== undefined ? "scale(100%)" : "scale(0%)"
              }}
            >
              <Button onClick={() => importOrder()}>Import Data</Button>
            </motion.div>
          )}
        </div>
        <motion.div
          className="max-w-fit"
          animate={{
            translateX: loading ? "0" : "-100%",
            opacity: loading ? 1 : 0,
            height: loading ? "40px" : 0
          }}
        >
          <div className="mt-3 text-sm py-0.5 rounded-md border border-slate-300 bg-slate-50 max-w-fit px-3">
            {loadingMessage}
          </div>
        </motion.div>

        <div className="break-words mt-3">
          <pre>{JSON.stringify(data)}</pre>
        </div>
      </div>
    </div>
  );
}
