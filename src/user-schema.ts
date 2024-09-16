import { z } from 'zod';

import { DomainEntitySchema } from './lib/domain-entity-schema';

export const UserSchema = DomainEntitySchema.extend({
  name: z.string(),
  email: z.string().email(),
});

export type User = z.infer<typeof UserSchema>;