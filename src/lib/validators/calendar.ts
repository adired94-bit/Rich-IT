import { z } from "zod";

export const eventStatuses = ["scheduled", "in_progress", "completed", "cancelled"] as const;
export const eventTypes = ["visit", "remote", "task", "meeting", "reminder"] as const;

export const eventFormSchema = z
  .object({
    id: z.string().uuid().optional(),
    clientId: z.string().uuid().optional().nullable(),
    title: z.string().trim().min(1, "required"),
    description: z.string().trim().optional().or(z.literal("")),
    location: z.string().trim().optional().or(z.literal("")),
    startTime: z.string().min(1),
    endTime: z.string().min(1),
    allDay: z.boolean().default(false),
    status: z.enum(eventStatuses).default("scheduled"),
    type: z.enum(eventTypes).default("visit"),
  })
  .refine((d) => new Date(d.endTime).getTime() >= new Date(d.startTime).getTime(), {
    message: "end before start",
    path: ["endTime"],
  });

export type EventFormValues = z.infer<typeof eventFormSchema>;
