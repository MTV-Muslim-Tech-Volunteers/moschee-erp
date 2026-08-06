import { z } from "zod";

export const productSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  category: z.enum(["Hauptspeise", "Getränk"], "Category is required"),  
  description: z.string().min(10, "Description must be at least 10 characters"),
  isFeatured: z.boolean().default(false),
});

export type ProductInput = z.infer<typeof productSchema>;

export type ProductErrors = z.core.$ZodFlattenedError<ProductInput>["fieldErrors"]