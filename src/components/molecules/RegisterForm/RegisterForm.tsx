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
                    Create account
                </h1>
                <form onSubmit={handleSubmit(submit)}>
                    <div className="flex flex-col md:flex-row gap-4 mb-4">
                        <LabeledInput
                            className="md:w-1/2"
                            label="First name"
                            placeholder="Your first name"
                            error={errors.firstName as FieldError}
                            {...register("firstName")}
                        />
                        <LabeledInput
                            className="md:w-1/2"
                            label="Last name"
                            placeholder="Your last name"
                            error={errors.lastName as FieldError}
                            {...register("lastName")}
                        />
                    </div>

                    <div className="flex flex-col md:flex-row gap-4 mb-4">
                        <LabeledInput
                            className="md:w-1/2"
                            label="E-mail"
                            placeholder="Your e-mail address"
                            error={errors.email as FieldError}
                            {...register("email")}
                        />
                        <LabeledInput
                            className="md:w-1/2"
                            label="Phone"
                            placeholder="Your phone number"
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
                                Gender (optional)
                            </label>
                            <select
                                id="gender"
                                {...register("gender")}
                                className="border rounded-sm px-3 py-2 text-sm w-full"
                                defaultValue=""
                            >
                                <option value="">Select your gender</option>
                                <option value="female">Female</option>
                                <option value="male">Male</option>
                                <option value="other">Other</option>
                                <option value="prefer_not_to_say">Prefer not to say</option>
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
                            label="Password"
                            placeholder="Your password"
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
                        Create account
                    </Button>
                </form>
            </Container>
            <Container className="border max-w-xl mx-auto mt-8 p-4">
                <h1 className="heading-md text-primary uppercase mb-8">
                    Already have an account?
                </h1>
                <p className="text-center label-md">
                    <Link href="/user">
                        <Button
                            variant="tonal"
                            className="w-full flex justify-center mt-8 uppercase"
                        >
                            Log in
                        </Button>
                    </Link>
                </p>
            </Container>
        </main>
    )
}
