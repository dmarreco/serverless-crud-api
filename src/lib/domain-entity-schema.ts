import z from 'zod';

export const DomainEntitySchema = z.object({
  id: z.string().optional(),
  version: z.number().optional(),
});

export type DomainEntity = z.infer<typeof DomainEntitySchema>;
