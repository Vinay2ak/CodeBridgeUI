import { z } from 'zod';

const GITHUB_REPO_REGEX = /^https:\/\/github\.com\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+(?:\.git|\/)?$/;

export const postProjectSchema = z.object({
  title: z
    .string({ required_error: 'Title is required' })
    .transform((val) => val.trim())
    .pipe(
      z
        .string()
        .min(10, 'Title must be at least 10 characters')
        .max(80, 'Title must be at most 80 characters')
    ),
  description: z
    .string({ required_error: 'Description is required' })
    .transform((val) => val.trim())
    .pipe(
      z
        .string()
        .min(40, 'Description must be at least 40 characters')
        .max(1500, 'Description must be at most 1500 characters')
    ),
  blockerType: z
    .string({ required_error: 'Problem type is required' })
    .min(1, 'Problem type is required'),
  stacks: z
    .array(z.string(), { required_error: 'At least one tech stack is required' })
    .min(1, 'Pick at least 1 workspace template')
    .max(4, 'Pick at most 4 workspace templates'),
  specialties: z
    .array(z.string())
    .max(3, 'Pick at most 3 specialties')
    .default([]),
  skills: z
    .array(z.string())
    .max(8, 'At most 8 skills allowed')
    .superRefine((skills, ctx) => {
      const seen = new Set<string>();
      for (let i = 0; i < skills.length; i++) {
        const trimmed = skills[i].trim();
        if (trimmed.length < 2 || trimmed.length > 24) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Each skill must be between 2 and 24 characters',
            path: [i],
          });
        }
        const lower = trimmed.toLowerCase();
        if (seen.has(lower)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Duplicate skill "${trimmed}"`,
            path: [i],
          });
        }
        seen.add(lower);
      }
    })
    .default([]),
  budget: z
    .number({ required_error: 'Budget is required', invalid_type_error: 'Budget must be a number' })
    .int('Budget must be an integer')
    .min(500, 'Minimum budget is ₹500')
    .max(100000, 'Maximum budget is ₹1,00,000'),
  urgency: z
    .string({ required_error: 'Urgency is required' })
    .min(1, 'Urgency is required'),
  repoUrl: z
    .string({ required_error: 'GitHub repository URL is required' })
    .transform((val) => (typeof val === 'string' ? val.trim() : ''))
    .pipe(
      z
        .string()
        .min(1, 'GitHub repository URL is required')
        .superRefine((val, ctx) => {
          if (val.includes('@') || !GITHUB_REPO_REGEX.test(val)) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message:
                'Must be a valid GitHub repository URL (e.g., https://github.com/owner/repo)',
            });
          }
        })
    ),
  verificationMode: z
    .string({ required_error: 'Verification mode is required' })
    .min(1, 'Verification mode is required'),
});

export type PostProjectFormData = z.infer<typeof postProjectSchema>;
export type PostProjectFormValues = PostProjectFormData;
