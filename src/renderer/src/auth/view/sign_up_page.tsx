import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@renderer/assets/shadcn/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@renderer/assets/shadcn/components/ui/form";
import { Input } from "@renderer/assets/shadcn/components/ui/input";
import { Button } from "@renderer/assets/shadcn/components/ui/button";
import { FieldValues, useForm } from "react-hook-form";
import { appDescription, appName } from "@renderer/utils/app_constants";
import { Link, useNavigate } from "react-router-dom";
import { showNotification, uniqueId } from "@renderer/utils/general_utils";
import AuthService from "../service/auth_service";
import LoadingWidget from "@renderer/app/view/components/loading";
import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { useRouteContext } from "@renderer/router";
import User from "../interface/user";
import { AppRoles } from "../interface/roles";
import NavBar from "@renderer/app/view/components/nav_bar";

export default function SignUpPage() {
  const signInForm = useForm();
  const { pushAndForgetPast, push, pop } = useRouteContext();
  const [loading, setLoading] = useState(false);

  const submit = async (data: FieldValues) => {
    setLoading(true);
    const newUserModel: User = {
      name: data.name,
      email: data.email,
      password: data.password,
      docId: uniqueId(),
      disabled: false,
      role: AppRoles.casher,
      updatedAt: new Date(),
      location: null,
      messagenToken: null
    };
    const createdUserModel = await AuthService.signUp(newUserModel);
    if (createdUserModel) {
      await AuthService.saveCredential(createdUserModel);
      setLoading(false);
      pushAndForgetPast("/");
    } else {
      setLoading(false);
    }
  };

  return (
    <div className="w-screen h-screen overflow-hidden">
      <NavBar />
      <div className="p-3 h-screen w-screen flex flex-col justify-center items-center">
        <Card className="w-full sm:w-[400px]">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl">{appName}</CardTitle>
            <CardDescription>{appDescription}</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...signInForm}>
              <form onSubmit={signInForm.handleSubmit(submit)} className="">
                <FormField
                  name="name"
                  control={signInForm.control}
                  rules={{ required: "Name is required" }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input {...field} type="text"></Input>
                      </FormControl>
                      <FormMessage></FormMessage>
                    </FormItem>
                  )}
                ></FormField>
                <FormField
                  name="email"
                  control={signInForm.control}
                  rules={{ required: "Email is required" }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input {...field} type="email"></Input>
                      </FormControl>
                      <FormMessage></FormMessage>
                    </FormItem>
                  )}
                ></FormField>
                <FormField
                  name="password"
                  control={signInForm.control}
                  rules={{ required: "Password is required" }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input {...field} type="password"></Input>
                      </FormControl>
                      <FormMessage></FormMessage>
                    </FormItem>
                  )}
                ></FormField>
                {loading ? (
                  <div className="w-full flex justify-center">
                    <LoadingWidget />
                  </div>
                ) : (
                  <Button type="submit" className="w-full mt-10">
                    Create Account
                  </Button>
                )}
              </form>
            </Form>
          </CardContent>
        </Card>
        <Button
          variant="link"
          className="block mx-auto mt-3 group"
          onClick={() => {
            push("/sign-in");
          }}
        >
          Sign In
          <ArrowRight className="inline ml-2 opacity-0 transition-all group-hover:-translate-x-0 group-hover:opacity-100 -translate-x-[100%] size-4" />
        </Button>
      </div>
    </div>
  );
}
