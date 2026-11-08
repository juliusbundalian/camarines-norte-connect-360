import type {AuthUser} from '../../services/firebase/auth-types';
import type {UserProfile} from './profile-types';
// Fixed release boundary: never recompute this value on app launch or later releases.
export const PROFILE_ONBOARDING_ROLLOUT_AT='2026-11-08T15:03:57.000Z';
export const PROFILE_ONBOARDING_ROLLOUT_MS=Date.parse(PROFILE_ONBOARDING_ROLLOUT_AT);
export function requiresSetup(user:AuthUser,profile:UserProfile|null,rolloutAtMs=PROFILE_ONBOARDING_ROLLOUT_MS):boolean {
 if(profile)return profile.status!=='complete';
 if(user.creationTimeMs==null||!Number.isFinite(user.creationTimeMs))throw new Error('Unable to read account creation time. Please retry.');
 return user.creationTimeMs>=rolloutAtMs;
}
