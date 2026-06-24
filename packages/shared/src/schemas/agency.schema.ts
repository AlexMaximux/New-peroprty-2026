import { z } from 'zod';

export const createAgencyProfileSchema = z.object({
  companyName: z.string().min(1, 'Company name is required').max(200),
  companyNumber: z.string().optional(),
  address: z.string().min(1, 'Address is required'),
  contactName: z.string().min(1, 'Contact name is required').max(100),
  phone: z.string().min(1, 'Phone is required'),
  website: z.string().url('Invalid URL').optional().or(z.literal('')),
});

export const requestUploadUrlSchema = z.object({
  type: z.string().min(1, 'Document type is required'),
  originalName: z.string().min(1, 'File name is required'),
  contentType: z.string().min(1, 'Content type is required'),
});

export const verifyDocumentSchema = z.object({
  fileKey: z.string().min(1),
  originalName: z.string().min(1),
  type: z.string().min(1),
});

export type CreateAgencyProfileDto = z.infer<typeof createAgencyProfileSchema>;
export type RequestUploadUrlDto = z.infer<typeof requestUploadUrlSchema>;
export type VerifyDocumentDto = z.infer<typeof verifyDocumentSchema>;