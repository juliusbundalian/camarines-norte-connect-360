import type {AuthUser} from './auth-types';
import type {AccountProfileService} from './account-profile-types';
import {profileService} from './profile-service';
export function getAccountProfileService(source:AuthUser['source']):AccountProfileService {
  if(source==='native')throw new Error('This session requires the native account adapter.');
  return profileService;
}
