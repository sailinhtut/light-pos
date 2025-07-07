import { useContext, useEffect, useState } from "react";
import personImage from "../../assets/images/person.png";
import UserContext from "../context/user_context";
import LoadingWidget from "@renderer/app/view/components/loading";
import { Button } from "@renderer/assets/shadcn/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { FieldValue, FieldValues, useForm } from "react-hook-form";
import User from "../interface/user";
import { capitalizeString, showNotification, uniqueId } from "@renderer/utils/general_utils";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@renderer/assets/shadcn/components/ui/form";
import AuthService from "../service/auth_service";
import FirebaseAuthService from "../service/firebase_auth_service";
import { useRouteContext } from "@renderer/router";
import { AppRoles } from "../interface/roles";
import { ArrowLeft } from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator
} from "@renderer/assets/shadcn/components/ui/breadcrumb";
import { Link } from "react-router-dom";
import BreadcrumbContext from "@renderer/app/view/components/breadcrumb_context";
import { toast } from "@renderer/assets/shadcn/components/ui/use-toast";
import appIcon from "../../assets/images/app_icon.png";

export default function ProfilePage() {
  const { currentUser, authorize, setCurrentUser } = useContext(UserContext);
  const [loading, setLoading] = useState(false);
  const { pushAndForgetPast, push, pop } = useRouteContext();

  useEffect(function () {
    init();
  }, []);

  const init = async () => {
    if (currentUser) {
      authorize();
      await AuthService.syncUserData(currentUser!.docId);
    }
  };

  const editUser = async (user: User) => {
    setLoading(true);
    await AuthService.updateUserData(user);
    const latest = await AuthService.syncUserData(user.docId);
    if (latest) {
      setCurrentUser(latest);
      toast({
        title: "Account",
        description: "Updated Successfully"
      });
    }
    setLoading(false);
  };

  const updatePassword = async (user: User, newPassword: string) => {
    await FirebaseAuthService.updatePassword(user.email, user.password, newPassword);
    user.password = newPassword;
    await editUser(user);
  };

  const signOut = async () => {
    await AuthService.signOut();
    setCurrentUser(undefined);
    pushAndForgetPast("/sign-in");
  };

  return (
    <div className={`p-5`}>
      <BreadcrumbContext
        route={[
          {
            name: "Light POS",
            route: "/"
          },
          {
            name: "Profile",
            route: "/profile"
          }
        ]}
      />
      {!currentUser && <LoadingWidget />}
      {currentUser && (
        <div>
          <img src={appIcon} alt="App Icon" className="mt-5 size-[150px] rounded-full  border" />
          <p className="text-lg font-bold mt-3">{currentUser.name}</p>
          <p className="">{currentUser.email}</p>
          <div className="mt-3  max-w-sm p-3 border rounded-xl text-slate-500">
            <p className="text-sm ">Role - {capitalizeString(AppRoles[currentUser.role])}</p>
            <p className="text-sm">Updated {currentUser.updatedAt.toDateString()}</p>
            <p className="text-sm">ID - {currentUser.docId}</p>
          </div>
          <div className="flex gap-x-2 flex-wrap">
            <UserCreator editUser={currentUser} onEdited={editUser}>
              <Button variant="link" size="default" className="px-0">
                Edit Account
              </Button>
            </UserCreator>
            <PasswordUpdater currentUser={currentUser} onUpdated={updatePassword}>
              <Button variant="link" size="default" className="px-0">
                Update Password
              </Button>
            </PasswordUpdater>
            <SignOutDialog onConfirmed={() => signOut()}>
              <Button variant="link" size="default" className="px-0 text-red-500">
                Sign Out
              </Button>
            </SignOutDialog>
          </div>
          {loading && <LoadingWidget />}
        </div>
      )}
    </div>
  );
}

function UserCreator({
  editUser,
  onEdited,
  onCreated,
  children
}: {
  editUser?: User;
  onEdited?: (user: User) => void;
  onCreated?: (user: User) => void;
  children?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const userForm = useForm<User>();

  useEffect(
    function () {
      init();
    },
    [editUser]
  );

  const init = async () => {
    if (editUser) initValues();
  };

  const submit = (data: User) => {
    if (editUser) {
      editSubmit(data);
    } else {
      data.docId = uniqueId();
      data.updatedAt = new Date();
      setOpen(false);
      onCreated?.(data);
      // resetForm();
    }
  };

  const editSubmit = (formTask: User) => {
    if (!editUser) return;
    const editedTask: User = {
      ...editUser,
      name: formTask.name
    };
    setOpen(false);
    onEdited?.(editedTask);
    resetForm();
  };

  const initValues = () => {
    if (!editUser) return;
    userForm.setValue("name", editUser.name);
    userForm.setValue("email", editUser.email);
    userForm.setValue("docId", editUser.docId);
  };

  const resetForm = () =>
    userForm.reset({
      name: "",
      email: "",
      password: "",
      docId: "",
      updatedAt: new Date(),
      messagenToken: "",
      location: ""
    });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
          <DialogDescription>Make changes to your profile here.</DialogDescription>
        </DialogHeader>
        <Form {...userForm}>
          <form
            onSubmit={userForm.handleSubmit(submit)}
            // className="w-full bg-white p-3 border border-gray-300 rounded-lg"
          >
            <FormField
              name="name"
              control={userForm.control}
              rules={{
                required: "Required"
              }}
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
              name="email"
              control={userForm.control}
              rules={{
                required: "Required"
              }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input disabled {...field}></Input>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            ></FormField>
            {editUser && (
              <div className="text-sm text-gray-600 mt-3 space-y-1">
                {/* <p>Created - {editUser.created_date.toDateString()}</p> */}
                <p>Updated - {editUser.updatedAt.toDateString()}</p>
              </div>
            )}
          </form>
        </Form>
        <DialogFooter>
          <DialogClose className="mr-2">
            <Button variant="outline">Close</Button>
          </DialogClose>
          <Button onClick={() => userForm.handleSubmit(submit)()}>
            {editUser ? "Save" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PasswordUpdater({
  currentUser,
  onUpdated,
  children
}: {
  currentUser: User;
  onUpdated?: (user: User, newPassword: string) => void;
  children?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const userForm = useForm();

  useEffect(function () {
    init();
  }, []);

  const init = async () => {
    if (currentUser) initValues();
  };

  const submit = (data: FieldValues) => {
    setOpen(false);
    onUpdated?.(currentUser, data.newPassword);
    // resetForm();
  };

  const initValues = () => {
    if (!currentUser) return;
    userForm.setValue("email", currentUser.email);
    userForm.setValue("password", currentUser.password);
  };

  const resetForm = () =>
    userForm.reset({
      email: "",
      password: "",
      newPassword: ""
    });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Update Password</DialogTitle>
        </DialogHeader>
        <Form {...userForm}>
          <form
            onSubmit={userForm.handleSubmit(submit)}
            // className="w-full bg-white p-3 border border-gray-300 rounded-lg"
          >
            <FormField
              name="email"
              control={userForm.control}
              rules={{
                required: "Required"
              }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input disabled {...field}></Input>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            ></FormField>
            <FormField
              name="password"
              control={userForm.control}
              rules={{
                required: "Required"
              }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Currnet Password</FormLabel>
                  <FormControl>
                    <Input disabled {...field}></Input>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            ></FormField>
            <FormField
              name="newPassword"
              control={userForm.control}
              rules={{
                required: "Required"
              }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>New Password</FormLabel>
                  <FormControl>
                    <Input {...field}></Input>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            ></FormField>
          </form>
        </Form>
        <DialogFooter>
          <DialogClose className="mr-2">
            <Button variant="outline">Close</Button>
          </DialogClose>
          <Button onClick={() => userForm.handleSubmit(submit)()}>Update</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function SignOutDialog({
  onConfirmed,
  className,
  children
}: {
  onConfirmed: () => void;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <Dialog>
      <DialogTrigger className={className} asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] ">
        <DialogHeader>
          <DialogTitle>Sign Out Account</DialogTitle>
        </DialogHeader>
        <DialogDescription>Are you sure to log out ?</DialogDescription>
        <DialogFooter>
          <DialogClose className="mr-2">
            <Button variant="outline">Close</Button>
          </DialogClose>
          <Button onClick={() => onConfirmed()} variant="destructive">
            Sign Out
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
