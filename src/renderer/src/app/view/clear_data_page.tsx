import { firebaseAuth, firebaseFirestore } from "@renderer/firebase";
import BreadcrumbContext from "./components/breadcrumb_context";
import { useContext, useEffect, useState } from "react";
import UserContext from "@renderer/auth/context/user_context";
import { toast } from "@renderer/assets/shadcn/components/ui/use-toast";
import {
  ClipboardList,
  Contact,
  LayoutGrid,
  LibraryBig,
  SendToBack,
  SquareStack,
  UserPlus,
  Wallet
} from "lucide-react";
import { ValueInputDialog } from "./components/value_input_dialog";
import { parseNumber } from "@renderer/utils/general_utils";
import { offlineMode } from "@renderer/utils/app_constants";
import { ConfirmDialog } from "./components/confirm_dialog";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@renderer/assets/shadcn/components/ui/dialog";
import { Button } from "@renderer/assets/shadcn/components/ui/button";
import LoadingWidget from "./components/loading";
import { set } from "date-fns";
import ItemService from "@renderer/product/service/item_service";
import CategoryService from "@renderer/product/service/category_service";
import CreditbookService from "@renderer/credit_book/service/credit_book_service";
import CashflowService from "@renderer/cashflow/service/cashflow_service";
import SupplierService from "@renderer/supplier/service/supplier_service";
import CustomerService from "@renderer/customer/service/customer_service";
import { useRouteContext } from "@renderer/router";
import UnitLocalService from "@renderer/product/service/unit_local_service";

export async function firebaseCollectionRemove(collectionName: string, subCollectionName?: string) {
  const batch = firebaseFirestore.batch();
  const collectionRef = firebaseFirestore.collection(collectionName);
  const snapshots = await collectionRef.get();

  if (subCollectionName) {
    await Promise.all(
      snapshots.docs.map(async (docSnapshot) => {
        const batch2 = firebaseFirestore.batch();

        const innerCollectionRef = firebaseFirestore
          .collection(collectionName)
          .doc(docSnapshot.id)
          .collection(subCollectionName);
        const innerDocs = await innerCollectionRef.get();

        innerDocs.docs.forEach((innerDoc) => {
          batch2.delete(innerDoc.ref);
        });

        await batch2.commit();
        batch.delete(docSnapshot.ref);
      })
    );
  } else {
    snapshots.docs.forEach((docSnapshot) => {
      batch.delete(docSnapshot.ref);
    });
  }

  await batch.commit();
}

export function ClearDataPage() {
  const [removing, setRemoving] = useState(false);
  const [title, setTitle] = useState<string | null>(null);
  const { push } = useRouteContext();

  return (
    <div className="p-5 overflow-x-hidden">
      <BreadcrumbContext
        route={[
          { name: "Light POS", route: "/" },
          { name: "Setting", route: "/settings" },
          { name: "System Setting", route: "/settings/system-setting" },
          { name: "Clear Data", route: "/settings/system-setting/clear-data" }
        ]}
      />
      <p className="text-lg w-full">{title ?? "Clear Data"}</p>
      {removing && <LoadingWidget />}
      {!removing && (
        <div className="w-full max-w-[400px] mt-2 flex flex-col">
          <PasswordValidator
            title="Delete Orders"
            description="Are you sure to delete orders ?"
            disableValidation={offlineMode}
            onValidated={async () => {
              push("/settings/system-setting/clear-data/clear-order-data");
            }}
          >
            <div className="h-[40px] flex items-center gap-3 justify-between cursor-pointer hover:text-destructive">
              <p className="text-sm">Clear Order Data</p>
              <ClipboardList className="size-5" />
            </div>
          </PasswordValidator>
          <PasswordValidator
            title="Clear All Items"
            description="Are you sure to delete all items ?"
            disableValidation={offlineMode}
            onValidated={async () => {
              setRemoving(true);
              setTitle("Removing Items...");
              await ItemService.clearItems();
              setTitle(null);
              setRemoving(false);
              toast({ title: "Successfully Cleared Items" });
            }}
          >
            <div className="h-[40px] flex items-center gap-3 justify-between cursor-pointer hover:text-destructive">
              <p className="text-sm">Clear All Items</p>
              <LayoutGrid className="size-5" />
            </div>
          </PasswordValidator>
          <PasswordValidator
            title="Clear All Categories"
            description="Are you sure to delete all categories ?"
            disableValidation={offlineMode}
            onValidated={async () => {
              setRemoving(true);
              setTitle("Removing Categories...");
              await CategoryService.clearCategory();
              setTitle(null);
              setRemoving(false);
              toast({ title: "Successfully Cleared Categories" });
            }}
          >
            <div className="h-[40px] flex items-center gap-3 justify-between cursor-pointer hover:text-destructive">
              <p className="text-sm">Clear All Categories</p>
              <SquareStack className="size-5" />
            </div>
          </PasswordValidator>
          <PasswordValidator
            title="Clear All Units"
            description="Are you sure to delete all units ?"
            disableValidation={offlineMode}
            onValidated={async () => {
              setRemoving(true);
              setTitle("Removing Units...");
              if (offlineMode) {
                await new UnitLocalService().clearUnit();
              } else {
                await firebaseFirestore.collection("order_meta").doc("unit_convertion").delete();
              }

              setTitle(null);
              setRemoving(false);
              toast({ title: "Successfully Cleared Units" });
            }}
          >
            <div className="h-[40px] flex items-center gap-3 justify-between cursor-pointer hover:text-destructive">
              <p className="text-sm">Clear All Units</p>
              <SendToBack className="size-5" />
            </div>
          </PasswordValidator>
          <PasswordValidator
            title="Clear All Credit Books"
            description="Are you sure to delete all books ?"
            disableValidation={offlineMode}
            onValidated={async () => {
              setRemoving(true);
              setTitle("Removing Credit Books...");
              await CreditbookService.clearBooks();
              setTitle(null);
              setRemoving(false);
              toast({ title: "Successfully Cleared Credit Books" });
            }}
          >
            <div className="h-[40px] flex items-center gap-3 justify-between cursor-pointer hover:text-destructive">
              <p className="text-sm">Clear All Credit Books</p>
              <LibraryBig className="size-5" />
            </div>
          </PasswordValidator>
          <PasswordValidator
            title="Clear All Daily Cash"
            description="Are you sure to delete all daily cash ?"
            disableValidation={offlineMode}
            onValidated={async () => {
              setRemoving(true);
              setTitle("Removing Daily Cash...");
              await CashflowService.clearCashflow();
              setTitle(null);
              setRemoving(false);
              toast({ title: "Successfully Cleared Daily Cash" });
            }}
          >
            <div className="h-[40px] flex items-center gap-3 justify-between cursor-pointer hover:text-destructive">
              <p className="text-sm">Clear All Daily Cash</p>
              <Wallet className="size-5" />
            </div>
          </PasswordValidator>
          <PasswordValidator
            title="Clear All Suppliers"
            description="Are you sure to delete all suppliers ?"
            disableValidation={offlineMode}
            onValidated={async () => {
              setRemoving(true);
              setTitle("Removing Suppliers...");
              await SupplierService.clearSupplier();
              setTitle(null);
              setRemoving(false);
              toast({ title: "Successfully Cleared Suppliers" });
            }}
          >
            <div className="h-[40px] flex items-center gap-3 justify-between cursor-pointer hover:text-destructive">
              <p className="text-sm">Clear All Suppliers</p>
              <Contact className="size-5" />
            </div>
          </PasswordValidator>
          <PasswordValidator
            title="Clear All Customers"
            description="Are you sure to delete all customers ?"
            disableValidation={offlineMode}
            onValidated={async () => {
              setRemoving(true);
              setTitle("Removing Customers...");
              await CustomerService.clearCustomer();
              setTitle(null);
              setRemoving(false);
              toast({ title: "Successfully Cleared Customers" });
            }}
          >
            <div className="h-[40px] flex items-center gap-3 justify-between cursor-pointer hover:text-destructive">
              <p className="text-sm">Clear All Customers</p>
              <UserPlus className="size-5" />
            </div>
          </PasswordValidator>
        </div>
      )}
    </div>
  );
}

function PasswordValidator({
  title,
  description,
  onValidated,
  disableValidation = false,
  children
}: {
  title: string;
  description: string;
  onValidated: () => void;
  disableValidation: boolean;
  children?: React.ReactNode;
}) {
  const { currentUser } = useContext(UserContext);
  const [confirmDialogOpen, setConfirmDialog] = useState(false);

  const checkPassword = async (password: string): Promise<boolean> => {
    if (password.trim().length === 0) return false;
    if (!currentUser) {
      toast({ title: "Please Log In Again" });
      return false;
    }

    try {
      setConfirmDialog(false);
      toast({ title: "Validating ...", duration: 1500 });
      const credential = await firebaseAuth.signInWithEmailAndPassword(currentUser.email, password);

      if (credential.user != null) {
        onValidated();
      }
    } catch (error) {
      console.log(error);
      toast({ title: "Unexpected Error Occured" });
      return false;
    }
    return false;
  };
  return (
    <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialog}>
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
          {disableValidation ? (
            <Button onClick={() => onValidated()}>Confirm</Button>
          ) : (
            <ValueInputDialog
              type="password"
              description="Your account password is required to validate your identity"
              initValue=""
              title="Enter Password"
              onSubmit={async (value) => {
                if (value) {
                  await checkPassword(value);
                }
              }}
            >
              <Button>Confirm</Button>
            </ValueInputDialog>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
