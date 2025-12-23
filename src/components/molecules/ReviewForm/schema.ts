import { z } from "zod"

export const reviewSchema = z.object({
  sellerId: z.string(),
  rating: z.number().min(1, "Califica a este vendedor").max(5),
  opinion: z
    .string()
    .max(300, "La opinión debe tener menos de 300 caracteres")
    .optional(),
})

export type ReviewFormData = z.infer<typeof reviewSchema>
