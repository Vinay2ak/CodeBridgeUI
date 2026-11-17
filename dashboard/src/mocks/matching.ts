import type { ProjectDetail } from '../services/project/types';
import type { FreelancerSummary, Match, MatchBreakdown } from '../services/talent/types';
import { sizeFromBudget } from '../features/post-project/size';
import { STACKS, SPECIALTIES, DEFAULT_SPECIALTIES_BY_BLOCKER } from '../features/post-project/options';

const STACK_MAP = new Map(STACKS.map((s) => [s.value, s.label]));
const SPECIALTY_MAP = new Map(SPECIALTIES.map((s) => [s.value, s.label]));

export function scoreFreelancer(project: ProjectDetail, freelancer: FreelancerSummary): Match {
  const warnings: string[] = [];
  const reasons: string[] = [];

  // 1. Stack coverage (max 30)
  const projectStacks = project.stacks ?? [];
  const supportedStacksSet = new Set(freelancer.supportedStacks ?? []);
  const matchingStacks = projectStacks.filter((s) => supportedStacksSet.has(s));
  const stackCoverage = projectStacks.length > 0 ? matchingStacks.length / projectStacks.length : 1;
  const stackPoints = Math.round(30 * stackCoverage);

  if (matchingStacks.length > 0) {
    const labels = matchingStacks.map((s) => STACK_MAP.get(s) || s);
    if (matchingStacks.length === projectStacks.length && projectStacks.length > 1) {
      reasons.push(`Matches all ${projectStacks.length} stacks: ${labels.join(', ')}`);
    } else {
      reasons.push(`Matches ${labels.join(', ')}`);
    }
  }

  // 2. Specialty coverage (max 20)
  let wantedSpecialties = project.specialties ?? [];
  if (wantedSpecialties.length === 0) {
    wantedSpecialties = DEFAULT_SPECIALTIES_BY_BLOCKER[project.blockerType] || [];
  }
  const freelancerSpecialtiesSet = new Set(freelancer.debuggingSpecialties ?? []);
  const matchingSpecialties = wantedSpecialties.filter((s) => freelancerSpecialtiesSet.has(s));
  const specialtyCoverage = wantedSpecialties.length > 0 ? matchingSpecialties.length / wantedSpecialties.length : 1;
  const specialtyPoints = Math.round(20 * specialtyCoverage);

  if (matchingSpecialties.length > 0) {
    const firstSpec = SPECIALTY_MAP.get(matchingSpecialties[0]) || matchingSpecialties[0];
    reasons.push(`Specializes in ${firstSpec}`);
  }

  // 3. Skills coverage (max 15)
  const projectSkills = project.skills ?? [];
  const freelancerSkills = freelancer.skills ?? [];
  let skillsPoints = 0;
  if (projectSkills.length > 0) {
    const lowerFreelancerSkills = new Set(freelancerSkills.map((s) => s.toLowerCase()));
    const matchingSkills = projectSkills.filter((s) => lowerFreelancerSkills.has(s.toLowerCase()));
    const skillsCoverage = matchingSkills.length / projectSkills.length;
    skillsPoints = Math.round(15 * skillsCoverage);
    if (matchingSkills.length > 0 && reasons.length < 5) {
      reasons.push(`Knows ${matchingSkills.slice(0, 3).join(', ')}`);
    }
  } else {
    skillsPoints = Math.round(Math.min(1, freelancerSkills.length / 3) * 15);
  }

  // 4. Budget match (max 10)
  let budgetPoints = 10;
  if (project.budget >= freelancer.minBudget) {
    budgetPoints = 10;
    reasons.push('Fits your budget');
  } else {
    const diff = freelancer.minBudget - project.budget;
    const ratio = Math.max(0, 1 - diff / freelancer.minBudget);
    budgetPoints = Math.round(10 * 0.6 * ratio);
    warnings.push(
      `Minimum budget ₹${freelancer.minBudget.toLocaleString('en-IN')} is ₹${diff.toLocaleString('en-IN')} above your budget`
    );
  }

  // 5. Availability (max 10)
  let availMultiplier = 1.0;
  const urgency = project.urgency ?? 'THIS_WEEK';
  const avail = freelancer.availability ?? 'IMMEDIATE';

  if (urgency === 'ASAP') {
    if (avail === 'IMMEDIATE') availMultiplier = 1.0;
    else if (avail === 'HOURS_10_20') availMultiplier = 0.5;
    else if (avail === 'WEEKEND_SPRINTS') availMultiplier = 0.2;
    else availMultiplier = 0.0;
  } else if (urgency === 'THIS_WEEK') {
    if (avail === 'IMMEDIATE') availMultiplier = 1.0;
    else if (avail === 'HOURS_10_20') availMultiplier = 0.8;
    else if (avail === 'WEEKEND_SPRINTS') availMultiplier = 0.5;
    else availMultiplier = 0.1;
  } else {
    // FLEXIBLE
    if (avail === 'IMMEDIATE') availMultiplier = 1.0;
    else if (avail === 'HOURS_10_20') availMultiplier = 1.0;
    else if (avail === 'WEEKEND_SPRINTS') availMultiplier = 0.8;
    else availMultiplier = 0.4;
  }

  const availabilityPoints = Math.round(10 * availMultiplier);
  if (avail === 'IMMEDIATE' && availMultiplier >= 0.8) {
    reasons.push('Available now');
  }

  if (availMultiplier < 0.5) {
    if (avail === 'BOOKED') {
      warnings.push('Currently booked');
    } else if (avail === 'WEEKEND_SPRINTS') {
      warnings.push('Available weekend sprints only');
    } else if (avail === 'HOURS_10_20') {
      warnings.push('Available 10-20 hrs/week');
    }
  }

  // 6. Experience vs Project Size (max 10)
  const size = project.size || sizeFromBudget(project.budget).value;
  const exp = freelancer.experience ?? 'MID_LEVEL';
  let expMultiplier = 1.0;

  if (size === 'MICRO_BUG') {
    expMultiplier = 1.0;
  } else if (size === 'FEATURE_INTEGRATION') {
    if (exp === 'STUDENT_EMERGING') expMultiplier = 0.5;
    else if (exp === 'JUNIOR') expMultiplier = 0.9;
    else expMultiplier = 1.0;
  } else {
    // COMPLEX_MODULE
    if (exp === 'STUDENT_EMERGING') expMultiplier = 0.2;
    else if (exp === 'JUNIOR') expMultiplier = 0.5;
    else if (exp === 'MID_LEVEL') expMultiplier = 0.9;
    else expMultiplier = 1.0;
  }

  const experiencePoints = Math.round(10 * expMultiplier);
  if (expMultiplier < 0.6) {
    warnings.push('Work size might exceed current experience level');
  }

  // 7. Trust (max 5)
  const ghVerifiedScore = freelancer.githubVerified ? 1 : 0;
  const workCountScore = Math.min(1, (freelancer.verifiedWorkCount ?? 0) / 5);
  const ratingScore = freelancer.rating ? freelancer.rating / 5 : 0;
  const trustMultiplier = 0.4 * ghVerifiedScore + 0.4 * workCountScore + 0.2 * ratingScore;
  const trustPoints = Math.round(5 * trustMultiplier);

  if (freelancer.githubVerified) {
    reasons.push('GitHub verified');
  }
  if (freelancer.verifiedWorkCount > 0) {
    reasons.push(`${freelancer.verifiedWorkCount} verified CodeBridge fixes`);
  }
  if (freelancer.rating === null || freelancer.rating === undefined) {
    warnings.push('No ratings yet');
  } else if (freelancer.rating >= 4.8 && reasons.length < 5) {
    reasons.push(`${freelancer.rating} star rating`);
  }

  // Final score & breakdown
  const rawSum =
    stackPoints +
    specialtyPoints +
    skillsPoints +
    budgetPoints +
    availabilityPoints +
    experiencePoints +
    trustPoints;
  const score = Math.min(100, Math.max(0, rawSum));

  let label: 'excellent' | 'strong' | 'good' | 'partial';
  if (score >= 80) label = 'excellent';
  else if (score >= 65) label = 'strong';
  else if (score >= 50) label = 'good';
  else label = 'partial';

  const breakdown: MatchBreakdown = {
    stack: { points: stackPoints, max: 30 },
    specialty: { points: specialtyPoints, max: 20 },
    skills: { points: skillsPoints, max: 15 },
    budget: { points: budgetPoints, max: 10 },
    availability: { points: availabilityPoints, max: 10 },
    experience: { points: experiencePoints, max: 10 },
    trust: { points: trustPoints, max: 5 },
  };

  return {
    freelancer,
    score,
    label,
    breakdown,
    reasons: reasons.slice(0, 5),
    warnings,
    shortlisted: false,
  };
}

export function rankFreelancers(
  project: ProjectDetail,
  freelancers: FreelancerSummary[],
  shortlistedIds?: Set<string>
): Match[] {
  const projectStacks = project.stacks ?? [];
  const scoredAll = freelancers.map((f) => {
    const match = scoreFreelancer(project, f);
    if (shortlistedIds && shortlistedIds.has(f.id)) {
      match.shortlisted = true;
    }
    return match;
  });

  // Filter those with stack coverage > 0
  let eligible = scoredAll.filter((m) => {
    if (projectStacks.length === 0) return true;
    const supported = new Set(m.freelancer.supportedStacks ?? []);
    return projectStacks.some((s) => supported.has(s));
  });

  // Fallback: if fewer than 3 reach score >= 50, use scoredAll and add warning for 0-coverage
  const qualifying = eligible.filter((m) => m.score >= 50);
  if (qualifying.length < 3) {
    eligible = scoredAll.map((m) => {
      const supported = new Set(m.freelancer.supportedStacks ?? []);
      const hasOverlap = projectStacks.some((s) => supported.has(s));
      if (!hasOverlap && projectStacks.length > 0) {
        if (!m.warnings.includes('No overlap with the stacks you need')) {
          return {
            ...m,
            warnings: ['No overlap with the stacks you need', ...m.warnings],
          };
        }
      }
      return m;
    });
  }

  // Sort: top by score desc, availability multiplier desc, verifiedWorkCount desc, id asc
  const sorted = [...eligible].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (b.breakdown.availability.points !== a.breakdown.availability.points) {
      return b.breakdown.availability.points - a.breakdown.availability.points;
    }
    if ((b.freelancer.verifiedWorkCount ?? 0) !== (a.freelancer.verifiedWorkCount ?? 0)) {
      return (b.freelancer.verifiedWorkCount ?? 0) - (a.freelancer.verifiedWorkCount ?? 0);
    }
    return a.freelancer.id.localeCompare(b.freelancer.id);
  });

  return sorted.slice(0, 10);
}
