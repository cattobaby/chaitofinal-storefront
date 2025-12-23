"use client"

import { Button, Card } from "@/components/atoms"
import { LabeledInput } from "@/components/cells"
import { zodResolver } from "@hookform/resolvers/zod"
import { CheckCircle } from "@medusajs/icons"
import {
  FieldError,
  FieldValues,
  FormProvider,
  useForm,
  useFormContext,
  UseFormReturn,
} from "react-hook-form"
import { ProfilePasswordFormData, profilePasswordSchema } from "./schema"
import { useEffect, useState } from "react"
import { updateCustomerPassword } from "@/lib/data/customer"
import { Heading, toast } from "@medusajs/ui"
import LocalizedClientLink from "../LocalizedLink/LocalizedLink"
import { PasswordValidator } from "@/components/cells/PasswordValidator/PasswordValidator"

export const ProfilePasswordForm = ({ token }: { token?: string }) => {
  const form = useForm<ProfilePasswordFormData>({
    resolver: zodResolver(profilePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  })

  return (
    <FormProvider {...form}>
      <Form form={form} token={token} />
    </FormProvider>
  )
}

const Form = ({
  form,
  token,
}: {
  form: UseFormReturn<ProfilePasswordFormData>
  token?: string
}) => {
  const [success, setSuccess] = useState(false)
  const [confirmPasswordError, setConfirmPasswordError] = useState<
    FieldError | undefined
  >(undefined)
  const [newPasswordError, setNewPasswordError] = useState({
    isValid: false,
    lower: false,
    upper: false,
    "8chars": false,
    symbolOrDigit: false,
  })

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useFormContext()

  const updatePassword = async (data: FieldValues) => {
    if (form.getValues("confirmPassword") !== form.getValues("newPassword")) {
      setConfirmPasswordError({
        message: "La confirmación no coincide con la nueva contraseña",
        type: "custom",
      } as FieldError)
      return
    }

    setConfirmPasswordError(undefined)

    if (newPasswordError.isValid) {
      try {
        const res = await updateCustomerPassword(data.newPassword, token!)
        if (res.success) {
          toast.success("Contraseña actualizada")
          setSuccess(true)
        } else {
          toast.error(res.error || "Algo salió mal")
        }
      } catch (err) {
        console.log(err)
        return
      }
    }
  }

  return success ? (
    <div className="p-4">
      <Heading
        level="h1"
        className="uppercase heading-md text-primary text-center"
      >
        Contraseña actualizada
      </Heading>
      <p className="text-center my-8">
        Tu contraseña se actualizó. Ahora puedes iniciar sesión con tu nueva contraseña.
      </p>
      <LocalizedClientLink href="/user">
        <Button
          className="uppercase py-3 px-6 !font-semibold w-full"
          size="large"
        >
          Ir a mi cuenta
        </Button>
      </LocalizedClientLink>
    </div>
  ) : (
    <form
      className="flex flex-col gap-4 px-4"
      onSubmit={handleSubmit(updatePassword)}
    >
      <LabeledInput
        label="Contraseña actual"
        type="password"
        error={errors.currentPassword as FieldError}
        {...register("currentPassword")}
      />
      <LabeledInput
        label="Nueva contraseña"
        type="password"
        error={errors.newPassword as FieldError}
        {...register("newPassword")}
      />
      <PasswordValidator
        password={form.watch("newPassword")}
        setError={setNewPasswordError}
      />
      <LabeledInput
        label="Confirmar nueva contraseña"
        type="password"
        error={confirmPasswordError as FieldError}
        {...register("confirmPassword")}
      />
      <Button className="w-full my-4">Cambiar contraseña</Button>
    </form>
  )
}
