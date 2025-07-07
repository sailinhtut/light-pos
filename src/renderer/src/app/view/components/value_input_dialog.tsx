import { Button } from "@renderer/assets/shadcn/components/ui/button";
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage
} from "@renderer/assets/shadcn/components/ui/form";
import { Input } from "@renderer/assets/shadcn/components/ui/input";
import { useState } from "react";
import { FieldValues, useForm } from "react-hook-form";

export function ValueInputDialog({
  onSubmit,
  title = "Input",
  initValue = "",
  description,
  actionTitle = "Submit",
  type = "text",

  children
}: {
  onSubmit?: (value: any) => void;
  title?: string;
  initValue?: any;
  description?: string;
  actionTitle?: string;
  type?: any;
  dialogOpen?: boolean;
  onOpenChanged?: (boolean) => void;
  children?: React.ReactNode;
}) {
  const inputForm = useForm({
    defaultValues: {
      value: initValue
    }
  });
  const [open, setOpen] = useState(false);

  const submit = (input: FieldValues) => {
    const value = input.value;
    setOpen(false);
    onSubmit?.(value);
  };
  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        setOpen(value);
      }}
    >
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <Form {...inputForm}>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              event.stopPropagation();
              return inputForm.handleSubmit(submit)();
            }}
          >
            <FormField
              name="value"
              rules={{ required: "Required" }}
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input {...field} type={type}></Input>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            ></FormField>
          </form>
        </Form>
        <DialogFooter>
          <DialogClose>
            <Button variant={"outline"}>Close</Button>
          </DialogClose>
          <Button onClick={() => inputForm.handleSubmit(submit)()}>{actionTitle}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
