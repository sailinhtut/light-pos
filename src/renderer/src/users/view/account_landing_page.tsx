import BreadcrumbContext from "@renderer/app/view/components/breadcrumb_context";
import React, { useEffect, useState } from "react";
import LoadingWidget from "@renderer/app/view/components/loading";
import {
  ChevronLeft,
  ChevronRight,
  Copy,
  MoreHorizontal,
  RefreshCcw,
  UserRound,
  X
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow
} from "@renderer/assets/shadcn/components/ui/table";
import {
  capitalizeString,
  chunkArray,
  noConnection,
  paginator,
  uniqueId
} from "@renderer/utils/general_utils";
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
import { Textarea } from "@renderer/assets/shadcn/components/ui/textarea";
import { FileImage } from "@renderer/app/view/components/file_image";
import { User } from "@renderer/auth/interface/user";
import UserService from "../service/account_service";
import { AppRoles, parseAppRoles } from "@renderer/auth/interface/roles";
import { Switch } from "@renderer/assets/shadcn/components/ui/switch";
import {
  Select,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectContent,
  SelectTrigger
} from "@renderer/assets/shadcn/components/ui/select";
import { toast } from "@renderer/assets/shadcn/components/ui/use-toast";
import FirebaseAuthService from "@renderer/auth/service/firebase_auth_service";

export default function AccountManagementPage() {
  const [_users, setUsers] = useState<User[]>();
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [paginateIndex, setPanigateIndex] = useState(0);

  useEffect(function () {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    const data = await UserService.getUsers();
    setUsers(data);
    setLoading(false);
  };

  const filterUsers = (origin: User[]) => {
    return origin.filter(
      (element) =>
        element.name.toLowerCase().includes(query.toLowerCase()) || element.docId.includes(query)
    );
  };

  const filteredUsers = filterUsers(_users ?? []);
  const paginatedData = paginator(filteredUsers, paginateIndex, 10);

  return (
    <div className="p-5 ">
      <BreadcrumbContext
        route={[
          { name: "Light POS", route: "/" },
          { name: "Setting", route: "/settings" },
          { name: "Account Management", route: "/settings/manage-accounts" }
        ]}
      />
      <div className="flex justify-between items-center">
        <p className="text-lg">User List</p>
        <div className="flex gap-x-3">
          <Button
            variant={"ghost"}
            className="w-[40px] px-2"
            onClick={() => {
              if (!loading) {
                fetchUsers();
              }
            }}
          >
            <RefreshCcw
              className={` size-5 text-slate-500 ${loading && "animate-spin transform rotate-180"}`}
            />
          </Button>
          <Input
            placeholder="Search"
            onChange={(event) => setQuery(event.target.value)}
            value={query}
          ></Input>
          <UserDialog
            title="Add User"
            actionTitle="Add"
            onCreated={async (user) => {
              if (noConnection()) return;
              const createdUserId = await FirebaseAuthService.signUp(user.email, user.password);
              if (createdUserId) {
                user.docId = createdUserId;
                await UserService.addUser(user);
                toast({
                  title: `Successfully created ${user.name}`
                });
                await fetchUsers();
              }
            }}
          >
            <Button>Add User</Button>
          </UserDialog>
        </div>
      </div>
      {loading && <LoadingWidget />}
      {!loading && (
        <div className="border rounded-md mt-5">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-5 rounded-tl-md">No</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead>User ID</TableHead>
                <TableHead className="rounded-tr-md"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!paginatedData && (
                <TableRow>
                  <TableCell colSpan={6} className="pl-5 text-slate-500">
                    No Data
                  </TableCell>
                </TableRow>
              )}
              {paginatedData &&
                paginatedData.map((user, index) => (
                  <TableRow key={user.docId}>
                    <TableCell className="pl-5">{index + 1 + 10 * paginateIndex}</TableCell>
                    <TableCell>{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.updatedAt.toLocaleDateString()}</TableCell>
                    <TableCell
                      className="cursor-pointer"
                      onClick={async () => {
                        await navigator.clipboard.writeText(user.docId);
                        toast({
                          title: "Copied to clipboard"
                        });
                      }}
                    >
                      {user.docId}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="size-5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuGroup>
                            <UserDialog
                              title="Edit User"
                              actionTitle="Save"
                              editUser={user}
                              onEdited={async (user) => {
                                await UserService.updateUser(user);
                                toast({
                                  title: `Successfully updated to ${user.name}`
                                });
                                await fetchUsers();
                              }}
                            >
                              <DropdownMenuItem
                                onSelect={(event) => {
                                  event.preventDefault();
                                  event.stopPropagation();
                                }}
                              >
                                Edit
                              </DropdownMenuItem>
                            </UserDialog>
                            <UserDeleteDialog
                              onConfirmed={async () => {
                                await UserService.deleteUser(user.docId);
                                await FirebaseAuthService.delete(user.email, user.password);
                                fetchUsers();
                              }}
                              title="Delete User"
                              description={`Are you sure to delete ${user.name} ?`}
                              actionTitle="Confirm"
                            >
                              <DropdownMenuItem
                                className="text-red-500"
                                onSelect={(event) => event.preventDefault()}
                              >
                                Delete
                              </DropdownMenuItem>
                            </UserDeleteDialog>
                          </DropdownMenuGroup>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
          <div className="flex items-center justify-between px-3 py-2 border-t ">
            <p className="text-sm">Total {filteredUsers.length}</p>
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
                {paginateIndex + 1} - {chunkArray(filteredUsers, 10).length}
              </span>

              <Button
                className="px-1 h-7"
                variant={"outline"}
                onClick={() => {
                  const chunks = chunkArray(filteredUsers, 10);
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

function UserDialog({
  onCreated,
  onEdited,
  editUser,
  title,
  description,
  actionTitle,
  children
}: {
  onCreated?: (user: User) => void;
  onEdited?: (user: User) => void;
  editUser?: User;
  children?: React.ReactNode;
  title: string;
  description?: string;
  actionTitle: string;
}) {
  const userForm = useForm<User>();
  const [open, setOpen] = useState(false);

  useEffect(function () {
    if (editUser) {
      userForm.setValue("docId", editUser.docId);
      userForm.setValue("name", editUser.name);
      userForm.setValue("email", editUser.email);
      userForm.setValue("role", editUser.role);
      userForm.setValue("password", editUser.password);
      userForm.setValue("messagenToken", editUser.messagenToken);
      userForm.setValue("disabled", editUser.disabled);
      userForm.setValue("updatedAt", editUser.updatedAt);
      userForm.setValue("location", editUser.location);
    } else {
      userForm.setValue("role", AppRoles.casher);
      userForm.setValue("disabled", false);
    }
  }, []);

  const submit = (data: User) => {
    if (editUser) {
      editSubmit(data);
    } else {
      createSubmit(data);
    }
    resetForm();
  };

  const createSubmit = async (data: User) => {
    const newUser: User = {
      docId: uniqueId(),
      name: data.name,
      email: data.email,
      role: data.role,
      password: data.password,
      messagenToken: null,
      disabled: data.disabled,
      location: null,
      updatedAt: new Date()
    };
    setOpen(false);
    onCreated?.(newUser);
  };

  const editSubmit = async (data: User) => {
    const updatedUser: User = { ...editUser! };
    updatedUser.name = data.name;
    updatedUser.disabled = data.disabled;
    updatedUser.updatedAt = new Date();
    updatedUser.role = data.role;
    setOpen(false);
    onEdited?.(updatedUser);
  };

  const resetForm = () => {
    userForm.reset({
      disabled: false,
      docId: undefined,
      email: "",
      location: null,
      messagenToken: null,
      name: "",
      password: "",
      role: AppRoles.casher,
      updatedAt: new Date()
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(status) => {
        setOpen(status);
      }}
    >
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="overflow-y-scroll max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div>
          <Form {...userForm}>
            <form
              onSubmit={(event) => {
                event.preventDefault();
                return userForm.handleSubmit(submit)();
              }}
              className="space-y-3"
            >
              {editUser && (
                <FormField
                  name="docId"
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
                name="email"
                disabled={editUser !== undefined}
                rules={{ required: "Email is required" }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input {...field} type="email"></Input>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              ></FormField>
              <FormField
                name="name"
                rules={{ required: "Name is required" }}
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
                name="password"
                disabled={editUser !== undefined}
                rules={{ required: "Phone Two is required" }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input {...field}></Input>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              ></FormField>
              <FormField
                name="role"
                render={({ field }) => (
                  <FormItem className="w-full flex justify-between items-center">
                    <FormLabel className="flex items-center">Account Type</FormLabel>
                    <FormControl>
                      <Select
                        onValueChange={(value) => field.onChange(parseAppRoles(value))}
                        value={AppRoles[field.value]}
                      >
                        <SelectTrigger className="w-[140px]">
                          <UserRound className="text-slate-500 size-5" />
                          {capitalizeString(AppRoles[field.value])}
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            <SelectLabel>Choose Role</SelectLabel>
                            <SelectItem value={AppRoles[AppRoles.superadmin]}>
                              Superadmin
                            </SelectItem>
                            <SelectItem value={AppRoles[AppRoles.admin]}>Admin</SelectItem>
                            <SelectItem value={AppRoles[AppRoles.casher]}>Casher</SelectItem>
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              ></FormField>
              <FormField
                name="disabled"
                render={({ field }) => (
                  <FormItem className="w-full flex justify-between items-center">
                    <FormLabel className="flex items-center">Disabled </FormLabel>
                    <FormControl>
                      <Switch
                        className="scale-110"
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      ></Switch>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              ></FormField>

              <p className="text-sm text-slate-500">
                Updated {userForm.watch("updatedAt", new Date()).toDateString()}
              </p>
            </form>
          </Form>
        </div>
        <DialogFooter>
          <DialogClose>
            <Button variant={"outline"}>Close</Button>
          </DialogClose>
          <Button onClick={() => userForm.handleSubmit(submit)()}>{actionTitle}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function UserDeleteDialog({
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
