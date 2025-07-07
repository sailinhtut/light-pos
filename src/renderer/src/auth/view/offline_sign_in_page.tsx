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
import {
  appName,
  phoneOne,
  phoneTwo,
  websiteLink,
  youtubeAddress
} from "@renderer/utils/app_constants";
import LoadingWidget from "@renderer/app/view/components/loading";
import { useEffect, useState } from "react";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { useRouteContext } from "@renderer/router";
import NavBar from "@renderer/app/view/components/nav_bar";
import { toast } from "@renderer/assets/shadcn/components/ui/use-toast";
import firebase from "firebase/compat/app";
import "firebase/compat/firestore";
import { firebaseFirestore } from "@renderer/firebase";
import { Toaster } from "@renderer/assets/shadcn/components/ui/toaster";
import { PrinterLayoutService } from "@renderer/app/view/printer_setting_page";

export default function OfflineSignInPage() {
  const signInForm = useForm();
  const { push, pop } = useRouteContext();
  const [loading, setLoading] = useState(false);
  const [showInfomation, setShowInformation] = useState(false);
  const [deviceId, setDeviceId] = useState(undefined);

  useEffect(() => {
    getDeviceId();
  }, []);

  const getDeviceId = async () => {
    const id = await window.electron.ipcRenderer.invoke("getDeviceId");
    setDeviceId(id);
  };

  //   const validateAccount = async () => {
  //     if (!deviceId) {
  //       toast({ title: "Cannot access device information" });
  //       setLoading(false);
  //       return;
  //     }
  //
  //     const querySnap = await firebaseFirestore
  //       .collection("offline_users")
  //       .where("device_id", "==", deviceId)
  //       .get();
  //
  //     if (querySnap.docs.length > 0) {
  //       const pendingAccount = querySnap.docs[0].data();
  //
  //       if (pendingAccount["approved"] == true) {
  //         localStorage.setItem("receiptTitle", pendingAccount["shop_name"]);
  //         localStorage.setItem("receiptBusinessType", pendingAccount["business_name"]);
  //
  //         localStorage.setItem("offline_validation", JSON.stringify(pendingAccount));
  //
  //         toast({ title: "Successfully Verified" });
  //         push("/");
  //       }
  //     }
  //   };

  const submit = async (data: FieldValues) => {
    // {
    //   'shop_name': shopNameController.text,
    //   'business_name': businessNameController.text,
    //   'email': emailController.text,
    //   'password': passwordController.text,
    //   'device_id': deviceID,
    //   'created_date': DateTime.now().toIso8601String(),
    //   'approved': false
    // };

    if (!deviceId) {
      toast({ title: "Cannot access device information" });
      return;
    }

    const submitShopInformation = async (email: string, password: string) => {
      setLoading(true);
      const offlineAccount = {};
      offlineAccount["email"] = email;
      offlineAccount["password"] = password;
      offlineAccount["device_id"] = deviceId;
      offlineAccount["shop_name"] = data.shop_name;
      offlineAccount["business_name"] = data.business_name;
      offlineAccount["created_date"] = JSON.stringify(new Date());

      await firebaseFirestore
        .collection("offline_users")
        .doc(offlineAccount["email"])
        .set(offlineAccount, { merge: true });

      setLoading(false);
      setShowInformation(true);
    };

    setLoading(true);

    const querySnap = await firebaseFirestore
      .collection("offline_users")
      .where("email", "==", data.email)
      .where("password", "==", data.password)
      .get();

    if (querySnap.docs.length > 0) {
      const offlineAccount = querySnap.docs[0].data();

      if (offlineAccount["approved"] != null && offlineAccount["approved"] == true) {
        console.log(offlineAccount);
        if (offlineAccount["device_id"] && String(offlineAccount["device_id"]).trim().length > 0) {
          if (offlineAccount["device_id"] == deviceId) {
            offlineAccount["shop_name"] = data.shop_name;
            offlineAccount["business_name"] = data.business_name;

            await firebaseFirestore
              .collection("offline_users")
              .doc(offlineAccount["email"] ?? data.email)
              .set(offlineAccount, { merge: true });

            const printerSetting = PrinterLayoutService.loadData();
            printerSetting.name = data.shop_name;
            printerSetting.businessType = data.business_name;
            PrinterLayoutService.saveData(printerSetting);
            
            localStorage.setItem("offline_validation", JSON.stringify(offlineAccount));
            toast({ title: "Successfully Verified" });

            setLoading(false);
            setShowInformation(false);
            push("/");
          } else {
            toast({ title: "This account is already used" });
            setLoading(false);
            return;
          }
        } else {
          offlineAccount["device_id"] = deviceId;
          offlineAccount["shop_name"] = data.shop_name;
          offlineAccount["business_name"] = data.business_name;

          await firebaseFirestore
            .collection("offline_users")
            .doc(offlineAccount["email"])
            .set(offlineAccount, { merge: true });

          const printerSetting = PrinterLayoutService.loadData();
          printerSetting.name = data.shop_name;
          printerSetting.businessType = data.business_name;
          PrinterLayoutService.saveData(printerSetting);
          
          localStorage.setItem("offline_validation", JSON.stringify(offlineAccount));
          toast({ title: "Successfully Verified" });

          setLoading(false);
          push("/");
        }
      } else {
        await submitShopInformation(offlineAccount["email"], offlineAccount["password"]);
      }
    } else {
      toast({ title: "No Account Found" });
      setLoading(false);
    }
  };

  return (
    <div className="w-screen h-screen overflow-hidden">
      <NavBar />
      <div className="p-3 h-screen w-screen flex flex-col justify-center items-center">
        <Card className="w-full max-w-[400px] sm:w-[400px] max-h-[80vh] overflow-y-auto overflow-x-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl">{appName}</CardTitle>
            <CardDescription>
              You may need to verify your purcashed account here <br></br>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...signInForm}>
              <form onSubmit={signInForm.handleSubmit(submit)} className="">
                <FormField
                  name="shop_name"
                  control={signInForm.control}
                  rules={{ required: "Business name is required" }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Shop Name</FormLabel>

                      <FormControl>
                        <Input {...field} type="text"></Input>
                      </FormControl>
                      <p className="my-0 text-xs">
                        It will be applied to app title and receipt paper title
                      </p>
                      <FormMessage></FormMessage>
                    </FormItem>
                  )}
                ></FormField>
                <FormField
                  name="business_name"
                  control={signInForm.control}
                  rules={{ required: "Business description is required" }}
                  render={({ field }) => (
                    <FormItem className="mt-3">
                      <FormLabel>Business Name</FormLabel>
                      <FormControl>
                        <Input {...field} type="text"></Input>
                      </FormControl>
                      <p className="my-0 text-xs">
                        It will be applied to receipt paper description
                      </p>
                      <FormMessage></FormMessage>
                    </FormItem>
                  )}
                ></FormField>
                <FormField
                  name="email"
                  control={signInForm.control}
                  rules={{ required: "Email is required" }}
                  render={({ field }) => (
                    <FormItem className="mt-3">
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
                {showInfomation ? (
                  <div className="p-3 border rounded-lg bg-primary/10 mt-3">
                    <p className="font-semibold flex flex-row items-center">
                      <CheckCircle2 className="size-5 mr-3 text-green-500" />{" "}
                      <span>Submitted Successfully</span>
                    </p>
                    <p className="text-justify">
                      Your account is being validated. We will contact you after we validated your
                      information. Thank for you patience and interest.
                    </p>
                    <p className="mt-5 text-sm font-semibold">Contact</p>
                    <a
                      className="text-primary select-none cursor-pointer"
                      href={`tel:+${phoneOne}`}
                      target="_blank"
                    >
                      +{phoneOne}
                    </a>
                    <br></br>
                    <a
                      className="text-primary select-none cursor-pointer"
                      href={`tel:+${phoneTwo}`}
                      target="_blank"
                    >
                      +{phoneTwo}
                    </a>
                    <p className="mt-5 text-sm font-semibold">More Detail</p>
                    <a
                      className="text-primary select-none cursor-pointer"
                      href={websiteLink}
                      target="_blank"
                    >
                      Visit Light App Studio
                    </a>
                    <br></br>
                    <a
                      className="text-primary select-none cursor-pointer"
                      href={youtubeAddress}
                      target="_blank"
                    >
                      Visit Youtube Channel
                    </a>
                  </div>
                ) : loading ? (
                  <div className="w-full flex justify-center">
                    <LoadingWidget />
                  </div>
                ) : (
                  <Button type="submit" className="w-full mt-10">
                    Verify Account
                  </Button>
                )}
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
      <Toaster />
    </div>
  );
}
