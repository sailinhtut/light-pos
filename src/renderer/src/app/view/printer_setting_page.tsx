import { ChevronRight, Palette, Plus, Printer, PrinterIcon, Trash } from "lucide-react";
import BreadcrumbContext from "./components/breadcrumb_context";
import { AnimatePresence, motion } from "framer-motion";
import { Switch } from "@renderer/assets/shadcn/components/ui/switch";
import { Button } from "@renderer/assets/shadcn/components/ui/button";
import { RefObject, useContext, useEffect, useRef, useState } from "react";
import { ColorPicker } from "./components/color_picker";
import { ConfirmDialog } from "./components/confirm_dialog";
import { AppContext } from "../context/app_context";
import { hslToHex, saveBackgroundColor, savePrimaryColor } from "@renderer/utils/theme_utils";
import {
  address,
  appDarkBackground,
  appDescription,
  appLightBackground,
  appName,
  appPrimaryColor,
  phoneOne,
  phoneTwo
} from "@renderer/utils/app_constants";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@renderer/assets/shadcn/components/ui/select";
import ReactToPrint from "react-to-print";
import { OrderHistory } from "@renderer/order/interface/order_history";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@renderer/assets/shadcn/components/ui/dialog";
import { formatNumberWithCommas, parseNumber, uniqueId } from "@renderer/utils/general_utils";
import { FieldValues, useForm } from "react-hook-form";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@renderer/assets/shadcn/components/ui/form";
import { Input } from "@renderer/assets/shadcn/components/ui/input";
import { browserReadFileBytes } from "@renderer/utils/file_utils";
import { arrayBufferToBase64 } from "@renderer/utils/encrypt_utils";
import { Base64ImageViewer } from "./components/image_viewer";
import { Item } from "@renderer/product/interface/item";
import { CartItem } from "@renderer/order/interface/cart_item";
import moment from "moment";
import parse from "html-react-parser";
import { Creditbook } from "@renderer/credit_book/interface/credit_book";
import CreditbookService from "@renderer/credit_book/service/credit_book_service";
import LoadingWidget from "./components/loading";
import { ValueInputDialog } from "./components/value_input_dialog";
import JsBarcode from "jsbarcode";

type ReceiptType = "Standard" | "Line Grid" | "Big Scale";
const receiptTypeDefault: ReceiptType = "Standard";
const receiptTypeKey = "receiptType";

type CreditAmountType = "Current Order Amount" | "Credit Book Amount";
const creditAmountTypeDefault: CreditAmountType = "Current Order Amount";
const creditAmountTypeKey = "receiptCreditAmountType";

const receiptPaperSizeDefault = "47";
const receiptPapeSizeKey = "receiptPaperSizeKey";

const generateBarcodeSvg = (value: string, width: number = 300, height: number = 80): string => {
  const svgElement = document.createElementNS(value, "svg");

  JsBarcode(svgElement, value, {
    format: "CODE128",
    width: 0.5,
    height: 15,
    displayValue: true,
    fontSize: 10
  });

  return svgElement.outerHTML;
};

export function PrinterSettingPage() {
  const [receiptType, setReceiptType] = useState(
    localStorage.getItem(receiptTypeKey) ?? receiptTypeDefault
  );
  const [creditAmountType, setCreditAmountType] = useState(
    localStorage.getItem(creditAmountTypeKey) ?? creditAmountTypeDefault
  );
  const [receiptPaperSize, setPaperSize] = useState(
    localStorage.getItem(receiptPapeSizeKey) ?? receiptPaperSizeDefault
  );
  const [availablePaperSizes, setPaperSizes] = useState<string[]>(
    JSON.parse(localStorage.getItem("availablePaperSizes") ?? "[]")
  );

  return (
    <div className="p-5 w-[calc(100vw-180px)]">
      <BreadcrumbContext
        route={[
          { name: "Light POS", route: "/" },
          { name: "Setting", route: "/settings" },
          { name: "System Setting", route: "/settings/system-setting" },
          { name: "Printer Setting", route: "/settings/system-setting/printer-setting" }
        ]}
      />
      <p className="text-lg">Printer Setting</p>
      <div className="w-full max-w-[400px] mt-2 flex flex-col">
        {/* <div className="h-[40px] flex items-center gap-3 justify-between cursor-pointer hover:text-primary ">
          <p className="text-sm">Printer</p>
          <Button variant={"outline"} size={"sm"} className="h-8 w-8 p-0">
            <PrinterIcon className="size-4" />
          </Button>
        </div> */}

        <div className="h-[40px] flex items-center gap-3 justify-between cursor-pointer">
          <p className="text-sm">Printer Paper</p>
          <Select
            onValueChange={(value) => {
              localStorage.setItem(receiptPapeSizeKey, String(value));
              setPaperSize(value);
            }}
            value={receiptPaperSize}
          >
            <SelectTrigger className="ml-auto h-8 w-28 rounded-lg pl-2.5">
              <SelectValue>{receiptPaperSize}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="47">47 (58mm)</SelectItem>
              {availablePaperSizes.map((e) => (
                <div className="flex flex-row items-center justify-between">
                  <SelectItem value={e}>
                    <span>{e}mm</span>
                  </SelectItem>
                  <Button
                    variant={"outline"}
                    size={"icon"}
                    className="ml-3 w-12"
                    onClick={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      let existed = JSON.parse(localStorage.getItem("availablePaperSizes") ?? "[]");
                      if (Array.isArray(existed)) {
                        existed = existed.filter((element) => element !== e);
                        localStorage.setItem("availablePaperSizes", JSON.stringify(existed));
                        setPaperSizes(existed);
                        console.log(localStorage.getItem("availablePaperSizes") ?? "[]");
                      }
                    }}
                  >
                    <Trash className="size-4 hover:text-destructive" />
                  </Button>
                </div>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="h-[40px] flex items-center gap-3 justify-between  ">
          <p className="text-sm">Customer Paper Size</p>

          <ValueInputDialog
            type="number"
            description="Enter your receipt paper size in milimeter (mm)."
            initValue=""
            title="Enter Paper Size"
            onSubmit={async (value) => {
              const parsed = parseNumber(value) ?? receiptPaperSizeDefault;
              if (parsed) {
                const existed = JSON.parse(localStorage.getItem("availablePaperSizes") ?? "[]");
                if (Array.isArray(existed)) {
                  existed.push(parsed);
                  localStorage.setItem("availablePaperSizes", JSON.stringify(existed));
                } else {
                  localStorage.setItem("availablePaperSizes", JSON.stringify([parsed]));
                }
                setPaperSizes(existed);
                console.log(localStorage.getItem("availablePaperSizes"));
              }
            }}
          >
            <Button variant={"outline"} size={"sm"} className="h-8 w-8 p-0">
              <Plus className="size-4" />
            </Button>
          </ValueInputDialog>
        </div>

        <div className="h-[40px] flex items-center gap-3 justify-between cursor-pointer">
          <p className="text-sm">Printer Paper Style</p>
          <Select
            onValueChange={(value) => {
              setReceiptType(value);
              localStorage.setItem(receiptTypeKey, value);
            }}
            value={receiptType}
          >
            <SelectTrigger className="ml-auto h-8 w-28 rounded-lg pl-2.5">
              <SelectValue placeholder="Select month" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Standard">Standard</SelectItem>
              <SelectItem value="Line Grid">Line Grid</SelectItem>
              <SelectItem value="Big Scale">Big Scale</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="h-[40px] flex items-center gap-3 justify-between  ">
          <p className="text-sm">Printer Layout</p>
          <PrinterLayoutSetter>
            <Button size={"sm"} variant={"outline"}>
              Set
            </Button>
          </PrinterLayoutSetter>
        </div>
        <div className="h-[40px] flex items-center gap-3 justify-between  ">
          <p className="text-sm">Printer Titles</p>
          <PrinterTitleSetter>
            <Button size={"sm"} variant={"outline"}>
              Set
            </Button>
          </PrinterTitleSetter>
        </div>
        <div className="h-[40px] flex items-center gap-3 justify-between  ">
          <p className="text-sm">Printer Font Size</p>
          <PrinterFontSetter>
            <Button size={"sm"} variant={"outline"}>
              Set
            </Button>
          </PrinterFontSetter>
        </div>
        <div className="h-[40px] flex items-center gap-3 justify-between cursor-pointer">
          <p className="text-sm">Credit Printing</p>
          <Select
            onValueChange={(value) => {
              setCreditAmountType(value);
              localStorage.setItem(creditAmountTypeKey, value);
            }}
            value={creditAmountType}
          >
            <SelectTrigger className="ml-auto h-8 w-[180px] rounded-lg pl-2.5">
              <SelectValue placeholder="Select Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Current Order Amount">Current Order Amount</SelectItem>
              <SelectItem value="Credit Book Amount">Credit Book Amount</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}

export function PrintOrder({
  order,
  creditBookId,
  children
}: {
  order: OrderHistory;
  creditBookId?: string;
  children: React.ReactNode;
}) {
  const receiptRef = useRef<HTMLDivElement>(null);
  const [creditBook, setCreditBook] = useState<Creditbook | undefined>(undefined);
  const [loading, setLoading] = useState(false);

  const [receiptPaperSize, setPaperSize] = useState(
    localStorage.getItem(receiptPapeSizeKey) ?? receiptPaperSizeDefault
  );

  useEffect(function () {
    loadCreditBook();
  }, []);

  const loadCreditBook = async () => {
    if (creditBookId) {
      setLoading(true);
      const data = await CreditbookService.getCreditbook(creditBookId);
      setCreditBook(data);
      setLoading(false);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Print Order Preview</DialogTitle>
        </DialogHeader>
        <div
          style={{
            width: `${receiptPaperSize}mm`,
            height: "auto",
            margin: 0,
            padding: 0,
            pageBreakAfter: "always"
          }}
          ref={receiptRef}
        >
          {loading && <LoadingWidget />}
          {!loading && parse(generatePrinterReceipt(order, { creditBook: creditBook }))}
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Close</Button>
          </DialogClose>
          <ReactToPrint
            trigger={() => <Button>Print</Button>}
            content={() => receiptRef.current}
            pageStyle={`
            @media print {
              @page { size: ${receiptPaperSize}mm auto; margin: 0;padding :0 }
            }
          `}
          />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function generatePrinterReceipt(
  order: OrderHistory,
  options: { creditBook?: Creditbook }
): string {
  let printerLayout = PrinterLayoutService.loadData();
  let printerTitle = PrinterTitleService.loadData();
  let printerFontSize = PrinterFontSizeService.loadData();

  const receiptType = localStorage.getItem(receiptTypeKey) ?? receiptTypeDefault;
  const creditAmountType = localStorage.getItem(creditAmountTypeKey) ?? creditAmountTypeDefault;

  const barcodeSVG = generateBarcodeSvg(order.orderId.length == 0 ? uniqueId() : order.orderId);

  let items = "";
  let meta = "";

  const getStyleOne = (itemData: string, metaData: string) => {
    return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta http-equiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Document</title>
        <style>
    
          body {
            padding: 0;
            margin: 0;
            width: 100%;
          }

          pre {
            font-family: sans-serif;
            font-size:1.4em;
          }

          hr {
                  border-top: 1px dashed black;
              }

          .center {
            width: 100%;
            display: flex;
            flex-direction: row;
            justify-content: center;
            align-items: center;
            font-weight: bold;
            font-size:1.2em;
          }

          .spaceBetween {
            width: 100%;
            display: flex;
            flex-direction: row;
            justify-content: space-between;
            align-items: center;
            font-weight: bold;
            font-size: ${printerFontSize.metaSize}em;
          }


          .alignLeft {
            width: 100%;
            display: flex;
            flex-direction: row;
            flex-wrap: wrap;
            justify-content: start;
            align-items: center;
            font-weight: bold;
            font-size: 1.2em;
            line-height: 1.7;
            text-overflow: ellipsis;
          }

          .alignRight {
            width: 100%;
            display: flex;
            flex-direction: row;
            justify-content: end;
            align-items: center;
            font-weight: bold;
            font-size: 1em;
          }

        

          .headOne {
            font-size: ${printerFontSize.businessNameSize}em;
          }
          .headTwo {
            font-size: 1.8em;
          }
          .headThree {
            font-size: 1.6em;
          }
      
          .bold {
            font-weight: bold;
          }
      

          .textLarge{  
            font-size:1.3em;
          }

          .textNormal{ 
            font-size:1.2em;
          }
          .textSmall {
            font-size: 0.9em;
          }
          .textXSmall{
            font-size: 0.8em;
          }
          .textOverFlow {
            width: 33%;
            font-weight: bold;
            font-size: 1em;
          }
          .textAlignCenter{ 
            text-align: center;
          }
          .textAlignEnd{ 
            text-align: end;
          }

     
        </style>
      </head>
      <body>

      ${
        printerLayout.logoBase64
          ? `<div class="center">
            <img
              src="data:image/png;base64,${printerLayout.logoBase64}"
              alt="Item Image"
              style="width : ${printerFontSize.logoSize}px; height: ${printerFontSize.logoSize}px;"
            />
          </div>`
          : ""
      }
     
   

      <div class="headOne center bold">${printerLayout.name}</div>
      <div class="center bold" style="font-size:${printerFontSize.businessTypeSize}em;text-align:center;">${printerLayout.businessType}</div>
      <div class="center" style="font-size: ${printerFontSize.addressSize}em;text-align:center;">${printerLayout.address}</div>
      <br>

    
       <div class="alignLeft" style="font-size:${printerFontSize.phoneSize}em">${printerTitle.phoneTitle} ${printerLayout.phoneOne}  ${printerLayout.phoneTwo}</div>

      ${order.customer === "" || order.customer === "Unknown" ? `<div class='alignLeft' style='font-size:${printerFontSize.phoneSize}em'><span>Order ${order.orderId}</span></div>` : `<div class='alignLeft' style='font-size:${printerFontSize.phoneSize}em'><span>${printerTitle.customerTitle} ${order.customer}</span></div>`} 

      ${order.casherName === "" ? "" : `<div class='alignLeft' style='font-size:${printerFontSize.phoneSize}em'><span>${printerTitle.saleTitle} ${order.casherName}</span></div>`} 

      <div class="alignLeft" style="font-size:${printerFontSize.phoneSize}em"><span>${moment(order.date).format("DD/MM/y hh:mm A")} (#${order.orderId})</span></div>

      <hr>
 

      <table style="width:100%;margin-right:10px;">
          <thead style="border-collapse: collapse; border-bottom: 1px dashed black;">
            <tr>
              <th style="width: 35%; text-align: start;font-size:${printerFontSize.itemHeaderSize}em;">${printerTitle.itemColumnTitle}</th>
               <th style="width: 25%; text-align: center;font-size:${printerFontSize.itemHeaderSize}em;">${printerTitle.unitPriceColumnTitle}</th>
              <th style="width: 15%; text-align: center;font-size:${printerFontSize.itemHeaderSize}em;">${printerTitle.quantityColumnTitle}</th>
              <th style="width: 25%; text-align: end;font-size:${printerFontSize.itemHeaderSize}em;">${printerTitle.amountColumnTitle}</th>
            </tr>
          </thead>
          <tbody>
            ${itemData}
          </tbody>
      </table>
  
      <hr>  

      ${metaData} 

      <br>
      <div style="text-align:center;font-size:${printerFontSize.closeTextSize}em">${printerLayout.closeText}</div>
      <div class="center textLarge " style="text-align:center;font-size:${printerFontSize.closeTextSize}em"> ${printerTitle.thankyouTitle} </div>
      ${Array.from(Array(printerLayout.paperBreakLineCount), (_, i) => "<br>").join()}
      </body>
    </html> `;
  };

  const getStyleTwo = (itemData: string, metaData: string) => {
    return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta http-equiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Document</title>
        <style>
          body {
            padding: 0;
            margin: 0;
            width: 100%;
          }

          pre {
            font-family: sans-serif;
            font-size:1.4em;
          }

          hr {
                  border-top: 1px dashed black;
              }

          .center {
            width: 100%;
            display: flex;
            flex-direction: row;
            justify-content: center;
            align-items: center;
            font-weight: bold;
            font-size:1.2em;
          }

          .spaceBetween {
            width: 100%;
            display: flex;
            flex-direction: row;
            justify-content: space-between;
            align-items: center;
            font-weight: bold;
            font-size: ${printerFontSize.metaSize}em;
          }


          .alignLeft {
            width: 100%;
            display: flex;
            flex-direction: row;
            flex-wrap: wrap;
            justify-content: start;
            align-items: center;
            font-weight: bold;
            font-size: 1.2em;
            line-height: 1.7;
            text-overflow: ellipsis;
          }

          .alignRight {
            width: 100%;
            display: flex;
            flex-direction: row;
            justify-content: end;
            align-items: center;
            font-weight: bold;
            font-size: 1em;
          }

        

          .headOne {
            font-size: ${printerFontSize.businessNameSize}em;
          }
          .headTwo {
            font-size: 1.8em;
          }
          .headThree {
            font-size: 1.6em;
          }
      
          .bold {
            font-weight: bold;
          }
      

          .textLarge{  
            font-size:1.3em;
          }

          .textNormal{ 
            font-size:1.2em;
          }
          .textSmall {
            font-size: 0.9em;
          }
          .textXSmall{
            font-size: 0.8em;
          }
          .textOverFlow {
            width: 33%;
            font-weight: bold;
            font-size: 1em;
          }
          .textAlignCenter{ 
            text-align: center;
          }
          .textAlignEnd{ 
            text-align: end;
          }

          table,th,td {
            border: 1px solid black;
            border-collapse: collapse;
          }
        </style>
      </head>
      <body>
    
      ${
        printerLayout.logoBase64
          ? `<div class="center">
            <img
              src="data:image/png;base64,${printerLayout.logoBase64}"
              alt="Item Image"
              style="width : ${printerFontSize.logoSize}px; height: ${printerFontSize.logoSize}px;"
            />
          </div>`
          : ""
      }

      <div class="headOne center bold">${printerLayout.name}</div>
      <div class="center bold" style="font-size:${printerFontSize.businessTypeSize}em;text-align:center;">${printerLayout.businessType}</div>
      <div class="center" style="font-size: ${printerFontSize.addressSize}em;text-align:center;">${printerLayout.address}</div>
      <br>

    

      <div class="alignLeft" style="font-size:${printerFontSize.phoneSize}em">${printerTitle.phoneTitle} ${printerLayout.phoneOne}  ${printerLayout.phoneTwo}</div>

      ${order.customer == "" || order.customer == "Unknown" ? `<div class='alignLeft' style='font-size:${printerFontSize.phoneSize}em'><span>Order ${order.orderId}</span></div>` : `<div class='alignLeft' style='font-size:${printerFontSize.phoneSize}em'><span>${printerTitle.customerTitle} ${order.customer}</span></div>`} 

      ${order.casherName == "" ? "" : `<div class='alignLeft' style='font-size:${printerFontSize.phoneSize}em'><span>${printerTitle.saleTitle} ${order.casherName}</span></div>`} 


      <div class="alignLeft" style="font-size:${printerFontSize.phoneSize}em"><span>${moment(order.date).format("DD/MM/y hh:mm A")} (#${order.orderId})</span></div>

     

      <table style="width:100%;margin-right:10px;margin-top:5px;">
          <thead style="border-collapse: collapse; border-bottom: 1px solid red">
            <tr>
              <th style="width: 35%; text-align: start;font-size:${printerFontSize.itemHeaderSize}em;">${printerTitle.itemColumnTitle}</th>
               <th style="width: 25%; text-align: center;font-size:${printerFontSize.itemHeaderSize}em;">${printerTitle.unitPriceColumnTitle}</th>
              <th style="width: 15%; text-align: center;font-size:${printerFontSize.itemHeaderSize}em;">${printerTitle.quantityColumnTitle}</th>
              <th style="width: 25%; text-align: end;font-size:${printerFontSize.itemHeaderSize}em;">${printerTitle.amountColumnTitle}</th>
            </tr>
          </thead>
          <tbody>
             ${itemData}
          </tbody>
      </table>
      <br>
      

       ${metaData} 

      <br>
        <div style="text-align:center;font-size:${printerFontSize.closeTextSize}em">${printerLayout.closeText}</div>
        <div class="center textLarge " style="text-align:center;font-size:${printerFontSize.closeTextSize}em"> ${printerTitle.thankyouTitle} </div>
        ${Array.from(Array(printerLayout.paperBreakLineCount), (_, i) => "<br>").join()}
      </body>
    </html> 
    `;
  };

  const getStyleThree = (itemData: string, metaData: string) => {
    return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta http-equiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Document</title>
        <style>
          body {
            padding: 0;
            margin: 0;
            width: 100%;
          }

          pre {
            font-family: sans-serif;
            font-size:1.4em;
          }

          hr {
                  border-top: 1px dashed black;
              }

          .center {
            width: 100%;
            display: flex;
            flex-direction: row;
            justify-content: center;
            align-items: center;
            font-weight: bold;
            font-size:1.2em;
          }

          .spaceBetween {
            width: 100%;
            display: flex;
            flex-direction: row;
            justify-content: space-between;
            align-items: center;
            font-weight: bold;
            font-size: ${printerFontSize.metaSize}em;
          }


          .alignLeft {
            width: 100%;
            display: flex;
            flex-direction: row;
            flex-wrap: wrap;
            justify-content: start;
            align-items: center;
            font-weight: bold;
            font-size: 1.2em;
            line-height: 1.7;
            text-overflow: ellipsis;
          }

          .alignRight {
            width: 100%;
            display: flex;
            flex-direction: row;
            justify-content: end;
            align-items: center;
            font-weight: bold;
            font-size: 1em;
          }

        

          .headOne {
            font-size: ${printerFontSize.businessNameSize}em;
          }
          .headTwo {
            font-size: 1.8em;
          }
          .headThree {
            font-size: 1.6em;
          }
      
          .bold {
            font-weight: bold;
          }
      

          .textLarge{  
            font-size:1.3em;
          }

          .textNormal{ 
            font-size:1.2em;
          }
          .textSmall {
            font-size: 0.9em;
          }
          .textXSmall{
            font-size: 0.8em;
          }
          .textOverFlow {
            width: 33%;
            font-weight: bold;
            font-size: 1em;
          }
          .textAlignCenter{ 
            text-align: center;
          }
          .textAlignEnd{ 
            text-align: end;
          }

          table,th,td {
            border: 1px solid black;
            border-collapse: collapse;
          }
        </style>
      </head>
      <body>
    
        ${
          printerLayout.logoBase64
            ? `<div  style='position:absolute;top:10;left:10;text-align:center;'><img  src='data:image/png;base64,${printerLayout.logoBase64}' width='${printerFontSize.logoSize}' height='${printerFontSize.logoSize}'></div>`
            : ""
        }


      <div class="headOne center bold">${printerLayout.name}</div>
      
      
       <div class="center bold" style="font-size:${printerFontSize.businessTypeSize}em;text-align:center;">${printerLayout.businessType}</div>
      
       <div class="center" style="font-size: ${printerFontSize.addressSize}em;text-align:center;">${printerLayout.address}</div>
   
    
      <div class="center" style="font-size:${printerFontSize.phoneSize}em">${printerLayout.phoneOne}/ ${printerLayout.phoneOne}</div>
   

      <div class='center' style="font-size: ${printerFontSize.phoneSize}em;">${printerLayout.email}</div>
      <hr>

      <div style="font-weight:bold;font-size: ${printerFontSize.phoneSize}em;display:flex;flex-direction:row;justify-content: space-between;align-items:start;">
        <div >${barcodeSVG}</div>
        <div style="font-weight:bold;${printerFontSize.phoneSize}em">${printerTitle.saleTitle}</div>
        <div style="font-weight:bold;${printerFontSize.phoneSize}em">Date ${moment(order.date).format("DD-MMM-yy")}</div>
      </div>


    
      ${order.customer == "" || order.customer == "Unknown" ? "" : `<div  style='font-weight:bold;font-size:${printerFontSize.phoneSize}em;'><span>${printerTitle.customerTitle} - ${order.customer}</span></div>`} 

      ${order.casherName == "" ? "" : `<div style='margin-top:5px;font-weight:bold;font-size:${printerFontSize.phoneSize}em'><span>${printerTitle.saleTitle} - ${order.casherName}</span></div>`} 

    
      <table style="width:100%;margin-right:10px;margin-top:5px;">
          <thead style="border-collapse: collapse; border-bottom: 1px solid red">
            <tr>
              <th style="width: 35%; text-align: start;font-size:${printerFontSize.itemHeaderSize}em;">${printerTitle.itemColumnTitle}</th>
               <th style="width: 25%; text-align: center;font-size:${printerFontSize.itemHeaderSize}em;">${printerTitle.unitPriceColumnTitle}</th>
              <th style="width: 15%; text-align: center;font-size:${printerFontSize.itemHeaderSize}em;">${printerTitle.quantityColumnTitle}</th>
              <th style="width: 25%; text-align: end;font-size:${printerFontSize.itemHeaderSize}em;">${printerTitle.amountColumnTitle}</th>
            </tr>
          </thead>
          <tbody>
             ${itemData}
          </tbody>
      </table>
      <br>
      

       ${metaData} 

      <br>
        <div style="text-align:center;font-size:${printerFontSize.closeTextSize}em">${printerLayout.closeText}</div>
        <div class="center textLarge " style="text-align:center;font-size:${printerFontSize.closeTextSize}em"> ${printerTitle.thankyouTitle} </div>
        ${Array.from(Array(printerLayout.paperBreakLineCount), (_, i) => "<br>").join()}
      </body>
    </html> 
    `;
  };

  function addItem(item: CartItem) {
    items += getItemHtml(item);
  }

  function addMeta(name: string, value: string) {
    meta += getMetaHtml(name, value);
  }

  function addDivider() {
    meta += getDividerHtml();
  }

  function getItemHtml(item: CartItem): string {
    const isWithChildren = item.children != null && item.children!.length > 0;
    const amountPrice = item.usedCustomPrice ? item.price : item.getTotal();
    const withChildrenPrice = item.getTotalChildren({ includeMe: true });
    const quantity = formatNumberWithCommas(item.quantity);
    const unitPrice = formatNumberWithCommas(amountPrice / item.quantity);

    return `<tr>
            <td style="width: 35%; text-align: start;line-height:1.5;font-weight:bold;font-size:${printerFontSize.itemSize}em;">${item.itemName}</td>

            <td style="width: 25%; text-align: center;font-size:${printerFontSize.itemSize}em;">${isWithChildren ? "Group" : unitPrice}</td>

            <td style="width: 15%; text-align: center;font-size:${printerFontSize.itemSize}em;">${isWithChildren ? "${item.getTotalChildrenQuantity()}" : quantity}</td>

            <td style="width: 25%; text-align: end;font-size:${printerFontSize.itemSize}em;">${formatNumberWithCommas(isWithChildren ? withChildrenPrice : amountPrice)}</td>
          </tr>`;
  }

  function getMetaHtml(name: string, value: string): string {
    return `<div class="spaceBetween">
        <span>${name}</span>
        <span>${value}</span>
      </div>`;
  }

  function getDividerHtml(): string {
    return `<hr>`;
  }

  order.orders.forEach((element) => {
    addItem(element);
  });

  if (
    (order.discount != null && order.discount! > 0) ||
    (order.tag != null && order.tag! > 0) ||
    (order.metaData != null && Object.keys(order.metaData!).length > 0)
  ) {
    addMeta(
      printerTitle.subTotalTitle,
      `${formatNumberWithCommas(order.amount)} ${printerTitle.currencyTitle}`
    );
  }

  if (order.discount != null && order.discount! > 0) {
    addMeta(
      printerTitle.discountTitle,
      `-${formatNumberWithCommas(order.discount)} ${printerTitle.currencyTitle}`
    );
  }

  if (order.tag != null && order.tag! > 0) {
    addMeta(
      printerTitle.taxTitle,
      `${formatNumberWithCommas(order.tag)} ${printerTitle.currencyTitle}`
    );
  }

  if (order.warrantyMonth != null && order.warrantyMonth! > 0) {
    addMeta(printerTitle.warrantyTitle, `${order.warrantyMonth} Months`);
  }

  if ((order.discount != null && order.discount! > 0) || (order.tag != null && order.tag! > 0)) {
    addDivider();
  }
  if (order.metaData != null && Object.keys(order.metaData!).length > 0) {
    Object.keys(order.metaData!).forEach((element) => {
      let value = order.metaData![element];
      let isNumber = parseNumber(String(value)) !== undefined;
      let number = isNumber ? parseNumber(String(value)) : 0;
      addMeta(
        `${element}`,
        isNumber
          ? `${formatNumberWithCommas(number ?? 0)} ${printerTitle.currencyTitle}`
          : String(value).replaceAll("*", "")
      );
    });
    addDivider();
  }

  addMeta(
    printerTitle.totalTitle,
    `${formatNumberWithCommas(order.calculateTotal())} ${printerTitle.currencyTitle}`
  );
  addMeta("", "");

  if (order.payAmount < order.calculateTotal()) {
    addMeta(
      printerTitle.payamountTitle,
      `${formatNumberWithCommas(order.payAmount)} ${printerTitle.currencyTitle}`
    );
    addDivider();
    const leftAmount = order.calculateTotal() - order.payAmount!;
    const creditBookAmount = options.creditBook?.creditAmount ?? 0;
    let totalLeftAmount =
      creditAmountType === "Credit Book Amount" ? creditBookAmount + leftAmount : leftAmount;
    addMeta(
      printerTitle.leftAmountTitle,
      `${formatNumberWithCommas(totalLeftAmount)} ${printerTitle.currencyTitle}`
    );

    addMeta("", printerTitle.unpaidTitle);
  } else {
    addMeta("", printerTitle.paidTitle);
  }

  const renderBodyContent =
    receiptType === "Standard"
      ? getStyleOne(items, meta)
      : receiptType === "Line Grid"
        ? getStyleTwo(items, meta)
        : getStyleThree(items, meta);

  return renderBodyContent;
}

interface PrinterLayoutInterface {
  logoBase64: string | undefined;
  name: string;
  businessType: string;
  email: string;
  address: string;
  phoneOne: string;
  phoneTwo: string;
  closeText: string;
  paperBreakLineCount: number;
}

function PrinterLayoutSetter({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [defaultConfig, setConfigs] = useState<PrinterLayoutInterface>(
    PrinterLayoutService.loadData()
  );
  const [logo, setLogo] = useState<string | undefined>(undefined);
  const printerLayoutForm = useForm<PrinterLayoutInterface>({
    defaultValues: defaultConfig
  });

  useEffect(() => {
    const saved = PrinterLayoutService.loadData();
    setConfigs(saved);

    setLogo(saved.logoBase64);
  }, []);

  const submit = (data: PrinterLayoutInterface) => {
    setOpen(false);
    data.paperBreakLineCount =
      parseNumber(String(data.paperBreakLineCount)) ?? defaultConfig.paperBreakLineCount;
    data.logoBase64 = logo;
    PrinterLayoutService.saveData(data);

    printerLayoutForm.reset(data);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Printer Layout</DialogTitle>
        </DialogHeader>

        <p className="font-semibold">Logo</p>
        {logo && logo.length !== 0 && (
          <Base64ImageViewer title="Logo" base64String={logo}>
            <img
              src={`data:image/png;base64,${logo}`}
              alt="Item Image"
              className="size-[150px] rounded-lg border "
            />
          </Base64ImageViewer>
        )}

        <div className="flex flex-row gap-3 items-center">
          <Input
            type="file"
            className="h-[33px]"
            accept="image/png, image/jpeg, image/gif"
            onChange={async (event) => {
              if (event.target.files) {
                const selectedFile = event.target.files[0];
                const bytes = await browserReadFileBytes(selectedFile);
                const base64String = arrayBufferToBase64(bytes);
                setLogo(base64String);
              }
            }}
          />
          {logo && (
            <Button
              size="sm"
              onClick={async (event) => {
                setLogo(undefined);
              }}
            >
              Remove Image
            </Button>
          )}
        </div>
        <Form {...printerLayoutForm}>
          <form
            className="space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              return printerLayoutForm.handleSubmit(submit)();
            }}
          >
            <FormField
              name="name"
              rules={{
                required: "Name is requried"
              }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Business Name</FormLabel>
                  <FormControl>
                    <Input {...field}></Input>
                  </FormControl>
                  <FormMessage></FormMessage>
                </FormItem>
              )}
            ></FormField>
            <FormField
              name="businessType"
              rules={{
                required: "Type is requried"
              }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Business Type</FormLabel>
                  <FormControl>
                    <Input {...field}></Input>
                  </FormControl>
                  <FormMessage></FormMessage>
                </FormItem>
              )}
            ></FormField>
            <FormField
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input {...field}></Input>
                  </FormControl>
                  <FormMessage></FormMessage>
                </FormItem>
              )}
            ></FormField>
            <FormField
              name="address"
              rules={{
                required: "Address is requried"
              }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address</FormLabel>
                  <FormControl>
                    <Input {...field}></Input>
                  </FormControl>
                  <FormMessage></FormMessage>
                </FormItem>
              )}
            ></FormField>
            <FormField
              name="phoneOne"
              rules={{
                required: "Phone One is requried"
              }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone 1</FormLabel>
                  <FormControl>
                    <Input {...field}></Input>
                  </FormControl>
                  <FormMessage></FormMessage>
                </FormItem>
              )}
            ></FormField>
            <FormField
              name="phoneTwo"
              rules={{
                required: "Phone 2 is requried"
              }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone 2</FormLabel>
                  <FormControl>
                    <Input {...field}></Input>
                  </FormControl>
                  <FormMessage></FormMessage>
                </FormItem>
              )}
            ></FormField>
            <FormField
              name="closeText"
              rules={{
                required: "Close Text is requried"
              }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Close Text</FormLabel>
                  <FormControl>
                    <Input {...field}></Input>
                  </FormControl>
                  <FormMessage></FormMessage>
                </FormItem>
              )}
            ></FormField>

            <FormField
              name="paperBreakLineCount"
              rules={{
                required: "Line is requried",
                validate: (value) => !isNaN(value) || "Invalid Number"
              }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Paper Break Line</FormLabel>
                  <FormControl>
                    <Input {...field} type="number"></Input>
                  </FormControl>
                  <FormMessage></FormMessage>
                </FormItem>
              )}
            ></FormField>
            <DialogFooter>
              <Button type="submit">Save</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export class PrinterLayoutService {
  static storageKey = "printer_layout_config";
  static defaultConfigs: PrinterLayoutInterface = {
    name: appName,
    businessType: appDescription,
    phoneOne: phoneOne,
    phoneTwo: phoneTwo,
    email: "",
    address: address,
    logoBase64: undefined,
    closeText: "See You Again",
    paperBreakLineCount: 2
  };

  static loadData(): PrinterLayoutInterface {
    const savedConfig = localStorage.getItem(this.storageKey);
    const json = savedConfig ? JSON.parse(savedConfig) : this.defaultConfigs;
    return {
      name: json["name"] ?? this.defaultConfigs.name,
      businessType: json["businessType"] ?? this.defaultConfigs.businessType,
      phoneOne: json["phoneOne"] ?? this.defaultConfigs.phoneOne,
      phoneTwo: json["phoneTwo"] ?? this.defaultConfigs.phoneTwo,
      email: json["email"] ?? this.defaultConfigs.email,
      address: json["address"] ?? this.defaultConfigs.address,
      closeText: json["closeText"] ?? this.defaultConfigs.closeText,
      logoBase64: json["logoBase64"] ?? this.defaultConfigs.logoBase64,
      paperBreakLineCount:
        parseNumber(json["paperBreakLineCount"]) ?? this.defaultConfigs.paperBreakLineCount
    };
  }

  static saveData(data: PrinterLayoutInterface) {
    localStorage.setItem(this.storageKey, JSON.stringify(data));
  }
}

interface PrinterTitleInterface {
  phoneTitle: string;
  timeTitle: string;
  customerTitle: string;
  saleTitle: string;
  itemColumnTitle: string;
  unitPriceColumnTitle: string;
  quantityColumnTitle: string;
  amountColumnTitle: string;
  thankyouTitle: string;
  subTotalTitle: string;
  discountTitle: string;
  taxTitle: string;
  totalTitle: string;
  warrantyTitle: string;
  payamountTitle: string;
  unpaidTitle: string;
  paidTitle: string;
  leftAmountTitle: string;
  currencyTitle: string;
}

class PrinterTitleService {
  static storageKey = "printer_title_config";
  static defaultConfigs: PrinterTitleInterface = {
    phoneTitle: "Ph",
    timeTitle: "Time",
    customerTitle: "Customer",
    saleTitle: "Sale",
    itemColumnTitle: "Name",
    unitPriceColumnTitle: "Price",
    quantityColumnTitle: "Quantity",
    amountColumnTitle: "Amount",
    thankyouTitle: "Thank You",
    subTotalTitle: "Subtotal",
    discountTitle: "Discount",
    taxTitle: "Tax",
    totalTitle: "Total",
    warrantyTitle: "Warranty",
    payamountTitle: "Pay Amount",
    unpaidTitle: "Unpaid",
    paidTitle: "Paid",
    leftAmountTitle: "Left Amount",
    currencyTitle: "Kyat"
  };

  static loadData(): PrinterTitleInterface {
    const savedConfig = localStorage.getItem(this.storageKey);
    const json = savedConfig ? JSON.parse(savedConfig) : this.defaultConfigs;
    return {
      phoneTitle: json["phoneTitle"] ?? this.defaultConfigs.phoneTitle,
      timeTitle: json["timeTitle"] ?? this.defaultConfigs.timeTitle,
      customerTitle: json["customerTitle"] ?? this.defaultConfigs.customerTitle,
      saleTitle: json["saleTitle"] ?? this.defaultConfigs.saleTitle,
      itemColumnTitle: json["itemColumnTitle"] ?? this.defaultConfigs.itemColumnTitle,
      unitPriceColumnTitle:
        json["unitPriceColumnTitle"] ?? this.defaultConfigs.unitPriceColumnTitle,
      quantityColumnTitle: json["quantityColumnTitle"] ?? this.defaultConfigs.quantityColumnTitle,
      amountColumnTitle: json["amountColumnTitle"] ?? this.defaultConfigs.amountColumnTitle,
      thankyouTitle: json["thankyouTitle"] ?? this.defaultConfigs.thankyouTitle,
      subTotalTitle: json["subTotalTitle"] ?? this.defaultConfigs.subTotalTitle,
      discountTitle: json["discountTitle"] ?? this.defaultConfigs.discountTitle,
      taxTitle: json["taxTitle"] ?? this.defaultConfigs.taxTitle,
      totalTitle: json["totalTitle"] ?? this.defaultConfigs.totalTitle,
      warrantyTitle: json["warrantyTitle"] ?? this.defaultConfigs.warrantyTitle,
      payamountTitle: json["payamountTitle"] ?? this.defaultConfigs.payamountTitle,
      unpaidTitle: json["unpaidTitle"] ?? this.defaultConfigs.unpaidTitle,
      paidTitle: json["paidTitle"] ?? this.defaultConfigs.paidTitle,
      leftAmountTitle: json["leftAmountTitle"] ?? this.defaultConfigs.leftAmountTitle,
      currencyTitle: json["currencyTitle"] ?? this.defaultConfigs.currencyTitle
    };
  }

  static saveData(data: PrinterTitleInterface) {
    localStorage.setItem(this.storageKey, JSON.stringify(data));
  }
}

function PrinterTitleSetter({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [defaultConfig, setConfigs] = useState<PrinterTitleInterface>(
    PrinterTitleService.loadData()
  );
  const printerTitleForm = useForm<PrinterTitleInterface>({
    defaultValues: defaultConfig
  });

  const submit = (data: PrinterTitleInterface) => {
    setOpen(false);
    PrinterTitleService.saveData(data);
    printerTitleForm.reset(data);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Printer Title</DialogTitle>
        </DialogHeader>

        <Form {...printerTitleForm}>
          <form
            className="space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              return printerTitleForm.handleSubmit(submit)();
            }}
          >
            <FormField
              name="phoneTitle"
              rules={{
                required: "Phone Title is requried"
              }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Title</FormLabel>
                  <FormControl>
                    <Input {...field}></Input>
                  </FormControl>
                  <FormMessage></FormMessage>
                </FormItem>
              )}
            ></FormField>
            <FormField
              name="timeTitle"
              rules={{
                required: "Time Title is requried"
              }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Time Title</FormLabel>
                  <FormControl>
                    <Input {...field}></Input>
                  </FormControl>
                  <FormMessage></FormMessage>
                </FormItem>
              )}
            ></FormField>
            <FormField
              name="customerTitle"
              rules={{
                required: "Customer Title is requried"
              }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Customer Title</FormLabel>
                  <FormControl>
                    <Input {...field}></Input>
                  </FormControl>
                  <FormMessage></FormMessage>
                </FormItem>
              )}
            ></FormField>
            <FormField
              name="saleTitle"
              rules={{
                required: "Sale Title is requried"
              }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sale Title</FormLabel>
                  <FormControl>
                    <Input {...field}></Input>
                  </FormControl>
                  <FormMessage></FormMessage>
                </FormItem>
              )}
            ></FormField>
            <FormField
              name="itemColumnTitle"
              rules={{
                required: "Item Column is requried"
              }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Item Column Title</FormLabel>
                  <FormControl>
                    <Input {...field}></Input>
                  </FormControl>
                  <FormMessage></FormMessage>
                </FormItem>
              )}
            ></FormField>
            <FormField
              name="unitPriceColumnTitle"
              rules={{
                required: "Unit Price Column is requried"
              }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Unit Price Column Title</FormLabel>
                  <FormControl>
                    <Input {...field}></Input>
                  </FormControl>
                  <FormMessage></FormMessage>
                </FormItem>
              )}
            ></FormField>
            <FormField
              name="quantityColumnTitle"
              rules={{
                required: "Quantity Column is requried"
              }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quantity Column Title</FormLabel>
                  <FormControl>
                    <Input {...field}></Input>
                  </FormControl>
                  <FormMessage></FormMessage>
                </FormItem>
              )}
            ></FormField>
            <FormField
              name="amountColumnTitle"
              rules={{
                required: "Amount Column is requried"
              }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount Column Title</FormLabel>
                  <FormControl>
                    <Input {...field}></Input>
                  </FormControl>
                  <FormMessage></FormMessage>
                </FormItem>
              )}
            ></FormField>
            <FormField
              name="thankyouTitle"
              rules={{
                required: "Thank you title is requried"
              }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Thank you Title</FormLabel>
                  <FormControl>
                    <Input {...field}></Input>
                  </FormControl>
                  <FormMessage></FormMessage>
                </FormItem>
              )}
            ></FormField>
            <FormField
              name="subTotalTitle"
              rules={{
                required: "Sub Total title is requried"
              }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sub Total Title</FormLabel>
                  <FormControl>
                    <Input {...field}></Input>
                  </FormControl>
                  <FormMessage></FormMessage>
                </FormItem>
              )}
            ></FormField>
            <FormField
              name="discountTitle"
              rules={{
                required: "Discount title is requried"
              }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Discount Title</FormLabel>
                  <FormControl>
                    <Input {...field}></Input>
                  </FormControl>
                  <FormMessage></FormMessage>
                </FormItem>
              )}
            ></FormField>
            <FormField
              name="taxTitle"
              rules={{
                required: "Tax title is requried"
              }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tax Title</FormLabel>
                  <FormControl>
                    <Input {...field}></Input>
                  </FormControl>
                  <FormMessage></FormMessage>
                </FormItem>
              )}
            ></FormField>
            <FormField
              name="totalTitle"
              rules={{
                required: "Total title is requried"
              }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Total Title</FormLabel>
                  <FormControl>
                    <Input {...field}></Input>
                  </FormControl>
                  <FormMessage></FormMessage>
                </FormItem>
              )}
            ></FormField>
            <FormField
              name="warrantyTitle"
              rules={{
                required: "Warranty title is requried"
              }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Warranty Title</FormLabel>
                  <FormControl>
                    <Input {...field}></Input>
                  </FormControl>
                  <FormMessage></FormMessage>
                </FormItem>
              )}
            ></FormField>
            <FormField
              name="payamountTitle"
              rules={{
                required: "Pay amount title is requried"
              }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Pay amount Title</FormLabel>
                  <FormControl>
                    <Input {...field}></Input>
                  </FormControl>
                  <FormMessage></FormMessage>
                </FormItem>
              )}
            ></FormField>
            <FormField
              name="unpaidTitle"
              rules={{
                required: "Unpaid title is requried"
              }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Unpaid Title</FormLabel>
                  <FormControl>
                    <Input {...field}></Input>
                  </FormControl>
                  <FormMessage></FormMessage>
                </FormItem>
              )}
            ></FormField>
            <FormField
              name="paidTitle"
              rules={{
                required: "Paid title is requried"
              }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Paid Title</FormLabel>
                  <FormControl>
                    <Input {...field}></Input>
                  </FormControl>
                  <FormMessage></FormMessage>
                </FormItem>
              )}
            ></FormField>
            <FormField
              name="leftAmountTitle"
              rules={{
                required: "Left Amount title is requried"
              }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Left Amount Title</FormLabel>
                  <FormControl>
                    <Input {...field}></Input>
                  </FormControl>
                  <FormMessage></FormMessage>
                </FormItem>
              )}
            ></FormField>
            <FormField
              name="currencyTitle"
              rules={{
                required: "Currency title is requried"
              }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Currency Title</FormLabel>
                  <FormControl>
                    <Input {...field}></Input>
                  </FormControl>
                  <FormMessage></FormMessage>
                </FormItem>
              )}
            ></FormField>
          </form>
          <DialogFooter>
            <Button
              variant={"outline"}
              onClick={() => {
                PrinterTitleService.saveData(PrinterTitleService.defaultConfigs);
                printerTitleForm.reset(PrinterTitleService.defaultConfigs);
                setOpen(false);
              }}
            >
              Set Default
            </Button>
            <Button
              onClick={() => {
                printerTitleForm.handleSubmit(submit)();
              }}
            >
              Save
            </Button>
          </DialogFooter>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

interface PrinterFontInterface {
  logoSize: number;
  businessNameSize: number;
  businessTypeSize: number;
  phoneSize: number;
  addressSize: number;
  closeTextSize: number;
  itemHeaderSize: number;
  itemSize: number;
  metaSize: number;
}

class PrinterFontSizeService {
  static storageKey = "printer_font_size_config";
  static defaultConfigs: PrinterFontInterface = {
    logoSize: 100,
    businessNameSize: 1.3,
    businessTypeSize: 0.9,
    phoneSize: 0.6,
    addressSize: 0.6,
    closeTextSize: 0.6,
    itemHeaderSize: 0.6,
    itemSize: 0.6,
    metaSize: 0.6
  };

  static loadData(): PrinterFontInterface {
    const savedConfig = localStorage.getItem(this.storageKey);
    const json = savedConfig ? JSON.parse(savedConfig) : this.defaultConfigs;
    return {
      logoSize: parseNumber(json["logoSize"]) ?? this.defaultConfigs.logoSize,
      businessNameSize:
        parseNumber(json["businessNameSize"]) ?? this.defaultConfigs.businessNameSize,
      businessTypeSize:
        parseNumber(json["businessTypeSize"]) ?? this.defaultConfigs.businessTypeSize,
      phoneSize: parseNumber(json["phoneSize"]) ?? this.defaultConfigs.phoneSize,
      addressSize: parseNumber(json["addressSize"]) ?? this.defaultConfigs.addressSize,
      closeTextSize: parseNumber(json["closeTextSize"]) ?? this.defaultConfigs.closeTextSize,
      itemHeaderSize: parseNumber(json["itemHeaderSize"]) ?? this.defaultConfigs.itemHeaderSize,
      itemSize: parseNumber(json["itemSize"]) ?? this.defaultConfigs.itemSize,
      metaSize: parseNumber(json["metaSize"]) ?? this.defaultConfigs.metaSize
    };
  }

  static saveData(data: PrinterFontInterface) {
    localStorage.setItem(this.storageKey, JSON.stringify(data));
  }
}

function PrinterFontSetter({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [defaultConfig, setConfigs] = useState<PrinterFontInterface>(
    PrinterFontSizeService.loadData()
  );
  const printerFontSizeForm = useForm<PrinterFontInterface>({
    defaultValues: defaultConfig
  });

  const submit = (data: PrinterFontInterface) => {
    setOpen(false);
    PrinterFontSizeService.saveData(data);
    printerFontSizeForm.reset(data);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Printer Title</DialogTitle>
        </DialogHeader>

        <Form {...printerFontSizeForm}>
          <form
            className="space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              return printerFontSizeForm.handleSubmit(submit)();
            }}
          >
            <FormField
              name="logoSize"
              rules={{
                required: "Logo Size is requried",
                validate: (value) => !isNaN(value) || "Invalid Number"
              }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Logo Size</FormLabel>
                  <FormControl>
                    <Input {...field} type="number"></Input>
                  </FormControl>
                  <FormMessage></FormMessage>
                </FormItem>
              )}
            ></FormField>
            <FormField
              name="businessNameSize"
              rules={{
                required: "Name Size is requried",
                validate: (value) => !isNaN(value) || "Invalid Number"
              }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name Size</FormLabel>
                  <FormControl>
                    <Input {...field} type="number"></Input>
                  </FormControl>
                  <FormMessage></FormMessage>
                </FormItem>
              )}
            ></FormField>

            <FormField
              name="businessTypeSize"
              rules={{
                required: "Type Size is requried",
                validate: (value) => !isNaN(value) || "Invalid Number"
              }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type Size</FormLabel>
                  <FormControl>
                    <Input {...field} type="number"></Input>
                  </FormControl>
                  <FormMessage></FormMessage>
                </FormItem>
              )}
            ></FormField>
            <FormField
              name="addressSize"
              rules={{
                required: "Address Size is requried",
                validate: (value) => !isNaN(value) || "Invalid Number"
              }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address Size</FormLabel>
                  <FormControl>
                    <Input {...field} type="number"></Input>
                  </FormControl>
                  <FormMessage></FormMessage>
                </FormItem>
              )}
            ></FormField>
            <FormField
              name="phoneSize"
              rules={{
                required: "Phone Size is requried",
                validate: (value) => !isNaN(value) || "Invalid Number"
              }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Size</FormLabel>
                  <FormControl>
                    <Input {...field} type="number"></Input>
                  </FormControl>
                  <FormMessage></FormMessage>
                </FormItem>
              )}
            ></FormField>
            <FormField
              name="closeTextSize"
              rules={{
                required: "Close Size is requried",
                validate: (value) => !isNaN(value) || "Invalid Number"
              }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Close Size</FormLabel>
                  <FormControl>
                    <Input {...field} type="number"></Input>
                  </FormControl>
                  <FormMessage></FormMessage>
                </FormItem>
              )}
            ></FormField>
            <FormField
              name="itemHeaderSize"
              rules={{
                required: "Item Header Size is requried",
                validate: (value) => !isNaN(value) || "Invalid Number"
              }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Item Header Size</FormLabel>
                  <FormControl>
                    <Input {...field} type="number"></Input>
                  </FormControl>
                  <FormMessage></FormMessage>
                </FormItem>
              )}
            ></FormField>
            <FormField
              name="itemSize"
              rules={{
                required: "Item Size is requried",
                validate: (value) => !isNaN(value) || "Invalid Number"
              }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Item Size</FormLabel>
                  <FormControl>
                    <Input {...field} type="number"></Input>
                  </FormControl>
                  <FormMessage></FormMessage>
                </FormItem>
              )}
            ></FormField>
            <FormField
              name="metaSize"
              rules={{
                required: "Meta Size is requried",
                validate: (value) => !isNaN(value) || "Invalid Number"
              }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Meta Size</FormLabel>
                  <FormControl>
                    <Input {...field} type="number"></Input>
                  </FormControl>
                  <FormMessage></FormMessage>
                </FormItem>
              )}
            ></FormField>
          </form>
          <DialogFooter>
            <Button
              variant={"outline"}
              onClick={() => {
                PrinterFontSizeService.saveData(PrinterFontSizeService.defaultConfigs);
                printerFontSizeForm.reset(PrinterFontSizeService.defaultConfigs);
                setOpen(false);
              }}
            >
              Set Default
            </Button>
            <Button
              onClick={() => {
                printerFontSizeForm.handleSubmit(submit)();
              }}
            >
              Save
            </Button>
          </DialogFooter>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
