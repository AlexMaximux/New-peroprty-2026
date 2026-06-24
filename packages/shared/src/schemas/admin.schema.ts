import { z } from 'zod';

export const approveAgencySchema = z.object({});

export const rejectAgencySchema = z.object({
  reason: z.string().min(1, 'Rejection reason is required').max(1000),
});

export const moderateListingSchema = z.object({
  action: z.enum(['UNPUBLISH', 'REINSTATE']),
  reason: z.string().optional(),
});

export type ApproveAgencyDto = z.infer<typeof approveAgencySchema>;
export type RejectAgencyDto = z.infer<typeof rejectAgencySchema>;
export type ModerateListingDto = z.infer<typeof moderateListingSchema>;