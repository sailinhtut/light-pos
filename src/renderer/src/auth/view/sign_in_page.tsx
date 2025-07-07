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
import AuthService from "../service/auth_service";
import LoadingWidget from "@renderer/app/view/components/loading";
import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { useRouteContext } from "@renderer/router";
import NavBar from "@renderer/app/view/components/nav_bar";

export default function SignInPage() {
  const signInForm = useForm();
  const { pushAndForgetPast, push, pop } = useRouteContext();
  const [loading, setLoading] = useState(false);

  const submit = async (data: FieldValues) => {
    setLoading(true);
    const userData = await AuthService.signIn(data.email, data.password);
    if (userData) {
      await AuthService.saveCredential(userData);
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
        <Card className="w-full max-w-[400px] sm:w-[400px]">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl">{appName}</CardTitle>
            <CardDescription >{appDescription}</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...signInForm}>
              <form onSubmit={signInForm.handleSubmit(submit)} className="">
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
                    Log In
                  </Button>
                )}
              </form>
            </Form>
          </CardContent>
        </Card>

        <Button
          variant="link"
          className=" mx-auto mt-3 group "
          onClick={() => {
            push("/sign-up");
          }}
        >
          Create Account{" "}
          <ArrowRight className="inline ml-2 opacity-0 transition-all group-hover:-translate-x-0 group-hover:opacity-100 -translate-x-[100%] size-4" />
        </Button>
      </div>
    </div>
  );
}
