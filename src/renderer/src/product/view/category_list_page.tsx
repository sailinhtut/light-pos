import BreadcrumbContext from "@renderer/app/view/components/breadcrumb_context";
import React, { useEffect, useState } from "react";
import { Category, decodeCategoryJson } from "../interface/category";
import CategoryService from "../service/category_service";
import LoadingWidget from "@renderer/app/view/components/loading";
import { ChevronLeft, ChevronRight, Divide, MoreHorizontal, RefreshCcw, Trash } from "lucide-react";
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
import { chunkArray, noConnection, paginator, uniqueId } from "@renderer/utils/general_utils";
import { Button } from "@renderer/assets/shadcn/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger
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

import { useForm } from "react-hook-form";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@renderer/assets/shadcn/components/ui/form";
import { toast } from "@renderer/assets/shadcn/components/ui/use-toast";
import { motion } from "framer-motion";
import { ConfirmDialog } from "@renderer/app/view/components/confirm_dialog";
import { Checkbox } from "@renderer/assets/shadcn/components/ui/checkbox";
import { offlineMode } from "@renderer/utils/app_constants";

export default function CategoryListPage() {
  const [categories, setCategories] = useState<Category[]>();
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [paginateIndex, setPanigateIndex] = useState(0);

  useEffect(function () {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    const data = await CategoryService.getCategories();
    setCategories(data);
    setLoading(false);
  };

  const filterCategories = (origin: Category[]) => {
    let filtered = origin.filter(
      (element) =>
        element.name.toLowerCase().includes(query.toLowerCase()) ||
        element.category_id.includes(query)
    );
    return filtered;
  };

  const [selectedIDs, setSelectedID] = useState<string[]>([]);
  const filteredCategories = filterCategories(categories ?? []);
  const paginatedData = paginator(filteredCategories, paginateIndex, 10);

  return (
    <div className="p-5 overflow-x-hidden">
      <BreadcrumbContext
        route={[
          { name: "Light POS", route: "/" },
          { name: "Setting", route: "/settings" },
          { name: "Product Menu", route: "/settings/product-menu" },
          { name: "Category", route: "/settings/product-menu/category-list" }
        ]}
      />
      <div className="flex justify-between items-center">
        <p className="text-lg">Category List</p>
        <div className="flex">
          <Button
            variant={"ghost"}
            className="w-[40px] px-2"
            onClick={() => {
              if (!loading) {
                fetchCategories();
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
          <CategoryDialog
            title="Add Category"
            actionTitle="Add"
            onCreated={async (category) => {
              const result = await CategoryService.addCategory(category);
              if (result) {
                toast({
                  title: `Successfully created ${category.name}`
                });
                await fetchCategories();
              }
            }}
          >
            <Button className="ml-3">Add Category</Button>
          </CategoryDialog>
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
              title="Delete Category"
              description="Are you sure to delete all selected categories ?"
              actionTitle="Confirm"
              onConfirm={async () => {
                setLoading(true);
                for (const categoryId of selectedIDs) {
                  await CategoryService.deleteCategory(categoryId);
                }
                setLoading(false);
                setSelectedID([]);
                fetchCategories();
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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="rounded-tl-md">
                  <Checkbox
                    className="border-slate-500 shadow-none ml-2 "
                    checked={
                      selectedIDs.length === filteredCategories.length && selectedIDs.length > 0
                    }
                    onCheckedChange={(value) => {
                      if (value) {
                        setSelectedID(filteredCategories.map((e) => e.category_id));
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
                paginatedData.map((category, index) => (
                  <TableRow key={category.category_id}>
                    <TableCell>
                      <Checkbox
                        className="border-slate-500 shadow-none ml-2"
                        checked={selectedIDs.includes(category.category_id)}
                        onClick={(event) => event.stopPropagation()}
                        onCheckedChange={(value) => {
                          if (value) {
                            setSelectedID([category.category_id, ...selectedIDs]);
                          } else {
                            setSelectedID(selectedIDs.filter((e) => e !== category.category_id));
                          }
                        }}
                      />
                    </TableCell>
                    <TableCell>{category.name}</TableCell>
                    <TableCell>{category.category_id}</TableCell>

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
                            <CategoryDialog
                              title="Edit Category"
                              actionTitle="Save"
                              editCategory={category}
                              onEdited={async (category) => {
                                const result = await CategoryService.updateCategory(category);
                                if (result) {
                                  toast({
                                    title: `Successfully updated ${category.name}`
                                  });
                                  await fetchCategories();
                                }
                              }}
                            >
                              <DropdownMenuItem onSelect={(event) => event.preventDefault()}>
                                Edit
                              </DropdownMenuItem>
                            </CategoryDialog>
                            <CategoryDeleteDialog
                              onConfirmed={async () => {
                                await CategoryService.deleteCategory(category.category_id);
                                fetchCategories();
                              }}
                              title="Delete Category"
                              description={`Are you sure to delete ${category.name} ?`}
                              actionTitle="Confirm"
                            >
                              <DropdownMenuItem
                                className="text-red-500"
                                onSelect={(event) => event.preventDefault()}
                              >
                                Delete
                              </DropdownMenuItem>
                            </CategoryDeleteDialog>
                          </DropdownMenuGroup>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
          <div className="flex items-center justify-between px-3 py-2 border-t ">
            <p className="text-sm">Total {filteredCategories.length}</p>
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
                {paginateIndex + 1} - {chunkArray(filteredCategories, 10).length}
              </span>

              <Button
                className="px-1 h-7"
                variant={"outline"}
                onClick={() => {
                  const chunks = chunkArray(filteredCategories, 10);
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

export function CategoryDialog({
  onCreated,
  onEdited,
  editCategory,
  title,
  description,
  actionTitle,
  children
}: {
  onCreated?: (category: Category) => void;
  onEdited?: (category: Category) => void;
  editCategory?: Category;
  children?: React.ReactNode;
  title: string;
  description?: string;
  actionTitle: string;
}) {
  const categoryForm = useForm<Category>();
  const [open, setOpen] = useState(false);

  useEffect(function () {
    if (editCategory) {
      categoryForm.setValue("category_id", editCategory.category_id);
      categoryForm.setValue("name", editCategory.name);
    }
  }, []);

  const submit = (data: Category) => {
    if (editCategory) {
      editSubmit(data);
    } else {
      createSubmit(data);
    }
  };

  const createSubmit = async (data: Category) => {
    const newCategory: Category = {
      category_id: uniqueId(4),
      name: data.name
    };
    setOpen(false);
    onCreated?.(newCategory);
  };

  const editSubmit = async (data: Category) => {
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
          <Form {...categoryForm}>
            <form
              onSubmit={(event) => {
                event.preventDefault();
                return categoryForm.handleSubmit(submit)();
              }}
            >
              {editCategory && (
                <FormField
                  name="category_id"
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
                name="name"
                rules={{ required: "Category name is required" }}
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
            </form>
          </Form>
        </div>
        <DialogFooter>
          <DialogClose>
            <Button variant={"outline"}>Close</Button>
          </DialogClose>
          <Button onClick={() => categoryForm.handleSubmit(submit)()}>{actionTitle}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CategoryDeleteDialog({
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
