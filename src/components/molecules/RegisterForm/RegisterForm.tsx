"use client"
import {
    FieldError,
    FieldValues,
    FormProvider,
    useForm,
    useFormContext,
} from "react-hook-form"
import { Button } from "@/components/atoms"
import { zodResolver } from "@hookform/resolvers/zod"
import { LabeledInput } from "@/components/cells"
import { registerFormSchema, RegisterFormData } from "./schema"
import { signup } from "@/lib/data/customer"
import { useState } from "react"
import { Container } from "@medusajs/ui"
import Link from "next/link"
import { PasswordValidator } from "@/components/cells/PasswordValidator/PasswordValidator"

export const RegisterForm = () => {
    const methods = useForm<RegisterFormData>({
        resolver: zodResolver(registerFormSchema),
        defaultValues: {
            firstName: "",
            lastName: "",
            phone: "",
            email: "",
            password: "",
            // gender is optional → can be omitted, will default to undefined
        },
    })

    return (
        <FormProvider {...methods}>
            <Form />
        </FormProvider>
    )
}

const Form = () => {
    const [passwordError, setPasswordError] = useState({
        isValid: false,
        lower: false,
        upper: false,
        "8chars": false,
        symbolOrDigit: false,
    })
    const [error, setError] = useState<any>()
    const {
        handleSubmit,
        register,
        watch,
        formState: { errors, isSubmitting },
    } = useFormContext()

    const submit = async (data: FieldValues) => {
        const formData = new FormData()
        formData.append("email", data.email)
        formData.append("password", data.password)
        formData.append("first_name", data.firstName)
        formData.append("last_name", data.lastName)
        formData.append("phone", data.phone)

        // 👇 NEW: append gender so backend can push it into customer.metadata.gender
        if (data.gender) {
            formData.append("gender", data.gender)
        }

        const res = passwordError.isValid && (await signup(formData))

        if (res && !res?.id) setError(res)
    }

    return (
        <main className="container">
            <Container className="border max-w-xl mx-auto mt-8 p-4">
                <h1 className="heading-md text-primary uppercase mb-8">
                    Crear cuenta
                </h1>
                <form onSubmit={handleSubmit(submit)}>
                    <div className="flex flex-col md:flex-row gap-4 mb-4">
                        <LabeledInput
                            className="md:w-1/2"
                            label="Nombre"
                            placeholder="Tu nombre"
                            error={errors.firstName as FieldError}
                            {...register("firstName")}
                        />
                        <LabeledInput
                            className="md:w-1/2"
                            label="Apellido"
                            placeholder="Tu apellido"
                            error={errors.lastName as FieldError}
                            {...register("lastName")}
                        />
                    </div>

                    <div className="flex flex-col md:flex-row gap-4 mb-4">
                        <LabeledInput
                            className="md:w-1/2"
                            label="E-mail"
                            placeholder="Tu correo electrónico"
                            error={errors.email as FieldError}
                            {...register("email")}
                        />
                        <LabeledInput
                            className="md:w-1/2"
                            label="Teléfono"
                            placeholder="Tu número de teléfono"
                            error={errors.phone as FieldError}
                            {...register("phone")}
                        />
                    </div>

                    {/* 👇 NEW: Gender select */}
                    <div className="flex flex-col md:flex-row gap-4 mb-4">
                        <div className="md:w-1/2">
                            <label
                                htmlFor="gender"
                                className="block text-sm font-medium mb-1"
                            >
                                Género (opcional)
                            </label>
                            <select
                                id="gender"
                                {...register("gender")}
                                className="border rounded-sm px-3 py-2 text-sm w-full"
                                defaultValue=""
                            >
                                <option value="">Selecciona tu género</option>
                                <option value="female">Femenino</option>
                                <option value="male">Masculino</option>
                                <option value="other">Otro</option>
                                <option value="prefer_not_to_say">Prefiero no decirlo</option>
                            </select>
                            {errors.gender && (
                                <p className="label-sm text-negative mt-1">
                                    {(errors.gender as FieldError).message as string}
                                </p>
                            )}
                        </div>
                    </div>

                    <div>
                        <LabeledInput
                            className="mb-4"
                            label="Contraseña"
                            placeholder="Tu contraseña"
                            type="password"
                            error={errors.password as FieldError}
                            {...register("password")}
                        />
                        <PasswordValidator
                            password={watch("password")}
                            setError={setPasswordError}
                        />
                    </div>

                    {error && <p className="label-md text-negative">{error}</p>}
                    <Button
                        className="w-full flex justify-center mt-8 uppercase"
                        disabled={isSubmitting}
                        loading={isSubmitting}
                    >
                        Crear cuenta
                    </Button>
                </form>
            </Container>
            <Container className="border max-w-xl mx-auto mt-8 p-4">
                <h1 className="heading-md text-primary uppercase mb-8">
                    ¿Ya tienes cuenta?
                </h1>
                <p className="text-center label-md">
                    <Link href="/user">
                        <Button
                            variant="tonal"
                            className="w-full flex justify-center mt-8 uppercase"
                        >
                            Iniciar sesión
                        </Button>
                    </Link>
                </p>
            </Container>
        </main>
    )
}
