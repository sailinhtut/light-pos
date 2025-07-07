import BreadcrumbContext from "@renderer/app/view/components/breadcrumb_context";
import React, { useEffect, useState } from "react";
import UnitService from "../service/unit_service";
import LoadingWidget from "@renderer/app/view/components/loading";
import {
  ChevronLeft,
  ChevronRight,
  Divide,
  MoreHorizontal,
  Plus,
  RefreshCcw,
  Trash,
  X
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow
} from "@renderer/assets/shadcn/components/ui/table";
import { chunkArray, paginator, uniqueId } from "@renderer/utils/general_utils";
import { Button } from "@renderer/assets/shadcn/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@renderer/assets/shadcn/components/ui/dropdown-menu";
import { Input } from "@renderer/assets/shadcn/components/ui/input";
import {
  Dialog,
  DialogClose,
  DialogFooter,
  DialogHeader,
  DialogTrigger,
  DialogContent,
  DialogDescription,
  DialogTitle
} from "@renderer/assets/shadcn/components/ui/dialog";

import { Control, FieldValues, useForm } from "react-hook-form";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@renderer/assets/shadcn/components/ui/form";
import { toast } from "@renderer/assets/shadcn/components/ui/use-toast";
import { Unit } from "../interface/unit";
import { Textarea } from "@renderer/assets/shadcn/components/ui/textarea";
import { Close } from "@radix-ui/react-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@renderer/assets/shadcn/components/ui/select";
import { Switch } from "@renderer/assets/shadcn/components/ui/switch";
import { ConfirmDialog } from "@renderer/app/view/components/confirm_dialog";
import { motion } from "framer-motion";
import { Checkbox } from "@renderer/assets/shadcn/components/ui/checkbox";

export default function UnitListPage() {
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [paginateIndex, setPanigateIndex] = useState(0);

  useEffect(function () {
    fetchUnits();
  }, []);

  const fetchUnits = async () => {
    setLoading(true);
    const data = await UnitService.getUnits();
    setUnits(data);
    setLoading(false);
  };

  const filterUnits = (origin: Unit[]) => {
    let filtered = origin.filter(
      (element) =>
        element.unitName.toLowerCase().includes(query.toLowerCase()) ||
        element.unitId.includes(query)
    );

    return filtered;
  };

  const [selectedIDs, setSelectedID] = useState<string[]>([]);
  const filteredUnits = filterUnits(units ?? []);
  const paginatedData = paginator(filteredUnits, paginateIndex, 10);

  return (
    <div className="p-5 w-[calc(100vw-180px)]">
      <BreadcrumbContext
        route={[
          { name: "Light POS", route: "/" },
          { name: "Setting", route: "/settings" },
          { name: "Product Menu", route: "/settings/product-menu" },
          { name: "Unit", route: "/settings/product-menu/unit-list" }
        ]}
      />
      <div className="flex justify-between items-center">
        <p className="text-lg">Unit List</p>
        <div className="flex">
          <Button
            variant={"ghost"}
            className="w-[40px] px-2"
            onClick={() => {
              if (!loading) {
                fetchUnits();
              }
            }}
          >
            <RefreshCcw
              className={` size-5 text-slate-500 ${loading && "animate-spin transform rotate-180"}`}
            />
          </Button>
          <Input
            className="ml-3"
            placeholder="Search"
            onChange={(event) => setQuery(event.target.value)}
            value={query}
          ></Input>
          <UnitDialog
            title="Add Unit"
            actionTitle="Add"
            allUnits={units}
            onCreated={async (unit) => {
              const result = await UnitService.addUnit(unit);
              if (result) {
                toast({
                  title: `Successfully created ${unit.unitName}`
                });
                await fetchUnits();
              }
            }}
          >
            <Button className="ml-3">Add Unit</Button>
          </UnitDialog>
          <motion.div
            initial={{
              x: "-100%",
              opacity: 1,
              width: 0
            }}
            animate={{
              x: selectedIDs.length > 0 ? 0 : "100%",
              opacity: selectedIDs.length > 0 ? 1 : 0,
              width: selectedIDs.length > 0 ? "auto" : 0
            }}
          >
            <ConfirmDialog
              actionVariant={"destructive"}
              title="Delete Unit"
              description="Are you sure to delete all selected units ?"
              actionTitle="Confirm"
              onConfirm={async () => {
                setLoading(true);
                for (const unitId of selectedIDs) {
                  await UnitService.deleteUnit(unitId);
                }
                setLoading(false);
                setSelectedID([]);
                fetchUnits();
              }}
            >
              <Button variant={"destructive"} size={"icon"} className="ml-3">
                <Trash className="size-5" />
              </Button>
            </ConfirmDialog>
          </motion.div>
        </div>
      </div>
      {loading && <LoadingWidget />}
      {!loading && (
        <div className="border rounded-md mt-5 ">
          <Table className="">
            <TableHeader>
              <TableRow>
                <TableHead className="rounded-tl-md">
                  <Checkbox
                    className="border-slate-500 shadow-none ml-2 "
                    checked={selectedIDs.length === filteredUnits.length && selectedIDs.length > 0}
                    onCheckedChange={(value) => {
                      if (value) {
                        setSelectedID(filteredUnits.map((e) => e.unitId));
                      } else {
                        setSelectedID([]);
                      }
                    }}
                  />
                </TableHead>
                <TableHead className="flex flex-row items-center ">
                  <motion.div
                    initial={{
                      scale: 0,
                      width: 0
                    }}
                    animate={{
                      scale: selectedIDs.length === 0 ? 0 : "100%",
                      width: selectedIDs.length === 0 ? 0 : "auto"
                    }}
                  >
                    <span className="p-1 text-sm text-primary mr-2">{selectedIDs.length}</span>
                  </motion.div>
                  Name
                </TableHead>
                <TableHead>ID</TableHead>

                <TableHead className="rounded-tr-md"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!paginatedData && (
                <TableRow>
                  <TableCell colSpan={5} className="pl-5 text-slate-500">
                    No Data
                  </TableCell>
                </TableRow>
              )}
              {paginatedData &&
                paginatedData.map((unit, index) => (
                  <UnitDetailDialog allUnits={units} unit={unit}>
                    <TableRow key={unit.unitId}>
                      {/* <TableCell className="pl-5">{index + 1}</TableCell> */}
                      <TableCell>
                        <Checkbox
                          className="border-slate-500 shadow-none ml-2"
                          checked={selectedIDs.includes(unit.unitId)}
                          onClick={(event) => event.stopPropagation()}
                          onCheckedChange={(value) => {
                            if (value) {
                              setSelectedID([unit.unitId, ...selectedIDs]);
                            } else {
                              setSelectedID(selectedIDs.filter((e) => e !== unit.unitId));
                            }
                          }}
                        />
                      </TableCell>
                      <TableCell>{unit.unitName}</TableCell>
                      <TableCell>{unit.unitId}</TableCell>

                      <TableCell
                        onClick={(event) => {
                          event.preventDefault();
                          event.stopPropagation();
                        }}
                      >
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="size-5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            onClick={(event) => {
                              event.preventDefault();
                              event.stopPropagation();
                            }}
                          >
                            <DropdownMenuGroup>
                              <ConvertionDialog
                                onAdded={async (result) => {
                                  const map = new Map();
                                  map.set(result.key, result.value);
                                  // const resultConvertion = Object.fromEntries(map);
                                  const linkedUnit = units.find(
                                    (element) => element.unitId === result.key
                                  );
                                  const currentUnit = unit;

                                  if (String(result.value).includes("parentUnit-")) {
                                    // revert
                                    (currentUnit.convertion ?? {})[result.key] = result.value;
                                    (linkedUnit?.convertion ?? {})[currentUnit.unitId] = parseInt(
                                      String(result.value).replaceAll("parentUnit-", "")
                                    );
                                  } else {
                                    // normal
                                    (currentUnit.convertion ?? {})[result.key] = result.value;
                                    (linkedUnit!.convertion ?? {})[currentUnit.unitId] =
                                      `parentUnit-${result.value}`;
                                  }
                                  await UnitService.updateUnit(currentUnit);
                                  await UnitService.updateUnit(linkedUnit!);
                                  await fetchUnits();
                                }}
                                title="Add Convetion"
                                actionTitle="Add Convertion"
                                mainUnit={unit.unitId}
                                allUnits={units}
                                description=""
                              >
                                <DropdownMenuItem onSelect={(event) => event.preventDefault()}>
                                  Add Convertion
                                </DropdownMenuItem>
                              </ConvertionDialog>
                              <DropdownMenuSeparator />
                              <UnitDialog
                                title="Edit Unit"
                                actionTitle="Save"
                                editUnit={unit}
                                allUnits={units}
                                onEdited={async (unit) => {
                                  const result = await UnitService.updateUnit(unit);
                                  if (result) {
                                    toast({
                                      title: `Successfully updated to ${unit.unitName}`
                                    });
                                    await fetchUnits();
                                  }
                                }}
                              >
                                <DropdownMenuItem onSelect={(event) => event.preventDefault()}>
                                  Edit
                                </DropdownMenuItem>
                              </UnitDialog>

                              <UnitDeleteDialog
                                onConfirmed={async () => {
                                  await UnitService.deleteUnit(unit.unitId);
                                  fetchUnits();
                                }}
                                title="Delete Unit"
                                description={`Are you sure to delete ${unit.unitName} ?`}
                                actionTitle="Confirm"
                              >
                                <DropdownMenuItem
                                  className="text-red-500"
                                  onSelect={(event) => event.preventDefault()}
                                >
                                  Delete
                                </DropdownMenuItem>
                              </UnitDeleteDialog>
                            </DropdownMenuGroup>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  </UnitDetailDialog>
                ))}
            </TableBody>
          </Table>
          <div className="flex items-center justify-between px-3 py-2 border-t ">
            <p className="text-sm">Total {filteredUnits.length}</p>
            <div className="flex items-center gap-x-3">
              <Button
                className="px-1 h-7"
                variant={"outline"}
                onClick={() => {
                  if (paginateIndex <= 0) {
                    setPanigateIndex(0);
                    return;
                  }
                  setPanigateIndex(paginateIndex - 1);
                }}
              >
                <ChevronLeft className="size-5" />
              </Button>
              <span>
                {paginateIndex + 1} - {chunkArray(filteredUnits, 10).length}
              </span>

              <Button
                className="px-1 h-7"
                variant={"outline"}
                onClick={() => {
                  const chunks = chunkArray(filteredUnits, 10);
                  const lastIndex = chunks.length - 1;
                  if (paginateIndex >= lastIndex) {
                    return;
                  }
                  setPanigateIndex(paginateIndex + 1);
                }}
              >
                <ChevronRight className="size-5" />
              </Button>
            </div>
          </div>
        </div>
      )}
      <div className="h-[100px]"></div>
    </div>
  );
}

export function UnitDialog({
  onCreated,
  onEdited,
  allUnits,
  editUnit,
  title,
  description,
  actionTitle,
  children
}: {
  onCreated?: (unit: Unit) => void;
  onEdited?: (unit: Unit) => void;
  allUnits: Unit[];
  editUnit?: Unit;
  children?: React.ReactNode;
  title: string;
  description?: string;
  actionTitle: string;
}) {
  const unitForm = useForm<Unit>();
  const [open, setOpen] = useState(false);
  // const convertions = unitForm.watch("convertion");
  const unitId = unitForm.watch("unitId");

  useEffect(function () {
    if (editUnit) {
      unitForm.setValue("unitId", editUnit.unitId);
      unitForm.setValue("unitName", editUnit.unitName);
      unitForm.setValue("convertion", editUnit.convertion);
    }
  }, []);

  const matchUnit = (unitId: string) => {
    const matchedUnit = allUnits.find((element) => element.unitId === unitId);
    return matchedUnit;
  };

  const translateUnitConvertionKey = (key: string, value: string) => {
    if (String(value).startsWith("parentUnit-")) {
      return key;
    } else {
      return unitId;
    }
  };
  const translateUnitConvertionValue = (key: string, value: string) => {
    if (String(value).startsWith("parentUnit-")) {
      const matchedUnit = matchUnit(unitId);
      const acturalConvertionString = value.replaceAll("parentUnit-", "");
      const acturalConvertionNumber = parseInt(acturalConvertionString);
      return `${acturalConvertionNumber} ${matchedUnit?.unitName}`;
    } else {
      const matchedUnit = matchUnit(key);
      return `${value} ${matchedUnit?.unitName}`;
    }
  };

  const submit = (data: Unit) => {
    if (editUnit) {
      editSubmit(data);
    } else {
      createSubmit(data);
    }
    unitForm.reset({
      unitId: "",
      unitName: "",
      convertion: {}
    });
  };

  const createSubmit = async (data: Unit) => {
    const newUnit: Unit = {
      unitId: uniqueId(4),
      unitName: data.unitName,
      convertion: data.convertion ?? {}
    };

    setOpen(false);
    onCreated?.(newUnit);
  };

  const editSubmit = async (data: Unit) => {
    setOpen(false);
    onEdited?.(data);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div>
          <Form {...unitForm}>
            <form
              onSubmit={(event) => {
                event.preventDefault();
                return unitForm.handleSubmit(submit)();
              }}
              className="space-y-3"
            >
              {editUnit && (
                <FormField
                  name="unitId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ID</FormLabel>
                      <FormControl>
                        <Input {...field} disabled></Input>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                ></FormField>
              )}
              <FormField
                name="unitName"
                rules={{ required: "Unit name is required" }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input {...field}></Input>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              ></FormField>
              <FormField
                name="convertion"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex justify-between items-center">Convertion</FormLabel>
                    <Table>
                      <TableBody>
                        <TableRow>
                          <TableHead>Unit</TableHead>
                          <TableHead>Convert</TableHead>
                          <TableHead>Delete</TableHead>
                        </TableRow>
                        {field.value &&
                          Object.keys(field.value).map((key, index) => (
                            <TableRow key={index}>
                              <TableCell>
                                1{" "}
                                {
                                  matchUnit(translateUnitConvertionKey(key, field.value[key]))
                                    ?.unitName
                                }
                              </TableCell>
                              <TableCell>
                                {translateUnitConvertionValue(key, field.value[key])}
                              </TableCell>
                              <TableCell>
                                <div
                                  role="button"
                                  // variant={"ghost"}
                                  onClick={() => {
                                    delete field.value[key];
                                    field.onChange(field.value);
                                  }}
                                >
                                  <X className="size-4" />
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  </FormItem>
                )}
              ></FormField>
            </form>
          </Form>
        </div>
        <DialogFooter>
          <DialogClose>
            <Button variant={"outline"}>Close</Button>
          </DialogClose>
          <Button onClick={() => unitForm.handleSubmit(submit)()}>{actionTitle}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function UnitDeleteDialog({
  onConfirmed,
  title,
  description,
  actionTitle,
  children
}: {
  onConfirmed?: () => void;
  children?: React.ReactNode;
  title: string;
  description?: string;
  actionTitle: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <DialogClose>
            <Button variant={"outline"}>Close</Button>
          </DialogClose>
          <Button
            variant={"destructive"}
            onClick={() => {
              setOpen(false);
              onConfirmed?.();
            }}
          >
            {actionTitle}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ConvertionDialog({
  onAdded,
  title,
  mainUnit,
  allUnits,
  description,
  actionTitle,
  children
}: {
  onAdded?: (result: { key: string; value: string }) => void;
  title: string;
  mainUnit: string;
  allUnits: Unit[];
  description: string;
  actionTitle: string;
  children?: React.ReactNode;
}) {
  const unitForm = useForm();
  const [open, setOpen] = useState(false);
  const [revert, setRevert] = useState(false);

  const submit = (data: FieldValues) => {
    onAdded?.({
      key: data.selectedUnit,
      value: revert ? `parentUnit-${data.convertionValue}` : data.convertionValue
    });
    setOpen(false);
  };

  const matchUnit = (unitId: string) => {
    const matchedUnit = allUnits.find((element) => element.unitId === unitId);
    return matchedUnit;
  };

  const convertionValueInput = (
    <FormField
      name="convertionValue"
      rules={{ required: "Value is required" }}
      render={({ field }) => (
        <FormItem>
          <FormControl>
            <Input {...field} className="w-[70px]"></Input>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    ></FormField>
  );

  const selectUnitComponent = (
    <FormField
      name="selectedUnit"
      rules={{ required: "Unit is required" }}
      render={({ field }) => (
        <FormItem>
          <Select onValueChange={field.onChange} value={field.value}>
            <FormControl>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Choose Unit"></SelectValue>
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {allUnits &&
                allUnits.map((unit, index) => (
                  <SelectItem key={index} value={unit.unitId}>
                    {unit.unitName}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    ></FormField>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div>
          <Form {...unitForm}>
            <form
              onSubmit={(event) => {
                event.preventDefault();
                return unitForm.handleSubmit(submit)();
              }}
              className="space-y-3"
            >
              {revert ? (
                <div className="flex items-center justify-between">
                  <FormLabel className="flex items-center gap-x-3">
                    1 {selectUnitComponent}
                  </FormLabel>

                  <div className="flex items-center gap-x-5">
                    {convertionValueInput}
                    {matchUnit(mainUnit)?.unitName}
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <FormLabel>1 {matchUnit(mainUnit)?.unitName}</FormLabel>
                  <div className="flex items-center gap-x-5">
                    {convertionValueInput}
                    {selectUnitComponent}
                  </div>
                </div>
              )}
              <FormItem className="flex gap-x-5 items-center mt-3">
                <FormLabel>Revert</FormLabel>
                <FormControl>
                  <Switch checked={revert} onCheckedChange={setRevert}></Switch>
                </FormControl>
              </FormItem>
            </form>
          </Form>
        </div>
        <DialogFooter>
          <DialogClose>
            <Button variant={"outline"}>Close</Button>
          </DialogClose>
          <Button onClick={() => unitForm.handleSubmit(submit)()}>{actionTitle}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function UnitDetailDialog({
  allUnits,
  unit,
  children
}: {
  allUnits: Unit[];
  unit: Unit;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  const matchUnit = (unitId: string) => {
    const matchedUnit = allUnits.find((element) => element.unitId === unitId);
    return matchedUnit;
  };

  const translateUnitConvertionKey = (key: string, value: string) => {
    if (String(value).startsWith("parentUnit-")) {
      return key;
    } else {
      return unit.unitId;
    }
  };
  const translateUnitConvertionValue = (key: string, value: string) => {
    if (String(value).startsWith("parentUnit-")) {
      const matchedUnit = matchUnit(unit.unitId);
      const acturalConvertionString = value.replaceAll("parentUnit-", "");
      const acturalConvertionNumber = parseInt(acturalConvertionString);
      return `${acturalConvertionNumber} ${matchedUnit?.unitName}`;
    } else {
      const matchedUnit = matchUnit(key);
      return `${value} ${matchedUnit?.unitName}`;
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{unit.unitName}</DialogTitle>
          <DialogDescription>ID - {unit.unitId}</DialogDescription>
        </DialogHeader>
        <div>
          <p className="mb-2">Convertion</p>
          <Table>
            <TableBody>
              <TableRow>
                <TableHead>Unit</TableHead>
                <TableHead>Convert</TableHead>
              </TableRow>
              {unit.convertion != null &&
                Object.keys(unit.convertion).map((key, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      1{" "}
                      {matchUnit(translateUnitConvertionKey(key, unit.convertion![key]))?.unitName}
                    </TableCell>
                    <TableCell>
                      {translateUnitConvertionValue(key, unit.convertion![key])}
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </div>
        <DialogFooter>
          <DialogClose>
            <Button variant={"outline"}>Close</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
