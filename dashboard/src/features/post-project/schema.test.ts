import { describe, it, expect } from 'vitest';
import { postProjectSchema } from './schema';

describe('postProjectSchema validation boundary cases', () => {
  const validBase = {
    title: 'A valid title for project',
    description: 'A sufficiently long description that satisfies the forty character minimum requirement easily.',
    blockerType: 'HARD_BUG',
    stacks: ['PYTHON_FASTAPI'],
    specialties: ['TESTING'],
    skills: ['Python', 'FastAPI'],
    budget: 5000,
    urgency: 'ASAP',
    repoUrl: 'https://github.com/codebridge/core',
    verificationMode: 'AUTO_TESTS_AND_REVIEW',
  };

  it('1. rejects title with 9 characters (after trim)', () => {
    const res = postProjectSchema.safeParse({ ...validBase, title: '  123456789  ' });
    expect(res.success).toBe(false);
  });

  it('2. accepts title with exactly 10 characters', () => {
    const res = postProjectSchema.safeParse({ ...validBase, title: '1234567890' });
    expect(res.success).toBe(true);
  });

  it('3. accepts title with exactly 80 characters', () => {
    const res = postProjectSchema.safeParse({ ...validBase, title: 'a'.repeat(80) });
    expect(res.success).toBe(true);
  });

  it('4. rejects title with 81 characters', () => {
    const res = postProjectSchema.safeParse({ ...validBase, title: 'a'.repeat(81) });
    expect(res.success).toBe(false);
  });

  it('5. rejects description with 39 characters', () => {
    const res = postProjectSchema.safeParse({ ...validBase, description: 'a'.repeat(39) });
    expect(res.success).toBe(false);
  });

  it('6. accepts description with exactly 40 characters', () => {
    const res = postProjectSchema.safeParse({ ...validBase, description: 'a'.repeat(40) });
    expect(res.success).toBe(true);
  });

  it('7. accepts description with exactly 1500 characters', () => {
    const res = postProjectSchema.safeParse({ ...validBase, description: 'a'.repeat(1500) });
    expect(res.success).toBe(true);
  });

  it('8. rejects description with 1501 characters', () => {
    const res = postProjectSchema.safeParse({ ...validBase, description: 'a'.repeat(1501) });
    expect(res.success).toBe(false);
  });

  it('9. rejects budget of 499', () => {
    const res = postProjectSchema.safeParse({ ...validBase, budget: 499 });
    expect(res.success).toBe(false);
  });

  it('10. accepts budget of 500', () => {
    const res = postProjectSchema.safeParse({ ...validBase, budget: 500 });
    expect(res.success).toBe(true);
  });

  it('11. accepts budget of 100000', () => {
    const res = postProjectSchema.safeParse({ ...validBase, budget: 100000 });
    expect(res.success).toBe(true);
  });

  it('12. rejects budget of 100001', () => {
    const res = postProjectSchema.safeParse({ ...validBase, budget: 100001 });
    expect(res.success).toBe(false);
  });

  it('13. rejects 0 stacks', () => {
    const res = postProjectSchema.safeParse({ ...validBase, stacks: [] });
    expect(res.success).toBe(false);
  });

  it('14. accepts 1 stack and 4 stacks', () => {
    const res1 = postProjectSchema.safeParse({ ...validBase, stacks: ['PYTHON_FASTAPI'] });
    expect(res1.success).toBe(true);
    const res4 = postProjectSchema.safeParse({
      ...validBase,
      stacks: ['PYTHON_FASTAPI', 'REACT_TS', 'POSTGRES_SQL', 'NODE'],
    });
    expect(res4.success).toBe(true);
  });

  it('15. rejects 5 stacks', () => {
    const res = postProjectSchema.safeParse({
      ...validBase,
      stacks: ['PYTHON_FASTAPI', 'REACT_TS', 'POSTGRES_SQL', 'NODE', 'DOCKER_WORKFLOWS'],
    });
    expect(res.success).toBe(false);
  });

  it('16. handles repoUrl variants and rejects user-info with @', () => {
    // Valid variants
    expect(postProjectSchema.safeParse({ ...validBase, repoUrl: 'https://github.com/foo/bar' }).success).toBe(true);
    expect(postProjectSchema.safeParse({ ...validBase, repoUrl: 'https://github.com/foo/bar/' }).success).toBe(true);
    expect(postProjectSchema.safeParse({ ...validBase, repoUrl: 'https://github.com/foo/bar.git' }).success).toBe(true);

    // Invalid variants (required & must be valid github repo)
    expect(postProjectSchema.safeParse({ ...validBase, repoUrl: '' }).success).toBe(false);
    expect(postProjectSchema.safeParse({ ...validBase, repoUrl: undefined }).success).toBe(false);
    expect(postProjectSchema.safeParse({ ...validBase, repoUrl: 'https://user:pass@github.com/foo/bar' }).success).toBe(false);
    expect(postProjectSchema.safeParse({ ...validBase, repoUrl: 'http://github.com/foo/bar' }).success).toBe(false);
    expect(postProjectSchema.safeParse({ ...validBase, repoUrl: 'https://gitlab.com/foo/bar' }).success).toBe(false);
  });

  it('17. rejects duplicate skills case-insensitively', () => {
    const res = postProjectSchema.safeParse({
      ...validBase,
      skills: ['React', 'TypeScript', 'react'],
    });
    expect(res.success).toBe(false);
  });
});
